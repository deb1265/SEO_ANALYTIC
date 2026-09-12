
import React, { useState, useCallback, useRef } from 'react';
import './App.css';
import Header from './components/Header';
import ApiSettingsModal from './components/ApiSettingsModal';
import UrlInputSection from './components/UrlInputSection';
import LoadingSection from './components/LoadingSection';
import ResultsSection from './components/ResultsSection';
import ContentRewriterModal from './components/ContentRewriterModal';
import VercelDeployModal from './components/VercelDeployModal';
import Toast from './components/Toast';
import { AnalysisData, ApiSettings, LoadingState, ContentSection } from './types';
import { analyzeWithAI, generateContentReplacements, fetchKeywordSuggestions } from './utils/aiService';
import { fetchPageContent, extractContentFromHTML } from './utils/contentExtractor';
import { auditPage, mergeSuggestions } from './utils/audit';

const SETTINGS_STORAGE_KEY = 'seo_analyzer_settings';

const DEFAULT_API_SETTINGS: ApiSettings = {
  openRouterKey: '',
  dataForSeoLogin: '',
  dataForSeoPassword: '',
  aiModel: 'anthropic/claude-3.5-sonnet',
  vercelToken: ''
};

const buildInitialSettings = (): ApiSettings => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}');
    const aiModel = typeof parsed.aiModel === 'string' && parsed.aiModel.trim() ? parsed.aiModel : DEFAULT_API_SETTINGS.aiModel;
    // Migrate legacy storage: erase all persisted credentials without reading them into state.
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ aiModel }));
    return { ...DEFAULT_API_SETTINGS, aiModel };
  } catch { return { ...DEFAULT_API_SETTINGS }; }
};

function App() {
  const analyzing = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const [apiSettings, setApiSettings] = useState<ApiSettings>(buildInitialSettings);
  const [showApiModal, setShowApiModal] = useState(false);
  const [showRewriterModal, setShowRewriterModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState<ContentSection | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    status: '',
    currentStep: ''
  });
  const [toast, setToast] = useState({ show: false, message: '' });
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);

  const updateLoadingStep = useCallback((progress: number, status: string, currentStep: string) => {
    setLoadingState({ isLoading: true, progress, status, currentStep });
  }, []);

  const resetLoading = useCallback(() => {
    setLoadingState({ isLoading: false, progress: 0, status: '', currentStep: '' });
  }, []);

  const showToast = (message: string) => {
    clearTimeout(toastTimer.current);
    setToast({ show: true, message });
    toastTimer.current = setTimeout(() => setToast({ show: false, message: '' }), 15000);
  };

  const saveApiSettings = (settings: ApiSettings) => {
    setApiSettings(settings);

    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ aiModel: settings.aiModel })); } catch { /* Session settings still work. */ }
    }

    setShowApiModal(false);
    showToast('Settings saved successfully!');
  };

  const handleAnalyze = async (url: string, htmlInput?: string, allowProxies = false, useAI = false) => {
    if (analyzing.current) return;
    analyzing.current = true;
    clearTimeout(toastTimer.current);
    setToast({ show: false, message: '' });
    setAnalysisData(null);
    setKeywordSuggestions([]);
    updateLoadingStep(10, 'Reading page HTML...', 'extract');
    const warnings: string[] = [];
    try {
      const html = htmlInput !== undefined ? htmlInput : await fetchPageContent(url, allowProxies);
      const extractedContent = extractContentFromHTML(html, url);
      updateLoadingStep(50, 'Checking HTML evidence...', 'score');
      let aiAnalysis = auditPage(extractedContent);
      let mode: 'rules' | 'rules+ai' = 'rules';
      let keywords: string[] = [];
      if (useAI && apiSettings.openRouterKey) {
        try {
          const suggestions = await analyzeWithAI(extractedContent, apiSettings.openRouterKey, apiSettings.aiModel);
          aiAnalysis = mergeSuggestions(aiAnalysis, suggestions);
          mode = 'rules+ai';
        } catch {
          warnings.push('AI suggestions were unavailable or invalid. The free HTML audit is complete.');
        }
      }
      if (useAI && apiSettings.dataForSeoLogin && apiSettings.dataForSeoPassword) {
        try {
          keywords = await fetchKeywordSuggestions(extractedContent.title || extractedContent.domain, apiSettings.dataForSeoLogin, apiSettings.dataForSeoPassword);
        } catch { warnings.push('Keyword provider unavailable. No search-volume data was collected.'); }
      }
      setKeywordSuggestions(keywords);
      setAnalysisData({ ...extractedContent, aiAnalysis, analyzedAt: new Date().toISOString(),
        analysisMode: mode, source: htmlInput !== undefined ? 'import' : 'network', warnings, keywordSuggestions: keywords });
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Analysis failed.');
    } finally {
      analyzing.current = false;
      resetLoading();
    }
  };

  const handleSectionRewrite = async (section: ContentSection) => {
    setSelectedSection(section);
    setShowRewriterModal(true);
  };

  const handleGenerateReplacement = async (section: ContentSection, instructions: string): Promise<string> => {
    if (!apiSettings.openRouterKey) {
      throw new Error('API key not configured');
    }
    
    return await generateContentReplacements(
      section,
      instructions,
      analysisData!,
      apiSettings.openRouterKey,
      apiSettings.aiModel
    );
  };

  const resetAnalysis = () => {
    setAnalysisData(null);
    setKeywordSuggestions([]);
  };

  return (
    <div className="app-container">
      <Header 
        onOpenSettings={() => setShowApiModal(true)}
        onOpenDeploy={() => setShowDeployModal(true)}
        hasVercelToken={!!apiSettings.vercelToken}
      />
      
      <main className="main-content">
        <UrlInputSection 
          onAnalyze={handleAnalyze}
          isLoading={loadingState.isLoading}
          hasApiKey={!!apiSettings.openRouterKey}
          onOpenSettings={() => setShowApiModal(true)}
        />
        
        {loadingState.isLoading && (
          <LoadingSection 
            progress={loadingState.progress}
            status={loadingState.status}
            currentStep={loadingState.currentStep}
          />
        )}
        
        {analysisData && !loadingState.isLoading && (
          <ResultsSection 
            data={analysisData}
            keywordSuggestions={keywordSuggestions}
            onSectionRewrite={handleSectionRewrite}
            onReset={resetAnalysis}
            aiModel={apiSettings.aiModel}
            onOpenDeploy={() => setShowDeployModal(true)}
          />
        )}
      </main>

      {showApiModal && (
        <ApiSettingsModal
          settings={apiSettings}
          onSave={saveApiSettings}
          onClose={() => setShowApiModal(false)}
        />
      )}

      {showRewriterModal && selectedSection && (
        <ContentRewriterModal
          section={selectedSection}
          analysisData={analysisData!}
          onClose={() => setShowRewriterModal(false)}
          onGenerate={handleGenerateReplacement}
          keywordSuggestions={keywordSuggestions}
        />
      )}

      {showDeployModal && (
        <VercelDeployModal
          settings={apiSettings}
          onClose={() => setShowDeployModal(false)}
          onOpenSettings={() => {
            setShowDeployModal(false);
            setShowApiModal(true);
          }}
        />
      )}

      <Toast show={toast.show} message={toast.message} />
    </div>
  );
}

export default App;

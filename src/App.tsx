
import React, { useState, useCallback } from 'react';
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

const SETTINGS_STORAGE_KEY = 'seo_analyzer_settings';

const getEnvValue = (...keys: string[]) => {
  // Vite exposes environment variables through import.meta.env and Vercel exposes them through process.env
  const envSources = [
    typeof import.meta !== 'undefined' && (import.meta as any).env,
    typeof process !== 'undefined' ? (process as any).env : undefined
  ];

  for (const source of envSources) {
    if (!source) continue;
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }

  return '';
};

const ENV_DEFAULTS: Partial<ApiSettings> = {
  openRouterKey: getEnvValue('VITE_OPENROUTER_API_KEY', 'NEXT_PUBLIC_OPENROUTER_API_KEY', 'OPENROUTER_API_KEY'),
  dataForSeoLogin: getEnvValue('VITE_DATAFORSEO_LOGIN', 'NEXT_PUBLIC_DATAFORSEO_LOGIN', 'DATAFORSEO_LOGIN'),
  dataForSeoPassword: getEnvValue('VITE_DATAFORSEO_PASSWORD', 'NEXT_PUBLIC_DATAFORSEO_PASSWORD', 'DATAFORSEO_PASSWORD'),
  aiModel: getEnvValue('VITE_AI_MODEL', 'NEXT_PUBLIC_AI_MODEL'),
  vercelToken: getEnvValue('VITE_VERCEL_TOKEN', 'NEXT_PUBLIC_VERCEL_TOKEN', 'VERCEL_TOKEN')
};

const DEFAULT_API_SETTINGS: ApiSettings = {
  openRouterKey: '',
  dataForSeoLogin: '',
  dataForSeoPassword: '',
  aiModel: 'anthropic/claude-3.5-sonnet',
  vercelToken: ''
};

const buildInitialSettings = (): ApiSettings => {
  const baseDefaults: ApiSettings = { ...DEFAULT_API_SETTINGS, ...ENV_DEFAULTS };

  if (typeof window === 'undefined') {
    return baseDefaults;
  }

  const savedSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      return { ...baseDefaults, ...parsed };
    } catch {
      return baseDefaults;
    }
  }

  return baseDefaults;
};

function App() {
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
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const saveApiSettings = (settings: ApiSettings) => {
    setApiSettings(settings);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    }

    setShowApiModal(false);
    showToast('Settings saved successfully!');
  };

  const handleAnalyze = async (url: string) => {
    if (!apiSettings.openRouterKey) {
      showToast('Please configure your OpenRouter API key first');
      setShowApiModal(true);
      return;
    }

    updateLoadingStep(0, 'Initializing...', 'extract');

    try {
      // Step 1: Fetch and extract content
      updateLoadingStep(15, 'Extracting page content...', 'extract');
      const html = await fetchPageContent(url);
      const extractedContent = extractContentFromHTML(html, url);

      updateLoadingStep(30, 'Content extracted successfully', 'extract-done');

      // Step 2: Fetch keyword suggestions from DataForSEO if configured
      if (apiSettings.dataForSeoLogin && apiSettings.dataForSeoPassword) {
        updateLoadingStep(40, 'Fetching keyword suggestions...', 'keywords');
        try {
          const keywords = await fetchKeywordSuggestions(
            extractedContent.title || extractedContent.domain,
            apiSettings.dataForSeoLogin,
            apiSettings.dataForSeoPassword
          );
          setKeywordSuggestions(keywords);
        } catch (e) {
          console.log('DataForSEO fetch failed, continuing without keyword data');
        }
      }

      // Step 3: AI Analysis
      updateLoadingStep(50, 'AI is analyzing SEO factors...', 'analyze');
      const aiAnalysis = await analyzeWithAI(extractedContent, apiSettings.openRouterKey, apiSettings.aiModel);

      updateLoadingStep(75, 'Calculating scores...', 'score');

      // Step 4: Generate recommendations
      updateLoadingStep(90, 'Generating recommendations...', 'recommend');

      const data: AnalysisData = {
        ...extractedContent,
        aiAnalysis,
        analyzedAt: new Date().toISOString(),
        keywordSuggestions: keywordSuggestions
      };

      updateLoadingStep(100, 'Analysis complete!', 'complete');

      setTimeout(() => {
        setAnalysisData(data);
        resetLoading();
      }, 500);

    } catch (error: any) {
      resetLoading();
      showToast('Error: ' + error.message);
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

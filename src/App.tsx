
import React, { useState, useEffect } from 'react';
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

function App() {
  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    openRouterKey: '',
    dataForSeoLogin: '',
    dataForSeoPassword: '',
    aiModel: 'anthropic/claude-3.5-sonnet',
    vercelToken: ''
  });
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

  useEffect(() => {
    const savedSettings = localStorage.getItem('seo_analyzer_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setApiSettings({ ...apiSettings, ...parsed });
    }
  }, []);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const saveApiSettings = (settings: ApiSettings) => {
    setApiSettings(settings);
    localStorage.setItem('seo_analyzer_settings', JSON.stringify(settings));
    setShowApiModal(false);
    showToast('Settings saved successfully!');
  };

  const handleAnalyze = async (url: string) => {
    if (!apiSettings.openRouterKey) {
      showToast('Please configure your OpenRouter API key first');
      setShowApiModal(true);
      return;
    }

    setLoadingState({ isLoading: true, progress: 0, status: 'Initializing...', currentStep: 'extract' });
    
    try {
      // Step 1: Fetch and extract content
      setLoadingState(prev => ({ ...prev, progress: 15, status: 'Extracting page content...', currentStep: 'extract' }));
      const html = await fetchPageContent(url);
      const extractedContent = extractContentFromHTML(html, url);
      
      setLoadingState(prev => ({ ...prev, progress: 30, status: 'Content extracted successfully', currentStep: 'extract-done' }));

      // Step 2: Fetch keyword suggestions from DataForSEO if configured
      if (apiSettings.dataForSeoLogin && apiSettings.dataForSeoPassword) {
        setLoadingState(prev => ({ ...prev, progress: 40, status: 'Fetching keyword suggestions...', currentStep: 'keywords' }));
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
      setLoadingState(prev => ({ ...prev, progress: 50, status: 'AI is analyzing SEO factors...', currentStep: 'analyze' }));
      const aiAnalysis = await analyzeWithAI(extractedContent, apiSettings.openRouterKey, apiSettings.aiModel);
      
      setLoadingState(prev => ({ ...prev, progress: 75, status: 'Calculating scores...', currentStep: 'score' }));
      
      // Step 4: Generate recommendations
      setLoadingState(prev => ({ ...prev, progress: 90, status: 'Generating recommendations...', currentStep: 'recommend' }));
      
      const data: AnalysisData = {
        ...extractedContent,
        aiAnalysis,
        analyzedAt: new Date().toISOString(),
        keywordSuggestions: keywordSuggestions
      };

      setLoadingState(prev => ({ ...prev, progress: 100, status: 'Analysis complete!', currentStep: 'complete' }));
      
      setTimeout(() => {
        setAnalysisData(data);
        setLoadingState({ isLoading: false, progress: 0, status: '', currentStep: '' });
      }, 500);

    } catch (error: any) {
      setLoadingState({ isLoading: false, progress: 0, status: '', currentStep: '' });
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

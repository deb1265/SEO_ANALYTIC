
import React, { useState } from 'react';
import './UrlInputSection.css';

interface UrlInputSectionProps {
  onAnalyze: (url: string) => void;
  hasApiKey: boolean;
  onOpenSettings: () => void;
}

const UrlInputSection: React.FC<UrlInputSectionProps> = ({ onAnalyze, hasApiKey, onOpenSettings }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = () => {
    let processedUrl = url.trim();
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl;
    }
    
    try {
      new URL(processedUrl);
      onAnalyze(processedUrl);
    } catch {
      alert('Please enter a valid URL');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <section className="url-input-section">
      <div className="url-input-card">
        <div className="url-input-header">
          <h2>AI-Powered SEO Analysis & Content Optimizer</h2>
          <p>Get comprehensive SEO insights and AI-generated content replacements for each section</p>
          <div className="feature-badges">
            <span className="badge badge-green">
              <i className="fas fa-check"></i> 50+ Scoring Criteria
            </span>
            <span className="badge badge-blue">
              <i className="fas fa-brain"></i> AI Analysis
            </span>
            <span className="badge badge-purple">
              <i className="fas fa-magic"></i> Content Rewriter
            </span>
            <span className="badge badge-orange">
              <i className="fas fa-key"></i> DataForSEO Keywords
            </span>
          </div>
        </div>
        
        <div className="url-input-form">
          <div className="input-wrapper">
            <i className="fas fa-globe input-icon"></i>
            <input 
              type="url" 
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter website URL (e.g., https://example.com)"
            />
          </div>
          <button onClick={handleSubmit} className="analyze-btn">
            <i className="fas fa-robot"></i>
            <span>Analyze with AI</span>
          </button>
        </div>

        {!hasApiKey && (
          <div className="api-warning">
            <div className="warning-content">
              <i className="fas fa-exclamation-triangle"></i>
              <div>
                <p className="warning-title">API Key Required</p>
                <p className="warning-text">Please configure your OpenRouter API key to enable AI-powered analysis.</p>
              </div>
              <button onClick={onOpenSettings} className="configure-btn">Configure</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default UrlInputSection;

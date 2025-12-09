
import React, { useState } from 'react';
import { ApiSettings } from '../types';
import './ApiSettingsModal.css';

interface ApiSettingsModalProps {
  settings: ApiSettings;
  onSave: (settings: ApiSettings) => void;
  onClose: () => void;
}

const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = useState<ApiSettings>(settings);
  const [activeSection, setActiveSection] = useState<'ai' | 'seo' | 'vercel'>('ai');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>API Settings</h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="settings-tabs">
          <button 
            className={`settings-tab ${activeSection === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveSection('ai')}
          >
            <i className="fas fa-robot"></i> AI Analysis
          </button>
          <button 
            className={`settings-tab ${activeSection === 'seo' ? 'active' : ''}`}
            onClick={() => setActiveSection('seo')}
          >
            <i className="fas fa-chart-line"></i> DataForSEO
          </button>
          <button 
            className={`settings-tab ${activeSection === 'vercel' ? 'active' : ''}`}
            onClick={() => setActiveSection('vercel')}
          >
            <i className="fas fa-cloud-upload-alt"></i> Vercel Deploy
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {activeSection === 'ai' && (
            <>
              <div className="form-group">
                <label>
                  <i className="fas fa-robot text-purple"></i> OpenRouter API Key
                </label>
                <input 
                  type="password" 
                  value={formData.openRouterKey}
                  onChange={e => setFormData({ ...formData, openRouterKey: e.target.value })}
                  placeholder="sk-or-v1-..."
                />
                <p className="form-hint">
                  Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">openrouter.ai/keys</a>
                </p>
              </div>

              <div className="form-group">
                <label>
                  <i className="fas fa-brain text-blue"></i> AI Model
                </label>
                <select 
                  value={formData.aiModel}
                  onChange={e => setFormData({ ...formData, aiModel: e.target.value })}
                >
                  <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet (Recommended)</option>
                  <option value="anthropic/claude-3-haiku">Claude 3 Haiku (Fast)</option>
                  <option value="openai/gpt-4o">GPT-4o</option>
                  <option value="openai/gpt-4o-mini">GPT-4o Mini (Budget)</option>
                  <option value="google/gemini-pro-1.5">Gemini Pro 1.5</option>
                  <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
                </select>
              </div>

              <div className="info-box">
                <h4><i className="fas fa-info-circle"></i> AI Analysis</h4>
                <p>OpenRouter provides AI-powered SEO analysis with access to multiple AI models. Your API key is stored locally.</p>
              </div>
            </>
          )}

          {activeSection === 'seo' && (
            <>
              <div className="form-group">
                <label>
                  <i className="fas fa-key text-green"></i> DataForSEO Login
                </label>
                <input 
                  type="text" 
                  value={formData.dataForSeoLogin}
                  onChange={e => setFormData({ ...formData, dataForSeoLogin: e.target.value })}
                  placeholder="your_login@email.com"
                />
              </div>

              <div className="form-group">
                <label>
                  <i className="fas fa-lock text-green"></i> DataForSEO Password
                </label>
                <input 
                  type="password" 
                  value={formData.dataForSeoPassword}
                  onChange={e => setFormData({ ...formData, dataForSeoPassword: e.target.value })}
                  placeholder="Your DataForSEO API password"
                />
                <p className="form-hint">
                  Get DataForSEO credentials from <a href="https://app.dataforseo.com/api-dashboard" target="_blank" rel="noreferrer">dataforseo.com</a>
                </p>
              </div>

              <div className="info-box info-box-green">
                <h4><i className="fas fa-database"></i> Keyword Data (Optional)</h4>
                <p>DataForSEO provides real keyword search volume and suggestions for more accurate SEO recommendations.</p>
              </div>
            </>
          )}

          {activeSection === 'vercel' && (
            <>
              <div className="form-group">
                <label>
                  <i className="fas fa-triangle text-black"></i> Vercel Access Token
                </label>
                <input 
                  type="password" 
                  value={formData.vercelToken || ''}
                  onChange={e => setFormData({ ...formData, vercelToken: e.target.value })}
                  placeholder="Enter your Vercel access token..."
                />
                <p className="form-hint">
                  Create a token at <a href="https://vercel.com/account/tokens" target="_blank" rel="noreferrer">vercel.com/account/tokens</a>
                </p>
              </div>

              <div className="info-box info-box-dark">
                <h4><i className="fas fa-rocket"></i> One-Click Deployment</h4>
                <p>Deploy your optimized website directly to Vercel. Upload a ZIP file and we'll handle the rest, including setting up environment variables.</p>
              </div>

              <div className="vercel-features">
                <div className="feature-item">
                  <i className="fas fa-check-circle text-green"></i>
                  <span>Automatic ZIP extraction</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-check-circle text-green"></i>
                  <span>Environment variables setup</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-check-circle text-green"></i>
                  <span>Instant preview URLs</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-check-circle text-green"></i>
                  <span>Production deployment</span>
                </div>
              </div>
            </>
          )}

          <button type="submit" className="save-btn">
            <i className="fas fa-save"></i> Save Settings
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApiSettingsModal;

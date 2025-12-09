
import React, { useState } from 'react';
import { ContentSection, AnalysisData } from '../types';
import './ContentRewriterModal.css';

interface ContentRewriterModalProps {
  section: ContentSection;
  analysisData: AnalysisData;
  onClose: () => void;
  onGenerate: (section: ContentSection, instructions: string) => Promise<string>;
  keywordSuggestions: string[];
}

const ContentRewriterModal: React.FC<ContentRewriterModalProps> = ({
  section,
  analysisData,
  onClose,
  onGenerate,
  keywordSuggestions
}) => {
  const [instructions, setInstructions] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const result = await onGenerate(section, instructions);
      setGeneratedContent(result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickInstructions = [
    'Make it more compelling and click-worthy',
    'Add primary keywords naturally',
    'Improve readability and flow',
    'Make it more concise',
    'Add a call to action',
    'Make it more professional'
  ];

  return (
    <div className="rewriter-overlay" onClick={onClose}>
      <div className="rewriter-modal" onClick={e => e.stopPropagation()}>
        <div className="rewriter-header">
          <div>
            <h3>AI Content Rewriter</h3>
            <p className="rewriter-subtitle">{section.label}</p>
          </div>
          <button className="rewriter-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="rewriter-body">
          {/* Original Content */}
          <div className="content-section">
            <label>Original Content</label>
            <div className="original-box">
              {section.content}
            </div>
          </div>

          {/* Keywords */}
          {keywordSuggestions.length > 0 && (
            <div className="keywords-section">
              <label>Target Keywords</label>
              <div className="keyword-chips">
                {keywordSuggestions.slice(0, 8).map((kw, i) => (
                  <span key={i} className="keyword-chip">{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* Quick Instructions */}
          <div className="quick-instructions">
            <label>Quick Instructions</label>
            <div className="quick-btns">
              {quickInstructions.map((instr, i) => (
                <button
                  key={i}
                  className={`quick-btn ${instructions === instr ? 'active' : ''}`}
                  onClick={() => setInstructions(instr)}
                >
                  {instr}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="instructions-section">
            <label>Custom Instructions (Optional)</label>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Add specific instructions for how you want the content rewritten..."
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Generating...
              </>
            ) : (
              <>
                <i className="fas fa-wand-magic-sparkles"></i>
                Generate Optimized Content
              </>
            )}
          </button>

          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          {/* Generated Content */}
          {generatedContent && (
            <div className="generated-section">
              <div className="generated-header">
                <label>AI-Optimized Content</label>
                <button className="copy-btn" onClick={handleCopy}>
                  <i className={`fas fa-${copied ? 'check' : 'copy'}`}></i>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="generated-box">
                {generatedContent}
              </div>
              <div className="char-count">
                {generatedContent.length} characters
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentRewriterModal;

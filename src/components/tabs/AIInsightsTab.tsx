
import React, { useState } from 'react';
import { AnalysisData } from '../../types';
import './Tabs.css';

interface AIInsightsTabProps {
  data: AnalysisData;
}

const AIInsightsTab: React.FC<AIInsightsTabProps> = ({ data }) => {
  const ai = data.aiAnalysis;
  const [showOptimized, setShowOptimized] = useState(false);

  const categories = [
    { name: 'On-Page SEO', score: ai.scores?.onPage?.score || 0, max: 25, passed: ai.scores?.onPage?.passed || [], failed: ai.scores?.onPage?.failed || [], color: 'blue' },
    { name: 'Keywords & Content', score: ai.scores?.keywords?.score || 0, max: 25, passed: ai.scores?.keywords?.passed || [], failed: ai.scores?.keywords?.failed || [], color: 'green' },
    { name: 'Technical SEO', score: ai.scores?.technical?.score || 0, max: 30, passed: ai.scores?.technical?.passed || [], failed: ai.scores?.technical?.failed || [], color: 'purple' },
    { name: 'UX & Mobile', score: ai.scores?.uxMobile?.score || 0, max: 20, passed: ai.scores?.uxMobile?.passed || [], failed: ai.scores?.uxMobile?.failed || [], color: 'orange' }
  ];

  return (
    <div className="ai-insights">
      {/* Executive Summary */}
      <div className="summary-card">
        <h4><i className="fas fa-brain text-purple"></i> AI Executive Summary</h4>
        <p className="summary-text">{ai.summary || 'Analysis complete.'}</p>
      </div>

      {/* Scoring Breakdown */}
      <div className="breakdown-section">
        <h4><i className="fas fa-calculator text-blue"></i> Detailed Scoring Breakdown</h4>
        <div className="breakdown-grid">
          {categories.map((cat, i) => (
            <div key={i} className="breakdown-card">
              <div className="breakdown-header">
                <span>{cat.name}</span>
                <span className={`breakdown-score text-${cat.color}`}>{cat.score}/{cat.max}</span>
              </div>
              <div className="progress-track">
                <div className={`progress-fill fill-${cat.color}`} style={{ width: `${(cat.score / cat.max) * 100}%` }}></div>
              </div>
              <div className="breakdown-details">
                <div className="breakdown-col">
                  <p className="text-green"><i className="fas fa-check"></i> Passed ({cat.passed.length})</p>
                  <span>{cat.passed.slice(0, 5).join(', ') || 'None'}</span>
                </div>
                <div className="breakdown-col">
                  <p className="text-red"><i className="fas fa-times"></i> Failed ({cat.failed.length})</p>
                  <span>{cat.failed.slice(0, 5).join(', ') || 'None'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optimized Content Suggestions */}
      <div className="optimized-section">
        <div className="optimized-header">
          <h4><i className="fas fa-magic text-pink"></i> AI-Optimized Content Suggestions</h4>
          <button onClick={() => setShowOptimized(!showOptimized)} className="toggle-btn">
            <i className="fas fa-wand-magic-sparkles"></i>
            {showOptimized ? 'Hide' : 'Show'} Optimized Content
          </button>
        </div>
        
        {showOptimized && (
          <div className="optimized-content">
            <div className="comparison-grid">
              <div>
                <label>Original Title</label>
                <div className="diff-removed">{data.title || 'No title'}</div>
              </div>
              <div>
                <label>Optimized Title</label>
                <div className="diff-added">{ai.optimizedTitle || 'N/A'}</div>
              </div>
            </div>
            <div className="comparison-grid">
              <div>
                <label>Original Meta Description</label>
                <div className="diff-removed">{data.metaDescription || 'No description'}</div>
              </div>
              <div>
                <label>Optimized Meta Description</label>
                <div className="diff-added">{ai.optimizedMetaDescription || 'N/A'}</div>
              </div>
            </div>
            {ai.contentImprovements && ai.contentImprovements.length > 0 && (
              <div className="improvements-box">
                <label>Content Improvements</label>
                <ul>
                  {ai.contentImprovements.map((imp, i) => (
                    <li key={i}>{imp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Industry Comparison */}
      <div className="industry-card">
        <h4><i className="fas fa-chart-bar text-green"></i> Industry Comparison</h4>
        <p>{ai.industryComparison || 'Industry comparison data will appear here.'}</p>
      </div>
    </div>
  );
};

export default AIInsightsTab;


import React from 'react';
import { AnalysisData } from '../../types';
import './Tabs.css';

interface KeywordsTabProps {
  data: AnalysisData;
  keywordSuggestions: string[];
}

const KeywordsTab: React.FC<KeywordsTabProps> = ({ data, keywordSuggestions }) => {
  const ai = data.aiAnalysis;

  return (
    <div className="tab-grid">
      {/* Primary Keywords */}
      <div className="analysis-card">
        <h4><i className="fas fa-star text-yellow"></i> AI-Detected Keywords</h4>
        <div className="keywords-list">
          {(ai.primaryKeywords || []).map((kw, i) => (
            <div key={i} className="keyword-item">
              <div className="keyword-rank">{i + 1}</div>
              <span className="keyword-word">{kw.word}</span>
              <div className="keyword-stats">
                <span>{kw.count} occurrences</span>
                <span className="keyword-density">{kw.density}</span>
              </div>
            </div>
          ))}
          {(!ai.primaryKeywords || ai.primaryKeywords.length === 0) && (
            <p className="no-data">No keywords detected</p>
          )}
        </div>
      </div>

      {/* AI Keyword Analysis */}
      <div className="analysis-card full-width">
        <h4><i className="fas fa-robot text-purple"></i> AI Keyword Analysis</h4>
        <p className="analysis-text">{ai.keywordAnalysis || 'AI analysis pending...'}</p>
      </div>

      {/* DataForSEO Suggestions */}
      {keywordSuggestions.length > 0 && (
        <div className="analysis-card">
          <h4><i className="fas fa-database text-blue"></i> DataForSEO Keyword Suggestions</h4>
          <div className="keyword-tags">
            {keywordSuggestions.map((kw, i) => (
              <span key={i} className="keyword-tag tag-blue">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggested Keywords */}
      <div className="analysis-card">
        <h4><i className="fas fa-lightbulb text-amber"></i> AI Suggested Keywords</h4>
        <div className="keyword-tags">
          {(ai.suggestedKeywords || []).map((kw, i) => (
            <span key={i} className="keyword-tag tag-purple">
              + {kw}
            </span>
          ))}
          {(!ai.suggestedKeywords || ai.suggestedKeywords.length === 0) && (
            <p className="no-data">No suggestions available</p>
          )}
        </div>
      </div>

      {/* Content Quality */}
      <div className="analysis-card">
        <h4><i className="fas fa-spell-check text-blue"></i> Content Quality Score</h4>
        <div className="quality-metrics">
          <div className="quality-item">
            <div className="quality-header">
              <span>Readability</span>
              <span>{ai.contentQuality?.readabilityScore || 0}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill fill-green" style={{ width: `${ai.contentQuality?.readabilityScore || 0}%` }}></div>
            </div>
          </div>
          <div className="quality-item">
            <div className="quality-header">
              <span>Uniqueness</span>
              <span>{ai.contentQuality?.uniquenessScore || 0}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill fill-blue" style={{ width: `${ai.contentQuality?.uniquenessScore || 0}%` }}></div>
            </div>
          </div>
          <div className="quality-item">
            <div className="quality-header">
              <span>Topic Depth</span>
              <span>{ai.contentQuality?.depthScore || 0}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill fill-purple" style={{ width: `${ai.contentQuality?.depthScore || 0}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeywordsTab;

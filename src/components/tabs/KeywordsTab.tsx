
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
        <h4><i className="fas fa-star text-yellow"></i> Counted Body Terms</h4>
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

      {/* Keyword Method */}
      <div className="analysis-card full-width">
        <h4><i className="fas fa-robot text-purple"></i> Keyword Method</h4>
        <p className="analysis-text">{ai.keywordAnalysis || 'No analysis available.'}</p>
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

      <div className="analysis-card">
        <h4>Content quality: manual review</h4>
        <p>Readability, originality and topic depth are not scored. Originality requires comparison sources; keyword frequency is not evidence of quality or search demand.</p>
      </div>
    </div>
  );
};

export default KeywordsTab;

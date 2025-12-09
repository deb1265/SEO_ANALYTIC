
import React from 'react';
import { AnalysisData } from '../../types';
import './Tabs.css';

interface RecommendationsTabProps {
  data: AnalysisData;
}

const RecommendationsTab: React.FC<RecommendationsTabProps> = ({ data }) => {
  const ai = data.aiAnalysis;
  const recs = ai.recommendations || [];

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'critical':
        return { border: 'border-red', bg: 'bg-red', icon: 'fa-exclamation-triangle' };
      case 'warning':
        return { border: 'border-yellow', bg: 'bg-yellow', icon: 'fa-exclamation-circle' };
      default:
        return { border: 'border-blue', bg: 'bg-blue', icon: 'fa-lightbulb' };
    }
  };

  return (
    <div className="recommendations">
      <div className="rec-header">
        <h3>AI-Prioritized Recommendations</h3>
        <div className="rec-legend">
          <span className="legend-item legend-critical">Critical</span>
          <span className="legend-item legend-warning">Warning</span>
          <span className="legend-item legend-opportunity">Opportunity</span>
        </div>
      </div>

      <div className="rec-list">
        {recs.map((rec, i) => {
          const styles = getPriorityStyles(rec.priority);
          return (
            <div key={i} className={`rec-card ${styles.border}`}>
              <div className="rec-content">
                <div className={`rec-icon ${styles.bg}`}>
                  <i className={`fas ${styles.icon}`}></i>
                </div>
                <div className="rec-body">
                  <div className="rec-title-row">
                    <h4>{rec.title}</h4>
                    <span className={`rec-badge ${styles.bg}`}>{rec.priority}</span>
                  </div>
                  <p className="rec-description">{rec.description}</p>
                  <div className="rec-suggestion">
                    <span className="suggestion-icon">💡</span>
                    <div>
                      <strong>Suggestion:</strong>
                      <p>{rec.suggestion}</p>
                    </div>
                  </div>
                  {rec.impact && (
                    <p className="rec-impact">
                      <i className="fas fa-chart-line"></i> Expected impact: {rec.impact}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {recs.length === 0 && (
          <p className="no-data center">No recommendations available</p>
        )}
      </div>
    </div>
  );
};

export default RecommendationsTab;

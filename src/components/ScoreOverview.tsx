
import React, { useEffect, useState } from 'react';
import { AnalysisData } from '../types';
import './ScoreOverview.css';

interface ScoreOverviewProps {
  data: AnalysisData;
}

const ScoreOverview: React.FC<ScoreOverviewProps> = ({ data }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const ai = data.aiAnalysis;
  const targetScore = ai.overallScore || 0;

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      if (current >= targetScore) {
        clearInterval(interval);
        return;
      }
      current++;
      setAnimatedScore(current);
    }, 20);
    return () => clearInterval(interval);
  }, [targetScore]);

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { text: 'Excellent', color: 'text-green' };
    if (score >= 60) return { text: 'Good', color: 'text-yellow' };
    if (score >= 40) return { text: 'Needs Work', color: 'text-orange' };
    return { text: 'Poor', color: 'text-red' };
  };

  const scoreLabel = getScoreLabel(targetScore);
  const dashOffset = 283 - (283 * animatedScore / 100);

  return (
    <div className="score-overview">
      {/* Overall Score */}
      <div className="overall-score-card">
        <h3>Overall SEO Score</h3>
        <div className="score-ring-container">
          <svg className="score-ring" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
            <circle 
              cx="50" cy="50" r="45" 
              fill="none" 
              stroke="url(#gradient)" 
              strokeWidth="8" 
              strokeLinecap="round" 
              strokeDasharray="283" 
              strokeDashoffset={dashOffset}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#667eea"/>
                <stop offset="100%" stopColor="#764ba2"/>
              </linearGradient>
            </defs>
          </svg>
          <div className="score-value">
            <span className="score-number gradient-text">{animatedScore}</span>
            <span className="score-max">out of 100</span>
          </div>
        </div>
        <p className={`score-label ${scoreLabel.color}`}>{scoreLabel.text}</p>
        <div className="confidence">
          <span>AI Confidence: </span>
          <span className="confidence-value">{ai.confidence || 90}%</span>
        </div>
      </div>

      {/* Category Scores */}
      <div className="category-scores-card">
        <h3>AI Score Breakdown</h3>
        <div className="category-grid">
          <div className="category-item category-blue">
            <i className="fas fa-file-alt"></i>
            <div className="category-score">{ai.scores?.onPage?.score || 0}</div>
            <div className="category-name">On-Page</div>
            <div className="category-max">/ 25 pts</div>
          </div>
          <div className="category-item category-green">
            <i className="fas fa-key"></i>
            <div className="category-score">{ai.scores?.keywords?.score || 0}</div>
            <div className="category-name">Keywords</div>
            <div className="category-max">/ 25 pts</div>
          </div>
          <div className="category-item category-purple">
            <i className="fas fa-cogs"></i>
            <div className="category-score">{ai.scores?.technical?.score || 0}</div>
            <div className="category-name">Technical</div>
            <div className="category-max">/ 30 pts</div>
          </div>
          <div className="category-item category-orange">
            <i className="fas fa-mobile-alt"></i>
            <div className="category-score">{ai.scores?.uxMobile?.score || 0}</div>
            <div className="category-name">UX & Mobile</div>
            <div className="category-max">/ 20 pts</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-item">
            <div className="stat-value">{data.wordCount.toLocaleString()}</div>
            <div className="stat-label">Words</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{data.images.length}</div>
            <div className="stat-label">Images</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{data.internalLinks.length + data.externalLinks.length}</div>
            <div className="stat-label">Links</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{Object.values(data.headings).flat().length}</div>
            <div className="stat-label">Headings</div>
          </div>
          <div className="stat-item">
            <div className="stat-value stat-red">
              {(ai.recommendations || []).filter(r => r.priority === 'critical').length}
            </div>
            <div className="stat-label">Issues</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreOverview;

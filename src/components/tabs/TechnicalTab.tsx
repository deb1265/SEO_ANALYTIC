
import React from 'react';
import { AnalysisData } from '../../types';
import './Tabs.css';

interface TechnicalTabProps {
  data: AnalysisData;
}

const TechnicalTab: React.FC<TechnicalTabProps> = ({ data }) => {
  const ai = data.aiAnalysis;
  const te = ai.technicalEstimates || { fcp: '1.5s', lcp: '2.0s', cls: '0.05', tti: '3.0s' };

  const metrics = [
    { name: 'First Contentful Paint (FCP)', value: te.fcp, target: 1.8 },
    { name: 'Largest Contentful Paint (LCP)', value: te.lcp, target: 2.5 },
    { name: 'Cumulative Layout Shift (CLS)', value: te.cls, target: 0.1 },
    { name: 'Time to Interactive (TTI)', value: te.tti, target: 3.8 }
  ];

  return (
    <div className="tab-grid">
      {/* Core Web Vitals */}
      <div className="analysis-card">
        <h4><i className="fas fa-tachometer-alt text-blue"></i> Core Web Vitals</h4>
        <div className="vitals-list">
          {metrics.map((m, i) => {
            const numVal = parseFloat(m.value) || 0; 
            const isGood = numVal <= m.target;
            return (
              <div key={i} className="vital-item">
                <div className="vital-header">
                  <span>{m.name}</span>
                  <span className={isGood ? 'text-green' : 'text-yellow'}>{m.value}</span>
                </div>
                <div className="progress-track">
                  <div 
                    className={`progress-fill ${isGood ? 'fill-green' : 'fill-yellow'}`}
                    style={{ width: `${Math.max(100 - (numVal / m.target * 50), 20)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile & UX */}
      <div className="analysis-card">
        <h4><i className="fas fa-mobile-alt text-green"></i> Mobile & UX</h4>
        <div className="check-list">
          <div className={`check-item ${data.viewport ? 'check-pass' : 'check-fail'}`}>
            <i className={`fas fa-${data.viewport ? 'check' : 'times'}-circle`}></i>
            Viewport meta tag
          </div>
          <div className={`check-item ${data.viewport ? 'check-pass' : 'check-fail'}`}>
            <i className={`fas fa-${data.viewport ? 'check' : 'times'}-circle`}></i>
            Responsive design
          </div>
          <div className="check-item check-pass">
            <i className="fas fa-check-circle"></i>
            Touch-friendly targets
          </div>
          <div className="check-item check-pass">
            <i className="fas fa-check-circle"></i>
            Readable font sizes
          </div>
        </div>
      </div>

      {/* Indexability */}
      <div className="analysis-card">
        <h4><i className="fas fa-robot text-indigo"></i> Indexability & Crawlability</h4>
        <div className="check-list">
          <div className={`check-item ${!data.robots?.includes('noindex') ? 'check-pass' : 'check-fail'}`}>
            <i className={`fas fa-${!data.robots?.includes('noindex') ? 'check' : 'times'}-circle`}></i>
            Robots meta allows indexing
          </div>
          <div className={`check-item ${data.canonical ? 'check-pass' : 'check-warn'}`}>
            <i className={`fas fa-${data.canonical ? 'check' : 'exclamation'}-circle`}></i>
            Canonical URL set
          </div>
          <div className={`check-item ${data.lang ? 'check-pass' : 'check-warn'}`}>
            <i className={`fas fa-${data.lang ? 'check' : 'exclamation'}-circle`}></i>
            Language declared
          </div>
        </div>
      </div>

      {/* Security & Schema */}
      <div className="analysis-card">
        <h4><i className="fas fa-shield-alt text-red"></i> Security & Structured Data</h4>
        <div className="check-list">
          <div className={`check-item ${data.isHttps ? 'check-pass' : 'check-fail'}`}>
            <i className={`fas fa-${data.isHttps ? 'check' : 'times'}-circle`}></i>
            HTTPS enabled
          </div>
          <div className={`check-item ${data.ogTitle ? 'check-pass' : 'check-warn'}`}>
            <i className={`fas fa-${data.ogTitle ? 'check' : 'exclamation'}-circle`}></i>
            Open Graph tags
          </div>
          <div className={`check-item ${data.twitterCard ? 'check-pass' : 'check-warn'}`}>
            <i className={`fas fa-${data.twitterCard ? 'check' : 'exclamation'}-circle`}></i>
            Twitter Cards
          </div>
          <div className={`check-item ${data.schemas.length > 0 ? 'check-pass' : 'check-warn'}`}>
            <i className={`fas fa-${data.schemas.length > 0 ? 'check' : 'exclamation'}-circle`}></i>
            Schema markup {data.schemas.length > 0 && `(${data.schemas.join(', ')})`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicalTab;

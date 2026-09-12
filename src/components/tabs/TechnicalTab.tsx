
import React from 'react';
import { AnalysisData } from '../../types';
import './Tabs.css';

interface TechnicalTabProps {
  data: AnalysisData;
}

const TechnicalTab: React.FC<TechnicalTabProps> = ({ data }) => {

  return (
    <div className="tab-grid">
      <div className="analysis-card">
        <h4>Performance: not measured</h4>
        <p>HTML alone cannot measure LCP, INP, CLS or loading time.</p>
        <p><a href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(data.url)}`} target="_blank" rel="noreferrer">Measure this URL with PageSpeed Insights</a></p>
      </div>
      <div className="analysis-card">
        <h4>Mobile &amp; accessibility</h4>
        <p>Viewport: {data.viewport || 'Not declared'}</p>
        <p>Responsive layout, touch targets and font legibility require a rendered-page check and are not measured here.</p>
      </div>
      {/* Indexability */}
      <div className="analysis-card">
        <h4><i className="fas fa-robot text-indigo"></i> Indexability & Crawlability</h4>
        <div className="check-list">
          <div className={`check-item ${!/(?:^|[\s,;])(?:noindex|none)(?:$|[\s,;])/.test(data.robots) ? 'check-pass' : 'check-fail'}`}>
            <i className={`fas fa-${!/(?:^|[\s,;])(?:noindex|none)(?:$|[\s,;])/.test(data.robots) ? 'check' : 'times'}-circle`}></i>
            No blocking robots meta found (not proof of indexing)
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

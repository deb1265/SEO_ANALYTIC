
import React from 'react';
import { AnalysisData } from '../../types';
import './Tabs.css';

interface OnPageTabProps {
  data: AnalysisData;
}

const OnPageTab: React.FC<OnPageTabProps> = ({ data }) => {
  const getStatusClass = (isGood: boolean) => isGood ? 'status-good' : 'status-warning';
  
  const titleLength = data.title?.length || 0;
  const metaLength = data.metaDescription?.length || 0;
  const h1Count = data.headings.h1.length;
  const imagesWithAlt = data.images.filter(i => i.hasAlt).length;
  const totalImages = data.images.length;
  const altPercent = totalImages > 0 ? imagesWithAlt / totalImages : 1;

  return (
    <div className="tab-grid">
      {/* Title Tag */}
      <div className="analysis-card">
        <div className="card-header">
          <h4><i className="fas fa-heading text-blue"></i> Title Tag</h4>
          <span className={`status-badge ${getStatusClass(titleLength >= 50 && titleLength <= 60)}`}>
            {titleLength >= 50 && titleLength <= 60 ? 'Passed' : 'Needs Work'}
          </span>
        </div>
        <div className="card-content">
          <p className="content-preview">{data.title || 'No title found'}</p>
          <div className="meta-info">
            <span>Length: {titleLength} characters</span>
            <span>Optimal: 50-60</span>
          </div>
          <div className="progress-track">
            <div 
              className={`progress-fill ${titleLength >= 50 && titleLength <= 60 ? 'fill-green' : 'fill-yellow'}`}
              style={{ width: `${Math.min(titleLength / 60 * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Meta Description */}
      <div className="analysis-card">
        <div className="card-header">
          <h4><i className="fas fa-align-left text-purple"></i> Meta Description</h4>
          <span className={`status-badge ${getStatusClass(metaLength >= 150 && metaLength <= 160)}`}>
            {metaLength >= 150 && metaLength <= 160 ? 'Passed' : 'Needs Work'}
          </span>
        </div>
        <div className="card-content">
          <p className="content-preview">{data.metaDescription || 'No meta description found'}</p>
          <div className="meta-info">
            <span>Length: {metaLength} characters</span>
            <span>Optimal: 150-160</span>
          </div>
          <div className="progress-track">
            <div 
              className={`progress-fill ${metaLength >= 150 && metaLength <= 160 ? 'fill-green' : 'fill-yellow'}`}
              style={{ width: `${Math.min(metaLength / 160 * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Headings */}
      <div className="analysis-card">
        <div className="card-header">
          <h4><i className="fas fa-list-ol text-green"></i> Headings Structure</h4>
          <span className={`status-badge ${getStatusClass(h1Count === 1)}`}>
            {h1Count === 1 ? 'Passed' : 'Needs Work'}
          </span>
        </div>
        <div className="card-content">
          <div className="headings-list">
            {Object.entries(data.headings).map(([tag, texts]) => 
              texts.slice(0, 3).map((text, i) => (
                <div key={`${tag}-${i}`} className="heading-item">
                  <span className="heading-tag">{tag.toUpperCase()}</span>
                  <span className="heading-text">{text}</span>
                </div>
              ))
            )}
            {Object.values(data.headings).flat().length === 0 && (
              <p className="no-data">No headings found</p>
            )}
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="analysis-card">
        <div className="card-header">
          <h4><i className="fas fa-image text-orange"></i> Image Optimization</h4>
          <span className={`status-badge ${getStatusClass(altPercent >= 0.8)}`}>
            {altPercent >= 0.8 ? 'Passed' : 'Needs Work'}
          </span>
        </div>
        <div className="card-content">
          <div className="stats-row">
            <div className="stat-box">
              <span className="stat-number">{totalImages}</span>
              <span className="stat-text">Total Images</span>
            </div>
            <div className="stat-box">
              <span className="stat-number text-green">{imagesWithAlt}</span>
              <span className="stat-text">With Alt Text</span>
            </div>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="analysis-card">
        <div className="card-header">
          <h4><i className="fas fa-link text-indigo"></i> Links Analysis</h4>
          <span className={`status-badge ${getStatusClass(data.internalLinks.length >= 3)}`}>
            {data.internalLinks.length >= 3 ? 'Passed' : 'Needs Work'}
          </span>
        </div>
        <div className="card-content">
          <div className="stats-row three-col">
            <div className="stat-box">
              <span className="stat-number text-blue">{data.internalLinks.length}</span>
              <span className="stat-text">Internal</span>
            </div>
            <div className="stat-box">
              <span className="stat-number text-green">{data.externalLinks.length}</span>
              <span className="stat-text">External</span>
            </div>
            <div className="stat-box">
              <span className="stat-number text-red">0</span>
              <span className="stat-text">Issues</span>
            </div>
          </div>
        </div>
      </div>

      {/* URL Structure */}
      <div className="analysis-card">
        <div className="card-header">
          <h4><i className="fas fa-sitemap text-teal"></i> URL Structure</h4>
          <span className={`status-badge ${getStatusClass(data.isHttps)}`}>
            {data.isHttps ? 'Passed' : 'Needs Work'}
          </span>
        </div>
        <div className="card-content">
          <p className="url-display">{data.url}</p>
          <div className="check-list">
            <div className={`check-item ${data.isHttps ? 'check-pass' : 'check-fail'}`}>
              <i className={`fas fa-${data.isHttps ? 'check' : 'times'}-circle`}></i>
              HTTPS enabled
            </div>
            <div className={`check-item ${data.urlLength < 75 ? 'check-pass' : 'check-warn'}`}>
              <i className={`fas fa-${data.urlLength < 75 ? 'check' : 'exclamation'}-circle`}></i>
              URL length: {data.urlLength} characters
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnPageTab;

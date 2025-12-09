
import React from 'react';
import './Header.css';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenDeploy: () => void;
  hasVercelToken: boolean;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenDeploy, hasVercelToken }) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <div className="header-logo">
            <i className="fas fa-search-plus"></i>
          </div>
          <h1 className="header-title">SEO Analyzer Pro</h1>
          <span className="ai-badge">
            <i className="fas fa-robot"></i> AI Powered
          </span>
        </div>
        <nav className="header-nav">
          <a href="#" className="nav-link">Dashboard</a>
          <a href="#criteria-section" className="nav-link">Scoring Criteria</a>
          <button onClick={onOpenDeploy} className="nav-link deploy-link">
            <svg height="14" viewBox="0 0 75 65" fill="currentColor" style={{ marginRight: '6px' }}>
              <path d="M37.59.25l36.95 64H.64l36.95-64z"></path>
            </svg>
            Deploy
            {hasVercelToken && <span className="connected-dot"></span>}
          </button>
          <button onClick={onOpenSettings} className="nav-link">
            <i className="fas fa-cog"></i> Settings
          </button>
          <button className="account-btn">
            <i className="fas fa-user"></i> Account
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;

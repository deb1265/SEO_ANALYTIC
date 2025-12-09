
import React from 'react';
import { AnalysisData, ContentSection } from '../../types';
import './Tabs.css';

interface ContentStructureTabProps {
  data: AnalysisData;
  onSectionRewrite: (section: ContentSection) => void;
  keywordSuggestions: string[];
}

const ContentStructureTab: React.FC<ContentStructureTabProps> = ({ 
  data, 
  onSectionRewrite,
  keywordSuggestions 
}) => {
  const ai = data.aiAnalysis;

  const sections: ContentSection[] = [];

  // Add title
  if (data.title) {
    sections.push({ type: 'title', content: data.title, label: 'Page Title' });
  }

  // Add meta description
  if (data.metaDescription) {
    sections.push({ type: 'meta', content: data.metaDescription, label: 'Meta Description' });
  }

  // Add H1
  data.headings.h1.forEach((h, i) => {
    sections.push({ type: 'h1', content: h, index: i, label: `H1 Heading ${i + 1}` });
  });

  // Add H2s
  data.headings.h2.forEach((h, i) => {
    sections.push({ type: 'h2', content: h, index: i, label: `H2 Heading ${i + 1}` });
  });

  // Add H3s
  data.headings.h3.forEach((h, i) => {
    sections.push({ type: 'h3', content: h, index: i, label: `H3 Heading ${i + 1}` });
  });

  // Add paragraphs (first 5)
  data.paragraphs.slice(0, 5).forEach((p, i) => {
    sections.push({ type: 'paragraph', content: p, index: i, label: `Paragraph ${i + 1}` });
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'title': return 'fa-heading';
      case 'meta': return 'fa-align-left';
      case 'h1': return 'fa-h';
      case 'h2': return 'fa-h';
      case 'h3': return 'fa-h';
      case 'paragraph': return 'fa-paragraph';
      default: return 'fa-file-alt';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'title': return 'blue';
      case 'meta': return 'purple';
      case 'h1': return 'green';
      case 'h2': return 'teal';
      case 'h3': return 'cyan';
      case 'paragraph': return 'gray';
      default: return 'gray';
    }
  };

  return (
    <div className="content-structure">
      <div className="structure-header">
        <div>
          <h3>Content Structure & AI Rewriter</h3>
          <p>Click on any section to generate AI-optimized replacement content that maintains your structure while improving SEO.</p>
        </div>
        {keywordSuggestions.length > 0 && (
          <div className="keyword-hints">
            <span className="hint-label">Target Keywords:</span>
            <div className="hint-tags">
              {keywordSuggestions.slice(0, 5).map((kw, i) => (
                <span key={i} className="hint-tag">{kw}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Optimized Suggestions from Analysis */}
      {ai.sectionReplacements && ai.sectionReplacements.length > 0 && (
        <div className="ai-suggestions-banner">
          <h4><i className="fas fa-magic"></i> AI Has Pre-Generated Optimization Suggestions</h4>
          <p>Our AI has already analyzed your content and generated optimized versions for key sections.</p>
        </div>
      )}

      <div className="sections-list">
        {sections.map((section, i) => {
          const color = getTypeColor(section.type);
          const aiSuggestion = ai.sectionReplacements?.find(
            s => s.sectionType === section.type && s.original === section.content
          );

          return (
            <div key={i} className={`section-card section-${color}`}>
              <div className="section-header">
                <div className="section-type">
                  <i className={`fas ${getTypeIcon(section.type)}`}></i>
                  <span className="type-label">{section.label}</span>
                  <span className={`type-badge badge-${color}`}>{section.type.toUpperCase()}</span>
                </div>
                <button 
                  className="rewrite-btn"
                  onClick={() => onSectionRewrite(section)}
                >
                  <i className="fas fa-wand-magic-sparkles"></i>
                  Rewrite with AI
                </button>
              </div>
              
              <div className="section-content">
                <p className="original-content">{section.content}</p>
              </div>

              {aiSuggestion && (
                <div className="ai-suggestion">
                  <div className="suggestion-label">
                    <i className="fas fa-robot"></i> AI Suggested Replacement:
                  </div>
                  <p className="suggested-content">{aiSuggestion.optimized}</p>
                  <p className="suggestion-reasoning">
                    <strong>Why:</strong> {aiSuggestion.reasoning}
                  </p>
                </div>
              )}

              {section.type === 'title' && ai.optimizedTitle && (
                <div className="ai-suggestion">
                  <div className="suggestion-label">
                    <i className="fas fa-robot"></i> AI Optimized Version:
                  </div>
                  <p className="suggested-content">{ai.optimizedTitle}</p>
                </div>
              )}

              {section.type === 'meta' && ai.optimizedMetaDescription && (
                <div className="ai-suggestion">
                  <div className="suggestion-label">
                    <i className="fas fa-robot"></i> AI Optimized Version:
                  </div>
                  <p className="suggested-content">{ai.optimizedMetaDescription}</p>
                </div>
              )}
            </div>
          );
        })}

        {sections.length === 0 && (
          <div className="no-sections">
            <i className="fas fa-inbox"></i>
            <p>No content sections were extracted from this page.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentStructureTab;

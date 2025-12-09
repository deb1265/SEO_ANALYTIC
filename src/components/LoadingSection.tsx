
import React from 'react';
import './LoadingSection.css';

interface LoadingSectionProps {
  progress: number;
  status: string;
  currentStep: string;
}

const steps = [
  { id: 'extract', label: 'Extract Content' },
  { id: 'keywords', label: 'Fetch Keywords' },
  { id: 'analyze', label: 'AI Analysis' },
  { id: 'score', label: 'Calculate Scores' },
  { id: 'recommend', label: 'Generate Recommendations' }
];

const LoadingSection: React.FC<LoadingSectionProps> = ({ progress, status, currentStep }) => {
  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === currentStep || s.id === currentStep.replace('-done', ''));
    
    if (currentStep.includes('-done') && stepId === currentStep.replace('-done', '')) {
      return 'complete';
    }
    if (stepIndex < currentIndex) return 'complete';
    if (stepId === currentStep) return 'active';
    return 'pending';
  };

  return (
    <section className="loading-section">
      <div className="loading-card">
        <div className="loading-spinner">
          <div className="spinner-outer"></div>
          <div className="spinner-inner">
            <i className="fas fa-robot"></i>
          </div>
        </div>
        
        <h3>AI is Analyzing Your Page...</h3>
        <p className="loading-status">{status}</p>
        
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        
        <div className="loading-steps">
          {steps.map(step => {
            const stepStatus = getStepStatus(step.id);
            return (
              <span 
                key={step.id} 
                className={`step-badge step-${stepStatus}`}
              >
                <i className={`fas ${
                  stepStatus === 'complete' ? 'fa-check-circle' : 
                  stepStatus === 'active' ? 'fa-spinner fa-spin' : 
                  'fa-circle'
                }`}></i>
                {step.label}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LoadingSection;

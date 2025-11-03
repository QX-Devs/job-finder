import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, ArrowRight } from 'lucide-react';
import './CVPrompt.css';

const CVPrompt = () => {
  const navigate = useNavigate();

  const handleHaveCV = () => {
    // Navigate to CV upload page (you can create this later)
    navigate('/dashboard');
  };

  const handleCreateCV = () => {
    // Navigate to CV Generator
    navigate('/cv-generator');
  };

  const handleSkip = () => {
    // Skip to dashboard
    navigate('/dashboard');
  };

  return (
    <div className="cv-prompt-container">
      <div className="cv-prompt-card">
        <div className="prompt-header">
          <div className="icon-circle">
            <FileText size={48} />
          </div>
          <h1>Welcome to GradJob!</h1>
          <p>Let's set up your profile to help you find the best opportunities</p>
        </div>

        <div className="prompt-content">
          <h2>Do you have a CV/Resume?</h2>
          <p className="subtitle">
            Having a complete CV increases your chances of getting hired by 80%
          </p>

          <div className="options-grid">
            <button className="option-card" onClick={handleHaveCV}>
              <div className="option-icon">
                <FileText size={32} />
              </div>
              <h3>I have a CV</h3>
              <p>Upload your existing CV and we'll help you optimize it</p>
              <div className="option-footer">
                <span>Upload CV</span>
                <ArrowRight size={18} />
              </div>
            </button>

            <button className="option-card featured" onClick={handleCreateCV}>
              <div className="featured-badge">Recommended</div>
              <div className="option-icon">
                <Plus size={32} />
              </div>
              <h3>Create a New CV</h3>
              <p>Build an ATS-friendly CV with our AI-powered generator</p>
              <div className="option-footer">
                <span>Start Building</span>
                <ArrowRight size={18} />
              </div>
            </button>
          </div>

          <button className="skip-button" onClick={handleSkip}>
            I'll do this later
          </button>
        </div>

        <div className="benefits-section">
          <h3>Why create a CV now?</h3>
          <ul>
            <li>✓ Get matched with relevant job opportunities</li>
            <li>✓ Stand out to employers with an ATS-optimized format</li>
            <li>✓ Save time with AI-powered suggestions</li>
            <li>✓ Update anytime from your dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CVPrompt;

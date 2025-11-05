import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, ArrowRight } from 'lucide-react';
import './CVPrompt.css';
import resumeService from '../services/resumeService';
import authService from '../services/authService';

const CVPrompt = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleHaveCV = () => {
    setError('');
    if (!authService.isAuthenticated()) {
      setError('Please log in to upload your CV.');
      navigate('/');
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setError('');
    try {
      const result = await resumeService.uploadResumeFile(file);
      if (result?.success) {
        navigate('/dashboard');
      } else {
        setError('Failed to upload CV. Please try again.');
      }
    } catch (e) {
      if (e?.status === 401) {
        setError('Your session has expired. Please log in to upload your CV.');
        navigate('/');
      } else {
        setError(e?.message || 'Failed to upload CV.');
      }
    } finally {
      setIsUploading(false);
      // reset the input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
          <button className="option-card" onClick={handleHaveCV} disabled={isUploading}>
              <div className="option-icon">
                <FileText size={32} />
              </div>
            <h3>I have a CV</h3>
            <p>{isUploading ? 'Uploading your CV...' : "Upload your existing CV and we'll help you optimize it"}</p>
              <div className="option-footer">
              <span>{isUploading ? 'Uploading...' : 'Upload CV'}</span>
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

        {error && (
          <div className="error-message" role="alert" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}

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
      {/* Hidden file input for CV upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.rtf"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />
    </div>
  );
};

export default CVPrompt;

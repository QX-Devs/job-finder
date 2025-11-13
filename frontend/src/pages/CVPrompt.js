import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, ArrowRight } from 'lucide-react';
import './CVPrompt.css';
import resumeService from '../services/resumeService';
import authService from '../services/authService';
import { useLanguage } from '../context/LanguageContext';

const CVPrompt = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const { t, isRTL } = useLanguage();

  const handleHaveCV = () => {
    setError('');
    if (!authService.isAuthenticated()) {
      setError(t('pleaseLoginToUploadCV'));
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
        setError(t('uploadFailed'));
      }
    } catch (e) {
      if (e?.status === 401) {
        setError(t('sessionExpired'));
        navigate('/');
      } else {
        setError(e?.message || t('uploadFailed'));
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
          <h1>{t('welcomeToGradJob')}</h1>
          <p>{t('setupProfilePrompt')}</p>
        </div>

        <div className="prompt-content">
          <h2>{t('haveCVQuestion')}</h2>
          <p className="subtitle">
            {t('cvBenefits')}
          </p>

          <div className="options-grid">
            <button className="option-card" onClick={handleHaveCV} disabled={isUploading}>
              <div className="option-icon">
                <FileText size={32} />
              </div>
              <h3>{t('iHaveCV')}</h3>
              <p>{isUploading ? t('uploadingCV') : t('uploadExistingCV')}</p>
              <div className="option-footer">
                <span>{isUploading ? t('uploading') : t('uploadCV')}</span>
                <ArrowRight size={18} />
              </div>
            </button>

            <button className="option-card featured" onClick={handleCreateCV}>
              <div className="featured-badge">{t('recommended')}</div>
              <div className="option-icon">
                <Plus size={32} />
              </div>
              <h3>{t('createNewCV')}</h3>
              <p>{t('createCVDescription')}</p>
              <div className="option-footer">
                <span>{t('startBuilding')}</span>
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
            {t('doThisLater')}
          </button>
        </div>

        <div className="benefits-section">
          <h3>{t('whyCreateCVNow')}</h3>
          <ul>
            <li>✓ {t('benefit1')}</li>
            <li>✓ {t('benefit2')}</li>
            <li>✓ {t('benefit3')}</li>
            <li>✓ {t('benefit4')}</li>
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
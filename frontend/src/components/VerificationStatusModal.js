// frontend/src/components/VerificationStatusModal.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, CheckCircle, AlertCircle, Mail
} from 'lucide-react';
import { useTranslate } from '../utils/translate';
import './AuthModal.css';

const VerificationStatusModal = ({ isOpen, onClose, status, message }) => {
  const { t, isRTL } = useTranslate();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 480 : false
  );

  const iconSize = isMobile ? 32 : 48;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    // Remove verification params from URL
    navigate('/', { replace: true });
    onClose();
  };

  // Handle keyboard events
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const isSuccess = status === 'success';

  return (
    <div 
      className={`auth-modal-overlay ${isRTL ? 'rtl' : 'ltr'}`} 
      onClick={handleClose}
      onKeyDown={handleKeyDown}
    >
      <div className="auth-modal-container" onClick={(e) => e.stopPropagation()}>
        <button 
          className="auth-modal-close" 
          onClick={handleClose}
          aria-label={t('close')}
        >
          <X size={isMobile ? 14 : 24} />
        </button>

        <div className="auth-modal-content">
          {/* Left Side - Branding */}
          <div className="auth-modal-brand">
            <div className="brand-logo">
              {isSuccess ? (
                <CheckCircle size={isMobile ? 20 : 48} strokeWidth={2.5} />
              ) : (
                <AlertCircle size={isMobile ? 20 : 48} strokeWidth={2.5} />
              )}
            </div>
            <h2 style={{ fontSize: isMobile ? '1.05rem' : '2.75rem' }}>
              {isSuccess ? t('emailVerified') : t('verificationFailed')}
            </h2>
            <p style={{ fontSize: isMobile ? '0.72rem' : '1.25rem' }}>
              {isSuccess 
                ? t('emailVerifiedDesc')
                : t('verificationFailedDesc')
              }
            </p>
          </div>

          {/* Right Side - Status Message */}
          <div className="auth-modal-form-container">
            <div className="forgot-password-success">
              {isSuccess ? (
                <CheckCircle size={iconSize} style={{ color: '#10b981' }} />
              ) : (
                <AlertCircle size={iconSize} style={{ color: '#ef4444' }} />
              )}
              <h3 style={{ fontSize: isMobile ? '1rem' : '1.5rem' }}>
                {isSuccess ? t('verificationSuccessful') : t('verificationFailed')}
              </h3>
              <p style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>
                {message || (isSuccess 
                  ? t('verificationSuccessMessage')
                  : t('verificationFailedMessage')
                )}
              </p>
              {!isSuccess && (
                <div style={{ marginTop: '20px' }}>
                  <p style={{ fontSize: isMobile ? '0.7rem' : '0.9rem', marginBottom: '12px', color: '#6b7280' }}>
                    {t('verificationHelpMessage')}
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="auth-submit-btn"
                style={{ marginTop: '20px' }}
              >
                {isSuccess ? t('continueToHome') : t('close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationStatusModal;
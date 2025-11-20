import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, CheckCircle, AlertCircle, Mail
} from 'lucide-react';
import './AuthModal.css';

const VerificationStatusModal = ({ isOpen, onClose, status, message }) => {
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
      className="auth-modal-overlay" 
      onClick={handleClose}
      onKeyDown={handleKeyDown}
    >
      <div className="auth-modal-container" onClick={(e) => e.stopPropagation()}>
        <button 
          className="auth-modal-close" 
          onClick={handleClose}
          aria-label="Close modal"
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
              {isSuccess ? 'Email Verified!' : 'Verification Failed'}
            </h2>
            <p style={{ fontSize: isMobile ? '0.72rem' : '1.25rem' }}>
              {isSuccess 
                ? 'Your email has been successfully verified. You can now access all features.'
                : 'We encountered an issue verifying your email address.'
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
                {isSuccess ? 'Verification Successful!' : 'Verification Failed'}
              </h3>
              <p style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>
                {message || (isSuccess 
                  ? 'Your email address has been verified successfully. You can now enjoy all the features of GradJob.'
                  : 'The verification link may have expired or is invalid. Please request a new verification email.'
                )}
              </p>
              {!isSuccess && (
                <div style={{ marginTop: '20px' }}>
                  <p style={{ fontSize: isMobile ? '0.7rem' : '0.9rem', marginBottom: '12px', color: '#6b7280' }}>
                    Need help? You can request a new verification email from your dashboard.
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="auth-submit-btn"
                style={{ marginTop: '20px' }}
              >
                {isSuccess ? 'Continue to Home' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationStatusModal;


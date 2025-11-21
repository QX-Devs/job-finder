// frontend/src/components/ResetPasswordModal.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle
} from 'lucide-react';
import authService from '../services/authService';
import { useTranslate } from '../utils/translate';
import './AuthModal.css';

const ResetPasswordModal = ({ isOpen, onClose, token }) => {
  const { t, isRTL } = useTranslate();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 480 : false
  );

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  const iconSize18 = isMobile ? 10 : 18;
  const arrowButtonSize = isMobile ? 12 : 20;

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

  // Reset form when modal closes
  const resetForm = () => {
    setFormData({ password: '', confirmPassword: '' });
    setErrors({});
    setError('');
    setSuccess(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setTouchedFields({});
  };

  const handleClose = () => {
    resetForm();
    // Remove token from URL
    navigate('/', { replace: true });
    onClose();
  };

  // Handle field blur for real-time validation
  const handleFieldBlur = (fieldName) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    validateField(fieldName);
  };

  // Validate individual field
  const validateField = (fieldName) => {
    const newErrors = { ...errors };

    if (fieldName === 'password') {
      if (!formData.password) {
        newErrors.password = t('requiredField');
      } else if (formData.password.length < 8) {
        newErrors.password = t('passwordTooShort');
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = t('passwordRequirements');
      } else {
        delete newErrors.password;
      }
    }

    if (fieldName === 'confirmPassword') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = t('confirmPasswordRequired');
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t('passwordsDontMatch');
      } else {
        delete newErrors.confirmPassword;
      }
    }

    setErrors(newErrors);
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = t('passwordTooShort');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = t('passwordRequirements');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordsDontMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError(t('invalidResetToken'));
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await authService.resetPassword(token, formData.password);
      
      if (response.success) {
        setSuccess(true);
        // Auto close after 3 seconds
        setTimeout(() => {
          handleClose();
        }, 3000);
      }
    } catch (err) {
      setError(err.message || t('resetPasswordFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard events
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

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
              <Lock size={isMobile ? 20 : 48} strokeWidth={2.5} />
            </div>
            <h2 style={{ fontSize: isMobile ? '1.05rem' : '2.75rem' }}>{t('resetPassword')}</h2>
            <p style={{ fontSize: isMobile ? '0.72rem' : '1.25rem' }}>
              {t('resetPasswordSubtitle')}
            </p>
          </div>

          {/* Right Side - Form */}
          <div className="auth-modal-form-container">
            {success ? (
              <div className="forgot-password-success">
                <CheckCircle size={isMobile ? 32 : 48} />
                <h3 style={{ fontSize: isMobile ? '1rem' : '1.5rem' }}>{t('passwordResetSuccessful')}</h3>
                <p style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>
                  {t('passwordResetSuccessMessage')}
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: isMobile ? '1.1rem' : '1.75rem', fontWeight: 700, marginBottom: '10px' }}>
                    {t('createNewPassword')}
                  </h3>
                  <p style={{ fontSize: isMobile ? '0.8rem' : '1rem', color: '#6b7280', marginBottom: '24px' }}>
                    {t('createNewPasswordDesc')}
                  </p>
                </div>

                {error && (
                  <div className="auth-error-banner" role="alert">
                    <AlertCircle size={iconSize18} style={{ marginRight: '8px' }} />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                  <div className="form-group">
                    <label htmlFor="reset-password">
                      <Lock size={iconSize18} />
                      {t('newPassword')}
                    </label>
                    <div className="password-input">
                      <input
                        id="reset-password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          // Revalidate confirm password if it's already filled
                          if (formData.confirmPassword && touchedFields.confirmPassword) {
                            setTimeout(() => validateField('confirmPassword'), 0);
                          }
                        }}
                        onBlur={() => handleFieldBlur('password')}
                        placeholder={t('enterNewPassword')}
                        className={errors.password && touchedFields.password ? 'error' : ''}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                      >
                        {showPassword ? <EyeOff size={iconSize18} /> : <Eye size={iconSize18} />}
                      </button>
                    </div>
                    {errors.password && touchedFields.password && (
                      <span className="error-message" role="alert">{errors.password}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="reset-confirm-password">
                      <Lock size={iconSize18} />
                      {t('confirmNewPassword')}
                    </label>
                    <div className="password-input">
                      <input
                        id="reset-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        onBlur={() => handleFieldBlur('confirmPassword')}
                        placeholder={t('confirmYourPassword')}
                        className={errors.confirmPassword && touchedFields.confirmPassword ? 'error' : ''}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? t('hidePassword') : t('showPassword')}
                      >
                        {showConfirmPassword ? <EyeOff size={iconSize18} /> : <Eye size={iconSize18} />}
                      </button>
                    </div>
                    {errors.confirmPassword && touchedFields.confirmPassword && (
                      <span className="error-message" role="alert">{errors.confirmPassword}</span>
                    )}
                  </div>

                  <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <span className="spinner"></span>
                        {t('resettingPassword')}
                      </>
                    ) : (
                      <>
                        {t('resetPassword')}
                        <ArrowRight size={arrowButtonSize} />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordModal;
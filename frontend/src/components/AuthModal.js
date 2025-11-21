// frontend/src/components/AuthModal.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Mail, Lock, User, Eye, EyeOff, 
  CheckCircle, ArrowRight, Sparkles, Shield,
  Zap, TrendingUp, ArrowLeft
} from 'lucide-react';
import authService from '../services/authService';
import './AuthModal.css';
import { useTranslate } from '../utils/translate';
import { useLanguage } from '../context/LanguageContext';

const AuthModal = ({ isOpen, onClose, defaultTab = 'login', onSuccess }) => {
  const { t, isRTL } = useTranslate();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Signup form state
  const [signupData, setSignupData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 480 : false
  );
  const iconSize18 = isMobile ? 10 : 18;
  const iconSize22 = isMobile ? 14 : 22;
  const largeBrandIconSize = isMobile ? 20 : 48;
  const arrowButtonSize = isMobile ? 12 : 20;
  const benefitItemStyle = {
    padding: isMobile ? '6px 10px' : '18px 20px',
    fontSize: isMobile ? '0.65rem' : '1.05rem'
  };
  const authFooterStyle = { fontSize: isMobile ? '0.7rem' : '0.95rem' };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update default tab when prop changes
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

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

  // Reset form when modal closes or tab changes
  const resetForm = () => {
    setLoginData({ email: '', password: '' });
    setSignupData({ fullName: '', email: '', password: '', confirmPassword: '' });
    setErrors({});
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setTouchedFields({});
    setShowForgotPassword(false);
    setForgotPasswordEmail('');
    setForgotPasswordSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    resetForm();
  };

  // Handle forgot password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');

    // Validate email
    if (!forgotPasswordEmail.trim()) {
      setError(t('requiredField'));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordEmail)) {
      setError(t('invalidEmailFormat'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(forgotPasswordEmail);
      
      if (response.success) {
        setForgotPasswordSuccess(true);
        setError('');
      }
    } catch (err) {
      // Even if there's an error, show success message (backend always returns success)
      setForgotPasswordSuccess(true);
      setError('');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle field blur for real-time validation
  const handleFieldBlur = (fieldName, tab) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    
    if (tab === 'login') {
      validateLoginField(fieldName);
    } else {
      validateSignupField(fieldName);
    }
  };

  // Validate individual login field
  const validateLoginField = (fieldName) => {
    const newErrors = { ...errors };
    
    if (fieldName === 'email') {
      if (!loginData.email.trim()) {
        newErrors.email = t('requiredField');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
        newErrors.email = t('invalidEmailFormat');
      } else {
        delete newErrors.email;
      }
    }
    
    if (fieldName === 'password') {
      if (!loginData.password) {
        newErrors.password = t('requiredField');
      } else {
        delete newErrors.password;
      }
    }
    
    setErrors(newErrors);
  };

  // Validate individual signup field
  const validateSignupField = (fieldName) => {
    const newErrors = { ...errors };

    if (fieldName === 'fullName') {
      if (!signupData.fullName.trim() || signupData.fullName.trim().length < 2) {
        newErrors.fullName = t('nameTooShort');
      } else {
        delete newErrors.fullName;
      }
    }

    if (fieldName === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!signupData.email.trim()) {
        newErrors.email = t('requiredField');
      } else if (!emailRegex.test(signupData.email)) {
        newErrors.email = t('invalidEmailFormat');
      } else {
        delete newErrors.email;
      }
    }

    if (fieldName === 'password') {
      if (!signupData.password) {
        newErrors.password = t('requiredField');
      } else if (signupData.password.length < 8) {
        newErrors.password = t('passwordTooShort');
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(signupData.password)) {
        newErrors.password = t('passwordRequirements');
      } else {
        delete newErrors.password;
      }
    }

    if (fieldName === 'confirmPassword') {
      if (!signupData.confirmPassword) {
        newErrors.confirmPassword = t('confirmPasswordRequired');
      } else if (signupData.password !== signupData.confirmPassword) {
        newErrors.confirmPassword = t('passwordsDontMatch');
      } else {
        delete newErrors.confirmPassword;
      }
    }

    setErrors(newErrors);
  };

  // Validate entire login form
  const validateLogin = () => {
    const newErrors = {};
    
    if (!loginData.email.trim()) {
      newErrors.email = t('requiredField');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
      newErrors.email = t('invalidEmailFormat');
    }
    
    if (!loginData.password) {
      newErrors.password = t('requiredField');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate entire signup form
  const validateSignup = () => {
    const newErrors = {};

    if (!signupData.fullName.trim() || signupData.fullName.trim().length < 2) {
      newErrors.fullName = t('nameTooShort');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!signupData.email.trim() || !emailRegex.test(signupData.email)) {
      newErrors.email = t('invalidEmailFormat');
    }

    if (!signupData.password || signupData.password.length < 8) {
      newErrors.password = t('passwordTooShort');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(signupData.password)) {
      newErrors.password = t('passwordRequirements');
    }

    if (!signupData.confirmPassword) {
      newErrors.confirmPassword = t('confirmPasswordRequired');
    } else if (signupData.password !== signupData.confirmPassword) {
      newErrors.confirmPassword = t('passwordsDontMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateLogin()) return;

    setIsLoading(true);

    try {
      const response = await authService.login(loginData.email, loginData.password);
      
      if (response.success) {
        handleClose();
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.message || t('loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateSignup()) return;

    setIsLoading(true);

    try {
      const response = await authService.register({
        fullName: signupData.fullName,
        email: signupData.email,
        password: signupData.password
      });

      if (response.success) {
        handleClose();
        navigate('/cv-prompt');
      }
    } catch (err) {
      setError(err.message || t('registrationFailed'));
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
          {/* Left Side - Enhanced Branding */}
          <div className="auth-modal-brand">
            <div className="brand-logo">
              <Sparkles size={largeBrandIconSize} strokeWidth={2.5} />
            </div>
            <h2 style={{ fontSize: isMobile ? '1.05rem' : '2.75rem' }}>{t('welcomeToGradJob')}</h2>
            <p style={{ fontSize: isMobile ? '0.72rem' : '1.25rem' }}>
              {t('loginSubtitle')}
            </p>
            
            {!isMobile && (
            <div className="brand-benefits">
              <div className="benefit-item" style={benefitItemStyle}>
                <Zap size={iconSize22} />
                <span>{t('aiPowered')}</span>
              </div>
              <div className="benefit-item" style={benefitItemStyle}>
                <TrendingUp size={iconSize22} />
                <span>{t('aiMatching')}</span>
              </div>
              <div className="benefit-item" style={benefitItemStyle}>
                <ArrowRight size={iconSize22} />
                <span>{t('instantApplications')}</span>
              </div>
              <div className="benefit-item" style={benefitItemStyle}>
                <Shield size={iconSize22} />
                <span>{t('secure')}</span>
              </div>
            </div>
            )}
          </div>

          {/* Right Side - Enhanced Forms */}
          <div className="auth-modal-form-container">
            {/* Tab Switcher */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => handleTabChange('login')}
                type="button"
              >
                {t('login')}
              </button>
              <button
                className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
                onClick={() => handleTabChange('signup')}
                type="button"
              >
                {t('signup')}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="auth-error-banner" role="alert">
                {error}
              </div>
            )}

            {/* Forgot Password Form */}
            {activeTab === 'login' && showForgotPassword && (
              <div className="auth-form">
                {forgotPasswordSuccess ? (
                  <div className="forgot-password-success">
                    <CheckCircle size={isMobile ? 32 : 48} />
                    <h3 style={{ fontSize: isMobile ? '1rem' : '1.5rem' }}>{t('checkYourEmail')}</h3>
                    <p style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>
                      {t('resetLinkSent')}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordSuccess(false);
                        setForgotPasswordEmail('');
                      }}
                      className="auth-submit-btn"
                      style={{ marginTop: '20px' }}
                    >
                      <ArrowLeft size={arrowButtonSize} />
                      {t('backToLogin')}
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '20px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setForgotPasswordEmail('');
                          setError('');
                        }}
                        className="link-btn"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}
                      >
                        <ArrowLeft size={iconSize18} />
                        {t('backToLogin')}
                      </button>
                      <h3 style={{ fontSize: isMobile ? '1.1rem' : '1.75rem', fontWeight: 700, marginBottom: '10px' }}>
                        {t('forgotPasswordTitle')}
                      </h3>
                      <p style={{ fontSize: isMobile ? '0.8rem' : '1rem', color: '#6b7280', marginBottom: '24px' }}>
                        {t('forgotPasswordSubtitle')}
                      </p>
                    </div>

                    {error && (
                      <div className="auth-error-banner" role="alert">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleForgotPassword} className="auth-form" noValidate>
                      <div className="form-group">
                        <label htmlFor="forgot-email">
                          <Mail size={iconSize18} />
                          {t('emailAddress')}
                        </label>
                        <input
                          id="forgot-email"
                          type="email"
                          value={forgotPasswordEmail}
                          onChange={(e) => setForgotPasswordEmail(e.target.value)}
                          placeholder={t('enterEmail')}
                          autoComplete="email"
                          required
                        />
                      </div>

                      <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <span className="spinner"></span>
                            {t('sending')}
                          </>
                        ) : (
                          <>
                            {t('sendResetLink')}
                            <ArrowRight size={arrowButtonSize} />
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}

            {/* Login Form */}
            {activeTab === 'login' && !showForgotPassword && (
              <form onSubmit={handleLogin} className="auth-form" noValidate>
                <div className="form-group">
                  <label htmlFor="login-email">
                    <Mail size={iconSize18} />
                    {t('emailAddress')}
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    onBlur={() => handleFieldBlur('email', 'login')}
                    placeholder={t('enterEmail')}
                    className={errors.email && touchedFields.email ? 'error' : ''}
                    autoComplete="email"
                  />
                  {errors.email && touchedFields.email && (
                    <span className="error-message" role="alert">{errors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="login-password">
                    <Lock size={iconSize18} />
                    {t('password')}
                  </label>
                  <div className="password-input">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      onBlur={() => handleFieldBlur('password', 'login')}
                      placeholder={t('enterPassword')}
                      className={errors.password && touchedFields.password ? 'error' : ''}
                      autoComplete="current-password"
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

                <div style={{ textAlign: 'right', marginTop: '-8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setError('');
                    }}
                    className="link-btn"
                    style={{ fontSize: isMobile ? '0.7rem' : '0.9rem' }}
                  >
                    {t('forgotPassword')}
                  </button>
                </div>

                <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      {t('loggingIn')}
                    </>
                  ) : (
                    <>
                      {t('loginButton')}
                      <ArrowRight size={arrowButtonSize} />
                    </>
                  )}
                </button>

                <div className="auth-footer" style={authFooterStyle}>
                  {t('dontHaveAccount')}{' '}
                  <button 
                    type="button" 
                    onClick={() => handleTabChange('signup')} 
                    className="link-btn"
                  >
                    {t('signup')}
                  </button>
                </div>
              </form>
            )}

            {/* Signup Form */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignup} className="auth-form" noValidate>
                <div className="form-group">
                  <label htmlFor="signup-name">
                    <User size={iconSize18} />
                    {t('fullName')}
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    onBlur={() => handleFieldBlur('fullName', 'signup')}
                    placeholder={t('enterFullName')}
                    className={errors.fullName && touchedFields.fullName ? 'error' : ''}
                    autoComplete="name"
                  />
                  {errors.fullName && touchedFields.fullName && (
                    <span className="error-message" role="alert">{errors.fullName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="signup-email">
                    <Mail size={iconSize18} />
                    {t('emailAddress')}
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    onBlur={() => handleFieldBlur('email', 'signup')}
                    placeholder={t('enterEmail')}
                    className={errors.email && touchedFields.email ? 'error' : ''}
                    autoComplete="email"
                  />
                  {errors.email && touchedFields.email && (
                    <span className="error-message" role="alert">{errors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="signup-password">
                    <Lock size={iconSize18} />
                    {t('password')}
                  </label>
                  <div className="password-input">
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      value={signupData.password}
                      onChange={(e) => {
                        setSignupData({ ...signupData, password: e.target.value });
                        // Revalidate confirm password if it's already filled
                        if (signupData.confirmPassword && touchedFields.confirmPassword) {
                          setTimeout(() => validateSignupField('confirmPassword'), 0);
                        }
                      }}
                      onBlur={() => handleFieldBlur('password', 'signup')}
                      placeholder={t('createStrongPassword')}
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
                  <label htmlFor="signup-confirm-password">
                    <Lock size={iconSize18} />
                    {t('confirmPassword')}
                  </label>
                  <div className="password-input">
                    <input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      onBlur={() => handleFieldBlur('confirmPassword', 'signup')}
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
                      {t('creatingAccount')}
                    </>
                  ) : (
                    <>
                      {t('createAccount')}
                      <ArrowRight size={arrowButtonSize} />
                    </>
                  )}
                </button>

                <div className="auth-footer" style={authFooterStyle}>
                  {t('alreadyHaveAccount')}{' '}
                  <button 
                    type="button" 
                    onClick={() => handleTabChange('login')} 
                    className="link-btn"
                  >
                    {t('loginHere')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
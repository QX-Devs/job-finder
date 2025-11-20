import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Mail, Lock, User, Eye, EyeOff, 
  CheckCircle, ArrowRight, Sparkles, Shield,
  Zap, TrendingUp
} from 'lucide-react';
import authService from '../services/authService';
import './AuthModal.css';
import { useTranslate } from '../utils/translate'; // <<< استيراد دالة الترجمة

const AuthModal = ({ isOpen, onClose, defaultTab = 'login', onSuccess }) => {
  const { t, isRTL, language, toggleLanguage } = useTranslate(); // <<< استخدام الترجمة
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    resetForm();
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
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
        newErrors.email = 'Please enter a valid email';
      } else {
        delete newErrors.email;
      }
    }
    
    if (fieldName === 'password') {
      if (!loginData.password) {
        newErrors.password = 'Password is required';
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
        newErrors.fullName = 'Name must be at least 2 characters';
      } else {
        delete newErrors.fullName;
      }
    }

    if (fieldName === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!signupData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!emailRegex.test(signupData.email)) {
        newErrors.email = 'Please enter a valid email address';
      } else {
        delete newErrors.email;
      }
    }

    if (fieldName === 'password') {
      if (!signupData.password) {
        newErrors.password = 'Password is required';
      } else if (signupData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(signupData.password)) {
        newErrors.password = 'Must contain uppercase, lowercase, and number';
      } else {
        delete newErrors.password;
      }
    }

    if (fieldName === 'confirmPassword') {
      if (!signupData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (signupData.password !== signupData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
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
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!loginData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate entire signup form
  const validateSignup = () => {
    const newErrors = {};

    if (!signupData.fullName.trim() || signupData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!signupData.email.trim() || !emailRegex.test(signupData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!signupData.password || signupData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(signupData.password)) {
      newErrors.password = 'Must contain uppercase, lowercase, and number';
    }

    if (!signupData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (signupData.password !== signupData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      setError(err.message || 'Login failed. Please check your credentials and try again.');
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
      setError(err.message || 'Registration failed. Please try again.');
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
          {/* Left Side - Enhanced Branding */}
          <div className="auth-modal-brand">
            <div className="brand-logo">
              <Sparkles size={largeBrandIconSize} strokeWidth={2.5} />
            </div>
            <h2 style={{ fontSize: isMobile ? '1.05rem' : '2.75rem' }}>Welcome to GradJob</h2>
            <p style={{ fontSize: isMobile ? '0.72rem' : '1.25rem' }}>
              Your gateway to thousands of career opportunities tailored just for you
            </p>
            
            {!isMobile && (
            <div className="brand-benefits">
              <div className="benefit-item" style={benefitItemStyle}>
                <Zap size={iconSize22} />
                <span>AI-Powered Resume Builder</span>
              </div>
              <div className="benefit-item" style={benefitItemStyle}>
                <TrendingUp size={iconSize22} />
                <span>Smart Job Matching Algorithm</span>
              </div>
              <div className="benefit-item" style={benefitItemStyle}>
                <ArrowRight size={iconSize22} />
                <span>One-Click Application Process</span>
              </div>
              <div className="benefit-item" style={benefitItemStyle}>
                <Shield size={iconSize22} />
                <span>Secure & Privacy Protected</span>
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
                Login
              </button>
              <button
                className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
                onClick={() => handleTabChange('signup')}
                type="button"
              >
                Sign Up
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="auth-error-banner" role="alert">
                {error}
              </div>
            )}

            {/* Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="auth-form" noValidate>
                <div className="form-group">
                  <label htmlFor="login-email">
                    <Mail size={iconSize18} />
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    onBlur={() => handleFieldBlur('email', 'login')}
                    placeholder="Enter your email"
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
                    Password
                  </label>
                  <div className="password-input">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      onBlur={() => handleFieldBlur('password', 'login')}
                      placeholder="Enter your password"
                      className={errors.password && touchedFields.password ? 'error' : ''}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={iconSize18} /> : <Eye size={iconSize18} />}
                    </button>
                  </div>
                  {errors.password && touchedFields.password && (
                    <span className="error-message" role="alert">{errors.password}</span>
                  )}
                </div>

                <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Logging in...
                    </>
                  ) : (
                    <>
                      Login
                      <ArrowRight size={arrowButtonSize} />
                    </>
                  )}
                </button>

                <div className="auth-footer" style={authFooterStyle}>
                  Don't have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => handleTabChange('signup')} 
                    className="link-btn"
                  >
                    Sign up now
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
                    Full Name
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    onBlur={() => handleFieldBlur('fullName', 'signup')}
                    placeholder="Enter your full name"
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
                    Email Address
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    onBlur={() => handleFieldBlur('email', 'signup')}
                    placeholder="Enter your email"
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
                    Password
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
                      placeholder="Create a strong password"
                      className={errors.password && touchedFields.password ? 'error' : ''}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                    Confirm Password
                  </label>
                  <div className="password-input">
                    <input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      onBlur={() => handleFieldBlur('confirmPassword', 'signup')}
                      placeholder="Confirm your password"
                      className={errors.confirmPassword && touchedFields.confirmPassword ? 'error' : ''}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
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
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight size={arrowButtonSize} />
                    </>
                  )}
                </button>

                <div className="auth-footer" style={authFooterStyle}>
                  Already have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => handleTabChange('login')} 
                    className="link-btn"
                  >
                    Login here
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
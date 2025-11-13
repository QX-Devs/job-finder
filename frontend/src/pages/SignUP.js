import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import authService from '../services/authService';
import { User, Mail, Lock, Phone, Eye, EyeOff, CheckCircle } from 'lucide-react';
import './SignUP.css';

const SignUP = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = t('fullNameRequired');
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = t('nameTooShort');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = t('requiredField');
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t('validEmail');
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = t('phoneRequired');
    } else if (!phoneRegex.test(formData.phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = t('invalidPhone');
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t('requiredField');
    } else if (formData.password.length < 8) {
      newErrors.password = t('passwordTooShort');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = t('passwordRequirements');
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordsDontMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Register user with basic info only
      const response = await authService.register({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone
      });

      if (response.success) {
        // After successful registration, navigate to CV prompt page
        navigate('/cv-prompt');
      }
    } catch (error) {
      setApiError(error.message || t('registrationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <div className="logo-circle">
            <CheckCircle size={40} />
          </div>
          <h1>{t('createAccount')}</h1>
          <p>{t('joinGradJob')}</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="fullName">
              <User size={18} />
              {t('fullName')}
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder={t('enterFullName')}
              className={errors.fullName ? 'error' : ''}
            />
            {errors.fullName && <span className="error-message">{errors.fullName}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">
              <Mail size={18} />
              {t('email')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('enterEmail')}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label htmlFor="phone">
              <Phone size={18} />
              {t('phoneNumber')}
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder={t('enterPhone')}
              className={errors.phone ? 'error' : ''}
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">
              <Lock size={18} />
              {t('password')}
            </label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t('createStrongPassword')}
                className={errors.password ? 'error' : ''}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">
              <Lock size={18} />
              {t('confirmPassword')}
            </label>
            <div className="password-input">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder={t('confirmYourPassword')}
                className={errors.confirmPassword ? 'error' : ''}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          {/* API Error */}
          {apiError && (
            <div className="api-error">
              {apiError}
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                {t('creatingAccount')}
              </>
            ) : (
              <>
                {t('createAccount')}
              </>
            )}
          </button>

          {/* Login Link */}
          <div className="form-footer">
            {t('alreadyHaveAccount')} <a href="/login">{t('loginHere')}</a>
          </div>
        </form>
      </div>

      {/* Side Panel */}
      <div className="signup-side-panel">
        <div className="panel-content">
          <h2>{t('welcomeToGradJob')}</h2>
          <div className="benefits">
            <div className="benefit-item">
              <CheckCircle size={24} />
              <div>
                <h3>{t('buildYourCV')}</h3>
                <p>{t('buildCVDesc')}</p>
              </div>
            </div>
            <div className="benefit-item">
              <CheckCircle size={24} />
              <div>
                <h3>{t('findJobs')}</h3>
                <p>{t('findJobsDesc')}</p>
              </div>
            </div>
            <div className="benefit-item">
              <CheckCircle size={24} />
              <div>
                <h3>{t('aiPowered')}</h3>
                <p>{t('aiPoweredDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUP;
import React, { useState, useMemo, useCallback } from 'react';
import { 
  ArrowRight, ArrowLeft, Check, Plus, X, 
  Sparkles, MapPin, GraduationCap, Briefcase, Code, 
  RotateCcw, Star, Eye, EyeOff, Mail, Lock, User, Phone
} from 'lucide-react';
import './SignUP.css';

const SignUP = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState('forward');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1 - Sign Up Info
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    countryCode: '+962',
    
    // Step 2 - Location & Status
    location: '',
    employmentStatus: '',
    
    // Step 3 - Education
    education: [{ id: 1, degree: '', institution: '', major: '', graduationYear: '' }],
    
    // Step 4 - Experience
    experience: [{ id: 1, jobTitle: '', company: '', startDate: '', endDate: '', description: '' }],
    
    // Step 5 - Skills & Goals
    skills: [],
    careerObjective: '',
    resumeVisibility: 'private'
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigateStep = useCallback((newStep) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setDirection(newStep > currentStep ? 'forward' : 'backward');
    
    setTimeout(() => {
      setCurrentStep(newStep);
      setTimeout(() => setIsTransitioning(false), 300);
    }, 400);
  }, [isTransitioning, currentStep]);

  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const handleEducationChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.education];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, education: updated };
    });
  }, []);

  const addEducation = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { id: Date.now(), degree: '', institution: '', major: '', graduationYear: '' }]
    }));
  }, []);

  const removeEducation = useCallback((index) => {
    setFormData(prev => {
      if (prev.education.length <= 1) return prev;
      return { ...prev, education: prev.education.filter((_, i) => i !== index) };
    });
  }, []);

  const handleExperienceChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.experience];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, experience: updated };
    });
  }, []);

  const addExperience = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { id: Date.now(), jobTitle: '', company: '', startDate: '', endDate: '', description: '' }]
    }));
  }, []);

  const removeExperience = useCallback((index) => {
    setFormData(prev => {
      if (prev.experience.length <= 1) return prev;
      return { ...prev, experience: prev.experience.filter((_, i) => i !== index) };
    });
  }, []);

  const handleSkillAdd = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (newSkill.trim()) {
        setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
        setNewSkill('');
      }
    }
  }, [newSkill]);

  const removeSkill = useCallback((index) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }));
  }, []);

  const validateStep = useCallback((step) => {
    const newErrors = {};
    
    switch(step) {
      case 1:
        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Invalid email format';
        }
        if (!formData.password) {
          newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        break;
      case 2:
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        if (!formData.employmentStatus) newErrors.employmentStatus = 'Employment status is required';
        break;
      case 3:
        formData.education.forEach((edu, index) => {
          if (!edu.degree.trim()) newErrors[`education-${index}-degree`] = 'Degree is required';
          if (!edu.institution.trim()) newErrors[`education-${index}-institution`] = 'Institution is required';
        });
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep === 5) {
        setShowConfirmation(true);
      } else {
        navigateStep(currentStep + 1);
      }
    }
  }, [currentStep, validateStep, navigateStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) navigateStep(currentStep - 1);
  }, [currentStep, navigateStep]);

  const handleFinish = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert('Account created successfully!');
      // Redirect to home or login
      // window.location.href = '/home';
    }, 2000);
  }, []);

  const editStep = useCallback((step) => {
    setShowConfirmation(false);
    navigateStep(step);
  }, [navigateStep]);

  const handleFormSubmit = useCallback((e) => {
    e.preventDefault();
  }, []);

  const Step1 = useMemo(() => (
    <div className="step-content">
      <div className="step-header">
        <Star className="step-icon" size={40} />
        <h2>Create Your Account</h2>
        <p>Join GradJob and start building your career today</p>
      </div>
      
      <div className="form-fields">
        <div className="input-group">
          <label>Full Name *</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => updateFormData('fullName', e.target.value)}
            className={errors.fullName ? 'error' : ''}
            placeholder="Enter your full name"
          />
          {errors.fullName && <span className="error-message">{errors.fullName}</span>}
        </div>

        <div className="input-group">
          <label>Email Address *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            className={errors.email ? 'error' : ''}
            placeholder="your.email@example.com"
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <div className="input-group">
          <label>Password *</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => updateFormData('password', e.target.value)}
              className={errors.password ? 'error' : ''}
              placeholder="Create a strong password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>

        <div className="input-group">
          <label>Confirm Password *</label>
          <div className="password-input-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => updateFormData('confirmPassword', e.target.value)}
              className={errors.confirmPassword ? 'error' : ''}
              placeholder="Re-enter your password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
        </div>

        <div className="input-group">
          <label>Phone Number *</label>
          <div className="phone-input">
            <select 
              value={formData.countryCode}
              onChange={(e) => updateFormData('countryCode', e.target.value)}
            >
              <option value="+1">+1 (US)</option>
              <option value="+44">+44 (UK)</option>
              <option value="+61">+61 (AU)</option>
              <option value="+962">+962 (JO)</option>
            </select>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateFormData('phone', e.target.value)}
              className={errors.phone ? 'error' : ''}
              placeholder="Phone number"
            />
          </div>
          {errors.phone && <span className="error-message">{errors.phone}</span>}
        </div>
      </div>
    </div>
  ), [formData.fullName, formData.email, formData.password, formData.confirmPassword, formData.phone, formData.countryCode, errors, showPassword, showConfirmPassword, updateFormData]);

  const Step2 = useMemo(() => (
    <div className="step-content">
      <div className="step-header">
        <MapPin className="step-icon" size={40} />
        <h2>Tell us where you are</h2>
        <p>Help us find opportunities in your area</p>
      </div>
      
      <div className="form-fields">
        <div className="input-group">
          <label>Location (City, Country) *</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => updateFormData('location', e.target.value)}
            className={errors.location ? 'error' : ''}
            placeholder="e.g., Amman, Jordan"
          />
          {errors.location && <span className="error-message">{errors.location}</span>}
        </div>

        <div className="input-group">
          <label>Employment Status *</label>
          <div className="radio-group">
            {['Graduate', 'Student', 'Experienced'].map(status => (
              <label key={status} className="radio-option">
                <input
                  type="radio"
                  name="employmentStatus"
                  value={status}
                  checked={formData.employmentStatus === status}
                  onChange={(e) => updateFormData('employmentStatus', e.target.value)}
                />
                <span>{status}</span>
              </label>
            ))}
          </div>
          {errors.employmentStatus && <span className="error-message">{errors.employmentStatus}</span>}
        </div>
      </div>
    </div>
  ), [formData.location, formData.employmentStatus, errors, updateFormData]);

  const Step3 = useMemo(() => (
    <div className="step-content">
      <div className="step-header">
        <GraduationCap className="step-icon" size={40} />
        <h2>Add your education background</h2>
        <p>Start with your most recent education first</p>
      </div>
      
      <div className="form-fields">
        {formData.education.map((edu, index) => (
          <div key={edu.id} className="repeatable-block">
            <div className="block-header">
              <span>Education #{index + 1}</span>
              {formData.education.length > 1 && (
                <button type="button" onClick={() => removeEducation(index)} className="remove-btn">
                  <X size={16} />
                </button>
              )}
            </div>
            
            <div className="block-grid">
              <div className="input-group">
                <label>Degree *</label>
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                  className={errors[`education-${index}-degree`] ? 'error' : ''}
                  placeholder="e.g., Bachelor of Science"
                />
                {errors[`education-${index}-degree`] && <span className="error-message">{errors[`education-${index}-degree`]}</span>}
              </div>
              
              <div className="input-group">
                <label>Institution *</label>
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                  className={errors[`education-${index}-institution`] ? 'error' : ''}
                  placeholder="University name"
                />
                {errors[`education-${index}-institution`] && <span className="error-message">{errors[`education-${index}-institution`]}</span>}
              </div>
              
              <div className="input-group">
                <label>Major/Field</label>
                <input
                  type="text"
                  value={edu.major}
                  onChange={(e) => handleEducationChange(index, 'major', e.target.value)}
                  placeholder="Your field of study"
                />
              </div>
              
              <div className="input-group">
                <label>Graduation Year</label>
                <input
                  type="number"
                  value={edu.graduationYear}
                  onChange={(e) => handleEducationChange(index, 'graduationYear', e.target.value)}
                  placeholder="2024"
                  min="1900"
                  max="2030"
                />
              </div>
            </div>
          </div>
        ))}
        
        <button type="button" onClick={addEducation} className="add-block-btn">
          <Plus size={18} />
          Add Another Education
        </button>
      </div>
    </div>
  ), [formData.education, errors, handleEducationChange, removeEducation, addEducation]);

  const Step4 = useMemo(() => (
    <div className="step-content">
      <div className="step-header">
        <Briefcase className="step-icon" size={40} />
        <h2>Highlight your experience</h2>
        <p>Showcase your professional journey (optional)</p>
      </div>
      
      <div className="form-fields">
        {formData.experience.map((exp, index) => (
          <div key={exp.id} className="repeatable-block">
            <div className="block-header">
              <span>Experience #{index + 1}</span>
              {formData.experience.length > 1 && (
                <button type="button" onClick={() => removeExperience(index)} className="remove-btn">
                  <X size={16} />
                </button>
              )}
            </div>
            
            <div className="block-grid">
              <div className="input-group">
                <label>Job Title</label>
                <input
                  type="text"
                  value={exp.jobTitle}
                  onChange={(e) => handleExperienceChange(index, 'jobTitle', e.target.value)}
                  placeholder="e.g., Software Engineer"
                />
              </div>
              
              <div className="input-group">
                <label>Company</label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                  placeholder="Company name"
                />
              </div>
              
              <div className="input-group">
                <label>Start Date</label>
                <input
                  type="month"
                  value={exp.startDate}
                  onChange={(e) => handleExperienceChange(index, 'startDate', e.target.value)}
                />
              </div>
              
              <div className="input-group">
                <label>End Date</label>
                <input
                  type="month"
                  value={exp.endDate}
                  onChange={(e) => handleExperienceChange(index, 'endDate', e.target.value)}
                />
              </div>
              
              <div className="input-group textarea-group">
                <label>Description</label>
                <textarea
                  value={exp.description}
                  onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                  placeholder="Describe your responsibilities and achievements"
                  rows="3"
                />
              </div>
            </div>
          </div>
        ))}
        
        <button type="button" onClick={addExperience} className="add-block-btn">
          <Plus size={18} />
          Add Another Experience
        </button>
      </div>
    </div>
  ), [formData.experience, handleExperienceChange, removeExperience, addExperience]);

  const Step5 = useMemo(() => (
    <div className="step-content">
      <div className="step-header">
        <Code className="step-icon" size={40} />
        <h2>Finish with your skills & goals</h2>
        <p>Complete your profile with your strengths and aspirations</p>
      </div>
      
      <div className="form-fields">
        <div className="input-group">
          <label>Skills</label>
          <div className="skills-input">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={handleSkillAdd}
              placeholder="Type a skill and press Enter"
            />
            <button type="button" className="ai-suggest-btn">
              <Sparkles size={16} />
              Suggest
            </button>
          </div>
          
          {formData.skills.length > 0 && (
            <div className="skills-tags">
              {formData.skills.map((skill, index) => (
                <div key={index} className="skill-tag">
                  <span>{skill}</span>
                  <button type="button" onClick={() => removeSkill(index)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="input-group">
          <label>Career Objective</label>
          <textarea
            value={formData.careerObjective}
            onChange={(e) => updateFormData('careerObjective', e.target.value)}
            placeholder="A brief statement about your career goals"
            rows="4"
          />
          <button type="button" className="ai-suggest-btn full-width">
            <Sparkles size={16} />
            Suggest with AI
          </button>
        </div>

        <div className="input-group">
          <label>Resume Visibility</label>
          <div className="toggle-group">
            <label className="toggle-option">
              <input
                type="radio"
                name="resumeVisibility"
                value="public"
                checked={formData.resumeVisibility === 'public'}
                onChange={(e) => updateFormData('resumeVisibility', e.target.value)}
              />
              <span>Public (shareable link)</span>
            </label>
            <label className="toggle-option">
              <input
                type="radio"
                name="resumeVisibility"
                value="private"
                checked={formData.resumeVisibility === 'private'}
                onChange={(e) => updateFormData('resumeVisibility', e.target.value)}
              />
              <span>Private</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  ), [formData.skills, formData.careerObjective, formData.resumeVisibility, newSkill, handleSkillAdd, removeSkill, updateFormData]);

  const ConfirmationStep = useMemo(() => (
    <div className="confirmation-content">
      <div className="confirmation-header">
        <Check className="success-icon" size={56} />
        <h2>Profile Complete!</h2>
        <p>Review your information before creating your account</p>
      </div>
      
      <div className="preview-card">
        <div className="preview-section">
          <h4>Account Information</h4>
          <p><strong>Name:</strong> {formData.fullName}</p>
          <p><strong>Email:</strong> {formData.email}</p>
          <p><strong>Phone:</strong> {formData.countryCode} {formData.phone}</p>
          <p><strong>Location:</strong> {formData.location}</p>
          <p><strong>Status:</strong> {formData.employmentStatus}</p>
        </div>
        
        <div className="preview-section">
          <h4>Education</h4>
          {formData.education.map((edu, index) => (
            <div key={index} className="preview-item">
              <strong>{edu.degree}</strong> at {edu.institution}
              {edu.major && <div>Major: {edu.major}</div>}
              {edu.graduationYear && <div>Graduation: {edu.graduationYear}</div>}
            </div>
          ))}
        </div>
        
        {formData.experience.some(exp => exp.jobTitle) && (
          <div className="preview-section">
            <h4>Experience</h4>
            {formData.experience.map((exp, index) => (
              exp.jobTitle && (
                <div key={index} className="preview-item">
                  <strong>{exp.jobTitle}</strong> at {exp.company}
                  {(exp.startDate || exp.endDate) && (
                    <div className="date-range">
                      {exp.startDate} {exp.endDate && `- ${exp.endDate}`}
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
        )}
        
        {formData.skills.length > 0 && (
          <div className="preview-section">
            <h4>Skills</h4>
            <div className="skills-preview">
              {formData.skills.map((skill, index) => (
                <span key={index} className="skill-preview">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {formData.careerObjective && (
          <div className="preview-section">
            <h4>Career Objective</h4>
            <p>{formData.careerObjective}</p>
          </div>
        )}
      </div>
      
      <div className="edit-links">
        <p>Need to make changes?</p>
        <div className="edit-buttons">
          {[
            { step: 1, label: 'Account Info' },
            { step: 2, label: 'Location' },
            { step: 3, label: 'Education' },
            { step: 4, label: 'Experience' },
            { step: 5, label: 'Skills' }
          ].map(({ step, label }) => (
            <button type="button" key={step} onClick={() => editStep(step)} className="edit-step-btn">
              Edit {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  ), [formData, editStep]);

  const currentStepContent = useMemo(() => {
    if (showConfirmation) return ConfirmationStep;
    switch(currentStep) {
      case 1: return Step1;
      case 2: return Step2;
      case 3: return Step3;
      case 4: return Step4;
      case 5: return Step5;
      default: return Step1;
    }
  }, [currentStep, showConfirmation, Step1, Step2, Step3, Step4, Step5, ConfirmationStep]);

  return (
    <div className="wizard-container">
      <form onSubmit={handleFormSubmit}>
        <div className="progress-container">
          <div className="progress-steps">
            {[1, 2, 3, 4, 5].map(step => (
              <div key={step} className={`step-indicator ${step === currentStep ? 'active' : ''} ${step < currentStep ? 'completed' : ''}`}>
                <div className="step-number">{step < currentStep ? <Check size={16} /> : step}</div>
                <span className="step-label">Step {step}</span>
              </div>
            ))}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${showConfirmation ? 100 : (currentStep - 1) * 25}%` }}
            ></div>
          </div>
        </div>

        <div className={`wizard-card ${direction} ${isTransitioning ? 'transitioning' : ''}`}>
          <div className="card-content">
            {currentStepContent}
          </div>
        </div>

        {!showConfirmation && (
          <div className="navigation-buttons">
            <button 
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="nav-btn back-btn"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            
            <button 
              type="button"
              onClick={handleNext}
              className="nav-btn next-btn"
            >
              {currentStep === 5 ? 'Review' : 'Next'}
              {currentStep !== 5 && <ArrowRight size={18} />}
              {currentStep === 5 && <Check size={18} />}
            </button>
          </div>
        )}

        {showConfirmation && (
          <div className="confirmation-actions">
            <button type="button" onClick={handleFinish} className="finish-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <RotateCcw size={20} className="spinner" />
                  Creating Account...
                </>
              ) : (
                <>
                  <Check size={20} />
                  Create Account & Continue
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default SignUP;
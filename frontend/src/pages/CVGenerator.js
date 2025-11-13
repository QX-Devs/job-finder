import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { 
  User, Briefcase, GraduationCap, Code, Globe, 
  Plus, X, ArrowRight, ArrowLeft, Save, Github, Linkedin, Sparkles
} from 'lucide-react';
import api from '../services/api';
import resumeService from '../services/resumeService';
import './CVGenerator.css';

const CVGenerator = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    github: '',
    linkedin: '',
    experience: [{ 
      position: '', 
      company: '', 
      startDate: '', 
      endDate: '', 
      description: '',
      current: false
    }],
    education: [{ 
      degree: '', 
      institution: '', 
      graduationDate: '',
      fieldOfStudy: ''
    }],
    skills: [],
    languages: [{ language: '', proficiency: 'Professional' }]
  });

  const [newSkill, setNewSkill] = useState('');
  const [errors, setErrors] = useState({});
  const [downloadReadyUrl, setDownloadReadyUrl] = useState('');
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Experience handlers
  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { 
        position: '', 
        company: '', 
        startDate: '', 
        endDate: '', 
        description: '',
        current: false
      }]
    }));
  };

  const updateExperience = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (index) => {
    if (formData.experience.length > 1) {
      setFormData(prev => ({
        ...prev,
        experience: prev.experience.filter((_, i) => i !== index)
      }));
    }
  };

  // Education handlers
  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { 
        degree: '', 
        institution: '', 
        graduationDate: '',
        fieldOfStudy: ''
      }]
    }));
  };

  const updateEducation = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (index) => {
    if (formData.education.length > 1) {
      setFormData(prev => ({
        ...prev,
        education: prev.education.filter((_, i) => i !== index)
      }));
    }
  };

  // Skills handlers
  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  // Language handlers
  const addLanguage = () => {
    setFormData(prev => ({
      ...prev,
      languages: [...prev.languages, { language: '', proficiency: 'Professional' }]
    }));
  };

  const updateLanguage = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.map((lang, i) => 
        i === index ? { ...lang, [field]: value } : lang
      )
    }));
  };

  const removeLanguage = (index) => {
    if (formData.languages.length > 1) {
      setFormData(prev => ({
        ...prev,
        languages: prev.languages.filter((_, i) => i !== index)
      }));
    }
  };

  // Validation
  const validateStep = () => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.title.trim()) newErrors.title = t('titleRequired');
      if (!formData.summary.trim()) newErrors.summary = t('summaryRequired');
    } else if (currentStep === 2) {
      formData.experience.forEach((exp, index) => {
        if (!exp.position.trim()) newErrors[`experience_${index}_position`] = t('positionRequired');
        if (!exp.company.trim()) newErrors[`experience_${index}_company`] = t('companyRequired');
      });
    } else if (currentStep === 3) {
      formData.education.forEach((edu, index) => {
        if (!edu.degree.trim()) newErrors[`education_${index}_degree`] = t('degreeRequired');
        if (!edu.institution.trim()) newErrors[`education_${index}_institution`] = t('institutionRequired');
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation
  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    if (!validateStep()) return;
    try {
      const payload = {
        title: formData.title,
        summary: formData.summary,
        skills: formData.skills,
        experience: formData.experience.map(e => ({
          position: e.position,
          company: e.company,
          startDate: e.startDate,
          endDate: e.endDate,
          description: e.description ? e.description.split('\n').filter(Boolean) : []
        })),
        education: formData.education.map(ed => ({
          degree: ed.degree,
          institution: ed.institution,
          graduationDate: ed.graduationDate,
          fieldOfStudy: ed.fieldOfStudy
        })),
        languages: formData.languages.map(l => l.language).filter(Boolean),
        github: formData.github,
        linkedin: formData.linkedin
      };

      const res = await resumeService.generateDocx(payload);
      if (res.success && res.downloadUrl) {
        const apiBase = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
        const hostBase = apiBase.replace(/\/api$/, '');
        const fullUrl = res.downloadUrl.startsWith('http') ? res.downloadUrl : `${hostBase}${res.downloadUrl}`;
        setDownloadReadyUrl(fullUrl);
        setShowDownloadPrompt(true);
      }
    } catch (e) {
      console.error('Failed to generate resume:', e);
    }
  };

  const suggestProfessionalSummary = async () => {
    try {
      const inputText = (formData.summary || '').trim();
      if (inputText.length < 50) {
        setErrors(prev => ({ ...prev, summary: t('summaryMinLength') }));
        return;
      }
      setIsSuggesting(true);
      // Build a concise content string from current form data
      const contentPieces = [];
      if (formData.summary) contentPieces.push(`User Summary Input (>=50 chars): ${formData.summary}`);
      if (formData.title) contentPieces.push(`Title: ${formData.title}`);
      if (formData.skills?.length) contentPieces.push(`Skills: ${formData.skills.join(', ')}`);
      if (formData.experience?.length) {
        const firstExp = formData.experience[0];
        const expSummary = [firstExp.position, firstExp.company].filter(Boolean).join(' at ');
        if (expSummary) contentPieces.push(`Recent Experience: ${expSummary}`);
      }
      if (formData.education?.length) {
        const firstEdu = formData.education[0];
        const eduSummary = [firstEdu.degree, firstEdu.fieldOfStudy, firstEdu.institution].filter(Boolean).join(' - ');
        if (eduSummary) contentPieces.push(`Education: ${eduSummary}`);
      }

      const payload = {
        section: 'professional_summary',
        content: contentPieces.join('. ') || 'Entry-level candidate seeking opportunities',
        context: formData.title || 'Career objective'
      };

      const response = await api.post('/ai/resume-suggestions', payload);
      if (response.data?.success && response.data.data?.suggestion) {
        handleChange('summary', response.data.data.suggestion);
        setErrors(prev => ({ ...prev, summary: '' }));
      }
    } catch (e) {
      console.error('AI suggest error:', e);
    } finally {
      setIsSuggesting(false);
    }
  };

  const steps = [
    { number: 1, title: t('profile'), icon: User },
    { number: 2, title: t('experience'), icon: Briefcase },
    { number: 3, title: t('education'), icon: GraduationCap },
    { number: 4, title: t('skills'), icon: Code }
  ];

  return (
    <div className="cv-generator-container">
      <div className="cv-generator-card">
        {/* Progress Stepper */}
        <div className="progress-stepper">
          {steps.map((step) => (
            <div 
              key={step.number}
              className={`step ${currentStep === step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
            >
              <div className="step-number">
                {currentStep > step.number ? '✓' : step.number}
              </div>
              <span className="step-title">{step.title}</span>
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="form-content">
          {/* Step 1: Profile */}
          {currentStep === 1 && (
            <div className="step-section">
              <h2><User size={28} /> {t('professionalProfile')}</h2>
              <p className="step-description">{t('professionalProfile')}</p>

              <div className="form-group">
                <label>{t('professionalTitle')} *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder={t('titlePlaceholder')}
                  className={errors.title ? 'error' : ''}
                />
                {errors.title && <span className="error-message">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label>{t('professionalSummary')} *
                  <button 
                    type="button" 
                    className={`ai-suggest-btn ${formData.summary.trim().length < 50 ? 'disabled' : ''}`} 
                    onClick={suggestProfessionalSummary} 
                    disabled={isSuggesting || formData.summary.trim().length < 50}
                    title={formData.summary.trim().length < 50 ? t('summaryMinLength') : t('aiSuggestTooltip')}
                  >
                    <Sparkles size={16} /> {isSuggesting ? t('generating') : t('aiSuggest')}
                  </button>
                </label>
                <textarea
                  required
                  value={formData.summary}
                  onChange={(e) => handleChange('summary', e.target.value)}
                  placeholder={t('summaryPlaceholder')}
                  rows={5}
                  className={errors.summary ? 'error' : ''}
                />
                <div className="summary-hint">
                  {formData.summary.trim().length < 50 ? 
                    `${50 - formData.summary.trim().length} ${t('moreCharactersNeeded')}` : 
                    t('looksGood')}
                </div>
                {errors.summary && <span className="error-message">{errors.summary}</span>}
              </div>

              <div className="form-group">
                <label><Github size={18} /> {t('githubProfile')}</label>
                <input
                  type="url"
                  value={formData.github}
                  onChange={(e) => handleChange('github', e.target.value)}
                  placeholder="https://github.com/username"
                />
              </div>

              <div className="form-group">
                <label><Linkedin size={18} /> {t('linkedinProfile')}</label>
                <input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => handleChange('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
            </div>
          )}

          {/* Step 2: Experience */}
          {currentStep === 2 && (
            <div className="step-section">
              <h2><Briefcase size={28} /> {t('workExperience')}</h2>
              <p className="step-description">{t('workExperience')}</p>

              {formData.experience.map((exp, index) => (
                <div key={index} className="dynamic-section">
                  <div className="section-header">
                    <h3>{t('experience')} #{index + 1}</h3>
                    {formData.experience.length > 1 && (
                      <button 
                        type="button" 
                        className="remove-btn"
                        onClick={() => removeExperience(index)}
                      >
                        <X size={18} /> {t('remove')}
                      </button>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('position')} *</label>
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) => updateExperience(index, 'position', e.target.value)}
                        placeholder={t('positionPlaceholder')}
                        className={errors[`experience_${index}_position`] ? 'error' : ''}
                      />
                      {errors[`experience_${index}_position`] && (
                        <span className="error-message">{errors[`experience_${index}_position`]}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>{t('company')} *</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => updateExperience(index, 'company', e.target.value)}
                        placeholder={t('companyPlaceholder')}
                        className={errors[`experience_${index}_company`] ? 'error' : ''}
                      />
                      {errors[`experience_${index}_company`] && (
                        <span className="error-message">{errors[`experience_${index}_company`]}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('startDate')}</label>
                      <input
                        type="month"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('endDate')}</label>
                      <input
                        type="month"
                        value={exp.endDate}
                        onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                        disabled={exp.current}
                      />
                    </div>
                  </div>

                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id={`current-${index}`}
                      checked={exp.current}
                      onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                    />
                    <label htmlFor={`current-${index}`}>{t('currentlyWorkHere')}</label>
                  </div>

                  <div className="form-group">
                    <label>{t('description')}</label>
                    <textarea
                      value={exp.description}
                      onChange={(e) => updateExperience(index, 'description', e.target.value)}
                      placeholder={t('descriptionPlaceholder')}
                      rows={4}
                    />
                  </div>
                </div>
              ))}

              <button type="button" className="add-btn" onClick={addExperience}>
                <Plus size={18} /> {t('addExperience')}
              </button>
            </div>
          )}

          {/* Step 3: Education */}
          {currentStep === 3 && (
            <div className="step-section">
              <h2><GraduationCap size={28} /> {t('education')}</h2>
              <p className="step-description">{t('educationalBackground')}</p>

              {formData.education.map((edu, index) => (
                <div key={index} className="dynamic-section">
                  <div className="section-header">
                    <h3>{t('education')} #{index + 1}</h3>
                    {formData.education.length > 1 && (
                      <button 
                        type="button" 
                        className="remove-btn"
                        onClick={() => removeEducation(index)}
                      >
                        <X size={18} /> {t('remove')}
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label>{t('degree')} *</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                      placeholder={t('degreePlaceholder')}
                      className={errors[`education_${index}_degree`] ? 'error' : ''}
                    />
                    {errors[`education_${index}_degree`] && (
                      <span className="error-message">{errors[`education_${index}_degree`]}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>{t('institution')} *</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                      placeholder={t('institutionPlaceholder')}
                      className={errors[`education_${index}_institution`] ? 'error' : ''}
                    />
                    {errors[`education_${index}_institution`] && (
                      <span className="error-message">{errors[`education_${index}_institution`]}</span>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('fieldOfStudy')}</label>
                      <input
                        type="text"
                        value={edu.fieldOfStudy}
                        onChange={(e) => updateEducation(index, 'fieldOfStudy', e.target.value)}
                        placeholder={t('fieldOfStudyPlaceholder')}
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('graduationDate')}</label>
                      <input
                        type="month"
                        value={edu.graduationDate}
                        onChange={(e) => updateEducation(index, 'graduationDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" className="add-btn" onClick={addEducation}>
                <Plus size={18} /> {t('addEducation')}
              </button>
            </div>
          )}

          {/* Step 4: Skills & Languages */}
          {currentStep === 4 && (
            <div className="step-section">
              <h2><Code size={28} /> {t('skillsLanguages')}</h2>
              <p className="step-description">{t('showcaseExpertise')}</p>

              <div className="form-group">
                <label>{t('technicalSkills')}</label>
                <div className="skills-input">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder={t('skillPlaceholder')}
                  />
                  <button type="button" onClick={addSkill} className="add-skill-btn">
                    <Plus size={18} />
                  </button>
                </div>
                <div className="skills-tags">
                  {formData.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                      <button onClick={() => removeSkill(skill)}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label><Globe size={18} /> {t('languages')}</label>
                {formData.languages.map((lang, index) => (
                  <div key={index} className="language-row">
                    <input
                      type="text"
                      value={lang.language}
                      onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                      placeholder={t('languagePlaceholder')}
                    />
                    <select
                      value={lang.proficiency}
                      onChange={(e) => updateLanguage(index, 'proficiency', e.target.value)}
                    >
                      <option value="Native">{t('native')}</option>
                      <option value="Fluent">{t('fluent')}</option>
                      <option value="Professional">{t('professional')}</option>
                      <option value="Limited">{t('limited')}</option>
                    </select>
                    {formData.languages.length > 1 && (
                      <button 
                        type="button" 
                        className="remove-lang-btn"
                        onClick={() => removeLanguage(index)}
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="add-btn" onClick={addLanguage}>
                  <Plus size={18} /> {t('addLanguage')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="form-actions">
          {currentStep > 1 && (
            <button type="button" className="back-btn" onClick={handleBack}>
              <ArrowLeft size={18} /> {t('back')}
            </button>
          )}
          
          <div className="step-indicator">
            {t('step')} {currentStep} {t('of')} 4
          </div>

          {currentStep < 4 ? (
            <button type="button" className="next-btn" onClick={handleNext}>
              {t('next')} <ArrowRight size={18} />
            </button>
          ) : (
            <button type="button" className="save-btn" onClick={handleSave}>
              <Save size={18} /> {t('saveCV')}
            </button>
          )}
        </div>
      </div>

      {showDownloadPrompt && (
        <div className="download-modal" role="dialog" aria-modal="true" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fff',borderRadius:16,padding:24,maxWidth:420,width:'90%',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
            <h3 style={{margin:'0 0 8px'}}>{t('cvReady')}</h3>
            <p style={{margin:'0 0 16px',color:'#4b5563'}}>{t('downloadPrompt')}</p>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button
                onClick={() => {
                  setShowDownloadPrompt(false);
                  navigate('/dashboard');
                }}
                style={{padding:'10px 14px',border:'1px solid #e5e7eb',borderRadius:10,background:'#fff',cursor:'pointer',fontWeight:700,color:'#374151'}}
              >
                {t('goToDashboard')}
              </button>
              <button
                onClick={() => {
                  if (downloadReadyUrl) {
                    const a = document.createElement('a');
                    a.href = downloadReadyUrl;
                    a.download = '';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                  }
                  setShowDownloadPrompt(false);
                  navigate('/dashboard');
                }}
                style={{padding:'10px 14px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#10b981,#059669)',color:'#fff',cursor:'pointer',fontWeight:800}}
              >
                {t('downloadGo')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CVGenerator;
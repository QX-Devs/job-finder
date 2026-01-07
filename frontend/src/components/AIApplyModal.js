// src/components/AIApplyModal.js
import React, { useState, useEffect } from 'react';
import { X, FileText, Bot, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import resumeService from '../services/resumeService';
import { useTranslate } from '../utils/translate';
import './AIApplyModal.css';

const AIApplyModal = ({ isOpen, onClose, job, onApplyStart, applyStatus, applyProgress }) => {
  const { t, language } = useTranslate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResumeId, setSelectedResumeId] = useState(null);

  // Map backend progress to step number (1-4)
  const getStepNumber = (progress) => {
    if (!progress) return 1;
    const progressLower = progress.toLowerCase();

    // Step 1: Opening job page (browser launch, navigation)
    if (progressLower.includes('initial') || 
        progressLower.includes('resume_loaded') || 
        progressLower.includes('agent_loaded') ||
        progressLower.includes('browser_launching') ||
        progressLower.includes('browser_opened') ||
        progressLower.includes('navigating_linkedin') ||
        progressLower.includes('logged_in') ||
        progressLower.includes('navigating_job') ||
        progressLower.includes('job_page_loaded') ||
        progressLower.includes('checking_applied')) {
      return 1;
    }
    // Step 2: Clicking Easy Apply
    if (progressLower.includes('clicking_easy_apply') ||
        progressLower.includes('modal_opened') ||
        progressLower.includes('applying')) {
      return 2;
    }
    // Step 3: Filling form
    if (progressLower.includes('page_') || 
        progressLower.includes('contact') || 
        progressLower.includes('resume') ||
        progressLower.includes('question') ||
        progressLower.includes('answering') ||
        progressLower.includes('filling') ||
        progressLower.includes('selecting') ||
        progressLower.includes('top_choice')) {
      return 3;
    }
    // Step 4: Submitting
    if (progressLower.includes('review') || 
        progressLower.includes('submit') || 
        progressLower.includes('success') || 
        progressLower.includes('complet')) {
      return 4;
    }
    return 1;
  };

  const currentStep = getStepNumber(applyProgress);

  useEffect(() => {
    if (isOpen) {
      fetchResumes();
    }
  }, [isOpen]);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const response = await resumeService.getResumes();
      if (response.success) {
        setResumes(response.data || []);
        // Auto-select if only one resume
        if (response.data && response.data.length === 1) {
          setSelectedResumeId(response.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
      setResumes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (selectedResumeId) {
      onApplyStart(selectedResumeId);
    }
  };

  if (!isOpen) return null;

  // Loading state while fetching resumes
  if (loading) {
    return (
      <div className="ai-apply-modal-overlay" onClick={onClose}>
        <div className="ai-apply-modal" onClick={e => e.stopPropagation()}>
          <div className="ai-apply-modal-header">
            <div className="ai-apply-modal-title">
              <Bot size={24} />
              <h2>{language === 'en' ? 'Apply with AI' : 'التقديم بالذكاء الاصطناعي'}</h2>
            </div>
            <button className="ai-apply-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="ai-apply-modal-content loading">
            <Loader2 size={40} className="spinner" />
            <p>{language === 'en' ? 'Loading your resumes...' : 'جاري تحميل السير الذاتية...'}</p>
          </div>
        </div>
      </div>
    );
  }

  // No resumes state
  if (resumes.length === 0) {
    return (
      <div className="ai-apply-modal-overlay" onClick={onClose}>
        <div className="ai-apply-modal" onClick={e => e.stopPropagation()}>
          <div className="ai-apply-modal-header">
            <div className="ai-apply-modal-title">
              <Bot size={24} />
              <h2>{language === 'en' ? 'Apply with AI' : 'التقديم بالذكاء الاصطناعي'}</h2>
            </div>
            <button className="ai-apply-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="ai-apply-modal-content no-resumes">
            <AlertCircle size={48} className="warning-icon" />
            <h3>{language === 'en' ? 'No Resume Found' : 'لا توجد سيرة ذاتية'}</h3>
            <p>
              {language === 'en'
                ? 'To use the AI-powered application feature, please create a resume first. Our Resume Builder will help you craft a professional resume in minutes.'
                : 'لاستخدام ميزة التقديم بالذكاء الاصطناعي، يرجى إنشاء سيرة ذاتية أولاً. سيساعدك منشئ السير الذاتية لدينا في إنشاء سيرة ذاتية احترافية في دقائق.'
              }
            </p>
            <button
              className="ai-apply-create-resume-btn"
              onClick={() => window.location.href = '/cv-generator'}
            >
              <FileText size={18} />
              {language === 'en' ? 'Create Your Resume' : 'أنشئ سيرتك الذاتية'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Apply in progress state
  if (applyStatus === 'loading') {
    return (
      <div className="ai-apply-modal-overlay">
        <div className="ai-apply-modal" onClick={e => e.stopPropagation()}>
          <div className="ai-apply-modal-header">
            <div className="ai-apply-modal-title">
              <Bot size={24} />
              <h2>{language === 'en' ? 'Applying with AI' : 'جاري التقديم بالذكاء الاصطناعي'}</h2>
            </div>
          </div>
          <div className="ai-apply-modal-content applying">
            <div className="ai-apply-animation">
              <Bot size={64} className="robot-icon" />
              <div className="pulse-ring"></div>
            </div>
            <h3>{language === 'en' ? 'AI is applying for you...' : 'الذكاء الاصطناعي يقدم نيابة عنك...'}</h3>
            <p>
              {language === 'en'
                ? 'Please wait while our AI agent fills out the application form using your resume data.'
                : 'يرجى الانتظار بينما يقوم وكيل الذكاء الاصطناعي بملء نموذج التقديم باستخدام بيانات سيرتك الذاتية.'
              }
            </p>
            <div className="ai-apply-progress">
              <div className="progress-steps">
                <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                  <span className="step-number">{currentStep > 1 ? '✓' : '1'}</span>
                  <span className="step-label">{language === 'en' ? 'Opening job page' : 'فتح صفحة الوظيفة'}</span>
                </div>
                <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                  <span className="step-number">{currentStep > 2 ? '✓' : '2'}</span>
                  <span className="step-label">{language === 'en' ? 'Clicking Easy Apply' : 'النقر على التقديم السريع'}</span>
                </div>
                <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
                  <span className="step-number">{currentStep > 3 ? '✓' : '3'}</span>
                  <span className="step-label">{language === 'en' ? 'Filling form' : 'ملء النموذج'}</span>
                </div>
                <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
                  <span className="step-number">{currentStep >= 4 ? '✓' : '4'}</span>
                  <span className="step-label">{language === 'en' ? 'Submitting' : 'إرسال الطلب'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (applyStatus === 'success') {
    return (
      <div className="ai-apply-modal-overlay" onClick={onClose}>
        <div className="ai-apply-modal success" onClick={e => e.stopPropagation()}>
          <div className="ai-apply-modal-header">
            <div className="ai-apply-modal-title">
              <CheckCircle size={24} className="success-icon" />
              <h2>{language === 'en' ? 'Application Successful!' : 'تم التقديم بنجاح!'}</h2>
            </div>
            <button className="ai-apply-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="ai-apply-modal-content success-content">
            <CheckCircle size={64} className="success-icon-large" />
            <h3>{language === 'en' ? 'Congratulations!' : 'مبروك!'}</h3>
            <p>
              {language === 'en'
                ? `Your application for ${job?.title} at ${job?.company} has been submitted successfully.`
                : `تم تقديم طلبك لوظيفة ${job?.title} في ${job?.company} بنجاح.`
              }
            </p>
            <button className="ai-apply-done-btn" onClick={onClose}>
              {language === 'en' ? 'Done' : 'تم'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Failed state
  if (applyStatus === 'failed') {
    return (
      <div className="ai-apply-modal-overlay" onClick={onClose}>
        <div className="ai-apply-modal failed" onClick={e => e.stopPropagation()}>
          <div className="ai-apply-modal-header">
            <div className="ai-apply-modal-title">
              <XCircle size={24} className="error-icon" />
              <h2>{language === 'en' ? 'Application Failed' : 'فشل التقديم'}</h2>
            </div>
            <button className="ai-apply-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="ai-apply-modal-content failed-content">
            <XCircle size={64} className="error-icon-large" />
            <h3>{language === 'en' ? 'Something went wrong' : 'حدث خطأ ما'}</h3>
            <p>
              {language === 'en'
                ? 'The AI agent was unable to complete the application. This might be due to missing information in your resume or changes in the job posting.'
                : 'لم يتمكن وكيل الذكاء الاصطناعي من إكمال التقديم. قد يكون ذلك بسبب نقص في المعلومات في سيرتك الذاتية أو تغييرات في إعلان الوظيفة.'
              }
            </p>
            <div className="ai-apply-failed-actions">
              <button className="ai-apply-retry-btn" onClick={() => onApplyStart(selectedResumeId)}>
                {language === 'en' ? 'Try Again' : 'حاول مجدداً'}
              </button>
              <a
                href={job?.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ai-apply-manual-btn"
              >
                {language === 'en' ? 'Apply Manually' : 'التقديم يدوياً'}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Resume selection state (multiple resumes)
  return (
    <div className="ai-apply-modal-overlay" onClick={onClose}>
      <div className="ai-apply-modal" onClick={e => e.stopPropagation()}>
        <div className="ai-apply-modal-header">
          <div className="ai-apply-modal-title">
            <Bot size={24} />
            <h2>{language === 'en' ? 'Apply with AI' : 'التقديم بالذكاء الاصطناعي'}</h2>
          </div>
          <button className="ai-apply-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="ai-apply-modal-content">
          <div className="ai-apply-job-info">
            <h3>{job?.title}</h3>
            <p>{job?.company} • {job?.location}</p>
          </div>

          {resumes.length > 1 ? (
            <>
              <div className="ai-apply-resume-section">
                <h4>{language === 'en' ? 'Select a Resume' : 'اختر سيرة ذاتية'}</h4>
                <p className="ai-apply-subtitle">
                  {language === 'en'
                    ? 'Choose which resume to use for this application'
                    : 'اختر السيرة الذاتية التي تريد استخدامها لهذا التقديم'
                  }
                </p>
                <div className="ai-apply-resume-list">
                  {resumes.map(resume => (
                    <div
                      key={resume.id}
                      className={`ai-apply-resume-item ${selectedResumeId === resume.id ? 'selected' : ''}`}
                      onClick={() => setSelectedResumeId(resume.id)}
                    >
                      <div className="resume-item-icon">
                        <FileText size={20} />
                      </div>
                      <div className="resume-item-info">
                        <span className="resume-title">{resume.title || 'Untitled Resume'}</span>
                        <span className="resume-date">
                          {language === 'en' ? 'Updated: ' : 'محدث: '}
                          {new Date(resume.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="resume-item-check">
                        {selectedResumeId === resume.id && <CheckCircle size={20} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="ai-apply-single-resume">
              <FileText size={24} />
              <span>{resumes[0]?.title || 'Your Resume'}</span>
            </div>
          )}

          <div className="ai-apply-disclaimer">
            <AlertCircle size={16} />
            <span>
              {language === 'en'
                ? 'The AI will use information from your selected resume to answer application questions.'
                : 'سيستخدم الذكاء الاصطناعي المعلومات من سيرتك الذاتية المحددة للإجابة على أسئلة التقديم.'
              }
            </span>
          </div>

          <button
            className="ai-apply-submit-btn"
            onClick={handleApply}
            disabled={!selectedResumeId}
          >
            <Bot size={18} />
            {language === 'en' ? 'Start AI Application' : 'بدء التقديم بالذكاء الاصطناعي'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIApplyModal;

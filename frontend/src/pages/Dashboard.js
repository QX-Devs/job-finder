import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import authService from '../services/authService';
import resumeService from '../services/resumeService';
import CVPreviewModal from '../components/CVPreviewModal';
import {
  User, FileText, Plus, ArrowRight, TrendingUp, BookmarkCheck, Bell,
  Briefcase, Settings, Upload, CheckCircle2, Loader2, Sparkles, 
  AlertCircle, Mail, Shield, Download, ExternalLink, Eye, Edit, X, Trash2
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { t, direction } = useLanguage();
  const { user, updateUser } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [previewResume, setPreviewResume] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showCourseSuggestion, setShowCourseSuggestion] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await api.get('/me');
        if (response.data?.success && response.data.data && mounted) {
          updateUser(response.data.data);
          
          // Check if user is graduate and has no courses - show suggestion
          const userData = response.data.data;
          if (userData.isGraduate === true && (!userData.courses || userData.courses.length === 0)) {
            // Check if user has dismissed this before (using localStorage)
            const dismissed = localStorage.getItem('courseSuggestionDismissed');
            if (!dismissed) {
              setShowCourseSuggestion(true);
            }
          }
        }
      } catch (_) {}

      try {
        const res = await resumeService.getResumes();
        if (!mounted) return;
        if (res?.success && Array.isArray(res.data)) {
          // Deduplicate resumes by ID (keep the most recent one if duplicates exist)
          const uniqueResumes = res.data.reduce((acc, resume) => {
            const existingIndex = acc.findIndex(r => r.id === resume.id);
            if (existingIndex === -1) {
              acc.push(resume);
            } else {
              // If duplicate, keep the one with the most recent updatedAt
              const existing = acc[existingIndex];
              const existingDate = new Date(existing.updatedAt || existing.lastModified || existing.createdAt);
              const newDate = new Date(resume.updatedAt || resume.lastModified || resume.createdAt);
              if (newDate > existingDate) {
                acc[existingIndex] = resume;
              }
            }
            return acc;
          }, []);
          
          // Sort by most recent first
          uniqueResumes.sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.lastModified || a.createdAt);
            const dateB = new Date(b.updatedAt || b.lastModified || b.createdAt);
            return dateB - dateA;
          });
          
          setResumes(uniqueResumes);
        } else {
          setResumes([]);
        }
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || t('loadDashboardFailed'));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [t]);

  const profileCompletion = useMemo(() => {
    if (!user) return 0;
    
    // Essential profile fields that users can actually fill
    const fields = [
      user.fullName,           // Required field
      user.email,               // Required field
      user.isVerified,          // Email verification status
      user.phone,               // Optional but important
      user.location,             // Optional
      user.careerObjective || user.professionalSummary  // Optional but valuable
    ];
    
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [user]);

  const hasResume = resumes && resumes.length > 0;
  const latestResume = hasResume ? resumes[0] : null;
  const isVerified = user?.isVerified || false;

  const handleResendVerification = async () => {
    setResendingVerification(true);
    setVerificationMessage('');
    try {
      const response = await authService.resendVerificationEmail();
      if (response.success) {
        setVerificationMessage('Verification email sent! Please check your inbox.');
        setTimeout(() => setVerificationMessage(''), 5000);
      }
    } catch (err) {
      setVerificationMessage(err.message || 'Failed to send verification email');
      setTimeout(() => setVerificationMessage(''), 5000);
    } finally {
      setResendingVerification(false);
    }
  };

  const handleDeleteResume = async (resumeId, resumeTitle) => {
    // Confirm deletion
    const confirmMessage = t('confirmDeleteResume') || `Are you sure you want to delete "${resumeTitle || t('resume')}"? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setDeletingId(resumeId);
    try {
      const response = await resumeService.deleteResume(resumeId);
      if (response.success) {
        // Remove the resume from the list
        setResumes(prev => prev.filter(r => r.id !== resumeId));
        // If the deleted resume was being previewed, close the preview
        if (previewResume && previewResume.id === resumeId) {
          setIsPreviewOpen(false);
          setPreviewResume(null);
        }
      } else {
        alert(response.error || t('deleteFailed') || 'Failed to delete resume');
      }
    } catch (err) {
      console.error('Delete resume error:', err);
      alert(err.message || t('deleteFailed') || 'Failed to delete resume');
    } finally {
      setDeletingId(null);
    }
  };

  const StatCard = ({ icon: Icon, title, value, trend, onClick }) => (
    <button className="dash-stat-card" onClick={onClick}>
      <div className="dash-stat-icon">
        <Icon size={18} />
      </div>
      <div className="dash-stat-info">
        <div className="dash-stat-title">{title}</div>
        <div className="dash-stat-value">{value}</div>
      </div>
      {trend && (
        <div className="dash-stat-trend">
          <TrendingUp size={16} /> {trend}
        </div>
      )}
    </button>
  );

  return (
    <div className="page-container">
      <div className="dash-header">
        <div className="dash-greeting">
          <h1>
            {t('welcomeBack')}{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}
            <span className="greeting-emoji" aria-label="wave">👋</span>
          </h1>
          <p>{t('dashboardSubtitle')}</p>
        </div>
        <div className="dash-quick-actions">
          <button className="dash-action" onClick={() => navigate('/cv-generator')}>
            <Sparkles size={16} /> {t('buildResume')}
          </button>
          <button className="dash-action" onClick={() => navigate('/')}>
            <Briefcase size={16} /> {t('findJobs')}
          </button>
          <button className="dash-action" onClick={() => navigate('/settings')}>
            <Settings size={16} /> {t('settings')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="dash-loading">
          <Loader2 className="spin" size={24} /> {t('loadingYourData')}
        </div>
      ) : (
        <>
          {error && (
            <div className="dash-error" role="alert">{error}</div>
          )}

          {/* Email Verification Banner */}
          {!isVerified && (
            <div className="dash-verification-banner" role="alert">
              <div className="dash-verification-content">
                <div className="dash-verification-icon">
                  <AlertCircle size={20} />
                </div>
                <div className="dash-verification-text">
                  <h4>Email Not Verified</h4>
                  <p>Please verify your email address to access all features and secure your account.</p>
                </div>
                <div className="dash-verification-actions">
                  <button
                    onClick={handleResendVerification}
                    disabled={resendingVerification}
                    className="btn-primary"
                  >
                    {resendingVerification ? (
                      <>
                        <Loader2 className="spin" size={16} /> {t('sending')}
                      </>
                    ) : (
                      <>
                        <Mail size={16} /> Resend Email
                      </>
                    )}
                  </button>
                </div>
              </div>
              {verificationMessage && (
                <div className={`dash-verification-message ${verificationMessage.includes('Failed') ? 'error' : 'success'}`}>
                  {verificationMessage}
                </div>
              )}
            </div>
          )}

          <div className="dash-grid">
            <div className="dash-col">
              <div className="dash-card">
                <div className="dash-card-header">
                  <div className="dash-card-title"><User size={18} /> {t('profile')}</div>
                  <button className="link" onClick={() => navigate('/settings')}>{t('edit')}</button>
                </div>
                <div className="dash-profile">
                  {user?.fullName && (
                    <div className="dash-profile-row">
                      <span>{t('name')}</span>
                      <strong>{user.fullName}</strong>
                    </div>
                  )}
                  {user?.email && (
                    <div className="dash-profile-row">
                      <span>{t('email')}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong>{user.email}</strong>
                      {isVerified ? (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          color: '#10b981',
                          fontSize: '12px',
                          fontWeight: 600
                        }}>
                          <CheckCircle2 size={14} />
                          Verified
                        </span>
                      ) : (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          color: '#f59e0b',
                          fontSize: '12px',
                          fontWeight: 600
                        }}>
                          <AlertCircle size={14} />
                          Not Verified
                        </span>
                        )}
                      </div>
                    </div>
                  )}
                  {user?.phone && (
                    <div className="dash-profile-row">
                      <span>{t('phone')}</span>
                      <strong>{user.phone}</strong>
                    </div>
                  )}
                  <div className="dash-progress">
                    <div className="dash-progress-bar" style={{ width: `${profileCompletion}%` }}></div>
                  </div>
                  <div className="dash-progress-label">{t('profileCompleteness')}: {profileCompletion}%</div>
                </div>
              </div>

              <div className="dash-card">
                <div className="dash-card-header">
                  <div className="dash-card-title"><FileText size={18} /> {t('resumes')}</div>
                  <div className="dash-card-actions">
                    <button className="btn-small" onClick={() => navigate('/cv-generator')}>
                      <Plus size={14} /> {t('new')}
                    </button>
                  </div>
                </div>
                {hasResume ? (
                  <div className="dash-list">
                    {resumes.slice(0, 5).map((r) => {
                      // Check if resume is incomplete (not uploaded and isComplete is explicitly false)
                      const isIncomplete = !r.content?.uploadedFile?.url && r.isComplete !== true;
                      const isUploaded = r.content?.uploadedFile?.url;
                      // Get current step for incomplete resumes
                      const currentStep = r.currentStep || 1;
                      const totalSteps = 5;
                      
                      return (
                      <div key={r.id} className="dash-list-item" style={{ position: 'relative' }}>
                        <div className="dash-list-main">
                          <div className="dash-list-title">
                            {r.title || t('resume')}
                            {isUploaded && (
                              <span style={{ marginLeft: 8, fontSize: 12, color: '#059669', fontWeight: 700 }}>
                                {t('uploaded')}
                              </span>
                            )}
                            {isIncomplete && (
                              <span style={{ 
                                marginLeft: 8, 
                                fontSize: 11, 
                                color: '#92400e', 
                                fontWeight: 700, 
                                backgroundColor: '#fef3c7', 
                                padding: '2px 8px', 
                                borderRadius: 12,
                                border: '1px solid #f59e0b'
                              }}>
                                {t('incomplete') || 'Incomplete'} ({currentStep}/{totalSteps})
                              </span>
                            )}
                          </div>
                          <div className="dash-list-sub">{new Date(r.updatedAt || r.lastModified || r.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="resume-actions">
                          {isUploaded ? (
                            // Uploaded file - show download button only
                            <button
                              type="button"
                              className="resume-action-btn download-btn"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (e.target.disabled) return;
                                e.target.disabled = true;

                                try {
                                  const file = r.content.uploadedFile;
                                  if (!file || !file.storedFilename) throw new Error('Missing file info');

                                  const blob = await resumeService.downloadUploadedFile(file.storedFilename);
                                  if (!(blob instanceof Blob)) throw new Error('Invalid file response');

                                  // ✅ Create download link
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;

                                  // ✅ Use the same name shown on your site (fallback to resume.pdf)
                                  a.download =
                                    file.originalFilename ||
                                    file.fileName ||
                                    file.name ||
                                    'resume.pdf';

                                  document.body.appendChild(a);
                                  a.click();
                                  a.remove();

                                  // ✅ Clean up URL after 30 seconds
                                  setTimeout(() => window.URL.revokeObjectURL(url), 30000);
                                } catch (err) {
                                  console.error(err);
                                  alert(t('downloadFailed') || 'Download failed');
                                } finally {
                                  e.target.disabled = false;
                                }
                              }}
                            >
                              <Download size={14} /> {t('downloadCV') || 'Download'}
                            </button>
                          ) : isIncomplete ? (
                            // Incomplete resume - show only Continue and Delete buttons
                            <>
                              <button 
                                className="resume-action-btn edit-btn" 
                                style={{ 
                                  backgroundColor: '#fef3c7', 
                                  borderColor: '#f59e0b', 
                                  color: '#92400e',
                                  gridColumn: 'span 2'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  navigate(`/cv-generator?resumeId=${r.id}`, { replace: false });
                                }}
                                title={t('continue') || 'Continue editing'}
                              >
                                <ArrowRight size={14} /> {t('continue') || 'Continue'}
                              </button>
                              <button
                                type="button"
                                className="resume-action-btn delete-btn"
                                style={{ gridColumn: 'span 2' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleDeleteResume(r.id, r.title);
                                }}
                                disabled={deletingId === r.id}
                                title={t('delete') || 'Delete CV'}
                              >
                                {deletingId === r.id ? (
                                  <>
                                    <Loader2 size={14} className="spin" /> {t('deleting') || 'Deleting...'}
                                  </>
                                ) : (
                                  <>
                                    <Trash2 size={14} /> {t('delete') || 'Delete'}
                                  </>
                                )}
                              </button>
                            </>
                          ) : (
                            // Complete generated CV - show all buttons in 2x2 grid
                            <>
                              <button 
                                className="resume-action-btn preview-btn" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setPreviewResume(r);
                                  setIsPreviewOpen(true);
                                }}
                                title={t('preview') || 'Preview CV'}
                              >
                                <Eye size={14} /> {t('preview') || 'Preview'}
                              </button>
                              <button 
                                className="resume-action-btn edit-btn" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  navigate(`/cv-generator?resumeId=${r.id}`, { replace: false });
                                }}
                                title={t('edit') || 'Edit CV'}
                              >
                                <Edit size={14} /> {t('edit') || 'Edit'}
                              </button>
                              <button
                                type="button"
                                className="resume-action-btn download-btn"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (downloadingId === r.id) return;
                                  setDownloadingId(r.id);

                                  try {
                                    // Generate and download the CV
                                    const response = await resumeService.generateDocx(r.content);
                                    
                                    if (response.success && response.downloadUrl) {
                                      // Construct full URL for download
                                      const apiBase = (process.env.REACT_APP_API_URL || 
                                        (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
                                          ? `http://${window.location.hostname}:5000/api`
                                          : 'https://job-finder-r1dh.onrender.com/api')).replace(/\/$/, '');
                                      const hostBase = apiBase.replace(/\/api$/, '');
                                      
                                      const fullUrl = response.downloadUrl.startsWith('http') 
                                        ? response.downloadUrl 
                                        : `${hostBase}${response.downloadUrl}`;
                                      
                                      // Create download link
                                      const a = document.createElement('a');
                                      a.href = fullUrl;
                                      a.download = response.filename || `${r.title || 'resume'}.docx`;
                                      a.target = '_blank';
                                      document.body.appendChild(a);
                                      a.click();
                                      a.remove();
                                    } else {
                                      throw new Error('Failed to generate CV');
                                    }
                                  } catch (err) {
                                    console.error('Download error:', err);
                                    alert(err.message || t('downloadFailed') || 'Failed to download CV');
                                  } finally {
                                    setDownloadingId(null);
                                  }
                                }}
                                disabled={downloadingId === r.id}
                                title="Download CV"
                              >
                                {downloadingId === r.id ? (
                                  <>
                                    <Loader2 size={14} className="spin" /> {t('downloading') || 'Downloading...'}
                                  </>
                                ) : (
                                  <>
                                    <Download size={14} /> {t('Download') || 'Download'}
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                className="resume-action-btn delete-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleDeleteResume(r.id, r.title);
                                }}
                                disabled={deletingId === r.id}
                                title={t('delete') || 'Delete CV'}
                              >
                                {deletingId === r.id ? (
                                  <>
                                    <Loader2 size={14} className="spin" /> {t('deleting') || 'Deleting...'}
                                  </>
                                ) : (
                                  <>
                                    <Trash2 size={14} /> {t('delete') || 'Delete'}
                                  </>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                ) : (
                  <div className="dash-empty">
                    <p>{t('noResumesYet')}</p>
                    <button className="btn-primary" onClick={() => navigate('/cv-prompt')}>
                      {t('createOrUpload')} <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="dash-col">
              <div className="dash-card">
                <div className="dash-card-header">
                  <div className="dash-card-title"><Briefcase size={18} /> {t('applications')}</div>
                  <button className="link" onClick={() => navigate('/applications')}>{t('viewAll')}</button>
                </div>
                <div className="dash-stats">
                  <StatCard 
                    icon={Briefcase} 
                    title={t('submitted')} 
                    value="0" 
                    onClick={() => navigate('/applications')} 
                  />
                  <StatCard 
                    icon={BookmarkCheck} 
                    title={t('saved')} 
                    value="0" 
                    onClick={() => navigate('/saved-jobs')} 
                  />
                </div>
                <div className="dash-empty small">
                  <p>{t('applicationTrackingComingSoon')}</p>
                </div>
              </div>

              <div className="dash-card">
                <div className="dash-card-header">
                  <div className="dash-card-title"><Settings size={18} /> {t('quickSettings')}</div>
                </div>
                <div className="dash-quick-links">
                  <button onClick={() => navigate('/settings')}>
                    <Settings size={16} /> {t('accountSettings')}
                  </button>
                  <button onClick={() => navigate('/cv-generator')}>
                    <FileText size={16} /> {t('editResume')}
                  </button>
                  <button onClick={() => navigate('/')}>
                    <Briefcase size={16} /> {t('exploreJobs')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="dash-banner">
            <div className="dash-banner-left">
              <CheckCircle2 size={20} /> {t('dashboardTip')}
            </div>
            <div className="dash-banner-right">
              <button className="btn-outline" onClick={() => navigate('/cv-prompt')}>
                <Upload size={16} /> {t('uploadCV')}
              </button>
              <button className="btn-primary" onClick={() => navigate('/cv-generator')}>
                {t('buildWithAI')} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Course Suggestion Popup for Graduates */}
      {showCourseSuggestion && user?.isGraduate && (
        <div className="course-suggestion-modal" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 700, color: '#1f2937' }}>
              💡 Boost Your Hiring Score
            </h3>
            <p style={{ margin: '0 0 20px', color: '#4b5563', lineHeight: '1.6' }}>
              {t('courseSuggestionMessage') || 'Adding relevant courses increases your hiring score. Courses are weighted 35% for fresh graduates in our ATS ranking system.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  localStorage.setItem('courseSuggestionDismissed', 'true');
                  setShowCourseSuggestion(false);
                }}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#374151'
                }}
              >
                {t('maybeLater') || 'Maybe Later'}
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('courseSuggestionDismissed', 'true');
                  setShowCourseSuggestion(false);
                  navigate('/settings'); // Navigate to settings where courses can be added
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                {t('addCourses') || 'Add Courses'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CV Preview Modal */}
      {previewResume && (
        <CVPreviewModal
          resume={previewResume}
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewResume(null);
          }}
          onDownload={async () => {
            if (!previewResume) return;
            try {
              setDownloadingId(previewResume.id);
              const response = await resumeService.generateDocx(previewResume.content);
              
              if (response.success && response.downloadUrl) {
                const apiBase = (process.env.REACT_APP_API_URL || 
                  (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
                    ? `http://${window.location.hostname}:5000/api`
                    : 'https://job-finder-r1dh.onrender.com/api')).replace(/\/$/, '');
                const hostBase = apiBase.replace(/\/api$/, '');
                
                const fullUrl = response.downloadUrl.startsWith('http') 
                  ? response.downloadUrl 
                  : `${hostBase}${response.downloadUrl}`;
                
                const a = document.createElement('a');
                a.href = fullUrl;
                a.download = response.filename || `${previewResume.title || 'resume'}.docx`;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                a.remove();
              } else {
                throw new Error('Failed to generate CV');
              }
            } catch (err) {
              console.error('Download error:', err);
              alert(err.message || t('downloadFailed') || 'Failed to download CV');
            } finally {
              setDownloadingId(null);
            }
          }}
          onEdit={() => {
            if (previewResume) {
              setIsPreviewOpen(false);
              navigate(`/cv-generator?resumeId=${previewResume.id}`, { replace: false });
            }
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
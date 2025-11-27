import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import authService from '../services/authService';
import resumeService from '../services/resumeService';
import {
  User, FileText, Plus, ArrowRight, TrendingUp, BookmarkCheck, Bell,
  Briefcase, Settings, Upload, CheckCircle2, Loader2, Sparkles, 
  AlertCircle, Mail, Shield
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

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await api.get('/me');
        if (response.data?.success && response.data.data && mounted) {
          updateUser(response.data.data);
        }
      } catch (_) {}

      try {
        const res = await resumeService.getResumes();
        if (!mounted) return;
        if (res?.success && Array.isArray(res.data)) {
          setResumes(res.data);
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
    const fields = [
      user.fullName,
      user.email,
      user.phone,
      user.location,
      user.headline,
      user.bio
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
          <h1>{t('welcomeBack')}{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''} 👋</h1>
          <p>{t('dashboardSubtitle')}</p>
        </div>
        <div className="dash-quick-actions">
          <button className="dash-action" onClick={() => navigate('/cv-generator')}>
            <Sparkles size={16} /> {t('buildResume')}
          </button>
          <button className="dash-action" onClick={() => navigate('/find-jobs')}>
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
                  <div className="dash-profile-row">
                    <span>{t('name')}</span>
                    <strong>{user?.fullName || '—'}</strong>
                  </div>
                  <div className="dash-profile-row">
                    <span>{t('email')}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong>{user?.email || '—'}</strong>
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
                  <div className="dash-profile-row">
                    <span>{t('phone')}</span>
                    <strong>{user?.phone || '—'}</strong>
                  </div>
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
                    {resumes.slice(0, 5).map((r) => (
                      <div key={r.id} className="dash-list-item">
                        <div className="dash-list-main">
                          <div className="dash-list-title">
                            {r.title || t('resume')}
                            {r.content?.uploadedFile?.url && (
                              <span style={{ marginLeft: 8, fontSize: 12, color: '#059669', fontWeight: 700 }}>
                                {t('uploaded')}
                              </span>
                            )}
                          </div>
                          <div className="dash-list-sub">{new Date(r.updatedAt || r.lastModified || r.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="dash-list-actions">
                          {r.content?.uploadedFile?.url ? (
                            <button
                              type="button"
                              className="link"
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
                                  alert(t('downloadFailed'));
                                } finally {
                                  e.target.disabled = false;
                                }
                              }}
                            >
                              {t('downloadCV')}
                            </button>
                          ) : (
                            <button className="link" onClick={() => navigate('/cv-generator')}>{t('open')}</button>
                          )}
                        </div>
                      </div>
                    ))}
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
                  <StatCard 
                    icon={Bell} 
                    title={t('updates')} 
                    value="0" 
                    onClick={() => navigate('/notifications')} 
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
                  <button onClick={() => navigate('/find-jobs')}>
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
    </div>
  );
};

export default Dashboard;
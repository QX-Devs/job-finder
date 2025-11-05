import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import resumeService from '../services/resumeService';
import {
  User, FileText, Plus, ArrowRight, TrendingUp, BookmarkCheck, Bell,
  Briefcase, Settings, Upload, CheckCircle2, Loader2, Sparkles
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getStoredUser());
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const me = await authService.getCurrentUser();
        if (me?.success && me.data) {
          if (!mounted) return;
          setUser(me.data);
          authService.setUser(me.data);
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
        setError(e?.message || 'Failed to load dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

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
          <h1>Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''} 👋</h1>
          <p>Here is your personalized overview and quick actions.</p>
        </div>
        <div className="dash-quick-actions">
          <button className="dash-action" onClick={() => navigate('/cv-generator')}>
            <Sparkles size={16} /> Build Resume
          </button>
          <button className="dash-action" onClick={() => navigate('/find-jobs')}>
            <Briefcase size={16} /> Find Jobs
          </button>
          <button className="dash-action" onClick={() => navigate('/settings')}>
            <Settings size={16} /> Settings
          </button>
        </div>
      </div>

      {loading ? (
        <div className="dash-loading">
          <Loader2 className="spin" size={24} /> Loading your data...
        </div>
      ) : (
        <>
          {error && (
            <div className="dash-error" role="alert">{error}</div>
          )}

          <div className="dash-grid">
            <div className="dash-col">
              <div className="dash-card">
                <div className="dash-card-header">
                  <div className="dash-card-title"><User size={18} /> Profile</div>
                  <button className="link" onClick={() => navigate('/settings')}>Edit</button>
                </div>
                <div className="dash-profile">
                  <div className="dash-profile-row">
                    <span>Name</span>
                    <strong>{user?.fullName || '—'}</strong>
                  </div>
                  <div className="dash-profile-row">
                    <span>Email</span>
                    <strong>{user?.email || '—'}</strong>
                  </div>
                  <div className="dash-profile-row">
                    <span>Phone</span>
                    <strong>{user?.phone || '—'}</strong>
                  </div>
                  <div className="dash-progress">
                    <div className="dash-progress-bar" style={{ width: `${profileCompletion}%` }}></div>
                  </div>
                  <div className="dash-progress-label">Profile completeness: {profileCompletion}%</div>
                </div>
              </div>

              <div className="dash-card">
                <div className="dash-card-header">
                  <div className="dash-card-title"><FileText size={18} /> Resumes</div>
                  <div className="dash-card-actions">
                    <button className="btn-small" onClick={() => navigate('/cv-generator')}>
                      <Plus size={14} /> New
                    </button>
                  </div>
                </div>
                {hasResume ? (
                  <div className="dash-list">
                    {resumes.slice(0, 5).map((r) => (
                      <div key={r.id} className="dash-list-item">
                        <div className="dash-list-main">
                          <div className="dash-list-title">
                            {r.title || 'Resume'}
                            {r.content?.uploadedFile?.url && (
                              <span style={{ marginLeft: 8, fontSize: 12, color: '#059669', fontWeight: 700 }}>
                                Uploaded
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
                                alert('Could not download CV. Please try again.');
                              } finally {
                                e.target.disabled = false;
                              }
                            }}

                          >
                            Download CV
                          </button>
                          ) : (
                            <button className="link" onClick={() => navigate('/cv-generator')}>Open</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dash-empty">
                    <p>No resumes yet.</p>
                    <button className="btn-primary" onClick={() => navigate('/cv-prompt')}>
                      Create or Upload <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="dash-col">
              <div className="dash-card">
                <div className="dash-card-header">
                  <div className="dash-card-title"><Briefcase size={18} /> Applications</div>
                  <button className="link" onClick={() => navigate('/applications')}>View all</button>
                </div>
                <div className="dash-stats">
                  <StatCard icon={Briefcase} title="Submitted" value="0" onClick={() => navigate('/applications')} />
                  <StatCard icon={BookmarkCheck} title="Saved" value="0" onClick={() => navigate('/saved-jobs')} />
                  <StatCard icon={Bell} title="Updates" value="0" onClick={() => navigate('/notifications')} />
                </div>
                <div className="dash-empty small">
                  <p>Application tracking coming soon.</p>
                </div>
              </div>

              <div className="dash-card">
                <div className="dash-card-header">
                  <div className="dash-card-title"><Settings size={18} /> Quick Settings</div>
                </div>
                <div className="dash-quick-links">
                  <button onClick={() => navigate('/settings')}><Settings size={16} /> Account Settings</button>
                  <button onClick={() => navigate('/cv-generator')}><FileText size={16} /> Edit Resume</button>
                  <button onClick={() => navigate('/find-jobs')}><Briefcase size={16} /> Explore Jobs</button>
                </div>
              </div>
            </div>
          </div>

          <div className="dash-banner">
            <div className="dash-banner-left">
              <CheckCircle2 size={20} /> Tip: Boost your chances by keeping your resume fresh and tailored.
            </div>
            <div className="dash-banner-right">
              <button className="btn-outline" onClick={() => navigate('/cv-prompt')}>
                <Upload size={16} /> Upload CV
              </button>
              <button className="btn-primary" onClick={() => navigate('/cv-generator')}>
                Build with AI <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;



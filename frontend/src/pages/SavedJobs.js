import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  Search, MapPin, Briefcase, DollarSign, BookmarkCheck,
  ArrowRight, Clock, Eye, Users, Trash2, ExternalLink,
  Grid3x3, List, ChevronDown, Calendar
} from 'lucide-react';
import applicationService from '../services/applicationService';
import authService from '../services/authService';
import './SavedJobs.css';

const SavedJobs = () => {
  const navigate = useNavigate();
  const { t, direction } = useLanguage();
  const [savedJobs, setSavedJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(9);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isLoggedIn = authService.isAuthenticated();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
      return;
    }
    fetchSavedJobs();
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    let result = savedJobs;

    if (searchTerm) {
      result = result.filter(job =>
        job.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    result.sort((a, b) => new Date(b.appliedAt || b.createdAt) - new Date(a.appliedAt || a.createdAt));
    setFilteredJobs(result);
  }, [searchTerm, savedJobs]);

  const fetchSavedJobs = async () => {
    try {
      setIsLoading(true);
      const res = await applicationService.list();
      if (res.success) {
        const saved = res.data.filter(app => app.status === 'saved');
        setSavedJobs(saved);
      }
    } catch (err) {
      setError(t('loadSavedJobsFailed'));
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsave = async (jobId) => {
    if (!window.confirm(t('unsaveJobConfirm'))) {
      return;
    }

    try {
      const res = await applicationService.remove(jobId);
      if (res.success) {
        setSavedJobs(prev => prev.filter(job => job.id !== jobId));
        setMessage(t('jobRemoved'));
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setError(t('unsaveJobFailed'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleApply = (e, job) => {
    if (job.sourceUrl) {
      window.open(job.sourceUrl, '_blank', 'noopener noreferrer');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('recentlySaved');
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return t('today');
    if (diffDays === 1) return t('yesterday');
    if (diffDays < 7) return t('daysAgo', { days: diffDays });
    if (diffDays < 30) return t('weeksAgo', { weeks: Math.floor(diffDays / 7) });
    if (diffDays < 365) return t('monthsAgo', { months: Math.floor(diffDays / 30) });
    return t('yearsAgo', { years: Math.floor(diffDays / 365) });
  };

  const getCompanyInitial = (company) => {
    if (!company) return '🏢';
    return company.charAt(0).toUpperCase();
  };

  const loadMore = () => {
    setDisplayCount(prev => prev + 9);
  };

  return (
    <div className="saved-jobs-container">
      {/* Hero Section */}
      <section className="saved-jobs-hero">
        <div className="saved-jobs-hero-content">
          <div className="saved-jobs-badge">
            <BookmarkCheck size={16} />
            <span>{t('savedJobs')}</span>
          </div>
          <h1 className="saved-jobs-title">{t('savedJobsTitle')}</h1>
          <p className="saved-jobs-subtitle">
            {t('savedJobsSubtitle')}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="saved-jobs-section">
        <div className="saved-jobs-wrapper">
          {/* Search and Controls */}
          <div className="saved-jobs-controls">
            <div className="search-bar-saved">
              <Search size={20} />
              <input
                type="text"
                placeholder={t('searchSavedJobs')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input-saved"
              />
            </div>

            <div className="saved-jobs-results-info">
              <p>
                <strong>{filteredJobs.length}</strong> {t('savedJobsCount', { count: filteredJobs.length })}
              </p>
            </div>

            <div className="saved-jobs-view-controls">
              <button
                onClick={() => setViewMode('grid')}
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                title={t('gridView')}
              >
                <Grid3x3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                title={t('listView')}
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          {message && <div className="saved-jobs-message success">{message}</div>}
          {error && <div className="saved-jobs-message error">{error}</div>}

          {/* Loading State */}
          {isLoading ? (
            <div className="loading-state">
              <div className="loader"></div>
              <p>{t('loadingSavedJobs')}</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            /* Empty State */
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>{t('noSavedJobs')}</h3>
              <p>
                {searchTerm
                  ? t('adjustSearchTerms')
                  : t('startSavingJobs')}
              </p>
              {searchTerm ? (
                <button onClick={() => setSearchTerm('')} className="btn-primary">
                  {t('clearSearch')}
                </button>
              ) : (
                <button onClick={() => navigate('/')} className="btn-primary">
                  {t('browseJobs')}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Jobs Grid */}
              <div className={`jobs-grid-enhanced ${viewMode}`}>
                {filteredJobs.slice(0, displayCount).map((job, index) => (
                  <div
                    key={job.id}
                    className="job-card-enhanced saved"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Card Header */}
                    <div className="job-card-header">
                      <div className="company-logo-wrapper">
                        <div className="company-logo">{getCompanyInitial(job.company)}</div>
                        <div className="saved-badge-icon">
                          <BookmarkCheck size={12} fill="currentColor" />
                        </div>
                      </div>
                      
                      <div className="job-card-actions">
                        <button
                          onClick={() => handleUnsave(job.id)}
                          className="icon-btn unsave-btn"
                          title={t('removeFromSaved')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Job Info */}
                    <div className="job-info">
                      <h3 className="job-title-enhanced">{job.jobTitle || t('untitledJob')}</h3>
                      <div className="company-info-enhanced">
                        <span className="company-name">{job.company || t('unknownCompany')}</span>
                        {job.location && (
                          <>
                            <span className="separator">•</span>
                            <span className="industry">{job.location}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Job Meta */}
                    <div className="job-meta-enhanced">
                      {job.location && (
                        <div className="meta-item-enhanced">
                          <MapPin size={14} />
                          <span>{job.location}</span>
                        </div>
                      )}
                      <div className="meta-item-enhanced">
                        <Calendar size={14} />
                        <span>{t('saved')} {formatDate(job.appliedAt || job.createdAt)}</span>
                      </div>
                    </div>

                    {/* Notes */}
                    {job.notes && (
                      <div className="job-notes">
                        <p>{job.notes}</p>
                      </div>
                    )}

                    {/* Job Footer */}
                    <div className="job-card-footer">
                      <span className="saved-date">{formatDate(job.appliedAt || job.createdAt)}</span>
                      {job.sourceUrl ? (
                        <a
                          href={job.sourceUrl}
                          className="apply-btn-enhanced"
                          onClick={(e) => handleApply(e, job)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t('viewJob')}
                          <ExternalLink size={16} />
                        </a>
                      ) : (
                        <button
                          className="apply-btn-enhanced"
                          onClick={() => navigate('/')}
                        >
                          {t('browseJobs')}
                          <ArrowRight size={16} />
                        </button>
                      )}
                    </div>

                    {/* 3D Hover Effect Layer */}
                    <div className="card-shine"></div>
                  </div>
                ))}
              </div>

              {/* Load More */}
              {displayCount < filteredJobs.length && (
                <div className="load-more-section">
                  <button onClick={loadMore} className="btn-load-more">
                    {t('loadMoreJobs')}
                    <ChevronDown size={20} />
                  </button>
                  <p className="load-more-info">
                    {t('moreJobsAvailable', { count: filteredJobs.length - displayCount })}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default SavedJobs;
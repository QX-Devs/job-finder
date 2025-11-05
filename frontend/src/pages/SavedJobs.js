import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
      setError('Failed to load saved jobs');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsave = async (jobId) => {
    if (!window.confirm('Are you sure you want to remove this job from your saved list?')) {
      return;
    }

    try {
      const res = await applicationService.remove(jobId);
      if (res.success) {
        setSavedJobs(prev => prev.filter(job => job.id !== jobId));
        setMessage('Job removed from saved list');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setError('Failed to unsave job');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleApply = (e, job) => {
    if (job.sourceUrl) {
      window.open(job.sourceUrl, '_blank', 'noopener noreferrer');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently saved';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
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
            <span>Saved Jobs</span>
          </div>
          <h1 className="saved-jobs-title">Your Saved Opportunities</h1>
          <p className="saved-jobs-subtitle">
            Keep track of jobs you're interested in. Apply when you're ready!
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
                placeholder="Search saved jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input-saved"
              />
            </div>

            <div className="saved-jobs-results-info">
              <p>
                <strong>{filteredJobs.length}</strong> saved job{filteredJobs.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="saved-jobs-view-controls">
              <button
                onClick={() => setViewMode('grid')}
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                title="Grid View"
              >
                <Grid3x3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                title="List View"
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
              <p>Loading your saved jobs...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            /* Empty State */
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No saved jobs yet</h3>
              <p>
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Start saving jobs from the home page to see them here'}
              </p>
              {searchTerm ? (
                <button onClick={() => setSearchTerm('')} className="btn-primary">
                  Clear Search
                </button>
              ) : (
                <button onClick={() => navigate('/')} className="btn-primary">
                  Browse Jobs
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
                          title="Remove from saved"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Job Info */}
                    <div className="job-info">
                      <h3 className="job-title-enhanced">{job.jobTitle || 'Untitled Job'}</h3>
                      <div className="company-info-enhanced">
                        <span className="company-name">{job.company || 'Unknown Company'}</span>
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
                        <span>Saved {formatDate(job.appliedAt || job.createdAt)}</span>
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
                          View Job
                          <ExternalLink size={16} />
                        </a>
                      ) : (
                        <button
                          className="apply-btn-enhanced"
                          onClick={() => navigate('/')}
                        >
                          Browse Jobs
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
                    Load More Jobs
                    <ChevronDown size={20} />
                  </button>
                  <p className="load-more-info">
                    {filteredJobs.length - displayCount} more jobs available
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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  Search, MapPin, Briefcase, DollarSign, Building2,
  Star, ArrowRight, Filter, X, TrendingUp, Clock, Users,
  SlidersHorizontal, Zap, Target,
  Award, Rocket, Bookmark, BookmarkCheck, Share2, Eye
} from 'lucide-react';
import authService from '../services/authService';
import applicationService from '../services/applicationService';
import jobService from '../services/jobService';
import './FindJobs.css';

const FindJobs = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [jobIdToApplicationId, setJobIdToApplicationId] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('latest');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);

  const [filters, setFilters] = useState({
    jobType: 'all',
    location: 'all',
    experienceLevel: 'all',
    salaryRange: 'all',
    remote: false
  });

  const isLoggedIn = authService.isAuthenticated();
  const heroRef = useRef(null);
  const jobsRef = useRef(null);

  const categories = useMemo(() => ([
    { id: 'all', name: t('allJobs'), icon: Briefcase, count: 0 },
    { id: 'engineering', name: t('engineering'), icon: Rocket, count: 0 },
    { id: 'design', name: t('design'), icon: Target, count: 0 },
    { id: 'marketing', name: t('marketing'), icon: TrendingUp, count: 0 },
    { id: 'sales', name: t('sales'), icon: Users, count: 0 },
    { id: 'product', name: t('product'), icon: Zap, count: 0 }
  ]), [t]);

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        console.log('FindJobs: Fetching jobs from API...');
        const response = await jobService.getAll();
        console.log('FindJobs: API response:', { success: response.success, count: response.data?.length || 0 });
        
        if (response.success && response.data) {
          // Transform API jobs to match frontend format (only real fields from backend)
          const transformedJobs = response.data.map((job) => {
            // Parse salary to extract min/max if available
            let salaryMin = 0;
            let salaryMax = 0;
            if (job.salary) {
              const salaryMatch = job.salary.match(/\$?(\d+)[Kk]?\s*-\s*\$?(\d+)[Kk]?/);
              if (salaryMatch) {
                salaryMin = parseInt(salaryMatch[1]) * (salaryMatch[1].length < 3 ? 1000 : 1);
                salaryMax = parseInt(salaryMatch[2]) * (salaryMatch[2].length < 3 ? 1000 : 1);
              }
            }

            // Flatten tags array (handle nested arrays from API)
            const flattenTags = (tags) => {
              if (!tags || !Array.isArray(tags)) return [];
              return tags.flat().filter(t => typeof t === 'string' && t.trim().length > 0);
            };
            const flatTags = flattenTags(job.tags);

            // Infer category from title/tags
            const titleLower = (job.title || '').toLowerCase();
            const tagsLower = flatTags.map(t => t.toLowerCase()).join(' ');
            let category = 'engineering';
            if (titleLower.includes('design') || tagsLower.includes('design')) category = 'design';
            else if (titleLower.includes('market') || tagsLower.includes('market')) category = 'marketing';
            else if (titleLower.includes('sales') || tagsLower.includes('sales')) category = 'sales';
            else if (titleLower.includes('product') || tagsLower.includes('product')) category = 'product';

            // Generate company logo emoji (simple hash-based)
            const companyLogos = ['🏢', '🔍', '📦', '👁️', '🍎', '🎬', '🎨', '☁️', '🔮', '💼'];
            const logoIndex = (job.company || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % companyLogos.length;

            // Format posted date
            const postedDate = job.posted_at 
              ? new Date(job.posted_at)
              : (job.createdAt ? new Date(job.createdAt) : new Date());
            const daysAgo = Math.floor((Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24));
            const postedDateStr = daysAgo === 0 
              ? t('today')
              : daysAgo === 1
              ? t('oneDayAgo')
              : `${daysAgo} ${t('daysAgo')}`;

            return {
              id: job.id,
              title: job.title,
              company: job.company,
              companyLogo: companyLogos[logoIndex],
              industry: 'Technology',
              location: job.location || t('remote'),
              salary: job.salary || 'Salary not specified',
              salaryMin,
              salaryMax,
              jobType: 'Full-time',
              experienceLevel: 'Mid Level',
              category,
              skills: flatTags,
              postedDate: postedDateStr,
              postedTimestamp: postedDate.getTime(),
              description: job.description || '',
              applicationUrl: job.apply_url,
              remote: (job.location || '').toLowerCase().includes('remote')
            };
          });

          console.log(`FindJobs: Transformed ${transformedJobs.length} jobs`);
          setJobs(transformedJobs);
          setFilteredJobs(transformedJobs);
          // Auto-select first job
          if (transformedJobs.length > 0 && !selectedJob) {
            setSelectedJob(transformedJobs[0]);
          }
        } else {
          console.warn('FindJobs: No jobs in response or response not successful');
          setJobs([]);
          setFilteredJobs([]);
        }
      } catch (error) {
        console.error('FindJobs: Error fetching jobs:', error);
        setJobs([]);
        setFilteredJobs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [t]);

  useEffect(() => {
    let result = jobs;

    if (searchTerm) {
      result = result.filter(job =>
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.skills && Array.isArray(job.skills) && job.skills.some(skill => 
          typeof skill === 'string' && skill.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(job => job.category === selectedCategory);
    }

    if (filters.jobType !== 'all') {
      result = result.filter(job => job.jobType === filters.jobType);
    }
    if (filters.location !== 'all') {
      if (filters.location === 'remote') {
        result = result.filter(job => job.remote || job.location.toLowerCase().includes('remote'));
      } else {
        result = result.filter(job => job.location === filters.location);
      }
    }
    if (filters.experienceLevel !== 'all') {
      result = result.filter(job => job.experienceLevel === filters.experienceLevel);
    }
    if (filters.salaryRange !== 'all') {
      const [min, max] = filters.salaryRange.split('-').map(Number);
      result = result.filter(job => job.salaryMin >= min && job.salaryMax <= max);
    }
    if (filters.remote) {
      result = result.filter(job => job.remote);
    }

    switch (sortBy) {
      case 'latest':
        result.sort((a, b) => b.postedTimestamp - a.postedTimestamp);
        break;
      case 'salary-high':
        result.sort((a, b) => b.salaryMax - a.salaryMax);
        break;
      case 'salary-low':
        result.sort((a, b) => a.salaryMin - b.salaryMin);
        break;
      case 'popular':
        result.sort((a, b) => b.postedTimestamp - a.postedTimestamp);
        break;
      default:
        break;
    }

    setFilteredJobs([...result]);
    // Reset selected job if it's no longer in filtered results
    if (selectedJob && !result.find(j => j.id === selectedJob.id)) {
      setSelectedJob(null);
    }
  }, [jobs, searchTerm, selectedCategory, filters, sortBy, selectedJob]);

  const openAuthModal = () => {
    navigate('/'); // fallback to home to trigger existing auth flow
  };

  const toggleSaveJob = async (jobId) => {
    if (!isLoggedIn) {
      openAuthModal();
      return;
    }

    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    const isSaved = savedJobs.has(jobId);
    try {
      if (!isSaved) {
        const payload = {
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          sourceUrl: job.applicationUrl,
          status: 'saved',
          notes: ''
        };
        const res = await applicationService.create(payload);
        if (res?.success && res.data?.id) {
          setSavedJobs(prev => new Set(prev).add(jobId));
          setJobIdToApplicationId(prev => ({ ...prev, [jobId]: res.data.id }));
        }
      } else {
        let appId = jobIdToApplicationId[jobId];
        if (!appId) {
          try {
            const listRes = await applicationService.list();
            if (listRes?.success) {
              const match = (listRes.data || []).find(a => a.status === 'saved' && a.jobTitle === job.title && a.company === job.company);
              if (match) appId = match.id;
            }
          } catch (_) {}
        }
        if (appId) {
          const delRes = await applicationService.remove(appId);
          if (delRes?.success) {
            setSavedJobs(prev => { const ns = new Set(prev); ns.delete(jobId); return ns; });
            setJobIdToApplicationId(prev => { const copy = { ...prev }; delete copy[jobId]; return copy; });
          }
        } else {
          setSavedJobs(prev => { const ns = new Set(prev); ns.delete(jobId); return ns; });
        }
      }
    } catch (_) {}
  };

  const handleApplyClick = (e, job) => {
    if (!isLoggedIn) {
      e.preventDefault();
      openAuthModal();
      return;
    }
    // Allow default behavior - link will open in new tab
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setFilters({ jobType: 'all', location: 'all', experienceLevel: 'all', salaryRange: 'all', remote: false });
    setSortBy('latest');
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section" ref={heroRef}>
        <div className="hero-bg">
          <div className="hero-gradient hero-g1"></div>
          <div className="hero-gradient hero-g2"></div>
          <div className="hero-gradient hero-g3"></div>
        </div>

        <div className="hero-content-wrap">
          <div className="hero-badge">
            <Briefcase size={16} />
            <span>{t('findJobs')}</span>
          </div>
          <h1 className="hero-title">{t('discoverNextRole')}</h1>
          <p className="hero-subtitle">{t('searchOpportunities')}</p>
        </div>
      </section>

      {/* Results Controls */}
      <div className="results-bar">
        <div className="results-inner">
          <div className="results-info">
            <p>
              {t('showingResults')} <strong>{filteredJobs.length}</strong> {t('results')}
            </p>
          </div>

          <div className="results-controls">
            <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="latest">{t('latest')}</option>
              <option value="salary-high">{t('salaryHighToLow')}</option>
              <option value="salary-low">{t('salaryLowToHigh')}</option>
              <option value="popular">{t('mostPopular')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <section className="search-section">
        <div className="search-wrap">
          <div className="search-box">
            <div className="search-field">
              <Search size={18} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchPlaceholder')}
              />
            </div>
            <button className="btn-primary" onClick={() => jobsRef.current?.scrollIntoView({ behavior: 'smooth' })}>
              {t('search')}
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="filters-bar">
            <button className="filter-chip" onClick={() => setShowFilters(v => !v)}>
              <SlidersHorizontal size={16} />
              {t('filters')}
            </button>
            <div className="filters-inline">
              <button className={`filter-chip ${filters.jobType !== 'all' ? 'active' : ''}`} onClick={() => setFilters({ ...filters, jobType: filters.jobType === 'all' ? 'Full-time' : 'all' })}>
                <Briefcase size={14} /> {t('jobType')}
              </button>
              <button className={`filter-chip ${filters.location !== 'all' ? 'active' : ''}`} onClick={() => setFilters({ ...filters, location: filters.location === 'all' ? 'Remote' : 'all' })}>
                <MapPin size={14} /> {t('location')}
              </button>
              <button className={`filter-chip ${filters.experienceLevel !== 'all' ? 'active' : ''}`} onClick={() => setFilters({ ...filters, experienceLevel: filters.experienceLevel === 'all' ? 'Senior' : 'all' })}>
                <Award size={14} /> {t('experience')}
              </button>
              <button className={`filter-chip ${filters.remote ? 'active' : ''}`} onClick={() => setFilters({ ...filters, remote: !filters.remote })}>
                <Building2 size={14} /> {t('remoteOnly')}
              </button>
            </div>
            <button className="clear-btn" onClick={clearFilters}>
              <X size={14} /> {t('clear')}
            </button>
          </div>
        </div>
      </section>

      {/* Jobs Section - Split Layout */}
      <section className="jobs-section-split" ref={jobsRef}>
        {isLoading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>{t('findingOpportunities')}</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔎</div>
            <h3>{t('noJobsFound')}</h3>
            <p>{t('tryAdjusting')}</p>
            <button onClick={clearFilters} className="btn-primary">{t('clearFilters')}</button>
          </div>
        ) : (
          <div className="split-container">
            {/* Left Sidebar - Job List */}
            <div className="jobs-list-sidebar">
              <div className="jobs-list-header">
                <h3>{t('jobListings')}</h3>
                <span className="job-count">{filteredJobs.length} {t('jobs')}</span>
              </div>
              <div className="jobs-list-content">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className={`job-list-item ${selectedJob?.id === job.id ? 'active' : ''}`}
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="job-item-header">
                      <div className="job-item-logo">{job.companyLogo}</div>
                      <div className="job-item-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveJob(job.id);
                          }}
                          className={`job-item-save-btn ${savedJobs.has(job.id) ? 'saved' : ''}`}
                          title={t('saveJob')}
                        >
                          {savedJobs.has(job.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="job-item-content">
                      <h4 className="job-item-title">{job.title}</h4>
                      <p className="job-item-company">{job.company}</p>
                      <div className="job-item-meta">
                        <span><MapPin size={12} /> {job.location}</span>
                        <span><DollarSign size={12} /> {job.salary}</span>
                      </div>
                      <div className="job-item-badges">
                        {job.remote && <span className="badge-small remote-badge">{t('remote')}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel - Job Details */}
            <div className="job-details-panel">
              {selectedJob ? (
                <div className="job-details-content">
                  <div className="job-details-header">
                    <div className="job-details-company">
                      <div className="job-details-logo">{selectedJob.companyLogo}</div>
                      <div>
                        <h1 className="job-details-title">{selectedJob.title}</h1>
                        <div className="job-details-company-info">
                          <span className="company-name">{selectedJob.company}</span>
                          <span className="separator">•</span>
                          <span className="industry">{selectedJob.industry}</span>
                        </div>
                      </div>
                    </div>
                    <div className="job-details-actions">
                      <button
                        onClick={() => toggleSaveJob(selectedJob.id)}
                        className={`btn-icon ${savedJobs.has(selectedJob.id) ? 'saved' : ''}`}
                        title={t('saveJob')}
                      >
                        {savedJobs.has(selectedJob.id) ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                      </button>
                      <button className="btn-icon" title={t('shareJob')}>
                        <Share2 size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="job-details-badges">
                    {selectedJob.remote && <span className="badge remote-badge">{t('remote')}</span>}
                  </div>

                  <div className="job-details-meta-grid">
                    <div className="meta-card">
                      <MapPin size={18} />
                      <div>
                        <span className="meta-label">{t('location')}</span>
                        <span className="meta-value">{selectedJob.location}</span>
                      </div>
                    </div>
                    <div className="meta-card">
                      <Briefcase size={18} />
                      <div>
                        <span className="meta-label">{t('jobType')}</span>
                        <span className="meta-value">{selectedJob.jobType}</span>
                      </div>
                    </div>
                    <div className="meta-card">
                      <DollarSign size={18} />
                      <div>
                        <span className="meta-label">{t('salary')}</span>
                        <span className="meta-value">{selectedJob.salary}</span>
                      </div>
                    </div>
                    <div className="meta-card">
                      <Award size={18} />
                      <div>
                        <span className="meta-label">{t('experienceLevel')}</span>
                        <span className="meta-value">{selectedJob.experienceLevel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="job-details-section">
                    <h3>{t('description')}</h3>
                    <p>{selectedJob.description}</p>
                    <p>{t('jobDescription')}</p>
                  </div>

                  <div className="job-details-section">
                    <h3>{t('requiredSkills')}</h3>
                    <div className="job-skills-list">
                      {selectedJob.skills.map((skill, idx) => (
                        <span key={idx} className="skill-tag-large">{skill}</span>
                      ))}
                    </div>
                  </div>

                  <div className="job-details-section">
                    <h3>{t('jobStatistics')}</h3>
                    <div className="job-stats-grid">
                      <div className="stat-item">
                        <Clock size={18} />
                        <span>{selectedJob.postedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="job-details-footer">
                    <a
                      href={selectedJob.applicationUrl}
                      className="apply-btn-large"
                      onClick={(e) => handleApplyClick(e, selectedJob)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('applyNow')}
                      <ArrowRight size={20} />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="job-details-empty">
                  <div className="empty-icon-large">💼</div>
                  <h2>{t('selectJob')}</h2>
                  <p>{t('selectJobPrompt')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default FindJobs;
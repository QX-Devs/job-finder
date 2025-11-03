import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Briefcase, DollarSign, Building2, 
  ExternalLink, Bookmark, BookmarkCheck, Star, 
  CheckCircle, ArrowRight, Sparkles, FileText, Brain,
  Filter, X, TrendingUp, Clock, Users, Grid3x3, List,
  SlidersHorizontal, ChevronDown, Zap, Target, Award,
  Rocket, Heart, Share2, Eye, Calendar, Badge
} from 'lucide-react';
import AuthModal from '../components/AuthModal';
import authService from '../services/authService';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('latest');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [displayCount, setDisplayCount] = useState(9);
  
  const [filters, setFilters] = useState({
    jobType: 'all',
    location: 'all',
    experienceLevel: 'all',
    salaryRange: 'all',
    remote: false
  });
  
  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');
  
  const isLoggedIn = authService.isAuthenticated();
  const heroRef = useRef(null);
  const jobsRef = useRef(null);

  // Job Categories with icons
  const categories = [
    { id: 'all', name: 'All Jobs', icon: Briefcase, count: 0 },
    { id: 'engineering', name: 'Engineering', icon: Rocket, count: 0 },
    { id: 'design', name: 'Design', icon: Target, count: 0 },
    { id: 'marketing', name: 'Marketing', icon: TrendingUp, count: 0 },
    { id: 'sales', name: 'Sales', icon: Users, count: 0 },
    { id: 'product', name: 'Product', icon: Zap, count: 0 }
  ];

  // Mock job data with more details
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const mockJobs = generateMockJobs();
      setJobs(mockJobs);
      setFilteredJobs(mockJobs);
      setIsLoading(false);
    }, 800);
  }, []);

  const generateMockJobs = () => {
    const companies = [
      { name: 'Microsoft', logo: '🏢', industry: 'Technology' },
      { name: 'Google', logo: '🔍', industry: 'Technology' },
      { name: 'Amazon', logo: '📦', industry: 'E-commerce' },
      { name: 'Meta', logo: '👁️', industry: 'Social Media' },
      { name: 'Apple', logo: '🍎', industry: 'Technology' },
      { name: 'Netflix', logo: '🎬', industry: 'Entertainment' },
      { name: 'Adobe', logo: '🎨', industry: 'Software' },
      { name: 'Salesforce', logo: '☁️', industry: 'CRM' },
      { name: 'Oracle', logo: '🔮', industry: 'Database' },
      { name: 'IBM', logo: '💼', industry: 'Technology' }
    ];
    
    const positions = [
      { title: 'Senior Software Engineer', category: 'engineering', skills: ['React', 'Node.js', 'AWS'] },
      { title: 'Frontend Developer', category: 'engineering', skills: ['Vue.js', 'TypeScript', 'CSS'] },
      { title: 'Backend Developer', category: 'engineering', skills: ['Python', 'Django', 'PostgreSQL'] },
      { title: 'Full Stack Developer', category: 'engineering', skills: ['JavaScript', 'MongoDB', 'Express'] },
      { title: 'DevOps Engineer', category: 'engineering', skills: ['Docker', 'Kubernetes', 'Jenkins'] },
      { title: 'UX/UI Designer', category: 'design', skills: ['Figma', 'Sketch', 'Adobe XD'] },
      { title: 'Product Designer', category: 'design', skills: ['Prototyping', 'User Research', 'Design Systems'] },
      { title: 'Marketing Manager', category: 'marketing', skills: ['SEO', 'Analytics', 'Content Strategy'] },
      { title: 'Sales Executive', category: 'sales', skills: ['B2B Sales', 'CRM', 'Negotiation'] },
      { title: 'Product Manager', category: 'product', skills: ['Agile', 'Roadmapping', 'Stakeholder Management'] }
    ];

    const locations = [
      'Remote', 'San Francisco, CA', 'New York, NY', 'Seattle, WA',
      'Austin, TX', 'Boston, MA', 'Chicago, IL', 'Denver, CO'
    ];

    const types = ['Full-time', 'Part-time', 'Contract', 'Internship'];
    const levels = ['Entry Level', 'Mid Level', 'Senior', 'Lead'];

    const mockData = [];
    for (let i = 0; i < 50; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)];
      const position = positions[Math.floor(Math.random() * positions.length)];
      const minSalary = Math.floor(Math.random() * 50 + 80);
      const maxSalary = minSalary + Math.floor(Math.random() * 50 + 40);
      
      mockData.push({
        id: i + 1,
        title: position.title,
        company: company.name,
        companyLogo: company.logo,
        industry: company.industry,
        location: locations[Math.floor(Math.random() * locations.length)],
        salary: `$${minSalary}K - $${maxSalary}K`,
        salaryMin: minSalary,
        salaryMax: maxSalary,
        jobType: types[Math.floor(Math.random() * types.length)],
        experienceLevel: levels[Math.floor(Math.random() * levels.length)],
        category: position.category,
        skills: position.skills,
        postedDate: `${Math.floor(Math.random() * 14 + 1)} days ago`,
        postedTimestamp: Date.now() - (Math.floor(Math.random() * 14 + 1) * 86400000),
        description: 'Join our innovative team to build cutting-edge solutions that impact millions of users worldwide. We offer competitive compensation, great benefits, and opportunities for growth.',
        applicants: Math.floor(Math.random() * 200 + 50),
        views: Math.floor(Math.random() * 1000 + 500),
        applicationUrl: 'https://example.com/apply',
        featured: i < 3,
        urgent: i < 2,
        remote: Math.random() > 0.5
      });
    }
    return mockData;
  };

  // Enhanced filtering with multiple criteria
  useEffect(() => {
    let result = jobs;

    // Search filter
    if (searchTerm) {
      result = result.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(job => job.category === selectedCategory);
    }

    // Job type filter
    if (filters.jobType !== 'all') {
      result = result.filter(job => job.jobType === filters.jobType);
    }

    // Location filter
    if (filters.location !== 'all') {
      if (filters.location === 'remote') {
        result = result.filter(job => job.remote || job.location.toLowerCase().includes('remote'));
      } else {
        result = result.filter(job => job.location === filters.location);
      }
    }

    // Experience level filter
    if (filters.experienceLevel !== 'all') {
      result = result.filter(job => job.experienceLevel === filters.experienceLevel);
    }

    // Salary range filter
    if (filters.salaryRange !== 'all') {
      const [min, max] = filters.salaryRange.split('-').map(Number);
      result = result.filter(job => 
        job.salaryMin >= min && job.salaryMax <= max
      );
    }

    // Remote filter
    if (filters.remote) {
      result = result.filter(job => job.remote);
    }

    // Sorting
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
        result.sort((a, b) => b.applicants - a.applicants);
        break;
      default:
        break;
    }

    setFilteredJobs(result);
  }, [filters, searchTerm, selectedCategory, sortBy, jobs]);

  const toggleSaveJob = (jobId) => {
    if (!isLoggedIn) {
      openAuthModal('login');
      return;
    }

    setSavedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const handleApplyClick = (e, job) => {
    if (!isLoggedIn) {
      e.preventDefault();
      openAuthModal('login');
      return;
    }
  };

  const openAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleAuthSuccess = () => {
    window.location.reload();
  };

  const clearFilters = () => {
    setFilters({
      jobType: 'all',
      location: 'all',
      experienceLevel: 'all',
      salaryRange: 'all',
      remote: false
    });
    setSelectedCategory('all');
    setSearchTerm('');
  };

  const loadMore = () => {
    setDisplayCount(prev => prev + 9);
  };

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Matching',
      description: 'Smart algorithms match you with jobs that fit your skills and experience perfectly',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: FileText,
      title: 'Resume Builder',
      description: 'Create professional, ATS-friendly resumes in minutes with our AI-powered builder',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Target,
      title: 'Career Guidance',
      description: 'Get personalized career advice and skill recommendations based on market trends',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Zap,
      title: 'Instant Applications',
      description: 'Apply to multiple jobs with one click using your saved profile',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: TrendingUp,
      title: 'Salary Insights',
      description: 'Know your worth with real-time salary data and negotiation tips',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Award,
      title: 'Skill Assessment',
      description: 'Prove your expertise with verified skill assessments and certifications',
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  const activeFiltersCount = Object.values(filters).filter(
    v => v !== 'all' && v !== false
  ).length + (selectedCategory !== 'all' ? 1 : 0);

  return (
    <>
      <div className="home-container">
        {/* Quick Stats Banner */}
        <div className="stats-banner">
          <div className="stats-banner-content">
            <div className="stat-chip">
              <Briefcase size={16} />
              <span><strong>{jobs.length}+</strong> Active Jobs</span>
            </div>
            <div className="stat-chip">
              <Users size={16} />
              <span><strong>50K+</strong> Job Seekers</span>
            </div>
            <div className="stat-chip">
              <Building2 size={16} />
              <span><strong>500+</strong> Companies</span>
            </div>
            <div className="stat-chip">
              <TrendingUp size={16} />
              <span><strong>95%</strong> Success Rate</span>
            </div>
          </div>
        </div>

        {/* Jobs Section - Now at the top */}
        <section className="jobs-section-top" ref={jobsRef}>
          <div className="jobs-header">
            <div className="jobs-header-content">
              <div className="jobs-title-section">
                <h1 className="jobs-main-title">
                  Discover Your <span className="gradient-text">Dream Career</span>
                </h1>
                <p className="jobs-subtitle">
                  {filteredJobs.length} opportunities waiting for talented people like you
                </p>
              </div>
              
              {!isLoggedIn && (
                <button onClick={() => openAuthModal('signup')} className="header-cta-btn">
                  <Sparkles size={18} />
                  Get Personalized Jobs
                </button>
              )}
            </div>

            {/* Enhanced Search Bar */}
            <div className="search-section">
              <div className="search-box-enhanced">
                <Search size={22} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by job title, company, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input-enhanced"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="search-clear">
                    <X size={18} />
                  </button>
                )}
              </div>
              
              <button 
                onClick={() => setShowFilters(!showFilters)} 
                className={`filter-toggle-btn ${activeFiltersCount > 0 ? 'active' : ''}`}
              >
                <SlidersHorizontal size={20} />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="filter-badge">{activeFiltersCount}</span>
                )}
              </button>
            </div>

            {/* Categories Chips */}
            <div className="categories-scroll">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const count = cat.id === 'all' 
                  ? jobs.length 
                  : jobs.filter(j => j.category === cat.id).length;
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                  >
                    <Icon size={16} />
                    {cat.name}
                    <span className="category-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="filters-panel">
              <div className="filters-panel-header">
                <h3>Advanced Filters</h3>
                <div className="filters-actions">
                  <button onClick={clearFilters} className="clear-filters-btn">
                    Clear All
                  </button>
                  <button onClick={() => setShowFilters(false)} className="close-filters-btn">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="filters-grid">
                <div className="filter-group">
                  <label>Job Type</label>
                  <select
                    value={filters.jobType}
                    onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                    className="filter-select-enhanced"
                  >
                    <option value="all">All Types</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Location</label>
                  <select
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    className="filter-select-enhanced"
                  >
                    <option value="all">All Locations</option>
                    <option value="remote">Remote</option>
                    <option value="San Francisco, CA">San Francisco, CA</option>
                    <option value="New York, NY">New York, NY</option>
                    <option value="Seattle, WA">Seattle, WA</option>
                    <option value="Austin, TX">Austin, TX</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Experience Level</label>
                  <select
                    value={filters.experienceLevel}
                    onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
                    className="filter-select-enhanced"
                  >
                    <option value="all">All Levels</option>
                    <option value="Entry Level">Entry Level</option>
                    <option value="Mid Level">Mid Level</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Salary Range</label>
                  <select
                    value={filters.salaryRange}
                    onChange={(e) => setFilters({ ...filters, salaryRange: e.target.value })}
                    className="filter-select-enhanced"
                  >
                    <option value="all">All Salaries</option>
                    <option value="0-80">Under $80K</option>
                    <option value="80-120">$80K - $120K</option>
                    <option value="120-160">$120K - $160K</option>
                    <option value="160-999">$160K+</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.remote}
                      onChange={(e) => setFilters({ ...filters, remote: e.target.checked })}
                    />
                    <span>Remote Only</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Results Bar */}
          <div className="results-bar">
            <div className="results-info">
              <p>
                Showing <strong>{Math.min(displayCount, filteredJobs.length)}</strong> of{' '}
                <strong>{filteredJobs.length}</strong> jobs
              </p>
            </div>

            <div className="results-controls">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="latest">Latest</option>
                <option value="salary-high">Salary: High to Low</option>
                <option value="salary-low">Salary: Low to High</option>
                <option value="popular">Most Popular</option>
              </select>

              <div className="view-toggle">
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
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="loading-state">
              <div className="loader"></div>
              <p>Finding the best opportunities for you...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            /* Empty State */
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No jobs found</h3>
              <p>Try adjusting your filters or search terms</p>
              <button onClick={clearFilters} className="btn-primary">
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              {/* Jobs Grid */}
              <div className={`jobs-grid-enhanced ${viewMode}`}>
                {filteredJobs.slice(0, displayCount).map((job, index) => (
                  <div
                    key={job.id}
                    className={`job-card-enhanced ${job.featured ? 'featured' : ''} ${job.urgent ? 'urgent' : ''}`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Card Header */}
                    <div className="job-card-header">
                      <div className="company-logo-wrapper">
                        <div className="company-logo">{job.companyLogo}</div>
                        {job.featured && (
                          <div className="featured-badge-icon">
                            <Star size={12} fill="currentColor" />
                          </div>
                        )}
                      </div>
                      
                      <div className="job-card-actions">
                        <button
                          onClick={() => toggleSaveJob(job.id)}
                          className={`icon-btn ${savedJobs.has(job.id) ? 'saved' : ''}`}
                          title="Save job"
                        >
                          {savedJobs.has(job.id) ? (
                            <BookmarkCheck size={20} />
                          ) : (
                            <Bookmark size={20} />
                          )}
                        </button>
                        <button className="icon-btn" title="Share job">
                          <Share2 size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="job-badges">
                      {job.urgent && (
                        <span className="badge urgent-badge">
                          <Zap size={12} />
                          Urgent
                        </span>
                      )}
                      {job.featured && (
                        <span className="badge featured-badge-text">
                          <Star size={12} />
                          Featured
                        </span>
                      )}
                      {job.remote && (
                        <span className="badge remote-badge">
                          Remote
                        </span>
                      )}
                    </div>

                    {/* Job Info */}
                    <div className="job-info">
                      <h3 className="job-title-enhanced">{job.title}</h3>
                      <div className="company-info-enhanced">
                        <span className="company-name">{job.company}</span>
                        <span className="separator">•</span>
                        <span className="industry">{job.industry}</span>
                      </div>
                    </div>

                    {/* Job Meta */}
                    <div className="job-meta-enhanced">
                      <div className="meta-item-enhanced">
                        <MapPin size={14} />
                        <span>{job.location}</span>
                      </div>
                      <div className="meta-item-enhanced">
                        <Briefcase size={14} />
                        <span>{job.jobType}</span>
                      </div>
                      <div className="meta-item-enhanced">
                        <DollarSign size={14} />
                        <span>{job.salary}</span>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="job-skills">
                      {job.skills.map((skill, idx) => (
                        <span key={idx} className="skill-tag">{skill}</span>
                      ))}
                    </div>

                    {/* Job Stats */}
                    <div className="job-stats">
                      <div className="stat">
                        <Eye size={14} />
                        <span>{job.views} views</span>
                      </div>
                      <div className="stat">
                        <Users size={14} />
                        <span>{job.applicants} applicants</span>
                      </div>
                      <div className="stat">
                        <Clock size={14} />
                        <span>{job.postedDate}</span>
                      </div>
                    </div>

                    {/* Job Footer */}
                    <div className="job-card-footer">
                      <span className="experience-level">{job.experienceLevel}</span>
                      <a
                        href={job.applicationUrl}
                        className="apply-btn-enhanced"
                        onClick={(e) => handleApplyClick(e, job)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Apply Now
                        <ArrowRight size={16} />
                      </a>
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
        </section>

        {/* Features Section */}
        <section className="features-section-enhanced" ref={heroRef}>
          <div className="features-header">
            <div className="features-badge">
              <Sparkles size={16} />
              <span>Powerful Features</span>
            </div>
            <h2 className="features-title">
              Everything You Need to <span className="gradient-text">Succeed</span>
            </h2>
            <p className="features-subtitle">
              Cutting-edge tools and AI-powered features to accelerate your career
            </p>
          </div>

          <div className="features-grid-enhanced">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="feature-card-enhanced"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`feature-icon-enhanced gradient-${index}`}>
                    <Icon size={28} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <div className="feature-card-glow"></div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section-enhanced">
          <div className="cta-background">
            <div className="cta-circle circle-1"></div>
            <div className="cta-circle circle-2"></div>
            <div className="cta-circle circle-3"></div>
          </div>
          
          <div className="cta-content-enhanced">
            <div className="cta-icon">
              <Rocket size={48} />
            </div>
            <h2>Ready to Launch Your Career?</h2>
            <p>
              Join over 50,000 job seekers who found their dream jobs with GradJob.
              Start your journey today!
            </p>
            
            {!isLoggedIn && (
              <div className="cta-buttons">
                <button onClick={() => openAuthModal('signup')} className="btn-cta-primary">
                  Get Started Free
                  <ArrowRight size={20} />
                </button>
                <button onClick={() => openAuthModal('login')} className="btn-cta-secondary">
                  Sign In
                </button>
              </div>
            )}

            <div className="cta-features">
              <div className="cta-feature">
                <CheckCircle size={18} />
                <span>Free Forever</span>
              </div>
              <div className="cta-feature">
                <CheckCircle size={18} />
                <span>No Credit Card</span>
              </div>
              <div className="cta-feature">
                <CheckCircle size={18} />
                <span>Instant Access</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        defaultTab={authModalTab}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default Home;
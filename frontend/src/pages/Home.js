import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Briefcase, DollarSign, Building2,
  Bookmark, BookmarkCheck,
  CheckCircle, ArrowRight, Sparkles, FileText, Brain,
  X, TrendingUp, Clock, Users, Grid3x3, List,
  SlidersHorizontal, ChevronDown, Zap, Target, Award,
  Rocket, Share2, Badge, Star, Globe, Laptop, Bot
} from 'lucide-react';
import DOMPurify from 'dompurify';
import AuthModal from '../components/AuthModal';
import ResetPasswordModal from '../components/ResetPasswordModal';
import VerificationStatusModal from '../components/VerificationStatusModal';
import AIApplyModal from '../components/AIApplyModal';
import authService from '../services/authService';
import applicationService from '../services/applicationService';
import jobService from '../services/jobService';
import aiApplyService from '../services/aiApplyService';
import { useTranslate } from '../utils/translate';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { prioritizeJobsByCareerObjective, getMatchLevel } from '../utils/jobPrioritization';
import './Home.css';

const Home = () => {
  const { t, isRTL, language } = useTranslate();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [jobIdToApplicationId, setJobIdToApplicationId] = useState({});
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('latest');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [displayCount, setDisplayCount] = useState(9);
  const [selectedJob, setSelectedJob] = useState(null);
  const initialIsMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [expandedJobId, setExpandedJobId] = useState(null);

  // Career Objective from user profile for job prioritization
  const careerObjective = user?.careerObjective || '';

  // Helper function to extract source name from URL
  const getSourceFromUrl = (url) => {
    if (!url) return 'Unknown';
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      if (hostname.includes('linkedin')) return 'LinkedIn';
      if (hostname.includes('indeed')) return 'Indeed';
      if (hostname.includes('glassdoor')) return 'Glassdoor';
      if (hostname.includes('monster')) return 'Monster';
      if (hostname.includes('ziprecruiter')) return 'ZipRecruiter';
      if (hostname.includes('careerbuilder')) return 'CareerBuilder';
      if (hostname.includes('dice')) return 'Dice';
      if (hostname.includes('simplyhired')) return 'SimplyHired';
      if (hostname.includes('bayt')) return 'Bayt';
      if (hostname.includes('wuzzuf')) return 'Wuzzuf';
      if (hostname.includes('akhtaboot')) return 'Akhtaboot';
      // Extract domain name as fallback
      const parts = hostname.replace('www.', '').split('.');
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    } catch {
      return 'External';
    }
  };

  // Helper to extract LinkedIn job ID from various LinkedIn URL formats
  const extractLinkedInJobId = (url) => {
    if (!url) return null;
    try {
      // Match patterns like:
      // /job-apply/4348925531/
      // /jobs/view/4348925531/
      // /jobs/search/?currentJobId=4348925531
      // /jobs/4348925531/
      const patterns = [
        /job-apply\/(\d+)/,
        /jobs\/view\/(\d+)/,
        /currentJobId=(\d+)/,
        /jobs\/(\d+)/
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
    } catch {
      return null;
    }
    return null;
  };

  // Helper to build proper LinkedIn job URL
  const buildLinkedInJobUrl = (linkedinJobId, applyUrl) => {
    // First priority: use provided linkedin_job_id
    if (linkedinJobId) {
      return `https://www.linkedin.com/jobs/search/?currentJobId=${linkedinJobId}`;
    }
    // Second priority: extract from apply_url if it's a LinkedIn URL
    if (applyUrl && applyUrl.includes('linkedin.com')) {
      const extractedId = extractLinkedInJobId(applyUrl);
      if (extractedId) {
        return `https://www.linkedin.com/jobs/search/?currentJobId=${extractedId}`;
      }
    }
    // Fallback: return original URL
    return applyUrl;
  };

  // Helper to get display source - prefer backend source field, fallback to URL parsing
  const getJobSource = (job) => {
    if (job.source && job.source !== 'External') {
      return job.source;
    }
    return getSourceFromUrl(job.applicationUrl);
  };

  const [filters, setFilters] = useState({
    jobType: 'all',
    location: 'all',
    experienceLevel: 'all',
    salaryRange: 'all',
    workplaceType: 'all',
    keyword: '',
    datePosted: 'any'
  });

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');

  // Reset Password Modal State
  const [searchParams, setSearchParams] = useSearchParams();
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetToken, setResetToken] = useState(null);

  // Verification Status Modal State
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState('');

  // AI Apply Modal State
  const [isAIApplyModalOpen, setIsAIApplyModalOpen] = useState(false);
  const [aiApplyJob, setAIApplyJob] = useState(null);
  const [aiApplyStatus, setAIApplyStatus] = useState(null); // null, 'loading', 'success', 'failed'
  const [aiApplyProgress, setAIApplyProgress] = useState(null); // Progress step from backend

  const isLoggedIn = authService.isAuthenticated();
  const heroRef = useRef(null);
  const jobsRef = useRef(null);

  // Job Categories with icons
  const webCategories = [
    { id: 'all', name: t('allJobs'), icon: Briefcase, count: 0 },
    { id: 'engineering', name: t('engineering'), icon: Rocket, count: 0 },
    { id: 'design', name: t('design'), icon: Target, count: 0 },
    { id: 'marketing', name: t('marketing'), icon: TrendingUp, count: 0 },
    { id: 'sales', name: t('sales'), icon: Users, count: 0 },
    { id: 'product', name: t('product'), icon: Zap, count: 0 }
  ];

  // Check for reset password token in URL
  useEffect(() => {
    const token = searchParams.get('token');
    const verifyStatus = searchParams.get('verify');
    const verifyMessage = searchParams.get('message');

    if (token) {
      setResetToken(token);
      setIsResetPasswordModalOpen(true);
      // Remove token from URL but keep it in state
      setSearchParams({}, { replace: true });
    }

    if (verifyStatus) {
      setVerificationStatus(verifyStatus);
      setVerificationMessage(verifyMessage ? decodeURIComponent(verifyMessage) : '');
      setIsVerificationModalOpen(true);
      // Remove verification params from URL
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Track window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setExpandedJobId(null);
    }
  }, [isMobile]);

  // Fetch jobs from API
  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        console.log('Home: Fetching jobs from API...', { careerObjective });
        // Pass career objective to API for server-side prioritization
        const response = await jobService.getAll({ careerObjective });
        console.log('Home: API response:', { success: response.success, count: response.data?.length || 0 });

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
              ? (language === 'en' ? 'Today' : 'اليوم')
              : daysAgo === 1
                ? (language === 'en' ? '1 day ago' : 'يوم واحد')
                : `${daysAgo} ${language === 'en' ? 'days ago' : 'أيام'}`;

            return {
              id: job.id,
              title: job.title,
              company: job.company,
              companyLogo: companyLogos[logoIndex],
              industry: 'Technology',
              location: job.location || 'Remote',
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
              // Build proper LinkedIn URL or fallback to apply_url
              applicationUrl: buildLinkedInJobUrl(job.linkedin_job_id, job.apply_url),
              remote: (job.location || '').toLowerCase().includes('remote'),
              // Easy Apply indicator from backend
              easyApply: job.easy_apply === true,
              // Source from backend
              source: job.source || 'External',
              // Workplace type from backend (Remote, On-site, Hybrid)
              workplaceType: job.workplace_type || null,
              // Preserve career match score from API (server-side prioritization)
              careerMatchScore: job.careerMatchScore || 0
            };
          });

          console.log(`Home: Transformed ${transformedJobs.length} jobs`);

          // Sort jobs immediately after transformation (before setting state)
          // This ensures correct sorting on initial render
          const sortedJobs = transformedJobs.sort((a, b) => {
            // Helper function to check if location is Amman
            const isAmman = (location) => {
              if (!location) return false;
              return location.toLowerCase().includes('amman');
            };

            // Prioritize Amman jobs first
            const aIsAmman = isAmman(a.location);
            const bIsAmman = isAmman(b.location);

            if (aIsAmman && !bIsAmman) return -1;
            if (!aIsAmman && bIsAmman) return 1;

            // If both are Amman or both are not, sort by date (latest first)
            return b.postedTimestamp - a.postedTimestamp;
          });

          setJobs(sortedJobs);
        } else {
          console.warn('Home: No jobs in response or response not successful');
          setJobs([]);
        }
      } catch (error) {
        console.error('Home: Error fetching jobs:', error);
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [language, careerObjective]); // Re-fetch when career objective changes

  // Extract unique values from jobs for dynamic dropdowns
  const uniqueJobTypes = useMemo(() => {
    const types = new Set(jobs.map(job => job.jobType).filter(Boolean));
    return Array.from(types).sort();
  }, [jobs]);

  const uniqueLocations = useMemo(() => {
    // Define city-to-country mappings for Jordan
    const jordanCities = ['amman', 'irbid', 'zarqa', 'aqaba', 'madaba', 'jerash', 'ajloun', 'karak', 'mafraq', 'salt', 'tafilah', 'maan'];

    // Normalize location to country/region level
    const normalizeToRegion = (location) => {
      if (!location) return null;
      const lower = location.toLowerCase();

      // Check if it's a Jordan city or contains "jordan"
      if (lower.includes('jordan') || jordanCities.some(city => lower.includes(city))) {
        return 'Jordan';
      }

      // Keep regional identifiers as-is
      if (lower.includes('emea')) return 'EMEA';
      if (lower.includes('mena')) return 'MENA';
      if (lower.includes('remote')) return 'Remote';

      // For other locations, clean up duplicates and return
      const parts = location.split(',').map(p => p.trim()).filter(Boolean);
      const uniqueParts = [...new Set(parts)];
      return uniqueParts[0]; // Return primary location
    };

    const regions = new Set();

    jobs.forEach(job => {
      if (!job.location) return;
      const region = normalizeToRegion(job.location);
      if (region) regions.add(region);
    });

    return Array.from(regions).sort();
  }, [jobs]);

  const uniqueExperienceLevels = useMemo(() => {
    const levels = new Set(jobs.map(job => job.experienceLevel).filter(Boolean));
    return Array.from(levels).sort();
  }, [jobs]);

  // Enhanced filtering with AND logic using useMemo for performance
  const filteredJobs = useMemo(() => {
    let result = jobs;

    // Search filter (OR logic within search - title OR company OR skills)
    if (searchTerm) {
      result = result.filter(job =>
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.skills && Array.isArray(job.skills) && job.skills.some(skill =>
          typeof skill === 'string' && skill.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
    }

    // Apply ALL filters with AND logic - each filter must match
    result = result.filter(job => {
      // Category filter (multi-select: empty array means all categories)
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(job.category);

      // Job type filter
      const matchesType = filters.jobType === 'all' || job.jobType === filters.jobType;

      // Job type filter


      // Location filter - match based on primary location (first part before comma)
      let matchesLocation = true;
      if (filters.location !== 'all') {
        if (filters.location === 'remote') {
          matchesLocation = job.remote || job.location?.toLowerCase().includes('remote');
        } else {
          // Jordan cities list for matching
          const jordanCities = ['amman', 'irbid', 'zarqa', 'aqaba', 'madaba', 'jerash', 'ajloun', 'karak', 'mafraq', 'salt', 'tafilah', 'maan'];
          const filterLower = filters.location.toLowerCase();
          const jobLocationLower = (job.location || '').toLowerCase();

          // If filtering by Jordan, match all Jordan cities
          if (filterLower === 'jordan') {
            matchesLocation = jobLocationLower.includes('jordan') ||
              jordanCities.some(city => jobLocationLower.includes(city));
          } else {
            // Direct match or contains
            matchesLocation = jobLocationLower.includes(filterLower);
          }
        }
      }

      // Experience level filter
      const matchesLevel = filters.experienceLevel === 'all' || job.experienceLevel === filters.experienceLevel;

      // Salary range filter
      let matchesSalary = true;
      if (filters.salaryRange !== 'all') {
        const [min, max] = filters.salaryRange.split('-').map(Number);
        matchesSalary = job.salaryMin >= min && job.salaryMax <= max;
      }

      // Workplace type filter (Remote, On-site, Hybrid)
      let matchesWorkplaceType = true;
      if (filters.workplaceType !== 'all') {
        const filterType = filters.workplaceType.toLowerCase();
        const jobType = (job.workplaceType || '').toLowerCase();

        if (filterType === 'remote') {
          // Match jobs with workplace_type = 'Remote' OR location contains 'remote'
          matchesWorkplaceType = jobType === 'remote' || job.remote === true ||
            (job.location || '').toLowerCase().includes('remote');
        } else if (filterType === 'on-site') {
          matchesWorkplaceType = jobType === 'on-site';
        } else if (filterType === 'hybrid') {
          matchesWorkplaceType = jobType === 'hybrid';
        }
      }

      // Keyword search filter (searches in title, company, description)
      const keyword = filters.keyword?.trim() || '';
      const matchesKeyword = keyword === '' ||
        job.title?.toLowerCase().includes(keyword.toLowerCase()) ||
        job.company?.toLowerCase().includes(keyword.toLowerCase()) ||
        job.description?.toLowerCase().includes(keyword.toLowerCase());

      // Date posted filter
      let matchesDate = true;
      if (filters.datePosted !== 'any' && job.postedTimestamp) {
        const postedDate = new Date(job.postedTimestamp);
        const diffDays = (Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24);

        switch (filters.datePosted) {
          case '24h':
            matchesDate = diffDays <= 1;
            break;
          case '3d':
            matchesDate = diffDays <= 3;
            break;
          case '7d':
            matchesDate = diffDays <= 7;
            break;
          case '30d':
            matchesDate = diffDays <= 30;
            break;
          default:
            matchesDate = true;
        }
      }

      // ALL conditions must be true (AND logic)
      return matchesCategory && matchesType && matchesLocation && matchesLevel && matchesSalary && matchesWorkplaceType && matchesKeyword && matchesDate;
    });

    // Sorting
    const sortedResult = [...result]; // Create a copy to avoid mutating

    // Helper function to check if location is Amman
    const isAmman = (location) => {
      if (!location) return false;
      return location.toLowerCase().includes('amman');
    };

    // Apply regular sorting first
    switch (sortBy) {
      case 'latest':
        sortedResult.sort((a, b) => {
          // Prioritize Amman jobs first
          const aIsAmman = isAmman(a.location);
          const bIsAmman = isAmman(b.location);

          if (aIsAmman && !bIsAmman) return -1;
          if (!aIsAmman && bIsAmman) return 1;

          // If both are Amman or both are not, sort by date
          return b.postedTimestamp - a.postedTimestamp;
        });
        break;
      case 'salary-high':
        sortedResult.sort((a, b) => {
          // Prioritize Amman jobs first
          const aIsAmman = isAmman(a.location);
          const bIsAmman = isAmman(b.location);

          if (aIsAmman && !bIsAmman) return -1;
          if (!aIsAmman && bIsAmman) return 1;

          // If both are Amman or both are not, sort by salary
          return b.salaryMax - a.salaryMax;
        });
        break;
      case 'salary-low':
        sortedResult.sort((a, b) => {
          // Prioritize Amman jobs first
          const aIsAmman = isAmman(a.location);
          const bIsAmman = isAmman(b.location);

          if (aIsAmman && !bIsAmman) return -1;
          if (!aIsAmman && bIsAmman) return 1;

          // If both are Amman or both are not, sort by salary
          return a.salaryMin - b.salaryMin;
        });
        break;
      case 'popular':
        sortedResult.sort((a, b) => {
          // Prioritize Amman jobs first
          const aIsAmman = isAmman(a.location);
          const bIsAmman = isAmman(b.location);

          if (aIsAmman && !bIsAmman) return -1;
          if (!aIsAmman && bIsAmman) return 1;

          // If both are Amman or both are not, sort by date
          return b.postedTimestamp - a.postedTimestamp;
        });
        break;
      default:
        // Default: prioritize Amman jobs
        sortedResult.sort((a, b) => {
          const aIsAmman = isAmman(a.location);
          const bIsAmman = isAmman(b.location);

          if (aIsAmman && !bIsAmman) return -1;
          if (!aIsAmman && bIsAmman) return 1;

          return b.postedTimestamp - a.postedTimestamp;
        });
        break;
    }

    // Apply career objective prioritization AFTER regular sorting
    // This puts career-matching jobs at the top while preserving relative order
    if (careerObjective && careerObjective.trim()) {
      const prioritizedResult = prioritizeJobsByCareerObjective(sortedResult, careerObjective);
      return prioritizedResult;
    }

    return sortedResult;
  }, [filters, searchTerm, selectedCategories, sortBy, jobs, careerObjective]);

  const toggleSaveJob = async (jobId) => {
    if (!isLoggedIn) {
      openAuthModal('login');
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
          notes: '',
        };
        const res = await applicationService.create(payload);
        if (res?.success && res.data?.id) {
          setSavedJobs(prev => new Set(prev).add(jobId));
          setJobIdToApplicationId(prev => ({ ...prev, [jobId]: res.data.id }));
        }
      } else {
        let appId = jobIdToApplicationId[jobId];
        // Fallback: try to find by title/company if we don't have mapping
        if (!appId) {
          try {
            const listRes = await applicationService.list();
            if (listRes?.success) {
              const match = (listRes.data || []).find(a => a.status === 'saved' && a.jobTitle === job.title && a.company === job.company);
              if (match) appId = match.id;
            }
          } catch (_) { }
        }
        if (appId) {
          const delRes = await applicationService.remove(appId);
          if (delRes?.success) {
            setSavedJobs(prev => {
              const ns = new Set(prev);
              ns.delete(jobId);
              return ns;
            });
            setJobIdToApplicationId(prev => {
              const copy = { ...prev };
              delete copy[jobId];
              return copy;
            });
          }
        } else {
          // If we can't resolve backend id, at least update UI
          setSavedJobs(prev => {
            const ns = new Set(prev);
            ns.delete(jobId);
            return ns;
          });
        }
      }
    } catch (e) {
      // no-op: keep UI unchanged on error
    }
  };

  const handleApplyClick = (e, job) => {
    if (!isLoggedIn) {
      e.preventDefault();
      openAuthModal('login');
      return;
    }
    // Allow default behavior - link will open in new tab
  };

  // AI Apply handlers
  const handleAIApplyClick = (e, job) => {
    e.preventDefault();
    if (!isLoggedIn) {
      openAuthModal('login');
      return;
    }
    setAIApplyJob(job);
    setAIApplyStatus(null);
    setIsAIApplyModalOpen(true);
  };

  const handleAIApplyStart = async (resumeId) => {
    if (!aiApplyJob) return;

    setAIApplyStatus('loading');
    setAIApplyProgress('initializing');

    try {
      const response = await aiApplyService.startApplication({
        resumeId,
        jobUrl: aiApplyJob.applicationUrl,
        jobTitle: aiApplyJob.title,
        company: aiApplyJob.company
      });

      if (response.success) {
        // Poll for status updates
        try {
          const result = await aiApplyService.pollStatus(
            response.data.jobId,
            (status) => {
              // Update UI with progress
              console.log('AI Apply progress:', status.progress);
              setAIApplyProgress(status.progress);
            }
          );

          // Check if it was actually successful
          if (result.progress === 'submitted' || result.status === 'completed') {
            setAIApplyProgress('submitted');
            setAIApplyStatus('success');
          } else {
            setAIApplyStatus('failed');
          }
        } catch (pollError) {
          // pollStatus throws on 'failed' status
          console.error('AI Apply poll error:', pollError);
          setAIApplyStatus('failed');
        }
      } else {
        setAIApplyStatus('failed');
      }
    } catch (error) {
      console.error('AI Apply error:', error);
      setAIApplyStatus('failed');
    }
  };

  const closeAIApplyModal = () => {
    setIsAIApplyModalOpen(false);
    setAIApplyJob(null);
    setAIApplyStatus(null);
    setAIApplyProgress(null);
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
      workplaceType: 'all',
      keyword: '',
      datePosted: 'any'
    });
    setSelectedCategories([]);
    setSearchTerm('');
  };

  const loadMore = () => {
    setDisplayCount(prev => prev + 9);
  };

  const renderedJobs = filteredJobs.slice(0, displayCount);

  const handleMobileJobToggle = (job) => {
    setSelectedJob(job);
    setExpandedJobId(prev => (prev === job.id ? null : job.id));
  };

  const features = [
    {
      icon: Brain,
      title: t('aiMatching'),
      description: language === 'en'
        ? 'Smart algorithms match you with jobs that fit your skills and experience perfectly'
        : 'خوارزميات ذكية تطابقك مع الوظائف التي تناسب مهاراتك وخبراتك بشكل مثالي',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: FileText,
      title: t('resumeBuilder'),
      description: language === 'en'
        ? 'Create professional, ATS-friendly resumes in minutes with our AI-powered builder'
        : 'أنشئ سير ذاتية احترافية وصديقة لأنظمة التتبع في دقائق باستخدام منشئنا المدعوم بالذكاء الاصطناعي',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Target,
      title: t('careerGuidance'),
      description: language === 'en'
        ? 'Get personalized career advice and skill recommendations based on market trends'
        : 'احصل على نصائح مهنية مخصصة وتوصيات مهارات بناءً على اتجاهات السوق',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Zap,
      title: t('instantApplications'),
      description: language === 'en'
        ? 'Apply to multiple jobs with one click using your saved profile'
        : 'تقدم إلى وظائف متعددة بنقرة واحدة باستخدام ملفك الشخصي المحفوظ',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: TrendingUp,
      title: t('salaryInsights'),
      description: language === 'en'
        ? 'Know your worth with real-time salary data and negotiation tips'
        : 'اعرف قيمتك مع بيانات الرواتب في الوقت الفعلي ونصائح التفاوض',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Award,
      title: t('skillAssessment'),
      description: language === 'en'
        ? 'Prove your expertise with verified skill assessments and certifications'
        : 'أثبت خبرتك مع تقييمات المهارات الموثقة والشهادات',
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  // Calculate active filters count (excluding 'all' and false values)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.jobType !== 'all') count++;
    if (filters.location !== 'all') count++;
    if (filters.experienceLevel !== 'all') count++;
    if (filters.salaryRange !== 'all') count++;
    if (filters.workplaceType !== 'all') count++;
    if (filters.keyword && filters.keyword.trim() !== '') count++;
    if (filters.datePosted !== 'any') count++;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    return count;
  }, [filters, selectedCategories]);

  return (
    <>
      <div className="home-container" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Quick Stats Banner */}
        <div className="stats-banner">
          <div className="stats-banner-content">
            <div className="stat-chip">
              <Briefcase size={16} />
              <span><strong>{jobs.length}+</strong> {t('activeJobs')}</span>
            </div>
            <div className="stat-chip">
              <Users size={16} />
              <span><strong>50K+</strong> {t('jobSeekers')}</span>
            </div>
            <div className="stat-chip">
              <Building2 size={16} />
              <span><strong>500+</strong> {t('companiesCount')}</span>
            </div>
            <div className="stat-chip">
              <TrendingUp size={16} />
              <span><strong>95%</strong> {t('successRate')}</span>
            </div>
          </div>
        </div>

        {/* Jobs Section - Now at the top */}
        <section className="jobs-section-top" ref={jobsRef}>
          <div className="jobs-header">
            <div className="jobs-header-content">
              <div className="jobs-title-section">
                <h1 className="jobs-main-title">
                  {language === 'en' ? 'Discover Your' : 'اكتشف'} <span className="gradient-text">{language === 'en' ? 'Dream Career' : 'مسيرتك المهنية الحلم'}</span>
                </h1>
                <p className="jobs-subtitle">
                  {filteredJobs.length} {t('opportunities')}
                </p>
                {/* Career Objective Prioritization Indicator */}
                {careerObjective && careerObjective.trim() && (
                  <div className="career-prioritization-indicator">
                    <Target size={14} />
                    <span>
                      {language === 'en'
                        ? `Showing jobs matching "${careerObjective}" first`
                        : `عرض الوظائف المطابقة لـ "${careerObjective}" أولاً`
                      }
                    </span>
                  </div>
                )}
              </div>

              <div className="header-actions">
                {/* Language Toggle Button */}
                {/* <button 
                  className="language-toggle-btn"
                  onClick={toggleLanguage}
                >
                  {language === 'en' ? 'العربية' : 'English'}
                </button>*/}

                {!isLoggedIn && (
                  <button onClick={() => openAuthModal('signup')} className="header-cta-btn">
                    <Sparkles size={18} />
                    {t('personalizedJobs')}
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced Search Bar */}
            <div className="search-section">
              <div className="search-box-enhanced">
                <Search size={22} className="search-icon" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
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
                {t('filter')}
                {activeFiltersCount > 0 && (
                  <span className="filter-badge">{activeFiltersCount}</span>
                )}
              </button>
            </div>

            {/* Categories Chips */}
            <div className="categories-scroll">
              {webCategories.map((cat) => {
                const Icon = cat.icon;
                const count = cat.id === 'all'
                  ? jobs.length
                  : jobs.filter(j => j.category === cat.id).length;

                // Determine if this category is selected
                const isSelected = cat.id === 'all'
                  ? selectedCategories.length === 0
                  : selectedCategories.includes(cat.id);

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (cat.id === 'all') {
                        // Clicking "All" clears all selections
                        setSelectedCategories([]);
                      } else {
                        // Toggle individual category
                        setSelectedCategories(prev =>
                          prev.includes(cat.id)
                            ? prev.filter(c => c !== cat.id)
                            : [...prev, cat.id]
                        );
                      }
                    }}
                    className={`category-chip ${isSelected ? 'active' : ''}`}
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
                <h3>{t('advancedFilters')}</h3>
                <div className="filters-actions">
                  <button onClick={clearFilters} className="clear-filters-btn">
                    {t('clearAll')}
                  </button>
                  <button onClick={() => setShowFilters(false)} className="close-filters-btn">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="filters-grid">
                {/* Date Posted Filter */}
                <div className="filter-group">
                  <label>{t('datePosted')}</label>
                  <select
                    value={filters.datePosted}
                    onChange={(e) => setFilters({ ...filters, datePosted: e.target.value })}
                    className="filter-select-enhanced"
                  >
                    <option value="any">{t('anyTime')}</option>
                    <option value="24h">{t('last24Hours')}</option>
                    <option value="3d">{t('last3Days')}</option>
                    <option value="7d">{t('last7Days')}</option>
                    <option value="30d">{t('last30Days')}</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>{t('jobTypeFilter')}</label>
                  <select
                    value={filters.jobType}
                    onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                    className="filter-select-enhanced"
                  >
                    <option value="all">{t('allTypes')}</option>
                    <option value="Full-time">{language === 'en' ? 'Full-Time' : 'دوام كامل'}</option>
                    <option value="Part-time">{language === 'en' ? 'Part-Time' : 'دوام جزئي'}</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>{language === 'en' ? 'Workplace Type' : 'نوع مكان العمل'}</label>
                  <select
                    value={filters.workplaceType}
                    onChange={(e) => setFilters({ ...filters, workplaceType: e.target.value })}
                    className="filter-select-enhanced"
                  >
                    <option value="all">{t('allTypes')}</option>
                    <option value="Remote">{language === 'en' ? 'Remote' : 'عن بُعد'}</option>
                    <option value="On-site">{language === 'en' ? 'On-site' : 'في الموقع'}</option>
                    <option value="Hybrid">{language === 'en' ? 'Hybrid' : 'هجين'}</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>{t('locationFilter')}</label>
                  <select
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    className="filter-select-enhanced"
                  >
                    <option value="all">{t('allLocations')}</option>
                    {uniqueLocations
                      .filter(loc => !loc.toLowerCase().includes('remote'))
                      .map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>{t('experienceLevel')}</label>
                  <select
                    value={filters.experienceLevel}
                    onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
                    className="filter-select-enhanced"
                  >
                    <option value="all">{t('allLevels')}</option>
                    {uniqueExperienceLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>{t('salaryRange')}</label>
                  <select
                    value={filters.salaryRange}
                    onChange={(e) => setFilters({ ...filters, salaryRange: e.target.value })}
                    className="filter-select-enhanced"
                  >
                    <option value="all">{t('allSalaries')}</option>
                    <option value="0-80">Under $80K</option>
                    <option value="80-120">$80K - $120K</option>
                    <option value="120-160">$120K - $160K</option>
                    <option value="160-999">$160K+</option>
                  </select>
                </div>

                {/* <div className="filter-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.remote}
                      onChange={(e) => setFilters({ ...filters, remote: e.target.checked })}
                    />
                    <span>{t('remoteOnly')}</span>
                  </label>
                </div> */}


              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="loading-state">
              <div className="loader"></div>
              <p>{t('findingOpportunities')}</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            /* Empty State */
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>{t('noJobsFound')}</h3>
              <p>
                {activeFiltersCount > 0
                  ? t('noJobsMatchFilters')
                  : t('tryAdjusting')}
              </p>
              {activeFiltersCount > 0 && (
                <button onClick={clearFilters} className="btn-primary">
                  {t('clearAllFilters')}
                </button>
              )}
            </div>
          ) : (
            <>
              {!isMobile ? (
                <div className="jobs-sidebar-container">
                  {/* Left Sidebar - Job List */}
                  <div className="jobs-sidebar">
                    <div className="jobs-list">
                      {renderedJobs.map((job) => (
                        <div
                          key={job.id}
                          className={`job-list-item ${selectedJob?.id === job.id ? 'active' : ''}`}
                          onClick={() => {
                            // Toggle selection: if clicking the same job, deselect it
                            if (selectedJob?.id === job.id) {
                              setSelectedJob(null);
                            } else {
                              setSelectedJob(job);
                            }
                          }}
                        >
                          {/* Company Logo */}
                          <div className="company-logo-small">{job.companyLogo}</div>

                          <div className="job-list-content">
                            {/* Job Title and Company */}
                            <div className="job-list-header">
                              <h4 className="job-list-title">{job.title}</h4>
                              {/* Career Match Badge */}
                              {job.careerMatchScore > 0 && (
                                <span
                                  className="career-match-badge"
                                  style={{ backgroundColor: getMatchLevel(job.careerMatchScore).color }}
                                  title={`${job.careerMatchScore}% match with your career objective`}
                                >
                                  <Star size={10} />
                                  {getMatchLevel(job.careerMatchScore).label}
                                </span>
                              )}
                            </div>

                            <div className="job-list-company">{job.company}</div>

                            {/* Quick Info */}
                            <div className="job-list-meta">
                              <span className="meta-item-small">
                                <MapPin size={12} />
                                {job.location}
                              </span>
                              <span className="meta-item-small">
                                <DollarSign size={12} />
                                {job.salary}
                              </span>
                            </div>

                            <div className="job-list-footer">
                              <span className="job-list-date">
                                <Clock size={12} />
                                {job.postedDate}
                              </span>
                              {savedJobs.has(job.id) && (
                                <BookmarkCheck size={14} className="saved-icon" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Load More in Sidebar */}
                    {displayCount < filteredJobs.length && (
                      <button onClick={loadMore} className="btn-load-more-sidebar">
                        {language === 'en'
                          ? `Load More (${filteredJobs.length - displayCount} more)`
                          : `تحميل المزيد (${filteredJobs.length - displayCount} أخرى)`
                        }
                        <ChevronDown size={16} />
                      </button>
                    )}
                  </div>

                  {/* Right Panel - Job Details */}
                  <div className="job-details-panel">
                    {selectedJob ? (
                      <div className="job-details">
                        {/* Header */}
                        <div className="job-details-header">
                          <div className="job-details-company-logo">{selectedJob.companyLogo}</div>
                          <div className="job-details-header-content">
                            <div className="job-details-badges">
                              {selectedJob.remote && (
                                <span className="badge remote-badge">
                                  {language === 'en' ? 'Remote' : 'عن بُعد'}
                                </span>
                              )}
                            </div>
                            <h2 className="job-details-title">{selectedJob.title}</h2>
                            <div className="job-details-company">
                              <span className="company-name">{selectedJob.company}</span>
                              <span className="separator">•</span>
                              <span className="industry">{selectedJob.industry}</span>
                            </div>
                          </div>

                          <div className="job-details-actions">
                            <button
                              onClick={() => toggleSaveJob(selectedJob.id)}
                              className={`icon-btn-large ${savedJobs.has(selectedJob.id) ? 'saved' : ''}`}
                              title={t('save')}
                            >
                              {savedJobs.has(selectedJob.id) ? (
                                <BookmarkCheck size={24} />
                              ) : (
                                <Bookmark size={24} />
                              )}
                            </button>
                            <button className="icon-btn-large" title={t('share')}>
                              <Share2 size={24} />
                            </button>
                          </div>
                        </div>

                        {/* Key Info Grid */}
                        <div className="job-details-info-grid">
                          <div className="info-card">
                            <MapPin size={18} />
                            <div>
                              <div className="info-label">{t('location')}</div>
                              <div className="info-value">{selectedJob.location}</div>
                            </div>
                          </div>
                          <div className="info-card">
                            <Briefcase size={18} />
                            <div>
                              <div className="info-label">{t('jobType')}</div>
                              <div className="info-value">{selectedJob.jobType}</div>
                            </div>
                          </div>
                          <div className="info-card">
                            <DollarSign size={18} />
                            <div>
                              <div className="info-label">{t('salary')}</div>
                              <div className="info-value">{selectedJob.salary}</div>
                            </div>
                          </div>
                          <div className="info-card">
                            <Badge size={18} />
                            <div>
                              <div className="info-label">{t('experience')}</div>
                              <div className="info-value">{selectedJob.experienceLevel}</div>
                            </div>
                          </div>
                        </div>

                        {/* Source and Easy Apply Section */}
                        <div className="job-source-section">
                          <div className="source-info">
                            <span className="source-label">{language === 'en' ? 'Source:' : 'المصدر:'}</span>
                            <a
                              href={selectedJob.applicationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="source-link"
                            >
                              {getJobSource(selectedJob)}
                            </a>
                          </div>
                          <div className="job-badges-row">
                            {selectedJob.workplaceType && (
                              <div className={`workplace-type-badge ${selectedJob.workplaceType.toLowerCase().replace('-', '')}`}>
                                {selectedJob.workplaceType === 'Remote' && <Globe size={14} />}
                                {selectedJob.workplaceType === 'On-site' && <Building2 size={14} />}
                                {selectedJob.workplaceType === 'Hybrid' && <Laptop size={14} />}
                                <span>
                                  {selectedJob.workplaceType === 'Remote' && (language === 'en' ? 'Remote' : 'عن بُعد')}
                                  {selectedJob.workplaceType === 'On-site' && (language === 'en' ? 'On-site' : 'في الموقع')}
                                  {selectedJob.workplaceType === 'Hybrid' && (language === 'en' ? 'Hybrid' : 'هجين')}
                                </span>
                              </div>
                            )}
                            {selectedJob.easyApply && (
                              <div className="easy-apply-badge">
                                <Zap size={14} />
                                <span>{language === 'en' ? 'Easy Apply' : 'تقديم سريع'}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="job-details-section">
                          <h3 className="section-title">{t('skillsRequired')}</h3>
                          <div className="job-skills-large">
                            {selectedJob.skills.map((skill, idx) => (
                              <span key={idx} className="skill-tag-large">{skill}</span>
                            ))}
                          </div>
                        </div>

                        {/* Description */}
                        <div className="job-details-section">
                          <h3 className="section-title">{t('jobDescription')}</h3>
                          <div
                            className="job-description"
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(selectedJob.description || '')
                            }}
                          />
                        </div>

                        {/* Stats */}
                        {/* Stats */}
                        <div className="job-details-stats">
                          <div className="stat-item">
                            <Clock size={18} />
                            <div>
                              <div className="stat-value">{selectedJob.postedDate}</div>
                              <div className="stat-label">{t('posted')}</div>
                            </div>
                          </div>
                        </div>

                        {/* Apply Button */}
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
                          {selectedJob.easyApply && (
                            <button
                              className="apply-btn-ai"
                              onClick={(e) => handleAIApplyClick(e, selectedJob)}
                            >
                              <Bot size={20} />
                              {language === 'en' ? 'Apply with AI' : 'التقديم بالذكاء الاصطناعي'}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="job-details-empty">
                        <Briefcase size={64} className="empty-icon" />
                        <h3>{t('selectJob')}</h3>
                        <p>{t('selectJobPrompt')}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="jobs-mobile-list">
                  {renderedJobs.map((job) => {
                    const isExpanded = expandedJobId === job.id;
                    return (
                      <div className={`job-card-mobile ${isExpanded ? 'expanded' : ''}`} key={job.id}>
                        <div className="job-card-mobile-header">
                          <div className="mobile-title-wrap">
                            <div className="mobile-company-logo">{job.companyLogo}</div>
                            <div>
                              <h3>{job.title}</h3>
                              <p>{job.company}</p>
                              {/* Career Match Badge for Mobile */}
                              {job.careerMatchScore > 0 && (
                                <span
                                  className="career-match-badge mobile"
                                  style={{ backgroundColor: getMatchLevel(job.careerMatchScore).color }}
                                >
                                  <Star size={10} />
                                  {getMatchLevel(job.careerMatchScore).label}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            className={`icon-btn ${savedJobs.has(job.id) ? 'saved' : ''}`}
                            onClick={() => toggleSaveJob(job.id)}
                            aria-label={t('save')}
                          >
                            {savedJobs.has(job.id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                          </button>
                        </div>

                        <div className="job-card-mobile-meta">
                          <span><MapPin size={14} />{job.location}</span>
                          <span><Briefcase size={14} />{job.jobType}</span>
                          <span><DollarSign size={14} />{job.salary}</span>
                        </div>

                        <div className="job-card-mobile-actions">
                          <button
                            className="btn-cta-secondary mobile"
                            onClick={() => handleMobileJobToggle(job)}
                          >
                            {isExpanded ? t('hideDetails') : t('viewDetails')}
                          </button>
                          <a
                            href={job.applicationUrl}
                            className="btn-cta-primary mobile"
                            onClick={(e) => handleApplyClick(e, job)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t('applyNow')}
                            <ArrowRight size={16} />
                          </a>
                          {job.easyApply && (
                            <button
                              className="btn-cta-ai mobile"
                              onClick={(e) => handleAIApplyClick(e, job)}
                            >
                              <Bot size={16} />
                              {language === 'en' ? 'AI Apply' : 'تقديم ذكي'}
                            </button>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="mobile-job-details">
                            {/* Source and Easy Apply for Mobile */}
                            <div className="mobile-source-section">
                              <div className="source-info">
                                <span className="source-label">{language === 'en' ? 'Source:' : 'المصدر:'}</span>
                                <a
                                  href={job.applicationUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="source-link"
                                >
                                  {getJobSource(job)}
                                </a>
                              </div>
                              <div className="job-badges-row mobile">
                                {job.workplaceType && (
                                  <div className={`workplace-type-badge ${job.workplaceType.toLowerCase().replace('-', '')}`}>
                                    {job.workplaceType === 'Remote' && <Globe size={12} />}
                                    {job.workplaceType === 'On-site' && <Building2 size={12} />}
                                    {job.workplaceType === 'Hybrid' && <Laptop size={12} />}
                                    <span>
                                      {job.workplaceType === 'Remote' && (language === 'en' ? 'Remote' : 'عن بُعد')}
                                      {job.workplaceType === 'On-site' && (language === 'en' ? 'On-site' : 'في الموقع')}
                                      {job.workplaceType === 'Hybrid' && (language === 'en' ? 'Hybrid' : 'هجين')}
                                    </span>
                                  </div>
                                )}
                                {job.easyApply && (
                                  <div className="easy-apply-badge">
                                    <Zap size={12} />
                                    <span>{language === 'en' ? 'Easy Apply' : 'تقديم سريع'}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="mobile-job-stats">
                              <div>
                                <span>{t('experience')}</span>
                                <strong>{job.experienceLevel}</strong>
                              </div>
                              <div>
                                <span>{t('posted')}</span>
                                <strong>{job.postedDate}</strong>
                              </div>
                            </div>
                            <div className="mobile-job-skills">
                              {job.skills.map((skill, idx) => (
                                <span key={idx}>{skill}</span>
                              ))}
                            </div>
                            <div
                              className="mobile-description"
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(job.description || '')
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {displayCount < filteredJobs.length && (
                    <button onClick={loadMore} className="btn-load-more-mobile">
                      {language === 'en'
                        ? `Load More (${filteredJobs.length - displayCount} more)`
                        : `تحميل المزيد (${filteredJobs.length - displayCount} أخرى)`
                      }
                      <ChevronDown size={16} />
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {/* Resume Generator Showcase */}
        <section className="resume-generator-section">
          <div className="resume-header">
            <div className="resume-badge">
              <Sparkles size={16} />
              <span>{t('resumeGenerator')}</span>
            </div>
            <h2 className="resume-title">{t('standOut')}</h2>
            <p className="resume-subtitle">{t('resumeSubtitle')}</p>
            <div className="resume-cta">
              <button className="btn-primary" onClick={() => navigate('/cv-generator')}>
                {t('createYourResume')} <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className="resume-grid">
            {(() => {
              const publicBase = process.env.PUBLIC_URL || '';
              const svg1 = `${publicBase}/${encodeURIComponent('CV1.svg')}`;
              const svg2 = `${publicBase}/${encodeURIComponent('CV2.svg')}`;
              return (
                <>
                  <div className="resume-card" onClick={() => navigate('/cv-generator')}>
                    <div className="resume-card-inner">
                      <div className="resume-badge-page">
                        {language === 'en' ? 'Page 1' : 'الصفحة 1'}
                      </div>
                      <img src={svg1} alt="Resume Template Page 1" className="resume-image" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      <div className="resume-shine"></div>
                    </div>
                    <div className="resume-caption">
                      <h3>{t('modernProfessional')}</h3>
                      <p>
                        {language === 'en'
                          ? 'Clean layout with strong typography for maximum ATS compatibility'
                          : 'تصميم نظيف مع طباعة قوية لأقصى توافق مع أنظمة التتبع الآلي'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="resume-card" onClick={() => navigate('/cv-generator')}>
                    <div className="resume-card-inner">
                      <div className="resume-badge-page">
                        {language === 'en' ? 'Page 2' : 'الصفحة 2'}
                      </div>
                      <img src={svg2} alt="Resume Template Page 2" className="resume-image" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      <div className="resume-shine"></div>
                    </div>
                    <div className="resume-caption">
                      <h3>{t('elegantMinimal')}</h3>
                      <p>
                        {language === 'en'
                          ? 'Balanced white space and emphasis on key highlights and skills'
                          : 'مساحة بيضاء متوازنة وتركيز على النقاط البارزة والمهارات الرئيسية'
                        }
                      </p>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section-enhanced" ref={heroRef}>
          <div className="features-header">
            <div className="features-badge">
              <Sparkles size={16} />
              <span>{language === 'en' ? 'Powerful Features' : 'ميزات قوية'}</span>
            </div>
            <h2 className="features-title">
              {language === 'en' ? 'Everything You Need to' : 'كل ما تحتاجه ل'} <span className="gradient-text">{language === 'en' ? 'Succeed' : 'النجاح'}</span>
            </h2>
            <p className="features-subtitle">
              {language === 'en'
                ? 'Cutting-edge tools and AI-powered features to accelerate your career'
                : 'أدوات متطورة وميزات مدعومة بالذكاء الاصطناعي لتسريع مسيرتك المهنية'
              }
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
            <h2>{t('readyToLaunch')}</h2>
            <p>
              {t('joinCommunity')}
            </p>

            {!isLoggedIn && (
              <div className="cta-buttons">
                <button onClick={() => openAuthModal('signup')} className="btn-cta-primary">
                  {t('getStartedFree')}
                  <ArrowRight size={20} />
                </button>
                <button onClick={() => openAuthModal('login')} className="btn-cta-secondary">
                  {t('signIn')}
                </button>
              </div>
            )}

            <div className="cta-features">
              <div className="cta-feature">
                <CheckCircle size={18} />
                <span>{t('freeForever')}</span>
              </div>
              <div className="cta-feature">
                <CheckCircle size={18} />
                <span>{t('noCreditCard')}</span>
              </div>
              <div className="cta-feature">
                <CheckCircle size={18} />
                <span>{t('instantAccess')}</span>
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

      <ResetPasswordModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => {
          setIsResetPasswordModalOpen(false);
          setResetToken(null);
        }}
        token={resetToken}
      />

      <VerificationStatusModal
        isOpen={isVerificationModalOpen}
        onClose={() => {
          setIsVerificationModalOpen(false);
          setVerificationStatus(null);
          setVerificationMessage('');
        }}
        status={verificationStatus}
        message={verificationMessage}
      />

      {/* AI Apply Modal */}
      <AIApplyModal
        isOpen={isAIApplyModalOpen}
        onClose={closeAIApplyModal}
        job={aiApplyJob}
        onApplyStart={handleAIApplyStart}
        applyStatus={aiApplyStatus}
        applyProgress={aiApplyProgress}
      />
    </>
  );
};

export default Home;
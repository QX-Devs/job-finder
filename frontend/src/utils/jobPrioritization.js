/**
 * Job Prioritization Utility
 * 
 * Prioritizes jobs based on user's Career Objective.
 * Matching logic (in priority order):
 * 1. Exact or near-exact job title match
 * 2. Job role/category match
 * 3. Keyword similarity within job description
 */

/**
 * Normalize text for comparison - lowercase, remove special chars, trim
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
const normalizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Extract keywords from career objective
 * @param {string} careerObjective - User's career objective
 * @returns {string[]} Array of keywords
 */
const extractKeywords = (careerObjective) => {
  if (!careerObjective) return [];
  
  const normalized = normalizeText(careerObjective);
  
  // Common stop words to filter out
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'job', 'jobs',
    'position', 'role', 'looking', 'seeking', 'want', 'experience',
    'experienced', 'junior', 'senior', 'mid', 'level', 'entry'
  ]);
  
  // Split and filter keywords
  const words = normalized.split(' ').filter(word => 
    word.length > 2 && !stopWords.has(word)
  );
  
  // Also extract common role patterns
  const rolePatterns = [
    'frontend', 'front end', 'backend', 'back end', 'full stack', 'fullstack',
    'software', 'web', 'mobile', 'ios', 'android', 'react', 'angular', 'vue',
    'node', 'python', 'java', 'javascript', 'typescript', 'devops', 'cloud',
    'data', 'machine learning', 'ml', 'ai', 'artificial intelligence',
    'qa', 'quality assurance', 'tester', 'testing', 'manual', 'automation',
    'ui', 'ux', 'designer', 'design', 'product', 'project', 'manager',
    'analyst', 'engineer', 'developer', 'architect', 'lead', 'security',
    'network', 'database', 'dba', 'sys admin', 'system', 'administrator'
  ];
  
  // Find matching role patterns
  const matchedPatterns = rolePatterns.filter(pattern => 
    normalized.includes(pattern)
  );
  
  // Combine unique keywords
  const allKeywords = [...new Set([...words, ...matchedPatterns])];
  
  return allKeywords;
};

/**
 * Calculate match score between job and career objective keywords
 * @param {Object} job - Job object
 * @param {string[]} baseKeywords - Base keywords from career objective (for percentage calculation)
 * @param {string[]} expandedKeywords - Expanded keywords including synonyms (for matching)
 * @param {string} careerObjective - Original career objective (normalized)
 * @returns {number} Match score (0-100)
 */
const calculateMatchScore = (job, baseKeywords, expandedKeywords, careerObjective) => {
  if (!baseKeywords.length || !careerObjective) return 0;
  
  const normalizedTitle = normalizeText(job.title);
  const normalizedCompany = normalizeText(job.company);
  const normalizedDescription = normalizeText(job.description);
  const normalizedSkills = job.skills 
    ? job.skills.map(s => normalizeText(s)).join(' ')
    : '';
  const normalizedLocation = normalizeText(job.location);
  
  let score = 0;
  
  // 1. EXACT TITLE MATCH (Highest priority - 50 points max)
  // Check if career objective appears in title or vice versa
  if (normalizedTitle.includes(careerObjective) || 
      careerObjective.includes(normalizedTitle)) {
    score += 50;
  } else {
    // Partial title match - count keyword matches in title
    // Use expanded keywords for matching, but base keywords for percentage
    let titleMatches = 0;
    let bonusMatches = 0;
    
    // Check base keywords (primary match)
    baseKeywords.forEach(keyword => {
      if (normalizedTitle.includes(keyword)) {
        titleMatches++;
      }
    });
    
    // Check expanded keywords for bonus points (synonym matches)
    expandedKeywords.forEach(keyword => {
      if (!baseKeywords.includes(keyword) && normalizedTitle.includes(keyword)) {
        bonusMatches++;
      }
    });
    
    // Score based on percentage of BASE keywords matched + bonus for synonyms
    const titleMatchPercent = baseKeywords.length > 0 
      ? (titleMatches / baseKeywords.length) * 40
      : 0;
    const bonusScore = Math.min(10, bonusMatches * 2); // Up to 10 bonus points for synonym matches
    
    score += titleMatchPercent + bonusScore;
  }
  
  // 2. SKILLS/TAGS MATCH (Medium priority - 30 points max)
  let skillMatches = 0;
  let skillBonusMatches = 0;
  
  baseKeywords.forEach(keyword => {
    if (normalizedSkills.includes(keyword)) {
      skillMatches++;
    }
  });
  
  expandedKeywords.forEach(keyword => {
    if (!baseKeywords.includes(keyword) && normalizedSkills.includes(keyword)) {
      skillBonusMatches++;
    }
  });
  
  const skillMatchPercent = baseKeywords.length > 0
    ? (skillMatches / baseKeywords.length) * 25
    : 0;
  const skillBonus = Math.min(5, skillBonusMatches * 1);
  
  score += skillMatchPercent + skillBonus;
  
  // 3. DESCRIPTION MATCH (Lower priority - 20 points max)
  let descMatches = 0;
  baseKeywords.forEach(keyword => {
    if (normalizedDescription.includes(keyword)) {
      descMatches++;
    }
  });
  const descMatchPercent = baseKeywords.length > 0
    ? (descMatches / baseKeywords.length) * 20
    : 0;
  score += descMatchPercent;
  
  return Math.min(100, Math.round(score));
};

/**
 * Role synonym mapping for better matching
 */
const roleSynonyms = {
  'qa': ['quality assurance', 'tester', 'testing', 'qe', 'sdet'],
  'quality assurance': ['qa', 'tester', 'testing', 'qe', 'sdet'],
  'tester': ['qa', 'quality assurance', 'testing', 'qe'],
  'manual': ['manual testing', 'manual qa', 'manual tester'],
  'automation': ['automated', 'automation testing', 'automation engineer'],
  'frontend': ['front end', 'front-end', 'ui developer', 'react', 'angular', 'vue'],
  'backend': ['back end', 'back-end', 'server side', 'api developer'],
  'fullstack': ['full stack', 'full-stack'],
  'devops': ['dev ops', 'sre', 'site reliability', 'platform engineer'],
  'data engineer': ['data engineering', 'etl developer', 'data pipeline'],
  'data scientist': ['data science', 'ml engineer', 'machine learning'],
  'mobile': ['ios', 'android', 'react native', 'flutter'],
  'software engineer': ['software developer', 'programmer', 'coder'],
  'developer': ['engineer', 'programmer', 'coder']
};

/**
 * Expand keywords with synonyms
 * @param {string[]} keywords - Original keywords
 * @returns {string[]} Expanded keywords
 */
const expandKeywordsWithSynonyms = (keywords) => {
  const expanded = new Set(keywords);
  
  keywords.forEach(keyword => {
    // Check if keyword has synonyms
    Object.keys(roleSynonyms).forEach(key => {
      if (keyword.includes(key) || key.includes(keyword)) {
        roleSynonyms[key].forEach(syn => expanded.add(syn));
      }
    });
  });
  
  return Array.from(expanded);
};

/**
 * Prioritize jobs based on career objective
 * @param {Array} jobs - Array of job objects
 * @param {string} careerObjective - User's career objective
 * @returns {Array} Sorted array with matching jobs first
 */
export const prioritizeJobsByCareerObjective = (jobs, careerObjective) => {
  if (!jobs || !jobs.length) return jobs;
  if (!careerObjective || !careerObjective.trim()) return jobs;
  
  const normalizedObjective = normalizeText(careerObjective);
  const baseKeywords = extractKeywords(careerObjective);
  const expandedKeywords = expandKeywordsWithSynonyms(baseKeywords);
  
  console.log('🎯 Job Prioritization:', {
    careerObjective,
    baseKeywords,
    expandedKeywords: expandedKeywords.slice(0, 15) // Log first 15 keywords
  });
  
  // Calculate match scores for all jobs
  const jobsWithScores = jobs.map(job => ({
    ...job,
    careerMatchScore: calculateMatchScore(job, baseKeywords, expandedKeywords, normalizedObjective)
  }));
  
  // Separate matched and unmatched jobs
  const matchedJobs = jobsWithScores.filter(job => job.careerMatchScore > 0);
  const unmatchedJobs = jobsWithScores.filter(job => job.careerMatchScore === 0);
  
  // Sort matched jobs by score (highest first)
  matchedJobs.sort((a, b) => b.careerMatchScore - a.careerMatchScore);
  
  console.log(`🎯 Found ${matchedJobs.length} matching jobs, ${unmatchedJobs.length} other jobs`);
  
  // Log top matches for debugging
  if (matchedJobs.length > 0) {
    console.log('🎯 Top matches:', matchedJobs.slice(0, 5).map(j => ({
      title: j.title,
      score: j.careerMatchScore
    })));
  }
  
  // Return matched jobs first, then unmatched jobs (preserving their original order)
  return [...matchedJobs, ...unmatchedJobs];
};

/**
 * Get match level label for UI display
 * @param {number} score - Match score (0-100)
 * @returns {Object} Match level info with label and color
 */
export const getMatchLevel = (score) => {
  if (score >= 70) {
    return { level: 'excellent', label: 'Excellent Match', color: '#10b981' };
  }
  if (score >= 50) {
    return { level: 'good', label: 'Good Match', color: '#3b82f6' };
  }
  if (score >= 30) {
    return { level: 'fair', label: 'Fair Match', color: '#f59e0b' };
  }
  if (score > 0) {
    return { level: 'partial', label: 'Partial Match', color: '#6b7280' };
  }
  return { level: 'none', label: null, color: null };
};

/**
 * Check if a job matches the career objective
 * @param {Object} job - Job object
 * @param {string} careerObjective - User's career objective
 * @returns {boolean} True if job matches
 */
export const isJobMatchingCareerObjective = (job, careerObjective) => {
  if (!careerObjective || !careerObjective.trim()) return false;
  
  const normalizedObjective = normalizeText(careerObjective);
  const baseKeywords = extractKeywords(careerObjective);
  const expandedKeywords = expandKeywordsWithSynonyms(baseKeywords);
  
  const score = calculateMatchScore(job, baseKeywords, expandedKeywords, normalizedObjective);
  return score > 0;
};

export default {
  prioritizeJobsByCareerObjective,
  getMatchLevel,
  isJobMatchingCareerObjective
};

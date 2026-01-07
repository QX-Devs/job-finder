const express = require('express');
const { literal, Op } = require('sequelize');
const { Job } = require('../models');

const router = express.Router();

/**
 * Normalize text for comparison
 */
const normalizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
};

/**
 * Extract keywords from career objective
 */
const extractKeywords = (careerObjective) => {
  if (!careerObjective) return [];
  
  const normalized = normalizeText(careerObjective);
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'job', 'jobs',
    'position', 'role', 'looking', 'seeking', 'want', 'experience'
  ]);
  
  return normalized.split(' ').filter(word => word.length > 2 && !stopWords.has(word));
};

/**
 * Role synonym mapping
 */
const roleSynonyms = {
  'qa': ['quality assurance', 'tester', 'testing', 'qe', 'sdet'],
  'quality': ['qa', 'tester', 'testing', 'qe'],
  'tester': ['qa', 'quality assurance', 'testing', 'qe'],
  'manual': ['manual testing', 'manual qa'],
  'automation': ['automated', 'automation testing'],
  'frontend': ['front end', 'front-end', 'ui developer', 'react', 'angular', 'vue'],
  'backend': ['back end', 'back-end', 'server side', 'api developer'],
  'fullstack': ['full stack', 'full-stack'],
  'devops': ['dev ops', 'sre', 'site reliability'],
  'developer': ['engineer', 'programmer', 'coder'],
  'software': ['developer', 'engineer', 'programmer']
};

/**
 * Expand keywords with synonyms
 */
const expandKeywordsWithSynonyms = (keywords) => {
  const expanded = new Set(keywords);
  keywords.forEach(keyword => {
    Object.keys(roleSynonyms).forEach(key => {
      if (keyword.includes(key) || key.includes(keyword)) {
        roleSynonyms[key].forEach(syn => expanded.add(syn));
      }
    });
  });
  return Array.from(expanded);
};

/**
 * Calculate match score between job and career objective
 */
const calculateMatchScore = (job, baseKeywords, expandedKeywords, normalizedObjective) => {
  if (!baseKeywords.length || !normalizedObjective) return 0;
  
  const normalizedTitle = normalizeText(job.title);
  const normalizedDescription = normalizeText(job.description);
  const normalizedTags = job.tags ? (Array.isArray(job.tags) ? job.tags.flat().join(' ').toLowerCase() : '') : '';
  
  let score = 0;
  
  // Exact title match (50 points max)
  if (normalizedTitle.includes(normalizedObjective) || normalizedObjective.includes(normalizedTitle)) {
    score += 50;
  } else {
    // Use base keywords for percentage, expanded for bonus matching
    let titleMatches = 0;
    let bonusMatches = 0;
    
    baseKeywords.forEach(keyword => {
      if (normalizedTitle.includes(keyword)) titleMatches++;
    });
    
    expandedKeywords.forEach(keyword => {
      if (!baseKeywords.includes(keyword) && normalizedTitle.includes(keyword)) {
        bonusMatches++;
      }
    });
    
    const titleMatchPercent = baseKeywords.length > 0 ? (titleMatches / baseKeywords.length) * 40 : 0;
    const bonusScore = Math.min(10, bonusMatches * 2);
    score += titleMatchPercent + bonusScore;
  }
  
  // Tags/skills match (30 points max)
  let tagMatches = 0;
  let tagBonusMatches = 0;
  
  baseKeywords.forEach(keyword => {
    if (normalizedTags.includes(keyword)) tagMatches++;
  });
  
  expandedKeywords.forEach(keyword => {
    if (!baseKeywords.includes(keyword) && normalizedTags.includes(keyword)) {
      tagBonusMatches++;
    }
  });
  
  const tagMatchPercent = baseKeywords.length > 0 ? (tagMatches / baseKeywords.length) * 25 : 0;
  const tagBonus = Math.min(5, tagBonusMatches * 1);
  score += tagMatchPercent + tagBonus;
  
  // Description match (20 points max)
  let descMatches = 0;
  baseKeywords.forEach(keyword => {
    if (normalizedDescription.includes(keyword)) descMatches++;
  });
  score += baseKeywords.length > 0 ? (descMatches / baseKeywords.length) * 20 : 0;
  
  return Math.min(100, Math.round(score));
};

/**
 * GET /api/jobs
 * Get all jobs from database, sorted with Jordan jobs first, then by newest first
 * Optional query param: careerObjective - to prioritize matching jobs
 */
router.get('/', async (req, res) => {
  try {
    const { careerObjective } = req.query;
    
    const jobs = await Job.findAll({
      order: [
        [literal(`CASE WHEN LOWER(location) LIKE '%jordan%' THEN 0 ELSE 1 END`), 'ASC'],
        ['createdAt', 'DESC']
      ]
    });

    let processedJobs = jobs.map(job => job.toJSON());
    
    // If careerObjective is provided, calculate match scores and sort
    if (careerObjective && careerObjective.trim()) {
      const normalizedObjective = normalizeText(careerObjective);
      const baseKeywords = extractKeywords(careerObjective);
      const expandedKeywords = expandKeywordsWithSynonyms(baseKeywords);
      
      console.log(`GET /api/jobs: Prioritizing by careerObjective "${careerObjective}" (base: ${baseKeywords.length}, expanded: ${expandedKeywords.length} keywords)`);
      
      // Calculate scores for all jobs
      processedJobs = processedJobs.map(job => ({
        ...job,
        careerMatchScore: calculateMatchScore(job, baseKeywords, expandedKeywords, normalizedObjective)
      }));
      
      // Separate matched and unmatched
      const matchedJobs = processedJobs.filter(job => job.careerMatchScore > 0);
      const unmatchedJobs = processedJobs.filter(job => job.careerMatchScore === 0);
      
      // Sort matched jobs by score (highest first)
      matchedJobs.sort((a, b) => b.careerMatchScore - a.careerMatchScore);
      
      processedJobs = [...matchedJobs, ...unmatchedJobs];
      
      console.log(`GET /api/jobs: Found ${matchedJobs.length} matching jobs`);
    }

    console.log(`GET /api/jobs: Returning ${processedJobs.length} jobs`);
    
    res.json({
      success: true,
      data: processedJobs,
      count: processedJobs.length
    });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;


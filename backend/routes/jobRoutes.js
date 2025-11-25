const express = require('express');
const { literal } = require('sequelize');
const { Job } = require('../models');

const router = express.Router();

/**
 * GET /api/jobs
 * Get all jobs from database, sorted with Jordan jobs first, then by newest first
 */
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.findAll({
      order: [
        [literal(`CASE WHEN LOWER(location) LIKE '%jordan%' THEN 0 ELSE 1 END`), 'ASC'],
        ['createdAt', 'DESC']
      ]
    });

    console.log(`GET /api/jobs: Returning ${jobs.length} jobs`);
    
    res.json({
      success: true,
      data: jobs,
      count: jobs.length
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


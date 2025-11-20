const express = require('express');
const { fetchJobsFromJSearch } = require('../services/jsearch');
const { Job } = require('../models');

const router = express.Router();

/**
 * POST /api/jobs/import
 * Import jobs from JSearch API into the database
 */
router.post('/import', async (req, res) => {
  try {
    const { query, location } = req.body;

    if (!query || !location) {
      return res.status(400).json({
        success: false,
        error: 'Both query and location are required'
      });
    }

    // Fetch jobs from JSearch API (multiple pages)
    console.log(`Importing jobs: query="${query}", location="${location}"`);
    const jobs = await fetchJobsFromJSearch(query, location, 3);
    console.log(`Fetched ${jobs?.length || 0} jobs from JSearch API`);

    if (!jobs || jobs.length === 0) {
      return res.json({
        success: true,
        imported: 0,
        skipped: 0,
        message: 'No jobs found for the given query and location. Please check: 1) X_RAPID_API_KEY is set in .env, 2) API key is valid, 3) Query and location parameters are correct.'
      });
    }

    // Import jobs into database, avoiding duplicates
    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const jobData of jobs) {
      try {
        // Try to find by source_id first (if available)
        let existingJob = null;
        if (jobData.source_id) {
          existingJob = await Job.findOne({
            where: { source_id: jobData.source_id }
          });
        }

        // If not found by source_id, try title + company + apply_url
        if (!existingJob) {
          existingJob = await Job.findOne({
            where: {
              title: jobData.title,
              company: jobData.company,
              apply_url: jobData.apply_url
            }
          });
        }

        if (existingJob) {
          skippedCount++;
          continue;
        }

        // Create new job
        await Job.create({
          title: jobData.title,
          company: jobData.company,
          location: jobData.location,
          salary: jobData.salary,
          description: jobData.description,
          tags: jobData.tags || [],
          apply_url: jobData.apply_url,
          source: 'JSearch API',
          posted_at: jobData.posted_at,
          source_id: jobData.source_id
        });

        importedCount++;
      } catch (error) {
        console.error(`Error importing job: ${jobData.title}`, error);
        errors.push({ job: jobData.title, error: error.message });
        skippedCount++;
      }
    }

    res.json({
      success: true,
      imported: importedCount,
      skipped: skippedCount,
      total: jobs.length,
      ...(errors.length > 0 && { errors })
    });

  } catch (error) {
    console.error('Error importing jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import jobs',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
});

/**
 * GET /api/jobs
 * Get all jobs from database, sorted with Jordan jobs first, then by newest first
 */
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.findAll({
      order: [
        // Use Sequelize.literal to sort Jordan jobs first
        [require('sequelize').literal(`CASE WHEN LOWER(location) LIKE '%jordan%' THEN 0 ELSE 1 END`), 'ASC'],
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


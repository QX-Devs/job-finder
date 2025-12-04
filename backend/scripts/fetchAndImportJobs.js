/**
 * Job Fetcher and Importer Script
 * 
 * This script fetches jobs from JSearch API, especially from Jordan,
 * and imports them into the database while checking for duplicates.
 * 
 * Usage: node backend/scripts/fetchAndImportJobs.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { fetchJobsFromJSearch } = require('../services/jsearch');
const { Job } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// Job search queries - prioritize Jordan
const JOB_QUERIES = [
  // Jordan-specific searches
  { query: 'software developer', location: 'jordan' },
  { query: 'web developer', location: 'jordan' },
  { query: 'full stack developer', location: 'jordan' },
  { query: 'frontend developer', location: 'jordan' },
  { query: 'backend developer', location: 'jordan' },
  { query: 'software engineer', location: 'jordan' },
  { query: 'programmer', location: 'jordan' },
  { query: 'IT jobs', location: 'jordan' },
  { query: 'developer', location: 'amman jordan' },
  { query: 'developer', location: 'irbid jordan' },
  
  // General searches (will also catch Jordan jobs)
  { query: 'software developer', location: 'middle east' },
  { query: 'web developer', location: 'middle east' },
  { query: 'developer', location: 'remote' },
  { query: 'software engineer', location: 'remote' },
];

// Number of pages to fetch per query
const PAGES_PER_QUERY = 3;

/**
 * Import jobs from JSearch for a specific query and location
 * @returns {Promise<{ importedCount: number, skipped: number, errors: number, jobs: Array, errorDetails: Array }>}
 */
async function importJSearchJobs(query, location, pages = PAGES_PER_QUERY) {
  if (!query || !location) {
    throw new Error('Both query and location parameters are required');
  }

  console.log(`\n🔍 Importing JSearch jobs for query="${query}" location="${location}"...`);

  const summary = {
    importedCount: 0,
    skipped: 0,
    errors: 0,
    jobs: [],
    errorDetails: []
  };

  const jobs = await fetchJobsFromJSearch(query, location, pages);
  summary.jobs = jobs;

  if (!jobs || jobs.length === 0) {
    console.log('   ℹ️  No jobs returned from JSearch API');
    return summary;
  }

  for (const jobData of jobs) {
    const result = await importJob(jobData);

    if (result.imported) {
      summary.importedCount++;
    } else if (result.skipped) {
      summary.skipped++;
    } else if (result.error) {
      summary.errors++;
      summary.errorDetails.push({ 
        job: jobData.title || 'Unknown', 
        company: jobData.company || 'Unknown',
        error: result.error 
      });
    }
  }

  console.log(`   📊 Import summary: ${summary.importedCount} imported, ${summary.skipped} skipped, ${summary.errors} errors`);
  return summary;
}

/**
 * Validate and clean URL
 */
function validateAndCleanUrl(url) {
  if (!url || typeof url !== 'string') return null;
  
  // Remove whitespace
  url = url.trim();
  
  // If URL doesn't start with http:// or https://, add https://
  if (!url.match(/^https?:\/\//i)) {
    url = 'https://' + url;
  }
  
  // Basic URL validation
  try {
    new URL(url);
    return url;
  } catch (e) {
    // If URL is still invalid, return null
    return null;
  }
}

/**
 * Import a single job into the database
 * Returns: { imported: boolean, skipped: boolean, error: string|null }
 */
async function importJob(jobData) {
  try {
    // Validate required fields
    if (!jobData.title || !jobData.company) {
      return { 
        imported: false, 
        skipped: false, 
        error: `Missing required fields: title=${!!jobData.title}, company=${!!jobData.company}` 
      };
    }

    // Validate and clean apply_url
    const cleanedApplyUrl = validateAndCleanUrl(jobData.apply_url);
    if (!cleanedApplyUrl) {
      return { 
        imported: false, 
        skipped: false, 
        error: `Invalid or missing apply_url: ${jobData.apply_url}` 
      };
    }

    // Check for duplicates by source_id first (if available)
    let existingJob = null;
    if (jobData.source_id) {
      existingJob = await Job.findOne({
        where: { source_id: jobData.source_id }
      });
    }

    // If not found by source_id, check by title + company + apply_url
    if (!existingJob) {
      existingJob = await Job.findOne({
        where: {
          title: jobData.title,
          company: jobData.company,
          apply_url: cleanedApplyUrl
        }
      });
    }

    // If job already exists, skip it
    if (existingJob) {
      return { imported: false, skipped: true, error: null };
    }

    // Prepare tags - ensure it's an array of strings
    let tags = [];
    if (Array.isArray(jobData.tags)) {
      tags = jobData.tags
        .flat()
        .map(tag => String(tag).trim())
        .filter(tag => tag.length > 0);
    } else if (jobData.tags) {
      tags = [String(jobData.tags).trim()].filter(tag => tag.length > 0);
    }

    // Ensure location is a string (not null/undefined)
    const location = jobData.location ? String(jobData.location).trim() : null;

    // Create new job
    await Job.create({
      title: String(jobData.title).trim(),
      company: String(jobData.company).trim(),
      location: location,
      salary: jobData.salary ? String(jobData.salary).trim() : null,
      description: jobData.description ? String(jobData.description).trim() : null,
      tags: tags,
      apply_url: cleanedApplyUrl,
      source: 'JSearch API',
      posted_at: jobData.posted_at || new Date(),
      source_id: jobData.source_id || null
    });

    console.log(`   ✅ Imported: ${jobData.title} at ${jobData.company}`);
    return { imported: true, skipped: false, error: null };
  } catch (error) {
    // Enhanced error logging
    const errorDetails = {
      message: error.message,
      jobTitle: jobData.title,
      jobCompany: jobData.company,
      validationErrors: error.errors ? error.errors.map(e => `${e.path}: ${e.message}`).join(', ') : null
    };
    
    console.error(`   ❌ Failed to import job: ${jobData.title} at ${jobData.company}`, errorDetails);
    
    return { 
      imported: false, 
      skipped: false, 
      error: `${error.message}${error.errors ? ' - ' + errorDetails.validationErrors : ''}` 
    };
  }
}

/**
 * Process and import jobs from a query
 */
async function processQuery(queryConfig) {
  const { query, location } = queryConfig;
  console.log(`\n🔍 Fetching: "${query}" in "${location}"...`);

  try {
    const summary = await importJSearchJobs(query, location, PAGES_PER_QUERY);

    return {
      imported: summary.importedCount,
      skipped: summary.skipped,
      errors: summary.errors,
      total: summary.jobs.length,
      errorDetails: summary.errorDetails
    };

  } catch (error) {
    console.error(`   ❌ Error processing query:`, error.message);
    return { imported: 0, skipped: 0, errors: 1, total: 0, errorDetails: [{ error: error.message }] };
  }
}

/**
 * Main function to fetch and import all jobs
 */
async function fetchAndImportAllJobs() {
  console.log('🚀 Starting job fetch and import process...');
  console.log(`📋 Processing ${JOB_QUERIES.length} queries...\n`);

  // Test database connection
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }

  const summary = {
    totalQueries: JOB_QUERIES.length,
    totalImported: 0,
    totalSkipped: 0,
    totalErrors: 0,
    totalFetched: 0,
    jordanJobsImported: 0,
    allErrors: []
  };

  // Process each query
  for (let i = 0; i < JOB_QUERIES.length; i++) {
    const queryConfig = JOB_QUERIES[i];
    const result = await processQuery(queryConfig);

    summary.totalImported += result.imported;
    summary.totalSkipped += result.skipped;
    summary.totalErrors += result.errors;
    summary.totalFetched += result.total;

    // Track Jordan-specific imports
    if (queryConfig.location.toLowerCase().includes('jordan')) {
      summary.jordanJobsImported += result.imported;
    }

    if (result.errorDetails) {
      summary.allErrors.push(...result.errorDetails);
    }

    // Small delay between queries to avoid rate limiting
    if (i < JOB_QUERIES.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Queries Processed: ${summary.totalQueries}`);
  console.log(`Total Jobs Fetched: ${summary.totalFetched}`);
  console.log(`✅ Jobs Imported: ${summary.totalImported}`);
  console.log(`⏭️  Jobs Skipped (duplicates): ${summary.totalSkipped}`);
  console.log(`❌ Errors: ${summary.totalErrors}`);
  console.log(`🇯🇴 Jordan Jobs Imported: ${summary.jordanJobsImported}`);
  console.log('='.repeat(60));

  if (summary.allErrors.length > 0) {
    console.log('\n⚠️  Errors encountered:');
    const maxErrors = 20; // Show more errors
    summary.allErrors.slice(0, maxErrors).forEach((err, idx) => {
      console.log(`   ${idx + 1}. ${err.job || 'Unknown'}: ${err.error}`);
    });
    if (summary.allErrors.length > maxErrors) {
      console.log(`   ... and ${summary.allErrors.length - maxErrors} more errors`);
    }
  }

  // Verify jobs were actually saved
  try {
    const totalJobsInDB = await Job.count();
    console.log(`\n📊 Total jobs in database: ${totalJobsInDB}`);
    
    const jordanJobsInDB = await Job.count({
      where: {
        location: {
          [Op.iLike]: '%jordan%'
        }
      }
    });
    console.log(`🇯🇴 Jordan jobs in database: ${jordanJobsInDB}`);
  } catch (countError) {
    console.warn('⚠️  Could not verify job count:', countError.message);
  }

  // Close database connection
  await sequelize.close();
  console.log('\n✅ Process completed. Database connection closed.');

  return summary;
}

// Run the script if called directly
if (require.main === module) {
  fetchAndImportAllJobs()
    .then((summary) => {
      console.log('\n🎉 Job import process finished successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { fetchAndImportAllJobs, processQuery, importJob, importJSearchJobs };


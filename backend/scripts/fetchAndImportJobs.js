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
 * Import a single job into the database
 * Returns: { imported: boolean, skipped: boolean, error: string|null }
 */
async function importJob(jobData) {
  try {
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
          apply_url: jobData.apply_url
        }
      });
    }

    // If job already exists, skip it
    if (existingJob) {
      return { imported: false, skipped: true, error: null };
    }

    // Create new job
    await Job.create({
      title: jobData.title,
      company: jobData.company,
      location: jobData.location,
      salary: jobData.salary,
      description: jobData.description,
      tags: Array.isArray(jobData.tags) ? jobData.tags.flat() : (jobData.tags || []),
      apply_url: jobData.apply_url,
      source: 'JSearch API',
      posted_at: jobData.posted_at,
      source_id: jobData.source_id
    });

    return { imported: true, skipped: false, error: null };
  } catch (error) {
    return { imported: false, skipped: false, error: error.message };
  }
}

/**
 * Process and import jobs from a query
 */
async function processQuery(queryConfig) {
  const { query, location } = queryConfig;
  console.log(`\n🔍 Fetching: "${query}" in "${location}"...`);

  try {
    // Fetch jobs from JSearch API
    const jobs = await fetchJobsFromJSearch(query, location, PAGES_PER_QUERY);
    console.log(`   ✅ Fetched ${jobs.length} jobs from API`);

    if (jobs.length === 0) {
      return { imported: 0, skipped: 0, errors: 0, total: 0 };
    }

    // Import each job
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const jobData of jobs) {
      const result = await importJob(jobData);
      
      if (result.imported) {
        importedCount++;
      } else if (result.skipped) {
        skippedCount++;
      } else if (result.error) {
        errorCount++;
        errors.push({ job: jobData.title, error: result.error });
      }
    }

    console.log(`   📊 Results: ${importedCount} imported, ${skippedCount} skipped, ${errorCount} errors`);

    return {
      imported: importedCount,
      skipped: skippedCount,
      errors: errorCount,
      total: jobs.length,
      errorDetails: errors
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

  if (summary.allErrors.length > 0 && summary.allErrors.length <= 10) {
    console.log('\n⚠️  Errors encountered:');
    summary.allErrors.slice(0, 10).forEach((err, idx) => {
      console.log(`   ${idx + 1}. ${err.job || 'Unknown'}: ${err.error}`);
    });
    if (summary.allErrors.length > 10) {
      console.log(`   ... and ${summary.allErrors.length - 10} more errors`);
    }
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

module.exports = { fetchAndImportAllJobs, processQuery, importJob };


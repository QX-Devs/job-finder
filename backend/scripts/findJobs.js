/**
 * Find Jobs Script
 * 
 * This script fetches jobs from multiple sources:
 * - JSearch API (for general job listings)
 * - LinkedIn scraping (for Jordan-specific jobs)
 * 
 * Usage: node scripts/findJobs.js
 * 
 * The server runs without fetching jobs automatically.
 * Run this script separately when you need to update the job database.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sequelize, testConnection } = require('../config/database');
const { fetchAndImportAllJobs } = require('./fetchAndImportJobs');
const {
  startJsearchImport,
  startLinkedInScrape,
  startLinkedInEasyApply,
  getScraperStatus
} = require('../services/scraperService');

// Default search parameters
const DEFAULT_QUERY = process.env.SCRAPER_DEFAULT_QUERY || 'software engineer';
const DEFAULT_LOCATION = process.env.SCRAPER_DEFAULT_LOCATION || 'Jordan';

// Configuration
const CONFIG = {
  // Enable/disable different job sources
  enableJSearch: process.env.FIND_JOBS_ENABLE_JSEARCH !== 'false',
  enableLinkedIn: process.env.FIND_JOBS_ENABLE_LINKEDIN !== 'false',
  enableLinkedInEasyApply: process.env.FIND_JOBS_ENABLE_LINKEDIN_EASY !== 'false',
  
  // Query and location (can be overridden via command line args)
  query: process.argv[2] || DEFAULT_QUERY,
  location: process.argv[3] || DEFAULT_LOCATION,
  
  // JSearch pages to fetch
  jsearchPages: parseInt(process.argv[4]) || 3
};

/**
 * Fetch jobs from JSearch API
 */
async function fetchJSearchJobs() {
  if (!CONFIG.enableJSearch) {
    console.log('⏭️  JSearch fetching is disabled');
    return;
  }

  console.log('\n' + '='.repeat(60));
  console.log('🔍 FETCHING JOBS FROM JSEARCH API');
  console.log('='.repeat(60));
  
  try {
    await fetchAndImportAllJobs();
    console.log('✅ JSearch job fetching completed');
  } catch (error) {
    console.error('❌ JSearch job fetching failed:', error.message);
    throw error;
  }
}

/**
 * Fetch jobs from LinkedIn
 */
async function fetchLinkedInJobs() {
  if (!CONFIG.enableLinkedIn && !CONFIG.enableLinkedInEasyApply) {
    console.log('⏭️  LinkedIn fetching is disabled');
    return;
  }

  console.log('\n' + '='.repeat(60));
  console.log('🔍 FETCHING JOBS FROM LINKEDIN');
  console.log('='.repeat(60));
  console.log(`Query: "${CONFIG.query}"`);
  console.log(`Location: "${CONFIG.location}"`);
  
  const payload = { query: CONFIG.query, location: CONFIG.location };
  const jobs = [];

  try {
    // Start LinkedIn regular scrape
    if (CONFIG.enableLinkedIn) {
      console.log('\n📋 Starting LinkedIn regular scrape...');
      const linkedInJob = startLinkedInScrape(payload);
      jobs.push(linkedInJob);
      console.log(`   Job ID: ${linkedInJob.id}`);
    }

    // Start LinkedIn Easy Apply scrape
    if (CONFIG.enableLinkedInEasyApply) {
      console.log('\n📋 Starting LinkedIn Easy Apply scrape...');
      const easyApplyJob = startLinkedInEasyApply(payload);
      jobs.push(easyApplyJob);
      console.log(`   Job ID: ${easyApplyJob.id}`);
    }

    // Wait for jobs to complete (with timeout)
    console.log('\n⏳ Waiting for LinkedIn scraping to complete...');
    console.log('   (This may take several minutes)');
    
    const maxWaitTime = 10 * 60 * 1000; // 10 minutes
    const checkInterval = 5000; // Check every 5 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      
      const status = getScraperStatus();
      const allCompleted = jobs.every(job => {
        const runningJob = status.runningJobs.find(j => j.id === job.id);
        return !runningJob || runningJob.status === 'completed' || runningJob.status === 'failed';
      });

      if (allCompleted) {
        console.log('✅ All LinkedIn scraping jobs completed');
        break;
      }

      // Show progress
      const running = status.runningJobs.filter(j => 
        jobs.some(job => job.id === j.id && j.status === 'running')
      );
      if (running.length > 0) {
        process.stdout.write(`\r   Still running: ${running.length} job(s)...`);
      }
    }

    // Show final status
    const finalStatus = getScraperStatus();
    jobs.forEach(job => {
      const finalJob = finalStatus.history.find(j => j.id === job.id) || 
                       finalStatus.runningJobs.find(j => j.id === job.id);
      if (finalJob) {
        if (finalJob.status === 'completed') {
          console.log(`\n✅ ${job.type} completed successfully`);
          if (finalJob.result) {
            console.log(`   Result:`, finalJob.result);
          }
        } else if (finalJob.status === 'failed') {
          console.log(`\n❌ ${job.type} failed: ${finalJob.error || 'Unknown error'}`);
        } else {
          console.log(`\n⏳ ${job.type} still running (timeout reached)`);
        }
      }
    });

  } catch (error) {
    console.error('❌ LinkedIn job fetching failed:', error.message);
    throw error;
  }
}

/**
 * Main function to fetch all jobs
 */
async function findJobs() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 STARTING JOB FETCHING PROCESS');
  console.log('='.repeat(60));
  console.log(`Query: "${CONFIG.query}"`);
  console.log(`Location: "${CONFIG.location}"`);
  console.log(`JSearch: ${CONFIG.enableJSearch ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`LinkedIn: ${CONFIG.enableLinkedIn ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`LinkedIn Easy Apply: ${CONFIG.enableLinkedInEasyApply ? '✅ Enabled' : '❌ Disabled'}`);
  console.log('='.repeat(60));

  // Test database connection
  try {
    console.log('\n🔄 Testing database connection...');
    await testConnection();
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('   Please ensure the database is running and .env is configured correctly');
    process.exit(1);
  }

  const startTime = Date.now();
  const results = {
    jsearch: { success: false, error: null },
    linkedin: { success: false, error: null }
  };

  try {
    // Fetch from JSearch
    if (CONFIG.enableJSearch) {
      try {
        await fetchJSearchJobs();
        results.jsearch.success = true;
      } catch (error) {
        results.jsearch.error = error.message;
        console.error('⚠️  JSearch fetching encountered errors, continuing...');
      }
    }

    // Fetch from LinkedIn
    if (CONFIG.enableLinkedIn || CONFIG.enableLinkedInEasyApply) {
      try {
        await fetchLinkedInJobs();
        results.linkedin.success = true;
      } catch (error) {
        results.linkedin.error = error.message;
        console.error('⚠️  LinkedIn fetching encountered errors, continuing...');
      }
    }

    // Final summary
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Duration: ${duration} seconds (${Math.round(duration / 60)} minutes)`);
    console.log(`JSearch: ${results.jsearch.success ? '✅ Success' : '❌ Failed'}`);
    if (results.jsearch.error) {
      console.log(`   Error: ${results.jsearch.error}`);
    }
    console.log(`LinkedIn: ${results.linkedin.success ? '✅ Success' : '❌ Failed'}`);
    if (results.linkedin.error) {
      console.log(`   Error: ${results.linkedin.error}`);
    }
    console.log('='.repeat(60));

    // Close database connection
    await sequelize.close();
    console.log('\n✅ Process completed. Database connection closed.');

  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  findJobs()
    .then(() => {
      console.log('\n🎉 Job fetching process finished!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { findJobs, fetchJSearchJobs, fetchLinkedInJobs };


const cron = require('node-cron');
const {
  startLinkedInScrape,
  startLinkedInEasyApply,
} = require('./scraperService');

const CRON_EXPRESSION = process.env.SCRAPER_CRON || '*/10 * * * *';
const DEFAULT_QUERY = process.env.SCRAPER_DEFAULT_QUERY || 'software engineer';
const DEFAULT_LOCATION = process.env.SCRAPER_DEFAULT_LOCATION || 'Jordan';
const ENABLE_AUTO_SCRAPER = (process.env.SCRAPER_AUTO_START || 'true').toLowerCase() === 'true';
const RUN_ON_BOOT = (process.env.SCRAPER_RUN_ON_BOOT || 'true').toLowerCase() === 'true';

let schedulerStarted = false;

function runScheduledJobs() {
  const payload = { query: DEFAULT_QUERY, location: DEFAULT_LOCATION };

  console.log(
    `[SCRAPER-SCHEDULER] Triggering automated LinkedIn scrape for "${payload.query}" in "${payload.location}"`,
  );

  // Only use LinkedIn scrapers for Jordan jobs (JSearch doesn't retrieve Jordan jobs)
  try {
    startLinkedInScrape(payload);
  } catch (error) {
    console.error('[SCRAPER-SCHEDULER] Failed to start LinkedIn scrape:', error.message);
  }

  try {
    startLinkedInEasyApply(payload);
  } catch (error) {
    console.error('[SCRAPER-SCHEDULER] Failed to start LinkedIn Easy Apply scrape:', error.message);
  }
}

function startScheduler() {
  if (schedulerStarted) {
    return;
  }

  if (!ENABLE_AUTO_SCRAPER) {
    console.log('[SCRAPER-SCHEDULER] Auto scraping disabled via SCRAPER_AUTO_START=false');
    schedulerStarted = true;
    return;
  }

  console.log(
    `[SCRAPER-SCHEDULER] Scheduling automatic scrapes every "${CRON_EXPRESSION}" (query="${DEFAULT_QUERY}", location="${DEFAULT_LOCATION}")`,
  );

  cron.schedule(CRON_EXPRESSION, runScheduledJobs, {
    timezone: process.env.SCRAPER_TIMEZONE,
  });

  if (RUN_ON_BOOT) {
    runScheduledJobs();
  }

  schedulerStarted = true;
}

module.exports = {
  startScheduler,
};


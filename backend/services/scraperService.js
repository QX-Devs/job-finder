const fs = require('fs');
const path = require('path');
const { importJSearchJobs } = require('../scripts/fetchAndImportJobs');
const { scrapeLinkedInJobs } = require('../scripts/scrapeLinkedInJobs');

const LOG_PATH = path.join(__dirname, '..', 'logs', 'scraper.log');
const runningJobs = new Map();
const jobHistory = [];
const logBuffer = [];

let lastImportSummary = null;

function ensureLogFile() {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  if (!fs.existsSync(LOG_PATH)) {
    fs.writeFileSync(LOG_PATH, '');
  }
}

function appendLog(message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    message,
    ...meta
  };

  ensureLogFile();
  fs.appendFileSync(LOG_PATH, `${JSON.stringify(entry)}\n`);

  logBuffer.push(entry);
  if (logBuffer.length > 200) {
    logBuffer.shift();
  }

  const metaPreview = Object.keys(meta).length ? JSON.stringify(meta) : '';
  console.log(`[SCRAPER] ${entry.timestamp} ${message} ${metaPreview}`);
}

function recordHistory(job) {
  jobHistory.push({ ...job });
  if (jobHistory.length > 25) {
    jobHistory.shift();
  }
}

function buildLinkedInSearchUrl({ query, location, easyApplyOnly = false }) {
  const searchUrl = new URL('https://www.linkedin.com/jobs/search/');
  if (query) searchUrl.searchParams.set('keywords', query);
  
  // Use more specific location format for better filtering
  // LinkedIn location format: "City, State, Country" or "Country"
  if (location) {
    // For Jordan, use the correct geoId to ensure we get Jordan jobs
    if (location.toLowerCase().includes('jordan')) {
      searchUrl.searchParams.set('location', 'Jordan');
      // Jordan's geoId is 103710677 (verified working)
      searchUrl.searchParams.set('geoId', '103710677');
    } else {
      searchUrl.searchParams.set('location', location);
    }
  }
  
  searchUrl.searchParams.set('refresh', 'true');
  searchUrl.searchParams.set('position', '1');
  searchUrl.searchParams.set('pageNum', '0');

  if (easyApplyOnly) {
    searchUrl.searchParams.set('f_AL', 'true');
  }

  return searchUrl.toString();
}

function startBackgroundJob(type, params, handler) {
  const jobId = `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const job = {
    id: jobId,
    type,
    params,
    status: 'running',
    startedAt: new Date().toISOString()
  };

  runningJobs.set(jobId, job);
  appendLog(`Job ${jobId} started`, { type, params });

  setImmediate(async () => {
    try {
      const result = await handler();
      job.status = 'completed';
      job.result = result;
      job.finishedAt = new Date().toISOString();
      appendLog(`Job ${jobId} completed`, { type, metrics: result });

      lastImportSummary = {
        jobId,
        type,
        finishedAt: job.finishedAt,
        result
      };
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.finishedAt = new Date().toISOString();
      appendLog(`Job ${jobId} failed`, { type, error: error.message });
    } finally {
      runningJobs.delete(jobId);
      recordHistory(job);
    }
  });

  return job;
}

function startJsearchImport({ query, location }) {
  if (!query || !location) {
    throw new Error('Both query and location are required to start a JSearch import.');
  }

  return startBackgroundJob('jsearch', { query, location }, () =>
    importJSearchJobs(query, location, 3)
  );
}

function startLinkedInScrape({ query, location }) {
  if (!query || !location) {
    throw new Error('Both query and location are required to start a LinkedIn scrape.');
  }

  const url = buildLinkedInSearchUrl({ query, location, easyApplyOnly: false });

  return startBackgroundJob('linkedin', { query, location }, () =>
    scrapeLinkedInJobs(url, { easyApplyOnly: false, writeToFile: false })
  );
}

function startLinkedInEasyApply({ query, location }) {
  if (!query || !location) {
    throw new Error('Both query and location are required to start an Easy Apply scrape.');
  }

  const url = buildLinkedInSearchUrl({ query, location, easyApplyOnly: true });

  return startBackgroundJob('linkedin-easy', { query, location }, () =>
    scrapeLinkedInJobs(url, { easyApplyOnly: true, writeToFile: false })
  );
}

function getScraperStatus() {
  return {
    runningJobs: Array.from(runningJobs.values()),
    history: [...jobHistory],
    lastImport: lastImportSummary,
    logs: [...logBuffer]
  };
}

module.exports = {
  startJsearchImport,
  startLinkedInScrape,
  startLinkedInEasyApply,
  getScraperStatus
};


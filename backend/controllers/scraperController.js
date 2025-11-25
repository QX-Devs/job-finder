const {
  startJsearchImport,
  startLinkedInScrape,
  startLinkedInEasyApply,
  getScraperStatus
} = require('../services/scraperService');

function validateInput(req, res) {
  const { query, location } = req.body || {};

  if (!query || !location) {
    res.status(400).json({
      success: false,
      started: false,
      message: 'Both "query" and "location" are required.'
    });
    return null;
  }

  return { query, location };
}

function buildQueuedResponse(type, job) {
  return {
    success: true,
    started: true,
    type,
    message: 'Scraper started',
    job
  };
}

async function runJsearchImport(req, res) {
  const payload = validateInput(req, res);
  if (!payload) return;

  try {
    const job = startJsearchImport(payload);
    return res.status(202).json(buildQueuedResponse('jsearch', job));
  } catch (error) {
    console.error('Error starting JSearch import:', error);
    return res.status(500).json({
      success: false,
      started: false,
      message: 'Failed to start JSearch import',
      error: error.message
    });
  }
}

async function runLinkedInScrape(req, res) {
  const payload = validateInput(req, res);
  if (!payload) return;

  try {
    const job = startLinkedInScrape(payload);
    return res.status(202).json(buildQueuedResponse('linkedin', job));
  } catch (error) {
    console.error('Error starting LinkedIn scrape:', error);
    return res.status(500).json({
      success: false,
      started: false,
      message: 'Failed to start LinkedIn scrape',
      error: error.message
    });
  }
}

async function runLinkedInEasyApply(req, res) {
  const payload = validateInput(req, res);
  if (!payload) return;

  try {
    const job = startLinkedInEasyApply(payload);
    return res.status(202).json(buildQueuedResponse('linkedin-easy', job));
  } catch (error) {
    console.error('Error starting LinkedIn Easy Apply scrape:', error);
    return res.status(500).json({
      success: false,
      started: false,
      message: 'Failed to start LinkedIn Easy Apply scrape',
      error: error.message
    });
  }
}

async function getStatus(req, res) {
  try {
    const status = getScraperStatus();
    return res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error retrieving scraper status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch scraper status',
      error: error.message
    });
  }
}

module.exports = {
  runJsearchImport,
  runLinkedInScrape,
  runLinkedInEasyApply,
  getStatus
};


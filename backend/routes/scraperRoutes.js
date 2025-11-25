const express = require('express');
const {
  runJsearchImport,
  runLinkedInScrape,
  runLinkedInEasyApply,
  getStatus
} = require('../controllers/scraperController');

const router = express.Router();

router.post('/scrape/jsearch', runJsearchImport);
router.post('/scrape/linkedin', runLinkedInScrape);
router.post('/scrape/linkedin/easy', runLinkedInEasyApply);
router.get('/scrape/status', getStatus);

module.exports = router;


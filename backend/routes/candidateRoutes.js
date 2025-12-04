const express = require('express');
const router = express.Router();
const { getRankedCandidates, calculateScore } = require('../controllers/candidateController');
const { protect } = require('../middleware/auth');

// All candidate routes require authentication
router.get('/rank/:jobId', protect, getRankedCandidates);
router.post('/score', protect, calculateScore);

module.exports = router;


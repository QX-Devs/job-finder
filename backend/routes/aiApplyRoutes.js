// backend/routes/aiApplyRoutes.js
const express = require('express');
const { protect } = require('../middleware/auth');
const { 
  startAIApplication, 
  getApplicationStatus, 
  getUserApplicationJobs 
} = require('../controllers/aiApplyController');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Start AI application
router.post('/start', startAIApplication);

// Get status of specific application job
router.get('/status/:jobId', getApplicationStatus);

// Get all user's application jobs
router.get('/jobs', getUserApplicationJobs);

module.exports = router;

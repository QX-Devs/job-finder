// routes/resumeRoutes.js
const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All resume routes require authentication
router.use(protect);

// Placeholder routes - we'll implement the controller later
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Resumes endpoint - to be implemented',
    data: []
  });
});

router.post('/', (req, res) => {
  res.json({
    success: true,
    message: 'Create resume endpoint - to be implemented',
    data: { id: 'temp-id' }
  });
});

module.exports = router;
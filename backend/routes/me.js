// routes/me.js
const express = require('express');
const { getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const resumeRoutes = require('./resumeRoutes');

const router = express.Router();

// All routes are protected
router.use(protect);

// User profile routes
router.get('/', getMe);
router.put('/', updateProfile);

// Resume routes under /me/resumes
router.use('/resumes', resumeRoutes);

module.exports = router;
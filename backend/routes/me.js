// routes/me.js
const express = require('express');
const { getMe, updateProfile, changePassword, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const resumeRoutes = require('./resumeRoutes');
const applicationRoutes = require('./applicationRoutes');

const router = express.Router();

// All routes are protected
router.use(protect);

// User profile routes
router.get('/', getMe);
router.put('/', updateProfile);
router.post('/change-password', changePassword);
router.delete('/', deleteAccount);

// Resume routes under /me/resumes
router.use('/resumes', resumeRoutes);
router.use('/applications', applicationRoutes);

module.exports = router;
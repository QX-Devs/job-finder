// routes/auth.js
const express = require('express');
const { register, login, verifyEmail, forgotPassword, resetPassword, resendVerificationEmail, getAuthStatus, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/resend-verification', protect, resendVerificationEmail);
router.get('/status', protect, getAuthStatus); // Auth status endpoint
router.get('/me', protect, getMe);

// Remove the resume routes from here - they belong in me.js
// router.use('/cv', resumeRoutes);

module.exports = router;
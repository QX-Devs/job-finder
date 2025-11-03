// routes/auth.js
const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// Remove the resume routes from here - they belong in me.js
// router.use('/cv', resumeRoutes);

module.exports = router;
// routes/resumeRoutes.js
const express = require('express');
const { protect } = require('../middleware/auth');
const { createResume, listResumes, generateDocx, uploadResumeFile, downloadUploadedResume } = require('../controllers/resumeController');
const multer = require('multer');
const path = require('path');

// Configure multer storage to generated/uploads
const UPLOADS_DIR = path.join(__dirname, '..', 'generated', 'uploads');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeOriginal = file.originalname.replace(/[^a-z0-9_.\-]+/gi, '_');
    cb(null, `${timestamp}_${safeOriginal}`);
  }
});

const upload = multer({ storage });

const router = express.Router();

// All resume routes require authentication
router.use(protect);

// Placeholder routes - we'll implement the controller later
router.get('/', listResumes);
router.post('/', createResume);
router.post('/generate', generateDocx);
router.post('/upload', upload.single('file'), uploadResumeFile);
router.get('/file/:filename', downloadUploadedResume);

module.exports = router;
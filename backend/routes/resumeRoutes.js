// routes/resumeRoutes.js
const express = require('express');
const { protect } = require('../middleware/auth');
const { createResume, listResumes, generateDocx, uploadResumeFile, downloadUploadedResume, getResumeById, updateResume, deleteResume, saveProgress, getInProgressResumes, getLatestDraft } = require('../controllers/resumeController');
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

// Resume routes
// Specific routes should come before parameterized routes
router.get('/', listResumes);
router.post('/', createResume);
router.post('/generate', generateDocx);
router.post('/upload', upload.single('file'), uploadResumeFile);
router.post('/save-progress', saveProgress);  // Auto-save progress endpoint
router.get('/in-progress', getInProgressResumes);  // Get all in-progress/draft resumes
router.get('/latest-draft', getLatestDraft);  // Get the most recent draft resume
router.get('/file/:filename', downloadUploadedResume);
// Parameterized routes come last
router.get('/:id', getResumeById);
router.put('/:id', updateResume);
router.delete('/:id', deleteResume);

module.exports = router;
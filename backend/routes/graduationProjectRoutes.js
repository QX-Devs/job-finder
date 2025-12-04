const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createOrUpdateProject,
  getProject,
  deleteProject
} = require('../controllers/graduationProjectController');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .post(createOrUpdateProject)
  .get(getProject)
  .delete(deleteProject);

module.exports = router;


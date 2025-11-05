const express = require('express');
const { protect } = require('../middleware/auth');
const { listApplications, createApplication, updateApplication, deleteApplication } = require('../controllers/applicationController');

const router = express.Router();

router.use(protect);

router.get('/', listApplications);
router.post('/', createApplication);
router.put('/:id', updateApplication);
router.patch('/:id', updateApplication);
router.delete('/:id', deleteApplication);

module.exports = router;





const express = require('express');
const router = express.Router();
const {
  fetchExternalJobs,
  getExternalJobs,
  getExternalJobById,
  getExternalJobStats,
  cleanupExternalJobs,
  deactivateExternalJob,
  scrapeJobDetails
} = require('../controllers/externalJobController');

const { protect, authorize } = require('../middlewares/auth');

// Public routes
router.get('/', getExternalJobs);
router.get('/stats', getExternalJobStats);
router.get('/:id', getExternalJobById);
router.post('/:id/scrape-details', scrapeJobDetails);

// Admin routes (protected)
router.post('/fetch', protect, authorize('admin'), fetchExternalJobs);
router.delete('/cleanup', protect, authorize('admin'), cleanupExternalJobs);
router.patch('/:id/deactivate', protect, authorize('admin'), deactivateExternalJob);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, requireAdmin, optionalAuth } = require('../middleware/auth');
const {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  getMyJobs,
  getStats,
} = require('../controllers/jobController');

// Public/Optional auth routes
router.get('/', optionalAuth, getJobs);
router.get('/:id', getJob);

// Admin routes
router.post('/', protect, requireAdmin, createJob);
router.put('/:id', protect, requireAdmin, updateJob);
router.delete('/:id', protect, requireAdmin, deleteJob);
router.get('/admin/my-jobs', protect, requireAdmin, getMyJobs);
router.get('/admin/stats', protect, requireAdmin, getStats);

module.exports = router;

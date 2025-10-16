const express = require('express');
const router = express.Router();

// Import controllers
const {
  applyForJob,
  getMyApplications,
  getApplicationById,
  withdrawApplication,
  getApplicationStats,
  getAllApplications,
  updateApplicationStatus,
  getJobApplications,
  applyJobValidation,
  updateStatusValidation,
  handleValidation
} = require('../controllers/applicationController');

// Import middleware
const { authenticateToken, requireJobSeeker, requireAdmin, requireUser } = require('../middleware/auth');

/**
 * @route   POST /api/applications/apply
 * @desc    Apply for a job
 * @access  Private (Job Seekers only)
 */
router.post(
  '/apply',
  authenticateToken,
  requireJobSeeker,
  applyJobValidation,
  handleValidation,
  applyForJob
);

/**
 * @route   GET /api/applications/my-applications
 * @desc    Get current user's applications
 * @access  Private (Job Seekers only)
 */
router.get('/my-applications', authenticateToken, requireJobSeeker, getMyApplications);

/**
 * @route   GET /api/applications/stats
 * @desc    Get application statistics for current user
 * @access  Private (Job Seekers only)
 */
router.get('/stats', authenticateToken, requireJobSeeker, getApplicationStats);

// Admin Routes (must come before parametric routes)
/**
 * @route   GET /api/applications/admin/all
 * @desc    Get all applications (admin)
 * @access  Private (Admin only)
 */
router.get('/admin/all', authenticateToken, requireAdmin, getAllApplications);

/**
 * @route   PUT /api/applications/admin/:id/status
 * @desc    Update application status (admin)
 * @access  Private (Admin only)
 */
router.put(
  '/admin/:id/status',
  authenticateToken,
  requireAdmin,
  updateStatusValidation,
  handleValidation,
  updateApplicationStatus
);

/**
 * @route   GET /api/applications/admin/job/:jobId
 * @desc    Get applications for specific job (admin)
 * @access  Private (Admin only)
 */
router.get('/admin/job/:jobId', authenticateToken, requireAdmin, getJobApplications);

// Parametric routes (must come after specific routes)
/**
 * @route   GET /api/applications/:id
 * @desc    Get single application details
 * @access  Private (Owner or Admin)
 */
router.get('/:id', authenticateToken, requireUser, getApplicationById);

/**
 * @route   PUT /api/applications/:id/withdraw
 * @desc    Withdraw application
 * @access  Private (Job Seekers only)
 */
router.put('/:id/withdraw', authenticateToken, requireJobSeeker, withdrawApplication);

module.exports = router;
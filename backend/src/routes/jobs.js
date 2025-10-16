const express = require('express');
const router = express.Router();

// Import controllers
const {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  getMyJobs,
  getJobStats,
  searchJobs,
  getCompanySuggestions,
  getLocationSuggestions,
  getJobTitleSuggestions,
  createJobValidation,
  handleValidation
} = require('../controllers/jobController');

// Import middleware
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

/**
 * @route   GET /api/jobs
 * @desc    Get all jobs with filtering and pagination (public)
 * @access  Public
 */
router.get('/', optionalAuth, getAllJobs);

/**
 * @route   GET /api/jobs/search
 * @desc    Advanced job search with filters
 * @access  Public
 */
router.get('/search', optionalAuth, searchJobs);

/**
 * @route   GET /api/jobs/suggestions/companies
 * @desc    Get company name suggestions for autocomplete
 * @access  Public
 */
router.get('/suggestions/companies', getCompanySuggestions);

/**
 * @route   GET /api/jobs/suggestions/locations
 * @desc    Get location suggestions for autocomplete
 * @access  Public
 */
router.get('/suggestions/locations', getLocationSuggestions);

/**
 * @route   GET /api/jobs/suggestions/titles
 * @desc    Get job title suggestions for autocomplete
 * @access  Public
 */
router.get('/suggestions/titles', getJobTitleSuggestions);

/**
 * @route   GET /api/jobs/admin/my-jobs
 * @desc    Get jobs posted by current admin
 * @access  Private (Admin only)
 */
router.get('/admin/my-jobs', authenticateToken, requireAdmin, getMyJobs);

/**
 * @route   GET /api/jobs/admin/stats
 * @desc    Get job statistics for admin dashboard
 * @access  Private (Admin only)
 */
router.get('/admin/stats', authenticateToken, requireAdmin, getJobStats);

/**
 * @route   POST /api/jobs
 * @desc    Create a new job posting
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  createJobValidation,
  handleValidation,
  createJob
);

/**
 * @route   GET /api/jobs/:id
 * @desc    Get single job by ID
 * @access  Public
 */
router.get('/:id', optionalAuth, getJobById);

/**
 * @route   PUT /api/jobs/:id
 * @desc    Update job posting
 * @access  Private (Admin only)
 */
router.put('/:id', authenticateToken, requireAdmin, updateJob);

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Delete job posting
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, deleteJob);

module.exports = router;
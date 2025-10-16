const express = require('express');
const router = express.Router();

// Import controllers
const {
  uploadResume,
  getParsedResume,
  downloadResume,
  deleteResume,
  getParsingStats,
  updateParsedResume,
  reparseResume
} = require('../controllers/resumeController');

// Import middleware
const { authenticateToken, requireJobSeeker } = require('../middleware/auth');
const { uploadResume: upload, handleUploadError } = require('../config/multer');

/**
 * @route   POST /api/resume/upload
 * @desc    Upload and parse resume file
 * @access  Private (Job Seekers only)
 */
router.post(
  '/upload',
  authenticateToken,
  requireJobSeeker,
  upload,
  handleUploadError,
  uploadResume
);

/**
 * @route   GET /api/resume/parsed
 * @desc    Get parsed resume data
 * @access  Private (Job Seekers only)
 */
router.get('/parsed', authenticateToken, requireJobSeeker, getParsedResume);

/**
 * @route   GET /api/resume/download
 * @desc    Download original resume file
 * @access  Private (Job Seekers only)
 */
router.get('/download', authenticateToken, requireJobSeeker, downloadResume);

/**
 * @route   DELETE /api/resume
 * @desc    Delete resume and parsed data
 * @access  Private (Job Seekers only)
 */
router.delete('/', authenticateToken, requireJobSeeker, deleteResume);

/**
 * @route   GET /api/resume/stats
 * @desc    Get resume parsing statistics
 * @access  Private (Job Seekers only)
 */
router.get('/stats', authenticateToken, requireJobSeeker, getParsingStats);

/**
 * @route   PUT /api/resume/parsed
 * @desc    Update parsed resume data manually
 * @access  Private (Job Seekers only)
 */
router.put('/parsed', authenticateToken, requireJobSeeker, updateParsedResume);

/**
 * @route   POST /api/resume/reparse
 * @desc    Reparse existing resume with latest AI model
 * @access  Private (Job Seekers only)
 */
router.post('/reparse', authenticateToken, requireJobSeeker, reparseResume);

module.exports = router;
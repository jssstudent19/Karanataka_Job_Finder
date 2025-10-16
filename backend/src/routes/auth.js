const express = require('express');
const router = express.Router();

// Import controllers
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  registerValidation,
  loginValidation,
  handleValidation
} = require('../controllers/authController');

// Import middleware
const { authenticateToken, createAuthRateLimit } = require('../middleware/auth');

// Create rate limiters for auth endpoints
// Increased limits for development - adjust these for production
const loginRateLimit = createAuthRateLimit(15 * 60 * 1000, 100); // 100 attempts per 15 minutes
const registerRateLimit = createAuthRateLimit(60 * 60 * 1000, 50); // 50 attempts per hour

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
  '/register',
  registerRateLimit,
  registerValidation,
  handleValidation,
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  loginRateLimit,
  loginValidation,
  handleValidation,
  login
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, updateProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticateToken, changePassword);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticateToken, logout);

module.exports = router;
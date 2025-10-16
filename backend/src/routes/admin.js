const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

// Apply admin authentication to all routes
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users for admin management
 * @access  Admin only
 */
router.get('/users', asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, role, status, search } = req.query;
  
  // Build query
  const query = {};
  
  if (role && role !== 'all') {
    query.role = role;
  }
  
  if (status && status !== 'all') {
    query.isActive = status === 'active';
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [users, totalUsers] = await Promise.all([
    User.find(query)
      .select('-password -resumeFile.data')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(query)
  ]);
  
  logger.info(`Admin ${req.user._id} fetched users list`);
  
  res.json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers,
        limit: parseInt(limit)
      }
    }
  });
}));

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get specific user details
 * @access  Admin only
 */
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -resumeFile.data');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  logger.info(`Admin ${req.user._id} viewed user ${user._id}`);
  
  res.json({
    success: true,
    data: user
  });
}));

/**
 * @route   PATCH /api/admin/users/:id/toggle-status
 * @desc    Toggle user active status
 * @access  Admin only
 */
router.patch('/users/:id/toggle-status', asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Prevent admin from deactivating themselves
  if (user._id.toString() === req.user._id.toString()) {
    throw new AppError('You cannot deactivate your own account', 400);
  }
  
  // Prevent admin from deactivating other admin accounts
  if (user.role === 'admin') {
    throw new AppError('Admin accounts cannot be deactivated by other admins', 400);
  }
  
  user.isActive = isActive;
  await user.save();
  
  logger.info(`Admin ${req.user._id} ${isActive ? 'activated' : 'deactivated'} user ${user._id}`);
  
  res.json({
    success: true,
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      userId: user._id,
      isActive: user.isActive
    }
  });
}));


/**
 * @route   GET /api/admin/stats
 * @desc    Get admin user statistics
 * @access  Admin only
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    jobSeekers,
    admins
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: { $ne: false } }),
    User.countDocuments({ role: 'jobseeker' }),
    User.countDocuments({ role: 'admin' })
  ]);
  
  const stats = {
    users: {
      total: totalUsers,
      active: activeUsers,
      jobSeekers,
      admins
    }
  };
  
  logger.info(`Admin ${req.user._id} fetched user stats`);
  
  res.json({
    success: true,
    data: stats
  });
}));


module.exports = router;

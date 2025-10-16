const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const logger = require('../config/logger');

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -resumeFile.data');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: user
  });
}));

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    location,
    dateOfBirth,
    age,
    gender,
    bio,
    website,
    linkedin,
    github
  } = req.body;

  const updateData = {};
  
  // Handle all possible profile fields dynamically
  Object.keys(req.body).forEach(key => {
    if (key.startsWith('profile.')) {
      updateData[key] = req.body[key];
    } else {
      // Handle direct profile fields
      switch(key) {
        case 'name':
          updateData['profile.name'] = req.body[key] || '';
          break;
        case 'phone':
          updateData['profile.phone'] = req.body[key] || '';
          break;
        case 'location':
          updateData['profile.location'] = req.body[key] || '';
          break;
        case 'dateOfBirth':
          updateData['profile.dateOfBirth'] = req.body[key] || null;
          break;
        case 'age':
          updateData['profile.age'] = req.body[key] || null;
          break;
        case 'gender':
          updateData['profile.gender'] = req.body[key] || '';
          break;
        case 'bio':
          updateData['profile.bio'] = req.body[key] || '';
          break;
        case 'website':
          updateData['profile.website'] = req.body[key] || '';
          break;
        case 'linkedin':
          updateData['profile.linkedin'] = req.body[key] || '';
          break;
        case 'github':
          updateData['profile.github'] = req.body[key] || '';
          break;
      }
    }
  });

  // Update email separately if changed
  if (email && email !== req.user.email) {
    // Check if email already exists
    const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }
    updateData.email = email;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select('-password -resumeFile.data');

  logger.info(`User profile updated: ${req.user._id}`);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: user
  });
}));

/**
 * @route   GET /api/users/admin/all
 * @desc    Get all users (admin only)
 * @access  Private (Admin only)
 */
router.get('/admin/all', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    role,
    search,
    sortBy = 'createdAt',
    order = 'desc'
  } = req.query;

  const filter = {};
  
  if (role) {
    filter.role = role;
  }
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const sortObj = {};
  sortObj[sortBy] = order === 'desc' ? -1 : 1;

  const users = await User.find(filter)
    .select('-password -resumeFile.data') // Exclude sensitive data
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum);

  const total = await User.countDocuments(filter);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalUsers: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    }
  });
}));

/**
 * @route   GET /api/users/admin/:id
 * @desc    Get single user details (admin only)
 * @access  Private (Admin only)
 */
router.get('/admin/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.json({
    success: true,
    data: {
      user
    }
  });
}));

/**
 * @route   PUT /api/users/admin/:id/status
 * @desc    Update user active status (admin only)
 * @access  Private (Admin only)
 */
router.put('/admin/:id/status', authenticateToken, requireAdmin, asyncHandler(async (req, res, next) => {
  const { isActive } = req.body;
  
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.isActive = isActive;
  await user.save();

  logger.info(`User status updated by admin: ${user.email} -> ${isActive ? 'active' : 'inactive'}`, {
    userId: user._id,
    adminId: req.user._id,
    newStatus: isActive
  });

  res.json({
    success: true,
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      user: {
        id: user._id,
        email: user.email,
        isActive: user.isActive
      }
    }
  });
}));

/**
 * @route   DELETE /api/users/admin/:id
 * @desc    Delete user (admin only)
 * @access  Private (Admin only)
 */
router.delete('/admin/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Don't allow deleting other admin users
  if (user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
    return next(new AppError('Cannot delete other admin users', 403));
  }

  await User.findByIdAndDelete(req.params.id);

  logger.info(`User deleted by admin: ${user.email}`, {
    deletedUserId: user._id,
    adminId: req.user._id
  });

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

/**
 * @route   GET /api/users/admin/stats
 * @desc    Get user statistics (admin only)
 * @access  Private (Admin only)
 */
router.get('/admin/stats', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: { $sum: { $cond: ['$isActive', 1, 0] } },
        inactive: { $sum: { $cond: ['$isActive', 0, 1] } }
      }
    }
  ]);

  const userStats = {
    jobseekers: { total: 0, active: 0, inactive: 0 },
    admins: { total: 0, active: 0, inactive: 0 },
    total: 0
  };

  stats.forEach(stat => {
    userStats[stat._id + 's'] = {
      total: stat.count,
      active: stat.active,
      inactive: stat.inactive
    };
    userStats.total += stat.count;
  });

  // Get recent registrations
  const recentUsers = await User.find()
    .select('name email role createdAt isActive')
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({
    success: true,
    data: {
      stats: userStats,
      recentUsers
    }
  });
}));

module.exports = router;
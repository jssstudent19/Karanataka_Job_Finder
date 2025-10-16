const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const { body, validationResult } = require('express-validator');

// Register user
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, phone, skills, location, permissions } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User already exists with this email', 400));
  }

  // Create user object
  const userData = {
    name,
    email,
    password,
    role,
    phone,
    location
  };

  // Add role-specific fields
  if (role === 'jobseeker') {
    userData.skills = skills || [];
  } else if (role === 'admin') {
    userData.permissions = permissions || ['users', 'jobs', 'applications', 'external_jobs', 'analytics'];
  }

  // Create user
  const user = new User(userData);
  await user.save();

  // Generate JWT token
  const token = user.generateAuthToken();

  // Log successful registration
  logger.info(`New user registered: ${user.email} (${user.role})`, {
    userId: user._id,
    email: user.email,
    role: user.role
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        skills: user.skills,
        permissions: user.permissions,
        location: user.location,
        createdAt: user.createdAt
      },
      token
    }
  });
});

// Login user
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  try {
    // Find user by credentials (includes password validation)
    const user = await User.findByCredentials(email, password);

    // Update last login without triggering validation
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    // Generate token
    const token = user.generateAuthToken();

    // Log successful login
    logger.info(`User logged in: ${user.email}`, {
      userId: user._id,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          skills: user.skills,
          permissions: user.permissions,
          location: user.location,
          lastLogin: user.lastLogin
        },
        token
      }
    });

  } catch (error) {
    logger.warn(`Failed login attempt for email: ${email}`, {
      email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      errorMessage: error.message,
      errorStack: error.stack
    });
    
    // Check if it's an account deactivation error
    if (error.message.includes('Account deactivated')) {
      return next(new AppError(error.message, 403));
    }
    
    return next(new AppError('Invalid email or password', 401));
  }
});

// Get current user profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        skills: user.skills,
        experience: user.experience,
        permissions: user.permissions,
        location: user.location,
        profilePicture: user.profilePicture,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  });
});

// Update user profile
const updateProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = ['name', 'phone', 'skills', 'experience', 'location', 'permissions'];
  const updates = {};

  // Filter allowed fields
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // Validate role-specific requirements
  if (req.user.role === 'admin' && updates.permissions && !Array.isArray(updates.permissions)) {
    return next(new AppError('Permissions must be an array for admin users', 400));
  }

  // Update user
  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    {
      new: true,
      runValidators: true
    }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  logger.info(`User profile updated: ${user.email}`, {
    userId: user._id,
    updates: Object.keys(updates)
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        skills: user.skills,
        experience: user.experience,
        permissions: user.permissions,
        location: user.location,
        updatedAt: user.updatedAt
      }
    }
  });
});

// Change password
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current and new password', 400));
  }

  if (newPassword.length < 6) {
    return next(new AppError('New password must be at least 6 characters long', 400));
  }

  // Get user with password field
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordCorrect) {
    return next(new AppError('Current password is incorrect', 400));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  logger.info(`Password changed for user: ${user.email}`, {
    userId: user._id
  });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// Logout user (invalidate token)
const logout = asyncHandler(async (req, res) => {
  // In a more sophisticated setup, you would add the token to a blacklist
  // For now, we'll just return a success response
  logger.info(`User logged out: ${req.user.email}`, {
    userId: req.user._id
  });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Validation rules
const registerValidation = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['jobseeker', 'admin'])
    .withMessage('Role must be either jobseeker or admin'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('permissions')
    .if(body('role').equals('admin'))
    .isArray()
    .withMessage('Permissions must be an array for admin users')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Validation error handler
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return next(new AppError(`Validation error: ${errorMessages.join(', ')}`, 400));
  }
  next();
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  registerValidation,
  loginValidation,
  handleValidation
};
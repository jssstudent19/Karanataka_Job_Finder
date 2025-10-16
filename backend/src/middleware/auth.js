const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid token format.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user and attach to request
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. User not found.'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account has been deactivated. Please contact support.'
        });
      }

      // Update last login time without triggering validation
      await User.findByIdAndUpdate(user._id, { lastActiveAt: new Date() });

      req.user = user;
      req.token = token;
      next();
      
    } catch (jwtError) {
      logger.warn(`JWT verification failed: ${jwtError.message}`);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.',
          code: 'TOKEN_INVALID'
        });
      } else {
        throw jwtError; // Re-throw unexpected errors
      }
    }
    
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

// Middleware to check if user has specific role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${requiredRoles.join(', ')}`,
        userRole: req.user.role
      });
    }
    
    next();
  };
};

// Middleware specifically for job seekers
const requireJobSeeker = requireRole('jobseeker');

// Middleware specifically for admins
const requireAdmin = requireRole('admin');

// Middleware that allows both job seekers and admins
const requireUser = requireRole(['jobseeker', 'admin']);

// Middleware to check if user owns the resource or is admin
const requireOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (!resourceUserId) {
      return res.status(400).json({
        success: false,
        message: `Resource user ID not found in ${resourceUserIdField}.`
      });
    }
    
    if (req.user._id.toString() !== resourceUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }
    
    next();
  };
};

// Optional authentication - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
        req.token = token;
      } else {
        req.user = null;
      }
      
    } catch (jwtError) {
      req.user = null;
      logger.warn(`Optional authentication failed: ${jwtError.message}`);
    }
    
    next();
    
  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    req.user = null;
    next();
  }
};

// Middleware to refresh token if it's close to expiry
const refreshTokenIfNeeded = (req, res, next) => {
  if (!req.user || !req.token) {
    return next();
  }

  try {
    const decoded = jwt.decode(req.token);
    const now = Date.now() / 1000;
    const tokenExp = decoded.exp;
    
    // If token expires within 1 hour, provide a new one
    const oneHour = 60 * 60;
    
    if (tokenExp - now < oneHour) {
      const newToken = req.user.generateAuthToken();
      res.setHeader('X-New-Token', newToken);
      
      logger.info(`Token refreshed for user ${req.user._id}`);
    }
    
  } catch (error) {
    logger.error('Token refresh error:', error);
  }
  
  next();
};

// Rate limiting for authentication endpoints
const createAuthRateLimit = (windowMs = 15 * 60 * 1000, max = 5) => {
  const rateLimit = require('express-rate-limit');
  
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting in test and development environments
      return process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
    }
  });
};

module.exports = {
  authenticateToken,
  requireRole,
  requireJobSeeker,
  requireAdmin,
  requireUser,
  requireOwnership,
  optionalAuth,
  refreshTokenIfNeeded,
  createAuthRateLimit
};
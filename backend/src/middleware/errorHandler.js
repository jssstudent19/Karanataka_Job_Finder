const logger = require('../config/logger');

// Custom error class for operational errors
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle cast errors (invalid ObjectId)
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Handle duplicate key errors
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: ${field} = '${value}'. Please use another value.`;
  return new AppError(message, 400);
};

// Handle validation errors
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle JWT errors
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again.', 401);

// Handle Multer errors (file upload)
const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File too large. Maximum size is 5MB.', 400);
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return new AppError('Too many files. Maximum 5 files allowed.', 400);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Unexpected file field.', 400);
  }
  return new AppError('File upload error.', 400);
};

// Send error in development
const sendErrorDev = (err, res) => {
  logger.error('ERROR:', {
    error: err,
    stack: err.stack,
    request: {
      method: res.req.method,
      url: res.req.url,
      headers: res.req.headers,
      body: res.req.body
    }
  });

  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
};

// Send error in production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    logger.warn('Operational Error:', {
      message: err.message,
      statusCode: err.statusCode,
      request: {
        method: res.req.method,
        url: res.req.url,
        ip: res.req.ip
      }
    });

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  } else {
    // Programming or other unknown error: log and send generic message
    logger.error('UNEXPECTED ERROR:', {
      error: err,
      stack: err.stack,
      request: {
        method: res.req.method,
        url: res.req.url,
        ip: res.req.ip
      }
    });

    res.status(500).json({
      success: false,
      message: 'Something went wrong on our end. Please try again later.',
      timestamp: new Date().toISOString()
    });
  }
};

// Main error handling middleware
const errorHandler = (err, req, res, next) => {
  // Make a copy of the error object
  let error = { ...err };
  error.message = err.message;

  // Set default values if not provided
  if (!error.statusCode) {
    error.statusCode = 500;
  }

  // Log the original error for debugging
  logger.debug('Original error:', {
    name: err.name,
    message: err.message,
    code: err.code
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = handleCastErrorDB(error);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    error = handleDuplicateFieldsDB(error);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error = handleValidationErrorDB(error);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }

  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  // Multer errors
  if (err.name === 'MulterError') {
    error = handleMulterError(err);
  }

  // Send error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Not found middleware
const notFound = (req, res, next) => {
  const message = `Route ${req.originalUrl} not found`;
  logger.warn(`404 - ${message}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  
  const error = new AppError(message, 404);
  next(error);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  notFound
};
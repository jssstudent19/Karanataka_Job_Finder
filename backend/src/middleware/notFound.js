const { AppError } = require('./errorHandler');
const logger = require('../config/logger');

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

module.exports = notFound;
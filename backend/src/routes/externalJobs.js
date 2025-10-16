const express = require('express');
const router = express.Router();
const ExternalJob = require('../models/ExternalJob');
const jobAggregatorService = require('../../services/jobAggregatorService');
const jobDetailScraperService = require('../../services/jobDetailScraperService');
const jobScheduler = require('../../services/jobScheduler');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');

/**
 * @route   GET /api/external-jobs
 * @desc    Get external jobs with filtering
 * @access  Public
 */
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    source,
    search,
    location,
    sortBy = 'scrapedAt',
    order = 'desc'
  } = req.query;

  const filter = { status: 'active' };
  
  if (source) {
    filter.source = source;
  }
  
  if (search) {
    filter.$text = { $search: search };
  }
  
  if (location) {
    filter.$or = [
      { location: { $regex: location, $options: 'i' } },
      { 'parsedLocation.city': { $regex: location, $options: 'i' } }
    ];
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const sortObj = {};
  sortObj[sortBy] = order === 'desc' ? -1 : 1;

  const jobs = await ExternalJob.find(filter)
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum);

  const total = await ExternalJob.countDocuments(filter);

  res.json({
    success: true,
    data: {
      jobs,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalJobs: total
      }
    }
  });
}));

/**
 * @route   GET /api/external-jobs/stats
 * @desc    Get external jobs statistics
 * @access  Public
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await ExternalJob.getScrapingStats(null, 30);
  
  res.json({
    success: true,
    data: {
      stats,
      lastUpdated: new Date()
    }
  });
}));

/**
 * @route   POST /api/external-jobs/admin/scrape
 * @desc    Manually trigger job aggregation from all sources
 * @access  Private (Admin only)
 */
router.post('/admin/scrape', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const {
    location = 'Karnataka,India',
    limitPerSource = 50,
    sources = ['jsearch', 'adzuna', 'careerjet'] // LinkedIn disabled: quota exceeded
  } = req.body;

  logger.info(`Manual job aggregation initiated by admin ${req.user._id}`, {
    adminId: req.user._id,
    location,
    limitPerSource,
    sources
  });

  // Run aggregation asynchronously
  jobAggregatorService.fetchAndSaveAllJobs({
    location,
    limitPerSource,
    sources
  }).then(result => {
    logger.info('Job aggregation completed', result);
  }).catch(error => {
    logger.error('Job aggregation failed:', error);
  });

  res.json({
    success: true,
    message: `Job aggregation initiated from ${sources.length} sources (${sources.join(', ')}). This may take a few minutes.`,
    config: {
      location,
      limitPerSource,
      sources,
      estimatedMaxJobs: sources.length * limitPerSource
    }
  });
}));

/**
 * @route   POST /api/external-jobs/admin/cleanup
 * @desc    Clean up old external jobs
 * @access  Private (Admin only)
 */
router.post('/admin/cleanup', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { daysOld = 90 } = req.body;

  logger.info(`Cleanup initiated by admin ${req.user._id}`, {
    adminId: req.user._id,
    daysOld
  });

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await ExternalJob.deleteMany({
    postedDate: { $lt: cutoffDate }
  });

  res.json({
    success: true,
    message: `Cleaned up ${result.deletedCount} old job listings`,
    data: {
      deletedCount: result.deletedCount,
      daysOld
    }
  });
}));

/**
 * @route   GET /api/external-jobs/admin/scheduler/status
 * @desc    Get job scheduler status
 * @access  Private (Admin only)
 */
router.get('/admin/scheduler/status', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const status = jobScheduler.getStatus();

  res.json({
    success: true,
    data: status
  });
}));

/**
 * @route   POST /api/external-jobs/admin/scheduler/start
 * @desc    Start job scheduler
 * @access  Private (Admin only)
 */
router.post('/admin/scheduler/start', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  jobScheduler.start();

  logger.info(`Job scheduler started by admin ${req.user._id}`);

  res.json({
    success: true,
    message: 'Job scheduler started successfully',
    data: jobScheduler.getStatus()
  });
}));

/**
 * @route   POST /api/external-jobs/admin/scheduler/stop
 * @desc    Stop job scheduler
 * @access  Private (Admin only)
 */
router.post('/admin/scheduler/stop', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  jobScheduler.stop();

  logger.info(`Job scheduler stopped by admin ${req.user._id}`);

  res.json({
    success: true,
    message: 'Job scheduler stopped successfully',
    data: jobScheduler.getStatus()
  });
}));

/**
 * @route   POST /api/external-jobs/admin/scheduler/trigger
 * @desc    Manually trigger job aggregation immediately
 * @access  Private (Admin only)
 */
router.post('/admin/scheduler/trigger', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  logger.info(`Job aggregation manually triggered by admin ${req.user._id}`);

  // Trigger asynchronously
  jobScheduler.triggerNow().catch(error => {
    logger.error('Manual trigger failed:', error);
  });

  res.json({
    success: true,
    message: 'Job aggregation triggered successfully. Check logs for progress.'
  });
}));

/**
 * @route   GET /api/external-jobs/:id
 * @desc    Get single external job
 * @access  Public
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const job = await ExternalJob.findById(req.params.id);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'External job not found'
    });
  }

  // Increment view count
  await job.incrementViews();

  res.json({
    success: true,
    data: {
      job
    }
  });
}));

/**
 * @route   POST /api/external-jobs/:id/scrape-details
 * @desc    Scrape full job details from external source
 * @access  Public
 */
router.post('/:id/scrape-details', asyncHandler(async (req, res) => {
  const result = await jobDetailScraperService.fetchFullJobDetails(req.params.id);

  if (result.success) {
    res.json({
      success: true,
      message: result.source === 'cache' 
        ? 'Full details already available' 
        : 'Successfully scraped full job details',
      source: result.source,
      data: result.data
    });
  } else {
    res.json({
      success: false,
      message: result.message || 'Could not fetch full details',
      data: result.data
    });
  }
}));

/**
 * @route   DELETE /api/external-jobs/admin/:id
 * @desc    Delete external job
 * @access  Private (Admin only)
 */
router.delete('/admin/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const job = await ExternalJob.findByIdAndDelete(req.params.id);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'External job not found'
    });
  }

  logger.info(`External job deleted by admin: ${job.title}`, {
    jobId: job._id,
    adminId: req.user._id
  });

  res.json({
    success: true,
    message: 'External job deleted successfully'
  });
}));

module.exports = router;
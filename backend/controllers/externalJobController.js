const jobAggregatorService = require('../services/jobAggregatorService');
const jobDetailScraperService = require('../services/jobDetailScraperService');
const ExternalJob = require('../models/ExternalJob');
const { generateLocationSearchPattern } = require('../utils/locationNormalizer');

// @desc    Fetch and save jobs from all sources
// @route   POST /api/external-jobs/fetch
// @access  Admin only
const fetchExternalJobs = async (req, res) => {
  try {
    const { location, limitPerSource, sources } = req.body;

    const options = {
      location: location || process.env.DEFAULT_SEARCH_LOCATION,
      limitPerSource: limitPerSource || 20,
      sources: sources || ['jsearch', 'adzuna', 'careerjet', 'themuse', 'remotive', 'arbeitnow']
    };

    const result = await jobAggregatorService.fetchAndSaveAllJobs(options);

    res.status(200).json({
      success: result.success,
      message: result.message,
      data: {
        aggregation: result.aggregationResults,
        database: result.saveResults
      }
    });
  } catch (error) {
    console.error('Error in fetchExternalJobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch external jobs',
      error: error.message
    });
  }
};

// @desc    Get all external jobs
// @route   GET /api/external-jobs
// @access  Public
const getExternalJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      source,
      location,
      company,
      category,
      jobType,
      workMode,
      search
    } = req.query;

    // Build filter object
    const filter = { status: 'active' };

    if (source) filter.source = source;
    
    // Location filter - use smart matching with city name variations
    if (location) {
      const locationPattern = generateLocationSearchPattern(location);
      filter.location = { $regex: locationPattern, $options: 'i' };
    }
    
    // Company filter - use partial matching
    if (company) {
      const companyTerms = company.split(' ').filter(t => t.length > 2).join('|');
      filter.company = { $regex: companyTerms || company, $options: 'i' };
    }
    if (category) filter.category = { $regex: category, $options: 'i' };
    if (jobType) filter.jobType = jobType;
    if (workMode) filter.workMode = workMode;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await ExternalJob.find(filter)
      .sort({ postedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ExternalJob.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: jobs
    });
  } catch (error) {
    console.error('Error in getExternalJobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch external jobs',
      error: error.message
    });
  }
};

// @desc    Get single external job by ID
// @route   GET /api/external-jobs/:id
// @access  Public
const getExternalJobById = async (req, res) => {
  try {
    const job = await ExternalJob.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'External job not found'
      });
    }

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error in getExternalJobById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch external job',
      error: error.message
    });
  }
};

// @desc    Get external job statistics
// @route   GET /api/external-jobs/stats
// @access  Public
const getExternalJobStats = async (req, res) => {
  try {
    const totalJobs = await ExternalJob.countDocuments({ status: 'active' });
    
    const jobsBySource = await ExternalJob.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const jobsByCategory = await ExternalJob.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const jobsByWorkMode = await ExternalJob.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$workMode', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const recentJobs = await ExternalJob.find({ status: 'active' })
      .sort({ postedDate: -1 })
      .limit(5)
      .select('title company postedDate source');

    res.status(200).json({
      success: true,
      data: {
        total: totalJobs,
        bySource: jobsBySource,
        byCategory: jobsByCategory,
        byWorkMode: jobsByWorkMode,
        recent: recentJobs
      }
    });
  } catch (error) {
    console.error('Error in getExternalJobStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// @desc    Delete old/inactive external jobs
// @route   DELETE /api/external-jobs/cleanup
// @access  Admin only
const cleanupExternalJobs = async (req, res) => {
  try {
    const { daysOld = 90 } = req.body;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await ExternalJob.deleteMany({
      postedDate: { $lt: cutoffDate }
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} old job listings`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error in cleanupExternalJobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup external jobs',
      error: error.message
    });
  }
};

// @desc    Deactivate external job
// @route   PATCH /api/external-jobs/:id/deactivate
// @access  Admin only
const deactivateExternalJob = async (req, res) => {
  try {
    const job = await ExternalJob.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'External job not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Job deactivated successfully',
      data: job
    });
  } catch (error) {
    console.error('Error in deactivateExternalJob:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate job',
      error: error.message
    });
  }
};

// @desc    Scrape full job details from external source
// @route   POST /api/external-jobs/:id/scrape-details
// @access  Public (can be called by anyone)
const scrapeJobDetails = async (req, res) => {
  try {
    const result = await jobDetailScraperService.fetchFullJobDetails(req.params.id);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.source === 'cache' 
          ? 'Full details already available' 
          : 'Successfully scraped full job details',
        source: result.source,
        data: result.data
      });
    } else {
      res.status(200).json({
        success: false,
        message: result.message || 'Could not fetch full details',
        data: result.data
      });
    }
  } catch (error) {
    console.error('Error in scrapeJobDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scrape job details',
      error: error.message
    });
  }
};

module.exports = {
  fetchExternalJobs,
  getExternalJobs,
  getExternalJobById,
  getExternalJobStats,
  cleanupExternalJobs,
  deactivateExternalJob,
  scrapeJobDetails
};

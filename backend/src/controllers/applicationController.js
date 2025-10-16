const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const mongoose = require('mongoose');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const { body, validationResult } = require('express-validator');

// Apply for a job
const applyForJob = asyncHandler(async (req, res, next) => {
  const { jobId, coverLetter } = req.body;
  const applicantId = req.user._id;

  // Check if job exists and is active
  const job = await Job.findById(jobId);
  if (!job) {
    return next(new AppError('Job not found', 404));
  }

  if (!job.isAcceptingApplications()) {
    return next(new AppError('This job is no longer accepting applications', 400));
  }

  // Check if user already applied
  const existingApplication = await Application.findOne({
    job: jobId,
    applicant: applicantId
  });

  if (existingApplication) {
    return next(new AppError('You have already applied for this job', 400));
  }

  // Create application
  const applicationData = {
    job: jobId,
    applicant: applicantId,
    coverLetter,
    source: 'direct'
  };

  // Copy current resume if exists
  const user = await User.findById(applicantId);
  if (user.resumeFile && user.resumeFile.data) {
    applicationData.resumeVersion = {
      filename: user.resumeFile.filename,
      originalname: user.resumeFile.originalname,
      mimetype: user.resumeFile.mimetype,
      size: user.resumeFile.size,
      uploadDate: new Date(),
      data: user.resumeFile.data
    };
  }

  const application = new Application(applicationData);
  await application.save();

  // Increment application count on job
  await job.incrementApplications();

  // Populate application data for response
  await application.populate([
    { path: 'job', select: 'title company location' },
    { path: 'applicant', select: 'name email skills experience' }
  ]);

  logger.info(`Application submitted: ${user.name} applied for ${job.title}`, {
    applicationId: application._id,
    jobId: job._id,
    applicantId: user._id,
    jobTitle: job.title
  });

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    data: {
      application: {
        id: application._id,
        job: application.job,
        status: application.status,
        applicationDate: application.applicationDate,
        coverLetter: application.coverLetter
      }
    }
  });
});

// Get user's applications
const getMyApplications = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    sortBy = 'applicationDate',
    order = 'desc'
  } = req.query;

  const filter = { applicant: req.user._id };
  
  if (status) {
    filter.status = status;
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const sortObj = {};
  sortObj[sortBy] = order === 'desc' ? -1 : 1;

  const applications = await Application.find(filter)
    .populate('job', 'title company location salary status applicationDeadline')
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum);

  const total = await Application.countDocuments(filter);

  res.json({
    success: true,
    data: {
      applications,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalApplications: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    }
  });
});

// Get single application details
const getApplicationById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const application = await Application.findById(id)
    .populate('job', 'title company location description salary benefits applicationDeadline')
    .populate('applicant', 'name email phone skills experience');

  if (!application) {
    return next(new AppError('Application not found', 404));
  }

  // Check if user owns this application or is admin
  if (req.user.role !== 'admin' && application.applicant._id.toString() !== req.user._id.toString()) {
    return next(new AppError('Access denied', 403));
  }

  res.json({
    success: true,
    data: {
      application
    }
  });
});

// Withdraw application
const withdrawApplication = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  const application = await Application.findOne({
    _id: id,
    applicant: req.user._id
  });

  if (!application) {
    return next(new AppError('Application not found', 404));
  }

  if (!application.canWithdraw()) {
    return next(new AppError('Cannot withdraw application at this stage', 400));
  }

  await application.withdraw(reason);

  // Decrease application count on job
  const job = await Job.findById(application.job);
  if (job && job.currentApplications > 0) {
    job.currentApplications -= 1;
    await job.save();
  }

  logger.info(`Application withdrawn: ${req.user.name} withdrew application ${application._id}`, {
    applicationId: application._id,
    applicantId: req.user._id,
    reason
  });

  res.json({
    success: true,
    message: 'Application withdrawn successfully',
    data: {
      application: {
        id: application._id,
        status: application.status,
        withdrawalReason: application.withdrawalReason,
        lastUpdated: application.lastUpdated
      }
    }
  });
});

// Get application statistics for user
const getApplicationStats = asyncHandler(async (req, res) => {
  const applicantId = req.user._id;

  const stats = await Application.aggregate([
    { $match: { applicant: applicantId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const applicationStats = {
    total: 0,
    applied: 0,
    reviewing: 0,
    shortlisted: 0,
    interview: 0,
    rejected: 0,
    accepted: 0,
    withdrawn: 0
  };

  stats.forEach(stat => {
    applicationStats[stat._id] = stat.count;
    applicationStats.total += stat.count;
  });

  // Get recent applications
  const recentApplications = await Application.find({ applicant: applicantId })
    .populate('job', 'title company location')
    .sort({ applicationDate: -1 })
    .limit(5);

  res.json({
    success: true,
    data: {
      stats: applicationStats,
      recentApplications,
      summary: {
        totalApplications: applicationStats.total,
        pendingApplications: applicationStats.applied + applicationStats.reviewing + applicationStats.shortlisted + applicationStats.interview,
        successfulApplications: applicationStats.accepted,
        responseRate: applicationStats.total > 0 
          ? Math.round(((applicationStats.total - applicationStats.applied) / applicationStats.total) * 100)
          : 0
      }
    }
  });
});

// Admin: Get all applications for jobs management
const getAllApplications = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    jobId,
    search,
    sortBy = 'applicationDate',
    order = 'desc'
  } = req.query;

  const filter = {};
  
  if (status) {
    filter.status = status;
  }
  
  if (jobId) {
    filter.job = jobId;
  }

  // If search is provided, search in applicant names and emails
  if (search) {
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');
    
    filter.applicant = { $in: users.map(u => u._id) };
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const sortObj = {};
  sortObj[sortBy] = order === 'desc' ? -1 : 1;

  const applications = await Application.find(filter)
    .populate('job', 'title company location salary')
    .populate('applicant', 'name email skills experience location')
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum);

  const total = await Application.countDocuments(filter);

  res.json({
    success: true,
    data: {
      applications,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalApplications: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    }
  });
});

// Admin: Update application status
const updateApplicationStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, notes, interviewDetails } = req.body;

  const application = await Application.findById(id);
  
  if (!application) {
    return next(new AppError('Application not found', 404));
  }

  // Update status with notes
  await application.updateStatus(status, notes);

  // Schedule interview if status is interview
  if (status === 'interview' && interviewDetails) {
    await application.scheduleInterview(interviewDetails);
  }

  // Populate for response
  await application.populate([
    { path: 'job', select: 'title company location' },
    { path: 'applicant', select: 'name email phone' }
  ]);

  logger.info(`Application status updated by admin: ${application._id} -> ${status}`, {
    applicationId: application._id,
    newStatus: status,
    adminId: req.user._id,
    notes
  });

  res.json({
    success: true,
    message: 'Application status updated successfully',
    data: {
      application: {
        id: application._id,
        status: application.status,
        lastUpdated: application.lastUpdated,
        employerNotes: application.employerNotes,
        interview: application.interview
      }
    }
  });
});

// Admin: Get applications for a specific job
const getJobApplications = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const {
    page = 1,
    limit = 20,
    status,
    sortBy = 'applicationDate',
    order = 'desc'
  } = req.query;

  // Verify job exists
  const job = await Job.findById(jobId);
  if (!job) {
    return next(new AppError('Job not found', 404));
  }

  const filter = { job: jobId };
  if (status) {
    filter.status = status;
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const sortObj = {};
  sortObj[sortBy] = order === 'desc' ? -1 : 1;

  const applications = await Application.find(filter)
    .populate('applicant', 'name email phone skills experience location')
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum);

  const total = await Application.countDocuments(filter);

  // Get application stats for this job
  const applicationStats = await Application.aggregate([
    { $match: { job: new mongoose.Types.ObjectId(jobId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const stats = {
    total: 0,
    applied: 0,
    reviewing: 0,
    shortlisted: 0,
    interview: 0,
    rejected: 0,
    accepted: 0,
    withdrawn: 0
  };

  applicationStats.forEach(stat => {
    stats[stat._id] = stat.count;
    stats.total += stat.count;
  });

  res.json({
    success: true,
    data: {
      job: {
        id: job._id,
        title: job.title,
        company: job.company
      },
      applications,
      applicationStats: stats,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalApplications: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    }
  });
});

// Validation rules
const applyJobValidation = [
  body('jobId')
    .isMongoId()
    .withMessage('Invalid job ID'),
  body('coverLetter')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Cover letter cannot exceed 2000 characters')
];

const updateStatusValidation = [
  body('status')
    .isIn(['applied', 'reviewing', 'shortlisted', 'interview', 'rejected', 'accepted'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
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
  applyForJob,
  getMyApplications,
  getApplicationById,
  withdrawApplication,
  getApplicationStats,
  getAllApplications,
  updateApplicationStatus,
  getJobApplications,
  applyJobValidation,
  updateStatusValidation,
  handleValidation
};
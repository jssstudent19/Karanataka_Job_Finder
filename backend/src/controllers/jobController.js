const Job = require('../models/Job');
const Application = require('../models/Application');
const ExternalJob = require('../models/ExternalJob');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const { body, validationResult } = require('express-validator');
const { generateLocationSearchPattern } = require('../utils/locationNormalizer');

// Create a new job posting
const createJob = asyncHandler(async (req, res, next) => {
  const jobData = {
    ...req.body,
    postedBy: req.user._id
  };

  // Set default application deadline if not provided (30 days from now)
  if (!jobData.applicationDeadline) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);
    jobData.applicationDeadline = deadline;
  }

  const job = new Job(jobData);
  await job.save();

  // Populate admin information for response
  await job.populate('postedBy', 'name email');

  logger.info(`Job created: ${job.title} by admin ${req.user.name}`, {
    jobId: job._id,
    adminId: req.user._id,
    title: job.title,
    company: job.company
  });

  res.status(201).json({
    success: true,
    message: 'Job posted successfully',
    data: {
      job
    }
  });
});

// Get all jobs with filtering and pagination
const getAllJobs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    location,
    company,
    skills,
    jobType,
    workMode,
    salaryMin,
    salaryMax,
    experience,
    sortBy = 'createdAt',
    order = 'desc',
    source = 'all' // 'internal', 'external', or 'all'
  } = req.query;

  // Build filter object
  const filter = { status: 'active' };

  // Keyword search in job title - supports partial matching
  if (search) {
    // Split search query into keywords and create regex pattern for each
    const keywords = search.trim().split(/\s+/).filter(k => k.length > 0);
    
    // Search for keywords in title (case-insensitive, partial match)
    if (keywords.length === 1) {
      // Single keyword - simple regex
      filter.title = { $regex: keywords[0], $options: 'i' };
    } else {
      // Multiple keywords - match all keywords (AND logic)
      filter.$and = keywords.map(keyword => ({
        title: { $regex: keyword, $options: 'i' }
      }));
    }
  }

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

  // Skills filter
  if (skills) {
    const skillsArray = skills.split(',').map(skill => skill.trim());
    filter.requiredSkills = { $in: skillsArray };
  }

  // Job type filter - flexible matching for all variations
  if (jobType) {
    // Normalize: remove hyphens, en-dashes, spaces and make case-insensitive
    // This matches: "full-time", "Full-time", "fulltime", "Full–time", "full time", etc.
    const normalizedType = jobType.toLowerCase().replace(/[-–\s]/g, '');
    // Create regex that matches the normalized form in any variation
    const pattern = normalizedType.split('').join('[-–\\s]?');
    filter.jobType = { $regex: pattern, $options: 'i' };
  }

  // Work mode filter - flexible matching for all variations
  if (workMode) {
    // Normalize and match: "onsite"/"on-site"/"On-site", "remote"/"Remote", etc.
    const normalizedMode = workMode.toLowerCase().replace(/[-–\s]/g, '');
    const pattern = normalizedMode.split('').join('[-–\\s]?');
    filter.workMode = { $regex: pattern, $options: 'i' };
  }

  // Salary filter
  if (salaryMin || salaryMax) {
    filter['salary.min'] = {};
    if (salaryMin) filter['salary.min'].$gte = parseInt(salaryMin);
    if (salaryMax) filter['salary.max'] = { $lte: parseInt(salaryMax) };
  }

  // Experience filter
  if (experience) {
    const expRange = experience.split('-');
    if (expRange.length === 2) {
      filter['experience.min'] = { $lte: parseInt(expRange[1]) };
      filter['experience.max'] = { $gte: parseInt(expRange[0]) };
    }
  }

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build sort object
  const sortObj = {};
  sortObj[sortBy] = order === 'desc' ? -1 : 1;

  let jobs = [];
  let total = 0;

  if (source === 'internal' || source === 'all') {
    // Get internal jobs
    const internalJobs = await Job.find(filter)
      .populate('postedBy', 'name email')
      .sort(sortObj)
      .skip(source === 'internal' ? skip : 0)
      .limit(source === 'all' ? 1000 : limitNum);

    jobs = jobs.concat(internalJobs.map(job => ({
      ...job.toObject(),
      source: 'internal',
      isExternal: false
    })));
  }

  if (source === 'external' || source === 'all') {
    // Get external jobs with similar filters
    const externalFilter = { status: 'active' };
    
    // Keyword search in job title - supports partial matching
    if (search) {
      const keywords = search.trim().split(/\s+/).filter(k => k.length > 0);
      
      if (keywords.length === 1) {
        externalFilter.title = { $regex: keywords[0], $options: 'i' };
      } else {
        externalFilter.$and = keywords.map(keyword => ({
          title: { $regex: keyword, $options: 'i' }
        }));
      }
    }
    if (location) {
      const locationPattern = generateLocationSearchPattern(location);
      externalFilter.$or = [
        { location: { $regex: locationPattern, $options: 'i' } },
        { 'parsedLocation.city': { $regex: locationPattern, $options: 'i' } }
      ];
    }
    if (company) {
      const companyTerms = company.split(' ').filter(t => t.length > 2).join('|');
      externalFilter.company = { $regex: companyTerms || company, $options: 'i' };
    }
    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      externalFilter.requiredSkills = { $in: skillsArray };
    }
    // Job type filter - flexible matching for all variations
    if (jobType && jobType !== 'unknown') {
      const normalizedType = jobType.toLowerCase().replace(/[-–\s]/g, '');
      const pattern = normalizedType.split('').join('[-–\\s]?');
      externalFilter.jobType = { $regex: pattern, $options: 'i' };
    }
    // Work mode filter - flexible matching for all variations
    if (workMode && workMode !== 'unknown') {
      const normalizedMode = workMode.toLowerCase().replace(/[-–\s]/g, '');
      const pattern = normalizedMode.split('').join('[-–\\s]?');
      externalFilter.workMode = { $regex: pattern, $options: 'i' };
    }

    const externalJobs = await ExternalJob.find(externalFilter)
      .sort({ qualityScore: -1, scrapedAt: -1 })
      .skip(source === 'external' ? skip : 0)
      .limit(source === 'all' ? 1000 : limitNum);

    jobs = jobs.concat(externalJobs.map(job => ({
      _id: job._id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      summary: job.summary,
      jobType: job.jobType,
      workMode: job.workMode,
      experienceLevel: job.experienceLevel,
      requiredSkills: job.requiredSkills,
      salary: job.salary,
      source: job.source,
      externalUrl: job.externalUrl,
      postedDate: job.postedDate,
      scrapedAt: job.scrapedAt,
      qualityScore: job.qualityScore,
      isExternal: true
    })));
  }

  // Sort combined results if needed
  if (source === 'all') {
    jobs = jobs.sort((a, b) => {
      if (sortBy === 'createdAt' || sortBy === 'postedDate') {
        const aDate = new Date(a.createdAt || a.postedDate || a.scrapedAt);
        const bDate = new Date(b.createdAt || b.postedDate || b.scrapedAt);
        return order === 'desc' ? bDate - aDate : aDate - bDate;
      }
      return 0;
    });
    
    // Apply pagination to combined results
    jobs = jobs.slice(skip, skip + limitNum);
  }

  // Get total count for pagination - MUST use same filters as fetch queries
  if (source === 'internal') {
    total = await Job.countDocuments(filter);
  } else if (source === 'external') {
    // Build the SAME external filter used above for fetching
    const externalCountFilter = { status: 'active' };
    
    if (search) {
      const keywords = search.trim().split(/\s+/).filter(k => k.length > 0);
      if (keywords.length === 1) {
        externalCountFilter.title = { $regex: keywords[0], $options: 'i' };
      } else {
        externalCountFilter.$and = keywords.map(keyword => ({
          title: { $regex: keyword, $options: 'i' }
        }));
      }
    }
    if (location) {
      const locationPattern = generateLocationSearchPattern(location);
      externalCountFilter.$or = [
        { location: { $regex: locationPattern, $options: 'i' } },
        { 'parsedLocation.city': { $regex: locationPattern, $options: 'i' } }
      ];
    }
    if (company) {
      const companyTerms = company.split(' ').filter(t => t.length > 2).join('|');
      externalCountFilter.company = { $regex: companyTerms || company, $options: 'i' };
    }
    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      externalCountFilter.requiredSkills = { $in: skillsArray };
    }
    if (jobType && jobType !== 'unknown') {
      const normalizedType = jobType.toLowerCase().replace(/[-–\s]/g, '');
      const pattern = normalizedType.split('').join('[-–\\s]?');
      externalCountFilter.jobType = { $regex: pattern, $options: 'i' };
    }
    if (workMode && workMode !== 'unknown') {
      const normalizedMode = workMode.toLowerCase().replace(/[-–\s]/g, '');
      const pattern = normalizedMode.split('').join('[-–\\s]?');
      externalCountFilter.workMode = { $regex: pattern, $options: 'i' };
    }
    
    total = await ExternalJob.countDocuments(externalCountFilter);
  } else {
    // For 'all' source, count both with their respective filters
    const internalCount = await Job.countDocuments(filter);
    
    // Build external filter with ALL the same conditions
    const externalCountFilter = { status: 'active' };
    
    if (search) {
      const keywords = search.trim().split(/\s+/).filter(k => k.length > 0);
      if (keywords.length === 1) {
        externalCountFilter.title = { $regex: keywords[0], $options: 'i' };
      } else {
        externalCountFilter.$and = keywords.map(keyword => ({
          title: { $regex: keyword, $options: 'i' }
        }));
      }
    }
    if (location) {
      const locationPattern = generateLocationSearchPattern(location);
      externalCountFilter.$or = [
        { location: { $regex: locationPattern, $options: 'i' } },
        { 'parsedLocation.city': { $regex: locationPattern, $options: 'i' } }
      ];
    }
    if (company) {
      const companyTerms = company.split(' ').filter(t => t.length > 2).join('|');
      externalCountFilter.company = { $regex: companyTerms || company, $options: 'i' };
    }
    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      externalCountFilter.requiredSkills = { $in: skillsArray };
    }
    if (jobType && jobType !== 'unknown') {
      const normalizedType = jobType.toLowerCase().replace(/[-–\s]/g, '');
      const pattern = normalizedType.split('').join('[-–\\s]?');
      externalCountFilter.jobType = { $regex: pattern, $options: 'i' };
    }
    if (workMode && workMode !== 'unknown') {
      const normalizedMode = workMode.toLowerCase().replace(/[-–\s]/g, '');
      const pattern = normalizedMode.split('').join('[-–\\s]?');
      externalCountFilter.workMode = { $regex: pattern, $options: 'i' };
    }
    
    const externalCount = await ExternalJob.countDocuments(externalCountFilter);
    total = internalCount + externalCount;
  }

  res.json({
    success: true,
    data: {
      jobs,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalJobs: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      },
      filters: {
        search,
        location,
        company,
        skills,
        jobType,
        workMode,
        salaryRange: { min: salaryMin, max: salaryMax },
        experience,
        source
      }
    }
  });
});

// Get single job by ID
const getJobById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { source = 'internal' } = req.query;

  let job;

  if (source === 'external') {
    job = await ExternalJob.findById(id);
    if (job) {
      // Increment view count
      await job.incrementViews();
      job = {
        ...job.toObject(),
        isExternal: true
      };
    }
  } else {
    job = await Job.findById(id).populate('postedBy', 'name email');
    if (job) {
      // Increment view count
      job.views += 1;
      await job.save();
      job = {
        ...job.toObject(),
        isExternal: false
      };
    }
  }

  if (!job) {
    return next(new AppError('Job not found', 404));
  }

  // Get application count for internal jobs
  let applicationCount = 0;
  if (!job.isExternal) {
    applicationCount = await Application.countDocuments({ job: id });
  }

  res.json({
    success: true,
    data: {
      job: {
        ...job,
        applicationCount
      }
    }
  });
});

// Update job posting
const updateJob = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const job = await Job.findOne({ _id: id, postedBy: req.user._id });
  
  if (!job) {
    return next(new AppError('Job not found or unauthorized', 404));
  }

  // Don't allow updating postedBy field
  delete req.body.postedBy;
  delete req.body.currentApplications;

  Object.assign(job, req.body);
  await job.save();

  await job.populate('postedBy', 'name email');

  logger.info(`Job updated: ${job.title} by admin ${req.user.name}`, {
    jobId: job._id,
    adminId: req.user._id,
    updatedFields: Object.keys(req.body)
  });

  res.json({
    success: true,
    message: 'Job updated successfully',
    data: { job }
  });
});

// Delete job posting
const deleteJob = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const job = await Job.findOne({ _id: id, postedBy: req.user._id });
  
  if (!job) {
    return next(new AppError('Job not found or unauthorized', 404));
  }

  // Update all applications for this job to withdrawn status
  await Application.updateMany(
    { job: id, status: { $in: ['applied', 'reviewing', 'shortlisted'] } },
    { 
      status: 'withdrawn',
      withdrawalReason: 'Job posting was removed by employer'
    }
  );

  await Job.findByIdAndDelete(id);

  logger.info(`Job deleted: ${job.title} by admin ${req.user.name}`, {
    jobId: job._id,
    adminId: req.user._id
  });

  res.json({
    success: true,
    message: 'Job deleted successfully'
  });
});

// Get jobs posted by current admin
const getMyJobs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    sortBy = 'createdAt',
    order = 'desc'
  } = req.query;

  const filter = { postedBy: req.user._id };
  
  if (status) {
    filter.status = status;
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const sortObj = {};
  sortObj[sortBy] = order === 'desc' ? -1 : 1;

  const jobs = await Job.find(filter)
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum)
    .populate('postedBy', 'name email');

  // Get application counts for each job
  const jobsWithStats = await Promise.all(
    jobs.map(async (job) => {
      const applicationStats = await Application.aggregate([
        { $match: { job: job._id } },
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
        accepted: 0
      };

      applicationStats.forEach(stat => {
        stats[stat._id] = stat.count;
        stats.total += stat.count;
      });

      return {
        ...job.toObject(),
        applicationStats: stats
      };
    })
  );

  const total = await Job.countDocuments(filter);

  res.json({
    success: true,
    data: {
      jobs: jobsWithStats,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalJobs: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    }
  });
});

// Get job statistics for admin dashboard
const getJobStats = asyncHandler(async (req, res) => {
  const adminId = req.user._id;

  const stats = await Job.aggregate([
    { $match: { postedBy: adminId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalViews: { $sum: '$views' },
        totalApplications: { $sum: '$currentApplications' }
      }
    }
  ]);

  const applicationStats = await Application.aggregate([
    {
      $lookup: {
        from: 'jobs',
        localField: 'job',
        foreignField: '_id',
        as: 'jobInfo'
      }
    },
    {
      $match: {
        'jobInfo.postedBy': adminId
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Format statistics
  const jobStats = {
    active: 0,
    paused: 0,
    closed: 0,
    draft: 0,
    totalViews: 0,
    totalApplications: 0
  };

  stats.forEach(stat => {
    jobStats[stat._id] = stat.count;
    jobStats.totalViews += stat.totalViews;
    jobStats.totalApplications += stat.totalApplications;
  });

  const appStats = {
    applied: 0,
    reviewing: 0,
    shortlisted: 0,
    interview: 0,
    rejected: 0,
    accepted: 0,
    withdrawn: 0
  };

  applicationStats.forEach(stat => {
    appStats[stat._id] = stat.count;
  });

  res.json({
    success: true,
    data: {
      jobStats,
      applicationStats: appStats,
      summary: {
        totalJobs: jobStats.active + jobStats.paused + jobStats.closed + jobStats.draft,
        activeJobs: jobStats.active,
        totalViews: jobStats.totalViews,
        totalApplications: jobStats.totalApplications,
        averageApplicationsPerJob: jobStats.totalApplications > 0 
          ? Math.round(jobStats.totalApplications / (jobStats.active || 1))
          : 0
      }
    }
  });
});

// Search jobs with advanced filters
const searchJobs = asyncHandler(async (req, res) => {
  const {
    q: query,
    location,
    skills,
    experience,
    salary,
    jobType,
    workMode,
    company,
    page = 1,
    limit = 20
  } = req.query;

  const pipeline = [];

  // Match stage for basic filtering
  const matchStage = {
    status: 'active'
  };

  // Keyword search in job title
  if (query) {
    const keywords = query.trim().split(/\s+/).filter(k => k.length > 0);
    
    if (keywords.length === 1) {
      matchStage.title = { $regex: keywords[0], $options: 'i' };
    } else {
      matchStage.$and = keywords.map(keyword => ({
        title: { $regex: keyword, $options: 'i' }
      }));
    }
  }

  if (location) {
    matchStage.location = { $regex: location, $options: 'i' };
  }

  if (company) {
    matchStage.company = { $regex: company, $options: 'i' };
  }

  // Job type filter - flexible matching for all variations
  if (jobType) {
    const normalizedType = jobType.toLowerCase().replace(/[-–\s]/g, '');
    const pattern = normalizedType.split('').join('[-–\\s]?');
    matchStage.jobType = { $regex: pattern, $options: 'i' };
  }

  // Work mode filter - flexible matching for all variations
  if (workMode) {
    const normalizedMode = workMode.toLowerCase().replace(/[-–\s]/g, '');
    const pattern = normalizedMode.split('').join('[-–\\s]?');
    matchStage.workMode = { $regex: pattern, $options: 'i' };
  }

  if (skills) {
    const skillsArray = skills.split(',').map(skill => skill.trim());
    matchStage.requiredSkills = { $in: skillsArray };
  }

  if (salary) {
    const salaryNum = parseInt(salary);
    matchStage.$or = [
      { 'salary.min': { $lte: salaryNum } },
      { 'salary.max': { $gte: salaryNum } }
    ];
  }

  if (experience) {
    const expNum = parseInt(experience);
    matchStage['experience.min'] = { $lte: expNum };
    matchStage['experience.max'] = { $gte: expNum };
  }

  pipeline.push({ $match: matchStage });

  // Populate employer information
  pipeline.push({
    $lookup: {
      from: 'users',
      localField: 'employer',
      foreignField: '_id',
      as: 'employerInfo',
      pipeline: [
        {
          $project: {
            name: 1,
            company: 1,
            email: 1,
            website: 1,
            location: 1
          }
        }
      ]
    }
  });

  pipeline.push({
    $unwind: '$employerInfo'
  });

  // Sort stage
  pipeline.push({ $sort: { createdAt: -1 } });

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limitNum });

  const jobs = await Job.aggregate(pipeline);
  const total = await Job.countDocuments(matchStage);

  res.json({
    success: true,
    data: {
      jobs,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalJobs: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      },
      searchCriteria: {
        query,
        location,
        skills,
        experience,
        salary,
        jobType,
        workMode,
        company
      }
    }
  });
});

// Validation rules for job creation
const createJobValidation = [
  body('title')
    .isLength({ min: 5, max: 200 })
    .withMessage('Job title must be between 5 and 200 characters'),
  body('description')
    .isLength({ min: 50, max: 5000 })
    .withMessage('Job description must be between 50 and 5000 characters'),
  body('company')
    .isLength({ min: 2, max: 200 })
    .withMessage('Company name must be between 2 and 200 characters'),
  body('location')
    .isLength({ min: 2, max: 200 })
    .withMessage('Location must be between 2 and 200 characters'),
  body('jobType')
    .isIn(['full-time', 'part-time', 'contract', 'freelance', 'internship'])
    .withMessage('Invalid job type'),
  body('workMode')
    .isIn(['onsite', 'remote', 'hybrid'])
    .withMessage('Invalid work mode'),
  body('requiredSkills')
    .isArray({ min: 1 })
    .withMessage('At least one required skill must be specified'),
  body('salary.min')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum salary must be a positive number'),
  body('salary.max')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum salary must be a positive number')
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

// Get autocomplete suggestions for companies
const getCompanySuggestions = asyncHandler(async (req, res) => {
  const { q = '' } = req.query;
  
  if (!q || q.length < 2) {
    return res.json({ success: true, data: [] });
  }

  // Get distinct companies from both internal and external jobs
  const internalCompanies = await Job.distinct('company', {
    company: { $regex: q, $options: 'i' },
    status: 'active'
  });

  const externalCompanies = await ExternalJob.distinct('company', {
    company: { $regex: q, $options: 'i' },
    status: 'active'
  });

  // Combine and deduplicate
  const allCompanies = [...new Set([...internalCompanies, ...externalCompanies])];
  
  // Sort by relevance (starts with query first) and limit to 10
  const suggestions = allCompanies
    .sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(q.toLowerCase());
      const bStarts = b.toLowerCase().startsWith(q.toLowerCase());
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    })
    .slice(0, 10);

  res.json({
    success: true,
    data: suggestions
  });
});

// Get autocomplete suggestions for locations
const getLocationSuggestions = asyncHandler(async (req, res) => {
  const { q = '' } = req.query;
  
  if (!q || q.length < 2) {
    return res.json({ success: true, data: [] });
  }

  const { filterKarnatakaLocations, karnatakaDistricts } = require('../utils/locationNormalizer');

  // Get distinct locations from both internal and external jobs
  const internalLocations = await Job.distinct('location', {
    location: { $regex: q, $options: 'i' },
    status: 'active'
  });

  const externalLocations = await ExternalJob.distinct('location', {
    location: { $regex: q, $options: 'i' },
    status: 'active'
  });

  // Combine and deduplicate
  const allLocations = [...new Set([...internalLocations, ...externalLocations])];
  
  // Filter to only include Karnataka locations
  const karnatakaLocations = filterKarnatakaLocations(allLocations);
  
  // Also include matching Karnataka districts from our master list
  const matchingDistricts = karnatakaDistricts.filter(district => 
    district.toLowerCase().includes(q.toLowerCase())
  );
  
  // Combine job locations with district names and deduplicate
  const combinedLocations = [...new Set([...karnatakaLocations, ...matchingDistricts])];
  
  // Sort by relevance (starts with query first) and limit to 10
  const suggestions = combinedLocations
    .sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(q.toLowerCase());
      const bStarts = b.toLowerCase().startsWith(q.toLowerCase());
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    })
    .slice(0, 10);

  res.json({
    success: true,
    data: suggestions
  });
});

// Get autocomplete suggestions for job titles
const getJobTitleSuggestions = asyncHandler(async (req, res) => {
  const { q = '' } = req.query;
  
  if (!q || q.length < 2) {
    return res.json({ success: true, data: [] });
  }

  // Get distinct job titles from both internal and external jobs
  const internalTitles = await Job.distinct('title', {
    title: { $regex: q, $options: 'i' },
    status: 'active'
  });

  const externalTitles = await ExternalJob.distinct('title', {
    title: { $regex: q, $options: 'i' },
    status: 'active'
  });

  // Combine and deduplicate
  const allTitles = [...new Set([...internalTitles, ...externalTitles])];
  
  // Sort by relevance (starts with query first) and limit to 10
  const suggestions = allTitles
    .sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(q.toLowerCase());
      const bStarts = b.toLowerCase().startsWith(q.toLowerCase());
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    })
    .slice(0, 10);

  res.json({
    success: true,
    data: suggestions
  });
});

module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  getMyJobs,
  getJobStats,
  searchJobs,
  getCompanySuggestions,
  getLocationSuggestions,
  getJobTitleSuggestions,
  createJobValidation,
  handleValidation
};

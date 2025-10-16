const Job = require('../models/Job');

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Admin)
exports.createJob = async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      postedBy: req.user._id,
    };

    const job = await Job.create(jobData);

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: { job },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all jobs with filters
// @route   GET /api/jobs
// @access  Public
exports.getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      location,
      skills,
      jobType,
      workMode,
      salaryMin,
      salaryMax,
      status = 'active',
    } = req.query;

    const query = { status };

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Skills filter
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      query.requiredSkills = { $in: skillsArray };
    }

    // Job type filter
    if (jobType) {
      query.jobType = jobType;
    }

    // Work mode filter
    if (workMode) {
      query.workMode = workMode;
    }

    // Salary filter
    if (salaryMin || salaryMax) {
      query['salary.min'] = {};
      if (salaryMin) query['salary.min'].$gte = parseInt(salaryMin);
      if (salaryMax) query['salary.max'].$lte = parseInt(salaryMax);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await Job.find(query)
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalJobs: total,
          hasNext: skip + jobs.length < total,
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs',
    });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name email company');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Increment view count
    await job.incrementViews();

    res.json({
      success: true,
      data: { job },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching job',
    });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Admin)
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: { job },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Admin)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    res.json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting job',
    });
  }
};

// @desc    Get admin's jobs
// @route   GET /api/jobs/admin/my-jobs
// @access  Private (Admin)
exports.getMyJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { postedBy: req.user._id };
    
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalJobs: total,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs',
    });
  }
};

// @desc    Get job statistics
// @route   GET /api/jobs/admin/stats
// @access  Private (Admin)
exports.getStats = async (req, res) => {
  try {
    const Application = require('../models/Application');

    const jobStats = await Job.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          totalApplications: { $sum: '$applicationCount' },
        },
      },
    ]);

    const applicationStats = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        jobStats: jobStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          acc.totalViews = (acc.totalViews || 0) + item.totalViews;
          acc.totalApplications = (acc.totalApplications || 0) + item.totalApplications;
          return acc;
        }, {}),
        applicationStats: applicationStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
    });
  }
};

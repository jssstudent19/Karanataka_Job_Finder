const mongoose = require('mongoose');

const externalJobSchema = new mongoose.Schema({
  // Basic Job Information
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [300, 'Job title cannot exceed 300 characters']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  location: {
    type: String,
    required: [true, 'Job location is required'],
    trim: true,
    maxlength: [300, 'Location cannot exceed 300 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [10000, 'Job description cannot exceed 10000 characters']
  },
  summary: {
    type: String,
    trim: true,
    maxlength: [1000, 'Job summary cannot exceed 1000 characters']
  },
  // External Source Information
  source: {
    type: String,
    enum: ['jsearch', 'adzuna', 'careerjet', 'themuse', 'remotive', 'arbeitnow', 'linkedin', 'apify-linkedin', 'apify-naukri', 'apify-indeed', 'indeed', 'naukri', 'glassdoor', 'other'],
    required: [true, 'Source is required']
  },
  externalId: {
    type: String,
    required: [true, 'External ID is required'],
    trim: true
  },
  externalUrl: {
    type: String,
    required: false, // Made optional as some sources may not provide direct URLs
    trim: true,
    match: [
      /^https?:\/\/.+/,
      'Please provide a valid URL'
    ]
  },
  // Job Details
  jobType: {
    type: String,
    // Removed strict enum to allow any job type from external sources
    default: 'Full-time'
  },
  workMode: {
    type: String,
    // Removed strict enum to allow any work mode from external sources
    default: 'On-site'
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'executive', 'unknown'],
    default: 'unknown'
  },
  // Salary Information
  salary: {
    min: {
      type: Number,
      min: [0, 'Minimum salary cannot be negative']
    },
    max: {
      type: Number,
      min: [0, 'Maximum salary cannot be negative']
    },
    currency: {
      type: String,
      enum: ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      default: 'INR'
    },
    period: {
      type: String,
      enum: ['annual', 'monthly', 'hourly'],
      default: 'annual'
    },
    text: {
      type: String,
      trim: true // Raw salary text as scraped
    }
  },
  // Requirements and Skills
  requiredSkills: [{
    type: String,
    trim: true
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  benefits: [{
    type: String,
    trim: true
  }],
  qualifications: [{
    type: String,
    trim: true
  }],
  // Company Information
  companyInfo: {
    size: {
      type: String,
      trim: true
    },
    industry: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true,
      match: [
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
        'Please provide a valid website URL'
      ]
    },
    logo: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Company description cannot exceed 2000 characters']
    }
  },
  // Timing Information
  postedDate: {
    type: Date
  },
  applicationDeadline: {
    type: Date
  },
  scrapedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  // Status and Processing
  status: {
    type: String,
    enum: ['active', 'expired', 'removed', 'duplicate', 'processed'],
    default: 'active'
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  processingErrors: [{
    error: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Quality and Relevance Scores
  qualityScore: {
    type: Number,
    min: [0, 'Quality score must be between 0 and 100'],
    max: [100, 'Quality score must be between 0 and 100'],
    default: 0
  },
  relevanceScore: {
    type: Number,
    min: [0, 'Relevance score must be between 0 and 100'],
    max: [100, 'Relevance score must be between 0 and 100'],
    default: 0
  },
  // Analytics and Tracking
  views: {
    type: Number,
    default: 0,
    min: [0, 'Views cannot be negative']
  },
  clicks: {
    type: Number,
    default: 0,
    min: [0, 'Clicks cannot be negative']
  },
  applications: {
    type: Number,
    default: 0,
    min: [0, 'Applications cannot be negative']
  },
  // Duplicate Detection
  contentHash: {
    type: String
    // Note: Index is created explicitly below with sparse option
  },
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExternalJob'
  },
  // Location Parsing
  parsedLocation: {
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },
  // Scraping Metadata
  scrapingSession: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  // Raw scraped data (for debugging and reprocessing)
  rawData: {
    type: mongoose.Schema.Types.Mixed,
    select: false // Don't return by default
  }
}, {
  timestamps: true
});

// Compound index to ensure uniqueness per source
externalJobSchema.index({ source: 1, externalId: 1 }, { unique: true });

// Indexes for efficient queries
externalJobSchema.index({ source: 1, status: 1 });
externalJobSchema.index({ scrapedAt: -1 });
externalJobSchema.index({ postedDate: -1 });
externalJobSchema.index({ company: 1 });
externalJobSchema.index({ location: 1 });
externalJobSchema.index({ 'parsedLocation.city': 1 });
externalJobSchema.index({ 'parsedLocation.state': 1 });
externalJobSchema.index({ jobType: 1 });
externalJobSchema.index({ workMode: 1 });
externalJobSchema.index({ experienceLevel: 1 });
externalJobSchema.index({ requiredSkills: 1 });
externalJobSchema.index({ qualityScore: -1 });
externalJobSchema.index({ relevanceScore: -1 });
externalJobSchema.index({ contentHash: 1 }, { sparse: true });
externalJobSchema.index({ duplicateOf: 1 });

// Compound indexes
externalJobSchema.index({ status: 1, scrapedAt: -1 });
externalJobSchema.index({ source: 1, scrapedAt: -1 });
externalJobSchema.index({ qualityScore: -1, relevanceScore: -1 });

// Text search index
externalJobSchema.index({
  title: 'text',
  company: 'text',
  description: 'text',
  'companyInfo.industry': 'text'
});

// Pre-save middleware to update timestamps
externalJobSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Virtual for days since scraping
externalJobSchema.virtual('daysSinceScraped').get(function() {
  const now = new Date();
  const scrapedDate = new Date(this.scrapedAt);
  const timeDiff = now.getTime() - scrapedDate.getTime();
  return Math.floor(timeDiff / (1000 * 3600 * 24));
});

// Virtual for posting age
externalJobSchema.virtual('postingAge').get(function() {
  if (!this.postedDate) return null;
  
  const now = new Date();
  const postedDate = new Date(this.postedDate);
  const timeDiff = now.getTime() - postedDate.getTime();
  return Math.floor(timeDiff / (1000 * 3600 * 24));
});

// Static method to find recent jobs by source
externalJobSchema.statics.findRecentBySource = function(source, days = 7, limit = 50) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    source,
    status: 'active',
    scrapedAt: { $gte: cutoffDate }
  })
  .sort({ scrapedAt: -1 })
  .limit(limit);
};

// Static method to find jobs by skills
externalJobSchema.statics.findBySkills = function(skills, limit = 20) {
  return this.find({
    status: 'active',
    requiredSkills: { $in: skills }
  })
  .sort({ qualityScore: -1, scrapedAt: -1 })
  .limit(limit);
};

// Static method to find jobs by location
externalJobSchema.statics.findByLocation = function(location, limit = 20) {
  return this.find({
    status: 'active',
    $or: [
      { location: new RegExp(location, 'i') },
      { 'parsedLocation.city': new RegExp(location, 'i') },
      { 'parsedLocation.state': new RegExp(location, 'i') }
    ]
  })
  .sort({ qualityScore: -1, scrapedAt: -1 })
  .limit(limit);
};

// Method to calculate quality score based on available information
externalJobSchema.methods.calculateQualityScore = function() {
  let score = 0;
  
  // Basic information (40 points)
  if (this.title && this.title.length > 5) score += 10;
  if (this.company && this.company.length > 2) score += 10;
  if (this.location && this.location.length > 2) score += 10;
  if (this.description && this.description.length > 100) score += 10;
  
  // Detailed information (30 points)
  if (this.requiredSkills && this.requiredSkills.length > 0) score += 10;
  if (this.salary && (this.salary.min || this.salary.max || this.salary.text)) score += 10;
  if (this.jobType && this.jobType !== 'unknown') score += 5;
  if (this.workMode && this.workMode !== 'unknown') score += 5;
  
  // Company information (20 points)
  if (this.companyInfo) {
    if (this.companyInfo.industry) score += 5;
    if (this.companyInfo.size) score += 5;
    if (this.companyInfo.website) score += 5;
    if (this.companyInfo.description) score += 5;
  }
  
  // Freshness (10 points)
  if (this.postedDate) {
    const daysOld = this.postingAge;
    if (daysOld < 7) score += 10;
    else if (daysOld < 30) score += 5;
  }
  
  this.qualityScore = Math.min(score, 100);
  return this.qualityScore;
};

// Method to check for duplicates
externalJobSchema.methods.findDuplicates = async function() {
  const crypto = require('crypto');
  
  // Create a hash of key fields
  const keyData = `${this.title}|${this.company}|${this.location}`.toLowerCase();
  const hash = crypto.createHash('md5').update(keyData).digest('hex');
  
  this.contentHash = hash;
  
  // Find other jobs with same hash
  const duplicates = await this.constructor.find({
    contentHash: hash,
    _id: { $ne: this._id }
  });
  
  return duplicates;
};

// Method to mark as duplicate
externalJobSchema.methods.markAsDuplicate = function(originalJobId) {
  this.status = 'duplicate';
  this.duplicateOf = originalJobId;
  return this.save();
};

// Method to increment view count
externalJobSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to increment click count
externalJobSchema.methods.incrementClicks = function() {
  this.clicks += 1;
  return this.save();
};

// Method to check if job is expired
externalJobSchema.methods.isExpired = function() {
  if (this.applicationDeadline) {
    return new Date() > this.applicationDeadline;
  }
  
  // Consider jobs older than 60 days as expired
  const maxAge = 60; // days
  return this.daysSinceScraped > maxAge;
};

// Static method to cleanup old/expired jobs
externalJobSchema.statics.cleanupExpired = function() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 60); // 60 days
  
  return this.updateMany(
    {
      $or: [
        { scrapedAt: { $lt: cutoffDate } },
        { applicationDeadline: { $lt: new Date() } }
      ],
      status: 'active'
    },
    {
      status: 'expired'
    }
  );
};

// Static method to get scraping statistics
externalJobSchema.statics.getScrapingStats = function(source = null, days = 30) {
  const matchStage = {
    scrapedAt: {
      $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    }
  };
  
  if (source) {
    matchStage.source = source;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$source',
        totalJobs: { $sum: 1 },
        activeJobs: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        averageQuality: { $avg: '$qualityScore' },
        totalViews: { $sum: '$views' },
        totalClicks: { $sum: '$clicks' }
      }
    },
    { $sort: { totalJobs: -1 } }
  ]);
};

module.exports = mongoose.model('ExternalJob', externalJobSchema);
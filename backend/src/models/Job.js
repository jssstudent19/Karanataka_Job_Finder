const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Job title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true,
    maxlength: [5000, 'Job description cannot exceed 5000 characters']
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
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship'],
    required: [true, 'Job type is required'],
    default: 'full-time'
  },
  workMode: {
    type: String,
    enum: ['onsite', 'remote', 'hybrid'],
    required: [true, 'Work mode is required'],
    default: 'onsite'
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  experience: {
    min: {
      type: Number,
      min: [0, 'Minimum experience cannot be negative'],
      default: 0
    },
    max: {
      type: Number,
      min: [0, 'Maximum experience cannot be negative']
    }
  },
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
      enum: ['INR', 'USD', 'EUR', 'GBP'],
      default: 'INR'
    },
    period: {
      type: String,
      enum: ['annual', 'monthly', 'hourly'],
      default: 'annual'
    }
  },
  education: {
    type: String,
    enum: ['high-school', 'diploma', 'bachelors', 'masters', 'phd', 'any'],
    default: 'any'
  },
  benefits: [String],
  responsibilities: [String],
  requirements: [String],
  // Job posting details (admin managed)
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Posted by admin is required']
  },
  applicationDeadline: {
    type: Date
  },
  maxApplications: {
    type: Number,
    min: [1, 'Maximum applications must be at least 1'],
    default: 100
  },
  currentApplications: {
    type: Number,
    default: 0,
    min: [0, 'Current applications cannot be negative']
  },
  // Job status and metadata
  status: {
    type: String,
    enum: ['active', 'paused', 'closed', 'draft'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  featured: {
    type: Boolean,
    default: false
  },
  // External job source (for scraped jobs)
  source: {
    type: String,
    enum: ['internal', 'linkedin', 'indeed', 'naukri', 'other'],
    default: 'internal'
  },
  externalId: {
    type: String
    // Note: Index is created explicitly below, not here
  },
  externalUrl: {
    type: String,
    trim: true,
    match: [
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
      'Please provide a valid URL'
    ]
  },
  // Analytics and tracking
  views: {
    type: Number,
    default: 0,
    min: [0, 'Views cannot be negative']
  },
  applicantViews: {
    type: Number,
    default: 0,
    min: [0, 'Applicant views cannot be negative']
  },
  // SEO and search optimization
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  // Location coordinates for geo-based searching
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
}, {
  timestamps: true
});

// Indexes for efficient queries
jobSchema.index({ title: 'text', description: 'text', company: 'text' });
jobSchema.index({ location: 1 });
jobSchema.index({ requiredSkills: 1 });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ workMode: 1 });
jobSchema.index({ source: 1 });
jobSchema.index({ externalId: 1 }, { sparse: true });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ applicationDeadline: 1 });
jobSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

// Compound indexes
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ postedBy: 1, status: 1 });
jobSchema.index({ source: 1, status: 1 });

// Pre-save middleware to generate slug
jobSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('title') || this.isModified('company')) {
    const baseSlug = `${this.title}-${this.company}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    this.slug = `${baseSlug}-${this._id}`;
  }
  next();
});

// Virtual for days remaining until deadline
jobSchema.virtual('daysUntilDeadline').get(function() {
  if (!this.applicationDeadline) return null;
  
  const now = new Date();
  const deadline = new Date(this.applicationDeadline);
  const timeDiff = deadline.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  return daysDiff > 0 ? daysDiff : 0;
});

// Virtual for application progress percentage
jobSchema.virtual('applicationProgress').get(function() {
  if (!this.maxApplications) return 0;
  return Math.min((this.currentApplications / this.maxApplications) * 100, 100);
});

// Static method to find jobs by skills
jobSchema.statics.findBySkills = function(skills, limit = 20) {
  return this.find({
    status: 'active',
    requiredSkills: { $in: skills }
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('postedBy', 'name email');
};

// Static method to find jobs by location
jobSchema.statics.findByLocation = function(location, radius = 50) {
  return this.find({
    status: 'active',
    $or: [
      { location: new RegExp(location, 'i') },
      // Add geo-spatial query if coordinates are available
    ]
  })
  .sort({ createdAt: -1 })
  .populate('postedBy', 'name email');
};

// Method to check if application deadline has passed
jobSchema.methods.isDeadlinePassed = function() {
  if (!this.applicationDeadline) return false;
  return new Date() > this.applicationDeadline;
};

// Method to check if job is accepting applications
jobSchema.methods.isAcceptingApplications = function() {
  return (
    this.status === 'active' &&
    !this.isDeadlinePassed() &&
    this.currentApplications < this.maxApplications
  );
};

// Method to increment application count
jobSchema.methods.incrementApplications = function() {
  this.currentApplications += 1;
  return this.save();
};

module.exports = mongoose.model('Job', jobSchema);
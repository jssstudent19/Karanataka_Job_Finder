const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true,
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship'],
    required: [true, 'Job type is required'],
  },
  workMode: {
    type: String,
    enum: ['onsite', 'remote', 'hybrid'],
    default: 'onsite',
  },
  requiredSkills: [{
    type: String,
    trim: true,
  }],
  experience: {
    min: {
      type: Number,
      min: 0,
      default: 0,
    },
    max: {
      type: Number,
      min: 0,
    },
  },
  salary: {
    min: {
      type: Number,
      min: 0,
    },
    max: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    period: {
      type: String,
      enum: ['hourly', 'monthly', 'annual'],
      default: 'annual',
    },
  },
  education: {
    type: String,
    enum: ['high-school', 'diploma', 'bachelors', 'masters', 'phd', 'any'],
    default: 'bachelors',
  },
  responsibilities: [{
    type: String,
    trim: true,
  }],
  requirements: [{
    type: String,
    trim: true,
  }],
  benefits: [{
    type: String,
    trim: true,
  }],
  applicationDeadline: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'closed'],
    default: 'active',
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  applicationCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes for search and filtering
jobSchema.index({ title: 'text', description: 'text', company: 'text' });
jobSchema.index({ location: 1 });
jobSchema.index({ requiredSkills: 1 });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ jobType: 1, workMode: 1 });

// Virtual for applications
jobSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'job',
});

// Method to increment view count
jobSchema.methods.incrementViews = async function() {
  this.viewCount += 1;
  await this.save();
};

module.exports = mongoose.model('Job', jobSchema);

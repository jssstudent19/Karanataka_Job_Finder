const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job reference is required']
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Applicant reference is required']
  },
  status: {
    type: String,
    enum: ['applied', 'reviewing', 'shortlisted', 'interview', 'rejected', 'accepted', 'withdrawn'],
    default: 'applied'
  },
  coverLetter: {
    type: String,
    trim: true,
    maxlength: [2000, 'Cover letter cannot exceed 2000 characters']
  },
  resumeVersion: {
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    data: Buffer
  },
  // Application tracking
  applicationDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  viewedByEmployer: {
    type: Boolean,
    default: false
  },
  viewedDate: {
    type: Date
  },
  // Interview details
  interview: {
    scheduled: {
      type: Boolean,
      default: false
    },
    date: Date,
    time: String,
    mode: {
      type: String,
      enum: ['in-person', 'video', 'phone']
    },
    location: String,
    notes: String
  },
  // Employer feedback
  employerNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Employer notes cannot exceed 1000 characters']
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be between 1 and 5'],
    max: [5, 'Rating must be between 1 and 5']
  },
  // Withdrawal/rejection reason
  withdrawalReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Withdrawal reason cannot exceed 500 characters']
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  // Communication tracking
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    sentDate: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  }],
  // Application source tracking
  source: {
    type: String,
    enum: ['direct', 'referral', 'linkedin', 'indeed', 'other'],
    default: 'direct'
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index to ensure one application per user per job
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

// Other indexes for efficient queries
applicationSchema.index({ applicant: 1, status: 1 });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ applicationDate: -1 });
applicationSchema.index({ lastUpdated: -1 });
applicationSchema.index({ viewedByEmployer: 1 });

// Update lastUpdated before save
applicationSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Virtual for time since application
applicationSchema.virtual('daysSinceApplication').get(function() {
  const now = new Date();
  const appDate = new Date(this.applicationDate);
  const timeDiff = now.getTime() - appDate.getTime();
  return Math.floor(timeDiff / (1000 * 3600 * 24));
});

// Virtual for application age category
applicationSchema.virtual('applicationAge').get(function() {
  const days = this.daysSinceApplication;
  if (days < 1) return 'today';
  if (days < 7) return 'this-week';
  if (days < 30) return 'this-month';
  return 'older';
});

// Static method to get applications by status
applicationSchema.statics.getByStatus = function(status, limit = 50) {
  return this.find({ status })
    .populate('job', 'title company location')
    .populate('applicant', 'name email skills experience')
    .sort({ applicationDate: -1 })
    .limit(limit);
};

// Static method to get applications for a specific job
applicationSchema.statics.getForJob = function(jobId, status = null) {
  const query = { job: jobId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('applicant', 'name email skills experience location')
    .sort({ applicationDate: -1 });
};

// Static method to get applications by applicant
applicationSchema.statics.getByApplicant = function(applicantId, status = null) {
  const query = { applicant: applicantId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('job', 'title company location salary status')
    .sort({ applicationDate: -1 });
};

// Method to update status with timestamp
applicationSchema.methods.updateStatus = function(newStatus, notes = '') {
  this.status = newStatus;
  this.lastUpdated = new Date();
  
  if (notes) {
    this.employerNotes = notes;
  }
  
  // Mark as viewed if status is being updated by employer
  if (!this.viewedByEmployer) {
    this.viewedByEmployer = true;
    this.viewedDate = new Date();
  }
  
  return this.save();
};

// Method to add message
applicationSchema.methods.addMessage = function(senderId, message) {
  this.messages.push({
    sender: senderId,
    message: message,
    sentDate: new Date(),
    read: false
  });
  
  this.lastUpdated = new Date();
  return this.save();
};

// Method to mark as viewed by employer
applicationSchema.methods.markViewedByEmployer = function() {
  if (!this.viewedByEmployer) {
    this.viewedByEmployer = true;
    this.viewedDate = new Date();
    this.lastUpdated = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to schedule interview
applicationSchema.methods.scheduleInterview = function(interviewDetails) {
  this.interview = {
    scheduled: true,
    ...interviewDetails
  };
  this.status = 'interview';
  this.lastUpdated = new Date();
  
  return this.save();
};

// Method to check if application can be withdrawn
applicationSchema.methods.canWithdraw = function() {
  return !['rejected', 'accepted', 'withdrawn'].includes(this.status);
};

// Method to withdraw application
applicationSchema.methods.withdraw = function(reason = '') {
  if (!this.canWithdraw()) {
    throw new Error('Application cannot be withdrawn at this stage');
  }
  
  this.status = 'withdrawn';
  this.withdrawalReason = reason;
  this.lastUpdated = new Date();
  
  return this.save();
};

module.exports = mongoose.model('Application', applicationSchema);
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  coverLetter: {
    type: String,
    trim: true,
    maxlength: [2000, 'Cover letter cannot exceed 2000 characters'],
  },
  status: {
    type: String,
    enum: ['applied', 'reviewing', 'shortlisted', 'interview', 'rejected', 'accepted', 'withdrawn'],
    default: 'applied',
  },
  resumeSnapshot: {
    type: mongoose.Schema.Types.Mixed,
  },
  notes: {
    type: String,
    trim: true,
  },
  interviewDetails: {
    date: Date,
    time: String,
    mode: {
      type: String,
      enum: ['phone', 'video', 'in-person'],
    },
    location: String,
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  statusHistory: [{
    status: String,
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: String,
  }],
}, {
  timestamps: true,
});

// Compound index to prevent duplicate applications
applicationSchema.index({ applicant: 1, job: 1 }, { unique: true });
applicationSchema.index({ applicant: 1, status: 1 });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ status: 1, appliedAt: -1 });

// Add status to history before saving
applicationSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
    });
  }
  next();
});

module.exports = mongoose.model('Application', applicationSchema);

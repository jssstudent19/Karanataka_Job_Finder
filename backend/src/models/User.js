const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: ['jobseeker', 'admin'],
    required: [true, 'Role is required'],
    default: 'jobseeker'
  },
  // Profile information - ALL OPTIONAL
  profile: {
    name: {
      type: String,
      trim: true,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    location: {
      type: String,
      trim: true,
      default: ''
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    age: {
      type: Number,
      default: null
    },
    gender: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      trim: true,
      default: ''
    },
    linkedin: {
      type: String,
      trim: true,
      default: ''
    },
    github: {
      type: String,
      trim: true,
      default: ''
    },
    // Resume-extracted data
    skills: [{
      type: String,
      trim: true
    }],
    education: [{
      degree: String,
      institution: String,
      year: String,
      details: String
    }],
    experience: [{
      title: String,
      company: String,
      duration: String,
      responsibilities: [String]
    }],
    projects: [{
      name: String,
      description: String,
      technologies: [String]
    }],
    achievements: [String]
  },
  // Legacy fields for compatibility - ALL OPTIONAL
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  skills: [{
    type: String,
    trim: true
  }],
  experience: {
    type: Number,
    default: null
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  // Admin specific fields
  permissions: [{
    type: String,
    enum: ['users', 'jobs', 'applications', 'external_jobs', 'analytics', 'system'],
    default: function() {
      return this.role === 'admin' ? ['users', 'jobs', 'applications', 'external_jobs', 'analytics'] : [];
    }
  }],
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  // Profile and resume info
  profilePicture: {
    type: String,
    default: null
  },
  resumeFile: {
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    data: Buffer // Store file as binary data
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
// Note: email index is created automatically due to unique: true
userSchema.index({ role: 1 });
userSchema.index({ skills: 1 });
userSchema.index({ permissions: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role 
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN
    }
  );
};

// Transform JSON output (remove sensitive data)
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.resumeFile; // Don't return binary data in JSON
  return userObject;
};

// Static method to find user by email with password
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email }).select('+password');
  
  if (!user || !(await user.comparePassword(password))) {
    throw new Error('Invalid credentials');
  }
  
  // Check if user account is active
  if (user.isActive === false) {
    throw new Error('Account deactivated. Please contact admin for assistance.');
  }
  
  return user;
};

module.exports = mongoose.model('User', userSchema);
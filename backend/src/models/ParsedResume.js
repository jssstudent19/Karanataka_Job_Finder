const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  degree: {
    type: String,
    trim: true
  },
  institution: {
    type: String,
    trim: true
  },
  fieldOfStudy: {
    type: String,
    trim: true
  },
  startYear: {
    type: Number,
    min: [1950, 'Start year must be after 1950'],
    max: [new Date().getFullYear(), 'Start year cannot be in the future']
  },
  endYear: {
    type: Number,
    min: [1950, 'End year must be after 1950'],
    max: [new Date().getFullYear() + 10, 'End year seems too far in the future']
  },
  grade: {
    type: String,
    trim: true
  },
  ongoing: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const experienceSchema = new mongoose.Schema({
  jobTitle: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  startDate: {
    type: String,
    trim: true
  },
  endDate: {
    type: String,
    trim: true
  },
  current: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    trim: true
  },
  responsibilities: [{
    type: String,
    trim: true
  }],
  achievements: [{
    type: String,
    trim: true
  }],
  duration: {
    type: String,
    trim: true
  }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  technologies: [{
    type: String,
    trim: true
  }],
  startDate: {
    type: String,
    trim: true
  },
  endDate: {
    type: String,
    trim: true
  },
  url: {
    type: String,
    trim: true,
    match: [
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
      'Please provide a valid URL'
    ]
  },
  github: {
    type: String,
    trim: true
  }
}, { _id: false });

const certificationSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  issuer: {
    type: String,
    trim: true
  },
  issueDate: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: String,
    trim: true
  },
  credentialId: {
    type: String,
    trim: true
  },
  url: {
    type: String,
    trim: true
  }
}, { _id: false });

const parsedResumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    unique: true
  },
  // Basic Information
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        // Only validate if email is provided
        if (!v || v === '') return true;
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please provide a valid email'
    }
  },
  phone: {
    type: String,
    trim: true
  },
  location: {
    address: {
      type: String,
      trim: true
    },
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
    postalCode: {
      type: String,
      trim: true
    }
  },
  // Professional Summary
  summary: {
    type: String,
    trim: true,
    maxlength: [1000, 'Summary cannot exceed 1000 characters']
  },
  objective: {
    type: String,
    trim: true,
    maxlength: [500, 'Objective cannot exceed 500 characters']
  },
  // Skills and Expertise
  skills: [{
    type: String,
    trim: true
  }],
  technicalSkills: [{
    category: {
      type: String,
      trim: true
    },
    skills: [{
      type: String,
      trim: true
    }]
  }],
  languages: [{
    language: {
      type: String,
      trim: true
    },
    proficiency: {
      type: String,
      enum: ['basic', 'intermediate', 'advanced', 'native', 'fluent'],
      trim: true
    }
  }],
  // Experience and Education
  experience: [experienceSchema],
  education: [educationSchema],
  projects: [projectSchema],
  certifications: [certificationSchema],
  // Career Information
  totalExperienceYears: {
    type: Number,
    min: [0, 'Experience cannot be negative'],
    max: [50, 'Experience seems too high']
  },
  totalExperienceMonths: {
    type: Number,
    min: [0, 'Experience months cannot be negative'],
    max: [11, 'Months should be 0-11']
  },
  currentRole: {
    type: String,
    trim: true
  },
  currentCompany: {
    type: String,
    trim: true
  },
  preferredRole: {
    type: String,
    trim: true
  },
  industryExperience: [{
    type: String,
    trim: true
  }],
  // Social and Online Presence
  linkedin: {
    type: String,
    trim: true,
    match: [/^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/, 'Please provide a valid LinkedIn URL']
  },
  github: {
    type: String,
    trim: true,
    match: [/^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9-]+\/?$/, 'Please provide a valid GitHub URL']
  },
  portfolio: {
    type: String,
    trim: true,
    match: [
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
      'Please provide a valid portfolio URL'
    ]
  },
  // Achievements and Awards
  achievements: [{
    title: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    date: {
      type: String,
      trim: true
    },
    issuer: {
      type: String,
      trim: true
    }
  }],
  publications: [{
    title: {
      type: String,
      trim: true
    },
    journal: {
      type: String,
      trim: true
    },
    date: {
      type: String,
      trim: true
    },
    url: {
      type: String,
      trim: true
    }
  }],
  // Parsing Metadata
  parsingVersion: {
    type: String,
    default: '1.0'
  },
  parsingModel: {
    type: String,
    trim: true
  },
  parsingConfidence: {
    type: Number,
    min: [0, 'Confidence must be between 0 and 1'],
    max: [1, 'Confidence must be between 0 and 1']
  },
  extractedText: {
    type: String,
    select: false // Don't return by default to save bandwidth
  },
  parsingErrors: [{
    field: String,
    error: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  // Matching and Analysis
  skillsAnalysis: {
    primarySkills: [{
      type: String,
      trim: true
    }],
    secondarySkills: [{
      type: String,
      trim: true
    }],
    skillLevel: {
      type: String,
      enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'],
      trim: true
    }
  },
  experienceAnalysis: {
    careerProgression: {
      type: String,
      enum: ['ascending', 'lateral', 'mixed', 'unclear'],
      trim: true
    },
    jobStability: {
      type: String,
      enum: ['high', 'medium', 'low'],
      trim: true
    },
    averageJobDuration: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
// Note: user index is created automatically due to unique: true
parsedResumeSchema.index({ skills: 1 });
parsedResumeSchema.index({ 'skillsAnalysis.primarySkills': 1 });
parsedResumeSchema.index({ totalExperienceYears: 1 });
parsedResumeSchema.index({ 'skillsAnalysis.skillLevel': 1 });
parsedResumeSchema.index({ currentRole: 1 });
parsedResumeSchema.index({ industryExperience: 1 });
parsedResumeSchema.index({ updatedAt: -1 });

// Text index for full-text search
parsedResumeSchema.index({
  name: 'text',
  summary: 'text',
  'experience.jobTitle': 'text',
  'experience.company': 'text',
  'projects.title': 'text',
  'projects.description': 'text'
});

// Virtual for years of experience calculation
parsedResumeSchema.virtual('calculatedExperience').get(function() {
  if (this.experience && this.experience.length > 0) {
    // Calculate total experience from work history
    let totalMonths = 0;
    this.experience.forEach(exp => {
      // Simple calculation - could be made more sophisticated
      if (exp.startDate && exp.endDate) {
        // This is a simplified calculation
        totalMonths += 12; // Placeholder - implement proper date parsing
      }
    });
    return Math.floor(totalMonths / 12);
  }
  return this.totalExperienceYears || 0;
});

// Virtual for skill count
parsedResumeSchema.virtual('skillCount').get(function() {
  return this.skills ? this.skills.length : 0;
});

// Static method to find candidates by skills
parsedResumeSchema.statics.findBySkills = function(skills, experienceMin = 0, limit = 20) {
  return this.find({
    skills: { $in: skills },
    totalExperienceYears: { $gte: experienceMin }
  })
  .populate('user', 'name email location')
  .sort({ updatedAt: -1 })
  .limit(limit);
};

// Static method to find candidates by experience level
parsedResumeSchema.statics.findByExperience = function(minYears, maxYears, limit = 20) {
  const query = { totalExperienceYears: {} };
  if (minYears !== undefined) query.totalExperienceYears.$gte = minYears;
  if (maxYears !== undefined) query.totalExperienceYears.$lte = maxYears;
  
  return this.find(query)
    .populate('user', 'name email location skills')
    .sort({ updatedAt: -1 })
    .limit(limit);
};

// Method to analyze skill match with job requirements
parsedResumeSchema.methods.calculateSkillMatch = function(requiredSkills) {
  if (!this.skills || !requiredSkills || requiredSkills.length === 0) {
    return { percentage: 0, matchedSkills: [], missingSkills: requiredSkills || [] };
  }
  
  const userSkillsLower = this.skills.map(skill => skill.toLowerCase());
  const requiredSkillsLower = requiredSkills.map(skill => skill.toLowerCase());
  
  const matchedSkills = requiredSkillsLower.filter(skill => 
    userSkillsLower.some(userSkill => userSkill.includes(skill) || skill.includes(userSkill))
  );
  
  const missingSkills = requiredSkillsLower.filter(skill => 
    !userSkillsLower.some(userSkill => userSkill.includes(skill) || skill.includes(userSkill))
  );
  
  const percentage = Math.round((matchedSkills.length / requiredSkillsLower.length) * 100);
  
  return {
    percentage,
    matchedSkills,
    missingSkills,
    totalRequired: requiredSkillsLower.length,
    totalMatched: matchedSkills.length
  };
};

// Method to update user profile with parsed data
parsedResumeSchema.methods.updateUserProfile = async function() {
  const User = mongoose.model('User');
  const user = await User.findById(this.user);
  
  if (user) {
    // Update user skills if they're empty or if parsed data is more comprehensive
    if (!user.skills || user.skills.length === 0 || this.skills.length > user.skills.length) {
      user.skills = this.skills;
    }
    
    // Update experience
    if (this.totalExperienceYears && (!user.experience || this.totalExperienceYears > user.experience)) {
      user.experience = this.totalExperienceYears;
    }
    
    // Update location if available
    if (this.location && this.location.city && !user.location) {
      user.location = `${this.location.city}, ${this.location.state || this.location.country}`;
    }
    
    await user.save();
  }
  
  return user;
};

module.exports = mongoose.model('ParsedResume', parsedResumeSchema);
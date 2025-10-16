const User = require('../models/User');
const ParsedResume = require('../models/ParsedResume');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/errorHandler');
const resumeParser = require('../services/resumeParser');
const logger = require('../config/logger');

// Upload and parse resume
const uploadResume = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a resume file', 400));
  }

  const user = req.user;
  const file = req.file;

  logger.info(`Resume upload started for user ${user._id}`, {
    userId: user._id,
    filename: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  try {
    // Step 1: Extract text from file
    logger.info('Extracting text from resume file...');
    const extractedText = await resumeParser.extractTextFromFile(
      file.buffer, 
      file.mimetype, 
      file.originalname
    );

    // Step 2: Parse with AI
    logger.info('Parsing resume with AI...');
    const parsedData = await resumeParser.parseResumeWithAI(extractedText);
    
    // Step 3: Store file in user record
    user.resumeFile = {
      filename: `${user._id}_${Date.now()}_${file.originalname}`,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      uploadDate: new Date(),
      data: file.buffer
    };
    
    await user.save();

    // Step 4: Store parsed data
    parsedData.user = user._id;
    parsedData.extractedText = extractedText;
    
    // Sanitize email - remove if invalid
    if (parsedData.email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(parsedData.email)) {
      logger.warn(`Invalid email detected: ${parsedData.email}, removing from parsed data`);
      delete parsedData.email;
    }
    
    // Sanitize URLs - remove if invalid
    const urlFields = ['linkedin', 'github', 'portfolio'];
    urlFields.forEach(field => {
      if (parsedData[field] && !parsedData[field].startsWith('http')) {
        logger.warn(`Invalid ${field} URL: ${parsedData[field]}, removing from parsed data`);
        delete parsedData[field];
      }
    });
    
    // Update or create parsed resume record
    const existingParsedResume = await ParsedResume.findOne({ user: user._id });
    
    let parsedResume;
    if (existingParsedResume) {
      // Update existing record
      Object.assign(existingParsedResume, parsedData);
      parsedResume = await existingParsedResume.save();
      logger.info('Updated existing parsed resume record');
    } else {
      // Create new record
      parsedResume = new ParsedResume(parsedData);
      await parsedResume.save();
      logger.info('Created new parsed resume record');
    }

    // Step 5: Update user profile with parsed data
    try {
      await parsedResume.updateUserProfile();
      logger.info('Updated user profile with parsed data');
    } catch (profileError) {
      logger.warn('Failed to update user profile:', profileError);
    }

    // Step 6: Return response (exclude binary data and raw text)
    const responseData = parsedResume.toObject();
    delete responseData.extractedText; // Remove raw text from response
    
    logger.info(`Resume parsing completed successfully for user ${user._id}`, {
      userId: user._id,
      skillsCount: parsedData.skills ? parsedData.skills.length : 0,
      experienceYears: parsedData.totalExperienceYears,
      parsingModel: parsedData.parsingModel,
      parsingConfidence: parsedData.parsingConfidence
    });

    res.status(200).json({
      success: true,
      message: 'Resume uploaded and parsed successfully',
      data: {
        parsedResume: responseData,
        uploadInfo: {
          filename: file.originalname,
          size: file.size,
          uploadDate: user.resumeFile.uploadDate
        },
        parsingStats: {
          model: parsedData.parsingModel,
          confidence: parsedData.parsingConfidence,
          skillsExtracted: parsedData.skills ? parsedData.skills.length : 0,
          experienceEntries: parsedData.experience ? parsedData.experience.length : 0,
          educationEntries: parsedData.education ? parsedData.education.length : 0,
          projectsExtracted: parsedData.projects ? parsedData.projects.length : 0
        }
      }
    });

  } catch (error) {
    logger.error(`Resume parsing failed for user ${user._id}:`, error);
    
    // Save the file even if parsing fails
    try {
      user.resumeFile = {
        filename: `${user._id}_${Date.now()}_${file.originalname}`,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        uploadDate: new Date(),
        data: file.buffer
      };
      await user.save();
    } catch (saveError) {
      logger.error('Failed to save resume file after parsing error:', saveError);
    }
    
    return next(new AppError(
      `Resume upload successful, but parsing failed: ${error.message}. You can try uploading again.`,
      422
    ));
  }
});

// Get parsed resume data
const getParsedResume = asyncHandler(async (req, res, next) => {
  const parsedResume = await ParsedResume.findOne({ user: req.user._id });
  
  if (!parsedResume) {
    return next(new AppError('No parsed resume found. Please upload a resume first.', 404));
  }

  // Remove sensitive/large data from response
  const responseData = parsedResume.toObject();
  delete responseData.extractedText;

  res.json({
    success: true,
    data: {
      parsedResume: responseData,
      lastUpdated: parsedResume.updatedAt
    }
  });
});

// Download original resume file
const downloadResume = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  
  if (!user.resumeFile || !user.resumeFile.data) {
    return next(new AppError('No resume file found', 404));
  }

  const file = user.resumeFile;
  
  // Set appropriate headers
  res.set({
    'Content-Type': file.mimetype,
    'Content-Length': file.size,
    'Content-Disposition': `attachment; filename="${file.originalname}"`
  });

  // Log download
  logger.info(`Resume download for user ${user._id}`, {
    userId: user._id,
    filename: file.originalname,
    size: file.size
  });

  res.send(file.data);
});

// Delete resume and parsed data
const deleteResume = asyncHandler(async (req, res, next) => {
  const user = req.user;

  // Remove file from user record
  user.resumeFile = undefined;
  await user.save();

  // Remove parsed resume data
  await ParsedResume.findOneAndDelete({ user: user._id });

  logger.info(`Resume deleted for user ${user._id}`, {
    userId: user._id
  });

  res.json({
    success: true,
    message: 'Resume and parsed data deleted successfully'
  });
});

// Get resume parsing statistics
const getParsingStats = asyncHandler(async (req, res) => {
  const parsedResume = await ParsedResume.findOne({ user: req.user._id });
  
  if (!parsedResume) {
    return res.json({
      success: true,
      data: {
        hasResume: false,
        stats: null
      }
    });
  }

  const stats = {
    hasResume: true,
    parsingModel: parsedResume.parsingModel,
    parsingConfidence: parsedResume.parsingConfidence,
    parsingDate: parsedResume.updatedAt,
    extractedData: {
      skillsCount: parsedResume.skills ? parsedResume.skills.length : 0,
      experienceEntries: parsedResume.experience ? parsedResume.experience.length : 0,
      educationEntries: parsedResume.education ? parsedResume.education.length : 0,
      projectsCount: parsedResume.projects ? parsedResume.projects.length : 0,
      certificationsCount: parsedResume.certifications ? parsedResume.certifications.length : 0,
      languagesCount: parsedResume.languages ? parsedResume.languages.length : 0,
      totalExperienceYears: parsedResume.totalExperienceYears
    },
    completenessScore: calculateCompletenessScore(parsedResume),
    errors: parsedResume.parsingErrors || []
  };

  res.json({
    success: true,
    data: {
      stats
    }
  });
});

// Update parsed resume data manually
const updateParsedResume = asyncHandler(async (req, res, next) => {
  const allowedFields = [
    'name', 'email', 'phone', 'location', 'summary', 'skills', 
    'experience', 'education', 'projects', 'certifications',
    'languages', 'totalExperienceYears', 'currentRole', 
    'currentCompany', 'linkedin', 'github', 'portfolio'
  ];

  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  if (Object.keys(updates).length === 0) {
    return next(new AppError('No valid fields provided for update', 400));
  }

  const parsedResume = await ParsedResume.findOneAndUpdate(
    { user: req.user._id },
    updates,
    { 
      new: true, 
      runValidators: true,
      upsert: false
    }
  );

  if (!parsedResume) {
    return next(new AppError('No parsed resume found. Please upload a resume first.', 404));
  }

  logger.info(`Parsed resume updated for user ${req.user._id}`, {
    userId: req.user._id,
    updatedFields: Object.keys(updates)
  });

  // Remove sensitive data from response
  const responseData = parsedResume.toObject();
  delete responseData.extractedText;

  res.json({
    success: true,
    message: 'Parsed resume updated successfully',
    data: {
      parsedResume: responseData
    }
  });
});

// Reparse existing resume with latest AI model
const reparseResume = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  
  if (!user.resumeFile || !user.resumeFile.data) {
    return next(new AppError('No resume file found to reparse', 404));
  }

  const file = user.resumeFile;

  logger.info(`Resume reparsing started for user ${user._id}`, {
    userId: user._id,
    filename: file.originalname
  });

  try {
    // Extract text from stored file
    const extractedText = await resumeParser.extractTextFromFile(
      file.data,
      file.mimetype,
      file.originalname
    );

    // Parse with AI
    const parsedData = await resumeParser.parseResumeWithAI(extractedText);
    
    // Update parsed resume data
    parsedData.user = user._id;
    parsedData.extractedText = extractedText;
    
    const parsedResume = await ParsedResume.findOneAndUpdate(
      { user: user._id },
      parsedData,
      { 
        new: true, 
        runValidators: true,
        upsert: true
      }
    );

    // Update user profile
    try {
      await parsedResume.updateUserProfile();
    } catch (profileError) {
      logger.warn('Failed to update user profile during reparse:', profileError);
    }

    // Remove sensitive data from response
    const responseData = parsedResume.toObject();
    delete responseData.extractedText;

    logger.info(`Resume reparsing completed for user ${user._id}`, {
      userId: user._id,
      parsingModel: parsedData.parsingModel,
      skillsCount: parsedData.skills ? parsedData.skills.length : 0
    });

    res.json({
      success: true,
      message: 'Resume reparsed successfully',
      data: {
        parsedResume: responseData,
        parsingStats: {
          model: parsedData.parsingModel,
          confidence: parsedData.parsingConfidence,
          skillsExtracted: parsedData.skills ? parsedData.skills.length : 0
        }
      }
    });

  } catch (error) {
    logger.error(`Resume reparsing failed for user ${user._id}:`, error);
    return next(new AppError(`Resume reparsing failed: ${error.message}`, 422));
  }
});

// Helper function to calculate completeness score
const calculateCompletenessScore = (parsedResume) => {
  let score = 0;
  const maxScore = 100;

  // Basic info (40 points)
  if (parsedResume.name) score += 10;
  if (parsedResume.email) score += 10;
  if (parsedResume.phone) score += 10;
  if (parsedResume.summary) score += 10;

  // Experience (25 points)
  if (parsedResume.experience && parsedResume.experience.length > 0) score += 15;
  if (parsedResume.totalExperienceYears) score += 10;

  // Education (15 points)
  if (parsedResume.education && parsedResume.education.length > 0) score += 15;

  // Skills (10 points)
  if (parsedResume.skills && parsedResume.skills.length > 0) score += 10;

  // Optional info (10 points)
  if (parsedResume.projects && parsedResume.projects.length > 0) score += 3;
  if (parsedResume.certifications && parsedResume.certifications.length > 0) score += 3;
  if (parsedResume.linkedin) score += 2;
  if (parsedResume.github) score += 2;

  return Math.min(score, maxScore);
};

module.exports = {
  uploadResume,
  getParsedResume,
  downloadResume,
  deleteResume,
  getParsingStats,
  updateParsedResume,
  reparseResume
};
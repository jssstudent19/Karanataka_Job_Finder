const express = require('express');
const router = express.Router();
const multer = require('multer');
const resumeParser = require('../services/resumeParser');
const resumeAnalyzer = require('../services/resumeAnalyzer');
const { authenticateToken, requireJobSeeker } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

/**
 * @route   POST /api/resume-analyzer/analyze
 * @desc    Analyze resume - extract skills and provide improvement insights
 * @access  Private (Job Seekers only)
 */
router.post('/analyze', authenticateToken, requireJobSeeker, upload.single('resume'), asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a resume file', 400));
  }

  const { buffer, mimetype, originalname } = req.file;
  const User = require('../models/User');
  
  logger.info(`Starting resume analysis for user ${req.user._id}`, {
    filename: originalname,
    mimetype,
    size: buffer.length
  });

  try {
    // Step 1: Extract text from uploaded file
    const extractedText = await resumeParser.extractTextFromFile(buffer, mimetype, originalname);
    
    if (!extractedText || extractedText.trim().length === 0) {
      return next(new AppError('No text could be extracted from the resume', 400));
    }

    logger.info(`Text extracted: ${extractedText.length} characters`);

    // Step 2: Send to AI to extract all resume data
    const resumeData = await resumeAnalyzer.analyzeResume(extractedText);
    
    // Step 3: Store all data in database
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        'profile.name': resumeData.personalInfo?.name || req.user.profile?.name,
        'profile.email': resumeData.personalInfo?.email || req.user.email,
        'profile.phone': resumeData.personalInfo?.phone,
        'profile.location': resumeData.personalInfo?.location,
        'profile.skills': resumeData.skills || [],
        'profile.education': resumeData.education || [],
        'profile.experience': resumeData.experience || [],
        'profile.projects': resumeData.projects || [],
        'profile.achievements': resumeData.achievements || [],
        'profile.lastResumeAnalysis': new Date()
      }
    });
    
    logger.info('Resume data saved to database');

    // Step 4: Return results
    res.json({
      success: true,
      message: 'Resume analyzed and saved successfully',
      data: resumeData
    });

  } catch (error) {
    logger.error(`Resume analysis failed for user ${req.user._id}:`, error);
    return next(new AppError(error.message || 'Failed to analyze resume', 500));
  }
}));

/**
 * @route   POST /api/resume-analyzer/skills-only
 * @desc    Extract skills from resume text only
 * @access  Private (Job Seekers only)
 */
router.post('/skills-only', authenticateToken, requireJobSeeker, upload.single('resume'), asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a resume file', 400));
  }

  const { buffer, mimetype, originalname } = req.file;

  try {
    // Extract text from file
    const extractedText = await resumeParser.extractTextFromFile(buffer, mimetype, originalname);
    
    if (!extractedText || extractedText.trim().length === 0) {
      return next(new AppError('No text could be extracted from the resume', 400));
    }

    // Extract skills only
    const skills = await resumeAnalyzer.extractSkills(extractedText);

    res.json({
      success: true,
      message: 'Skills extracted successfully',
      data: {
        filename: originalname,
        skills: skills,
        totalSkills: Object.values(skills).flat().length
      }
    });

  } catch (error) {
    logger.error(`Skills extraction failed:`, error);
    return next(new AppError(error.message || 'Failed to extract skills', 500));
  }
}));

/**
 * @route   POST /api/resume-analyzer/insights-only
 * @desc    Get improvement insights for resume
 * @access  Private (Job Seekers only)
 */
router.post('/insights-only', authenticateToken, requireJobSeeker, upload.single('resume'), asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a resume file', 400));
  }

  const { buffer, mimetype, originalname } = req.file;

  try {
    // Extract text from file
    const extractedText = await resumeParser.extractTextFromFile(buffer, mimetype, originalname);
    
    if (!extractedText || extractedText.trim().length === 0) {
      return next(new AppError('No text could be extracted from the resume', 400));
    }

    // Generate insights only
    const insights = await resumeAnalyzer.generateImprovementInsights(extractedText);

    res.json({
      success: true,
      message: 'Improvement insights generated successfully',
      data: {
        filename: originalname,
        insights: insights
      }
    });

  } catch (error) {
    logger.error(`Insights generation failed:`, error);
    return next(new AppError(error.message || 'Failed to generate insights', 500));
  }
}));

/**
 * @route   GET /api/resume-analyzer/info
 * @desc    Get resume analyzer service info
 * @access  Public
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    service: 'Resume Analyzer',
    version: '1.0.0',
    description: 'AI-powered resume analysis service that extracts skills and provides improvement insights',
    features: [
      'Skills extraction (technical, soft skills, tools)',
      'Comprehensive improvement insights',
      'ATS compatibility analysis',
      'Resume scoring and feedback',
      'Actionable suggestions with examples'
    ],
    supportedFormats: [
      'PDF (.pdf)',
      'Microsoft Word (.doc, .docx)', 
      'Plain Text (.txt)'
    ],
    endpoints: {
      analyze: 'POST /api/resume-analyzer/analyze - Full analysis',
      skillsOnly: 'POST /api/resume-analyzer/skills-only - Skills extraction only',
      insightsOnly: 'POST /api/resume-analyzer/insights-only - Improvement insights only'
    },
    maxFileSize: '5MB'
  });
});

module.exports = router;

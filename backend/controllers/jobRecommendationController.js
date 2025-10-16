/**
 * Job Recommendation Controller
 * Main controller for AI-powered job recommendations
 */

const geminiJobSearchService = require('../services/geminiJobSearchService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `resume-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
    }
  }
});

/**
 * Extract text from uploaded resume file
 * @param {Object} file - Multer file object
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromFile(file) {
  const filePath = file.path;
  let resumeText = '';

  try {
    if (file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      resumeText = data.text;
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: filePath });
      resumeText = result.value;
    } else if (file.mimetype === 'application/msword') {
      // Basic DOC support (limited)
      resumeText = fs.readFileSync(filePath, 'utf8');
    } else if (file.mimetype === 'text/plain') {
      resumeText = fs.readFileSync(filePath, 'utf8');
    }

    // Clean up the file after extraction
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup uploaded file:', cleanupError.message);
    }

    return resumeText.trim();
    
  } catch (error) {
    // Clean up file even if extraction fails
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup uploaded file:', cleanupError.message);
    }
    throw error;
  }
}

/**
 * Main endpoint for AI job recommendations
 * POST /api/job-recommendations/analyze
 */
const analyzeJobRecommendations = async (req, res) => {
  console.log('\n🚀 Job Recommendation Request Received');
  const startTime = Date.now();

  try {
    // Extract parameters from request
    const {
      city,
      job_position,
      years_of_experience
    } = req.body;

    // Validate required fields
    if (!city || !job_position || years_of_experience === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: city, job_position, years_of_experience',
        required: ['city', 'job_position', 'years_of_experience']
      });
    }

    // Extract resume text
    let resumeText = '';
    
    if (req.file) {
      console.log('📄 Processing uploaded resume:', req.file.originalname);
      resumeText = await extractTextFromFile(req.file);
      
      if (!resumeText || resumeText.length < 100) {
        return res.status(400).json({
          success: false,
          message: 'Failed to extract meaningful text from resume file. Please check the file format.',
        });
      }
      
      console.log(`✅ Extracted ${resumeText.length} characters from resume`);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Resume file is required',
      });
    }

    // Prepare parameters for AI service
    const params = {
      city,
      job_position,
      years_of_experience,
      resumeText
    };

    console.log('📋 Request parameters:', {
      city: params.city,
      job_position: params.job_position,
      years_of_experience: params.years_of_experience,
      resumeTextLength: params.resumeText.length
    });

    // Get AI-powered job recommendations using Gemini
    const result = await geminiJobSearchService.searchJobs(params);

    const totalTime = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`✅ Job recommendation request completed in ${totalTime}s`);

    res.status(200).json({
      success: result.success,
      processingTime: `${totalTime}s`,
      userProfile: result.userProfile,
      recommendations: result.recommendations || [],
      stats: result.stats || {},
      error: result.error,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    
    console.error('❌ Job recommendation request failed:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Job recommendation analysis failed',
      error: error.message,
      processingTime: `${totalTime}s`,
      recommendations: [],
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Health check for job recommendation service
 * GET /api/job-recommendations/health
 */
const healthCheck = async (req, res) => {
  try {
    const config = {
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      apifyConfigured: !!process.env.APIFY_API_TOKEN,
      supportedFileTypes: ['PDF', 'DOCX', 'DOC', 'TXT'],
      maxFileSize: '10MB',
      endpoints: [
        'POST /api/job-recommendations/analyze'
      ]
    };

    res.status(200).json({
      success: true,
      message: 'AI Job Recommendation Service is ready',
      config,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  analyzeJobRecommendations: [upload.single('resume'), analyzeJobRecommendations],
  healthCheck
};

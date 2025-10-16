const express = require('express');
const router = express.Router();
const multer = require('multer');
const resumeParser = require('../services/resumeParser');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
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
 * @route   POST /api/test-pdf/extract-text
 * @desc    Test PDF text extraction
 * @access  Private
 */
router.post('/extract-text', authenticateToken, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const { buffer, mimetype, originalname } = req.file;
  
  logger.info(`Testing text extraction for file: ${originalname}`, {
    mimetype,
    size: buffer.length,
    userId: req.user._id
  });

  try {
    // Extract text using our resume parser
    const extractedText = await resumeParser.extractTextFromFile(buffer, mimetype, originalname);
    
    logger.info(`Text extraction successful for ${originalname}`, {
      extractedLength: extractedText.length,
      preview: extractedText.substring(0, 200)
    });

    res.json({
      success: true,
      data: {
        filename: originalname,
        mimetype: mimetype,
        fileSize: buffer.length,
        extractedTextLength: extractedText.length,
        extractedText: extractedText,
        preview: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : '')
      }
    });

  } catch (error) {
    logger.error(`Text extraction failed for ${originalname}:`, error);
    
    res.status(500).json({
      success: false,
      message: `Failed to extract text: ${error.message}`,
      details: {
        filename: originalname,
        mimetype: mimetype,
        fileSize: buffer.length
      }
    });
  }
}));

/**
 * @route   GET /api/test-pdf/info
 * @desc    Get PDF parser info
 * @access  Public
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    message: 'PDF Text Extraction Test Endpoint',
    supportedFormats: [
      'application/pdf (.pdf)',
      'application/msword (.doc)', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document (.docx)',
      'text/plain (.txt)'
    ],
    maxFileSize: '5MB',
    usage: 'POST /api/test-pdf/extract-text with file in form-data'
  });
});

module.exports = router;

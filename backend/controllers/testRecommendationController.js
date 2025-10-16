/**
 * Test Recommendation Controller
 * Controller for testing the job recommendation system
 */

const jobRecommendationService = require('../services/jobRecommendationService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'test-uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `test-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
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
 * Test with sample resume text
 */
const testWithSampleResume = async (req, res) => {
  try {
    const { desiredRole } = req.body;
    
    // Sample resume text for testing
    const sampleResumeText = `
John Smith
Software Engineer
Email: john.smith@email.com | Phone: +91-9876543210
Location: Bangalore, Karnataka

PROFESSIONAL SUMMARY
Experienced Software Engineer with 4 years of experience in full-stack web development. 
Proficient in JavaScript, React, Node.js, and cloud technologies. Seeking challenging 
opportunities in software development.

WORK EXPERIENCE

Senior Software Developer | Tech Solutions Pvt Ltd | Bangalore | 2021 - Present
• Developed and maintained web applications using React, Node.js, and MongoDB
• Led a team of 3 junior developers on multiple projects
• Implemented microservices architecture reducing system latency by 30%
• Experience with AWS cloud services and Docker containerization

Software Developer | StartupCorp | Bangalore | 2020 - 2021  
• Built responsive web applications using JavaScript, HTML, CSS
• Collaborated with cross-functional teams in agile environment
• Integrated third-party APIs and payment gateways
• Participated in code reviews and testing processes

TECHNICAL SKILLS
• Programming Languages: JavaScript, Python, Java, TypeScript
• Frontend: React, Vue.js, HTML5, CSS3, Bootstrap
• Backend: Node.js, Express.js, Python Flask
• Databases: MongoDB, MySQL, PostgreSQL
• Cloud & DevOps: AWS, Docker, Kubernetes, Git
• Other: RESTful APIs, GraphQL, Jest, Agile/Scrum

EDUCATION
Bachelor of Technology in Computer Science
Visvesvaraya Technological University, Karnataka | 2016 - 2020
CGPA: 8.2/10

PROJECTS
E-commerce Platform | React, Node.js, MongoDB
• Developed full-stack e-commerce application with payment integration
• Implemented user authentication, product catalog, and order management

Task Management System | Vue.js, Python Flask
• Built collaborative task management tool for teams
• Features include real-time updates, file sharing, and progress tracking
    `;

    console.log('\n🧪 Testing with sample resume...');
    
    const recommendations = await jobRecommendationService.getRecommendations(
      sampleResumeText,
      desiredRole || 'Software Engineer'
    );

    res.status(200).json({
      success: true,
      testType: 'sample-resume',
      data: recommendations
    });

  } catch (error) {
    console.error('Error in sample resume test:', error.message);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
};

/**
 * Test with uploaded resume file
 */
const testWithUploadedResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No resume file uploaded'
      });
    }

    const { desiredRole } = req.body;
    const filePath = req.file.path;

    console.log('\n📄 Processing uploaded resume:', req.file.originalname);

    // Extract text from file based on type
    let resumeText = '';
    
    try {
      if (req.file.mimetype === 'application/pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        resumeText = data.text;
      } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ path: filePath });
        resumeText = result.value;
      } else if (req.file.mimetype === 'application/msword') {
        // Basic DOC support (limited)
        resumeText = fs.readFileSync(filePath, 'utf8');
      } else if (req.file.mimetype === 'text/plain') {
        resumeText = fs.readFileSync(filePath, 'utf8');
      } else {
        throw new Error('Unsupported file type');
      }
    } catch (parseError) {
      console.error('File parsing error:', parseError.message);
      return res.status(400).json({
        success: false,
        message: 'Failed to extract text from resume file',
        error: parseError.message
      });
    }

    // Validate extracted text
    const validation = jobRecommendationService.validateResumeText(resumeText);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Resume validation failed',
        error: validation.error
      });
    }

    console.log(`✅ Extracted ${resumeText.length} characters from resume`);

    // Get recommendations
    const recommendations = await jobRecommendationService.getRecommendations(
      resumeText,
      desiredRole || ''
    );

    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup uploaded file:', cleanupError.message);
    }

    res.status(200).json({
      success: true,
      testType: 'uploaded-resume',
      fileName: req.file.originalname,
      extractedTextLength: resumeText.length,
      data: recommendations
    });

  } catch (error) {
    console.error('Error in uploaded resume test:', error.message);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
};

/**
 * Get test status and configuration
 */
const getTestStatus = async (req, res) => {
  try {
    const config = {
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      apifyConfigured: !!process.env.APIFY_API_TOKEN,
      supportedFileTypes: ['PDF', 'DOCX', 'DOC', 'TXT'],
      maxFileSize: '5MB',
      testEndpoints: [
        'POST /api/test-recommendations/sample',
        'POST /api/test-recommendations/upload'
      ]
    };

    res.status(200).json({
      success: true,
      message: 'Job recommendation test system ready',
      config,
      timestamp: new Date()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get test status',
      error: error.message
    });
  }
};

/**
 * Quick test with minimal resume data
 */
const quickTest = async (req, res) => {
  try {
    const { role, experience, skills } = req.body;

    const quickResumeText = `
Professional Summary: ${experience || 'Mid-level'} ${role || 'Software Engineer'} with experience in ${skills || 'JavaScript, React, Node.js'}.

Experience:
- ${experience || 'Mid-level'} professional with 3-5 years experience
- Skills: ${skills || 'JavaScript, React, Node.js, MongoDB, AWS'}
- Education: Computer Science degree
- Location: Karnataka, India
    `;

    const summary = await jobRecommendationService.getQuickSummary(
      quickResumeText,
      role || 'Software Engineer'
    );

    res.status(200).json({
      success: true,
      testType: 'quick-test',
      input: { role, experience, skills },
      data: summary
    });

  } catch (error) {
    console.error('Error in quick test:', error.message);
    res.status(500).json({
      success: false,
      message: 'Quick test failed',
      error: error.message
    });
  }
};

module.exports = {
  testWithSampleResume,
  testWithUploadedResume: [upload.single('resume'), testWithUploadedResume],
  getTestStatus,
  quickTest
};
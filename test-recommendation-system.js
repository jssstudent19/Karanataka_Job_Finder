/**
 * Test Script for Job Recommendation System
 * Run this script to test the complete workflow without starting the full server
 */

require('dotenv').config();
const mongoose = require('mongoose');
const geminiResumeParser = require('./backend/services/geminiResumeParser');
const apifyActorTrigger = require('./backend/services/apifyActorTrigger');
const jobRecommendationService = require('./backend/services/jobRecommendationService');

// Sample resume text for testing
const SAMPLE_RESUME = `
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

async function testSystem() {
  console.log('🧪 Starting Job Recommendation System Test...\n');

  // Check configuration
  console.log('📋 Configuration Check:');
  console.log(`- Gemini API Key: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`- Apify API Token: ${process.env.APIFY_API_TOKEN ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`- MongoDB URI: ${process.env.MONGODB_URI ? '✅ Configured' : '❌ Not configured'}`);
  console.log('');

  // Connect to database
  if (process.env.MONGODB_URI) {
    try {
      console.log('🔌 Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB\n');
    } catch (error) {
      console.log('❌ Failed to connect to MongoDB:', error.message);
      console.log('⚠️  Continuing without database connection...\n');
    }
  }

  try {
    // Test 1: Resume Parsing
    console.log('1️⃣ Testing Resume Parsing...');
    const startTime = Date.now();
    
    const jobPreferences = await geminiResumeParser.parseResume(
      SAMPLE_RESUME, 
      'Senior Software Engineer'
    );
    
    const parseTime = Date.now() - startTime;
    console.log(`✅ Resume parsing completed in ${parseTime}ms`);
    console.log('📊 Extracted preferences:', {
      role: jobPreferences.role,
      experience: jobPreferences.experience,
      skills: jobPreferences.skills.slice(0, 3),
      experienceYears: jobPreferences.experienceYears
    });
    console.log('');

    // Test 2: Job Recommendations
    console.log('2️⃣ Testing Job Recommendations (with mock data)...');
    const recStartTime = Date.now();
    
    const recommendations = await apifyActorTrigger.getJobRecommendations(jobPreferences);
    
    const recTime = Date.now() - recStartTime;
    console.log(`✅ Job recommendations completed in ${recTime}ms`);
    console.log(`📊 Found ${recommendations.length} job recommendations`);
    
    if (recommendations.length > 0) {
      console.log('\n🎯 Top 3 Recommendations:');
      recommendations.slice(0, 3).forEach((job, index) => {
        console.log(`${index + 1}. ${job.title} at ${job.company}`);
        console.log(`   📍 ${job.location} | ⭐ ${job.relevanceScore}% match`);
        console.log(`   🏷️  ${job.matchReasons.join(', ')}`);
      });
    }
    console.log('');

    // Test 3: Full Recommendation Service
    console.log('3️⃣ Testing Full Recommendation Service...');
    const fullStartTime = Date.now();
    
    const fullResults = await jobRecommendationService.getRecommendations(
      SAMPLE_RESUME, 
      'Data Scientist'
    );
    
    const fullTime = Date.now() - fullStartTime;
    console.log(`✅ Full recommendation service completed in ${fullTime}ms`);
    console.log('📊 Full results summary:', {
      success: fullResults.success,
      extractedRole: fullResults.analysis?.extractedRole,
      jobCount: fullResults.recommendations.count,
      avgRelevance: fullResults.recommendations.averageRelevanceScore
    });
    console.log('');

    // Test 4: Quick Summary
    console.log('4️⃣ Testing Quick Summary...');
    const summary = await jobRecommendationService.getQuickSummary(
      SAMPLE_RESUME, 
      'Machine Learning Engineer'
    );
    
    console.log('✅ Quick summary generated');
    console.log('📊 Summary:', {
      success: summary.success,
      role: summary.role,
      experience: summary.experience,
      jobCount: summary.jobCount,
      avgMatch: summary.averageMatch,
      topJobsCount: summary.topJobs.length
    });
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Start your backend server: cd backend && npm start');
    console.log('2. Open test-recommendation-page.html in your browser');
    console.log('3. Add your Gemini and Apify API keys to .env file for full functionality');
    console.log('4. Upload a real resume and test the live system');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB');
    }
    
    console.log('\n✅ Test completed');
  }
}

// Run the test
testSystem();
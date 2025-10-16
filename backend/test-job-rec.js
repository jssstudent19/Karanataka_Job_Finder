const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

async function testJobRecommendations() {
  console.log('🧪 Testing Job Recommendations API...');
  
  try {
    // Create a simple test PDF content (you can replace this with an actual PDF file path)
    const testResumeContent = `
John Doe
Software Engineer

EXPERIENCE:
- 5 years of experience in web development
- Proficient in JavaScript, React, Node.js
- Experience with MongoDB, Express.js
- Worked on full-stack applications

SKILLS:
- JavaScript
- React
- Node.js
- HTML
- CSS
- MongoDB
- Express.js
- Git
- Problem Solving
- Communication

EDUCATION:
Bachelor of Computer Science
`;

    // Create a temporary text file (since we don't have a real PDF)
    const tempFilePath = path.join(__dirname, 'temp-resume.txt');
    fs.writeFileSync(tempFilePath, testResumeContent);

    // Create FormData
    const formData = new FormData();
    formData.append('city', 'Bengaluru');
    formData.append('job_position', 'Software Engineer');
    formData.append('years_of_experience', '5');
    formData.append('resume', fs.createReadStream(tempFilePath));

    console.log('📤 Sending request to job recommendations API...');
    
    // Make the request
    const response = await axios.post('http://localhost:5000/api/job-recommendations/analyze', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 120000 // 2 minutes timeout
    });

    console.log('✅ Response received!');
    console.log('📊 Status:', response.status);
    console.log('📄 Data:', JSON.stringify(response.data, null, 2));

    // Clean up
    fs.unlinkSync(tempFilePath);
    console.log('🧹 Temporary file cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📄 Error response:', error.response.data);
      console.error('📊 Error status:', error.response.status);
    }
    
    // Clean up on error
    const tempFilePath = path.join(__dirname, 'temp-resume.txt');
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log('🧹 Temporary file cleaned up');
    }
  }
}

// Run the test
testJobRecommendations();
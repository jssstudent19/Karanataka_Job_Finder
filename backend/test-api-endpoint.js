const axios = require('axios');

async function testAPI() {
  console.log('🧪 Testing API Endpoints\n');
  console.log('='.repeat(60));
  
  const baseURL = 'http://localhost:5000/api';
  
  try {
    // Test 1: Get all jobs (no filter)
    console.log('\n📊 Test 1: GET /jobs (no filters)');
    const response1 = await axios.get(`${baseURL}/jobs`);
    console.log(`Status: ${response1.status}`);
    console.log(`Total Jobs: ${response1.data.data.pagination.totalJobs}`);
    console.log(`Jobs Returned: ${response1.data.data.jobs.length}`);
    console.log('');
    
    // Test 2: Filter by workMode=hybrid
    console.log('📊 Test 2: GET /jobs?workMode=hybrid');
    const response2 = await axios.get(`${baseURL}/jobs`, {
      params: { workMode: 'hybrid' }
    });
    console.log(`Status: ${response2.status}`);
    console.log(`Total Jobs: ${response2.data.data.pagination.totalJobs}`);
    console.log(`Jobs Returned: ${response2.data.data.jobs.length}`);
    console.log(`Sample job workModes: [${response2.data.data.jobs.slice(0, 5).map(j => j.workMode).join(', ')}]`);
    console.log('');
    
    // Test 3: Filter by jobType=full-time
    console.log('📊 Test 3: GET /jobs?jobType=full-time');
    const response3 = await axios.get(`${baseURL}/jobs`, {
      params: { jobType: 'full-time' }
    });
    console.log(`Status: ${response3.status}`);
    console.log(`Total Jobs: ${response3.data.data.pagination.totalJobs}`);
    console.log(`Jobs Returned: ${response3.data.data.jobs.length}`);
    console.log(`Sample job types: [${response3.data.data.jobs.slice(0, 5).map(j => j.jobType).join(', ')}]`);
    console.log('');
    
    // Test 4: Filter by jobType=internship
    console.log('📊 Test 4: GET /jobs?jobType=internship');
    const response4 = await axios.get(`${baseURL}/jobs`, {
      params: { jobType: 'internship' }
    });
    console.log(`Status: ${response4.status}`);
    console.log(`Total Jobs: ${response4.data.data.pagination.totalJobs}`);
    console.log(`Jobs Returned: ${response4.data.data.jobs.length}`);
    console.log(`Sample job types: [${response4.data.data.jobs.slice(0, 5).map(j => j.jobType).join(', ')}]`);
    console.log('');
    
    // Test 5: Combined filter
    console.log('📊 Test 5: GET /jobs?workMode=hybrid&jobType=full-time');
    const response5 = await axios.get(`${baseURL}/jobs`, {
      params: { workMode: 'hybrid', jobType: 'full-time' }
    });
    console.log(`Status: ${response5.status}`);
    console.log(`Total Jobs: ${response5.data.data.pagination.totalJobs}`);
    console.log(`Jobs Returned: ${response5.data.data.jobs.length}`);
    console.log(`Sample jobs:`, response5.data.data.jobs.slice(0, 3).map(j => ({
      title: j.title,
      jobType: j.jobType,
      workMode: j.workMode
    })));
    console.log('');
    
    console.log('='.repeat(60));
    console.log('\n✅ API Tests Complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Backend server is not running!');
      console.error('Please start the backend server first: npm run dev');
    }
  }
}

testAPI();

const axios = require('axios');

async function triggerFetch() {
  try {
    console.log('🚀 Triggering job fetch via API...\n');
    
    const response = await axios.post(
      'http://localhost:5000/api/external-jobs/admin/scrape',
      {
        location: 'Karnataka,India',
        limitPerSource: 200,
        sources: ['jsearch', 'adzuna', 'careerjet']
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'YOUR_ADMIN_TOKEN'}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    console.log('\n✅ Job aggregation has been triggered!');
    console.log('This will run in the background. Check the backend logs for progress.');
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.error('\n❌ Authentication failed!');
      console.error('You need admin privileges to trigger job aggregation.');
      console.error('Please login as an admin and use the API endpoint from the frontend.');
    } else {
      console.error('\n❌ Error:', error.message);
      if (error.response) {
        console.error('Response:', error.response.data);
      }
    }
  }
}

triggerFetch();

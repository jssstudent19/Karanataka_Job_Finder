const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/karnataka_job_portal', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Job = require('./src/models/Job');
const ExternalJob = require('./src/models/ExternalJob');

// Helper function to build filter (same logic as controller)
function buildFilter(params) {
  const filter = { status: 'active' };
  
  if (params.search) {
    const keywords = params.search.trim().split(/\s+/).filter(k => k.length > 0);
    if (keywords.length === 1) {
      filter.title = { $regex: keywords[0], $options: 'i' };
    } else {
      filter.$and = keywords.map(keyword => ({
        title: { $regex: keyword, $options: 'i' }
      }));
    }
  }
  
  if (params.jobType) {
    const normalizedType = params.jobType.toLowerCase().replace(/[-–\s]/g, '');
    const pattern = normalizedType.split('').join('[-–\\s]?');
    filter.jobType = { $regex: pattern, $options: 'i' };
  }
  
  if (params.workMode) {
    const normalizedMode = params.workMode.toLowerCase().replace(/[-–\s]/g, '');
    const pattern = normalizedMode.split('').join('[-–\\s]?');
    filter.workMode = { $regex: pattern, $options: 'i' };
  }
  
  return filter;
}

async function testAllFilters() {
  console.log('🧪 COMPREHENSIVE FILTER TESTING\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Work Mode Filters
    console.log('\n📊 TEST 1: WORK MODE FILTERS\n');
    
    const workModes = ['onsite', 'remote', 'hybrid'];
    
    for (const mode of workModes) {
      const internalFilter = buildFilter({ workMode: mode });
      const externalFilter = buildFilter({ workMode: mode });
      
      const internalCount = await Job.countDocuments(internalFilter);
      const externalCount = await ExternalJob.countDocuments(externalFilter);
      const totalCount = internalCount + externalCount;
      
      // Also fetch actual jobs to verify
      const internalJobs = await Job.find(internalFilter).limit(5);
      const externalJobs = await ExternalJob.find(externalFilter).limit(5);
      
      console.log(`${mode.toUpperCase()}:`);
      console.log(`  Internal: ${internalCount} jobs`);
      console.log(`  External: ${externalCount} jobs`);
      console.log(`  TOTAL: ${totalCount} jobs`);
      console.log(`  Sample internal values: [${internalJobs.map(j => `"${j.workMode}"`).join(', ')}]`);
      console.log(`  Sample external values: [${externalJobs.map(j => `"${j.workMode}"`).join(', ')}]`);
      console.log('');
    }
    
    // Test 2: Job Type Filters
    console.log('='.repeat(60));
    console.log('\n📊 TEST 2: JOB TYPE FILTERS\n');
    
    const jobTypes = ['full-time', 'part-time', 'contract', 'internship', 'freelance'];
    
    for (const type of jobTypes) {
      const internalFilter = buildFilter({ jobType: type });
      const externalFilter = buildFilter({ jobType: type });
      
      const internalCount = await Job.countDocuments(internalFilter);
      const externalCount = await ExternalJob.countDocuments(externalFilter);
      const totalCount = internalCount + externalCount;
      
      // Fetch samples
      const internalJobs = await Job.find(internalFilter).limit(3);
      const externalJobs = await ExternalJob.find(externalFilter).limit(3);
      
      console.log(`${type.toUpperCase()}:`);
      console.log(`  Internal: ${internalCount} jobs`);
      console.log(`  External: ${externalCount} jobs`);
      console.log(`  TOTAL: ${totalCount} jobs`);
      console.log(`  Sample internal values: [${internalJobs.map(j => `"${j.jobType}"`).join(', ')}]`);
      console.log(`  Sample external values: [${externalJobs.map(j => `"${j.jobType}"`).join(', ')}]`);
      console.log('');
    }
    
    // Test 3: Combined Filters
    console.log('='.repeat(60));
    console.log('\n📊 TEST 3: COMBINED FILTERS\n');
    
    const combinations = [
      { workMode: 'hybrid', jobType: 'full-time' },
      { workMode: 'remote', jobType: 'full-time' },
      { workMode: 'onsite', jobType: 'internship' }
    ];
    
    for (const combo of combinations) {
      const internalFilter = buildFilter(combo);
      const externalFilter = buildFilter(combo);
      
      const internalCount = await Job.countDocuments(internalFilter);
      const externalCount = await ExternalJob.countDocuments(externalFilter);
      const totalCount = internalCount + externalCount;
      
      console.log(`${combo.workMode.toUpperCase()} + ${combo.jobType.toUpperCase()}:`);
      console.log(`  Internal: ${internalCount} jobs`);
      console.log(`  External: ${externalCount} jobs`);
      console.log(`  TOTAL: ${totalCount} jobs`);
      console.log('');
    }
    
    // Test 4: Verify regex patterns
    console.log('='.repeat(60));
    console.log('\n📊 TEST 4: REGEX PATTERN VERIFICATION\n');
    
    const testCases = [
      { input: 'onsite', shouldMatch: ['onsite', 'Onsite', 'On-site', 'ON-SITE'] },
      { input: 'full-time', shouldMatch: ['full-time', 'Full-time', 'Full–time', 'fulltime', 'FULL-TIME'] }
    ];
    
    for (const test of testCases) {
      const normalized = test.input.toLowerCase().replace(/[-–\s]/g, '');
      const pattern = normalized.split('').join('[-–\\s]?');
      const regex = new RegExp(pattern, 'i');
      
      console.log(`Input: "${test.input}"`);
      console.log(`Pattern: ${pattern}`);
      console.log(`Matches:`);
      test.shouldMatch.forEach(val => {
        const matches = regex.test(val);
        console.log(`  "${val}": ${matches ? '✅' : '❌'}`);
      });
      console.log('');
    }
    
    console.log('='.repeat(60));
    console.log('\n✅ ALL TESTS COMPLETED!\n');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
  }
}

testAllFilters();

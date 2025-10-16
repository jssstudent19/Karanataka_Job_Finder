const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/karnataka_job_portal', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Job = require('./src/models/Job');
const ExternalJob = require('./src/models/ExternalJob');

async function testFilters() {
  console.log('🔍 Testing Job Filters...\n');

  try {
    // Test 1: Check distinct jobType values in database
    console.log('📊 Test 1: Distinct jobType values');
    const internalJobTypes = await Job.distinct('jobType');
    const externalJobTypes = await ExternalJob.distinct('jobType');
    console.log('Internal Job Types:', internalJobTypes);
    console.log('External Job Types:', externalJobTypes.slice(0, 20)); // Show first 20
    console.log('');

    // Test 2: Check distinct workMode values
    console.log('📊 Test 2: Distinct workMode values');
    const internalWorkModes = await Job.distinct('workMode');
    const externalWorkModes = await ExternalJob.distinct('workMode');
    console.log('Internal Work Modes:', internalWorkModes);
    console.log('External Work Modes:', externalWorkModes.slice(0, 20)); // Show first 20
    console.log('');

    // Test 3: Count jobs by jobType
    console.log('📊 Test 3: Job counts by jobType');
    const internalJobTypeCounts = await Job.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$jobType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const externalJobTypeCounts = await ExternalJob.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$jobType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log('Internal Jobs by Type:', internalJobTypeCounts);
    console.log('External Jobs by Type (top 10):', externalJobTypeCounts.slice(0, 10));
    console.log('');

    // Test 4: Count jobs by workMode
    console.log('📊 Test 4: Job counts by workMode');
    const internalWorkModeCounts = await Job.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$workMode', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const externalWorkModeCounts = await ExternalJob.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$workMode', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log('Internal Jobs by Work Mode:', internalWorkModeCounts);
    console.log('External Jobs by Work Mode (top 10):', externalWorkModeCounts.slice(0, 10));
    console.log('');

    // Test 5: Test regex filter for "full-time"
    console.log('📊 Test 5: Testing "full-time" filter');
    const jobType = 'full-time';
    const normalizedType = jobType.toLowerCase().replace(/[-–\s]/g, '');
    const escapedType = normalizedType.split('').join('[-–\\s]?');
    console.log('Normalized:', normalizedType);
    console.log('Regex pattern:', escapedType);
    
    const internalFullTime = await Job.countDocuments({
      status: 'active',
      jobType: { $regex: escapedType, $options: 'i' }
    });
    const externalFullTime = await ExternalJob.countDocuments({
      status: 'active',
      jobType: { $regex: escapedType, $options: 'i' }
    });
    console.log(`Internal "full-time" jobs: ${internalFullTime}`);
    console.log(`External "full-time" jobs: ${externalFullTime}`);
    console.log(`Total: ${internalFullTime + externalFullTime}`);
    console.log('');

    // Test 6: Test regex filter for "remote"
    console.log('📊 Test 6: Testing "remote" filter');
    const workMode = 'remote';
    const normalizedMode = workMode.toLowerCase().replace(/[-–\s]/g, '');
    const escapedMode = normalizedMode.split('').join('[-–\\s]?');
    console.log('Normalized:', normalizedMode);
    console.log('Regex pattern:', escapedMode);
    
    const internalRemote = await Job.countDocuments({
      status: 'active',
      workMode: { $regex: escapedMode, $options: 'i' }
    });
    const externalRemote = await ExternalJob.countDocuments({
      status: 'active',
      workMode: { $regex: escapedMode, $options: 'i' }
    });
    console.log(`Internal "remote" jobs: ${internalRemote}`);
    console.log(`External "remote" jobs: ${externalRemote}`);
    console.log(`Total: ${internalRemote + externalRemote}`);
    console.log('');

    // Test 7: Test regex filter for "onsite"
    console.log('📊 Test 7: Testing "onsite" filter');
    const onsiteMode = 'onsite';
    const normalizedOnsite = onsiteMode.toLowerCase().replace(/[-–\s]/g, '');
    const escapedOnsite = normalizedOnsite.split('').join('[-–\\s]?');
    console.log('Normalized:', normalizedOnsite);
    console.log('Regex pattern:', escapedOnsite);
    
    const internalOnsite = await Job.countDocuments({
      status: 'active',
      workMode: { $regex: escapedOnsite, $options: 'i' }
    });
    const externalOnsite = await ExternalJob.countDocuments({
      status: 'active',
      workMode: { $regex: escapedOnsite, $options: 'i' }
    });
    console.log(`Internal "onsite" jobs: ${internalOnsite}`);
    console.log(`External "onsite" jobs: ${externalOnsite}`);
    console.log(`Total: ${internalOnsite + externalOnsite}`);
    console.log('');

    console.log('✅ Filter tests completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

testFilters();

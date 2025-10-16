const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Job = require('./src/models/Job');
const ExternalJob = require('./src/models/ExternalJob');

async function quickCheck() {
  try {
    console.log('=== ALL JOB TYPES IN DATABASE ===\n');
    
    // Get counts by jobType
    const externalTypes = await ExternalJob.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$jobType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('EXTERNAL JOBS BY TYPE:');
    let totalExternal = 0;
    externalTypes.forEach(item => {
      console.log(`  "${item._id}": ${item.count}`);
      totalExternal += item.count;
    });
    console.log(`  TOTAL EXTERNAL: ${totalExternal}\n`);
    
    const internalTypes = await Job.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$jobType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('INTERNAL JOBS BY TYPE:');
    let totalInternal = 0;
    internalTypes.forEach(item => {
      console.log(`  "${item._id}": ${item.count}`);
      totalInternal += item.count;
    });
    console.log(`  TOTAL INTERNAL: ${totalInternal}\n`);
    
    console.log(`GRAND TOTAL: ${totalInternal + totalExternal}\n`);
    
    // Test specific filters
    console.log('=== TESTING FILTERS ===\n');
    
    // Test "full-time" filter
    const ftNormalized = 'full-time'.toLowerCase().replace(/[-–\s]/g, '');
    const ftPattern = ftNormalized.split('').join('[-–\\s]?');
    console.log(`Full-time pattern: ${ftPattern}`);
    
    const ftInternal = await Job.countDocuments({
      status: 'active',
      jobType: { $regex: ftPattern, $options: 'i' }
    });
    const ftExternal = await ExternalJob.countDocuments({
      status: 'active',
      jobType: { $regex: ftPattern, $options: 'i' }
    });
    console.log(`Full-time: Internal=${ftInternal}, External=${ftExternal}, Total=${ftInternal + ftExternal}\n`);
    
    // Show what external values matched
    const ftSamples = await ExternalJob.find({
      status: 'active',
      jobType: { $regex: ftPattern, $options: 'i' }
    }).limit(10).select('jobType');
    console.log('External full-time samples:', ftSamples.map(j => j.jobType));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

quickCheck();

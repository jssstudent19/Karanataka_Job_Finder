const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Job = require('./src/models/Job');
const ExternalJob = require('./src/models/ExternalJob');

async function checkAllJobTypes() {
  try {
    console.log('=== CHECKING ALL JOB TYPES ===\n');
    
    const allJobTypes = await ExternalJob.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$jobType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('ALL JOB TYPES IN DATABASE:');
    allJobTypes.forEach(item => {
      console.log(`  "${item._id}": ${item.count} jobs`);
    });
    
    console.log('\n=== TESTING EACH FILTER ===\n');
    
    const filters = ['full-time', 'part-time', 'contract', 'freelance', 'internship'];
    
    for (const filter of filters) {
      const normalized = filter.toLowerCase().replace(/[-–\s]/g, '');
      const pattern = normalized.split('').join('[-–\\s]?');
      
      const count = await ExternalJob.countDocuments({
        status: 'active',
        jobType: { $regex: pattern, $options: 'i' }
      });
      
      console.log(`${filter}: ${count} jobs`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAllJobTypes();

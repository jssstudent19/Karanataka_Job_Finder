const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/karnataka_job_portal', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Job = require('./src/models/Job');
const ExternalJob = require('./src/models/ExternalJob');

async function analyzeJobTypes() {
  console.log('🔍 ANALYZING ALL JOB TYPES IN DATABASE\n');
  console.log('='.repeat(80));
  
  try {
    // Get all unique job types from both collections
    const internalJobTypes = await Job.distinct('jobType', { status: 'active' });
    const externalJobTypes = await ExternalJob.distinct('jobType', { status: 'active' });
    
    console.log('\n📊 INTERNAL JOBS - Job Types:');
    console.log('Total unique values:', internalJobTypes.length);
    console.log(internalJobTypes);
    
    console.log('\n📊 EXTERNAL JOBS - Job Types:');
    console.log('Total unique values:', externalJobTypes.length);
    console.log('All values:', externalJobTypes);
    
    // Count each job type
    console.log('\n' + '='.repeat(80));
    console.log('\n📈 DETAILED COUNT BY JOB TYPE:\n');
    
    // Internal jobs count
    console.log('INTERNAL JOBS:');
    const internalCounts = await Job.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$jobType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    internalCounts.forEach(item => {
      console.log(`  "${item._id}": ${item.count} jobs`);
    });
    
    console.log('\nEXTERNAL JOBS:');
    const externalCounts = await ExternalJob.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$jobType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    externalCounts.forEach(item => {
      console.log(`  "${item._id}": ${item.count} jobs`);
    });
    
    // Categorize job types
    console.log('\n' + '='.repeat(80));
    console.log('\n🏷️  CATEGORIZATION:\n');
    
    const categories = {
      'FULL-TIME': [],
      'PART-TIME': [],
      'CONTRACT': [],
      'INTERNSHIP': [],
      'FREELANCE': [],
      'OTHER': []
    };
    
    const allTypes = [...new Set([...internalJobTypes, ...externalJobTypes])];
    
    allTypes.forEach(type => {
      const normalized = type.toLowerCase().replace(/[-–\s]/g, '');
      
      if (normalized.includes('full') || normalized.includes('permanent')) {
        categories['FULL-TIME'].push(type);
      } else if (normalized.includes('part')) {
        categories['PART-TIME'].push(type);
      } else if (normalized.includes('contract') || normalized.includes('contractor')) {
        categories['CONTRACT'].push(type);
      } else if (normalized.includes('intern')) {
        categories['INTERNSHIP'].push(type);
      } else if (normalized.includes('freelance')) {
        categories['FREELANCE'].push(type);
      } else {
        categories['OTHER'].push(type);
      }
    });
    
    Object.keys(categories).forEach(category => {
      if (categories[category].length > 0) {
        console.log(`${category}:`);
        categories[category].forEach(type => {
          console.log(`  - "${type}"`);
        });
        console.log('');
      }
    });
    
    // Test regex patterns for each category
    console.log('='.repeat(80));
    console.log('\n🧪 TESTING REGEX PATTERNS:\n');
    
    const testFilters = [
      { name: 'full-time', input: 'full-time' },
      { name: 'part-time', input: 'part-time' },
      { name: 'contract', input: 'contract' },
      { name: 'internship', input: 'internship' },
      { name: 'freelance', input: 'freelance' }
    ];
    
    for (const test of testFilters) {
      const normalized = test.input.toLowerCase().replace(/[-–\s]/g, '');
      const pattern = normalized.split('').join('[-–\\s]?');
      
      console.log(`\nFilter: "${test.name}"`);
      console.log(`Pattern: ${pattern}`);
      
      const internalCount = await Job.countDocuments({
        status: 'active',
        jobType: { $regex: pattern, $options: 'i' }
      });
      
      const externalCount = await ExternalJob.countDocuments({
        status: 'active',
        jobType: { $regex: pattern, $options: 'i' }
      });
      
      // Get samples to verify what's being matched
      const internalSamples = await Job.find({
        status: 'active',
        jobType: { $regex: pattern, $options: 'i' }
      }).limit(3).select('jobType');
      
      const externalSamples = await ExternalJob.find({
        status: 'active',
        jobType: { $regex: pattern, $options: 'i' }
      }).limit(5).select('jobType');
      
      console.log(`  Internal: ${internalCount} jobs`);
      console.log(`    Samples: [${internalSamples.map(j => `"${j.jobType}"`).join(', ')}]`);
      console.log(`  External: ${externalCount} jobs`);
      console.log(`    Samples: [${externalSamples.map(j => `"${j.jobType}"`).join(', ')}]`);
      console.log(`  TOTAL: ${internalCount + externalCount} jobs`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ ANALYSIS COMPLETE!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
  }
}

analyzeJobTypes();

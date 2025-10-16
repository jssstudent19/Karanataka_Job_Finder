const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Job = require('./src/models/Job');
const ExternalJob = require('./src/models/ExternalJob');

async function checkFields() {
  try {
    console.log('=== CHECKING JOB TYPE AND WORK MODE VALUES ===\n');

    // Get sample internal jobs
    const sampleInternal = await Job.find({ status: 'active' }).limit(5).select('title jobType workMode');
    console.log('📋 Sample Internal Jobs:');
    sampleInternal.forEach((job, i) => {
      console.log(`${i + 1}. ${job.title}`);
      console.log(`   jobType: "${job.jobType}" (type: ${typeof job.jobType})`);
      console.log(`   workMode: "${job.workMode}" (type: ${typeof job.workMode})`);
    });

    // Get sample external jobs
    const sampleExternal = await ExternalJob.find({ status: 'active' }).limit(10).select('title jobType workMode');
    console.log('\n📋 Sample External Jobs:');
    sampleExternal.forEach((job, i) => {
      console.log(`${i + 1}. ${job.title}`);
      console.log(`   jobType: "${job.jobType}" (type: ${typeof job.jobType})`);
      console.log(`   workMode: "${job.workMode}" (type: ${typeof job.workMode})`);
    });

    // Get unique values
    console.log('\n=== UNIQUE VALUES ===\n');
    const uniqueInternalJobTypes = await Job.distinct('jobType', { status: 'active' });
    const uniqueExternalJobTypes = await ExternalJob.distinct('jobType', { status: 'active' });
    const uniqueInternalWorkModes = await Job.distinct('workMode', { status: 'active' });
    const uniqueExternalWorkModes = await ExternalJob.distinct('workMode', { status: 'active' });

    console.log('Internal jobType values:', uniqueInternalJobTypes);
    console.log('External jobType values (first 20):', uniqueExternalJobTypes.slice(0, 20));
    console.log('\nInternal workMode values:', uniqueInternalWorkModes);
    console.log('External workMode values (first 20):', uniqueExternalWorkModes.slice(0, 20));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkFields();

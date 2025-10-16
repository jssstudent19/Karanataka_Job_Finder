const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const ExternalJob = require('./src/models/ExternalJob');

async function inspectJob() {
  try {
    // Find a job with <br in description
    const job = await ExternalJob.findOne({
      description: { $regex: /<br/i }
    });

    if (!job) {
      console.log('No jobs with <br tags found');
      process.exit(0);
    }

    console.log('Job Title:', job.title);
    console.log('Company:', job.company);
    console.log('\n--- First 1000 chars of description ---');
    console.log(job.description.substring(0, 1000));
    console.log('\n--- Looking for <br tags ---');
    
    const brMatches = job.description.match(/<br[^>]*>/gi);
    if (brMatches) {
      console.log('Found <br tags:', brMatches.slice(0, 5));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

inspectJob();

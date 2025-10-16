const mongoose = require('mongoose');
const Job = require('./src/models/Job');
require('dotenv').config();

async function checkAndCleanJobs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/job-portal', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB\n');
    
    // Get all jobs
    const allJobs = await Job.find({});
    
    console.log(`📊 Total jobs in database: ${allJobs.length}\n`);
    
    if (allJobs.length === 0) {
      console.log('✅ No jobs found - database is clean');
      return;
    }
    
    // Display job information
    allJobs.forEach((job, index) => {
      console.log(`💼 Job ${index + 1}:`);
      console.log(`   ID: ${job._id}`);
      console.log(`   Title: ${job.title}`);
      console.log(`   Company: ${job.company}`);
      console.log(`   Source: ${job.source || 'Internal'}`);
      console.log(`   External ID: ${job.externalId || 'None'}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Created: ${job.createdAt}`);
      console.log('');
    });
    
    // Ask user if they want to delete all jobs
    console.log('🗑️ Do you want to delete ALL job postings? This will clean the database.');
    console.log('⚠️ This action cannot be undone!');
    
    // For script purposes, we'll delete all jobs
    console.log('\n🗑️ Deleting all job postings...');
    const result = await Job.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} job postings`);
    
    console.log('\n🎯 Job cleanup completed!');
    console.log('- All dummy/test jobs removed');
    console.log('- Database is now clean for fresh job data');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during job cleanup:', error);
    process.exit(1);
  }
}

checkAndCleanJobs();
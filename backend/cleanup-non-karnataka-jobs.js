const mongoose = require('mongoose');
require('dotenv').config();

// Import the ExternalJob model
const ExternalJob = require('./src/models/ExternalJob');

// Karnataka cities and keywords
const karnatakaKeywords = [
  'karnataka',
  'bangalore',
  'bengaluru',
  'mysore',
  'mysuru',
  'mangalore',
  'mangaluru',
  'hubli',
  'hubballi',
  'belgaum',
  'belagavi',
  'tumkur',
  'davangere',
  'bellary',
  'ballari',
  'bijapur',
  'vijayapura',
  'shimoga',
  'shivamogga',
  'gulbarga',
  'kalaburagi',
  'raichur',
  'bidar',
  'chitradurga',
  'kolar',
  'mandya',
  'hassan',
  'dharwad',
  'udupi'
];

// Foreign locations to reject
const rejectKeywords = [
  'germany',
  'berlin',
  'munich',
  'hamburg',
  'usa',
  'united states',
  'new york',
  'san francisco',
  'california',
  'texas',
  'uk',
  'united kingdom',
  'london',
  'manchester',
  'canada',
  'toronto',
  'vancouver',
  'australia',
  'sydney',
  'melbourne',
  'singapore',
  'dubai',
  'uae'
];

async function cleanupNonKarnatakaJobs() {
  try {
    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📊 Analyzing existing jobs...\n');
    
    // Get all external jobs
    const allJobs = await ExternalJob.find({});
    console.log(`Total jobs in database: ${allJobs.length}`);

    let keptCount = 0;
    let removedCount = 0;
    const jobsToRemove = [];

    // Check each job
    for (const job of allJobs) {
      if (!job.location) {
        console.log(`❌ No location: ${job.title} (${job.company})`);
        jobsToRemove.push(job._id);
        removedCount++;
        continue;
      }

      const location = job.location.toLowerCase();

      // Check for foreign keywords (explicit rejection)
      const hasForeignKeyword = rejectKeywords.some(keyword => 
        location.includes(keyword)
      );

      if (hasForeignKeyword) {
        console.log(`❌ Foreign job: ${job.title} - ${job.location}`);
        jobsToRemove.push(job._id);
        removedCount++;
        continue;
      }

      // Check for Karnataka keywords
      const hasKarnatakaKeyword = karnatakaKeywords.some(keyword => 
        location.includes(keyword)
      );

      if (hasKarnatakaKeyword) {
        console.log(`✅ Karnataka job: ${job.title} - ${job.location}`);
        keptCount++;
        continue;
      }

      // Accept remote India jobs
      if (location.includes('india') && 
          (location.includes('remote') || job.workMode === 'Remote')) {
        console.log(`✅ Remote India job: ${job.title} - ${job.location}`);
        keptCount++;
        continue;
      }

      // Everything else is rejected
      console.log(`❌ Not Karnataka: ${job.title} - ${job.location}`);
      jobsToRemove.push(job._id);
      removedCount++;
    }

    console.log('\n═══════════════════════════════════════════');
    console.log(`Jobs to keep: ${keptCount}`);
    console.log(`Jobs to remove: ${removedCount}`);
    console.log('═══════════════════════════════════════════\n');

    if (jobsToRemove.length > 0) {
      console.log(`🗑️  Removing ${jobsToRemove.length} non-Karnataka jobs...`);
      
      const result = await ExternalJob.deleteMany({
        _id: { $in: jobsToRemove }
      });

      console.log(`✅ Successfully removed ${result.deletedCount} jobs\n`);
    } else {
      console.log('✅ No jobs to remove. Database is clean!\n');
    }

    // Final count
    const finalCount = await ExternalJob.countDocuments();
    console.log(`📊 Final job count: ${finalCount}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupNonKarnatakaJobs();

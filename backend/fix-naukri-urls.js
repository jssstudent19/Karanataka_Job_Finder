require('dotenv').config();
const mongoose = require('mongoose');
const ExternalJob = require('./src/models/ExternalJob');

async function fixNaukriUrls() {
  console.log('Fixing Naukri URLs...\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get all Naukri jobs
    const naukriJobs = await ExternalJob.find({ source: 'apify-naukri' });
    console.log(`Found ${naukriJobs.length} Naukri jobs to fix\n`);

    let fixed = 0;
    let errors = 0;

    for (const job of naukriJobs) {
      try {
        // Check if URL has double naukri.com
        if (job.externalUrl && job.externalUrl.includes('naukri.com/https://www.naukri.com/')) {
          // Fix: Remove the duplicate
          const correctedUrl = job.externalUrl.replace('naukri.com/https://www.naukri.com/', 'naukri.com/');
          
          await ExternalJob.updateOne(
            { _id: job._id },
            { $set: { externalUrl: correctedUrl } }
          );
          
          console.log(`✅ Fixed: ${job.title}`);
          console.log(`   Old: ${job.externalUrl}`);
          console.log(`   New: ${correctedUrl}\n`);
          fixed++;
        }
      } catch (error) {
        console.error(`❌ Error fixing job ${job.title}:`, error.message);
        errors++;
      }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════\n');
    console.log(`Total Naukri jobs: ${naukriJobs.length}`);
    console.log(`Fixed URLs: ${fixed}`);
    console.log(`Errors: ${errors}`);
    console.log(`Already correct: ${naukriJobs.length - fixed - errors}\n`);

    console.log('✅ Done!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
    process.exit();
  }
}

fixNaukriUrls();

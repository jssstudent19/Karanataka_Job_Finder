require('dotenv').config();
const mongoose = require('mongoose');
const naukriService = require('./services/apifyNaukriService');
const indeedService = require('./services/apifyIndeedService');

async function importJobs() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  IMPORTING NAUKRI & INDEED JOBS FROM APIFY');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Import Naukri jobs
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  NAUKRI JOBS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const naukriRunId = 'zgVQiJv33OPFNgrAm';
    const naukriResults = await naukriService.fetchAndSaveJobs(naukriRunId);

    console.log('\n📊 Naukri Results:');
    console.log(`   Fetched: ${naukriResults.fetched} jobs`);
    console.log(`   Saved: ${naukriResults.saved} new jobs`);
    console.log(`   Updated: ${naukriResults.updated} existing jobs`);
    console.log(`   Errors: ${naukriResults.errors}`);

    // Import Indeed jobs
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  INDEED JOBS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const indeedRunId = 'kPNzoCL0cVJChR4kh';
    const indeedResults = await indeedService.fetchAndSaveJobs(indeedRunId);

    console.log('\n📊 Indeed Results:');
    console.log(`   Fetched: ${indeedResults.fetched} jobs`);
    console.log(`   Saved: ${indeedResults.saved} new jobs`);
    console.log(`   Updated: ${indeedResults.updated} existing jobs`);
    console.log(`   Errors: ${indeedResults.errors}`);

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const totalFetched = naukriResults.fetched + indeedResults.fetched;
    const totalSaved = naukriResults.saved + indeedResults.saved;
    const totalUpdated = naukriResults.updated + indeedResults.updated;
    const totalErrors = naukriResults.errors + indeedResults.errors;

    console.log(`✅ Total Fetched: ${totalFetched} jobs`);
    console.log(`✅ Total Saved: ${totalSaved} new jobs`);
    console.log(`🔄 Total Updated: ${totalUpdated} existing jobs`);
    console.log(`⚠️  Total Errors: ${totalErrors}`);

    // Get final stats
    const ExternalJob = require('./src/models/ExternalJob');
    const naukriCount = await ExternalJob.countDocuments({ source: 'apify-naukri', status: 'active' });
    const indeedCount = await ExternalJob.countDocuments({ source: 'apify-indeed', status: 'active' });
    const totalCount = await ExternalJob.countDocuments({ status: 'active' });

    console.log(`\n📈 Database Stats:`);
    console.log(`   Naukri jobs in DB: ${naukriCount}`);
    console.log(`   Indeed jobs in DB: ${indeedCount}`);
    console.log(`   Total active jobs: ${totalCount}`);

    console.log('\n🎉 Import completed successfully!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
    process.exit();
  }
}

importJobs();

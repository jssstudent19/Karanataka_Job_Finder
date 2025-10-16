require('dotenv').config();
const apifyService = require('./services/apifyLinkedInService');
const mongoose = require('mongoose');

async function test() {
  console.log('Testing Apify LinkedIn Integration...\n');
  
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Fetch and save jobs from the Apify run
    const runId = 'wBC2ccCnWOmZcVB0J'; // Your run ID
    
    const results = await apifyService.fetchAndSaveJobs(runId);

    console.log('\n═══════════════════════════════════════════');
    console.log('           APIFY INTEGRATION RESULTS       ');
    console.log('═══════════════════════════════════════════\n');
    
    console.log(`📊 Fetched: ${results.fetched} LinkedIn jobs`);
    console.log(`✅ Saved: ${results.saved} new jobs`);
    console.log(`🔄 Updated: ${results.updated} existing jobs`);
    console.log(`⚠️  Errors: ${results.errors}`);
    
    console.log('\n✅ SUCCESS! Apify LinkedIn jobs integrated!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
    process.exit();
  }
}

test();

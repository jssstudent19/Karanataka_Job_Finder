const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const ExternalJob = require('./src/models/ExternalJob');

async function clearAllJobs() {
  try {
    console.log('🗑️  Clearing all external jobs from database...\n');
    
    const count = await ExternalJob.countDocuments();
    console.log(`Found ${count} jobs in database\n`);
    
    if (count === 0) {
      console.log('✅ Database is already empty!');
      process.exit(0);
    }
    
    const result = await ExternalJob.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.deletedCount} jobs\n`);
    console.log('Database is now clean and ready for fresh data!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearAllJobs();

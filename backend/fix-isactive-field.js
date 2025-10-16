require('dotenv').config();
const mongoose = require('mongoose');
const ExternalJob = require('./src/models/ExternalJob');

async function fixIsActiveField() {
  console.log('Fixing isActive field for all jobs...\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Update all jobs that don't have isActive field
    // Set isActive based on status field
    const result = await ExternalJob.updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: true } }
    );

    console.log(`✅ Updated ${result.modifiedCount} jobs with isActive field`);

    // Also ensure all active status jobs have isActive: true
    const result2 = await ExternalJob.updateMany(
      { status: 'active', isActive: { $ne: true } },
      { $set: { isActive: true } }
    );

    console.log(`✅ Ensured ${result2.modifiedCount} active jobs have isActive: true`);

    // Count jobs now
    const totalActive = await ExternalJob.countDocuments({ isActive: true });
    const totalInactive = await ExternalJob.countDocuments({ isActive: false });

    console.log(`\n📊 Stats:`);
    console.log(`   Active jobs: ${totalActive}`);
    console.log(`   Inactive jobs: ${totalInactive}`);
    console.log(`   Total: ${totalActive + totalInactive}`);

    // Show jobs by source
    const bySource = await ExternalJob.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log(`\n📈 Active jobs by source:`);
    bySource.forEach(s => {
      console.log(`   ${s._id}: ${s.count} jobs`);
    });

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from database');
    process.exit();
  }
}

fixIsActiveField();

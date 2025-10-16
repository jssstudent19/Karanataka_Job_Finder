require('dotenv').config();
const mongoose = require('mongoose');

async function diagnoseCollections() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/karnataka_job_portal');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Get current collections
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Current Collections:');
    collections.forEach(col => {
      console.log(`  - ${col.name} (type: ${col.type})`);
    });

    // Check collection stats
    console.log('\n📊 Collection Stats:');
    for (const col of collections) {
      try {
        const stats = await db.collection(col.name).stats();
        console.log(`  ${col.name}: ${stats.count} documents, ${Math.round(stats.size/1024)}KB`);
      } catch (error) {
        console.log(`  ${col.name}: Error getting stats - ${error.message}`);
      }
    }

    // Check indexes
    console.log('\n🔍 Checking Indexes:');
    for (const col of ['applications', 'jobs']) {
      try {
        const indexes = await db.collection(col).indexes();
        console.log(`\n  ${col} indexes:`);
        indexes.forEach(idx => {
          console.log(`    - ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''}`);
        });
      } catch (error) {
        console.log(`    Error getting indexes for ${col}: ${error.message}`);
      }
    }

    // Monitor for a moment to see if collections are being created/dropped
    console.log('\n👀 Monitoring for collection changes (10 seconds)...');
    
    const initialCollections = new Set(collections.map(c => c.name));
    
    setTimeout(async () => {
      try {
        const newCollections = await db.listCollections().toArray();
        const newNames = new Set(newCollections.map(c => c.name));
        
        const added = [...newNames].filter(name => !initialCollections.has(name));
        const removed = [...initialCollections].filter(name => !newNames.has(name));
        
        if (added.length > 0) {
          console.log('⚠️  New collections created:', added);
        }
        if (removed.length > 0) {
          console.log('⚠️  Collections removed:', removed);
        }
        if (added.length === 0 && removed.length === 0) {
          console.log('✅ No collection changes detected');
        }
        
        mongoose.connection.close();
      } catch (error) {
        console.error('Error during monitoring:', error);
        mongoose.connection.close();
      }
    }, 10000);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

diagnoseCollections();
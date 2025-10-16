require('dotenv').config();
const mongoose = require('mongoose');

async function debugCollectionCreation() {
  try {
    console.log('🔍 Starting Collection Creation Debug Monitor...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/karnataka_job_portal');
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // Initial state check
    let collections = await db.listCollections().toArray();
    let collectionNames = new Set(collections.map(c => c.name));
    
    console.log('📋 Initial Collections:');
    if (collections.length === 0) {
      console.log('  (No collections found)');
    } else {
      collections.forEach(col => console.log(`  - ${col.name}`));
    }
    console.log('');

    // Setup MongoDB change streams to monitor collection operations
    console.log('👀 Setting up change stream monitoring...');
    
    // Monitor database-level changes
    const changeStream = db.watch([
      { $match: { operationType: { $in: ['insert', 'createIndexes'] } } }
    ]);

    changeStream.on('change', (change) => {
      console.log('🔔 Database Change Detected:', {
        operation: change.operationType,
        collection: change.ns?.coll,
        timestamp: new Date().toISOString()
      });
    });

    // Periodic collection check
    const checkInterval = setInterval(async () => {
      try {
        const currentCollections = await db.listCollections().toArray();
        const currentNames = new Set(currentCollections.map(c => c.name));

        // Check for new collections
        const newCollections = [...currentNames].filter(name => !collectionNames.has(name));
        
        if (newCollections.length > 0) {
          console.log(`\n🆕 NEW COLLECTIONS DETECTED at ${new Date().toISOString()}:`);
          newCollections.forEach(name => console.log(`  ✨ ${name} - JUST CREATED!`));
          
          // Get stack trace to see what triggered this
          console.log('\n📍 Call Stack:');
          console.trace('Collection creation detected');
          
          // Check if these are the problematic collections
          if (newCollections.includes('applications') || newCollections.includes('jobs')) {
            console.log('\n⚠️  CRITICAL: applications or jobs collection was created!');
            console.log('This is likely the issue you\'re experiencing.');
          }
          
          collectionNames = currentNames;
        }
      } catch (error) {
        console.error('Error during collection check:', error);
      }
    }, 1000); // Check every second

    console.log('🚀 Monitoring active. Now start your backend server in another terminal.\n');
    console.log('Commands to run in another terminal:');
    console.log('  npm run dev        (start with nodemon)');
    console.log('  npm start          (start normally)');
    console.log('\nPress Ctrl+C to stop monitoring...\n');

    // Keep the script running
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping monitoring...');
      changeStream.close();
      clearInterval(checkInterval);
      mongoose.connection.close();
      process.exit(0);
    });

    // Also try to load models to see if that triggers collection creation
    setTimeout(async () => {
      console.log('🧪 Testing: Loading models to see if they trigger collection creation...');
      
      try {
        // Import models one by one to see which one triggers creation
        console.log('  Loading Job model...');
        const Job = require('./src/models/Job');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('  Loading Application model...');
        const Application = require('./src/models/Application');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('  Models loaded. Checking for collection creation...');
        
      } catch (error) {
        console.error('Error loading models:', error);
      }
    }, 5000);

  } catch (error) {
    console.error('❌ Error setting up monitoring:', error);
    process.exit(1);
  }
}

debugCollectionCreation();
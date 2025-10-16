require('dotenv').config();
const mongoose = require('mongoose');

async function simpleDebugMonitor() {
  try {
    console.log('🔍 Starting Simple Collection Creation Monitor...\n');

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
          
          // Check if these are the problematic collections
          if (newCollections.includes('applications') || newCollections.includes('jobs')) {
            console.log('\n⚠️  CRITICAL: applications or jobs collection was created!');
            console.log('This is exactly what you reported as the issue.');
            
            // Get some additional info
            for (const colName of newCollections) {
              if (colName === 'applications' || colName === 'jobs') {
                try {
                  const count = await db.collection(colName).estimatedDocumentCount();
                  const indexes = await db.collection(colName).indexes();
                  console.log(`\n📊 ${colName} Details:`);
                  console.log(`  - Document count: ${count}`);
                  console.log(`  - Indexes created: ${indexes.length}`);
                  indexes.forEach((idx, i) => {
                    console.log(`    ${i + 1}. ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''}`);
                  });
                } catch (error) {
                  console.log(`  - Error getting details: ${error.message}`);
                }
              }
            }
          }
          
          collectionNames = currentNames;
        }
      } catch (error) {
        console.error('Error during collection check:', error);
      }
    }, 500); // Check every half second for more precision

    console.log('🚀 Monitoring active. Now start your backend server in another terminal.\n');
    console.log('Commands to run in another terminal:');
    console.log('  npm run dev        (start with nodemon)');
    console.log('  npm start          (start normally)');
    console.log('\nPress Ctrl+C to stop monitoring...\n');

    // Keep the script running
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping monitoring...');
      clearInterval(checkInterval);
      mongoose.connection.close();
      process.exit(0);
    });

    // Test loading models after a delay
    setTimeout(async () => {
      console.log('🧪 Testing: Loading models to see if they trigger collection creation...\n');
      
      try {
        console.log('  📥 Loading Job model...');
        const Job = require('./src/models/Job');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('  📥 Loading Application model...');
        const Application = require('./src/models/Application');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('  ✅ Models loaded successfully');
        
        // Try creating indexes explicitly to see if that triggers collection creation
        console.log('\n  🔧 Testing index creation...');
        
        console.log('  📊 Ensuring Job indexes...');
        await Job.createIndexes();
        
        console.log('  📊 Ensuring Application indexes...');
        await Application.createIndexes();
        
        console.log('  ✅ Index creation completed');
        
      } catch (error) {
        console.error('❌ Error during model testing:', error);
      }
    }, 3000);

  } catch (error) {
    console.error('❌ Error setting up monitoring:', error);
    process.exit(1);
  }
}

simpleDebugMonitor();
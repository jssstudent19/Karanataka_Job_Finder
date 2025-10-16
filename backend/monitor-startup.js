require('dotenv').config();
const mongoose = require('mongoose');

async function monitorStartup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/karnataka_job_portal');
    console.log('🔍 Monitoring collections during backend startup...\n');

    const db = mongoose.connection.db;
    let collections = await db.listCollections().toArray();
    let collectionNames = new Set(collections.map(c => c.name));

    console.log('📋 Initial state:');
    console.log(`Collections: ${[...collectionNames].join(', ') || 'None'}\n`);
    console.log('👀 Waiting for backend to start...\n');

    const checkInterval = setInterval(async () => {
      try {
        const currentCollections = await db.listCollections().toArray();
        const currentNames = new Set(currentCollections.map(c => c.name));
        const newCollections = [...currentNames].filter(name => !collectionNames.has(name));
        
        if (newCollections.length > 0) {
          console.log(`⚡ NEW COLLECTIONS: ${newCollections.join(', ')} at ${new Date().toLocaleTimeString()}`);
          collectionNames = currentNames;
        }
      } catch (error) {
        // Ignore errors
      }
    }, 200);

    setTimeout(() => {
      clearInterval(checkInterval);
      mongoose.connection.close();
      console.log('\n✅ Monitoring complete');
    }, 30000); // Stop after 30 seconds

  } catch (error) {
    console.error('Error:', error);
  }
}

monitorStartup();
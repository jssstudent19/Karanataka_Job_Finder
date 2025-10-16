const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/job-portal', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: 'test1@gmail.com' });
    
    if (existingUser) {
      console.log('User test1@gmail.com already exists');
      
      // Update password if needed
      existingUser.password = 'test13';
      await existingUser.save();
      console.log('Password updated for test1@gmail.com');
      
    } else {
      // Create new test user
      const testUser = new User({
        name: 'Test User',
        email: 'test1@gmail.com',
        password: 'test13',
        role: 'jobseeker',
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: 2,
        location: 'Bangalore'
      });
      
      await testUser.save();
      console.log('Test user created successfully:');
      console.log('Email: test1@gmail.com');
      console.log('Password: test13');
    }
    
    // Also create an admin user
    const adminExists = await User.findOne({ email: 'admin@test.com' });
    
    if (!adminExists) {
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('Admin user created:');
      console.log('Email: admin@test.com');
      console.log('Password: admin123');
    }
    
    console.log('All test users ready!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();
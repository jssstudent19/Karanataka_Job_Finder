const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function testLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/job-portal', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Test login credentials
    const email = 'test1@gmail.com';
    const password = 'test13';
    
    console.log(`Testing login for: ${email}`);
    
    try {
      // Find user by credentials (same method used in auth controller)
      const user = await User.findByCredentials(email, password);
      console.log('✅ Login test SUCCESSFUL!');
      console.log('User found:', {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      console.log('❌ Login test FAILED!');
      console.log('Error:', error.message);
      
      // Let's check if user exists
      const user = await User.findOne({ email });
      if (user) {
        console.log('User exists in database:', {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        });
        
        // Test password comparison directly
        const userWithPassword = await User.findOne({ email }).select('+password');
        const isPasswordValid = await userWithPassword.comparePassword(password);
        console.log('Password comparison result:', isPasswordValid);
        
      } else {
        console.log('User does not exist in database');
      }
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

testLogin();
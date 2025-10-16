const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function testDeactivatedLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/job-portal', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB\n');
    
    // First, let's deactivate a user (not admin)
    const userToDeactivate = await User.findOne({ email: 'test1@gmail.com' });
    
    if (!userToDeactivate) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log(`📧 Testing with user: ${userToDeactivate.email}`);
    console.log(`👤 Current status: ${userToDeactivate.isActive !== false ? 'Active' : 'Inactive'}\n`);
    
    // Deactivate the user
    userToDeactivate.isActive = false;
    await userToDeactivate.save();
    console.log('✅ User deactivated\n');
    
    // Test 1: Try to login with correct credentials but deactivated account
    console.log('🧪 Test 1: Login attempt with deactivated account...');
    try {
      await User.findByCredentials('test1@gmail.com', 'test13');
      console.log('❌ ERROR: Login should have failed but succeeded!');
    } catch (error) {
      if (error.message.includes('Account deactivated')) {
        console.log('✅ SUCCESS: Correct error message:', error.message);
      } else {
        console.log('⚠️ PARTIAL: Login failed but wrong message:', error.message);
      }
    }
    
    // Reactivate the user for next test
    userToDeactivate.isActive = true;
    await userToDeactivate.save();
    console.log('\n✅ User reactivated');
    
    // Test 2: Try to login with reactivated account
    console.log('\n🧪 Test 2: Login attempt with reactivated account...');
    try {
      const user = await User.findByCredentials('test1@gmail.com', 'test13');
      console.log('✅ SUCCESS: Login successful with reactivated account');
    } catch (error) {
      console.log('❌ ERROR: Login should have succeeded:', error.message);
    }
    
    console.log('\n🎯 Test Summary:');
    console.log('- Deactivated users should be blocked from logging in');
    console.log('- Error message: "Account deactivated. Please contact admin for assistance."');
    console.log('- Reactivated users should be able to log in normally');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testDeactivatedLogin();
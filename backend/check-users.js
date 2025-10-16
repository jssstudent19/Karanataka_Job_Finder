const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function checkUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/job-portal', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB\n');
    
    // Get all users
    const allUsers = await User.find({}).select('-password -resumeFile');
    
    console.log(`📊 Total users in database: ${allUsers.length}\n`);
    
    if (allUsers.length === 0) {
      console.log('❌ No users found in database!');
      return;
    }
    
    // Display each user
    allUsers.forEach((user, index) => {
      console.log(`👤 User ${index + 1}:`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive !== false ? 'Yes' : 'No'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });
    
    // Count by role
    const jobSeekers = allUsers.filter(u => u.role === 'jobseeker').length;
    const admins = allUsers.filter(u => u.role === 'admin').length;
    const active = allUsers.filter(u => u.isActive !== false).length;
    
    console.log('📈 User Statistics:');
    console.log(`   Job Seekers: ${jobSeekers}`);
    console.log(`   Admins: ${admins}`);
    console.log(`   Active Users: ${active}`);
    console.log(`   Inactive Users: ${allUsers.length - active}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
    process.exit(1);
  }
}

checkUsers();
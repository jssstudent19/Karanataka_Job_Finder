const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/job-portal', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@karnatakajobs.com' });
    
    if (existingAdmin) {
      console.log('Admin already exists with email: admin@karnatakajobs.com');
      
      // Update admin details if needed
      existingAdmin.name = 'Admin';
      existingAdmin.password = 'admin@123';
      existingAdmin.role = 'admin';
      existingAdmin.isActive = true;
      await existingAdmin.save();
      console.log('Admin account updated successfully');
      
    } else {
      // Create new admin account
      const admin = new User({
        name: 'Admin',
        email: 'admin@karnatakajobs.com',
        password: 'admin@123',
        role: 'admin',
        isActive: true,
        permissions: ['users']
      });
      
      await admin.save();
      console.log('✅ Admin account created successfully!');
    }
    
    console.log('\n📧 Admin Login Credentials:');
    console.log('Email: admin@karnatakajobs.com');
    console.log('Password: admin@123');
    console.log('Role: Admin');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
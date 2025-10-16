const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/karnataka_job_portal')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const User = require('./src/models/User');

async function resetPassword() {
  try {
    const email = 'test3@gmail.com';
    const newPassword = 'test123';
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log(`Found user: ${user.name} (${user.email})`);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the password directly in the database
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });
    
    console.log(`Password reset successfully for ${email}`);
    console.log(`New password: ${newPassword}`);
    
    // Verify the password works
    const updatedUser = await User.findOne({ email }).select('+password');
    const isMatch = await bcrypt.compare(newPassword, updatedUser.password);
    console.log(`Password verification: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
    
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    mongoose.connection.close();
  }
}

resetPassword();
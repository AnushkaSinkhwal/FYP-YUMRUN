require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');

// Connection string from .env or default
const connectionString = process.env.CONNECTION_STRING;

// Admin user data
const adminData = {
  name: 'Admin User',
  phone: '1234567890', // Example phone number
  email: 'admin@yumrun.com',
  password: 'Admin@123', // This will be hashed by the User model's pre-save hook
  isAdmin: true,
  healthCondition: 'Healthy'
};

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to database');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return process.exit(0);
    }
    
    // Create new admin user
    const admin = new User(adminData);
    await admin.save();
    
    console.log('Admin user created successfully');
    console.log('Email:', adminData.email);
    console.log('Password:', 'Admin@123'); // Only show password in console
    
    return process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    if (error.errors) {
      // Show validation errors
      for (let field in error.errors) {
        console.error(`- ${field}: ${error.errors[field].message}`);
      }
    }
    return process.exit(1);
  }
}

createAdminUser(); 
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

// Connection string from .env or default
const connectionString = process.env.CONNECTION_STRING;

console.log('Using connection string:', connectionString);

// Admin user data
const adminData = {
  name: 'Admin User',
  username: 'admin', // Explicitly set the admin username
  phone: '1234567890', // Example phone number
  email: 'admin@yumrun.com',
  password: 'admin', // Simple password
  isAdmin: true,
  healthCondition: 'Healthy',
  createdAt: new Date(),
  updatedAt: new Date()
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
    const existingAdmin = await User.findOne({ 
      $or: [
        { username: adminData.username },
        { email: adminData.email }
      ]
    });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return process.exit(0);
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);
    adminData.password = hashedPassword;
    
    // Insert directly into collection to bypass validation
    const result = await mongoose.connection.collection('users').insertOne(adminData);
    
    if (result.acknowledged) {
      console.log('Admin user created successfully');
      console.log('Username:', adminData.username);
      console.log('Email:', adminData.email);
      console.log('Password:', 'admin'); // Show original password in console
    } else {
      console.error('Failed to create admin user');
    }
    
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
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');
const readline = require('readline');
const bcrypt = require('bcryptjs');

// Connection string from .env
const connectionString = process.env.CONNECTION_STRING;

// Create interface for command line input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask questions function
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

// Validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone);
};

const validatePassword = (password) => {
  // At least 8 characters, 1 number, 1 special character
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
  return passwordRegex.test(password);
};

const validateHealthCondition = (condition) => {
  const validConditions = ['Healthy', 'Diabetes', 'Heart Condition', 'Hypertension', 'Other'];
  return validConditions.includes(condition);
};

async function createUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to database');
    
    // Get user details from command line with validation
    let name, email, phone, password, healthCondition;
    
    // Name validation
    do {
      name = await askQuestion('Enter full name: ');
      if (!name || name.trim().length < 3) {
        console.log('Full name must be at least 3 characters long');
      }
    } while (!name || name.trim().length < 3);
    
    // Email validation
    do {
      email = await askQuestion('Enter email: ');
      if (!validateEmail(email)) {
        console.log('Please enter a valid email address');
      }
    } while (!validateEmail(email));
    
    // Phone validation
    do {
      phone = await askQuestion('Enter phone number (10 digits): ');
      if (!validatePhone(phone)) {
        console.log('Please enter a valid 10-digit phone number');
      }
    } while (!validatePhone(phone));
    
    // Password validation
    do {
      password = await askQuestion('Enter password (min 8 chars, 1 number, 1 special char): ');
      if (!validatePassword(password)) {
        console.log('Password must be at least 8 characters long and contain at least 1 number and 1 special character');
      }
    } while (!validatePassword(password));
    
    // Health condition validation
    do {
      healthCondition = await askQuestion('Enter health condition (Healthy, Diabetes, Heart Condition, Hypertension, Other): ');
      if (!validateHealthCondition(healthCondition)) {
        console.log('Please enter a valid health condition: Healthy, Diabetes, Heart Condition, Hypertension, or Other');
      }
    } while (!validateHealthCondition(healthCondition));
    
    // Get role information
    const isAdmin = (await askQuestion('Make this user an admin? (y/n): ')).toLowerCase() === 'y';
    const isOwner = (await askQuestion('Make this user a restaurant owner? (y/n): ')).toLowerCase() === 'y';
    const isDeliveryStaff = (await askQuestion('Make this user delivery staff? (y/n): ')).toLowerCase() === 'y';
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      console.log('User with this email already exists');
      rl.close();
      return process.exit(0);
    }
    
    // Prepare user data
    const userData = {
      name,
      email,
      phone,
      password,
      healthCondition,
      isAdmin,
      isOwner,
      isDeliveryStaff
    };
    
    // Create new user
    const user = new User(userData);
    await user.save();
    
    console.log('\nUser created successfully!');
    console.log('---------------------');
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Roles:');
    console.log('- Admin:', isAdmin ? 'Yes' : 'No');
    console.log('- Restaurant Owner:', isOwner ? 'Yes' : 'No');
    console.log('- Delivery Staff:', isDeliveryStaff ? 'Yes' : 'No');
    
    rl.close();
    return process.exit(0);
  } catch (error) {
    console.error('\nError creating user:');
    console.error(error.message);
    
    if (error.errors) {
      // Show validation errors
      console.error('\nValidation errors:');
      for (let field in error.errors) {
        console.error(`- ${field}: ${error.errors[field].message}`);
      }
    }
    
    rl.close();
    return process.exit(1);
  }
}

createUser(); 
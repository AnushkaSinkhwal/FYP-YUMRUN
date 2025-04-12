/**
 * Script to create a test restaurant user
 * Run with: node scripts/createTestRestaurant.js
 */

const mongoose = require('mongoose');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

mongoose.connect(process.env.CONNECTION_STRING)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Check if test restaurant already exists
    const existingUser = await User.findOne({ email: 'testrestaurant@example.com' });
    
    if (existingUser) {
      console.log('Test restaurant user already exists with ID:', existingUser._id);
      process.exit(0);
    }
    
    // Create a new test restaurant user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const newUser = new User({
      fullName: 'Test Restaurant',
      email: 'testrestaurant@example.com',
      password: hashedPassword,
      role: 'restaurant',
      phone: '1234567890',
      isVerified: true,
      restaurantDetails: {
        name: 'Test Restaurant',
        description: 'A test restaurant for development',
        address: '123 Test Street, City, Country',
        panNumber: '123456789',
        cuisine: ['Italian', 'Pizza'],
        openingHours: {
          monday: { open: '09:00', close: '22:00' },
          tuesday: { open: '09:00', close: '22:00' },
          wednesday: { open: '09:00', close: '22:00' },
          thursday: { open: '09:00', close: '22:00' },
          friday: { open: '09:00', close: '23:00' },
          saturday: { open: '10:00', close: '23:00' },
          sunday: { open: '10:00', close: '21:00' }
        }
      }
    });
    
    await newUser.save();
    console.log('Test restaurant user created with ID:', newUser._id);
    console.log('Login credentials: testrestaurant@example.com / password123');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  }); 
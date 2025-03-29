require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

// Connection string from .env or default
const connectionString = process.env.CONNECTION_STRING;

console.log('Using connection string:', connectionString);

// Test users data
const testUsers = [
  // Admin user
  {
    name: 'Admin User',
    username: 'admin',
    phone: '1234567890',
    email: 'admin@yumrun.com',
    password: 'Secret@123',
    isAdmin: true,
    isRestaurantOwner: false,
    isDeliveryStaff: false,
    healthCondition: 'Healthy',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Restaurant owner
  {
    name: 'Restaurant Owner',
    username: 'restaurantowner',
    phone: '9876543210',
    email: 'owner@yumrun.com',
    password: 'Secret@123',
    isAdmin: false,
    isRestaurantOwner: true,
    isDeliveryStaff: false,
    restaurantDetails: {
      name: 'Tasty Bites Restaurant',
      address: '123 Food Street, Foodville',
      description: 'A family-friendly restaurant serving delicious meals',
      cuisineType: 'Multi-cuisine',
      approved: true,
      approvedAt: new Date(),
    },
    healthCondition: 'Healthy',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Regular user
  {
    name: 'Regular User',
    username: 'user',
    phone: '5555555555',
    email: 'user@yumrun.com',
    password: 'Secret@123',
    isAdmin: false,
    isRestaurantOwner: false,
    isDeliveryStaff: false,
    healthCondition: 'Healthy',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Delivery staff
  {
    name: 'Delivery Staff',
    username: 'delivery',
    phone: '8888888888',
    email: 'delivery@yumrun.com',
    password: 'Secret@123',
    isAdmin: false,
    isRestaurantOwner: false,
    isDeliveryStaff: true,
    healthCondition: 'Healthy',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // User with health condition
  {
    name: 'Diabetic User',
    username: 'diabetic',
    phone: '7777777777',
    email: 'diabetic@yumrun.com',
    password: 'Secret@123',
    isAdmin: false,
    isRestaurantOwner: false,
    isDeliveryStaff: false,
    healthCondition: 'Diabetes',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function createTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to database');
    
    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [
          { username: userData.username },
          { email: userData.email }
        ]
      });
      
      if (existingUser) {
        console.log(`User ${userData.username} (${userData.email}) already exists`);
        continue;
      }
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      userData.password = hashedPassword;
      
      // Insert directly into collection to bypass validation (especially when we are executing scripts)
      const result = await mongoose.connection.collection('users').insertOne(userData);
      
      if (result.acknowledged) {
        console.log(`User ${userData.username} created successfully`);
        console.log('Role:', userData.isAdmin ? 'Admin' : userData.isRestaurantOwner ? 'Restaurant Owner' : userData.isDeliveryStaff ? 'Delivery Staff' : 'Regular User');
        console.log('Email:', userData.email);
        console.log('Password:', userData.password === hashedPassword ? 'Hashed' : userData.password);
        console.log('----------------------------');
      } else {
        console.error(`Failed to create user ${userData.username}`);
      }
    }
    
    console.log('===== USER CREDENTIALS SUMMARY =====');
    console.log('ADMIN:');
    console.log('  Email: admin@yumrun.com');
    console.log('  Password: Secret@123');
    console.log('RESTAURANT OWNER:');
    console.log('  Email: owner@yumrun.com');
    console.log('  Password: Secret@123');
    console.log('REGULAR USER:');
    console.log('  Email: user@yumrun.com');
    console.log('  Password: Secret@123');
    console.log('DELIVERY STAFF:');
    console.log('  Email: delivery@yumrun.com');
    console.log('  Password: Secret@123');
    console.log('DIABETIC USER:');
    console.log('  Email: diabetic@yumrun.com');
    console.log('  Password: Secret@123');
    console.log('====================================');
    
    return process.exit(0);
  } catch (error) {
    console.error('Error creating test users:', error.message);
    if (error.errors) {
      // Show validation errors
      for (let field in error.errors) {
        console.error(`- ${field}: ${error.errors[field].message}`);
      }
    }
    return process.exit(1);
  }
}

createTestUsers(); 
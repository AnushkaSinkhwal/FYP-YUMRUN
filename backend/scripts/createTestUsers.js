require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { Restaurant } = require('../models/restaurant');

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
    role: 'admin',
    healthCondition: 'Healthy',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Restaurant owner
  {
    name: 'Restaurant Owner',
    username: 'restaurant',
    phone: '9876543210',
    email: 'owner@yumrun.com',
    password: 'Secret@123',
    role: 'restaurant',
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
    role: 'customer',
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
    role: 'deliveryRider',
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
    role: 'customer',
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
        
        // Check if this is a restaurant owner but doesn't have a restaurant document
        if (existingUser.role === 'restaurant') {
          const existingRestaurant = await Restaurant.findOne({ owner: existingUser._id });
          if (!existingRestaurant && existingUser.restaurantDetails) {
            // Create restaurant document for existing restaurant owner
            console.log(`Creating restaurant document for existing owner: ${existingUser.name}`);
            const restaurant = new Restaurant({
              name: existingUser.restaurantDetails.name,
              location: existingUser.restaurantDetails.address,
              description: existingUser.restaurantDetails.description,
              logo: existingUser.restaurantDetails.logo || '',
              owner: existingUser._id,
              isApproved: existingUser.restaurantDetails.approved || true,
              cuisine: existingUser.restaurantDetails.cuisineType?.split(',') || ['Healthy', 'Vegetarian'],
              priceRange: '$$',
              openingTime: '09:00',
              closingTime: '22:00',
              deliveryRadius: 5,
              minimumOrder: 10,
              deliveryFee: 2.5,
              isOpen: true
            });
            
            try {
              const savedRestaurant = await restaurant.save();
              console.log(`Restaurant document created for ${existingUser.username}: ${savedRestaurant.name}`);
            } catch (error) {
              console.error(`Error creating restaurant document for ${existingUser.username}: ${error.message}`);
              if (error.errors) {
                // Show validation errors
                for (let field in error.errors) {
                  console.error(`- ${field}: ${error.errors[field].message}`);
                }
              }
            }
          }
        }
        
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
        console.log('Role:', userData.role);
        console.log('Email:', userData.email);
        console.log('Password:', userData.password === hashedPassword ? 'Hashed' : userData.password);
        console.log('----------------------------');
        
        // Create restaurant document if this is a restaurant owner
        if (userData.role === 'restaurant' && userData.restaurantDetails) {
          // Check if restaurant already exists for this owner
          const existingRestaurant = await Restaurant.findOne({ owner: result.insertedId });
          
          if (!existingRestaurant) {
            // Create restaurant document
            const restaurant = new Restaurant({
              name: userData.restaurantDetails.name,
              location: userData.restaurantDetails.address,
              description: userData.restaurantDetails.description,
              logo: userData.restaurantDetails.logo || '',
              owner: result.insertedId,
              isApproved: userData.restaurantDetails.approved || true,
              cuisine: userData.restaurantDetails.cuisineType?.split(',') || ['Healthy', 'Vegetarian'],
              priceRange: '$$',
              openingTime: '09:00',
              closingTime: '22:00',
              deliveryRadius: 5,
              minimumOrder: 10,
              deliveryFee: 2.5,
              isOpen: true
            });
            
            try {
              const savedRestaurant = await restaurant.save();
              console.log(`Restaurant document created: ${savedRestaurant.name}`);
            } catch (error) {
              console.error(`Error creating restaurant document: ${error.message}`);
              if (error.errors) {
                // Show validation errors
                for (let field in error.errors) {
                  console.error(`- ${field}: ${error.errors[field].message}`);
                }
              }
            }
          } else {
            console.log(`Restaurant already exists for owner: ${userData.username}`);
          }
        }
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
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Restaurant = require('../models/restaurant');
const MenuItem = require('../models/menuItem');

// Connection string from .env or default
const connectionString = process.env.CONNECTION_STRING;

console.log('Using connection string:', connectionString);

// Test users data
const testUsers = [
  // Admin user
  {
    firstName: 'Admin',
    lastName: 'User',
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
    firstName: 'Restaurant',
    lastName: 'Owner',
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
      panNumber: '123456789',
      approved: true,
      approvedAt: new Date(),
    },
    healthCondition: 'Healthy',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Regular user
  {
    firstName: 'Regular',
    lastName: 'User',
    username: 'user',
    phone: '5555555555',
    email: 'user@yumrun.com',
    password: 'Secret@123',
    role: 'customer',
    healthCondition: 'Healthy',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Delivery Rider
  {
    firstName: 'Delivery',
    lastName: 'Rider',
    username: 'delivery',
    phone: '8888888888',
    email: 'delivery@yumrun.com',
    password: 'Secret@123',
    role: 'delivery_rider',
    deliveryRiderDetails: {
      vehicleType: 'motorcycle',
      licenseNumber: 'DL1234567890',
      vehicleRegistrationNumber: 'BA1PA5678',
      isAvailable: true,
      approved: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // User with health condition
  {
    firstName: 'Diabetic',
    lastName: 'User',
    username: 'diabetic',
    phone: '7777777777',
    email: 'diabetic@yumrun.com',
    password: 'Secret@123',
    role: 'customer',
    healthCondition: 'Diabetes',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Additional users with different health conditions
  {
    firstName: 'Heart',
    lastName: 'Patient',
    username: 'heart',
    phone: '6666666666',
    email: 'heart@yumrun.com',
    password: 'Secret@123',
    role: 'customer',
    healthCondition: 'Heart Condition',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    firstName: 'Hypertension',
    lastName: 'User',
    username: 'hypertension',
    phone: '4444444444',
    email: 'hypertension@yumrun.com',
    password: 'Secret@123',
    role: 'customer',
    healthCondition: 'Hypertension',
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
    
    // Create users from the testUsers array
    for (const userData of testUsers) {
      // Check if user already exists
      const userExists = await User.findOne({ email: userData.email });
      
      if (!userExists) {
        // Hash the password
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Create user with hashed password
        const user = new User({
          ...userData,
          password: hashedPassword
        });
        
        await user.save();
        console.log(`Created ${userData.role} user: ${userData.email}`);
        
        // If it's a restaurant user, create a restaurant
        if (userData.role === 'restaurant' && userData.restaurantDetails) {
          const restaurant = new Restaurant({
            name: userData.restaurantDetails.name,
            description: userData.restaurantDetails.description,
            cuisine: [userData.restaurantDetails.cuisineType],
            priceRange: '$$',
            address: {
              fullAddress: userData.restaurantDetails.address,
              street: userData.restaurantDetails.address.split(',')[0],
              city: 'Kathmandu',
              state: 'Bagmati',
              postalCode: '44600',
              country: 'Nepal',
              coordinates: {
                lat: 27.7172,
                lng: 85.3240
              }
            },
            phone: userData.phone,
            email: userData.email,
            openingHours: {
              monday: { open: '09:00', close: '21:00' },
              tuesday: { open: '09:00', close: '21:00' },
              wednesday: { open: '09:00', close: '21:00' },
              thursday: { open: '09:00', close: '21:00' },
              friday: { open: '09:00', close: '22:00' },
              saturday: { open: '10:00', close: '22:00' },
              sunday: { open: '10:00', close: '20:00' }
            },
            owner: user._id,
            logo: '/uploads/restaurants/default-restaurant.jpg',
            coverImage: '/uploads/restaurants/default-cover.jpg',
            rating: 4.5,
            reviewCount: 0,
            featuredItems: [],
            isActive: true
          });
          
          await restaurant.save();
          console.log(`Created restaurant: ${restaurant.name}`);
          
          // Create a sample menu item for the restaurant
          const menuItem = new MenuItem({
            item_name: 'Sample Momo',
            item_price: 250,
            description: 'Delicious momos for ordering',
            image: '/uploads/menu/default-menu.jpg',
            category: 'Main Course',
            calories: 450,
            protein: 15,
            carbs: 30,
            fat: 12,
            sodium: 600,
            isVegetarian: false,
            isPopular: true,
            restaurant: restaurant._id
          });
          
          await menuItem.save();
          console.log(`Created menu item for ${restaurant.name}`);
        }
      } else {
        console.log(`User already exists: ${userData.email}`);
      }
    }
    
    console.log('All test users created successfully');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  }
}

createTestUsers();

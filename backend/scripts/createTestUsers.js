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
    
    // Create test customer user if not exists
    const customerExists = await User.findOne({ email: 'customer@test.com' });

    if (!customerExists) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const customer = new User({
        firstName: 'Test',
        lastName: 'Customer',
        email: 'customer@test.com',
        password: hashedPassword,
        phone: '9876543210',
        role: 'customer',
        address: {
          fullAddress: '123 Test Street, Kathmandu, Nepal',
          street: '123 Test Street',
          city: 'Kathmandu',
          state: 'Bagmati',
          postalCode: '44600',
          country: 'Nepal',
          coordinates: {
            lat: 27.7172,
            lng: 85.3240
          }
        }
      });

      await customer.save();
      console.log('Test customer created');
    } else {
      console.log('Test customer already exists');
    }

    // Create test restaurant owner user if not exists
    const ownerExists = await User.findOne({ email: 'owner@test.com' });
    let owner;

    if (!ownerExists) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      owner = new User({
        firstName: 'Test',
        lastName: 'Restaurant Owner',
        email: 'owner@test.com',
        password: hashedPassword,
        phone: '9876543211',
        role: 'restaurant',
        address: {
          fullAddress: '456 Restaurant Road, Kathmandu, Nepal',
          street: '456 Restaurant Road',
          city: 'Kathmandu',
          state: 'Bagmati',
          postalCode: '44600',
          country: 'Nepal',
          coordinates: {
            lat: 27.7172,
            lng: 85.3240
          }
        }
      });

      await owner.save();
      console.log('Test restaurant owner created');
    } else {
      owner = ownerExists;
      console.log('Test restaurant owner already exists');
    }

    // Create test restaurant if not exists
    const restaurantExists = await Restaurant.findOne({ name: 'Test Restaurant' });
    let testRestaurant;
    
    if (!restaurantExists) {
      testRestaurant = new Restaurant({
        name: 'Test Restaurant',
        description: 'A test restaurant for development',
        cuisine: ['Nepali', 'Indian'],
        priceRange: '$$',
        address: {
          fullAddress: '456 Restaurant Road, Kathmandu, Nepal',
          street: '456 Restaurant Road',
          city: 'Kathmandu',
          state: 'Bagmati',
          postalCode: '44600',
          country: 'Nepal',
          coordinates: {
            lat: 27.7172,
            lng: 85.3240
          }
        },
        phone: '9876543211',
        email: 'test@restaurant.com',
        openingHours: {
          monday: { open: '09:00', close: '21:00' },
          tuesday: { open: '09:00', close: '21:00' },
          wednesday: { open: '09:00', close: '21:00' },
          thursday: { open: '09:00', close: '21:00' },
          friday: { open: '09:00', close: '22:00' },
          saturday: { open: '10:00', close: '22:00' },
          sunday: { open: '10:00', close: '20:00' }
        },
        owner: owner._id,
        logo: '/uploads/restaurants/default-restaurant.jpg',
        coverImage: '/uploads/restaurants/default-cover.jpg',
        rating: 4.5,
        reviewCount: 1,
        featuredItems: [],
        isActive: true
      });

      await testRestaurant.save();
      console.log('Test restaurant created');
      
      // Create a test menu item
      const testMenuItem = new MenuItem({
        item_name: 'Test Momo',
        item_price: 500,
        description: 'Delicious test momos for ordering',
        image: '/uploads/menu/default-menu.jpg',
        category: 'Main Course',
        calories: 450,
        protein: 15,
        carbs: 30,
        fat: 12,
        sodium: 600,
        isVegetarian: false,
        isPopular: true,
        restaurant: testRestaurant._id
      });
      
      await testMenuItem.save();
      console.log('Test menu item created');
      
    } else {
      console.log('Test restaurant already exists');
    }

    // Create test admin user if not exists
    const adminExists = await User.findOne({ email: 'admin@test.com' });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const admin = new User({
        firstName: 'Test',
        lastName: 'Admin',
        email: 'admin@test.com',
        password: hashedPassword,
        phone: '9876543212',
        role: 'admin',
        address: {
          fullAddress: '789 Admin Avenue, Kathmandu, Nepal',
          street: '789 Admin Avenue',
          city: 'Kathmandu',
          state: 'Bagmati',
          postalCode: '44600',
          country: 'Nepal',
          coordinates: {
            lat: 27.7172,
            lng: 85.3240
          }
        }
      });

      await admin.save();
      console.log('Test admin created');
    } else {
      console.log('Test admin already exists');
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

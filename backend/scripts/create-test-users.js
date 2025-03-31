const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.CONNECTION_STRING)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Delete existing test users
      await User.deleteMany({ 
        email: { 
          $in: [
            'admin@yumrun.com', 
            'owner@yumrun.com', 
            'user@yumrun.com', 
            'delivery@yumrun.com'
          ] 
        } 
      });
      
      // Create admin user
      const adminUser = new User({
        fullName: 'Admin User',
        email: 'admin@yumrun.com',
        phone: '9876543210',
        password: 'Secret@123',
        role: 'admin'
      });
      
      // Create restaurant owner
      const restaurantOwner = new User({
        fullName: 'Restaurant Owner',
        email: 'owner@yumrun.com',
        phone: '9876543211',
        password: 'Secret@123',
        role: 'restaurantOwner',
        restaurantDetails: {
          name: 'Test Restaurant',
          address: 'Test Address, Kathmandu',
          description: 'A test restaurant for development',
          panNumber: '123456789',
          approved: true
        }
      });
      
      // Create regular user
      const regularUser = new User({
        fullName: 'Regular User',
        email: 'user@yumrun.com',
        phone: '9876543212',
        password: 'Secret@123',
        role: 'customer',
        healthCondition: 'Healthy'
      });
      
      // Create delivery user
      const deliveryUser = new User({
        fullName: 'Delivery Rider',
        email: 'delivery@yumrun.com',
        phone: '9876543213',
        password: 'Secret@123',
        role: 'deliveryRider',
        deliveryRiderDetails: {
          vehicleType: 'motorcycle',
          licenseNumber: 'DL-123456',
          vehicleRegistrationNumber: 'BA-1-2345',
          approved: true
        }
      });
      
      // Save users
      await adminUser.save();
      await restaurantOwner.save();
      await regularUser.save();
      await deliveryUser.save();
      
      console.log('Test users created successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error creating test users:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 
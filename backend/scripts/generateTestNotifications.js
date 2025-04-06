/**
 * Script to generate test notifications for restaurant owners
 * 
 * Run this script with Node.js:
 * node scripts/generateTestNotifications.js <restaurantOwnerId>
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Notification = require('../models/notification');
const User = require('../models/user');

// Load environment variables
dotenv.config();

// Check for restaurant owner ID argument
const restaurantOwnerId = process.argv[2];
if (!restaurantOwnerId) {
  console.error('Please provide a restaurant owner ID as an argument');
  console.error('Usage: node scripts/generateTestNotifications.js <restaurantOwnerId>');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.CONNECTION_STRING)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

// Sample notification data
const sampleNotifications = [
  {
    type: 'ORDER',
    title: 'New Order Received',
    message: 'You have received a new order #ORD-123456.',
    data: {
      orderId: new mongoose.Types.ObjectId(),
      orderNumber: 'ORD-123456',
      actionUrl: '/restaurant/orders/123'
    }
  },
  {
    type: 'RESTAURANT_UPDATE',
    title: 'Profile Update Approved',
    message: 'Your restaurant profile update has been approved by admin.',
    data: {
      approvalId: new mongoose.Types.ObjectId(),
      actionUrl: '/restaurant/profile'
    }
  },
  {
    type: 'SYSTEM',
    title: 'Maintenance Notice',
    message: 'The system will be undergoing maintenance tonight from 2 AM to 3 AM.',
    data: {
      actionUrl: '/restaurant/dashboard'
    }
  },
  {
    type: 'ORDER',
    title: 'Order Delivered',
    message: 'Order #ORD-789012 has been successfully delivered.',
    data: {
      orderId: new mongoose.Types.ObjectId(),
      orderNumber: 'ORD-789012',
      actionUrl: '/restaurant/orders/456'
    }
  },
  {
    type: 'SYSTEM',
    title: 'New Feature Available',
    message: 'You can now create special offers and discounts for your menu items.',
    data: {
      actionUrl: '/restaurant/offers'
    }
  }
];

// Function to create notifications
const createNotifications = async () => {
  try {
    // Verify restaurant owner exists
    const restaurantOwner = await User.findById(restaurantOwnerId);
    if (!restaurantOwner) {
      console.error(`Restaurant owner with ID ${restaurantOwnerId} not found`);
      process.exit(1);
    }
    
    // Create notifications with varying read status
    const notificationPromises = sampleNotifications.map((notification, index) => {
      return new Notification({
        ...notification,
        userId: restaurantOwnerId,
        isRead: index % 2 === 0, // Alternate between read and unread
        createdAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)) // Stagger creation dates
      }).save();
    });
    
    const createdNotifications = await Promise.all(notificationPromises);
    
    console.log(`Created ${createdNotifications.length} test notifications for restaurant owner ID: ${restaurantOwnerId}`);
    console.log('Notification IDs:');
    createdNotifications.forEach(notification => {
      console.log(` - ${notification._id} (${notification.title})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test notifications:', error);
    process.exit(1);
  }
};

// Run the function
createNotifications(); 
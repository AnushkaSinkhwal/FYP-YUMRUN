/**
 * Script to test notification functionality
 * Run with: node scripts/testNotifications.js <action> <userId> [notificationId]
 * 
 * Actions:
 * - count: Get count of unread notifications
 * - list: List all notifications
 * - read <notificationId>: Mark a notification as read
 * - readall: Mark all notifications as read
 * - create: Create a test notification
 * - delete <notificationId>: Delete a notification
 */

const mongoose = require('mongoose');
const Notification = require('../models/notification');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const action = process.argv[2];
const userId = process.argv[3];
const notificationId = process.argv[4];

if (!action || !userId) {
  console.error('Usage: node scripts/testNotifications.js <action> <userId> [notificationId]');
  process.exit(1);
}

mongoose.connect(process.env.CONNECTION_STRING)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    switch (action) {
      case 'count':
        // Get count of unread notifications
        const count = await Notification.countDocuments({ userId, isRead: false });
        console.log(`Unread notifications count: ${count}`);
        break;
        
      case 'list':
        // List all notifications
        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
        console.log(`Found ${notifications.length} notifications:`);
        notifications.forEach(n => {
          console.log(`- ${n._id} | ${n.title} | ${n.isRead ? 'Read' : 'Unread'} | ${new Date(n.createdAt).toLocaleString()}`);
        });
        break;
        
      case 'read':
        // Mark a notification as read
        if (!notificationId) {
          console.error('Error: notificationId is required for read action');
          process.exit(1);
        }
        
        const notification = await Notification.findOne({ _id: notificationId, userId });
        if (!notification) {
          console.error(`Error: Notification ${notificationId} not found`);
          process.exit(1);
        }
        
        notification.isRead = true;
        await notification.save();
        console.log(`Notification ${notificationId} marked as read`);
        break;
        
      case 'readall':
        // Mark all notifications as read
        const result = await Notification.updateMany(
          { userId, isRead: false },
          { $set: { isRead: true } }
        );
        
        console.log(`Marked ${result.modifiedCount} notifications as read`);
        break;
        
      case 'create':
        // Create a test notification
        const testNotification = new Notification({
          type: 'SYSTEM',
          title: 'Test Notification',
          message: 'This is a test notification created at ' + new Date().toLocaleString(),
          userId,
          isRead: false,
          data: {
            actionUrl: '/restaurant/dashboard'
          }
        });
        
        await testNotification.save();
        console.log(`Test notification created with ID: ${testNotification._id}`);
        break;
        
      case 'delete':
        // Delete a notification
        if (!notificationId) {
          console.error('Error: notificationId is required for delete action');
          process.exit(1);
        }
        
        const deleteResult = await Notification.deleteOne({ _id: notificationId, userId });
        
        if (deleteResult.deletedCount === 1) {
          console.log(`Notification ${notificationId} deleted successfully`);
        } else {
          console.error(`Error: Notification ${notificationId} not found or not deleted`);
        }
        break;
        
      default:
        console.error(`Error: Unknown action "${action}"`);
        console.error('Valid actions: count, list, read, readall, create, delete');
        process.exit(1);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
 
const Notification = require('../models/notification');

/**
 * Create a notification for a user
 * @param {Object} notification - The notification object
 * @param {string} notification.userId - The user ID
 * @param {string} notification.type - The notification type
 * @param {string} notification.title - The notification title
 * @param {string} notification.message - The notification message
 * @param {Object} notification.data - Additional data for the notification
 * @returns {Promise<Object>} The created notification
 */
const createNotification = async (notification) => {
  try {
    const { userId, type, title, message, data = {} } = notification;
    
    const newNotification = new Notification({
      userId,
      type,
      title,
      message,
      data,
      isRead: false,
      createdAt: new Date()
    });
    
    await newNotification.save();
    return newNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create a system notification for all users
 * @param {Object} notification - The notification object
 * @param {string} notification.title - The notification title
 * @param {string} notification.message - The notification message
 * @param {Object} notification.data - Additional data for the notification
 * @returns {Promise<void>}
 */
const createSystemNotificationForAll = async (notification, userIds) => {
  try {
    const { title, message, data = {} } = notification;
    
    const bulkOperations = userIds.map(userId => ({
      insertOne: {
        document: {
          userId,
          type: 'SYSTEM',
          title,
          message,
          data,
          isRead: false,
          createdAt: new Date()
        }
      }
    }));
    
    await Notification.bulkWrite(bulkOperations);
  } catch (error) {
    console.error('Error creating system notifications:', error);
    throw error;
  }
};

/**
 * Create an order notification for a user
 * @param {string} userId - The user ID
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {Object} order - Optional full order object
 * @returns {Promise<Object>} The created notification
 */
const createOrderNotification = async (userId, title, message, order = null) => {
  try {
    // Determine if we're using the new (separate params) or old (order object) format
    let notificationData = {};
    
    if (order && typeof order === 'object') {
      // Old format - receiving full order object
      title = title || 'New Order';
      message = message || `Your order #${order.orderNumber} has been placed successfully.`;
      notificationData = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        actionUrl: `/user/orders/${order._id}`
      };
    } else if (typeof title === 'object' && title !== null) {
      // Very old format - order is passed as first parameter
      order = title;
      title = 'New Order';
      message = `Your order #${order.orderNumber} has been placed successfully.`;
      notificationData = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        actionUrl: `/user/orders/${order._id}`
      };
    } else {
      // New format - receiving separate parameters
      notificationData = {
        actionUrl: `/user/orders`
      };
    }
    
    return await createNotification({
      userId,
      type: 'ORDER',
      title,
      message,
      data: notificationData
    });
  } catch (error) {
    console.error('Error creating order notification:', error);
    // Don't throw, just return null to avoid breaking the caller
    return null;
  }
};

/**
 * Create a restaurant order notification
 * @param {string} restaurantId - The restaurant ID
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {Object} order - Optional full order object
 * @returns {Promise<Object>} The created notification
 */
const createRestaurantOrderNotification = async (restaurantId, title, message, order = null) => {
  try {
    // Determine if we're using the new (separate params) or old (order object) format
    let notificationData = {};
    
    if (order && typeof order === 'object') {
      // Old format - receiving full order object
      title = title || 'New Order Received';
      message = message || `You have received a new order #${order.orderNumber}.`;
      notificationData = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        actionUrl: `/restaurant/orders/${order._id}`
      };
    } else if (typeof title === 'object' && title !== null) {
      // Very old format - order is passed as first parameter
      order = title;
      title = 'New Order Received';
      message = `You have received a new order #${order.orderNumber}.`;
      notificationData = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        actionUrl: `/restaurant/orders/${order._id}`
      };
    } else {
      // New format - receiving separate parameters
      notificationData = {
        actionUrl: `/restaurant/orders`
      };
    }
    
    return await createNotification({
      userId: restaurantId,
      type: 'ORDER',
      title,
      message,
      data: notificationData
    });
  } catch (error) {
    console.error('Error creating restaurant order notification:', error);
    // Don't throw, just return null to avoid breaking the caller
    return null;
  }
};

/**
 * Create a restaurant profile update notification
 * @param {Object} restaurant - The restaurant object
 * @param {Object} changes - The changes object
 * @returns {Promise<Object>} The created notification
 */
const createRestaurantProfileUpdateNotification = async (restaurant, changes) => {
  try {
    const title = 'Profile Update Request';
    const message = 'Your profile update request has been submitted for review.';
    
    return await createNotification({
      userId: restaurant._id,
      type: 'RESTAURANT_UPDATE',
      title,
      message,
      data: {
        changes,
        actionUrl: `/restaurant/profile`
      }
    });
  } catch (error) {
    console.error('Error creating restaurant profile update notification:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  createSystemNotificationForAll,
  createOrderNotification,
  createRestaurantOrderNotification,
  createRestaurantProfileUpdateNotification
}; 
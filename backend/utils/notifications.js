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
 * @param {Object} order - The order object
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} The created notification
 */
const createOrderNotification = async (order, userId) => {
  try {
    const title = 'New Order';
    const message = `Your order #${order.orderNumber} has been placed successfully.`;
    
    return await createNotification({
      userId,
      type: 'ORDER',
      title,
      message,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        actionUrl: `/user/orders/${order._id}`
      }
    });
  } catch (error) {
    console.error('Error creating order notification:', error);
    throw error;
  }
};

/**
 * Create a restaurant order notification
 * @param {Object} order - The order object
 * @param {string} restaurantId - The restaurant ID
 * @returns {Promise<Object>} The created notification
 */
const createRestaurantOrderNotification = async (order, restaurantId) => {
  try {
    const title = 'New Order Received';
    const message = `You have received a new order #${order.orderNumber}.`;
    
    return await createNotification({
      userId: restaurantId,
      type: 'ORDER',
      title,
      message,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        actionUrl: `/restaurant/orders/${order._id}`
      }
    });
  } catch (error) {
    console.error('Error creating restaurant order notification:', error);
    throw error;
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
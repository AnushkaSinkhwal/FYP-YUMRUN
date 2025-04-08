import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { adminAPI, restaurantAPI, userAPI } from '../utils/api';
import { useAuth } from './AuthContext';
import { NOTIFICATION_TYPES } from './types/notification';

// Create notification context
const NotificationContext = createContext();

// Hook to use the notification context
export const useNotification = () => {
  return useContext(NotificationContext);
};

// Notification provider component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Load notifications based on user role
  useEffect(() => {
    if (!currentUser) return;

    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);

      try {
        let response;
        
        // Get notifications based on user role
        switch (currentUser.role) {
          case 'admin':
            response = await adminAPI.getNotifications();
            break;
          case 'restaurant':
          case 'restaurantOwner':
            response = await restaurantAPI.getNotifications();
            break;
          case 'deliveryRider':
            // Assuming there's a delivery API for notifications
            // response = await deliveryAPI.getNotifications();
            // For now, just set empty notifications
            response = { data: { notifications: [] } };
            break;
          default: // Regular user
            response = await userAPI.getNotifications();
        }

        if (response.data) {
          setNotifications(response.data.notifications || []);
          setUnreadCount(response.data.unreadCount || 0);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        setError('Failed to load notifications. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // Fetch notifications every 1 minute
    const intervalId = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(intervalId);
  }, [currentUser]);

  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    if (!currentUser) return;

    try {
      switch (currentUser.role) {
        case 'admin':
          await adminAPI.processNotification(notificationId, 'mark-read');
          break;
        case 'restaurant':
        case 'restaurantOwner':
          await restaurantAPI.markNotificationAsRead(notificationId);
          break;
        case 'deliveryRider':
          // Delivery rider notification logic
          break;
        default: // Regular user
          await userAPI.markNotificationAsRead(notificationId);
      }

      // Update notifications in state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );

      // Update unread count
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));

    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!currentUser) return;

    try {
      switch (currentUser.role) {
        case 'admin':
          await adminAPI.processNotification('all', 'mark-all-read');
          break;
        case 'restaurant':
        case 'restaurantOwner':
          await restaurantAPI.markAllNotificationsAsRead();
          break;
        case 'deliveryRider':
          // Delivery rider notification logic
          break;
        default: // Regular user
          await userAPI.markAllNotificationsAsRead();
      }

      // Update all notifications to read in state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );

      // Reset unread count
      setUnreadCount(0);

    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  // Process a notification action (admin only)
  const processNotification = async (notificationId, action, data = {}) => {
    if (!currentUser || currentUser.role !== 'admin') return;

    try {
      const response = await adminAPI.processNotification(notificationId, action, data);
      
      if (response.data && response.data.success) {
        // Remove the notification from list if it was processed
        if (action === 'approve' || action === 'reject') {
          setNotifications(prevNotifications => 
            prevNotifications.filter(notification => notification.id !== notificationId)
          );
          
          // Update unread count if needed
          const notificationToProcess = notifications.find(n => n.id === notificationId);
          if (notificationToProcess && !notificationToProcess.read) {
            setUnreadCount(prevCount => Math.max(0, prevCount - 1));
          }
        }
        
        return { success: true, message: response.data.message };
      }
      
      return { success: false, message: 'Failed to process notification' };
    } catch (err) {
      console.error('Failed to process notification:', err);
      return { success: false, message: err.message || 'An error occurred' };
    }
  };

  // Provide notification context
  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    processNotification,
    notificationTypes: NOTIFICATION_TYPES
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default NotificationContext; 
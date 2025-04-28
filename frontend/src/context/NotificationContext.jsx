import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { adminAPI, restaurantAPI, userAPI, deliveryAPI } from '../utils/api';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = useAuth();
  const authUser = auth.currentUser;

  // Load notifications based on user role and auth state
  useEffect(() => {
    if (authUser) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [authUser]);

  // Poll for new notifications
  useEffect(() => {
    if (authUser) {
      const interval = setInterval(fetchNotifications, 60000); // Every minute
      return () => clearInterval(interval);
    }
  }, [authUser]);

  // Fetch notifications based on user role
  const fetchNotifications = async () => {
    if (!authUser) return;

    try {
      setLoading(true);
      let response;

      switch (authUser.role) {
        case 'admin':
          response = await adminAPI.getNotifications();
          break;
        case 'restaurant':
          response = await restaurantAPI.getNotifications();
          break;
        case 'delivery_rider':
          response = await deliveryAPI.getNotifications();
          break;
        default:
          response = await userAPI.getNotifications();
      }

      if (response?.data?.success) {
        setNotifications(response.data.notifications || []);
        
        // Count unread notifications
        const unreadNotifications = (response.data.notifications || [])
          .filter(notification => !notification.isRead)
          .length;
          
        setUnreadCount(unreadNotifications);
        setError(null);
      } else {
        console.error('Error fetching notifications:', response?.data?.message);
        setError('Failed to load notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    if (!authUser) return;

    try {
      let response;
      
      switch (authUser.role) {
        case 'admin':
          response = await adminAPI.markNotificationAsRead(notificationId);
          break;
        case 'restaurant':
          response = await restaurantAPI.markNotificationAsRead(notificationId);
          break;
        case 'delivery_rider':
          response = await deliveryAPI.markNotificationAsRead(notificationId);
          break;
        default:
          response = await userAPI.markNotificationAsRead(notificationId);
      }

      if (response?.data?.success) {
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification._id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );
        
        // Decrement unread count
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      } else {
        console.error('Failed to mark notification as read (API Error)');
      }

    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!authUser) return;

    try {
      let response;
      switch (authUser.role) {
        case 'admin':
          response = await adminAPI.processNotification('all', 'mark-all-read');
          break;
        case 'restaurant':
          response = await restaurantAPI.markAllNotificationsAsRead();
          break;
        case 'delivery_rider':
          response = await deliveryAPI.markAllNotificationsAsRead();
          break;
        default:
          response = await userAPI.markAllNotificationsAsRead();
      }

      if (response?.data?.success) {
        setNotifications(prevNotifications => 
          prevNotifications.map(notification => ({ ...notification, isRead: true }))
        );
        setUnreadCount(0);
      } else {
        console.error('Failed to mark all notifications as read (API Error)');
      }

    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  // Process a notification action (admin only)
  const processNotification = async (notificationId, action, data = {}) => {
    if (!authUser || authUser.role !== 'admin') return;

    try {
      const response = await adminAPI.processNotification(notificationId, action, data);
      
      if (response.data && response.data.success) {
        const notificationToProcess = notifications.find(n => n._id === notificationId);
        
        if (action === 'approve' || action === 'reject') {
          setNotifications(prevNotifications => 
            prevNotifications.filter(notification => notification._id !== notificationId)
          );
          
          if (notificationToProcess && !notificationToProcess.isRead) {
            setUnreadCount(prevCount => Math.max(0, prevCount - 1));
          }
        }
        
        return { success: true, message: response.data.message };
      }
      
      return { success: false, message: response?.data?.message || 'Failed to process notification' };
    } catch (err) {
      console.error('Failed to process notification:', err);
      return { success: false, message: err.response?.data?.message || 'An error occurred' };
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
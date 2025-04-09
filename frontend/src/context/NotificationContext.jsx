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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = useAuth();
  const authUser = auth.currentUser;

  // Load notifications based on user role and auth state
  useEffect(() => {
    if (auth.isLoading) {
      setLoading(true);
      return;
    }
    
    if (!auth.isAuthenticated || !authUser) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchNotifications = async () => {
      setError(null);

      try {
        let response;
        
        switch (authUser.role) {
          case 'admin':
            response = await adminAPI.getNotifications();
            break;
          case 'restaurant':
          case 'restaurantOwner':
            response = await restaurantAPI.getNotifications();
            break;
          case 'deliveryRider':
            response = { data: { success: true, notifications: [], unreadCount: 0 } };
            break;
          default:
            response = await userAPI.getNotifications();
        }

        if (response?.data?.success) {
            const fetchedNotifications = response.data.notifications || response.data.data?.notifications || [];
            const fetchedUnreadCount = response.data.unreadCount ?? response.data.data?.unreadCount ?? 0;
            
            setNotifications(fetchedNotifications);
            setUnreadCount(fetchedUnreadCount);
        } else {
            const errorMsg = response?.data?.error?.message || response?.data?.message || 'Failed to fetch notifications format.';
            console.error('Notification API error:', errorMsg);
            setError(errorMsg);
            setNotifications([]);
            setUnreadCount(0);
        }
        
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        if (err.response?.status !== 401) { 
          setError('Failed to load notifications. Please try again later.');
        }
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        if (loading) setLoading(false);
      }
    };

    fetchNotifications();
    
    const intervalId = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(intervalId);

  }, [auth.isLoading, auth.isAuthenticated, authUser]);

  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    if (!authUser) return;

    try {
      let response;
      switch (authUser.role) {
        case 'admin':
          response = await adminAPI.processNotification(notificationId, 'mark-read');
          break;
        case 'restaurant':
        case 'restaurantOwner':
          response = await restaurantAPI.markNotificationAsRead(notificationId);
          break;
        case 'deliveryRider':
          response = { data: { success: true } };
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
    
          const notification = notifications.find(n => n._id === notificationId);
          if (notification && !notification.isRead) {
             setUnreadCount(prevCount => Math.max(0, prevCount - 1));
          }
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
        case 'restaurantOwner':
          response = await restaurantAPI.markAllNotificationsAsRead();
          break;
        case 'deliveryRider':
          response = { data: { success: true } };
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
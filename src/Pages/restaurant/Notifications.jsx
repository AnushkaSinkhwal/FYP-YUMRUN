import { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner } from '../../components/ui';
import { FaCheckCircle, FaBell, FaTrash, FaCheck, FaBoxOpen } from 'react-icons/fa';
import { restaurantAPI } from '../../utils/api';

const RestaurantNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await restaurantAPI.getNotifications();

      if (response.data.success) {
        setNotifications(response.data.notifications || []);
      } else {
        setError('Failed to load notifications: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to connect to the server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await restaurantAPI.markNotificationAsRead(notificationId);

      // Update local state
      setNotifications(notifications.map(notification => 
        notification._id === notificationId ? { ...notification, isRead: true } : notification
      ));
      
      setSuccess('Notification marked as read');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Failed to mark notification as read');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await restaurantAPI.deleteNotification(notificationId);

      // Remove from local state
      setNotifications(notifications.filter(notification => notification._id !== notificationId));
      
      setSuccess('Notification deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'RESTAURANT_UPDATE':
        return <FaCheckCircle className="text-green-500" />;
      case 'ORDER':
        return <FaBoxOpen className="text-blue-500" />;
      case 'SYSTEM':
        return <FaBell className="text-purple-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  const markAllAsRead = async () => {
    try {
      await restaurantAPI.markAllNotificationsAsRead();

      // Update all notifications as read in local state
      setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
      
      setSuccess('All notifications marked as read');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setError('Failed to mark all notifications as read');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  // ... existing code ...
} 
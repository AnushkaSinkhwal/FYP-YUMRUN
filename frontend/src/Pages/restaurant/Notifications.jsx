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
      console.log('Notifications response:', response.data);

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
      const response = await restaurantAPI.markNotificationAsRead(notificationId);
      console.log('Mark as read response:', response.data);

      if (response.data.success) {
        // Update local state
        setNotifications(notifications.map(notification => 
          notification._id === notificationId ? { ...notification, isRead: true } : notification
        ));
        
        setSuccess('Notification marked as read');
      } else {
        setError('Failed to mark notification as read: ' + (response.data.message || 'Unknown error'));
      }
      
      // Clear success/error message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Failed to mark notification as read');
      
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await restaurantAPI.deleteNotification(notificationId);
      console.log('Delete notification response:', response.data);

      if (response.data.success) {
        // Remove from local state
        setNotifications(notifications.filter(notification => notification._id !== notificationId));
        setSuccess('Notification deleted successfully');
      } else {
        setError('Failed to delete notification: ' + (response.data.message || 'Unknown error'));
      }
      
      // Clear success/error message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification');
      
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
      console.log('Attempting to mark all notifications as read...');
      const response = await restaurantAPI.markAllNotificationsAsRead();
      console.log('Mark all as read response:', response.data);

      if (response.data.success) {
        // Update all notifications as read in local state
        setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
        setSuccess('All notifications marked as read');
      } else {
        setError('Failed to mark all notifications as read: ' + (response.data.message || 'Unknown error'));
      }
      
      // Clear success/error message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setError('Failed to mark all notifications as read: ' + (error.response?.data?.message || error.message));
      
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
        
        {notifications.some(notification => !notification.isRead) && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <FaCheck className="mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      )}

      {notifications.length === 0 ? (
        <Card className="p-6 text-center">
          <FaBell className="mx-auto text-4xl text-gray-400 mb-2" />
          <p className="text-gray-600">You have no notifications</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification._id} 
              className={`p-4 ${!notification.isRead ? 'border-l-4 border-yumrun-primary' : ''}`}
            >
              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className={`font-medium ${!notification.isRead ? 'text-gray-800' : 'text-gray-600'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className={`mt-1 text-sm ${!notification.isRead ? 'text-gray-700' : 'text-gray-500'}`}>
                    {notification.message}
                  </p>
                  
                  <div className="mt-2 flex justify-end space-x-2">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => markAsRead(notification._id)}
                      >
                        Mark as Read
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => deleteNotification(notification._id)}
                    >
                      <FaTrash className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RestaurantNotifications; 
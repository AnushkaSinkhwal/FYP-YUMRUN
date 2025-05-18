import { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import { Card, Button, Alert, Spinner, Badge } from '../../components/ui';
import PropTypes from 'prop-types';
import { FaCheck } from 'react-icons/fa';

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const getStatusBadge = (status) => {
    switch(status) {
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return null;
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const getNotificationTitle = (type) => {
    switch(type) {
      case 'PROFILE_UPDATE':
        return 'Profile Update Request';
      case 'RESTAURANT_UPDATE':
        return 'Restaurant Update Request';
      case 'RESTAURANT_REGISTRATION':
        return 'New Restaurant Registration';
      case 'PROFILE_UPDATE_REQUEST':
        return 'Profile Update Request';
      case 'SYSTEM':
        return 'System Notification';
      default:
        return 'Notification';
    }
  };
  
  return (
    <Card className={`mb-3 border-l-4 ${!notification.isRead ? 'border-l-yumrun-primary bg-yellow-50 dark:bg-yellow-900/20' : 'border-l-transparent'}`}>
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-grow">
            <div className="flex items-center mb-1 space-x-2"> 
              <h3 className={`text-base font-semibold ${!notification.isRead ? 'font-bold' : ''}`}>
                {notification.title || getNotificationTitle(notification.type)}
              </h3>
              {!notification.isRead && (
                <Badge variant="primary" size="sm">New</Badge>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {formatDate(notification.createdAt)}
            </p>
          </div>
          {getStatusBadge(notification.status)}
        </div>
        
        <div className="mb-2">
          <p className="text-sm">
            {typeof notification.message === 'object' && notification.message !== null
              ? `From: ${notification.message.from}, To: ${notification.message.to}`
              : notification.message
            }
          </p>
        </div>
        
        <div className="flex justify-end mt-2">
          {!notification.isRead && (
            <Button
              size="sm"
              variant="outline"
              className="ml-2"
              onClick={() => onMarkAsRead(notification._id)}
            >
              <FaCheck className="mr-1" /> Mark as Read
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

NotificationItem.propTypes = {
  notification: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string,
    type: PropTypes.string.isRequired,
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    status: PropTypes.string.isRequired,
    isRead: PropTypes.bool,
    createdAt: PropTypes.string.isRequired,
    processedAt: PropTypes.string,
    rejectionReason: PropTypes.string,
    data: PropTypes.object
  }).isRequired,
  onMarkAsRead: PropTypes.func.isRequired,
};

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminAPI.getNotifications({ limit: 100 });
      if (response?.data?.success) {
        setNotifications(response.data.notifications || []);
        if (response.data.notifications?.length === 0) {
          setError(null);
        }
      } else {
        setError('Failed to load notifications. ' + (response?.data?.message || ''));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('An error occurred while fetching notifications. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMarkAsRead = async (notificationId) => {
    try {
      setError(null);
      
      const response = await adminAPI.markNotificationAsRead(notificationId);
      
      if (response?.data?.success) {
        setNotifications(prevNotifications => 
          prevNotifications.map(notification => 
            notification._id === notificationId 
              ? { ...notification, isRead: true } 
              : notification
          )
        );
      } else {
        setError('Failed to mark notification as read: ' + (response?.data?.message || ''));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('An error occurred while marking notification as read.');
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      setIsLoading(true);
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id);
      for (const id of unreadIds) {
        await adminAPI.markNotificationAsRead(id);
      }
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setError('Failed to mark all as read');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container px-4 py-4 mx-auto">
      <div className="mb-4">
        <h1 className="mb-1 text-xl font-bold">Notifications</h1>
        <p className="text-sm text-gray-600">
          Manage user profile update requests and restaurant registrations
        </p>
      </div>
      
      <div className="flex justify-end mb-4">
        <Button size="sm" variant="outline" onClick={handleMarkAllAsRead}>
          <FaCheck className="mr-1" /> Mark All as Read
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {isLoading && (
        <div className="flex justify-center py-10">
          <Spinner size="lg" />
        </div>
      )}
      
      {!isLoading && notifications.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-gray-600">No notifications found</p>
        </Card>
      )}
      
      {!isLoading && notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map(notification => (
            <NotificationItem 
              key={notification._id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNotifications; 
import { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import { Card, Button, Alert, Spinner, Badge } from '../../components/ui';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const navigate = useNavigate();
  
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
  
  const handleViewDetails = () => {
    onMarkAsRead(notification._id);
    
    // Determine the appropriate route based on notification type
    if (notification.type === 'RESTAURANT_UPDATE' || 
        notification.type === 'RESTAURANT_REGISTRATION' || 
        notification.type === 'PROFILE_UPDATE_REQUEST') {
      
      // Extract the approval ID from the notification data
      const approvalId = notification.data?.approvalId;
      
      // Navigate to restaurant approvals page with the approval ID
      if (approvalId) {
        navigate('/admin/restaurant-approvals', { 
          state: { 
            approvalId: approvalId,
            autoOpenDetails: true 
          } 
        });
      } else {
        navigate('/admin/restaurant-approvals');
      }
    } else if (notification.type === 'PROFILE_UPDATE') {
      navigate(`/admin/users/${notification.data?.userId || ''}`);
    } else {
      // Default to notification list if no specific location
      navigate('/admin/notifications');
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
          <Button 
            size="sm"
            variant="secondary"
            onClick={handleViewDetails}
          >
            View Details
          </Button>
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
  const [processSuccess, setProcessSuccess] = useState(null);
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setProcessSuccess(null);
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
      setProcessSuccess(null);
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
  
  return (
    <div className="container px-4 py-4 mx-auto">
      <div className="mb-4">
        <h1 className="mb-1 text-xl font-bold">Notifications</h1>
        <p className="text-sm text-gray-600">
          Manage user profile update requests and restaurant registrations
        </p>
      </div>
      
      {processSuccess && (
        <Alert variant="success" className="mb-4" dismissible onDismiss={() => setProcessSuccess(null)}>
          {processSuccess}
        </Alert>
      )}
      
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
import { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import { Card, Button, Alert, Spinner, Badge } from '../../components/ui';
import PropTypes from 'prop-types';

const NotificationItem = ({ notification, onProcess, onMarkAsRead }) => {
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
        
        {notification.data && Object.keys(notification.data).length > 0 && (
          <div className="p-2 mb-2 text-xs rounded-md bg-gray-50 dark:bg-gray-800">
            <h4 className="mb-1 font-medium">Details:</h4>
            <pre className="whitespace-pre-wrap">{JSON.stringify(notification.data, null, 2)}</pre>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-2">
          {notification.status === 'PENDING' ? (
            <div className="flex space-x-2">
              <Button 
                variant="success" 
                size="xs"
                onClick={() => onProcess(notification._id, 'approve')}
              >
                Approve
              </Button>
              <Button 
                variant="danger" 
                size="xs"
                onClick={() => onProcess(notification._id, 'reject')}
              >
                Reject
              </Button>
            </div>
          ) : (
            <div></div>
          )}
          
          {!notification.isRead && (
            <Button 
              variant="outline" 
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification._id);
              }}
            >
              Mark as Read
            </Button>
          )}
        </div>
        
        {notification.status === 'REJECTED' && notification.rejectionReason && (
          <div className="mt-3">
            <p className="text-sm font-medium text-red-600">Rejection reason: {notification.rejectionReason}</p>
          </div>
        )}
        
        {notification.status !== 'PENDING' && notification.processedAt && (
          <div className="mt-3 text-xs text-gray-500">
            {notification.status === 'APPROVED' ? 'Approved' : 'Rejected'} on {formatDate(notification.processedAt)}
          </div>
        )}
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
  onProcess: PropTypes.func.isRequired,
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
  
  const handleProcess = async (notificationId, action, data = {}) => {
    let reason = data.reason;
    if (action === 'reject' && !reason) {
        reason = prompt("Please provide a reason for rejection (optional):");
        if (reason === null) return;
        data.reason = reason || 'Rejected by admin';
    }
    
    setIsLoading(true);
    setError(null);
    setProcessSuccess(null);

    try {
      const response = await adminAPI.processNotification(notificationId, action, data);
      
      if (response.data.success) {
        setNotifications(prevNotifications => 
          prevNotifications.map(notif => 
            notif._id === notificationId 
              ? { ...notif, status: action === 'approve' ? 'APPROVED' : 'REJECTED', processedAt: new Date(), isRead: true, rejectionReason: action === 'reject' ? data.reason : undefined }
              : notif
          )
        );
        
        setProcessSuccess(`Request has been ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
        setTimeout(() => setProcessSuccess(null), 3000);

        const event = new CustomEvent('notifications-updated');
        window.dispatchEvent(event);

      } else {
        setError(response.data.message || `Failed to ${action} notification`);
      }
    } catch (error) {
      console.error(`Error ${action}ing notification:`, error);
      setError(`An error occurred while ${action}ing the notification: ${error?.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMarkAsRead = async (notificationId) => {
    try {
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      
      const response = await adminAPI.markNotificationAsRead(notificationId);
      
      if (!response.data.success) {
        setNotifications(prevNotifications => 
          prevNotifications.map(notif => 
            notif._id === notificationId ? { ...notif, isRead: false } : notif
          )
        );
        setError(response.data.message || 'Failed to mark notification as read');
      } else {
        const event = new CustomEvent('notifications-updated');
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('An error occurred while marking the notification as read.');
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif._id === notificationId ? { ...notif, isRead: false } : notif
        )
      );
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
              onProcess={handleProcess}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNotifications; 
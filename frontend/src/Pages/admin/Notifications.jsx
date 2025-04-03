import { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import { Card, Button, Alert, Spinner, Badge } from '../../components/ui';
import PropTypes from 'prop-types';

const NotificationItem = ({ notification, onProcess }) => {
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
    <Card className="mb-4">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="mb-1 text-lg font-semibold">
              {notification.title || getNotificationTitle(notification.type)}
            </h3>
            <p className="text-sm text-gray-500">
              {formatDate(notification.createdAt)}
            </p>
          </div>
          {getStatusBadge(notification.status)}
        </div>
        
        <p className="mb-4">{notification.message}</p>
        
        {notification.type === 'PROFILE_UPDATE' && notification.data && (
          <div className="p-3 mb-4 rounded-md bg-gray-50 dark:bg-gray-800">
            <h4 className="mb-2 font-medium">Requested Changes:</h4>
            <ul className="space-y-1">
              {notification.data.name && (
                <li>
                  <span className="font-medium">Name:</span> {notification.data.name}
                </li>
              )}
              {notification.data.email && (
                <li>
                  <span className="font-medium">Email:</span> {notification.data.email}
                </li>
              )}
              {notification.data.phone && (
                <li>
                  <span className="font-medium">Phone:</span> {notification.data.phone}
                </li>
              )}
              {notification.data.restaurantDetails && (
                <>
                  {notification.data.restaurantDetails.name && (
                    <li>
                      <span className="font-medium">Restaurant Name:</span> {notification.data.restaurantDetails.name}
                    </li>
                  )}
                  {notification.data.restaurantDetails.address && (
                    <li>
                      <span className="font-medium">Restaurant Address:</span> {notification.data.restaurantDetails.address}
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>
        )}
        
        {notification.status === 'PENDING' && (
          <div className="flex mt-2 space-x-2">
            <Button 
              variant="success" 
              size="sm"
              onClick={() => onProcess(notification._id, 'approve')}
            >
              Approve
            </Button>
            <Button 
              variant="danger" 
              size="sm"
              onClick={() => onProcess(notification._id, 'reject')}
            >
              Reject
            </Button>
          </div>
        )}
        
        {notification.status === 'REJECTED' && notification.rejectionReason && (
          <div className="mt-3">
            <p className="text-sm font-medium text-red-600">Rejection reason: {notification.rejectionReason}</p>
          </div>
        )}
        
        {notification.status !== 'PENDING' && notification.processedAt && (
          <div className="mt-3 text-sm text-gray-500">
            {notification.status === 'APPROVED' ? 'Approved' : 'Rejected'} on {formatDate(notification.processedAt)}
          </div>
        )}
      </div>
    </Card>
  );
};

// Define prop types for the NotificationItem component
NotificationItem.propTypes = {
  notification: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string,
    type: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    processedAt: PropTypes.string,
    rejectionReason: PropTypes.string,
    data: PropTypes.shape({
      name: PropTypes.string,
      email: PropTypes.string,
      phone: PropTypes.string,
      restaurantDetails: PropTypes.shape({
        name: PropTypes.string,
        address: PropTypes.string
      })
    })
  }).isRequired,
  onProcess: PropTypes.func.isRequired
};

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processSuccess, setProcessSuccess] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  
  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getNotifications();
      if (response?.data?.success) {
        setNotifications(response.data.notifications || []);
        
        // If there are no notifications, don't show an error
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
  
  const handleProcess = async (notificationId, action) => {
    if (action === 'reject') {
      // For rejection, we need a reason
      const notification = notifications.find(n => n._id === notificationId);
      setCurrentNotification(notification);
      setShowRejectionDialog(true);
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await adminAPI.processNotification(notificationId, action);
      
      if (response.data.success) {
        // Update the notification in the state
        setNotifications(prevNotifications => 
          prevNotifications.map(notif => 
            notif._id === notificationId 
              ? { ...notif, status: action === 'approve' ? 'APPROVED' : 'REJECTED', processedAt: new Date() } 
              : notif
          )
        );
        
        setProcessSuccess(`Request has been ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setProcessSuccess(null);
        }, 3000);
      } else {
        setError(response.data.message || `Failed to ${action} notification`);
      }
    } catch (error) {
      console.error(`Error ${action}ing notification:`, error);
      setError(`An error occurred while ${action}ing the notification. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReject = async () => {
    if (!currentNotification || !rejectionReason.trim()) return;
    
    try {
      setIsLoading(true);
      const response = await adminAPI.processNotification(currentNotification._id, 'reject', { reason: rejectionReason });
      
      if (response.data.success) {
        // Update the notification in the state
        setNotifications(prevNotifications => 
          prevNotifications.map(notif => 
            notif._id === currentNotification._id 
              ? { 
                  ...notif, 
                  status: 'REJECTED', 
                  processedAt: new Date(),
                  rejectionReason: rejectionReason  
                } 
              : notif
          )
        );
        
        setProcessSuccess('Request has been rejected successfully.');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setProcessSuccess(null);
        }, 3000);
      } else {
        setError(response.data.message || 'Failed to reject notification');
      }
    } catch (error) {
      console.error('Error rejecting notification:', error);
      setError('An error occurred while rejecting the notification');
    } finally {
      setIsLoading(false);
      setShowRejectionDialog(false);
      setRejectionReason('');
      setCurrentNotification(null);
    }
  };
  
  // Cancel rejection dialog
  const handleCancelReject = () => {
    setShowRejectionDialog(false);
    setRejectionReason('');
    setCurrentNotification(null);
  };
  
  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold">Notifications</h1>
        <p className="text-gray-600">
          Manage user profile update requests and restaurant registrations
        </p>
      </div>
      
      {/* Success or error alerts */}
      {processSuccess && (
        <Alert variant="success" className="mb-4">
          {processSuccess}
        </Alert>
      )}
      
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-10">
          <Spinner size="lg" />
        </div>
      )}
      
      {/* Notifications list */}
      {!isLoading && notifications.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-600">No notifications found</p>
        </Card>
      )}
      
      {!isLoading && notifications.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {notifications.map(notification => (
            <NotificationItem 
              key={notification._id}
              notification={notification}
              onProcess={handleProcess}
            />
          ))}
        </div>
      )}
      
      {/* Rejection Dialog */}
      {showRejectionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold">Provide Rejection Reason</h3>
            <textarea
              className="w-full p-2 mb-4 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              rows="3"
              placeholder="Enter reason for rejection"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            ></textarea>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancelReject}>
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications; 
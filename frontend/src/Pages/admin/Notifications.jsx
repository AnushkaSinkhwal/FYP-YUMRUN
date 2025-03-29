import { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import { Card, Button, Alert, Spinner, Badge } from '../../components/ui';

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
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-semibold mb-1">
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
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md mb-4">
            <h4 className="font-medium mb-2">Requested Changes:</h4>
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
          <div className="flex space-x-2 mt-2">
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
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const response = await adminAPI.getNotifications();
        if (response.data.success) {
          setNotifications(response.data.notifications);
        } else {
          setError('Failed to load notifications');
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setError('An error occurred while fetching notifications');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotifications();
  }, []);
  
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
      setError(`An error occurred while ${action}ing the notification`);
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
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Notifications</h1>
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Provide Rejection Reason</h3>
            <textarea
              className="w-full p-2 border rounded-md mb-4 dark:bg-gray-700 dark:border-gray-600"
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
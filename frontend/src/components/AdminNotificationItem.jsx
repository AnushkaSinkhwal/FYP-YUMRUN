import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, Dialog, Textarea, Alert } from './ui';
import { 
  FiUser, 
  FiShoppingBag, 
  FiCoffee, 
  FiAlertCircle, 
  FiClock, 
  FiCheck, 
  FiX, 
  FiMessageSquare 
} from 'react-icons/fi';
import { useNotification } from '../context/NotificationContext';
import { NOTIFICATION_TYPES } from '../context/types/notification';

const AdminNotificationItem = ({ notification }) => {
  const navigate = useNavigate();
  const { markAsRead, processNotification } = useNotification();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionResult, setActionResult] = useState(null);

  // Get icon based on notification type
  const getNotificationIcon = () => {
    const iconProps = { size: 18, className: 'text-gray-600' };
    
    switch (notification.type) {
      case NOTIFICATION_TYPES.ADMIN_RESTAURANT_APPROVAL:
      case NOTIFICATION_TYPES.RESTAURANT_UPDATE:
      case NOTIFICATION_TYPES.RESTAURANT_REGISTRATION:
        return <FiCoffee {...iconProps} />;
      case NOTIFICATION_TYPES.ADMIN_USER_PROFILE_CHANGE:
      case NOTIFICATION_TYPES.PROFILE_UPDATE:
      case NOTIFICATION_TYPES.PROFILE_UPDATE_REQUEST:
        return <FiUser {...iconProps} />;
      case NOTIFICATION_TYPES.ADMIN_PAYMENT_ISSUE:
        return <FiShoppingBag {...iconProps} />;
      default:
        return <FiAlertCircle {...iconProps} />;
    }
  };

  // Format relative time
  const getRelativeTime = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMs = now - notificationDate;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    }
    
    return notificationDate.toLocaleDateString();
  };

  // Handle clicking on a notification to view details
  const handleNotificationClick = () => {
    if (!notification.read) {
      markAsRead(notification.id || notification._id);
    }
    
    // Navigate to relevant page based on notification type
    switch (notification.type) {
      case NOTIFICATION_TYPES.ADMIN_RESTAURANT_APPROVAL:
      case 'RESTAURANT_UPDATE':
      case 'RESTAURANT_REGISTRATION':
      case 'PROFILE_UPDATE_REQUEST':
        navigate('/admin/restaurant-approvals');
        break;
      case NOTIFICATION_TYPES.ADMIN_USER_PROFILE_CHANGE:
      case 'PROFILE_UPDATE':
        navigate(`/admin/users/${notification.data?.userId || ''}`);
        break;
      case NOTIFICATION_TYPES.ADMIN_PAYMENT_ISSUE:
        navigate(`/admin/orders/${notification.data?.orderId || ''}`);
        break;
      default:
        // Just mark as read without navigation
        break;
    }
  };

  // Handle approval action
  const handleApprove = async () => {
    setIsProcessing(true);
    setActionResult(null);
    
    const result = await processNotification(
      notification.id || notification._id, 
      'approve'
    );
    
    setIsProcessing(false);
    setActionResult(result);
    
    // Clear result after 3 seconds
    if (result.success) {
      setTimeout(() => {
        setActionResult(null);
      }, 3000);
    }
  };

  // Handle rejection dialog
  const openRejectDialog = () => {
    setShowRejectDialog(true);
  };

  const closeRejectDialog = () => {
    setShowRejectDialog(false);
    setRejectionReason('');
  };

  // Handle rejection action
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      return;
    }
    
    setIsProcessing(true);
    
    const result = await processNotification(
      notification.id || notification._id, 
      'reject', 
      { feedback: rejectionReason }
    );
    
    setIsProcessing(false);
    closeRejectDialog();
    setActionResult(result);
    
    // Clear result after 3 seconds
    if (result.success) {
      setTimeout(() => {
        setActionResult(null);
      }, 3000);
    }
  };

  return (
    <Card 
      className={`p-4 mb-4 border-l-4 transition cursor-pointer hover:bg-gray-50 ${
        notification.read ? 'border-l-gray-200' : 'border-l-yumrun-primary'
      }`}
      onClick={handleNotificationClick}
    >
      <div className="flex justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getNotificationIcon()}
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-900">
                {notification.title}
              </h3>
              {!notification.read && (
                <Badge variant="primary" size="sm" className="animate-pulse">
                  New
                </Badge>
              )}
            </div>
            
            <p className="mt-1 text-sm text-gray-600">
              {typeof notification.message === 'object' && notification.message !== null
                ? `From: ${notification.message.from}, To: ${notification.message.to}`
                : notification.message
              }
            </p>
            
            <p className="flex items-center mt-1 text-xs text-gray-500">
              <FiClock className="mr-1" size={12} />
              {getRelativeTime(notification.createdAt)}
            </p>
          </div>
        </div>
        
        {notification.requiresAction && (
          <div className="flex flex-shrink-0 ml-4 space-x-2">
            <Button 
              size="sm" 
              variant="success" 
              onClick={(e) => {
                e.stopPropagation();
                handleApprove();
              }}
              disabled={isProcessing}
            >
              <FiCheck className="mr-1" />
              Approve
            </Button>
            
            <Button 
              size="sm" 
              variant="error" 
              onClick={(e) => {
                e.stopPropagation();
                openRejectDialog();
              }}
              disabled={isProcessing}
            >
              <FiX className="mr-1" />
              Reject
            </Button>
          </div>
        )}
      </div>
      
      {actionResult && (
        <div className="mt-3">
          <Alert 
            variant={actionResult.success ? 'success' : 'error'}
            dismissible
            onDismiss={() => setActionResult(null)}
          >
            {actionResult.message}
          </Alert>
        </div>
      )}
      
      {/* Rejection Dialog */}
      <Dialog 
        open={showRejectDialog} 
        onOpenChange={closeRejectDialog}
        title="Provide Rejection Reason"
      >
        <div className="mb-4">
          <p className="mb-3 text-sm text-gray-600">
            Please provide a reason for rejecting this request. This feedback will be sent to the user.
          </p>
          
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
            rows={4}
            className="w-full"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={closeRejectDialog}
          >
            Cancel
          </Button>
          <Button 
            variant="error" 
            onClick={handleReject}
            disabled={!rejectionReason.trim() || isProcessing}
          >
            <FiMessageSquare className="mr-2" />
            Submit Feedback
          </Button>
        </div>
      </Dialog>
    </Card>
  );
};

AdminNotificationItem.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    type: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    read: PropTypes.bool.isRequired,
    createdAt: PropTypes.string.isRequired,
    requiresAction: PropTypes.bool,
    data: PropTypes.object
  }).isRequired
};

export default AdminNotificationItem; 
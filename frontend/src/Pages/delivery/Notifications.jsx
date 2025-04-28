import { useState, useEffect } from 'react';
import { Card, Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent, Spinner } from '../../components/ui';
import { FaBell, FaCheck, FaInfo, FaExclamationTriangle } from 'react-icons/fa';
import { deliveryAPI } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const DeliveryNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await deliveryAPI.getNotifications();

      if (response?.data?.success) {
        setNotifications(response.data.notifications || []);
      } else {
        setError('Failed to load notifications: ' + (response.data?.message || 'Unknown error'));
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to connect to the server. Please try again later.');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'order':
      case 'delivery_assignment':
        return <FaBell className="h-5 w-5 text-blue-500" />;
      case 'earnings':
        return <FaCheck className="h-5 w-5 text-green-500" />;
      case 'system':
        return <FaInfo className="h-5 w-5 text-purple-500" />;
      default:
        return <FaExclamationTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const filterNotifications = (status) => {
    if (status === 'all') return notifications;
    return notifications.filter(notification => 
      status === 'unread' ? !notification.isRead : notification.isRead
    );
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await deliveryAPI.markNotificationAsRead(notificationId);
      
      if (response?.data?.success) {
        setNotifications(prev =>
          prev.map(notification =>
            notification._id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    
    // Navigate to the appropriate page based on the notification type
    if (notification.data?.orderId) {
      navigate(`/delivery/orders/${notification.data.orderId}`);
    } else if (notification.data?.actionUrl) {
      navigate(notification.data.actionUrl);
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
    <div className="container px-4 py-6 mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {filterNotifications(activeTab).length === 0 ? (
            <div className="text-center p-10 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <FaBell className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-500">No notifications found</p>
            </div>
          ) : (
            filterNotifications(activeTab).map(notification => (
              <Card 
                key={notification._id} 
                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${!notification.isRead ? 'border-l-4 border-blue-500' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {notification.title}
                        {!notification.isRead && (
                          <Badge className="ml-2 animate-pulse" variant="blue">New</Badge>
                        )}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
      
      {notifications.filter(n => !n.isRead).length > 0 && (
        <div className="mt-4 flex justify-end">
          <Button 
            variant="outline" 
            onClick={async () => {
              try {
                await deliveryAPI.markAllNotificationsAsRead();
                setNotifications(prev => 
                  prev.map(notification => ({ ...notification, isRead: true }))
                );
              } catch (error) {
                console.error('Error marking all as read:', error);
              }
            }}
          >
            Mark All as Read
          </Button>
        </div>
      )}
    </div>
  );
};

export default DeliveryNotifications; 
import { useState, useEffect } from 'react';
import { Card, Button, Input, Spinner } from '../../components/ui';
import { FaSearch, FaBell, FaCheck, FaInfo, FaGift, FaShoppingBag } from 'react-icons/fa';
import { userAPI } from '../../utils/api';

const UserNotifications = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await userAPI.getNotifications();

      if (response.data.success) {
        setNotifications(response.data.notifications || []);
      } else {
        setError('Failed to load notifications: ' + (response.data.message || 'Unknown error'));
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

  const filteredNotifications = notifications.filter(notification =>
    notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notification.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getNotificationIcon = (type) => {
    switch (type.toUpperCase()) {
      case 'ORDER':
        return <FaShoppingBag className="h-5 w-5 text-blue-500" />;
      case 'REWARD':
        return <FaGift className="h-5 w-5 text-yellow-500" />;
      case 'SYSTEM':
        return <FaInfo className="h-5 w-5 text-green-500" />;
      default:
        return <FaBell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (isRead) => {
    return !isRead ? 'bg-blue-100 dark:bg-blue-900/30' : '';
  };

  const filterNotifications = (status) => {
    if (status === 'all') return filteredNotifications;
    return filteredNotifications.filter(notification => 
      status === 'unread' ? !notification.isRead : notification.isRead
    );
  };

  const markAsRead = async (id) => {
    try {
      await userAPI.markNotificationAsRead(id);
      
      // Update state
      setNotifications(notifications.map(notification => 
        notification._id === id ? { ...notification, isRead: true } : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      
      // Update state anyway for better UX
      setNotifications(notifications.map(notification => 
        notification._id === id ? { ...notification, isRead: true } : notification
      ));
    }
  };

  const markAllAsRead = async () => {
    try {
      await userAPI.markAllNotificationsAsRead();
      
      // Update state
      setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      
      // Update state anyway for better UX
      setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllAsRead}>
            Mark All as Read
          </Button>
          <div className="relative w-64">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'all' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('all')}
        >
          All
        </Button>
        <Button
          variant={activeTab === 'unread' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('unread')}
        >
          Unread
        </Button>
        <Button
          variant={activeTab === 'read' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('read')}
        >
          Read
        </Button>
      </div>

      <div className="space-y-4">
        {filterNotifications(activeTab).map(notification => (
          <Card key={notification._id} className={`p-4 ${getStatusColor(!notification.isRead)}`}>
            <div className="flex items-start gap-4">
              <div className="mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{notification.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => markAsRead(notification._id)}
                    >
                      <FaCheck className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {notification.data && notification.data.actionUrl && (
                  <Button 
                    variant="link" 
                    className="p-0 h-auto mt-2"
                    onClick={() => window.location.href = notification.data.actionUrl}
                  >
                    View Details
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filterNotifications(activeTab).length === 0 && (
        <div className="text-center py-12">
          <FaBell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No notifications</h3>
          <p className="text-gray-500 mt-2">
            {activeTab === 'all' && "You don't have any notifications yet."}
            {activeTab === 'unread' && "You don't have any unread notifications."}
            {activeTab === 'read' && "You don't have any read notifications."}
          </p>
        </div>
      )}
    </div>
  );
};

export default UserNotifications; 
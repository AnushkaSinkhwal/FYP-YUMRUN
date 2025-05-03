import { useState, useEffect } from 'react';
import { Card, Button, Input, Spinner, Alert } from '../../components/ui';
import { FaSearch, FaBell, FaCheck, FaInfo, FaGift, FaShoppingBag } from 'react-icons/fa';
import { userAPI } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const UserNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getNotifications();

      if (response.data.success) {
        // Normalize notifications: map 'read' to isRead
        const items = (response.data.data || []).map(n => ({ ...n, isRead: Boolean(n.read) }));
        setNotifications(items);
        setError('');
      } else {
        setNotifications([]);
        setError('Failed to load notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter(notification =>
    (notification.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (notification.message || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCount = notifications.length;
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const readCount = totalCount - unreadCount;

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

  const filterNotifications = (status) => {
    if (status === 'all') return filteredNotifications;
    return filteredNotifications.filter(n => status === 'unread' ? !n.isRead : n.isRead);
  };

  const markAsRead = async (id) => {
    try {
      await userAPI.markNotificationAsRead(id);
      
      // Update state
      const updated = notifications.map(n => n._id === id ? { ...n, isRead: true } : n);
      setNotifications(updated);
      setSuccess('Notification marked as read');
      setError('');
      // Notify other components to refresh counts
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      
      // Update state anyway for better UX
      const updated = notifications.map(n => n._id === id ? { ...n, isRead: true } : n);
      setNotifications(updated);
      setError('Failed to mark notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      await userAPI.markAllNotificationsAsRead();
      
      // Update state
      const updatedAll = notifications.map(n => ({ ...n, isRead: true }));
      setNotifications(updatedAll);
      setSuccess('All notifications marked as read');
      setError('');
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      
      const updatedAll = notifications.map(n => ({ ...n, isRead: true }));
      setNotifications(updatedAll);
      setError('Failed to mark all notifications');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="flex gap-2">
          {notifications.some(n => !n.isRead) && (
            <Button variant="outline" onClick={markAllAsRead}>
              Mark All as Read
            </Button>
          )}
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

      <div className="flex gap-2 border-b mt-4 justify-center md:justify-start">
        <Button
          variant={activeTab === 'all' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('all')}
        >
          All ({totalCount})
        </Button>
        <Button
          variant={activeTab === 'unread' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('unread')}
        >
          Unread ({unreadCount})
        </Button>
        <Button
          variant={activeTab === 'read' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('read')}
        >
          Read ({readCount})
        </Button>
      </div>

      <div className="space-y-4">
        {filterNotifications(activeTab).map(notification => (
          <Card 
            key={notification._id} 
            className={`p-4 ${!notification.isRead ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}
          >
            <div className="flex items-start gap-4">
              <div className="mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{notification.title || 'Notification'}</h3>
                    <p className="text-sm text-gray-600 mt-1">{notification.message || ''}</p>
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
                    onClick={() => navigate(notification.data.actionUrl)}
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
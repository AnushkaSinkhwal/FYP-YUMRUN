import { useState } from 'react';
import { Card, Button, Input } from '../../components/ui';
import { FaSearch, FaBell, FaCheck, FaInfo, FaGift, FaShoppingBag } from 'react-icons/fa';

const UserNotifications = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Sample data - replace with API data
  const notifications = [
    {
      id: 1,
      type: 'order',
      title: 'Order Delivered',
      message: 'Your order #123456 from Burger Palace has been delivered successfully.',
      status: 'unread',
      createdAt: '2024-03-15T10:30:00',
      link: '/orders/123456'
    },
    {
      id: 2,
      type: 'reward',
      title: 'New Reward Available',
      message: 'You have enough points to redeem a free delivery!',
      status: 'unread',
      createdAt: '2024-03-15T09:15:00',
      link: '/rewards'
    },
    {
      id: 3,
      type: 'system',
      title: 'System Update',
      message: 'We have updated our app with new features. Check them out!',
      status: 'read',
      createdAt: '2024-03-14T15:45:00',
      link: '/updates'
    },
    {
      id: 4,
      type: 'order',
      title: 'Order Confirmed',
      message: 'Your order #123457 from Pizza Express has been confirmed.',
      status: 'read',
      createdAt: '2024-03-14T12:20:00',
      link: '/orders/123457'
    }
  ];

  const filteredNotifications = notifications.filter(notification =>
    notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notification.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return <FaShoppingBag className="h-5 w-5 text-blue-500" />;
      case 'reward':
        return <FaGift className="h-5 w-5 text-yellow-500" />;
      case 'system':
        return <FaInfo className="h-5 w-5 text-green-500" />;
      default:
        return <FaBell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    return status === 'unread' ? 'bg-blue-100 dark:bg-blue-900/30' : '';
  };

  const filterNotifications = (status) => {
    if (status === 'all') return filteredNotifications;
    return filteredNotifications.filter(notification => notification.status === status);
  };

  const markAsRead = (id) => {
    // TODO: Implement API call to mark notification as read
    console.log('Mark as read:', id);
  };

  const markAllAsRead = () => {
    // TODO: Implement API call to mark all notifications as read
    console.log('Mark all as read');
  };

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
          <Card key={notification.id} className={`p-4 ${getStatusColor(notification.status)}`}>
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
                  {notification.status === 'unread' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <FaCheck className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Button variant="link" className="p-0 h-auto mt-2">
                  View Details
                </Button>
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
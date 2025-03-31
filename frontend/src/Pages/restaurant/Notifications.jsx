import { useState } from 'react';
import { Card, Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';
import { FaBell, FaCheck, FaInfo } from 'react-icons/fa';

const RestaurantNotifications = () => {
  const [notifications] = useState([
    {
      id: 1,
      type: 'order',
      title: 'New Order Received',
      message: 'Order #123 has been placed by John Doe',
      status: 'unread',
      createdAt: new Date().toISOString(),
      link: '/restaurant/orders/123'
    },
    {
      id: 2,
      type: 'profile_update',
      title: 'Profile Update Approved',
      message: 'Your restaurant profile changes have been approved by admin',
      status: 'read',
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      link: '/restaurant/profile'
    },
    {
      id: 3,
      type: 'system',
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tomorrow at 2 AM',
      status: 'unread',
      createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      link: null
    }
  ]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return <FaBell className="w-5 h-5 text-blue-500" />;
      case 'profile_update':
        return <FaCheck className="w-5 h-5 text-green-500" />;
      case 'system':
        return <FaInfo className="w-5 h-5 text-yellow-500" />;
      default:
        return <FaBell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'unread':
        return 'warning';
      case 'read':
        return 'default';
      default:
        return 'default';
    }
  };

  const filterNotifications = (status) => {
    return notifications.filter(notification => notification.status === status);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Notifications</h1>
        <Button variant="outline" className="flex items-center gap-2">
          <FaCheck className="w-4 h-4" />
          Mark All as Read
        </Button>
      </div>

      <Tabs defaultValue="unread" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>

        {['unread', 'read'].map(status => (
          <TabsContent key={status} value={status}>
            <div className="space-y-4">
              {filterNotifications(status).map(notification => (
                <Card key={notification.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                          {notification.title}
                        </h3>
                        <Badge variant={getStatusColor(notification.status)}>
                          {notification.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                        {notification.link && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={notification.link}>View Details</a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {filterNotifications(status).length === 0 && (
                <Card className="p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    No {status} notifications
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default RestaurantNotifications; 
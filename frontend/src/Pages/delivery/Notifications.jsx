import { useState } from 'react';
import { Card, Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';
import { FaBell, FaCheck, FaInfo, FaExclamationTriangle } from 'react-icons/fa';

const DeliveryNotifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'order',
      title: 'New Delivery Available',
      message: 'A new order from Burger Palace is ready for pickup',
      status: 'unread',
      createdAt: '2024-03-20T10:30:00',
      link: '/delivery/orders/123'
    },
    {
      id: 2,
      type: 'system',
      title: 'System Update',
      message: 'New features added to the delivery app',
      status: 'read',
      createdAt: '2024-03-20T09:15:00',
      link: '/delivery/updates'
    },
    {
      id: 3,
      type: 'earnings',
      title: 'Weekly Earnings Processed',
      message: 'Your earnings for last week have been processed',
      status: 'unread',
      createdAt: '2024-03-20T08:00:00',
      link: '/delivery/earnings'
    }
  ]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return <FaBell className="h-5 w-5" />;
      case 'earnings':
        return <FaCheck className="h-5 w-5" />;
      case 'system':
        return <FaInfo className="h-5 w-5" />;
      default:
        return <FaExclamationTriangle className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status) => {
    return status === 'unread' 
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-300'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300';
  };

  const filterNotifications = (status) => {
    return notifications.filter(notification => notification.status === status);
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, status: 'read' }
          : notification
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button variant="outline" className="gap-2">
          <FaCheck className="h-4 w-4" />
          Mark All as Read
        </Button>
      </div>

      <Tabs defaultValue="unread" className="space-y-4">
        <TabsList>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="space-y-4">
          {filterNotifications('unread').map(notification => (
            <Card key={notification.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-full dark:bg-blue-800/30">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{notification.title}</h3>
                    <Badge className={getStatusColor(notification.status)}>
                      {notification.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    {notification.message}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => markAsRead(notification.id)}>
                        Mark as Read
                      </Button>
                      <Button size="sm" asChild>
                        <a href={notification.link}>View Details</a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
          {filterNotifications('read').map(notification => (
            <Card key={notification.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-100 rounded-full dark:bg-gray-800/30">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{notification.title}</h3>
                    <Badge className={getStatusColor(notification.status)}>
                      {notification.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    {notification.message}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                    <Button size="sm" asChild>
                      <a href={notification.link}>View Details</a>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeliveryNotifications; 
import { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner, Tabs, TabsList, TabsTrigger, TabsContent, Alert } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../utils/api';
import LoyaltyDashboard from '../../components/Loyalty/LoyaltyDashboard';
import HealthProfile from '../../components/Profile/HealthProfile';
import { formatDate } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaHeart, FaMoneyBillWave, FaClipboardList, FaUser, FaBell } from 'react-icons/fa';

const UserDashboard = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    favoriteRestaurants: 0,
    savedAmount: 0,
    pendingOrders: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
    fetchNotifications();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard data
      const dashboardResponse = await userAPI.getDashboard();
      if (dashboardResponse.data?.success) {
        setDashboardData(dashboardResponse.data.data || {
          totalOrders: 0,
          favoriteRestaurants: 0,
          savedAmount: 0,
          pendingOrders: 0,
          recentActivity: []
        });
      }
      
      // Fetch user profile
      const profileResponse = await userAPI.getProfile();
      if (profileResponse.data?.success) {
        setProfile(profileResponse.data.data);
      }
      
      // Fetch order history
      const orderResponse = await userAPI.getOrders();
      if (orderResponse.data?.success) {
        setOrderHistory(orderResponse.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('An error occurred while loading your dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await userAPI.getNotifications();
      if (response?.data?.success && Array.isArray(response.data.data)) {
        setNotifications(response.data.data);
        // Count unread notifications
        setUnreadNotifications(
          response.data.data.filter(notification => !notification.read).length
        );
      } else {
        // If no proper data, set empty array
        setNotifications([]);
        setUnreadNotifications(0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      // Set empty array on error
      setNotifications([]);
      setUnreadNotifications(0);
    }
  };

  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
      await userAPI.markNotificationAsRead(notificationId);
      // Update notifications list
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      // Update unread count
      setUnreadNotifications(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      await userAPI.markAllNotificationsAsRead();
      // Update all notifications to read
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      setUnreadNotifications(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const stats = [
    {
      title: 'Total Orders',
      count: dashboardData.totalOrders || 0,
      icon: <FaShoppingCart className="w-5 h-5 text-white" />,
      color: 'bg-blue-500',
      link: '#',
      onClick: () => setActiveTab('orders')
    },
    {
      title: 'Pending Orders',
      count: dashboardData.pendingOrders || 0,
      icon: <FaClipboardList className="w-5 h-5 text-white" />,
      color: 'bg-yellow-500',
      link: '#',
      onClick: () => setActiveTab('orders')
    },
    {
      title: 'Favorite Restaurants',
      count: dashboardData.favoriteRestaurants || 0,
      icon: <FaHeart className="w-5 h-5 text-white" />,
      color: 'bg-red-500',
      link: '/user/favorites?tab=restaurants'
    },
    {
      title: 'Amount Saved',
      count: `Rs ${dashboardData.savedAmount || 0}`,
      icon: <FaMoneyBillWave className="w-5 h-5 text-white" />,
      color: 'bg-green-500',
      link: '#',
      onClick: () => setActiveTab('loyalty')
    }
  ];

  // Function to get the appropriate color class for an order status
  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300';
    
    const normalizedStatus = status.toUpperCase();
    
    switch (normalizedStatus) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300';
      case 'PREPARING':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800/30 dark:text-yellow-300';
      case 'CONFIRMED':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-800/30 dark:text-indigo-300';
      case 'OUT_FOR_DELIVERY':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-800/30 dark:text-purple-300';
      case 'READY':
        return 'bg-teal-100 text-teal-700 dark:bg-teal-800/30 dark:text-teal-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="container p-6 mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container p-6 mx-auto">
        <Alert variant="destructive" className="mb-4">
          <p>{error}</p>
        </Alert>
        <Button onClick={fetchUserData} className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  // Ensure dashboardData.recentActivity is not undefined
  const recentActivity = dashboardData.recentActivity || [];

  return (
    <div className="container p-6 mx-auto">
      <div className="flex flex-col space-y-6">
        {/* User Profile Header */}
        <div className="flex flex-col items-center justify-between w-full gap-4 p-6 bg-white rounded-lg shadow-sm md:flex-row dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 text-xl font-bold text-white rounded-full bg-primary">
              {currentUser?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{currentUser?.fullName || 'User'}</h1>
              <p className="text-gray-500">{currentUser?.email}</p>
              
              {profile?.healthCondition && (
                <Badge variant="outline" className="mt-1">
                  {profile.healthCondition}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/user/profile')}
              className="flex items-center gap-2"
            >
              <FaUser className="w-4 h-4" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/user/notifications')}
              className="relative flex items-center gap-2"
            >
              <FaBell className="w-4 h-4" />
              Notifications
              {unreadNotifications > 0 && (
                <Badge variant="destructive" className="absolute flex items-center justify-center w-5 h-5 p-0 text-xs -top-2 -right-2">
                  {unreadNotifications}
                </Badge>
              )}
            </Button>
          </div>
        </div>
        
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className="overflow-hidden transition-all shadow-sm cursor-pointer hover:shadow-md"
              onClick={stat.onClick || (() => navigate(stat.link))}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <h3 className="mt-1 text-2xl font-bold">{stat.count}</h3>
                  </div>
                  <div className={`rounded-full p-3 ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Dashboard Tabs */}
        <Card className="overflow-hidden">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full border-b">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="health">Health Profile</TabsTrigger>
              <TabsTrigger value="loyalty">Loyalty Points</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6">
              <h2 className="mb-6 text-xl font-bold">Recent Activity</h2>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <Card key={index} className="p-4 transition-all hover:shadow-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{activity.title}</h3>
                          <p className="text-sm text-gray-500">{activity.description}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            {formatDate(activity.time)}
                          </p>
                        </div>
                        <Badge
                          variant={
                            activity.status === 'completed' ? 'success' :
                            activity.status === 'pending' ? 'warning' :
                            activity.status === 'active' ? 'info' : 'default'
                          }
                        >
                          {activity.status}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-gray-500">No recent activity to show.</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => navigate('/restaurants')}
                  >
                    Browse Restaurants
                  </Button>
                </div>
              )}
              
              {/* Quick Actions */}
              <h2 className="mt-8 mb-4 text-xl font-bold">Quick Actions</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card className="p-5 text-white transition-all cursor-pointer hover:shadow-md bg-gradient-to-br from-blue-400 to-blue-600" onClick={() => navigate('/restaurants')}>
                  <h3 className="text-lg font-semibold">Order Food</h3>
                  <p className="mt-1 text-sm opacity-90">Explore restaurants and place an order</p>
                </Card>
                
                <Card className="p-5 text-white transition-all cursor-pointer hover:shadow-md bg-gradient-to-br from-purple-400 to-purple-600" onClick={() => setActiveTab('health')}>
                  <h3 className="text-lg font-semibold">Update Health Profile</h3>
                  <p className="mt-1 text-sm opacity-90">Customize your dietary preferences</p>
                </Card>
                
                <Card className="p-5 text-white transition-all cursor-pointer hover:shadow-md bg-gradient-to-br from-green-400 to-green-600" onClick={() => setActiveTab('loyalty')}>
                  <h3 className="text-lg font-semibold">Check Loyalty Points</h3>
                  <p className="mt-1 text-sm opacity-90">Redeem points for rewards</p>
                </Card>
              </div>
            </TabsContent>
            
            {/* Orders Tab */}
            <TabsContent value="orders" className="p-6">
              <h2 className="mb-6 text-xl font-bold">Order History</h2>
              
              {orderHistory.length > 0 ? (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left rtl:text-right">
                    <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3">Order #</th>
                        <th scope="col" className="px-6 py-3">Date</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Total</th>
                        <th scope="col" className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderHistory.slice(0, 5).map((order) => (
                        <tr key={order._id} className="bg-white border-b dark:bg-gray-800">
                          <td className="px-6 py-4">{order.orderNumber}</td>
                          <td className="px-6 py-4">{formatDate(order.createdAt)}</td>
                          <td className="px-6 py-4">
                            <Badge className={`px-2 py-1 text-xs ${getStatusColor(order.status)}`}>
                              {order.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            ${Number(order.grandTotal).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/order/${order._id}`)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center rounded-lg bg-gray-50 dark:bg-gray-800">
                  <h3 className="mb-2 text-lg font-semibold">No Order History</h3>
                  <p className="mb-4 text-gray-500">
                    You haven&apos;t placed any orders yet.
                  </p>
                  <Button onClick={() => navigate('/restaurants')}>
                    Browse Restaurants
                  </Button>
                </div>
              )}
            </TabsContent>
            
            {/* Health Profile Tab */}
            <TabsContent value="health" className="p-6">
              <h2 className="mb-6 text-xl font-bold">Health Profile</h2>
              <HealthProfile />
            </TabsContent>
            
            {/* Loyalty Tab */}
            <TabsContent value="loyalty" className="p-6">
              <h2 className="mb-6 text-xl font-bold">Loyalty Points</h2>
              <LoyaltyDashboard />
            </TabsContent>
            
            {/* Notifications Tab */}
            <TabsContent value="notifications" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Notifications</h2>
                {notifications && notifications.length > 0 && unreadNotifications > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleMarkAllNotificationsAsRead}
                  >
                    Mark All as Read
                  </Button>
                )}
              </div>
              
              {notifications && notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <Card 
                      key={notification._id} 
                      className={`p-4 transition-all ${!notification.read ? 'border-l-4 border-primary' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{notification.title}</h3>
                          <p className="text-sm text-gray-500">{notification.message}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.read && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleMarkNotificationAsRead(notification._id)}
                          >
                            Mark as Read
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-gray-500">No notifications to show.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard; 
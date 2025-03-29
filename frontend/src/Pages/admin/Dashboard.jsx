import { useEffect, useState } from "react";
import { FaUsers, FaUtensils, FaShoppingCart, FaTruck, FaUserCog, FaCheckCircle, FaTimesCircle, FaBell } from "react-icons/fa";
import { Link } from "react-router-dom";
import { adminAPI } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { Card, Badge, Button, Alert, Spinner, Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui";

const Dashboard = () => {
  const { currentUser } = useAuth();
  
  const [dashboardData, setDashboardData] = useState({
    users: 0,
    owners: 0,
    orders: 0,
    deliveries: 0,
    loading: true,
    error: null,
    data: {}
  });

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
    
    // Refresh data every 60 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchNotifications();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      const response = await adminAPI.getDashboard();
      
      if (response.data?.success) {
        setDashboardData({
          loading: false,
          error: null,
          data: response.data.data || {},
          users: response.data.data?.users || 0,
          owners: response.data.data?.restaurantOwners || 0,
          orders: response.data.data?.orders || 0,
          deliveries: response.data.data?.deliveries || 0,
          pendingApprovals: response.data.data?.pendingApprovals || 0
        });
      } else {
        setDashboardData({
          loading: false,
          error: response.data?.message || 'Failed to load dashboard data',
          data: {},
          users: 0,
          owners: 0,
          orders: 0,
          deliveries: 0,
          pendingApprovals: 0
        });
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Dashboard error:', err);
      setDashboardData({
        loading: false,
        error: 'Failed to load dashboard data',
        data: {},
        users: 0,
        owners: 0,
        orders: 0,
        deliveries: 0,
        pendingApprovals: 0
      });
      setIsLoading(false);
    }
  };
  
  const fetchNotifications = async () => {
    try {
      const response = await adminAPI.getNotifications();
      
      if (response.data?.success) {
        setNotifications(response.data.data || []);
      }
    } catch (err) {
      console.error('Notifications error:', err);
    }
  };

  // Process a notification approval/rejection
  const handleProcessNotification = async (notificationId, action) => {
    try {
      setIsLoading(true);
      const response = await adminAPI.processNotification(notificationId, action);
      
      if (response.data?.success) {
        // Refresh notifications and dashboard data
        fetchNotifications();
        fetchDashboardData();
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Process notification error:', err);
      setIsLoading(false);
    }
  };

  // Dashboard stats cards
  const stats = [
    {
      title: "Total Users",
      count: dashboardData.users,
      icon: <FaUsers size={24} />,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-300",
      link: "/admin/users",
    },
    {
      title: "Restaurants",
      count: dashboardData.owners,
      icon: <FaUtensils size={24} />,
      color: "bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300",
      link: "/admin/restaurants",
    },
    {
      title: "Orders",
      count: dashboardData.orders || 0,
      icon: <FaShoppingCart size={24} />,
      color: "bg-purple-100 text-purple-700 dark:bg-purple-800/30 dark:text-purple-300",
      link: "/admin/orders",
    },
    {
      title: "Deliveries",
      count: dashboardData.deliveries || 0,
      icon: <FaTruck size={24} />,
      color: "bg-amber-100 text-amber-700 dark:bg-amber-800/30 dark:text-amber-300",
      link: "/admin/deliveries",
    },
  ];

  // Filter notifications by status
  const pendingNotifications = notifications.filter(n => n.status === 'pending');
  const recentApprovals = notifications.filter(n => n.status === 'approved').slice(0, 5);

  // Sample recent orders (would come from API in production)
  const recentOrders = [
    {
      id: 1,
      user: "John Doe",
      restaurant: "Healthy Bites",
      amount: "$45.99",
      status: "Delivered",
      date: "2023-06-15",
    },
    {
      id: 2,
      user: "Jane Smith",
      restaurant: "Green Bowl",
      amount: "$32.50",
      status: "Processing",
      date: "2023-06-15",
    },
    {
      id: 3,
      user: "Robert Johnson",
      restaurant: "Protein Hub",
      amount: "$28.75",
      status: "Pending",
      date: "2023-06-14",
    },
    {
      id: 4,
      user: "Emily Davis",
      restaurant: "Salad Bar",
      amount: "$18.25",
      status: "Delivered",
      date: "2023-06-14",
    },
    {
      id: 5,
      user: "Michael Wilson",
      restaurant: "Nutrimeals",
      amount: "$52.30",
      status: "Delivered",
      date: "2023-06-13",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Welcome back, <span className="font-semibold">{currentUser?.name || 'Admin'}</span>
        </p>
      </div>

      {/* Dashboard Error */}
      {dashboardData.error && (
        <Alert variant="error" className="mb-6">
          {dashboardData.error}
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <Link to={stat.link} key={index} className="group">
            <Card className="hover:shadow-md transition-shadow duration-200 dark:bg-gray-800 h-full">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {stat.title}
                    </p>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {isLoading ? (
                        <Spinner size="sm" />
                      ) : (
                        stat.count
                      )}
                    </h3>
                  </div>
                  <div className={`rounded-full p-3 ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Management Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="overflow-hidden dark:bg-gray-800 h-full">
            <div className="p-5 bg-gradient-to-r from-blue-500 to-blue-700 text-white">
              <FaUserCog className="h-8 w-8 mb-2" />
              <h3 className="text-lg font-semibold mb-1">Manage Users</h3>
              <p className="text-sm opacity-80 mb-4">View and manage user accounts</p>
              <Button
                variant="outline"
                className="bg-white text-blue-700 hover:bg-blue-50 border-transparent"
                asChild
              >
                <Link to="/admin/users">Go to Users</Link>
              </Button>
            </div>
          </Card>
          
          <Card className="overflow-hidden dark:bg-gray-800 h-full">
            <div className="p-5 bg-gradient-to-r from-green-500 to-green-700 text-white">
              <FaUtensils className="h-8 w-8 mb-2" />
              <h3 className="text-lg font-semibold mb-1">Manage Restaurants</h3>
              <p className="text-sm opacity-80 mb-4">Approve and manage restaurant owners</p>
              <Button
                variant="outline"
                className="bg-white text-green-700 hover:bg-green-50 border-transparent"
                asChild
              >
                <Link to="/admin/restaurants">Go to Restaurants</Link>
              </Button>
            </div>
          </Card>
          
          <Card className="overflow-hidden dark:bg-gray-800 h-full">
            <div className="p-5 bg-gradient-to-r from-amber-500 to-amber-700 text-white">
              <FaBell className="h-8 w-8 mb-2" />
              <h3 className="text-lg font-semibold mb-1">Notifications</h3>
              <p className="text-sm opacity-80 mb-4">Review pending notifications</p>
              <Button
                variant="outline"
                className="bg-white text-amber-700 hover:bg-amber-50 border-transparent"
                asChild
              >
                <Link to="/admin/notifications">View Notifications</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Pending Notifications Alert */}
      {pendingNotifications.length > 0 && (
        <Alert variant="warning" className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <FaBell className="mr-2 flex-shrink-0" />
            <span>
              You have <strong>{pendingNotifications.length}</strong> pending notifications that require your attention
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="w-full sm:w-auto whitespace-nowrap"
          >
            <Link to="/admin/notifications">
              View All
            </Link>
          </Button>
        </Alert>
      )}

      {/* Recent Activity Tabs */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Recent Activity
        </h2>
        
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="mb-4 w-full sm:w-auto bg-gray-100 dark:bg-gray-700 rounded-md p-1">
            <TabsTrigger 
              value="orders"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
            >
              Orders
            </TabsTrigger>
            <TabsTrigger 
              value="approvals"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
            >
              Pending Approvals
            </TabsTrigger>
            <TabsTrigger 
              value="recent"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
            >
              Recent Approvals
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders">
            <Card className="dark:bg-gray-800 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3 hidden md:table-cell">Restaurant</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 hidden md:table-cell">Date</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-4 text-center">
                          <Spinner className="mx-auto" />
                        </td>
                      </tr>
                    ) : recentOrders.length > 0 ? (
                      recentOrders.map((order) => (
                        <tr key={order.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 font-medium">#{order.id}</td>
                          <td className="px-4 py-3">{order.user}</td>
                          <td className="px-4 py-3 hidden md:table-cell">{order.restaurant}</td>
                          <td className="px-4 py-3">{order.amount}</td>
                          <td className="px-4 py-3">
                            <Badge variant={
                              order.status === "Delivered" ? "success" :
                              order.status === "Processing" ? "info" : "warning"
                            }>
                              {order.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">{order.date}</td>
                          <td className="px-4 py-3">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/admin/orders/${order.id}`}>View</Link>
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">No orders found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="approvals">
            <Card className="dark:bg-gray-800 shadow-sm">
              <div className="overflow-x-auto">
                {pendingNotifications.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3 hidden md:table-cell">Message</th>
                        <th className="px-4 py-3 hidden md:table-cell">Date</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingNotifications.map((notification) => (
                        <tr key={notification._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 font-medium">{notification.user?.name || "Unknown"}</td>
                          <td className="px-4 py-3">
                            <Badge variant={
                              notification.type === "restaurant_approval" ? "success" :
                              notification.type === "profile_change" ? "info" : "default"
                            }>
                              {notification.type?.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell max-w-xs truncate">{notification.message}</td>
                          <td className="px-4 py-3 hidden md:table-cell">{new Date(notification.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                onClick={() => handleProcessNotification(notification._id, 'approve')}
                                disabled={isLoading}
                              >
                                <FaCheckCircle className="mr-1" /> Approve
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => handleProcessNotification(notification._id, 'reject')}
                                disabled={isLoading}
                              >
                                <FaTimesCircle className="mr-1" /> Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No pending approvals</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="recent">
            <Card className="dark:bg-gray-800 shadow-sm">
              <div className="overflow-x-auto">
                {recentApprovals.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentApprovals.map((notification) => (
                        <tr key={notification._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 font-medium">{notification.user?.name || "Unknown"}</td>
                          <td className="px-4 py-3">
                            <Badge variant="default">
                              {notification.type?.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="success">Approved</Badge>
                          </td>
                          <td className="px-4 py-3">{new Date(notification.updatedAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No recent approvals</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard; 
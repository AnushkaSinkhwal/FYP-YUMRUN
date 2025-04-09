import { useState, useEffect } from 'react';
import { FaUsers, FaUtensils, FaShoppingCart, FaTruck, FaChartLine } from 'react-icons/fa';
import Dashboard from '../../components/shared/Dashboard';
import { adminAPI } from '../../utils/api';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    userCount: 0,
    restaurantCount: 0,
    orderCount: 0,
    activeDeliveries: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentActivity();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboard();
      
      if (response.data?.success) {
        const data = response.data.data;
        setDashboardData({
          userCount: data.userCount || 0,
          restaurantCount: data.restaurantCount || 0,
          orderCount: data.orderCount || 0,
          activeDeliveries: data.activeDeliveries || 0
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Fetch notifications and approval requests
      const [notificationsResponse, approvalsResponse] = await Promise.all([
        adminAPI.getNotifications(),
        adminAPI.getApprovalRequests()
      ]);
      
      let combinedActivity = [];
      
      // Process notifications
      if (notificationsResponse.data?.success) {
        const notificationItems = notificationsResponse.data.notifications.map(notification => ({
          id: notification._id,
          type: notification.type || 'Notification',
          details: notification.message,
          status: notification.status || 'pending',
          date: new Date(notification.createdAt).toLocaleDateString(),
          link: `/admin/notifications/${notification._id}`
        }));
        combinedActivity = [...combinedActivity, ...notificationItems];
      }
      
      // Process approval requests
      if (approvalsResponse.data?.success) {
        const approvalItems = approvalsResponse.data.requests.map(request => ({
          id: request._id,
          type: request.type === 'restaurant_approval' ? 'Restaurant Approval' : 'Profile Update',
          details: `${request.userData?.name || 'User'} requested ${request.type} approval`,
          status: request.status,
          date: new Date(request.createdAt).toLocaleDateString(),
          link: `/admin/${request.type === 'restaurant_approval' ? 'restaurants' : 'users'}`
        }));
        combinedActivity = [...combinedActivity, ...approvalItems];
      }
      
      // Get restaurant approval requests
      const restaurantApprovalsResponse = await adminAPI.getRestaurantApprovals();
      if (restaurantApprovalsResponse.data?.success) {
        const restaurantItems = restaurantApprovalsResponse.data.approvals.map(approval => ({
          id: approval._id,
          type: 'Restaurant Approval',
          details: `New restaurant registration: ${approval.restaurantName || 'Unnamed Restaurant'}`,
          status: 'pending',
          date: new Date(approval.createdAt).toLocaleDateString(),
          link: `/admin/restaurants`
        }));
        combinedActivity = [...combinedActivity, ...restaurantItems];
      }
      
      // Sort by date (most recent first) and limit to 10 items
      combinedActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentActivity(combinedActivity.slice(0, 10));
      
    } catch (error) {
      console.error('Error fetching activity data:', error);
      // Set empty array as fallback
      setRecentActivity([]);
    }
  };

  // Admin-specific stats
  const stats = [
    {
      title: "Total Users",
      count: loading ? '...' : dashboardData.userCount,
      icon: <FaUsers size={24} />,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-300",
      link: "/admin/users",
    },
    {
      title: "Restaurants",
      count: loading ? '...' : dashboardData.restaurantCount,
      icon: <FaUtensils size={24} />,
      color: "bg-amber-100 text-amber-700 dark:bg-amber-800/30 dark:text-amber-300",
      link: "/admin/restaurants",
    },
    {
      title: "Total Orders",
      count: loading ? '...' : dashboardData.orderCount,
      icon: <FaShoppingCart size={24} />,
      color: "bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300",
      link: "/admin/orders",
    },
    {
      title: "Active Deliveries",
      count: loading ? '...' : dashboardData.activeDeliveries,
      icon: <FaTruck size={24} />,
      color: "bg-purple-100 text-purple-700 dark:bg-purple-800/30 dark:text-purple-300",
      link: "/admin/deliveries",
    },
  ];

  // Admin-specific quick actions
  const quickActions = [
    {
      title: "Manage Restaurants",
      description: "Review and manage restaurant listings",
      icon: <FaUtensils className="w-8 h-8 mb-2" />,
      gradient: "bg-gradient-to-r from-blue-500 to-blue-700",
      link: "/admin/restaurants",
      buttonText: "View Restaurants"
    },
    {
      title: "User Management",
      description: "Manage user accounts and roles",
      icon: <FaUsers className="w-8 h-8 mb-2" />,
      gradient: "bg-gradient-to-r from-green-500 to-green-700",
      link: "/admin/users",
      buttonText: "Manage Users"
    },
    {
      title: "View Analytics",
      description: "Platform performance metrics",
      icon: <FaChartLine className="w-8 h-8 mb-2" />,
      gradient: "bg-gradient-to-r from-purple-500 to-purple-700",
      link: "/admin/analytics",
      buttonText: "View Analytics"
    }
  ];

  return (
    <Dashboard
      role="admin"
      stats={stats}
      quickActions={quickActions}
      recentActivity={recentActivity}
      isLoading={loading}
      error={error}
    />
  );
};

export default AdminDashboard; 
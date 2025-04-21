import { useState, useEffect } from 'react';
import { FaUtensils, FaShoppingCart, FaChartLine, FaStore, FaGift, FaInfoCircle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import Dashboard from '../../components/shared/Dashboard';
import { restaurantAPI } from '../../utils/api';
import { Alert } from '../../components/ui';

const RestaurantDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    menuItems: 0,
    activeOffers: 0,
    totalRevenue: 0,
    recentActivity: []
  });
  const [profileStatus, setProfileStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [dashboardResponse, profileResponse] = await Promise.all([
          restaurantAPI.getDashboard(),
          restaurantAPI.getProfile()
        ]);

        if (dashboardResponse?.data?.success) {
          const data = dashboardResponse.data.data || {};
          console.log('Successfully fetched restaurant dashboard data:', data);
          setDashboardData({
            totalOrders: data.totalOrders || 0,
            pendingOrders: data.pendingOrders || 0,
            menuItems: data.menuItems || 0,
            activeOffers: data.activeOffers || 0,
            totalRevenue: data.totalRevenue || 0,
            recentActivity: data.recentActivity || []
          });
        } else {
          const errorMessage = dashboardResponse?.data?.message || 'Failed to fetch dashboard data';
          console.error('Error fetching dashboard data:', errorMessage);
          setError(prev => prev ? `${prev}\n${errorMessage}` : errorMessage);
        }

        if (profileResponse?.data?.success) {
          const profileData = profileResponse.data.data || {};
          console.log('Successfully fetched restaurant profile data:', profileData);
          setProfileStatus(profileData.status);
        } else {
          const profileError = profileResponse?.data?.message || 'Failed to fetch profile status';
          console.error('Error fetching profile status:', profileError);
          setError(prev => prev ? `${prev}\n${profileError}` : profileError);
        }

      } catch (err) {
        console.error('Error fetching data for restaurant dashboard:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getStatusBadge = () => {
    switch (profileStatus) {
      case 'approved':
        return { text: 'Approved', variant: 'success', icon: <FaCheckCircle className="mr-1" /> };
      case 'pending_approval':
        return { text: 'Pending Approval', variant: 'warning', icon: <FaInfoCircle className="mr-1" /> };
      case 'rejected':
        return { text: 'Rejected', variant: 'destructive', icon: <FaTimesCircle className="mr-1" /> };
      default:
        return { text: 'Unknown Status', variant: 'secondary', icon: <FaInfoCircle className="mr-1" /> };
    }
  };

  const statusBadgeDetails = getStatusBadge();

  // Restaurant-specific stats
  const stats = [
    {
      title: "Total Orders",
      count: dashboardData.totalOrders,
      icon: <FaShoppingCart size={24} />,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-300",
      link: "/restaurant/orders",
    },
    {
      title: "Pending Orders",
      count: dashboardData.pendingOrders,
      icon: <FaShoppingCart size={24} />,
      color: "bg-amber-100 text-amber-700 dark:bg-amber-800/30 dark:text-amber-300",
      link: "/restaurant/orders?status=pending",
    },
    {
      title: "Menu Items",
      count: dashboardData.menuItems,
      icon: <FaUtensils size={24} />,
      color: "bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300",
      link: "/restaurant/menu",
    },
    {
      title: "Active Offers",
      count: dashboardData.activeOffers,
      icon: <FaGift size={24} />,
      color: "bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-300",
      link: "/restaurant/offers",
    },
    {
      title: "Total Revenue",
      count: `$${dashboardData.totalRevenue.toLocaleString()}`,
      icon: <FaChartLine size={24} />,
      color: "bg-purple-100 text-purple-700 dark:bg-purple-800/30 dark:text-purple-300",
      link: "/restaurant/analytics",
    },
  ];

  // Restaurant-specific quick actions
  const quickActions = [
    {
      title: "Manage Restaurant",
      description: "Update your restaurant details",
      icon: <FaStore className="h-8 w-8 mb-2" />,
      gradient: "bg-gradient-to-r from-orange-500 to-orange-700",
      link: "/restaurant/profile",
      buttonText: "Manage Restaurant"
    },
    {
      title: "Manage Menu",
      description: "Update your restaurant's menu",
      icon: <FaUtensils className="h-8 w-8 mb-2" />,
      gradient: "bg-gradient-to-r from-blue-500 to-blue-700",
      link: "/restaurant/menu",
      buttonText: "Go to Menu"
    },
    {
      title: "Manage Offers",
      description: "Create and manage special offers",
      icon: <FaGift className="h-8 w-8 mb-2" />,
      gradient: "bg-gradient-to-r from-red-500 to-red-700",
      link: "/restaurant/offers",
      buttonText: "Manage Offers"
    },
    {
      title: "View Analytics",
      description: "Check your performance metrics",
      icon: <FaChartLine className="h-8 w-8 mb-2" />,
      gradient: "bg-gradient-to-r from-purple-500 to-purple-700",
      link: "/restaurant/analytics",
      buttonText: "View Analytics"
    }
  ];

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dashboardResponse, profileResponse] = await Promise.all([
        restaurantAPI.getDashboard(),
        restaurantAPI.getProfile()
      ]);

      if (dashboardResponse?.data?.success) {
        const data = dashboardResponse.data.data || {};
        console.log('Successfully fetched restaurant dashboard data:', data);
        setDashboardData({
          totalOrders: data.totalOrders || 0,
          pendingOrders: data.pendingOrders || 0,
          menuItems: data.menuItems || 0,
          activeOffers: data.activeOffers || 0,
          totalRevenue: data.totalRevenue || 0,
          recentActivity: data.recentActivity || []
        });
      } else {
        const errorMessage = dashboardResponse?.data?.message || 'Failed to fetch dashboard data';
        console.error('Error fetching dashboard data:', errorMessage);
        setError(prev => prev ? `${prev}\n${errorMessage}` : errorMessage);
      }

      if (profileResponse?.data?.success) {
        const profileData = profileResponse.data.data || {};
        console.log('Successfully fetched restaurant profile data:', profileData);
        setProfileStatus(profileData.status);
      } else {
        const profileError = profileResponse?.data?.message || 'Failed to fetch profile status';
        console.error('Error fetching profile status:', profileError);
        setError(prev => prev ? `${prev}\n${profileError}` : profileError);
      }

    } catch (err) {
      console.error('Error fetching data for restaurant dashboard:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {!isLoading && profileStatus && (
        <Alert variant={statusBadgeDetails.variant} className="mb-4 flex items-center">
          {statusBadgeDetails.icon}
          <span>Your restaurant status is currently: <strong>{statusBadgeDetails.text}</strong></span>
          {profileStatus === 'pending_approval' && <span className="ml-2 text-sm"> (Admin review required)</span>}
          {profileStatus === 'rejected' && <span className="ml-2 text-sm"> (Please contact support)</span>}
        </Alert>
      )}
    
      <Dashboard
        title="Restaurant Dashboard"
        role="restaurant"
        stats={stats}
        quickActions={quickActions}
        recentActivity={dashboardData.recentActivity}
        isLoading={isLoading && !profileStatus}
        error={error}
        onRefresh={fetchDashboardData}
      />
    </div>
  );
};

export default RestaurantDashboard; 
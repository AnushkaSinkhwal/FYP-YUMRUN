import { useState, useEffect } from 'react';
import { FaUtensils, FaShoppingCart, FaChartLine, FaStore, FaGift } from 'react-icons/fa';
import Dashboard from '../../components/shared/Dashboard';
import { restaurantAPI } from '../../utils/api';

const RestaurantDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    menuItems: 0,
    activeOffers: 0,
    totalRevenue: 0,
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await restaurantAPI.getDashboard();
      
      if (response && response.data && response.data.success) {
        const data = response.data.data || {};
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
        const errorMessage = response?.data?.message || 'Failed to fetch dashboard data';
        console.error('Error fetching dashboard data:', errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching restaurant dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <Dashboard
      role="restaurantOwner"
      stats={stats}
      quickActions={quickActions}
      recentActivity={dashboardData.recentActivity}
      isLoading={isLoading}
      error={error}
      onRefresh={fetchDashboardData}
    />
  );
};

export default RestaurantDashboard; 
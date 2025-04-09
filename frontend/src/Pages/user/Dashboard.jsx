import { useState, useEffect } from 'react';
import { FaShoppingBag, FaUtensils, FaWallet, FaBox, FaUserEdit, FaBell } from 'react-icons/fa';
import Dashboard from '../../components/shared/Dashboard';
import { userAPI } from '../../utils/api';
import { toast } from 'react-toastify';

function UserDashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    favoriteRestaurants: 0,
    savedAmount: 0,
    pendingOrders: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching dashboard data...');
      const response = await userAPI.getDashboard();
      console.log('Dashboard response:', response.data);
      
      if (response.data && response.data.success) {
        const data = response.data.data || {};
        
        setDashboardData({
          totalOrders: data.totalOrders || 0,
          favoriteRestaurants: data.favoriteRestaurants || 0,
          savedAmount: data.savedAmount || 0,
          pendingOrders: data.pendingOrders || 0,
        });
        
        // Set recent activity from API response
        if (data.recentActivity && data.recentActivity.length > 0) {
          setRecentActivity(data.recentActivity.map(activity => ({
            id: activity.id,
            type: activity.title.toLowerCase().includes('order') ? 'order' : 'notification',
            details: activity.description,
            status: activity.status || 'pending',
            date: activity.time,
            link: activity.link || '/user/notifications'
          })));
        } else {
          setRecentActivity([]);
        }
      } else {
        throw new Error(response.data?.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Stats data based on fetched dashboard data
  const stats = [
    {
      title: 'Total Orders',
      count: dashboardData.totalOrders,
      icon: <FaShoppingBag className='text-blue-500' />,
      color: 'bg-blue-100',
      link: '/user/orders'
    },
    {
      title: 'Favorite Restaurants',
      count: dashboardData.favoriteRestaurants,
      icon: <FaUtensils className='text-red-500' />,
      color: 'bg-red-100',
      link: '/user/favorites'
    },
    {
      title: 'Saved Amount',
      count: `$${dashboardData.savedAmount.toFixed(2)}`,
      icon: <FaWallet className='text-green-500' />,
      color: 'bg-green-100',
      link: '/user/rewards'
    },
    {
      title: 'Pending Orders',
      count: dashboardData.pendingOrders,
      icon: <FaBox className='text-yellow-500' />,
      color: 'bg-yellow-100',
      link: '/user/orders'
    },
  ];

  // Quick actions
  const quickActions = [
    {
      title: 'My Orders',
      description: 'View your order history and track current orders',
      link: '/user/orders',
      icon: <FaShoppingBag className="w-8 h-8 mb-3" />,
      gradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
      buttonText: 'View Orders'
    },
    {
      title: 'Edit Profile',
      description: 'Update your personal information and preferences',
      link: '/user/profile',
      icon: <FaUserEdit className="w-8 h-8 mb-3" />,
      gradient: 'bg-gradient-to-r from-purple-500 to-purple-600',
      buttonText: 'Edit Profile'
    },
    {
      title: 'Notifications',
      description: 'Check your notifications and updates',
      link: '/user/notifications',
      icon: <FaBell className="w-8 h-8 mb-3" />,
      gradient: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
      buttonText: 'View Notifications'
    },
  ];

  return (
    <Dashboard 
      stats={stats}
      quickActions={quickActions}
      recentActivity={recentActivity}
      isLoading={isLoading}
      error={error}
      onRefresh={fetchDashboardData}
    />
  );
}

export default UserDashboard; 
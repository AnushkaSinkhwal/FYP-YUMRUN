import { useState, useEffect } from 'react';
import { FaMotorcycle, FaCheckCircle, FaClock, FaDollarSign, FaExclamationTriangle } from 'react-icons/fa';
import Dashboard from '../../components/shared/Dashboard';
import { deliveryAPI } from '../../utils/api'; // Assuming deliveryAPI exists
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Alert } from '../../components/ui';

const DeliveryDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Using the unified dashboard endpoint
      const response = await deliveryAPI.getDashboard();
      
      if (response.data?.success) {
        const data = response.data.data;
        
        // Process Stats
        const fetchedStats = [
          {
            title: "Active Deliveries",
            count: data.activeDeliveries || 0,
            icon: <FaMotorcycle size={24} />,
            color: "bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-300",
            link: "/delivery/orders?status=active",
          },
          {
            title: "Completed Today",
            count: data.todayCompletedDeliveries || 0,
            icon: <FaCheckCircle size={24} />,
            color: "bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300",
            link: "/delivery/history",
          },
          {
            title: "Available Orders",
            count: data.availableOrders || 0,
            icon: <FaClock size={24} />,
            color: "bg-amber-100 text-amber-700 dark:bg-amber-800/30 dark:text-amber-300",
            link: "/delivery/orders?status=available",
          },
          {
            title: "Today's Earnings",
            count: `$${(data.todayEarnings || 0).toFixed(2)}`,
            icon: <FaDollarSign size={24} />,
            color: "bg-purple-100 text-purple-700 dark:bg-purple-800/30 dark:text-purple-300",
            link: "/delivery/earnings",
          },
        ];
        setStats(fetchedStats);
        
        // Use the formatted activity from backend
        setRecentActivity(data.recentActivity || []);
      } else {
        throw new Error(response.data?.message || 'Failed to load dashboard data');
      }
    } catch (err) {
      console.error("Error fetching delivery dashboard data:", err);
      setError("Failed to load dashboard data. " + (err.response?.data?.message || err.message || 'Please try again later.'));
      toast.error("Failed to load dashboard data. Please try again later.");
      
      // Set default/empty state on error
      setStats([
        { title: "Active Deliveries", count: 0, icon: <FaMotorcycle size={24} />, color: "bg-gray-100 text-gray-700", link: "/delivery/orders?status=active" },
        { title: "Completed Today", count: 0, icon: <FaCheckCircle size={24} />, color: "bg-gray-100 text-gray-700", link: "/delivery/history" },
        { title: "Available Orders", count: 0, icon: <FaClock size={24} />, color: "bg-gray-100 text-gray-700", link: "/delivery/orders?status=available" },
        { title: "Today's Earnings", count: "$0.00", icon: <FaDollarSign size={24} />, color: "bg-gray-100 text-gray-700", link: "/delivery/earnings" },
      ]);
      setRecentActivity([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Delivery-specific quick actions (remain static for now)
  const quickActions = [
    {
      title: "View Orders",
      description: "Check available and active deliveries",
      icon: <FaMotorcycle className="h-8 w-8 mb-2" />,
      gradient: "bg-gradient-to-r from-blue-500 to-blue-700",
      link: "/delivery/orders",
      buttonText: "View Orders"
    },
    {
      title: "Delivery History",
      description: "View your past deliveries",
      icon: <FaCheckCircle className="h-8 w-8 mb-2" />,
      gradient: "bg-gradient-to-r from-green-500 to-green-700",
      link: "/delivery/history",
      buttonText: "View History"
    },
    {
      title: "Earnings",
      description: "Check your earnings and payments",
      icon: <FaDollarSign className="h-8 w-8 mb-2" />,
      gradient: "bg-gradient-to-r from-purple-500 to-purple-700",
      link: "/delivery/earnings",
      buttonText: "View Earnings"
    }
  ];

  const isApproved = currentUser?.deliveryRiderDetails?.approved === true;

  return (
    <div>
      {!isLoading && (
        <Alert 
          variant={isApproved ? "success" : "warning"} 
          className="mb-4 flex items-center"
        >
          {isApproved ? (
            <>
              <FaCheckCircle className="mr-2" />
              <span>Your account is <strong>approved</strong>. You can accept delivery orders.</span>
            </>
          ) : (
            <>
              <FaExclamationTriangle className="mr-2" />
              <span>Your account is <strong>pending approval</strong> by an administrator. You cannot accept delivery orders until approved.</span>
            </>
          )}
        </Alert>
      )}
      
      <Dashboard
        role="deliveryuser"
        isLoading={isLoading}
        error={error}
        stats={stats}
        quickActions={quickActions}
        recentActivity={recentActivity}
        onRefresh={fetchDashboardData} // Pass refresh function
      />
    </div>
  );
};

export default DeliveryDashboard; 
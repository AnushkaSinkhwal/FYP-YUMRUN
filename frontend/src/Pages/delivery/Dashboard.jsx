import { useState, useEffect, useRef } from 'react';
import { FaMotorcycle, FaCheckCircle, FaClock, FaDollarSign, FaExclamationTriangle, FaSync } from 'react-icons/fa';
import Dashboard from '../../components/shared/Dashboard';
import { deliveryAPI, authAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Alert } from '../../components/ui';

const DeliveryDashboard = () => {
  // Component state
  const [stats, setStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Auth context
  const { updateProfile } = useAuth();
  
  // Refs to prevent rerendering cycles
  const initialLoadComplete = useRef(false);
  const isMounted = useRef(true);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!isMounted.current) return;
    
    console.log('[fetchDashboardData] Fetching dashboard stats...');
    setError(null);
    
    try {
      const response = await deliveryAPI.getDashboard();
      
      if (!isMounted.current) return;
      console.log('[fetchDashboardData] API response:', response.data);
      
      if (response.data?.success) {
        const data = response.data.data;
        const fetchedStats = [
          { title: "Active Deliveries", count: data.activeDeliveries || 0, icon: <FaMotorcycle size={24} />, color: "bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-300", link: "/delivery/orders?status=active" },
          { title: "Completed Today", count: data.todayCompletedDeliveries || 0, icon: <FaCheckCircle size={24} />, color: "bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300", link: "/delivery/history" },
          { title: "Available Orders", count: data.availableOrders || 0, icon: <FaClock size={24} />, color: "bg-amber-100 text-amber-700 dark:bg-amber-800/30 dark:text-amber-300", link: "/delivery/orders?status=available" },
          { title: "Today's Earnings", count: `$${(data.todayEarnings || 0).toFixed(2)}`, icon: <FaDollarSign size={24} />, color: "bg-purple-100 text-purple-700 dark:bg-purple-800/30 dark:text-purple-300", link: "/delivery/earnings" },
        ];
        setStats(fetchedStats);
        setRecentActivity(data.recentActivity || []);
        console.log('[fetchDashboardData] Stats and activity updated.');
      } else {
        throw new Error(response.data?.message || 'Failed to load dashboard stats');
      }
    } catch (err) {
      if (!isMounted.current) return;
      
      console.error("[fetchDashboardData] Error:", err);
      setError("Failed to load dashboard stats. " + (err.response?.data?.message || err.message || 'Please try again later.'));
      toast.error("Failed to load dashboard stats.");
      setStats([
        { title: "Active Deliveries", count: 0, icon: <FaMotorcycle size={24} />, color: "bg-gray-100 text-gray-700", link: "/delivery/orders?status=active" },
        { title: "Completed Today", count: 0, icon: <FaCheckCircle size={24} />, color: "bg-gray-100 text-gray-700", link: "/delivery/history" },
        { title: "Available Orders", count: 0, icon: <FaClock size={24} />, color: "bg-gray-100 text-gray-700", link: "/delivery/orders?status=available" },
        { title: "Today's Earnings", count: "$0.00", icon: <FaDollarSign size={24} />, color: "bg-gray-100 text-gray-700", link: "/delivery/earnings" },
      ]);
      setRecentActivity([]);
    }
  };

  // Fetch user profile & approval status
  const fetchUserProfile = async (isInitialLoad = false) => {
    if (!isMounted.current) return;
    
    console.log('[fetchUserProfile] Starting...', { isInitialLoad });
    if (!isInitialLoad) {
      setIsRefreshingProfile(true);
    }
    
    let isApproved = false;
    
    try {
      const response = await authAPI.getCurrentUser();
      
      if (!isMounted.current) return;
      console.log('[fetchUserProfile] API response received');
      
      const userData = response.data?.user || response.data?.data?.user || response.data;
      
      if (userData && typeof userData === 'object') {
        isApproved = userData.deliveryRiderDetails?.approved === true;
        console.log('[fetchUserProfile] Approval status from API:', isApproved);
        
        setApprovalStatus(isApproved);

        if (updateProfile) {
          await updateProfile(userData);
          
          // Update localStorage if needed
          try {
            const storedData = JSON.parse(localStorage.getItem('userData') || '{}');
            if (storedData.deliveryRiderDetails?.approved !== isApproved) {
              storedData.deliveryRiderDetails = { ...(storedData.deliveryRiderDetails || {}), approved: isApproved };
              localStorage.setItem('userData', JSON.stringify(storedData));
            }
          } catch (storageError) {
            console.error('[fetchUserProfile] Storage error:', storageError);
          }
        }
      }
    } catch (err) {
      console.error('[fetchUserProfile] Error:', err);
    } finally {
      if (isMounted.current) {
        if (!isInitialLoad) {
          setIsRefreshingProfile(false);
        }
      }
    }
    
    return isApproved;
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    console.log('[handleRefresh] Manual refresh triggered.');
    setIsLoading(true);
    const isApprovedNow = await fetchUserProfile();
    await fetchDashboardData();
    setIsLoading(false);
    
    if (isMounted.current && !approvalStatus && isApprovedNow) {
      toast.success('Your account status has been updated to Approved!');
    }
  };

  // Initial data loading effect - only runs once
  useEffect(() => {
    // Ensure this effect only runs once on mount
    if (initialLoadComplete.current) return;
    initialLoadComplete.current = true;
    
    console.log('[useEffect] Initial data loading...');
    setIsLoading(true);
    
    const loadInitialData = async () => {
      await fetchUserProfile(true);
      await fetchDashboardData();
      
      if (isMounted.current) {
        setIsLoading(false);
        setDataLoaded(true);
      }
    };
    
    loadInitialData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quick actions for the dashboard
  const quickActions = [
    { title: "View Orders", description: "Check available and active deliveries", icon: <FaMotorcycle className="w-8 h-8 mb-2" />, gradient: "bg-gradient-to-r from-blue-500 to-blue-700", link: "/delivery/orders", buttonText: "View Orders" },
    { title: "Delivery History", description: "View your past deliveries", icon: <FaCheckCircle className="w-8 h-8 mb-2" />, gradient: "bg-gradient-to-r from-green-500 to-green-700", link: "/delivery/history", buttonText: "View History" },
    { title: "Earnings", description: "Check your earnings and payments", icon: <FaDollarSign className="w-8 h-8 mb-2" />, gradient: "bg-gradient-to-r from-purple-500 to-purple-700", link: "/delivery/earnings", buttonText: "View Earnings" }
  ];

  return (
    <div>
      {dataLoaded && (
        <div className="mb-4">
          <Alert 
            variant={approvalStatus ? "success" : "warning"} 
            className="flex items-center mb-2"
          >
            {approvalStatus ? (
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
          
          {!approvalStatus && (
            <div className="flex justify-end">
              <button 
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                onClick={handleRefresh}
                disabled={isRefreshingProfile}
              >
                <FaSync className={`mr-1 ${isRefreshingProfile ? 'animate-spin' : ''}`} />
                {isRefreshingProfile ? 'Checking status...' : 'Check approval status'}
              </button>
            </div>
          )}
        </div>
      )}
      
      <Dashboard
        role="deliveryuser"
        isLoading={isLoading}
        error={error}
        stats={stats}
        quickActions={quickActions}
        recentActivity={recentActivity}
        onRefresh={handleRefresh}
      />
    </div>
  );
};

export default DeliveryDashboard; 
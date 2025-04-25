import { useState, useEffect } from 'react';
import { FaMotorcycle, FaCheckCircle, FaClock, FaDollarSign, FaExclamationTriangle, FaSync } from 'react-icons/fa';
import Dashboard from '../../components/shared/Dashboard';
import { deliveryAPI, authAPI } from '../../utils/api'; // Import authAPI as well
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Alert } from '../../components/ui';

const DeliveryDashboard = () => {
  const { currentUser, updateProfile } = useAuth();
  const [stats, setStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(false);
  const [initialProfileLoadAttempted, setInitialProfileLoadAttempted] = useState(false);

  const refreshUserProfile = async (isInitialLoad = false) => {
    console.log('[refreshUserProfile] Starting...', { isInitialLoad });
    if (!isInitialLoad) {
      setIsRefreshingProfile(true);
    }
    let isApproved = false; // Default to false for safety
    try {
      const response = await authAPI.getCurrentUser();
      console.log('[refreshUserProfile] API response received:', response.data);
      
      const userData = response.data?.user || response.data?.data?.user || response.data;
      
      if (userData && typeof userData === 'object') {
        console.log('[refreshUserProfile] User data extracted:', JSON.stringify(userData, null, 2));
        
        isApproved = userData.deliveryRiderDetails?.approved === true;
        console.log('[refreshUserProfile] Approval status from API:', isApproved);
        
        setApprovalStatus(isApproved);

        if (updateProfile) {
          try {
            console.log('[refreshUserProfile] Attempting to update AuthContext...');
            await updateProfile(userData);
            console.log('[refreshUserProfile] AuthContext update successful.');
            const storedData = JSON.parse(localStorage.getItem('userData') || '{}');
            console.log('[refreshUserProfile] Data in localStorage after AuthContext update:', storedData.deliveryRiderDetails);
            if (storedData.deliveryRiderDetails?.approved !== isApproved) {
                 console.warn('[refreshUserProfile] localStorage not updated by AuthContext, updating manually.');
                 storedData.deliveryRiderDetails = { ...(storedData.deliveryRiderDetails || {}), approved: isApproved };
                 localStorage.setItem('userData', JSON.stringify(storedData));
            }
          } catch (authUpdateError) {
            console.error('[refreshUserProfile] Failed to update AuthContext:', authUpdateError);
             try {
                  const currentStoredData = JSON.parse(localStorage.getItem('userData') || '{}');
                  currentStoredData.deliveryRiderDetails = { ...(currentStoredData.deliveryRiderDetails || {}), approved: isApproved };
                  localStorage.setItem('userData', JSON.stringify(currentStoredData));
                  console.log('[refreshUserProfile] Updated localStorage manually after AuthContext error.');
             } catch (storageError) {
                  console.error('[refreshUserProfile] Failed to update localStorage after AuthContext error:', storageError);
             }
          }
        } else {
             console.warn('[refreshUserProfile] updateProfile function from AuthContext not available.');
             try {
                  const currentStoredData = JSON.parse(localStorage.getItem('userData') || '{}');
                  currentStoredData.deliveryRiderDetails = { ...(currentStoredData.deliveryRiderDetails || {}), approved: isApproved };
                  localStorage.setItem('userData', JSON.stringify(currentStoredData));
                  console.log('[refreshUserProfile] Updated localStorage manually (no updateProfile func).');
             } catch (storageError) {
                  console.error('[refreshUserProfile] Failed to update localStorage (no updateProfile func):', storageError);
             }
        }
        
      } else {
         console.warn('[refreshUserProfile] API call success, but no user data found in expected format.', response.data);
      }
    } catch (err) {
      console.error('[refreshUserProfile] Error fetching user profile:', err);
    } finally {
      if (!isInitialLoad) {
        setIsRefreshingProfile(false);
      }
      setInitialProfileLoadAttempted(true);
      console.log('[refreshUserProfile] Finished. Final approval status state:', isApproved);
    }
    return isApproved;
  };

  useEffect(() => {
    console.log('Dashboard Effect: Running initial load check...', { hasCurrentUser: !!currentUser, initialProfileLoadAttempted });
    if (!initialProfileLoadAttempted) {
      console.log('Dashboard Effect: Initial load not attempted yet. Proceeding...');
      setIsLoading(true);
      const fetchData = async () => {
        console.log('Dashboard Effect: fetchData running...');
        await refreshUserProfile(true);
        await fetchDashboardData();
        setIsLoading(false);
        console.log('Dashboard Effect: fetchData completed.');
      };
      fetchData();
      setInitialProfileLoadAttempted(true);
    } else {
        console.log('Dashboard Effect: Initial load already attempted or in progress.');
        if (!currentUser && isLoading) {
            setIsLoading(false);
        }
    }
  }, [initialProfileLoadAttempted]);

  const fetchDashboardData = async () => {
    console.log('[fetchDashboardData] Fetching dashboard stats...');
    setError(null);
    try {
      const response = await deliveryAPI.getDashboard();
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

  const handleRefresh = async () => {
    console.log('[handleRefresh] Manual refresh triggered.');
    setIsLoading(true);
    const isApprovedNow = await refreshUserProfile();
    await fetchDashboardData();
    setIsLoading(false);
    if (!approvalStatus && isApprovedNow) {
        toast.success('Your account status has been updated to Approved!');
    }
  };

  const quickActions = [
    { title: "View Orders", description: "Check available and active deliveries", icon: <FaMotorcycle className="w-8 h-8 mb-2" />, gradient: "bg-gradient-to-r from-blue-500 to-blue-700", link: "/delivery/orders", buttonText: "View Orders" },
    { title: "Delivery History", description: "View your past deliveries", icon: <FaCheckCircle className="w-8 h-8 mb-2" />, gradient: "bg-gradient-to-r from-green-500 to-green-700", link: "/delivery/history", buttonText: "View History" },
    { title: "Earnings", description: "Check your earnings and payments", icon: <FaDollarSign className="w-8 h-8 mb-2" />, gradient: "bg-gradient-to-r from-purple-500 to-purple-700", link: "/delivery/earnings", buttonText: "View Earnings" }
  ];

  console.log('Rendering DeliveryDashboard:', { isLoading, initialProfileLoadAttempted, approvalStatus });

  return (
    <div>
      {initialProfileLoadAttempted && (
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
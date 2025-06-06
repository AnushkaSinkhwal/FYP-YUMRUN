import { useContext, useEffect, useRef, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MyContext } from '../../context/UIContext.js';
import PropTypes from 'prop-types';
import { adminAPI, restaurantAPI, userAPI } from '../../utils/api';
import { 
  FaHome, 
  FaUtensils, 
  FaShoppingCart, 
  FaBell,
  FaEdit,
  FaChartLine,
  FaUsers,
  FaTruck,
  FaCog,
  FaHeart,
  FaStar,
  FaGift,
  FaUser,
  FaSignOutAlt
} from 'react-icons/fa';

const DashboardLayout = ({ children, role }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const { currentUser, logout } = useAuth();
  const { setIsAdminPath } = useContext(MyContext);
  const [notificationCount, setNotificationCount] = useState(0);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [approvalCount, setApprovalCount] = useState(0);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  // Debug user data
  useEffect(() => {
    console.log('DashboardLayout - currentUser:', currentUser);
    console.log('DashboardLayout - passed role prop:', role);
  }, [currentUser, role]);
  
  // Normalize role for navigation: map delivery_rider to deliveryuser, then fallback
  const rawRole = role || currentUser?.role?.toLowerCase();
  const normalizedRole = rawRole === 'delivery_rider' ? 'deliveryuser' : rawRole;
  const userRole = normalizedRole || 
    (currentUser?.isRestaurantOwner ? 'restaurant' : 
     currentUser?.isAdmin ? 'admin' : 
     currentUser?.isDeliveryRider ? 'deliveryuser' : 'user');
  
  // Get user details
  const [userData, setUserData] = useState({
    name: '',
    email: '',
  });
  
  // Navigation items based on role
  const getNavItems = () => {
    const items = {
      admin: [
        { path: '/admin/dashboard', label: 'Dashboard', icon: <FaHome className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/admin/restaurants', label: 'Restaurants', icon: <FaUtensils className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/admin/restaurant-approvals', label: 'Approvals', icon: <FaEdit className="w-4 h-4 sm:w-5 sm:h-5" />, badge: approvalCount > 0, count: approvalCount },
        { path: '/admin/users', label: 'Users', icon: <FaUsers className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/admin/riders', label: 'Riders', icon: <FaTruck className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/admin/orders', label: 'Orders', icon: <FaShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/admin/notifications', label: 'Notifications', icon: <FaBell className="w-4 h-4 sm:w-5 sm:h-5" />, badge: notificationCount > 0 },
        { path: '/admin/settings', label: 'Settings', icon: <FaCog className="w-4 h-4 sm:w-5 sm:h-5" /> },
      ],
      restaurant: [
        { path: '/restaurant/dashboard', label: 'Dashboard', icon: <FaHome className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/restaurant/menu', label: 'Menu', icon: <FaUtensils className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/restaurant/offers', label: 'Offers', icon: <FaGift className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/restaurant/orders', label: 'Orders', icon: <FaShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />, badge: newOrderCount > 0, count: newOrderCount },
        { path: '/restaurant/reviews', label: 'Reviews', icon: <FaStar className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/restaurant/notifications', label: 'Notifications', icon: <FaBell className="w-4 h-4 sm:w-5 sm:h-5" />, badge: notificationCount > 0 },
        { path: '/restaurant/profile', label: 'Profile', icon: <FaEdit className="w-4 h-4 sm:w-5 sm:h-5" /> },
      ],
      deliveryuser: [
        { path: '/delivery/dashboard', label: 'Dashboard', icon: <FaHome className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/delivery/orders',    label: 'Orders',      icon: <FaShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/delivery/notifications', label: 'Notifications', icon: <FaBell className="w-4 h-4 sm:w-5 sm:h-5" />, badge: notificationCount > 0 },
        { path: '/delivery/reviews',   label: 'Reviews',      icon: <FaStar className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/delivery/profile',   label: 'Profile',      icon: <FaUser className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/delivery/settings',  label: 'Settings',     icon: <FaCog className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/delivery/earnings',  label: 'Earnings',     icon: <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5" /> },
      ],
      user: [
        { path: '/user/dashboard', label: 'Dashboard', icon: <FaHome className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/user/orders', label: 'Orders', icon: <FaShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/user/notifications', label: 'Notifications', icon: <FaBell className="w-4 h-4 sm:w-5 sm:h-5" />, badge: notificationCount > 0 },
        { path: '/user/favorites', label: 'Favorites', icon: <FaHeart className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/user/reviews', label: 'Reviews', icon: <FaStar className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/user/profile', label: 'Profile', icon: <FaEdit className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/user/settings', label: 'Settings', icon: <FaCog className="w-4 h-4 sm:w-5 sm:h-5" /> },
      ],
    };
    return items[userRole] || items.user;
  };

  useEffect(() => {
    // Fetch notification and approval counts
    fetchNotificationCount();
    if (userRole === 'admin') fetchApprovalCount();
    if (userRole === 'restaurant') fetchNewOrderCount();
    
    // Poll for new notifications and approvals every minute
    const interval = setInterval(() => {
      fetchNotificationCount();
      if (userRole === 'admin') fetchApprovalCount();
      if (userRole === 'restaurant') fetchNewOrderCount();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [location.pathname]);
  
  // Add event listener for notification updates
  useEffect(() => {
    // Listen for custom event when notifications are marked as read
    const handleNotificationsUpdated = () => {
      console.log('Notifications updated event received, refreshing counts...');
      fetchNotificationCount();
    };
    
    window.addEventListener('notifications-updated', handleNotificationsUpdated);
    
    return () => {
      window.removeEventListener('notifications-updated', handleNotificationsUpdated);
    };
  }, []);
  
  // Handle click outside profile dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const fetchNotificationCount = async () => {
    try {
      if (userRole === 'admin') {
        // Get unread notifications count for admin
        try {
          const response = await adminAPI.getUnreadNotificationCount();
          
          if (response.data.success) {
            setNotificationCount(response.data.count || 0);
            console.log('Admin unread notification count:', response.data.count);
          } else {
            setNotificationCount(0);
            console.error('Failed to fetch admin notification count');
          }
        } catch (error) {
          console.error('Error fetching admin notification count:', error);
          setNotificationCount(0);
        }
      } else if (userRole === 'restaurant') {
        // For restaurant owners, check for unread notifications
        try {
          const response = await restaurantAPI.getUnreadNotificationCount();
          
          if (response.data.success) {
            setNotificationCount(response.data.count || 0);
            console.log('Restaurant notification count:', response.data.count);
          } else {
            setNotificationCount(0);
            console.error('Failed to fetch restaurant notification count');
          }
        } catch (error) {
          console.error('Error fetching restaurant notification count:', error);
          setNotificationCount(0);
        }
      } else if (userRole === 'deliveryuser') {
        // For delivery users, check for unread notifications
        // (Using userAPI for now, create deliveryAPI if needed)
        try {
          const response = await userAPI.getUnreadNotificationCount(); // Assuming delivery uses user notifications
          
          if (response.data.success) {
            setNotificationCount(response.data.count || 0);
            console.log('Delivery user notification count:', response.data.count);
          } else {
            setNotificationCount(0);
            console.error('Failed to fetch delivery user notification count');
          }
        } catch (error) {
          console.error('Error fetching delivery user notification count:', error);
          setNotificationCount(0);
        }
      } else if (userRole === 'user') {
        // For regular users, check for unread notifications
        try {
          const response = await userAPI.getUnreadNotificationCount();
          
          if (response.data.success) {
            setNotificationCount(response.data.count || 0);
            console.log('User notification count:', response.data.count);
          } else {
            setNotificationCount(0);
            console.error('Failed to fetch user notification count');
          }
        } catch (error) {
          console.error('Error fetching user notification count:', error);
          setNotificationCount(0);
        }
      } else {
        // Default - no notifications for other roles
        setNotificationCount(0);
      }
    } catch (err) {
      console.error('Failed to fetch notification count:', err);
      setNotificationCount(0);
    }
  };
  
  // Fetch pending approval count for admin
  const fetchApprovalCount = async () => {
    try {
      const response = await adminAPI.getRestaurantApprovalsCount();
      if (response.data.success) {
        setApprovalCount(response.data.count || 0);
      }
    } catch (err) {
      console.error('Error fetching approval count:', err);
      setApprovalCount(0);
    }
  };
  
  // Fetch new order count for restaurant owners
  const fetchNewOrderCount = async () => {
    try {
      if (userRole === 'restaurant') {
        const response = await restaurantAPI.getDashboard();
        if (response.data.success && response.data.data) {
          setNewOrderCount(response.data.data.pendingOrders || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching restaurant new order count:', err);
      setNewOrderCount(0);
    }
  };
  
  const handleLogout = async () => {
    await logout();
    // Reset UI state
    if (setIsAdminPath) {
      setIsAdminPath(false);
    }
    window.location.href = '/';
  };

  const getRoleTitle = () => {
    const titles = {
      admin: 'Admin Panel',
      restaurant: 'Restaurant Panel',
      deliveryuser: 'Delivery Panel',
      user: 'User Dashboard'
    };
    return titles[userRole] || 'Dashboard';
  };

  const getNotificationLink = () => {
    switch(userRole) {
      case 'admin':
        return '/admin/notifications';
      case 'restaurant':
        return '/restaurant/notifications';
      case 'deliveryuser':
        // Corrected role check for delivery user navigation
        return '/delivery/notifications'; 
      case 'user':
      default:
        return '/user/notifications';
    }
  };

  useEffect(() => {
    // Fetch user details based on role
    const fetchUserDetails = async () => {
      try {
        // Use currentUser from useAuth context instead of fetching again
        if (currentUser) {
          setUserData({
            name: currentUser.fullName || currentUser.name || 'User',
            email: currentUser.email || ''
          });
        }
      } catch (error) {
        console.error('Error setting user details from context:', error);
        // Fallback or default values if needed
        setUserData({ name: 'User', email: '' });
      }
    };

    fetchUserDetails();
  }, [currentUser]);

  return (
    <div className="flex h-screen text-gray-900 bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      {/* Sidebar always visible; collapse logic removed */}
      <aside className="fixed lg:sticky top-0 left-0 z-30 w-64 h-full bg-white dark:bg-gray-800 shadow-lg">
        {/* Logo and brand */}
        <div className="flex items-center justify-between h-16 px-4 text-white bg-yumrun-primary dark:bg-yumrun-primary">
          <Link to={`/${userRole}/dashboard`} className="text-lg font-bold">
            {getRoleTitle()}
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-1">
            {getNavItems().map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center px-4 py-2 text-sm rounded-md transition-colors cursor-pointer
                    ${location.pathname === item.path
                      ? 'bg-yumrun-primary text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                  {item.badge && (
                    <span className="flex items-center justify-center w-5 h-5 ml-auto text-xs font-bold text-white bg-red-600 rounded-full">
                      {item.count !== undefined
                        ? (item.count > 9 ? '9+' : item.count)
                        : (notificationCount > 9 ? '9+' : notificationCount)
                      }
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="z-10 bg-white shadow-sm dark:bg-gray-800">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Dashboard title for large screens */}
            <div className="hidden lg:block">
              <h1 className="text-xl font-semibold">{getRoleTitle()}</h1>
            </div>
            
            {/* Right-side controls */}
            <div className="flex items-center space-x-3">
              {/* Home button */}
              <button 
                onClick={() => navigate('/')}
                className="flex items-center p-2 text-gray-600 rounded-md dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Go to Homepage"
                title="Return to Homepage"
              >
                <FaHome className="w-5 h-5" />
                <span className="hidden ml-2 md:inline">Home</span>
              </button>
              
              {/* Notifications */}
              <button 
                onClick={() => navigate(getNotificationLink())}
                className="relative p-2 text-gray-600 rounded-full dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Notifications"
              >
                <FaBell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
              
              {/* Profile dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  className="flex items-center p-2 space-x-2 text-gray-600 rounded-full dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                >
                  <img
                    className="w-8 h-8 rounded-full"
                    // Use a placeholder or fetched avatar URL
                    src={currentUser?.avatar || "/assets/img/default-avatar.png"} 
                    alt="User Avatar"
                  />
                  <span className="hidden md:block">{userData.name || 'User'}</span>
                </button>
                {showProfileDropdown && (
                  <div className="absolute right-0 z-50 w-56 mt-2 bg-white rounded-md shadow-lg dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{userData.name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate dark:text-gray-400">{userData.email || 'No email'}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{getRoleTitle()}</p>
                    </div>
                    <div className="py-1">
                      <Link 
                        to={`/${userRole}/profile`} 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <FaUser className="w-4 h-4 mr-2" /> Profile
                      </Link>
                      <Link 
                        to={`/${userRole}/settings`} 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <FaCog className="w-4 h-4 mr-2" /> Settings
                      </Link>
                      <div className="border-t border-gray-200 dark:border-gray-700"></div>
                      <button
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={handleLogout}
                      >
                        <FaSignOutAlt className="w-4 h-4 mr-2" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main id="main-content" className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

DashboardLayout.propTypes = {
  children: PropTypes.node,
  role: PropTypes.string // Role prop is now optional
};

export default DashboardLayout; 
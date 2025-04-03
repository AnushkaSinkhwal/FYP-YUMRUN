import { useContext, useEffect, useRef, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MyContext } from '../../App';
import PropTypes from 'prop-types';
import { adminAPI, restaurantAPI, userAPI } from '../../utils/api';
import { 
  FaHome, 
  FaUtensils, 
  FaShoppingCart, 
  FaBell, 
  FaBars, 
  FaTimes,
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
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Debug user data
  useEffect(() => {
    console.log('DashboardLayout - currentUser:', currentUser);
    console.log('DashboardLayout - passed role prop:', role);
  }, [currentUser, role]);
  
  // Get user role from props, currentUser, or default to fallback
  const userRole = role || (currentUser?.role?.toLowerCase()) || 
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
        { path: '/admin/restaurant-approvals', label: 'Approvals', icon: <FaEdit className="w-4 h-4 sm:w-5 sm:h-5" />, badge: notificationCount > 0 },
        { path: '/admin/users', label: 'Users', icon: <FaUsers className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/admin/orders', label: 'Orders', icon: <FaShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/admin/deliveries', label: 'Deliveries', icon: <FaTruck className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/admin/notifications', label: 'Notifications', icon: <FaBell className="w-4 h-4 sm:w-5 sm:h-5" />, badge: notificationCount > 0 },
        { path: '/admin/settings', label: 'Settings', icon: <FaCog className="w-4 h-4 sm:w-5 sm:h-5" /> },
      ],
      restaurant: [
        { path: '/restaurant/dashboard', label: 'Dashboard', icon: <FaHome className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/restaurant/menu', label: 'Menu', icon: <FaUtensils className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/restaurant/orders', label: 'Orders', icon: <FaShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/restaurant/notifications', label: 'Notifications', icon: <FaBell className="w-4 h-4 sm:w-5 sm:h-5" />, badge: notificationCount > 0 },
        { path: '/restaurant/profile', label: 'Profile', icon: <FaEdit className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/restaurant/analytics', label: 'Analytics', icon: <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5" /> },
      ],
      deliveryuser: [
        { path: '/delivery/dashboard', label: 'Dashboard', icon: <FaHome className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/delivery/orders', label: 'Orders', icon: <FaShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/delivery/notifications', label: 'Notifications', icon: <FaBell className="w-4 h-4 sm:w-5 sm:h-5" />, badge: notificationCount > 0 },
        { path: '/delivery/history', label: 'History', icon: <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/delivery/profile', label: 'Profile', icon: <FaEdit className="w-4 h-4 sm:w-5 sm:h-5" /> },
      ],
      user: [
        { path: '/user/dashboard', label: 'Dashboard', icon: <FaHome className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/user/orders', label: 'Orders', icon: <FaShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/user/notifications', label: 'Notifications', icon: <FaBell className="w-4 h-4 sm:w-5 sm:h-5" />, badge: notificationCount > 0 },
        { path: '/user/favorites', label: 'Favorites', icon: <FaHeart className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/user/reviews', label: 'Reviews', icon: <FaStar className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/user/rewards', label: 'Rewards', icon: <FaGift className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/user/profile', label: 'Profile', icon: <FaEdit className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/user/settings', label: 'Settings', icon: <FaCog className="w-4 h-4 sm:w-5 sm:h-5" /> },
      ],
    };
    return items[userRole] || items.user;
  };

  useEffect(() => {
    // Close sidebar when changing routes on mobile
    setIsMobileSidebarOpen(false);
    
    // Fetch notification count
    fetchNotificationCount();
    
    // Poll for new notifications every minute
    const interval = setInterval(() => {
      fetchNotificationCount();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [location.pathname]);
  
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
        // Check for pending restaurant approvals
        try {
          const response = await adminAPI.getRestaurantApprovalsCount();
          
          if (response.data.success) {
            setNotificationCount(response.data.count || 0);
            console.log('Admin notification count:', response.data.count);
          } else {
            setNotificationCount(0);
            console.error('Failed to fetch admin approval count');
          }
        } catch (error) {
          console.error('Error fetching approval count:', error);
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
        try {
          const response = await userAPI.getUnreadNotificationCount();
          
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
        const token = localStorage.getItem('token');
        if (!token) return;

        let response;
        if (userRole === 'restaurant') {
          response = await restaurantAPI.getRestaurantProfile();
        } else if (userRole === 'admin' || userRole === 'user' || userRole === 'deliveryuser') {
          response = await userAPI.getUserProfile();
        }

        if (response && response.data && response.data.success) {
          setUserData({
            name: response.data.user.name || response.data.restaurant.name || 'User',
            email: response.data.user.email || response.data.restaurant.email || '',
          });
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserDetails();
  }, [userRole]);

  return (
    <div className="flex h-screen text-gray-900 bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:sticky top-0 left-0 z-30 w-64 h-full bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 transform 
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo and brand */}
        <div className="flex items-center justify-between h-16 px-4 text-white bg-yumrun-primary dark:bg-yumrun-primary">
          <Link to={`/${userRole}/dashboard`} className="text-lg font-bold">
            {getRoleTitle()}
          </Link>
          
          <button 
            className="p-1 rounded-md hover:bg-yumrun-primary-dark lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-1">
            {getNavItems().map((item) => (
              <li key={item.path}>
                <div
                  onClick={() => {
                    console.log('Navigating to:', item.path);
                    navigate(item.path);
                  }}
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
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </div>
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
            {/* Mobile menu button */}
            <button
              className="p-2 text-gray-600 rounded-md dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yumrun-primary lg:hidden"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <FaBars className="w-5 h-5" />
            </button>
            
            {/* Dashboard title for large screens */}
            <div className="hidden lg:block">
              <h1 className="text-xl font-semibold">{getRoleTitle()}</h1>
            </div>
            
            {/* Right-side controls */}
            <div className="flex items-center space-x-3">
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
                    src="/assets/img/default-avatar.png"
                    alt="User Avatar"
                  />
                  <span className="hidden md:block">{userData.name}</span>
                </button>
                {showProfileDropdown && (
                  <div className="absolute right-0 z-50 w-56 mt-2 bg-white rounded-md shadow-lg dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{userData.name}</p>
                      <p className="text-xs text-gray-500 truncate dark:text-gray-400">{userData.email}</p>
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
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

DashboardLayout.propTypes = {
  children: PropTypes.node,
  role: PropTypes.string
};

export default DashboardLayout; 
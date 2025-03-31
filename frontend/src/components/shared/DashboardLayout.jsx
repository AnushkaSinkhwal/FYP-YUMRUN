import { useContext, useEffect, useRef, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MyContext } from '../../App';
import PropTypes from 'prop-types';
import { 
  FaHome, 
  FaUtensils, 
  FaShoppingCart, 
  FaBell, 
  FaUserCircle, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes,
  FaEdit,
  FaChartLine,
  FaUsers,
  FaTruck,
  FaCog,
  FaHeart,
  FaStar,
  FaGift
} from 'react-icons/fa';

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const dropdownRef = useRef(null);
  const { currentUser, logout } = useAuth();
  const { setIsAdminPath } = useContext(MyContext);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Get user role from currentUser
  const userRole = currentUser?.role?.toLowerCase() || 'user';
  
  // Navigation items based on role
  const getNavItems = () => {
    const items = {
      admin: [
        { path: '/admin/dashboard', label: 'Dashboard', icon: <FaHome className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/admin/restaurant', label: 'Restaurants', icon: <FaUtensils className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/admin/users', label: 'Users', icon: <FaUsers className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/admin/orders', label: 'Orders', icon: <FaShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/admin/deliveries', label: 'Deliveries', icon: <FaTruck className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/admin/settings', label: 'Settings', icon: <FaCog className="w-4 h-4 sm:w-5 sm:h-5" /> },
      ],
      restaurantowner: [
        { path: '/restaurant/dashboard', label: 'Dashboard', icon: <FaHome className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/restaurant/menu', label: 'Menu', icon: <FaUtensils className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/restaurant/orders', label: 'Orders', icon: <FaShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/restaurant/profile', label: 'Profile', icon: <FaEdit className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/restaurant/analytics', label: 'Analytics', icon: <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5" /> },
      ],
      deliveryuser: [
        { path: '/delivery/dashboard', label: 'Dashboard', icon: <FaHome className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/delivery/orders', label: 'Orders', icon: <FaShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/delivery/history', label: 'History', icon: <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/delivery/profile', label: 'Profile', icon: <FaEdit className="w-4 h-4 sm:w-5 sm:h-5" /> },
      ],
      user: [
        { path: '/user/dashboard', label: 'Dashboard', icon: <FaHome className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/user/orders', label: 'Orders', icon: <FaShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/user/favorites', label: 'Favorites', icon: <FaHeart className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/user/reviews', label: 'Reviews', icon: <FaStar className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/user/rewards', label: 'Rewards', icon: <FaGift className="w-4 h-4 sm:w-5 sm:h-5" /> },
        { path: '/user/profile', label: 'Profile', icon: <FaEdit className="w-4 h-4 sm:w-5 sm:h-5" /> },
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
      // TODO: Replace with actual API call based on role
      setNotificationCount(3); // Simulated count
    } catch (err) {
      console.error('Failed to fetch notification count:', err);
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
      restaurantowner: 'Restaurant Panel',
      deliveryuser: 'Delivery Panel',
      user: 'User Dashboard'
    };
    return titles[userRole] || 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
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
        <div className="flex items-center justify-between h-16 px-4 bg-yumrun-primary dark:bg-yumrun-primary text-white">
          <Link to={`/${userRole}/dashboard`} className="font-bold text-lg">
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
                <Link
                  to={item.path}
                  className={`
                    flex items-center px-4 py-2 text-sm rounded-md transition-colors
                    ${location.pathname === item.path
                      ? 'bg-yumrun-primary text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yumrun-primary lg:hidden"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <FaBars className="w-5 h-5" />
            </button>
            
            {/* Page title - show current path */}
            <div className="hidden md:block">
              <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200 capitalize">
                {location.pathname.split('/').pop().replace('-', ' ')}
              </h1>
            </div>
            
            {/* Header right */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Link 
                to={`/${userRole}/notifications`}
                className="relative p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <FaBell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center text-xs font-bold text-white bg-red-600 rounded-full">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Link>
              
              {/* Profile dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  className="flex items-center focus:outline-none"
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                >
                  <span className="hidden md:block mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {currentUser?.name || 'User'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center justify-center">
                    <FaUserCircle className="w-7 h-7" />
                  </div>
                </button>
                
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50">
                    <Link
                      to={`/${userRole}/profile`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      <FaUserCircle className="mr-2" />
                      Profile Settings
                    </Link>
                    
                    <button
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt className="mr-2" />
                      Logout
                    </button>
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
  children: PropTypes.node
};

export default DashboardLayout; 
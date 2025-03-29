import { useContext, useEffect, useRef, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { MyContext } from '../../App';
import { 
  FaHome, 
  FaUsers, 
  FaUtensils, 
  FaShoppingCart, 
  FaTruck, 
  FaBell, 
  FaUserCircle, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes
} from 'react-icons/fa';

const AdminLayout = () => {
  const location = useLocation();
  const dropdownRef = useRef(null);
  const { currentUser, logout } = useAuth();
  const { setIsAdminPath } = useContext(MyContext);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
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
  
  // Handle window resize to close mobile sidebar on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const fetchNotificationCount = async () => {
    try {
      const response = await adminAPI.getNotificationCount();
      if (response.data?.success) {
        setNotificationCount(response.data.count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notification count:', err);
    }
  };
  
  const handleLogout = async () => {
    await logout();
    // Reset UI state to ensure header is shown on home page after logout
    if (setIsAdminPath) {
      setIsAdminPath(false);
    }
    
    // Force a reload to ensure all state is properly reset
    window.location.href = '/';
  };
  
  // Navigation items
  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: <FaHome className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { path: '/admin/users', label: 'Users', icon: <FaUsers className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { path: '/admin/restaurants', label: 'Restaurants', icon: <FaUtensils className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { path: '/admin/orders', label: 'Orders', icon: <FaShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { path: '/admin/deliveries', label: 'Deliveries', icon: <FaTruck className="w-4 h-4 sm:w-5 sm:h-5" /> },
  ];
  
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
        <div className="flex items-center justify-between h-16 px-4 bg-blue-600 dark:bg-blue-800 text-white">
          <Link to="/admin/dashboard" className="font-bold text-lg">
            YumRun Admin
          </Link>
          
          <button 
            className="p-1 rounded-md hover:bg-blue-700 dark:hover:bg-blue-900 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="mt-4 px-2 h-[calc(100%-10rem)] overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors
                    ${location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }
                  `}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Logout button at bottom of sidebar */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-md transition-colors"
          >
            <FaSignOutAlt className="mr-2" />
            Logout
          </button>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
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
                to="/admin/notifications" 
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
                    {currentUser?.name || 'Admin'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center justify-center">
                    <FaUserCircle className="w-7 h-7" />
                  </div>
                </button>
                
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 z-10">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 md:hidden">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {currentUser?.name || 'Admin'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {currentUser?.email || 'admin@example.com'}
                      </p>
                    </div>
                    
                    <Link 
                      to="/admin/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      Profile Settings
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </main>
        
        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 px-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>© {new Date().getFullYear()} YumRun. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout; 
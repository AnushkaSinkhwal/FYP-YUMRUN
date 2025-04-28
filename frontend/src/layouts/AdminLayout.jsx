import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiUsers, FiSettings, FiBell, FiUser, FiLogOut, FiMenu, FiX, FiHome, FiShoppingCart, FiTruck, FiCoffee } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/signin');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: <FiHome /> },
    { name: 'Users', href: '/admin/users', icon: <FiUsers /> },
    { name: 'Restaurants', href: '/admin/restaurants', icon: <FiCoffee /> },
    { name: 'Restaurant Approvals', href: '/admin/restaurant-approvals', icon: <FiCoffee /> },
    { name: 'Orders', href: '/admin/orders', icon: <FiShoppingCart /> },
    { name: 'Deliveries', href: '/admin/deliveries', icon: <FiTruck /> },
    { name: 'Riders', href: '/admin/riders', icon: <FiTruck /> },
    { name: 'Settings', href: '/admin/settings', icon: <FiSettings /> }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 bg-white shadow-md transition-all duration-300 z-20 
          ${isSidebarOpen ? 'w-64' : 'w-20'} overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <Link to="/admin" className="flex items-center space-x-2">
              <img src="/logo.svg" alt="YumRun Admin" className="w-8 h-8" />
              <span className={`font-semibold text-lg transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                YumRun Admin
              </span>
            </Link>
            <button 
              onClick={toggleSidebar}
              className="p-1 rounded-md hover:bg-gray-100 focus:outline-none"
            >
              {isSidebarOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => 
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive 
                      ? 'bg-yumrun-primary text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className={`transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                  {item.name}
                </span>
              </NavLink>
            ))}
          </nav>

          {/* User menu */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <img 
                  src={currentUser?.avatar || '/images/default-avatar.png'} 
                  alt={currentUser?.name || 'Admin'} 
                  className="w-10 h-10 rounded-full"
                />
              </div>
              <div className={`transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                <p className="text-sm font-medium">{currentUser?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500">{currentUser?.email || ''}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1 ml-auto text-gray-500 hover:text-red-500"
                title="Logout"
              >
                <FiLogOut />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top header */}
        <header className="sticky top-0 z-10 bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <h1 className="text-xl font-semibold">Admin Portal</h1>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <NavLink 
                to="/admin/notifications" 
                className="relative p-2 text-gray-500 hover:text-yumrun-primary"
              >
                <FiBell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1">5</Badge>
              </NavLink>
              
              {/* Profile */}
              <NavLink 
                to="/admin/profile" 
                className="p-2 text-gray-500 hover:text-yumrun-primary"
              >
                <FiUser className="w-5 h-5" />
              </NavLink>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout; 
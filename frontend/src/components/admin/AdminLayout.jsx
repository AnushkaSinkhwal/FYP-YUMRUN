import React, { useState, useContext, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { MyContext } from '../../App';
import './admin-layout.css';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
  const { 
    theme, 
    setTheme,
    isHideSidebarAndHeader,
    windowWidth
  } = useContext(MyContext);
  
  const { currentUser, logout } = useAuth();
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    // Use the logout function from AuthContext
    logout();
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // If hiding sidebar/header (for login page, etc.)
  if (isHideSidebarAndHeader) {
    return <Outlet />;
  }

  return (
    <div className={`admin-layout ${theme}`}>
      {/* Sidebar */}
      <div className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            {!isSidebarCollapsed && <span>YumRun Admin</span>}
          </div>
          <button className="toggle-btn" onClick={toggleSidebar}>
            {isSidebarCollapsed ? '→' : '←'}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            <li>
              <Link 
                to="/admin/dashboard" 
                className={isActive('/admin/dashboard') || isActive('/admin') ? 'active' : ''}
              >
                <i className="bi bi-speedometer2"></i>
                {!isSidebarCollapsed && <span>Dashboard</span>}
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/restaurants" 
                className={isActive('/admin/restaurants') ? 'active' : ''}
              >
                <i className="bi bi-shop"></i>
                {!isSidebarCollapsed && <span>Restaurants</span>}
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/categories" 
                className={isActive('/admin/categories') ? 'active' : ''}
              >
                <i className="bi bi-tags"></i>
                {!isSidebarCollapsed && <span>Categories</span>}
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/products" 
                className={isActive('/admin/products') ? 'active' : ''}
              >
                <i className="bi bi-box"></i>
                {!isSidebarCollapsed && <span>Products</span>}
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/users" 
                className={isActive('/admin/users') ? 'active' : ''}
              >
                <i className="bi bi-people"></i>
                {!isSidebarCollapsed && <span>Users</span>}
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/settings" 
                className={isActive('/admin/settings') ? 'active' : ''}
              >
                <i className="bi bi-gear"></i>
                {!isSidebarCollapsed && <span>Settings</span>}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className={`admin-main-content ${isSidebarCollapsed ? 'expanded' : ''}`}>
        {/* Header */}
        <header className="admin-header">
          <div className="header-left">
            <h1 className="page-title">
              {location.pathname === '/admin' || location.pathname === '/admin/dashboard' ? 'Dashboard' : 
               location.pathname === '/admin/restaurants' ? 'Restaurants' :
               location.pathname === '/admin/categories' ? 'Categories' :
               location.pathname === '/admin/products' ? 'Products' :
               location.pathname === '/admin/users' ? 'Users' :
               location.pathname === '/admin/settings' ? 'Settings' : ''}
            </h1>
          </div>
          <div className="header-right">
            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === 'light' ? <i className="bi bi-moon"></i> : <i className="bi bi-sun"></i>}
            </button>
            <div className="dropdown">
              <button className="btn dropdown-toggle admin-profile-btn" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
                <img src="https://via.placeholder.com/32" alt="Admin" className="admin-avatar" />
                {windowWidth > 768 && <span>{currentUser?.name || 'Admin'}</span>}
              </button>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton">
                <li><Link className="dropdown-item" to="/admin/settings">Settings</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
              </ul>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="admin-footer">
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-6">
                <p>&copy; 2023 YumRun Admin. All rights reserved.</p>
              </div>
              <div className="col-md-6 text-end">
                <p>Version 1.0.0</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout; 
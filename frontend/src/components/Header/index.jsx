import { Link } from 'react-router-dom';
import Logo from '../../assets/images/logo.png'; // Updated logo path
import CityDropdown from "../CityDropdown";
import { FaRegUserCircle, FaSearch, FaMapMarkerAlt, FaSignOutAlt, FaUser } from "react-icons/fa";
import { RiDashboardLine } from "react-icons/ri";
import { BsTelephone } from "react-icons/bs";
import { MdOutlineEmail } from "react-icons/md";
import SearchBox from './SearchBox';
import Navigation from "./Navigation";
import { useContext, useState, useEffect, useRef } from 'react';
import { MyContext } from '../../App';
import { useAuth } from '../../context/AuthContext';
import { Container, Button } from '../../components/ui';

const Header = () => {
  const { setIsLoading } = useContext(MyContext);
  const { currentUser, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [showSearch, setShowSearch] = useState(false);
  const [cartActive, setCartActive] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef(null);

  // Check if screen is mobile on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth >= 992) {
        setShowSearch(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle ESC key to close dropdown
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showUserDropdown]);

  // Simulate cart activity for demo purposes
  useEffect(() => {
    // After 3 seconds, activate cart animation
    const timer = setTimeout(() => {
      setCartActive(true);
      
      // Turn off animation after 5 seconds
      setTimeout(() => {
        setCartActive(false);
      }, 5000);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };

  const handleCartClick = () => {
    setCartActive(true);
    setTimeout(() => {
      setCartActive(false);
    }, 800);
    
    // Trigger page loading animation
    if (window.location.pathname !== '/cart') {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  const handleLogout = () => {
    logout();
    
    // Force a reload to reset all global state
    window.location.href = '/';
  };

  return (
    <div className="w-full border-b border-gray-200 bg-white">
      {/* Top Strip */}
      <div className="w-full py-2 bg-yumrun-primary">
        <Container>
          <div className="flex flex-col md:flex-row md:justify-between items-center">
            <div className="hidden md:flex items-center space-x-4">
              <a href="tel:+9771234567" className="flex items-center text-white text-sm hover:text-gray-100" aria-label="Call us">
                <BsTelephone className="mr-1" />
                <span>+977 1234567</span>
              </a>
              <a href="mailto:info@yumrun.com" className="flex items-center text-white text-sm hover:text-gray-100" aria-label="Email us">
                <MdOutlineEmail className="mr-1" />
                <span>info@yumrun.com</span>
              </a>
            </div>
            <p className="text-white text-sm text-center md:text-right mb-0">Delivering Delicious Food To Your Doorstep</p>
          </div>
        </Container>
      </div>

      {/* Header Section */}
      <header className="py-5">
        <Container>
          <div className="flex items-center justify-between">
            {/* Logo Wrapper */}
            <div className="w-32 lg:w-40">
              <Link to="/" className="block" aria-label="YumRun Home">
                <img src={Logo} alt="YumRun" className="h-auto w-full transition-all duration-200 hover:opacity-90" />
              </Link>
            </div>

            {/* Search and Navigation */}
            <div className="hidden lg:flex items-center space-x-4 flex-1 px-6">
              <div className="flex items-center mr-3">
                <FaMapMarkerAlt className="text-yumrun-secondary mr-2" aria-hidden="true" />
                <CityDropdown />
              </div>
              <div className="flex-1">
                <SearchBox />
              </div>
            </div>

            {/* User & Cart Section */}
            <div className="flex items-center space-x-3">
              {isMobile && (
                <button 
                  className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors" 
                  onClick={toggleSearch}
                  aria-label="Toggle search"
                >
                  <FaSearch className="text-gray-700" aria-hidden="true" />
                </button>
              )}

              {/* Sign In/Profile Button */}
              {!currentUser ? (
                <Link to="/signin">
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <FaRegUserCircle className="text-gray-700" aria-hidden="true" />
                    {!isMobile && <span>Sign In</span>}
                  </Button>
                </Link>
              ) : (
                <div className="relative" ref={userDropdownRef}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={toggleUserDropdown}
                    aria-expanded={showUserDropdown}
                    aria-controls="user-dropdown-menu"
                    className="flex items-center space-x-2"
                  >
                    <FaRegUserCircle className="text-gray-700" aria-hidden="true" />
                    {!isMobile && (
                      <span>{currentUser.name?.split(' ')[0] || 'Profile'}</span>
                    )}
                  </Button>
                  
                  {showUserDropdown && (
                    <div 
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                      id="user-dropdown-menu" 
                      role="menu"
                    >
                      <Link 
                        to="/profile" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <FaUser className="mr-2" />
                        My Profile
                      </Link>
                      
                      {currentUser.isAdmin && (
                        <Link 
                          to="/admin/dashboard" 
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
                          onClick={() => setShowUserDropdown(false)}
                        >
                          <RiDashboardLine className="mr-2" />
                          Admin Dashboard
                        </Link>
                      )}
                      
                      <button 
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
                        onClick={handleLogout}
                        aria-label="Logout"
                      >
                        <FaSignOutAlt className="mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Cart Section */}
              <div className="relative">
                <Link 
                  to="/cart" 
                  className={`relative flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors ${cartActive ? 'animate-cartBounce' : ''}`}
                  onClick={handleCartClick}
                  aria-label="Shopping cart"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M20.5001 5.99994H16.0001V4.99994C16.0001 2.79994 14.2101 0.999939 12.0001 0.999939C9.79014 0.999939 8.00014 2.79994 8.00014 4.99994V5.99994H3.50014C2.10014 5.99994 1.00014 7.09994 1.00014 8.49994V17.9999C1.00014 19.3999 2.10014 20.4999 3.50014 20.4999H20.5001C21.9001 20.4999 23.0001 19.3999 23.0001 17.9999V8.49994C23.0001 7.09994 21.9001 5.99994 20.5001 5.99994ZM10.0001 4.99994C10.0001 3.89994 10.9001 2.99994 12.0001 2.99994C13.1001 2.99994 14.0001 3.89994 14.0001 4.99994V5.99994H10.0001V4.99994ZM21.0001 17.9999C21.0001 18.2999 20.8001 18.4999 20.5001 18.4999H3.50014C3.20014 18.4999 3.00014 18.2999 3.00014 17.9999V8.49994C3.00014 8.19994 3.20014 7.99994 3.50014 7.99994H8.00014V9.99994C8.00014 10.5499 8.45014 10.9999 9.00014 10.9999C9.55014 10.9999 10.0001 10.5499 10.0001 9.99994V7.99994H14.0001V9.99994C14.0001 10.5499 14.4501 10.9999 15.0001 10.9999C15.5501 10.9999 16.0001 10.5499 16.0001 9.99994V7.99994H20.5001C20.8001 7.99994 21.0001 8.19994 21.0001 8.49994V17.9999Z" fill="black"/>
                  </svg>
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-yumrun-accent text-white text-xs font-semibold rounded-full">10</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile search bar */}
          {(isMobile && showSearch) && (
            <div className="mt-4 w-full">
              <SearchBox />
            </div>
          )}
        </Container>
      </header>
      
      <Navigation />
    </div>
  );
}

export default Header;


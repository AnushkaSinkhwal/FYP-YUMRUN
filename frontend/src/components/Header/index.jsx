import { Link } from 'react-router-dom';
import Logo from '../../assets/images/logo.png'; // Updated logo path
import CityDropdown from "../CityDropdown";
import Button from '@mui/material/Button';
import { FaRegUserCircle, FaSearch, FaMapMarkerAlt } from "react-icons/fa";
import { BsTelephone } from "react-icons/bs";
import { MdOutlineEmail } from "react-icons/md";
import SearchBox from './SearchBox';
import Navigation from "./Navigation";
import { useContext, useState, useEffect } from 'react';
import { MyContext } from '../../App';

const Header = () => {
  const context = useContext(MyContext);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [showSearch, setShowSearch] = useState(false);
  const [cartActive, setCartActive] = useState(false);
  const { setIsLoading } = useContext(MyContext);

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

  return (
    <div className="headerWrapper">
      {/* Top Strip */}
      <div className="top-strip">
        <div className="container">
          <div className="row">
            <div className="col-md-6 d-none d-md-flex">
              <div className="top-contact-info">
                <a href="tel:+9771234567" className="top-contact-item" aria-label="Call us">
                  <BsTelephone className="top-icon" />
                  <span>+977 1234567</span>
                </a>
                <a href="mailto:info@yumrun.com" className="top-contact-item" aria-label="Email us">
                  <MdOutlineEmail className="top-icon" />
                  <span>info@yumrun.com</span>
                </a>
              </div>
            </div>
            <div className="col-md-6 text-md-right text-center">
              <p className="welcome-text mb-0">Delivering Delicious Food To Your Doorstep</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header Section */}
      <header className="header">
        <div className="container">
          <div className="row align-items-center">
            {/* Logo Wrapper */}
            <div className="logoWrapper col-lg-2 col-md-3 col-6">
              <Link to="/" className="logo-link" aria-label="YumRun Home">
                <img src={Logo} alt="YumRun" className="header-logo" width="auto" height="auto" />
              </Link>
            </div>

            {/* Search and Navigation */}
            <div className="col-lg-7 col-md-4 d-flex align-items-center justify-content-center">
              {!isMobile && (
                <>
                  <div className="location-selector d-flex align-items-center mr-3">
                    <FaMapMarkerAlt className="location-icon" aria-hidden="true" />
                    <CityDropdown />
                  </div>
                  <div className="search-container flex-grow-1">
                    <SearchBox />
                  </div>
                </>
              )}
            </div>

            {/* User & Cart Section */}
            <div className="col-lg-3 col-md-5 col-6 d-flex align-items-center justify-content-end">
              {isMobile && (
                <Button 
                  className="search-toggle-btn mr-2" 
                  onClick={toggleSearch}
                  aria-label="Toggle search"
                >
                  <FaSearch aria-hidden="true" />
                </Button>
              )}

              {/* Sign In/Profile Button */}
              {context.isLogin !== true ? (
                <Link to="/signIn" className="auth-link">
                  <Button className='header-btn auth-btn' aria-label="Sign In">
                    <FaRegUserCircle className="btn-icon" aria-hidden="true" />
                    {!isMobile && <span className="btn-text">Sign In</span>}
                  </Button>
                </Link>
              ) : (
                <Link to="/profile" className="auth-link">
                  <Button className='header-btn auth-btn' aria-label="Profile">
                    <FaRegUserCircle className="btn-icon" aria-hidden="true" />
                    {!isMobile && <span className="btn-text">Profile</span>}
                  </Button>
                </Link>
              )}

              {/* Cart Section */}
              <div className="cart-wrapper">
                <Link 
                  to="/cart" 
                  className={cartActive ? "cart_action cart-icon-animated" : "cart_action"}
                  onClick={handleCartClick}
                  aria-label="Shopping cart"
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M20.5001 5.99994H16.0001V4.99994C16.0001 2.79994 14.2101 0.999939 12.0001 0.999939C9.79014 0.999939 8.00014 2.79994 8.00014 4.99994V5.99994H3.50014C2.10014 5.99994 1.00014 7.09994 1.00014 8.49994V17.9999C1.00014 19.3999 2.10014 20.4999 3.50014 20.4999H20.5001C21.9001 20.4999 23.0001 19.3999 23.0001 17.9999V8.49994C23.0001 7.09994 21.9001 5.99994 20.5001 5.99994ZM10.0001 4.99994C10.0001 3.89994 10.9001 2.99994 12.0001 2.99994C13.1001 2.99994 14.0001 3.89994 14.0001 4.99994V5.99994H10.0001V4.99994ZM21.0001 17.9999C21.0001 18.2999 20.8001 18.4999 20.5001 18.4999H3.50014C3.20014 18.4999 3.00014 18.2999 3.00014 17.9999V8.49994C3.00014 8.19994 3.20014 7.99994 3.50014 7.99994H8.00014V9.99994C8.00014 10.5499 8.45014 10.9999 9.00014 10.9999C9.55014 10.9999 10.0001 10.5499 10.0001 9.99994V7.99994H14.0001V9.99994C14.0001 10.5499 14.4501 10.9999 15.0001 10.9999C15.5501 10.9999 16.0001 10.5499 16.0001 9.99994V7.99994H20.5001C20.8001 7.99994 21.0001 8.19994 21.0001 8.49994V17.9999Z" fill="black"/>
                  </svg>
                  <span className="cart_count" aria-label="10 items in cart">10</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile search bar */}
          {(isMobile && showSearch) && (
            <div className="row mt-2 mb-2 mobile-search-row">
              <div className="col-12">
                <div className="mobile-search-container">
                  <SearchBox />
                </div>
                <div className="mobile-location mt-2">
                  <div className="d-flex align-items-center">
                    <FaMapMarkerAlt className="location-icon" aria-hidden="true" />
                    <CityDropdown />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
      
      <Navigation />
    </div>
  );
}

export default Header;


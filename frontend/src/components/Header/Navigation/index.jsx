import { IoMdMenu } from "react-icons/io";
import { FaAngleDown, FaAngleRight, FaTimes } from "react-icons/fa";
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Container } from '../../../components/ui';
import PropTypes from 'prop-types';

const Navigation = ({ links = [] }) => {
  const [isopenSidebarVal, setisopenSidebarVal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth >= 992) {
        setMobileMenuOpen(false);
      }
    };

    // Close sidebar when clicking outside
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setisopenSidebarVal(false);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMenus = () => {
    setisopenSidebarVal(false);
    setMobileMenuOpen(false);
  };

  // Helper function to render the appropriate link with or without dropdown
  const renderNavLink = (link, index) => {
    // Check if this link should have a dropdown menu
    const hasDropdown = link.name === "Shop";

    return (
      <li key={index} className="relative group">
        {hasDropdown ? (
          <>
            <Link 
              to={link.path} 
              onClick={isMobile ? closeMenus : undefined} 
              className="flex items-center px-4 py-3 hover:text-yumrun-orange"
            >
              {link.name} <FaAngleDown className="ml-1 text-xs" />
            </Link>
            
            {link.name === "Shop" && (
              <div className="absolute left-0 z-30 hidden bg-white rounded-md shadow-md group-hover:block top-full min-w-48 lg:left-auto lg:right-0">
                <Link to="/cat/coffee-beans" onClick={closeMenus} className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-yumrun-orange">COFFEE BEANS</Link>
                <Link to="/cat/brewing-equipment" onClick={closeMenus} className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-yumrun-orange">BREWING EQUIPMENT</Link>
                <Link to="/cat/accessories" onClick={closeMenus} className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-yumrun-orange">ACCESSORIES</Link>
              </div>
            )}
          </>
        ) : (
          <Link 
            to={link.path} 
            onClick={closeMenus} 
            className="block px-4 py-3 hover:text-yumrun-orange"
          >
            {link.name}
          </Link>
        )}
      </li>
    );
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <Container>
        <div className="flex flex-col lg:flex-row">
          {/* Mobile Menu Button */}
          {isMobile && (
            <div className="py-3 border-b border-gray-200 lg:border-0">
              <button 
                onClick={toggleMobileMenu}
                className="flex items-center text-gray-700 hover:text-yumrun-orange"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? 
                  <FaTimes className="mr-2" /> : 
                  <IoMdMenu className="mr-2" />
                }
                <span className="font-medium">Menu</span>
              </button>
            </div>
          )}

          {/* Sidebar Navigation */}
          <div className={`w-full lg:w-1/4 ${isMobile && !mobileMenuOpen ? 'hidden' : 'block'}`} ref={navRef}>
            <div className="relative">
              <button 
                className="flex items-center justify-between w-full px-4 py-3 font-medium text-gray-800 transition-colors bg-gray-50 hover:bg-gray-100" 
                onClick={() => setisopenSidebarVal(prev => !prev)}
              >
                <span className="flex items-center">
                  <IoMdMenu className="mr-2" />
                  <span>ALL CATEGORIES</span>
                </span>
                <FaAngleDown className={`transform transition-transform ${isopenSidebarVal ? 'rotate-180' : ''}`} />
              </button>
              
              <div className={`absolute left-0 top-full w-full bg-white shadow-md rounded-b-md z-30 transition-all duration-200 ${isopenSidebarVal ? 'block' : 'hidden'}`}>
                <ul className="py-2">
                  <li className="relative group">
                    <Link 
                      to="/cat/special" 
                      onClick={closeMenus}
                      className="flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-gray-50 hover:text-yumrun-orange"
                    >
                      OUR SPECIAL
                      <FaAngleRight />
                    </Link>
                    <div className="absolute top-0 z-30 hidden w-48 bg-white rounded-md shadow-md group-hover:block left-full">
                      <Link to="/cat/espresso" onClick={closeMenus} className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-yumrun-orange">ESPRESSO</Link>
                      <Link to="/cat/latte" onClick={closeMenus} className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-yumrun-orange">LATTE</Link>
                      <Link to="/cat/cappuccino" onClick={closeMenus} className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-yumrun-orange">CAPPUCCINO</Link>
                      <Link to="/cat/tea" onClick={closeMenus} className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-yumrun-orange">TEA</Link>
                    </div>
                  </li>
                  <li className="relative group">
                    <Link 
                      to="/cat/appetizer" 
                      onClick={closeMenus}
                      className="flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-gray-50 hover:text-yumrun-orange"
                    >
                      APPETIZER
                      <FaAngleRight />
                    </Link>
                    <div className="absolute top-0 z-30 hidden w-48 bg-white rounded-md shadow-md group-hover:block left-full">
                      <Link to="/cat/finger-food" onClick={closeMenus} className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-yumrun-orange">FINGER FOOD</Link>
                      <Link to="/cat/salads" onClick={closeMenus} className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-yumrun-orange">SALADS</Link>
                      <Link to="/cat/soups" onClick={closeMenus} className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-yumrun-orange">SOUPS</Link>
                      <Link to="/cat/starters" onClick={closeMenus} className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-yumrun-orange">STARTERS</Link>
                    </div>
                  </li>
                  <li>
                    <Link to="/cat/breakfast" onClick={closeMenus} className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-yumrun-orange">BREAKFAST</Link>
                  </li>
                  <li>
                    <Link to="/cat/lunch" onClick={closeMenus} className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-yumrun-orange">LUNCH</Link>
                  </li>
                  <li>
                    <Link to="/cat/dinner" onClick={closeMenus} className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-yumrun-orange">DINNER</Link>
                  </li>
                  <li>
                    <Link to="/cat/drinks" onClick={closeMenus} className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-yumrun-orange">DRINKS</Link>
                  </li>
                  <li>
                    <Link to="/cat/dessert" onClick={closeMenus} className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-yumrun-orange">DESSERT</Link>
                  </li>
                  <li>
                    <Link to="/cat/bakery" onClick={closeMenus} className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-yumrun-orange">BAKERY</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Main Navigation */}
          <div className={`w-full lg:w-3/4 ${isMobile && !mobileMenuOpen ? 'hidden' : 'block'}`}>
            <ul className="flex flex-col lg:flex-row lg:justify-end lg:items-center">
              {links.map(renderNavLink)}
            </ul>
          </div>
        </div>
      </Container>
      
      {/* Overlay for mobile menu */}
      {(mobileMenuOpen || isopenSidebarVal) && isMobile && (
        <div 
          className="fixed inset-0 z-20 bg-black/30"
          onClick={closeMenus}
          aria-hidden="true"
        />
      )}
    </nav>
  );
};

Navigation.propTypes = {
  links: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired
    })
  )
};

export default Navigation;

import Button from '@mui/material/Button';
import { IoMdMenu } from "react-icons/io";
import { FaAngleDown, FaAngleRight, FaTimes } from "react-icons/fa";
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

const Navigation = () => {
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

  return (
    <nav>
      <div className='container'>
        <div className='row'>
          {/* Mobile Menu Button */}
          {isMobile && (
            <div className="mobile-menu-toggle">
              <Button 
                onClick={toggleMobileMenu}
                className="toggle-button"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <FaTimes /> : <IoMdMenu />}
                <span className="ml-2">Menu</span>
              </Button>
            </div>
          )}

          {/* Sidebar Navigation */}
          <div className={`col-lg-3 col-md-4 navPart1 ${isMobile && !mobileMenuOpen ? 'd-none' : ''}`} ref={navRef}>
            <div className='catWrapper'>
              <Button 
                className='allCatTab d-flex align-items-center' 
                onClick={() => setisopenSidebarVal(prev => !prev)}
              >
                <span className='icon1 mr-2'><IoMdMenu /></span>
                <span className="text">ALL CATEGORIES</span>
                <span className='icon2 ml-2'><FaAngleDown /></span>
              </Button>
              <div className={`sidebarNav ${isopenSidebarVal ? 'open' : ''}`}>
                <ul>
                  <li>
                    <Link to="/cat/special" onClick={closeMenus}>
                      <Button>
                        OUR SPECIAL
                        <FaAngleRight className='ml-auto'/>
                      </Button>
                    </Link>
                    <div className="submenu">
                      <Link to="/cat/espresso" onClick={closeMenus}><Button>ESPRESSO</Button></Link>
                      <Link to="/cat/latte" onClick={closeMenus}><Button>LATTE</Button></Link>
                      <Link to="/cat/cappuccino" onClick={closeMenus}><Button>CAPPUCCINO</Button></Link>
                      <Link to="/cat/tea" onClick={closeMenus}><Button>TEA</Button></Link>
                    </div>
                  </li>
                  <li>
                    <Link to="/cat/appetizer" onClick={closeMenus}>
                      <Button>
                        APPETIZER
                        <FaAngleRight className='ml-auto'/>
                      </Button>
                    </Link>
                    <div className="submenu">
                      <Link to="/cat/finger-food" onClick={closeMenus}><Button>FINGER FOOD</Button></Link>
                      <Link to="/cat/salads" onClick={closeMenus}><Button>SALADS</Button></Link>
                      <Link to="/cat/soups" onClick={closeMenus}><Button>SOUPS</Button></Link>
                      <Link to="/cat/starters" onClick={closeMenus}><Button>STARTERS</Button></Link>
                    </div>
                  </li>
                  <li><Link to="/cat/breakfast" onClick={closeMenus}><Button>BREAKFAST</Button></Link></li>
                  <li><Link to="/cat/lunch" onClick={closeMenus}><Button>LUNCH</Button></Link></li>
                  <li><Link to="/cat/dinner" onClick={closeMenus}><Button>DINNER</Button></Link></li>
                  <li><Link to="/cat/drinks" onClick={closeMenus}><Button>DRINKS</Button></Link></li>
                  <li><Link to="/cat/dessert" onClick={closeMenus}><Button>DESSERT</Button></Link></li>
                  <li><Link to="/cat/bakery" onClick={closeMenus}><Button>BAKERY</Button></Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Main Navigation */}
          <div className={`col-lg-9 col-md-8 navPart2 ${isMobile && !mobileMenuOpen ? 'd-none' : ''}`}>
            <ul className='main-menu list list-inline ml-auto'>
              <li className='list-inline-item'>
                <Link to="/" onClick={closeMenus}><Button>HOME</Button></Link>
              </li>
              <li className='list-inline-item'>
                <Link to="/cat/shop" onClick={isMobile ? closeMenus : undefined}>
                  <Button>SHOP <FaAngleDown className="ml-1"/></Button>
                </Link>
                <div className='menu shadow'>
                  <Link to="/cat/coffee-beans" onClick={closeMenus}><Button>COFFEE BEANS</Button></Link>
                  <Link to="/cat/brewing-equipment" onClick={closeMenus}><Button>BREWING EQUIPMENT</Button></Link>
                  <Link to="/cat/accessories" onClick={closeMenus}><Button>ACCESSORIES</Button></Link>
                </div>
              </li>
              
              <li className='list-inline-item'>
                <Link to="/cat/favourites" onClick={isMobile ? closeMenus : undefined}>
                  <Button>FAVOURITES <FaAngleDown className="ml-1"/></Button>
                </Link>
                <div className='menu shadow'>
                  <Link to="/cat/espresso" onClick={closeMenus}><Button>ESPRESSO</Button></Link>
                  <Link to="/cat/latte" onClick={closeMenus}><Button>LATTE</Button></Link>
                  <Link to="/cat/cappuccino" onClick={closeMenus}><Button>CAPPUCCINO</Button></Link>
                  <Link to="/cat/tea" onClick={closeMenus}><Button>TEA</Button></Link>
                </div>
              </li>
              <li className='list-inline-item'>
                <Link to="/cat/offers" onClick={isMobile ? closeMenus : undefined}>
                  <Button>OUR OFFERS <FaAngleDown className="ml-1"/></Button>
                </Link>
                <div className='menu shadow'>
                  <Link to="/cat/daily-deals" onClick={closeMenus}><Button>DAILY DEALS</Button></Link>
                  <Link to="/cat/weekly-specials" onClick={closeMenus}><Button>WEEKLY SPECIALS</Button></Link>
                  <Link to="/cat/seasonal" onClick={closeMenus}><Button>SEASONAL</Button></Link>
                </div>
              </li>
              <li className='list-inline-item'>
                <Link to="/about" onClick={closeMenus}><Button>ABOUT US</Button></Link>
              </li>
              <li className='list-inline-item'>
                <Link to="/contact" onClick={closeMenus}><Button>CONTACT</Button></Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile menu */}
      {(mobileMenuOpen || isopenSidebarVal) && isMobile && (
        <div 
          className="mobile-menu-overlay"
          onClick={closeMenus}
          aria-hidden="true"
        />
      )}
    </nav>
  );
};

export default Navigation;

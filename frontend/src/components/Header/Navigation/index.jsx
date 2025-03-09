import Button from '@mui/material/Button';
import { IoMdMenu } from "react-icons/io";
import { FaAngleDown } from "react-icons/fa6";
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { FaAngleRight } from "react-icons/fa6";

const Navigation = () => {
  const [isopenSidebarVal, setisopenSidebarVal] = useState(false); // Sidebar hidden by default

  return (
    <nav>
      <div className='container'>
        <div className='row'>
          {/* Sidebar Navigation */}
          <div className='col-sm-2 navPart1'>
            <div className='catWrapper'>
              <Button className='allCatTab align-items-center' 
                onClick={() => setisopenSidebarVal(prev => !prev)}>
                <span className='icon1 mr-2'><IoMdMenu /> </span>
                <span className="text"> ALL CATEGORIES </span>
                <span className='icon2 ml-2'><FaAngleDown /></span>
              </Button>
              <div className={`sidebarNav ${isopenSidebarVal ? 'open' : ''}`}>
                <ul>
                  <li><Link to="/"><Button> OUR SPECIAL <FaAngleRight className='ml-2'/>
                  </Button></Link>
                  <div className="submenu">
                  <Link to="/"><Button> ESPRESSO </Button></Link>
                  <Link to="/"><Button> LATTE </Button></Link>
                  <Link to="/"><Button> CAPPUCCINO </Button></Link>
                  <Link to="/"><Button> TEA </Button></Link>

                  </div>
                  
                  </li>
                  <li><Link to="/"><Button> APPETIZER <FaAngleRight className='ml-auto'/> </Button></Link>
                  <div className="submenu">
                  <Link to="/"><Button> ESPRESSO </Button></Link>
                  <Link to="/"><Button> LATTE </Button></Link>
                  <Link to="/"><Button> CAPPUCCINO </Button></Link>
                  <Link to="/"><Button> TEA </Button></Link>

                  </div>
                  </li>
                  <li><Link to="/"><Button> BREAKFAST </Button></Link></li>
                  <li><Link to="/"><Button> LUNCH </Button></Link></li>
                  <li><Link to="/"><Button> DINNER </Button></Link></li>
                  <li><Link to="/"><Button> DRINKS </Button></Link></li>
                  <li><Link to="/"><Button> DESSERT </Button></Link></li>
                  <li><Link to="/"><Button> BAKERY </Button></Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Main Navigation */}
          <div className='col-sm-10 navPart2 d-flex align-items-center'>
            <ul className='list list-inline ml-auto'>
              <li className='list-inline-item'><Link to="/"><Button> HOME </Button></Link></li>
              <li className='list-inline-item'>
                <Link to="/"><Button> SHOP <FaAngleDown /></Button></Link>
                <div className='menu shadow'>
                  <Link to="/"><Button> COFFEE BEANS </Button></Link>
                  <Link to="/"><Button> BREWING EQUIPMENT </Button></Link>
                  <Link to="/"><Button> ACCESSORIES </Button></Link>
                </div>
              </li>
              
              <li className='list-inline-item'>
                <Link to="/"><Button> FAVOURITES <FaAngleDown /></Button></Link>
                <div className='menu shadow'>
                  <Link to="/"><Button> ESPRESSO </Button></Link>
                  <Link to="/"><Button> LATTE </Button></Link>
                  <Link to="/"><Button> CAPPUCCINO </Button></Link>
                  <Link to="/"><Button> TEA </Button></Link>
                </div>
              </li>
              <li className='list-inline-item'>
                <Link to="/"><Button> OUR OFFERS <FaAngleDown /></Button></Link>
                <div className='menu shadow'>
                  <Link to="/"><Button> ESPRESSO </Button></Link>
                  <Link to="/"><Button> LATTE </Button></Link>
                  <Link to="/"><Button> CAPPUCCINO </Button></Link>
                  <Link to="/"><Button> TEA </Button></Link>
                </div>
              </li>
              <li className='list-inline-item'><Link to="/"><Button> ABOUT US </Button></Link></li>
              <li className='list-inline-item'><Link to="/"><Button> CONTACT </Button></Link></li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

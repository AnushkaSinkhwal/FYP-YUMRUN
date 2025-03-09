import { Link } from 'react-router-dom'; // Importing Link for routing
import Logo from '../../images/logo.jpg'; // Importing the logo image
import CityDropdown from "../CityDropdown";  // Correct relative import
import Button from '@mui/material/Button';
import { FaRegUserCircle } from "react-icons/fa";
import { BsCart3 } from "react-icons/bs";
import SearchBox from './SearchBox';
import Navigation from "./Navigation";
import {useContext} from 'react';
import { MyContext } from '../../App';



const Header = () => {
  const context=useContext(MyContext);
  return (
    <>
      <div className="headerWrapper">
        {/* Top Strip */}
        <div className="top-strip bg-blue">
          <div className="container">
            <p className="mb-0 mt-0 text-center">A Smart Way of Living.</p>
          </div>
        </div>

        {/* Header Section */}
        <header className="header">
          <div className="container">
            <div className="row align-items-center justify-content-between">
              {/* Logo Wrapper */}
              <div className="logoWrapper d-flex align-items-center col-sm-2">
                <Link to="/">
                  <img src={Logo} alt="Logo" />
                </Link>
              </div>

              {/* Navigation & Controls */}
              <div className="col-sm-10 d-flex align-items-center part2 justify-content-between">
                <CityDropdown /> {/* Ensure CityDropdown is working */}
                
                <SearchBox/>

                {/* User & Cart Section */}
                <div className="part3 d-flex align-items-center ml-auto">
                 {
                  context.isLogin!==true?<Link to="/signIn"> <Button className='btn-blue btn-round mr-3'>SignIn</Button> </Link> 
                  :  <Button className="circle mr-3"><FaRegUserCircle /></Button>}


                  {/* Cart Section */}
                  <div className="cartTab d-flex align-items-center ml-3 ">
                    <span className="price">Rs.50</span>

                    {/* Cart Icon with Notification Badge */}
                    <div className="position-relative ml-2">
                      <Button className="circle">
                        <BsCart3 />
                      </Button>
                      <span className="count d-flex align-items-center justify-content-center">1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <Navigation/>
        </div>

      
    </>
  )
}

export default Header;

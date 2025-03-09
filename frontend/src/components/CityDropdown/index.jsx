import * as React from 'react';
import { useState, useEffect } from 'react';
import { FaAngleDown } from 'react-icons/fa'; 
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { IoSearchSharp } from "react-icons/io5";
import { MdClose } from "react-icons/md";
import Slide from '@mui/material/Slide';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CityDropdown = () => {
  const [isOpenModel, setisOpenModel] = useState(false);
  const [cities, setCities] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("Select Location"); // Updated default city
  const [activeCity, setActiveCity] = useState(""); // Store active city

  // Fetch cities from JSON
  useEffect(() => {
    fetch("/np.json")
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched data:", data);  // Check the data structure
        setCities(data);  // Assuming np.json directly contains the array of cities
      })
      .catch((error) => console.error("Error fetching JSON:", error));
  }, []);

  // Filter cities based on search input
  const filteredCities = cities.filter((cityObj) =>
    cityObj.city.toLowerCase().includes(search.toLowerCase())
  );

  // Handle city selection
  const handleCitySelect = (city) => {
    setSelectedCity(city);  // Update the selected city
    setActiveCity(city);    // Set the active city
    setisOpenModel(false);   // Close the dialog when a city is selected
  };

  return (
    <>
      <Button className="cityDrop" onClick={() => setisOpenModel(true)}>
        <div className="info d-flex flex-column">
          <span className="label">Your Location</span>
          <span className="name">{selectedCity}</span> {/* Display selected city */} 
        </div>
        <span className="ml-auto">
          <FaAngleDown />
        </span>
      </Button>

      {/* Conditional rendering of the dialog */}
      <Dialog open={isOpenModel} onClose={() => setisOpenModel(false)} className='locationModel' TransitionComponent={Transition}>
        <h4 className='mb-0'>Choose your Delivery Location</h4>
        <p>Enter your address and we will specify the offer for your area.</p>
        <Button className='close_' onClick={() => setisOpenModel(false)}><MdClose /></Button>

        <div className="locationSearch w-100">
          <input 
            type="text" 
            placeholder="Search your area..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          <Button><IoSearchSharp /></Button>
        </div>

        {/* Render the filtered cities */}
        <ul className='cityList mt-3'>
          {filteredCities.length > 0 ? (
            filteredCities.map((cityObj, index) => (
              <li key={index}>
                <Button
                  onClick={() => handleCitySelect(cityObj.city)}
                  className={cityObj.city === activeCity ? 'active' : ''} // Add active class if selected
                >
                  {cityObj.city}
                </Button>
              </li>
            ))
          ) : (
            <li>No cities found</li>
          )}
        </ul>
      </Dialog>
    </>
  );
};

export default CityDropdown;

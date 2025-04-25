import { useState } from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import RangeSlider from 'react-range-slider-input';
import 'react-range-slider-input/dist/style.css';
import { Link } from 'react-router-dom';

const Sidebar = () => {
    const [value, setValue] = useState([100, 1000]); // Fixed range values

    return (
        <div className="sidebar">
            
            {/* Food Categories */}
            <div className="filterBox">
                <h6>FOOD CATEGORIES</h6>
                <div className="scroll">
                    <ul>
                        {["Breakfast", "Lunch", "Dinner", "Snacks", "Desserts", "Beverages", "Vegan", "Organic"].map((category, index) => (
                            <li key={index}>
                                <FormControlLabel className="w-100" control={<Checkbox />} label={category} />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Filter by Price */}
            <div className="filterBox">
                <h6>FILTER BY PRICE</h6>
                <RangeSlider value={value} onInput={setValue} min={100} max={7000} step={5} />
                <div className="d-flex pt-2 pb-2 priceRange">
                    <span>From: <strong className="text-dark">Rs. {value[0]}</strong></span>
                    <span className="ml-auto">To: <strong className="text-dark">Rs. {value[1]}</strong></span>
                </div>
            </div>

            <div className="filterBox">
                <h6>FOOD STATUS</h6>
                <div className="scroll">
                    <ul>
                        {["Available Today.", "We are sorry."].map((category, index) => (
                            <li key={index}>
                                <FormControlLabel className="w-100" control={<Checkbox />} label={category} />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>


            <div className="filterBox">
                <h6>TOP RATED RESTAURANT</h6>
                <div className="scroll">
                    <ul>
                        {["NAMASTE", "PHO-99","ROADHOUSE","HANKOOK SARANG","ALPHABET PIZZERIA"].map((category, index) => (
                            <li key={index}>
                                <FormControlLabel className="w-100" control={<Checkbox />} label={category} />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <Link to="#"><img src= 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDv86A-NRxOCDFs_hxbV8AiRXH3Ufb_fRVXA&s' className='w-100'/></Link>
        </div>
        
    );
};

export default Sidebar;

import { FaMinusCircle } from "react-icons/fa";
import { FaCirclePlus } from "react-icons/fa6";
import Button from '@mui/material/Button';
import { useState } from "react";

const QuantityBox = () => {
    const [inputVal, setInputVal] = useState(1);

    const minus = () => {
        if (inputVal > 1) {
            setInputVal(inputVal - 1);
        }
    };

    const plus = () => {
        setInputVal(inputVal + 1);
    };

    const handleChange = (event) => {
        const value = event.target.value;
        // Check if the input is a valid positive number
        if (value === '' || !isNaN(value) && value > 0) {
            setInputVal(value);
        }
    };

    return (
        <div className='quantityDrop d-flex align-items-center'>
            <Button onClick={minus}><FaMinusCircle /></Button>
            <input 
                type="text" 
                value={inputVal}
                onChange={handleChange}  // Correctly set the onChange handler
            />
            <Button onClick={plus}><FaCirclePlus /></Button>
        </div>
    );
};

export default QuantityBox;

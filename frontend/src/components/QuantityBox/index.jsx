import { FaMinusCircle } from "react-icons/fa";
import { FaCirclePlus } from "react-icons/fa6";
import Button from '@mui/material/Button';
import { useState, useEffect } from "react";

const QuantityBox = ({ initialValue = 1, onChange }) => {
    const [inputVal, setInputVal] = useState(initialValue);

    // Update local state when initialValue prop changes
    useEffect(() => {
        setInputVal(initialValue);
    }, [initialValue]);

    const minus = () => {
        if (inputVal > 1) {
            const newValue = inputVal - 1;
            setInputVal(newValue);
            if (onChange) onChange(newValue);
        }
    };

    const plus = () => {
        const newValue = inputVal + 1;
        setInputVal(newValue);
        if (onChange) onChange(newValue);
    };

    const handleChange = (event) => {
        const value = parseInt(event.target.value, 10);
        // Check if the input is a valid positive number
        if (!isNaN(value) && value > 0) {
            setInputVal(value);
            if (onChange) onChange(value);
        } else if (event.target.value === '') {
            setInputVal('');
        }
    };

    const handleBlur = () => {
        // If empty or invalid on blur, reset to 1
        if (inputVal === '' || inputVal < 1) {
            setInputVal(1);
            if (onChange) onChange(1);
        }
    };

    return (
        <div className='quantityDrop d-flex align-items-center'>
            <Button onClick={minus}><FaMinusCircle /></Button>
            <input 
                type="text" 
                value={inputVal}
                onChange={handleChange}
                onBlur={handleBlur}
            />
            <Button onClick={plus}><FaCirclePlus /></Button>
        </div>
    );
};

export default QuantityBox;

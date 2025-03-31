import { useState } from 'react';
import PropTypes from 'prop-types';

export const Switch = ({ checked: controlledChecked, onChange, disabled = false, label, className = '' }) => {
  const [internalChecked, setInternalChecked] = useState(false);
  
  // Use controlled or uncontrolled checked state
  const isChecked = controlledChecked !== undefined ? controlledChecked : internalChecked;
  
  const handleChange = () => {
    if (disabled) return;
    
    if (controlledChecked === undefined) {
      setInternalChecked(!internalChecked);
    }
    
    if (onChange) {
      onChange(!isChecked);
    }
  };
  
  return (
    <label className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
        />
        <div
          className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out ${
            isChecked ? 'bg-yumrun-primary' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        />
        <div
          className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ease-in-out ${
            isChecked ? 'transform translate-x-6' : 'transform translate-x-0'
          }`}
        />
      </div>
      {label && (
        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
          {label}
        </span>
      )}
    </label>
  );
};

Switch.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  className: PropTypes.string,
}; 
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

export const Select = ({ 
  label, 
  name, 
  value, 
  onChange, 
  options: optionsProp = [], 
  children, 
  error, 
  className = '', 
  placeholder = 'Select an option',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  // derive options from children <option> elements if no options prop
  const childOptions = React.Children.toArray(children)
    .filter(child => React.isValidElement(child) && child.type === 'option')
    .map(child => ({ value: child.props.value, label: child.props.children }));
  const finalOptions = optionsProp.length > 0 ? optionsProp : childOptions;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={selectRef}>
      {label && (
        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div
        className={`
          relative w-full px-3 py-2 border rounded-md shadow-sm cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-yumrun-primary focus:border-yumrun-primary
          dark:bg-gray-800 dark:border-gray-700 dark:text-white
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span className="block truncate">
            {value ? finalOptions.find(opt => opt.value === value)?.label : placeholder}
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <ul className="py-1 overflow-auto max-h-60">
            {finalOptions.map((option) => (
              <li
                key={option.value}
                className={`
                  px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700
                  ${value === option.value ? 'bg-gray-100 dark:bg-gray-700' : ''}
                `}
                onClick={() => {
                  // emit synthetic event for compatibility
                  const syntheticEvent = { target: { name, value: option.value } };
                  onChange(syntheticEvent);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

Select.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
  })),
  children: PropTypes.node,
  error: PropTypes.string,
  className: PropTypes.string,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
};

export const SelectTrigger = ({ children, className = '' }) => (
  <div className={`relative ${className}`}>
    {children}
  </div>
);

export const SelectValue = ({ placeholder = 'Select an option' }) => (
  <span className="block truncate">{placeholder}</span>
);

export const SelectContent = ({ children, className = '' }) => (
  <div className={`absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg ${className}`}>
    {children}
  </div>
);

export const SelectItem = ({ value, children, onClick, className = '' }) => (
  <div
    className={`
      px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700
      ${className}
    `}
    onClick={() => onClick(value)}
  >
    {children}
  </div>
);

SelectTrigger.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

SelectValue.propTypes = {
  placeholder: PropTypes.string,
};

SelectContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

SelectItem.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
}; 
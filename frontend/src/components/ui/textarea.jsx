import PropTypes from 'prop-types';

export const Textarea = ({ 
  label, 
  error, 
  className = '', 
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-yumrun-primary focus:border-yumrun-primary
          dark:bg-gray-800 dark:border-gray-700 dark:text-white
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

Textarea.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string,
}; 
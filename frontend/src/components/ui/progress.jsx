import PropTypes from 'prop-types';

export const Progress = ({ 
  value = 0, 
  max = 100, 
  className = '', 
  showValue = true,
  variant = 'default' // default, success, warning, error
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-yumrun-primary';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between mb-1">
        <div className="w-full h-2 overflow-hidden bg-gray-200 rounded-full dark:bg-gray-700">
          <div
            className={`h-full ${getVariantClasses()} transition-all duration-300 ease-in-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showValue && (
          <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    </div>
  );
};

Progress.propTypes = {
  value: PropTypes.number,
  max: PropTypes.number,
  className: PropTypes.string,
  showValue: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'success', 'warning', 'error']),
}; 
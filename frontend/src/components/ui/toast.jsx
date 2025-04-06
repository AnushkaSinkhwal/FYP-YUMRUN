import React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import PropTypes from 'prop-types';
import { 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaInfoCircle, 
  FaExclamationTriangle,
  FaTimes 
} from 'react-icons/fa';

const Toast = ({ 
  message, 
  type = 'success', 
  duration = 3000, 
  position = 'top-right', 
  onClose 
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300); // Wait for exit animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="h-5 w-5" />;
      case 'error':
        return <FaExclamationCircle className="h-5 w-5" />;
      case 'warning':
        return <FaExclamationTriangle className="h-5 w-5" />;
      case 'info':
      default:
        return <FaInfoCircle className="h-5 w-5" />;
    }
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  const typeClasses = {
    success: 'bg-green-50 text-green-800 border-green-500',
    error: 'bg-red-50 text-red-800 border-red-500',
    warning: 'bg-amber-50 text-amber-800 border-amber-500',
    info: 'bg-blue-50 text-blue-800 border-blue-500',
  };

  const iconClasses = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
  };

  return createPortal(
    <div 
      className={cn(
        "fixed z-50 flex transition-all duration-300",
        positionClasses[position] || positionClasses['top-right'],
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[-20px]'
      )}
    >
      <div 
        className={cn(
          "flex items-center rounded-md shadow-md py-3 px-4 border-l-4 min-w-80 max-w-96",
          typeClasses[type] || typeClasses.info
        )}
      >
        <div className={cn("mr-3", iconClasses[type] || iconClasses.info)}>
          {getIcon()}
        </div>
        <div className="flex-1 mr-2">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose?.(), 300);
          }}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <FaTimes className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  duration: PropTypes.number,
  position: PropTypes.oneOf([
    'top-right', 
    'top-left', 
    'bottom-right', 
    'bottom-left',
    'top-center',
    'bottom-center'
  ]),
  onClose: PropTypes.func
};

// Toast container component to manage multiple toasts
const ToastContainer = ({ toasts, removeToast }) => {
  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast 
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            position={toast.position}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>,
    document.body
  );
};

ToastContainer.propTypes = {
  toasts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      type: PropTypes.string,
      duration: PropTypes.number,
      position: PropTypes.string
    })
  ).isRequired,
  removeToast: PropTypes.func.isRequired
};

export { Toast, ToastContainer }; 
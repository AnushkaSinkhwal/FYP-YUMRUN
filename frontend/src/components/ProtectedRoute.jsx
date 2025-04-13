import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';
import { Spinner } from '../components/ui';

// Component to protect routes that require authentication
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();
  
  // If still loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // If no user is logged in, redirect to login
  if (!currentUser) {
    console.log('ProtectedRoute: No user logged in, redirecting to signin');
    // Use unified login path for all user types
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }
  
  // Determine the user's role with more comprehensive checks
  let userRole = 'customer'; // default
  
  if (currentUser.role) {
    // If role is explicitly set, use it
    userRole = currentUser.role;
  } else if (currentUser.isAdmin) {
    userRole = 'admin';
  } else if (currentUser.isRestaurantOwner || (currentUser.restaurantDetails && Object.keys(currentUser.restaurantDetails).length > 0)) {
    userRole = 'restaurant';
  } else if (currentUser.isDeliveryRider || currentUser.isDeliveryStaff) {
    userRole = 'delivery_rider';
  }
  
  console.log('ProtectedRoute - Current user role:', userRole);
  console.log('ProtectedRoute - Allowed roles:', allowedRoles);
  console.log('ProtectedRoute - Current path:', location.pathname);
  
  // If roles are specified, check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    console.log('ProtectedRoute: User does not have required role, redirecting');
    console.log('User role:', userRole, 'Allowed roles:', allowedRoles);
    
    // Redirect to appropriate dashboard based on user role
    switch (userRole) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'restaurant':
        return <Navigate to="/restaurant/dashboard" replace />;
      case 'delivery_rider':
        return <Navigate to="/delivery/dashboard" replace />;
      case 'customer':
        return <Navigate to="/user/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }
  
  console.log('ProtectedRoute: Access granted to', location.pathname);
  // If all checks pass, render the protected content
  return children;
};

// PropTypes validation
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.oneOf(['admin', 'restaurant', 'delivery_rider', 'customer']))
};

ProtectedRoute.defaultProps = {
  allowedRoles: []
};

export default ProtectedRoute; 
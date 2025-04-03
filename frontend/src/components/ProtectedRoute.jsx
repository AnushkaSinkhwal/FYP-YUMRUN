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
  
  // Determine the user's role from either role property or legacy isRole properties
  const userRole = currentUser.role || 
    (currentUser.isAdmin ? 'admin' : 
     currentUser.isRestaurantOwner ? 'restaurant' : 
     currentUser.isDeliveryRider ? 'deliveryRider' : 'customer');
  
  console.log('ProtectedRoute - Current user role:', userRole);
  console.log('ProtectedRoute - Allowed roles:', allowedRoles);
  console.log('ProtectedRoute - Current path:', location.pathname);
  
  // If roles are specified, check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    console.log('ProtectedRoute: User does not have required role, redirecting');
    // Redirect to appropriate dashboard based on user role
    switch (userRole) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'restaurant':
      case 'restaurantOwner':
        return <Navigate to="/restaurant/dashboard" replace />;
      case 'deliveryRider':
        return <Navigate to="/delivery/dashboard" replace />;
      case 'customer':
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
  allowedRoles: PropTypes.arrayOf(PropTypes.oneOf(['admin', 'restaurantOwner', 'deliveryRider', 'customer']))
};

ProtectedRoute.defaultProps = {
  allowedRoles: []
};

export default ProtectedRoute; 
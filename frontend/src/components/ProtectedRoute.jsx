import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';
import { Spinner } from '../components/ui';

// Component to protect routes that require authentication
const ProtectedRoute = ({ children, requireAdmin = false, requireRestaurantOwner = false, requireDeliveryStaff = false }) => {
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
    // Use unified login path for all user types
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }
  
  // Check specific role requirements
  if (requireAdmin && !currentUser.isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  if (requireRestaurantOwner && !currentUser.isRestaurantOwner) {
    return <Navigate to="/" replace />;
  }
  
  if (requireDeliveryStaff && !currentUser.isDeliveryStaff) {
    return <Navigate to="/" replace />;
  }
  
  // If all checks pass, render the protected content
  return children;
};

// PropTypes validation
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requireAdmin: PropTypes.bool,
  requireRestaurantOwner: PropTypes.bool,
  requireDeliveryStaff: PropTypes.bool
};

export default ProtectedRoute; 
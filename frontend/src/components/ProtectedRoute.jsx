import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';

// Component to protect routes that require authentication
const ProtectedRoute = ({ children, requireAdmin = false, requireRestaurantOwner = false, requireDeliveryStaff = false }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();
  
  // If still loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  // If no user is logged in, redirect to login
  if (!currentUser) {
    // Determine redirect based on the route
    const redirectTo = location.pathname.startsWith('/admin')
      ? '/admin/login'
      : '/signin';
      
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
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
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Component to protect routes that require authentication
const ProtectedRoute = ({ children, requireAdmin = false, requireRestaurantOwner = false, requireDeliveryStaff = false }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();
  
  console.log("ProtectedRoute - auth state:", { 
    currentUser, 
    isLoading, 
    requireAdmin, 
    path: location.pathname 
  });
  
  // If still loading, show a loading indicator
  if (isLoading) {
    console.log("Auth is still loading...");
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
    console.log("No user is logged in. Redirecting to login...");
    // Determine redirect based on the route
    const redirectTo = location.pathname.startsWith('/admin')
      ? '/admin/login'
      : '/signin';
      
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  
  // Check specific role requirements
  if (requireAdmin && !currentUser.isAdmin) {
    console.log("Admin access required but current user is not admin.");
    return <Navigate to="/" replace />;
  }
  
  if (requireRestaurantOwner && !currentUser.isRestaurantOwner) {
    console.log("Restaurant owner access required but current user is not a restaurant owner.");
    return <Navigate to="/" replace />;
  }
  
  if (requireDeliveryStaff && !currentUser.isDeliveryStaff) {
    console.log("Delivery staff access required but current user is not delivery staff.");
    return <Navigate to="/" replace />;
  }
  
  // If all checks pass, render the protected content
  console.log("Auth checks passed. Rendering protected content.");
  return children;
};

export default ProtectedRoute; 
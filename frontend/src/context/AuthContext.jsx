import { createContext, useContext, useState, useEffect } from 'react';
import api, { authAPI } from '../utils/api';
import PropTypes from 'prop-types';

// Create the auth context
export const AuthContext = createContext();

// Helper function to normalize user data to ensure role property
const normalizeUserData = (userData) => {
  if (!userData) return null;
  
  // If role is already defined, use it
  if (userData.role) {
    // Convert 'restaurant' to 'restaurant' for consistency
    if (userData.role === 'restaurant') {
      return { ...userData, role: 'restaurant' };
    }
    return userData;
  }
  
  // Otherwise, determine role from legacy isRole properties
  let role = 'customer'; // default role
  
  if (userData.isAdmin) {
    role = 'admin';
  } else if (userData.isRestaurantOwner) {
    role = 'restaurant';
  } else if (userData.isDeliveryStaff || userData.isDeliveryRider) {
    role = 'deliveryRider';
  }
  
  // Return a new object with the role property added
  return { ...userData, role };
};

// Helper function to get dashboard path based on user role
const getDashboardPath = (role) => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'restaurant':
    case 'restaurant':
      return '/restaurant/dashboard';
    case 'deliveryRider':
      return '/delivery/dashboard';
    case 'customer':
    default:
      return '/';
  }
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check for stored auth token and user data on initial load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        // Set default header for Axios instance
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        const parsedUserData = JSON.parse(userData);
        setCurrentUser(normalizeUserData(parsedUserData));
      } catch (error) {
        console.error('Error processing stored auth data:', error);
        // Clear storage and Axios header on error
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        delete api.defaults.headers.common['Authorization'];
      }
    }
    
    setIsLoading(false);
  }, []);
  
  // Unified login for all user types
  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);
    // Clear previous auth header before attempting login
    delete api.defaults.headers.common['Authorization'];
    
    try {
      const response = await authAPI.login(credentials);
      
      // Check if response is from the error handler or actual API
      if (response.success === false) {
        setError(response.error || 'Login failed');
        setIsLoading(false);
        return response;
      }
      
      // This is a successful API response
      if (response.data && response.data.success) {
        const { token, user, dashboardPath } = response.data;
        const normalizedUser = normalizeUserData(user);
        
        // Save to localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(normalizedUser));
        
        // Set default header for subsequent requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Update state
        setCurrentUser(normalizedUser);
        setIsLoading(false);
        
        return { 
          success: true, 
          user: normalizedUser,
          dashboardPath: dashboardPath || getDashboardPath(normalizedUser.role)
        };
      } else {
        const errorMessage = response.data?.message || 'Login failed: Invalid response format';
        setError(errorMessage);
        setIsLoading(false);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };
  
  // Register new user
  const register = async (userData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.register(userData);
      
      // Check if the response indicates an error
      if (!response.data.success) {
        setError(response.data.error?.message || 'Registration failed');
        setIsLoading(false);
        return { success: false, error: response.data.error?.message || 'Registration failed' };
      }
      
      // Successful registration, data should be in response.data.data
      if (response.data.success && response.data.data) {
        const { user /*, token */ } = response.data.data; // Assuming data is nested under 'data'
        
        // Normalize user data to ensure role property
        const normalizedUser = normalizeUserData(user);
        
        // Not auto-logging in after registration
        
        setIsLoading(false);
        
        return { 
          success: true, 
          user: normalizedUser,
          // We don't necessarily need dashboard path here if not auto-logging in
          // dashboardPath: getDashboardPath(normalizedUser.role)
        };
      } else {
        // Handle unexpected success response format
        const errMsg = response.data.error?.message || 'Registration failed: Unexpected response format';
        setError(errMsg);
        setIsLoading(false);
        return { success: false, error: errMsg };
      }
    } catch (error) {
      console.error('Registration error:', error);
      // Extract specific error message from backend response if available
      const backendErrorMessage = error.response?.data?.message;
      const errorMessage = backendErrorMessage || 'Registration failed. Please try again.';
      
      setError(errorMessage);
      setIsLoading(false);
      // Return the specific error message
      return { success: false, error: errorMessage };
    }
  };
  
  // Update user profile
  const updateProfile = async (profileData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.updateProfile(profileData);
      
      // Check for nested data structure
      const responseData = response.data.data || response.data;
      
      if (responseData.success) {
        const { user } = responseData;
        const normalizedUser = normalizeUserData(user);
        
        // Update stored user data
        localStorage.setItem('userData', JSON.stringify(normalizedUser));
        
        // Update state
        setCurrentUser(normalizedUser);
        setIsLoading(false);
        
        return { success: true, user: normalizedUser };
      } else {
        const errMsg = responseData.error?.message || 'Profile update failed';
        setError(errMsg);
        setIsLoading(false);
        return { success: false, error: errMsg };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Profile update failed. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };
  
  // Logout user
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    // Remove default header from Axios instance
    delete api.defaults.headers.common['Authorization'];
    setCurrentUser(null);
  };
  
  // Role check helpers
  const isCustomer = () => currentUser?.role === 'customer' || 
    (!currentUser?.role && !currentUser?.isAdmin && !currentUser?.isRestaurantOwner && !currentUser?.isDeliveryRider);
    
  const isRestaurantOwner = () => currentUser?.role === 'restaurant' || 
    currentUser?.isRestaurantOwner === true || currentUser?.role === 'restaurant'; // Added 'restaurant'
    
  const isDeliveryRider = () => currentUser?.role === 'deliveryRider' || 
    currentUser?.isDeliveryRider === true || 
    currentUser?.isDeliveryStaff === true;
    
  const isAdmin = () => currentUser?.role === 'admin' || 
    currentUser?.isAdmin === true;
  
  // Context value
  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    isCustomer,
    isAdmin,
    isRestaurantOwner,
    isDeliveryRider
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// PropTypes validation
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
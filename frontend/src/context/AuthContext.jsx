import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import PropTypes from 'prop-types';

// Create the auth context
export const AuthContext = createContext();

// Helper function to get dashboard path based on user role
const getDashboardPath = (role) => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'restaurantOwner':
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
  
  // Check for stored auth token and user data
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    }
    
    setIsLoading(false);
  }, []);
  
  // Unified login for all user types
  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.login(credentials);
      
      // Check if response is from the error handler or actual API
      if (response.success === false) {
        // This is already an error response from our error handler
        setError(response.error || 'Login failed');
        setIsLoading(false);
        return response;
      }
      
      // This is a successful API response
      if (response.data && response.data.success) {
        const { token, user } = response.data;
        
        // Save to localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        
        // Update state
        setCurrentUser(user);
        setIsLoading(false);
        
        return { 
          success: true, 
          user,
          dashboardPath: getDashboardPath(user.role)
        };
      } else {
        // Unexpected response format
        const errorMessage = 'Login failed: Invalid response format';
        setError(errorMessage);
        setIsLoading(false);
        return { 
          success: false, 
          error: errorMessage 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };
  
  // Register new user
  const register = async (userData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.register(userData);
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        // Save to localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        
        // Update state
        setCurrentUser(user);
        setIsLoading(false);
        
        return { success: true, user };
      } else {
        setError(response.data.message || 'Registration failed');
        setIsLoading(false);
        return { success: false, error: response.data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };
  
  // Logout user
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setCurrentUser(null);
  };
  
  // Role check helpers
  const isCustomer = () => currentUser?.role === 'customer';
  const isRestaurantOwner = () => currentUser?.role === 'restaurantOwner';
  const isDeliveryRider = () => currentUser?.role === 'deliveryRider';
  const isAdmin = () => currentUser?.role === 'admin';
  
  // Context value
  const value = {
    currentUser,
    isLoading,
    error,
    register,
    login,
    logout,
    isCustomer,
    isRestaurantOwner,
    isDeliveryRider,
    isAdmin
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
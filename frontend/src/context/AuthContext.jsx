import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import PropTypes from 'prop-types';

// Create the auth context
export const AuthContext = createContext();

// Helper function to normalize user data to ensure role property
const normalizeUserData = (userData) => {
  if (!userData) return null;
  
  // If role is already defined, use it
  if (userData.role) {
    // Convert 'restaurantOwner' to 'restaurant' for consistency
    if (userData.role === 'restaurantOwner') {
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
    case 'restaurantOwner':
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
  
  // Check for stored auth token and user data
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        // Normalize user data to ensure role property
        setCurrentUser(normalizeUserData(parsedUserData));
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
        const { token, user, dashboardPath } = response.data;
        
        // Normalize user data to ensure role property
        const normalizedUser = normalizeUserData(user);
        
        // Save to localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(normalizedUser));
        
        // Update state
        setCurrentUser(normalizedUser);
        setIsLoading(false);
        
        return { 
          success: true, 
          user: normalizedUser,
          // Use the server-provided dashboard path or calculate it
          dashboardPath: dashboardPath || getDashboardPath(normalizedUser.role)
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
      
      // Check if the response indicates an error
      if (!response.data.success) {
        setError(response.data.message || 'Registration failed');
        setIsLoading(false);
        return { success: false, error: response.data.message || 'Registration failed' };
      }
      
      if (response.data.success) {
        const { user } = response.data;
        // Original response provides token but we're not using it since we're not auto-logging in
        // const { token, user } = response.data;
        
        // Normalize user data to ensure role property
        const normalizedUser = normalizeUserData(user);
        
        // For auto-login after registration, uncomment these:
        // Save to localStorage
        // localStorage.setItem('authToken', token);
        // localStorage.setItem('userData', JSON.stringify(normalizedUser));
        // Update state
        // setCurrentUser(normalizedUser);
        
        setIsLoading(false);
        
        return { 
          success: true, 
          user: normalizedUser,
          dashboardPath: getDashboardPath(normalizedUser.role)
        };
      } else {
        setError(response.data.message || 'Registration failed');
        setIsLoading(false);
        return { success: false, error: response.data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed. Please try again.';
      
      // Handle specific API error responses
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 409) {
          errorMessage = 'User with this email already exists.';
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid registration data. Please check your information.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your internet connection.';
      }
      
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };
  
  // Update profile
  const updateProfile = async (profileData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.updateProfile(profileData);
      
      if (response.data.success) {
        const { user } = response.data;
        
        // Normalize user data to ensure role property
        const normalizedUser = normalizeUserData(user);
        
        // Update stored user data
        localStorage.setItem('userData', JSON.stringify(normalizedUser));
        
        // Update state
        setCurrentUser(normalizedUser);
        setIsLoading(false);
        
        return { success: true, user: normalizedUser };
      } else {
        setError(response.data.message || 'Profile update failed');
        setIsLoading(false);
        return { success: false, error: response.data.message || 'Profile update failed' };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.message || 'Profile update failed. Please try again.';
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
  const isCustomer = () => currentUser?.role === 'customer' || 
    (!currentUser?.role && !currentUser?.isAdmin && !currentUser?.isRestaurantOwner && !currentUser?.isDeliveryRider);
    
  const isRestaurantOwner = () => currentUser?.role === 'restaurantOwner' || 
    currentUser?.isRestaurantOwner === true;
    
  const isDeliveryRider = () => currentUser?.role === 'deliveryRider' || 
    currentUser?.isDeliveryRider === true || 
    currentUser?.isDeliveryStaff === true;
    
  const isAdmin = () => currentUser?.role === 'admin' || 
    currentUser?.isAdmin === true;
  
  // Context value
  const value = {
    currentUser,
    isLoading,
    error,
    register,
    login,
    logout,
    updateProfile,
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
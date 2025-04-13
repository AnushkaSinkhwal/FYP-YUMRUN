import { createContext, useContext, useState, useEffect } from 'react';
import api, { authAPI } from '../utils/api';
import PropTypes from 'prop-types';

// Create the auth context
export const AuthContext = createContext();

// Helper function to normalize user data to ensure role property
const normalizeUserData = (userData) => {
  if (!userData) return null;
  
  console.log('Normalizing user data:', userData);
  
  // First check for restaurant details to determine if user is a restaurant owner
  // This takes priority over explicit role to ensure restaurant owners are correctly identified
  if (userData.restaurantDetails && Object.keys(userData.restaurantDetails).length > 0) {
    console.log('User has restaurant details, setting role to restaurant');
    return { ...userData, role: 'restaurant' };
  }
  
  // If role is already defined, use it
  if (userData.role) {
    console.log('User has explicit role:', userData.role);
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
    console.log('User is admin based on isAdmin flag');
  } else if (userData.isRestaurantOwner) {
    role = 'restaurant';
    console.log('User is restaurant owner based on isRestaurantOwner flag');
  } else if (userData.isDeliveryStaff || userData.isDeliveryRider) {
    role = 'delivery_rider';
    console.log('User is delivery rider based on isDeliveryStaff/isDeliveryRider flag');
  } else {
    console.log('User has no special role flags, defaulting to customer');
  }
  
  console.log('Final normalized role:', role);
  
  // Return a new object with the role property added
  return { ...userData, role };
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
        console.log('Loading stored user data:', parsedUserData);
        
        // Ensure the user data has the correct role format
        const normalizedUser = normalizeUserData(parsedUserData);
        console.log('Normalized user data on load:', normalizedUser);
        
        setCurrentUser(normalizedUser);
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
  
  // Register new user
  const register = async (userData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Registration data:', userData);
      const response = await authAPI.register(userData);
      
      // Check if the response indicates an error
      if (!response.data.success) {
        const errorMessage = response.data.error?.message || 'Registration failed';
        setError(errorMessage);
        setIsLoading(false);
        return { success: false, error: errorMessage };
      }
      
      // Successful registration, check if email verification is required
      if (response.data.requiresOTP) {
        setIsLoading(false);
        return { 
          success: true, 
          requiresOTP: true,
          email: response.data.email,
          message: response.data.message || 'Please verify your email to continue'
        };
      }
      
      // Standard success response
      if (response.data.success && response.data.data) {
        const { user } = response.data.data; // Assuming data is nested under 'data'
        
        // Normalize user data to ensure role property
        const normalizedUser = normalizeUserData(user);
        
        // Not auto-logging in after registration
        
        setIsLoading(false);
        
        return { 
          success: true, 
          user: normalizedUser
        };
      } else {
        // Success without data - simple success case
        setIsLoading(false);
        return {
          success: true,
          message: response.data.message || 'Registration successful'
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      // Extract specific error message from backend response if available
      let errorMessage = error.response?.data?.error?.message;
      
      if (!errorMessage && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      if (!errorMessage) {
        errorMessage = 'Registration failed. Please try again.';
      }
      
      setError(errorMessage);
      setIsLoading(false);
      // Return the specific error message
      return { success: false, error: errorMessage };
    }
  };
  
  // Verify email with OTP
  const verifyEmail = async (verificationData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.verifyEmail(verificationData);
      
      // Check if response indicates error
      if (!response.data.success) {
        const errorMessage = response.data.error?.message || 'Email verification failed';
        setError(errorMessage);
        setIsLoading(false);
        return { success: false, error: errorMessage };
      }
      
      // Check if we should redirect to sign-in
      if (response.data.redirectToSignIn) {
        setIsLoading(false);
        return { 
          success: true, 
          redirectToSignIn: true
        };
      }
      
      // Legacy response handling for backward compatibility
      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data;
        const normalizedUser = normalizeUserData(user);
        
        // Save to localStorage for auto-login
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(normalizedUser));
        
        // Set default header for subsequent requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Update state
        setCurrentUser(normalizedUser);
        
        // Determine dashboard path
        let dashboardPath;
        if (normalizedUser.role === 'admin') {
          dashboardPath = '/admin/dashboard';
        } else if (normalizedUser.role === 'restaurant') {
          dashboardPath = '/restaurant/dashboard';
        } else if (normalizedUser.role === 'delivery_rider') {
          dashboardPath = '/delivery/dashboard';
        } else {
          dashboardPath = '/user/dashboard';
        }
        
        setIsLoading(false);
        
        return { 
          success: true, 
          user: normalizedUser,
          dashboardPath
        };
      } else {
        // Just success with no data, basic success
        setIsLoading(false);
        return { success: true };
      }
    } catch (error) {
      console.error('Email verification error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Email verification failed. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };
  
  // Resend OTP
  const resendOTP = async (data) => {
    setError(null);
    
    try {
      const response = await authAPI.resendOTP(data);
      
      // Check if response indicates error
      if (!response.data.success) {
        const errorMessage = response.data.error?.message || 'Failed to resend verification code';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
      
      return { 
        success: true, 
        message: response.data.message || 'Verification code sent successfully'
      };
    } catch (error) {
      console.error('Resend OTP error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to resend verification code. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };
  
  // Unified login for all user types
  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);
    // Clear previous auth header before attempting login
    delete api.defaults.headers.common['Authorization'];
    
    try {
      console.log('Attempting login with credentials:', { email: credentials.email });
      const response = await authAPI.login(credentials);
      console.log('Raw login response:', response);
      
      // Check if response is from the error handler or actual API
      if (response.success === false) {
        const errorMsg = response.error || 'Login failed';
        console.error('Login failed:', errorMsg);
        setError(errorMsg);
        setIsLoading(false);
        return response;
      }
      
      // Check if email verification is required
      if (response.data && response.data.requiresOTP) {
        setIsLoading(false);
        return { 
          success: false, 
          requiresOTP: true,
          email: response.data.email,
          error: response.data.error?.message || 'Email verification required'
        };
      }
      
      // This is a successful API response
      if (response.data && response.data.success) {
        console.log('Login response data:', response.data);
        
        // Check if data.data exists (for nested data structure)
        let userData, token;
        if (response.data.data) {
          // Nested data structure
          userData = response.data.data.user;
          token = response.data.data.token;
        } else {
          // Direct data structure
          userData = response.data.user;
          token = response.data.token;
        }
        
        console.log('Extracted user data:', userData);
        
        if (!userData) {
          console.error('User data is missing in the response');
          setError('Invalid response format: missing user data');
          setIsLoading(false);
          return { success: false, error: 'Login failed: Invalid response format' };
        }
        
        // Normalize user data to ensure role property
        const normalizedUser = normalizeUserData(userData);
        console.log('Normalized user data:', normalizedUser);
        
        if (!normalizedUser || !normalizedUser.role) {
          console.error('Failed to determine user role after normalization');
          setError('Failed to determine user role');
          setIsLoading(false);
          return { success: false, error: 'Login failed: Unable to determine user role' };
        }
        
        // Save to localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(normalizedUser));
        
        // Set default header for subsequent requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Update state
        setCurrentUser(normalizedUser);
        setIsLoading(false);
        
        // Determine correct dashboard path based on role
        let roleDashboardPath;
        const userRole = normalizedUser.role;
        
        console.log('Login success - User role determined as:', userRole);
        
        if (userRole === 'admin') {
          roleDashboardPath = '/admin/dashboard';
        } else if (userRole === 'restaurant') {
          roleDashboardPath = '/restaurant/dashboard';
        } else if (userRole === 'delivery_rider') {
          roleDashboardPath = '/delivery/dashboard';
        } else {
          roleDashboardPath = '/user/dashboard';
        }
        
        console.log('Redirecting to dashboard path:', roleDashboardPath);
        
        return { 
          success: true, 
          user: normalizedUser,
          dashboardPath: roleDashboardPath
        };
      } else {
        const errorMessage = response.data?.message || 'Login failed: Invalid response format';
        console.error('Login failed:', errorMessage);
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
    (currentUser && !currentUser.role);
    
  const isRestaurantOwner = () => currentUser?.role === 'restaurant' || 
    (currentUser && currentUser.isRestaurantOwner);
    
  const isDeliveryRider = () => currentUser?.role === 'delivery_rider' || 
    (currentUser && (currentUser.isDeliveryRider || currentUser.isDeliveryStaff));
    
  const isAdmin = () => currentUser?.role === 'admin' || 
    (currentUser && currentUser.isAdmin);
  
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
    verifyEmail,
    resendOTP,
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
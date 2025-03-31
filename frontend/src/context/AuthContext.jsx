import { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../utils/api';
import { jwtDecode } from 'jwt-decode';
import PropTypes from 'prop-types';

// Create the auth context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkUserAuth = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          setCurrentUser(null);
          setIsLoading(false);
          return;
        }
        
        // Check if token is valid and not expired
        try {
          const decodedToken = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decodedToken.exp < currentTime) {
            // Token is expired
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            setCurrentUser(null);
            setIsLoading(false);
            return;
          }
          
          // If token is valid, load user data from localStorage
          const userDataString = localStorage.getItem('userData');
          
          if (userDataString) {
            const userData = JSON.parse(userDataString);
            // Ensure role is properly set
            if (!userData.role) {
              userData.role = 'user';
            }
            setCurrentUser(userData);
            setIsLoading(false);
          } else {
            try {
              // If no user data in localStorage, fetch from API
              const response = await authAPI.getCurrentUser();
              if (response.data.success) {
                const userData = response.data.user;
                // Ensure role is properly set
                if (!userData.role) {
                  userData.role = 'user';
                }
                localStorage.setItem('userData', JSON.stringify(userData));
                setCurrentUser(userData);
              }
            } catch (error) {
              console.error('Error fetching user data:', error);
              // Handle error - clear auth data
              localStorage.removeItem('authToken');
              localStorage.removeItem('userData');
              setCurrentUser(null);
            }
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Token validation error:', error);
          // Invalid token
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          setCurrentUser(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setError(error);
        setIsLoading(false);
      }
    };
    
    checkUserAuth();
  }, []);
  
  // Unified login for all user types (admin, restaurant owner, regular user)
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.unifiedLogin(email, password);
      
      if (response.success) {
        const { token, user } = response;
        
        // Ensure role is properly set
        if (!user.role) {
          user.role = 'user';
        }
        
        // Save to localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        
        // Update state
        setCurrentUser(user);
        setIsLoading(false);
        
        // Return success with user data for redirection decisions
        return { 
          success: true, 
          user,
          role: user.role,
          isAdmin: user.role === 'admin',
          isRestaurantOwner: user.role === 'restaurantOwner',
          isDeliveryStaff: user.role === 'deliveryUser'
        };
      } else {
        setError(response.error || 'Login failed');
        setIsLoading(false);
        return { 
          success: false, 
          error: response.error || 'Login failed. Please check your credentials.' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };
  
  // Unified register for all user types with role selection
  const register = async (userData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Registering user with:', userData);
      
      // Ensure role is properly set
      if (!userData.role) {
        userData.role = 'user';
      }
      
      // userData should include: name, email, password, phone, role, and any role-specific fields
      const response = await authAPI.register(userData);
      console.log('Registration response:', response.data);
      
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
  
  // Legacy wrapper for backward compatibility
  const registerUser = async (name, email, password, phone, healthCondition = 'Healthy') => {
    return register({
      name,
      email,
      password,
      phone,
      healthCondition,
      role: 'user'
    });
  };
  
  // Register restaurant owner
  const registerRestaurantOwner = async (name, email, password, phone, restaurantName, restaurantAddress) => {
    return register({
      name,
      email,
      password,
      phone,
      restaurantName,
      restaurantAddress,
      role: 'restaurantOwner'
    });
  };
  
  // Logout user
  const logout = () => {
    authAPI.logout();
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setCurrentUser(null);
  };
  
  // Helper functions to check user roles
  const isAdmin = () => currentUser?.role === 'admin';
  const isRestaurantOwner = () => currentUser?.role === 'restaurantOwner';
  const isDeliveryStaff = () => currentUser?.role === 'deliveryUser';
  const isRegularUser = () => currentUser?.role === 'user';
  
  // Context value
  const value = {
    currentUser,
    isLoading,
    error,
    login,
    register,
    registerUser,
    registerRestaurantOwner,
    logout,
    isAdmin,
    isRestaurantOwner,
    isDeliveryStaff,
    isRegularUser
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// PropTypes validation
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
}; 
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
            setCurrentUser(JSON.parse(userDataString));
            setIsLoading(false);
          } else {
            try {
              // If no user data in localStorage, fetch from API
              const response = await authAPI.getCurrentUser();
              if (response.data.success) {
                const userData = response.data.user;
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
  
  // Login user (works for all user types)
  const login = async (usernameOrEmail, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Attempting to login with:', { usernameOrEmail, password });
      const response = await authAPI.login(usernameOrEmail, password);
      console.log('Login response:', response.data);
      
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
        setError(response.data.message || 'Login failed');
        setIsLoading(false);
        return { success: false, error: response.data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };
  
  // Register user
  const register = async (name, email, password, phone, healthCondition = 'Healthy') => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Registering user with:', { name, email, phone, healthCondition });
      const userData = { name, email, password, phone, healthCondition };
      
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
  
  // Logout user
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setCurrentUser(null);
  };
  
  // Helper functions to check user roles
  const isAdmin = () => currentUser?.isAdmin === true;
  const isRestaurantOwner = () => currentUser?.isRestaurantOwner === true;
  const isDeliveryStaff = () => currentUser?.isDeliveryStaff === true;
  
  // Context value
  const value = {
    currentUser,
    isLoading,
    error,
    login,
    register,
    logout,
    isAdmin,
    isRestaurantOwner,
    isDeliveryStaff
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
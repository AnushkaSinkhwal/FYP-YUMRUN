import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../utils/api';
import { jwtDecode } from 'jwt-decode';

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
          
          // If token is valid, load user data from localStorage or API
          const userDataString = localStorage.getItem('userData');
          
          if (userDataString) {
            setCurrentUser(JSON.parse(userDataString));
            setIsLoading(false);
          } else {
            // If no user data in localStorage, fetch from API
            const response = await authAPI.getCurrentUser();
            if (response.data.success) {
              const userData = response.data.user;
              localStorage.setItem('userData', JSON.stringify(userData));
              setCurrentUser(userData);
            }
            setIsLoading(false);
          }
        } catch (error) {
          // Invalid token
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          setCurrentUser(null);
          setIsLoading(false);
        }
      } catch (error) {
        setError(error);
        setIsLoading(false);
      }
    };
    
    checkUserAuth();
  }, []);
  
  // Login user
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.login(email, password);
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        // Save to localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        
        // Update state
        setCurrentUser(user);
        setIsLoading(false);
        
        return { success: true, user };
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      setIsLoading(false);
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };
  
  // Register user
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
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      setIsLoading(false);
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  };
  
  // Logout user
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setCurrentUser(null);
  };
  
  // Check if user is admin
  const isAdmin = () => {
    return currentUser && currentUser.isAdmin;
  };
  
  // Check if user is restaurant owner
  const isRestaurantOwner = () => {
    return currentUser && currentUser.isRestaurantOwner;
  };
  
  // Check if user is delivery staff
  const isDeliveryStaff = () => {
    return currentUser && currentUser.isDeliveryStaff;
  };
  
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

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
}; 
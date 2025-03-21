import axios from 'axios';

// Create axios instance with base URL from environment variables
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    // Check for token in localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle unauthorized errors (token expired, etc.)
    if (error.response && error.response.status === 401) {
      // Clear auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      // Handle redirect based on user type
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      if (userData.isAdmin) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API methods
export const authAPI = {
  // Login user (works for any user type)
  login: async (email, password) => {
    return api.post('/auth/login', { email, password });
  },
  
  // Register new user
  register: async (userData) => {
    return api.post('/auth/register', userData);
  },
  
  // Get current user profile
  getCurrentUser: async () => {
    return api.get('/auth/me');
  }
};

// Admin API methods
export const adminAPI = {
  // Get dashboard data
  getDashboard: async () => {
    return api.get('/admin/dashboard');
  },
  
  // Get all users
  getUsers: async () => {
    return api.get('/admin/users');
  },
  
  // Get user by ID
  getUserById: async (userId) => {
    return api.get(`/admin/users/${userId}`);
  },
  
  // Update user
  updateUser: async (userId, userData) => {
    return api.put(`/admin/users/${userId}`, userData);
  },
  
  // Get restaurant owners
  getOwners: async () => {
    return api.get('/admin/owners');
  },
  
  // Get system statistics
  getStatistics: async () => {
    return api.get('/admin/statistics');
  }
};

export default api; 
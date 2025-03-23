import axios from 'axios';

// Create axios instance with base URL from environment variables
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
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
    console.log('API Error:', error);
    
    // Handle unauthorized errors (token expired, etc.)
    if (error.response && error.response.status === 401) {
      // Clear auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      // Redirect to login page
      const path = window.location.pathname;
      if (path.startsWith('/admin')) {
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
  // Login user (works for both regular and admin users)
  login: async (usernameOrEmail, password) => {
    return api.post('/auth/login', { email: usernameOrEmail, password });
  },
  
  // Register new user
  register: async (userData) => {
    return api.post('/auth/register', userData);
  },
  
  // Get current user profile
  getCurrentUser: async () => {
    return api.get('/auth/me');
  },
  
  // Logout user (client-side)
  logout: async () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    return { success: true };
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
  
  // Delete user
  deleteUser: async (userId) => {
    return api.delete(`/admin/users/${userId}`);
  },
  
  // Get admin notifications
  getNotifications: async () => {
    return api.get('/admin/notifications');
  },
  
  // Process notification (approve/reject)
  processNotification: async (notificationId, status) => {
    return api.post(`/admin/notifications/${notificationId}`, { status });
  }
};

// User API methods
export const userAPI = {
  // Update user profile
  updateProfile: async (userData) => {
    return api.put('/users/profile', userData);
  },
  
  // Change password
  changePassword: async (passwordData) => {
    return api.put('/users/password', passwordData);
  }
};

// Export default instance
export default api; 
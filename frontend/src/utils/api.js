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
      window.location.href = '/signin';
    }
    
    return Promise.reject(error);
  }
);

// Auth API methods
export const authAPI = {
  // Unified login for all user types (admin, restaurant owner, regular user)
  unifiedLogin: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      return response.data;
    } catch (error) {
      // Handle specific error codes
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const { data, status } = error.response;
        
        if (status === 401) {
          return { 
            success: false, 
            error: data.message || 'Invalid credentials'
          };
        } else if (status === 403) {
          return { 
            success: false, 
            error: data.message || 'Access denied. You do not have the required permissions.'
          };
        } else {
          return { 
            success: false, 
            error: data.message || 'Login failed'
          };
        }
      } else if (error.request) {
        // The request was made but no response was received
        return { 
          success: false, 
          error: 'No response from server. Please check your internet connection.'
        };
      } else {
        // Something happened in setting up the request that triggered an Error
        return { 
          success: false, 
          error: error.message || 'Connection error. Please try again.'
        };
      }
    }
  },
  
  // Legacy login methods (to be removed once unified login is fully implemented)
  login: async (usernameOrEmail, password) => {
    return authAPI.unifiedLogin(usernameOrEmail, password);
  },
  
  // Register new user (now supports role selection)
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
  
  // Get all users (admin only)
  getUsers: async () => {
    return api.get('/admin/users');
  },
  
  // Get user by ID (admin only)
  getUser: async (userId) => {
    return api.get(`/admin/users/${userId}`);
  },
  
  // Update user (admin only)
  updateUser: async (userId, userData) => {
    return api.put(`/admin/users/${userId}`, userData);
  },
  
  // Delete user (admin only)
  deleteUser: async (userId) => {
    return api.delete(`/admin/users/${userId}`);
  },
  
  // Get all deliveries
  getDeliveries: async () => {
    return api.get('/admin/deliveries');
  },
  
  // Get delivery by ID
  getDelivery: async (deliveryId) => {
    return api.get(`/admin/deliveries/${deliveryId}`);
  },
  
  // Update delivery status
  updateDeliveryStatus: async (deliveryId, status) => {
    return api.put(`/admin/deliveries/${deliveryId}/status`, { status });
  },
  
  // Assign driver to delivery
  assignDriver: async (deliveryId, driverId) => {
    return api.post(`/admin/deliveries/${deliveryId}/assign`, { driverId });
  },
  
  // Get all drivers available for assignment
  getAvailableDrivers: async () => {
    return api.get('/admin/drivers/available');
  },
  
  // Get admin notifications
  getNotifications: async () => {
    return api.get('/admin/notifications');
  },
  
  // Get notification count
  getNotificationCount: async () => {
    return api.get('/admin/notifications/count');
  },
  
  // Process notification (approve/reject)
  processNotification: async (notificationId, action) => {
    return api.post(`/admin/notifications/${notificationId}/process`, { action });
  },
  
  // Approve user profile changes
  approveProfileChanges: async (userId, changes) => {
    return api.post(`/admin/users/${userId}/approve-changes`, changes);
  },
  
  // Reject user profile changes
  rejectProfileChanges: async (userId, reason) => {
    return api.post(`/admin/users/${userId}/reject-changes`, { reason });
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
    return api.put('/users/change-password', passwordData);
  },
  
  // Get profile change status
  getProfileChangeStatus: async () => {
    return api.get('/users/profile/change-status');
  }
};

// Export default instance
export default api; 
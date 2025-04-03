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
  unifiedLogin: async (credentials) => {
    try {
      const { email, password } = credentials;
      console.log('Making login request with:', { email });
      const response = await api.post('/auth/login', { email, password });
      console.log('Server response:', response.data);
      
      // Ensure we're returning the data property from the response
      return response;
    } catch (error) {
      console.error('Login request error:', error.response || error);
      // Handle specific error codes
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const { data, status } = error.response;
        console.log('Error response:', { status, data });
        
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
        console.log('No response received from server');
        return { 
          success: false, 
          error: 'No response from server. Please check your internet connection.'
        };
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Request setup error:', error.message);
        return { 
          success: false, 
          error: error.message || 'Connection error. Please try again.'
        };
      }
    }
  },
  
  // Legacy login methods (to be removed once unified login is fully implemented)
  login: async (credentials) => {
    return authAPI.unifiedLogin(credentials);
  },
  
  // Register new user (now supports role selection)
  register: async (userData) => {
    return api.post('/auth/register', userData);
  },
  
  // Get current user profile
  getCurrentUser: async () => {
    return api.get('/auth/me');
  },
  
  // Update user profile
  updateProfile: async (profileData) => {
    return api.put('/user/profile', profileData);
  },
  
  // Request email change (requires admin approval)
  requestEmailChange: async (newEmail) => {
    return api.put('/user/profile/email', { email: newEmail });
  },
  
  // Get user's approval requests
  getApprovalRequests: async () => {
    return api.get('/user/approval-requests');
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
  
  // Update admin's own profile
  updateProfile: async (profileData) => {
    return api.put('/admin/profile', profileData);
  },
  
  // Get all pending approval requests
  getApprovalRequests: async () => {
    return api.get('/admin/approval-requests');
  },
  
  // Process an approval request (approve or reject)
  processApprovalRequest: async (requestId, { status, feedback }) => {
    return api.post(`/admin/approval/${requestId}`, { status, feedback });
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
  processNotification: async (notificationId, action, data = {}) => {
    return api.post(`/admin/notifications/${notificationId}/process`, { action, ...data });
  },
  
  // Get pending restaurant profile approvals
  getRestaurantApprovals: async () => {
    return api.get('/admin/restaurant-approvals');
  },
  
  // Get count of pending restaurant profile approvals
  getRestaurantApprovalsCount: async () => {
    return api.get('/admin/restaurant-approvals/count');
  },
  
  // Approve restaurant profile changes
  approveRestaurantChanges: async (approvalId) => {
    return api.post(`/admin/restaurant-approvals/${approvalId}/approve`);
  },
  
  // Reject restaurant profile changes
  rejectRestaurantChanges: async (approvalId, reason) => {
    return api.post(`/admin/restaurant-approvals/${approvalId}/reject`, { reason });
  }
};

// Restaurant API methods
export const restaurantAPI = {
  // Get restaurant profile
  getProfile: async () => {
    return api.get('/restaurant/profile');
  },
  
  // Update restaurant profile
  updateProfile: async (profileData) => {
    return api.put('/restaurant/profile', profileData);
  },
  
  // Submit profile changes for approval
  submitProfileChanges: async (changes) => {
    return api.post('/restaurant/profile/changes', changes);
  },
  
  // Get profile change status
  getProfileChangeStatus: async () => {
    return api.get('/restaurant/profile/changes/status');
  },
  
  // Get restaurant notifications
  getNotifications: async () => {
    return api.get('/restaurant/notifications');
  },
  
  // Get unread notification count
  getUnreadNotificationCount: async () => {
    return api.get('/restaurant/notifications/unread-count');
  },
  
  // Mark notification as read
  markNotificationAsRead: async (notificationId) => {
    return api.put(`/restaurant/notifications/${notificationId}/read`);
  },
  
  // Mark all notifications as read
  markAllNotificationsAsRead: async () => {
    return api.put('/restaurant/notifications/mark-all-read');
  },
  
  // Delete notification
  deleteNotification: async (notificationId) => {
    return api.delete(`/restaurant/notifications/${notificationId}`);
  },
  
  // Get all offers for the restaurant
  getOffers: async () => {
    return api.get('/offers/restaurant');
  },
  
  // Get a specific offer
  getOffer: async (offerId) => {
    return api.get(`/offers/${offerId}`);
  },
  
  // Create a new offer
  createOffer: async (offerData) => {
    return api.post('/offers', offerData);
  },
  
  // Update an offer
  updateOffer: async (offerId, offerData) => {
    return api.put(`/offers/${offerId}`, offerData);
  },
  
  // Toggle offer active status
  toggleOfferActive: async (offerId) => {
    return api.patch(`/offers/${offerId}/toggle-active`);
  },
  
  // Delete an offer
  deleteOffer: async (offerId) => {
    return api.delete(`/offers/${offerId}`);
  }
};

// User API methods
export const userAPI = {
  // Get user profile
  getUserProfile: async () => {
    return api.get('/user/profile');
  },
  
  // Update user profile
  updateProfile: async (userData) => {
    return api.put('/user/profile', userData);
  },
  
  // Update user settings
  updateSettings: async (settings) => {
    return api.put('/user/settings', settings);
  },
  
  // Request email change (requires admin approval)
  requestEmailChange: async (newEmail) => {
    return api.put('/user/profile/email', { email: newEmail });
  },
  
  // Change password
  changePassword: async (passwordData) => {
    return api.put('/user/change-password', passwordData);
  },
  
  // Get profile change status
  getProfileChangeStatus: async () => {
    return api.get('/user/profile/change-status');
  },
  
  // Get user notifications
  getNotifications: async () => {
    return api.get('/user/notifications');
  },
  
  // Get unread notification count
  getUnreadNotificationCount: async () => {
    return api.get('/user/notifications/unread-count');
  },
  
  // Mark notification as read
  markNotificationAsRead: async (notificationId) => {
    return api.put(`/user/notifications/${notificationId}/read`);
  },
  
  // Mark all notifications as read
  markAllNotificationsAsRead: async () => {
    return api.put('/user/notifications/mark-all-read');
  },
  
  // Delete notification
  deleteNotification: async (notificationId) => {
    return api.delete(`/user/notifications/${notificationId}`);
  }
};

// Export default instance
export default api; 
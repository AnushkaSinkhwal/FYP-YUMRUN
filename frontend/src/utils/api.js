import axios from 'axios';

// Create axios instance with base URL from environment variables
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for JWT token
api.interceptors.request.use(
  (config) => {
    // If sending FormData, remove Content-Type header so browser sets multipart/form-data boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }

    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    
    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Auth token added to request headers');
      
      // For debugging, log a truncated version of the token
      const truncatedToken = token.substring(0, 15) + '...';
      console.log(`Token: ${truncatedToken}`);
      
      try {
        // Parse the token payload (without verification)
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', {
          userId: payload.userId || payload.id || payload._id,
          role: payload.role,
          exp: new Date(payload.exp * 1000).toLocaleString()
        });
        
        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          console.warn('Token has expired! Expiration:', new Date(payload.exp * 1000).toLocaleString());
          // Don't clear it here - let the response interceptor handle that when it gets a 401
        }
      } catch (err) {
        console.error('Error parsing token payload:', err);
      }
    } else {
      console.log('No auth token found');
    }
    
    return config;
  },
  (error) => {
    console.error('API request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error('API Error:', error);
    
    if (error.response) {
      const { status, data, config } = error.response;
      
      // Handle 401 (Unauthorized) - Token expired or invalid
      if (status === 401) {
        console.log('Unauthorized request - clearing auth state');
        // Clear auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        
        // Do not auto-redirect for login attempts
        if (config.url && config.url.includes('/auth/login')) {
          return Promise.reject(error);
        }
        
        // Redirect to sign-in page if not already there
        if (!window.location.pathname.includes('/signin')) {
          window.location.href = '/signin?session=expired';
        }
      }
      
      // Handle 403 (Forbidden) - Permission issues
      if (status === 403) {
        console.log('Forbidden request - permissions issue:', config.url);
        console.log('Response data:', data);
        
        // Check user data
        const userData = localStorage.getItem('userData');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            console.log('Current user data in localStorage:', user);
            
            // Check if we need to fix user role
            if (config.url.includes('/restaurant/') && user.role !== 'restaurant') {
              console.log('Detected restaurant endpoint with non-restaurant role. Fixing user data.');
              user.role = 'restaurant';
              user.isRestaurantOwner = true;
              localStorage.setItem('userData', JSON.stringify(user));
              
              // Reload page to apply changes
              window.location.reload();
              return Promise.reject(error);
            }
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
          }
        }
      }
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
      
      // Check if the data structure is what we expect
      if (response.data && response.data.success === true) {
        // Make sure we have data within the response
        if (!response.data.data) {
          console.error('Response success but data field is missing:', response.data);
          return { 
            success: false, 
            error: 'Invalid response structure: missing data field' 
          };
        }
        
        // Make sure user data is present
        if (!response.data.data.user) {
          console.error('Response success but user field is missing:', response.data.data);
          return { 
            success: false, 
            error: 'Invalid response structure: missing user data' 
          };
        }
        
        // Log user role (or lack thereof)
        console.log('User role in response:', response.data.data.user.role);
      }
      
      // Ensure we're returning the correct response structure
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
  
  // Verify email with OTP
  verifyEmail: async (verificationData) => {
    return api.post('/auth/verify-email', verificationData);
  },
  
  // Resend verification OTP
  resendOTP: async (data) => {
    return api.post('/auth/resend-otp', data);
  },
  
  // Send forgot password email
  forgotPassword: async (data) => {
    return api.post('/auth/forgot-password', data);
  },
  
  // Reset password using token
  resetPassword: async ({ token, password }) => {
    return api.post(`/auth/reset-password/${token}`, { password });
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
  
  // Get a single user by ID (admin only)
  getUserById: async (userId) => {
    return api.get(`/admin/users/${userId}`);
  },
  
  // Update a user (admin only)
  updateUser: async (userId, userData) => {
    return api.put(`/admin/users/${userId}`, userData);
  },
  
  // Delete a user (admin only)
  deleteUser: async (userId) => {
    return api.delete(`/admin/users/${userId}`);
  },

  // Get all orders (admin only)
  getOrders: async () => {
    return api.get('/admin/orders');
  },

  // Get deliveries for admin (orders in progress) with optional filtering parameters
  getDeliveries: async (params = {}) => {
    return api.get('/admin/deliveries', { params });
  },

  // Update delivery status (uses same endpoint as order status update)
  updateDeliveryStatus: async (deliveryId, status) => {
    return api.patch(`/admin/orders/${deliveryId}/status`, { status });
  },

  // Update order status with optional rider assignment
  updateOrderStatus: async (orderId, status, riderId) => {
    const payload = riderId ? { status, riderId } : { status };
    return api.patch(`/admin/orders/${orderId}/status`, payload);
  },
  
  // Get all delivery riders
  getRiders: async () => {
    return api.get('/delivery/staff');
  },
  
  // Approve or reject a rider
  updateRiderApproval: async (riderId, approved) => {
    try {
      console.log(`API call: Update rider ${riderId} approval status to: ${approved}`);
      
      // Check that riderId is valid
      if (!riderId) {
        console.error('Invalid riderId provided to updateRiderApproval');
        return {
          data: {
            success: false,
            message: 'Invalid rider ID'
          }
        };
      }
      
      // Make the API call with explicit content type and payload
      const response = await api.put(`/admin/riders/${riderId}/approve`, { 
        approved: approved 
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Log response for debugging
      console.log('Rider approval API response:', response.data);
      
      return response;
    } catch (error) {
      console.error('Error in updateRiderApproval:', error);
      
      // Log more details about the error
      if (error.response) {
        console.error('Response error data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        return error.response;
      } else if (error.request) {
        console.error('Request made but no response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      return {
        data: {
          success: false,
          message: 'Failed to update rider approval status'
        }
      };
    }
  },
  
  // Get restaurant approvals
  getRestaurantApprovals: async () => {
    return api.get('/admin/restaurant-approvals');
  },

  // Approve restaurant profile changes
  approveRestaurantProfileChanges: async (approvalId) => {
    return api.post(`/admin/restaurant-approvals/${approvalId}/approve`);
  },
  
  // Reject restaurant profile changes
  rejectRestaurantProfileChanges: async (approvalId, data) => {
    return api.post(`/admin/restaurant-approvals/${approvalId}/reject`, data);
  },

  // Get available drivers (admin only)
  getAvailableDrivers: async () => {
    // Fetch actual delivery riders from backend
    return api.get('/delivery/staff');
  },
  
  // Restaurant Management (approvals, updates)
  getRestaurants: async () => {
    // Calls the new endpoint that returns formatted, non-deleted restaurants
    return api.get('/admin/restaurants');
  },
  getRestaurantById: async (restaurantId) => {
    // Calls the new endpoint for single restaurant details
    return api.get(`/admin/restaurants/${restaurantId}`);
  },
  // **NEW**: Update restaurant status (approve, reject, delete)
  updateRestaurantStatus: async (restaurantId, statusData) => {
    // Handle both formats: string status or { status, reason } object
    const payload = typeof statusData === 'string' 
      ? { status: statusData } 
      : statusData;
    
    return api.patch(`/admin/restaurants/${restaurantId}/status`, payload);
  },
  // **NEW**: Update restaurant details by admin
  updateRestaurantDetails: async (restaurantId, detailsData) => {
    return api.patch(`/admin/restaurants/${restaurantId}/details`, detailsData);
  },
  // **DEPRECATED/REMOVED**: Direct delete route
  // deleteRestaurant: async (restaurantId) => {
  //   return api.delete(`/admin/restaurants/${restaurantId}`); 
  // },
  // **DEPRECATED/REMOVED**: Old approval/rejection routes (now handled by updateRestaurantStatus)
  // approveRestaurant: async (restaurantId) => {
  //   return api.patch(`/admin/restaurants/${restaurantId}/approve`);
  // },
  // **DEPRECATED**: Old approval list (use getRestaurants with filtering)
  // getRestaurantApprovals: async () => {
  //   return api.get('/admin/approvals/restaurants');
  // },
  // **DEPRECATED**: Old pending restaurant list (use getRestaurants with filtering)
  getPendingRestaurants: async () => {
    return api.get('/admin/pending-restaurants');
  },

  // Notification Management
  getNotifications: async (params = {}) => {
    return api.get('/admin/notifications', { params });
  },
  getNotificationCounts: async () => {
    return api.get('/admin/notifications/counts');
  },
  getUnreadNotificationCount: async () => {
    return api.get('/admin/notifications/unread-count');
  },
  processNotification: async (notificationId, action, data) => {
    return api.post(`/admin/notifications/${notificationId}/process`, { action, ...data });
  },
  approveNotification: async (notificationId, data = {}) => {
    return api.patch(`/admin/notifications/${notificationId}/approve`, data);
  },
  rejectNotification: async (notificationId, reason) => {
    return api.patch(`/admin/notifications/${notificationId}/reject`, { reason });
  },
  markNotificationAsRead: async (notificationId) => {
    return api.patch(`/admin/notifications/${notificationId}/read`);
  },
  
  // Other admin operations (settings, logs, etc.)
  getSettings: async () => {
    return api.get('/admin/settings');
  },
  updateSettings: async (settingsData) => {
    return api.put('/admin/settings', settingsData);
  },

  // **NEW** (from Restaurants.jsx - Add Restaurant functionality)
  createRestaurantAndOwner: async (newRestaurantData) => {
    return api.post('/admin/restaurants', newRestaurantData);
  },

  // Restaurant approvals and updates
  getPendingRestaurantUpdates: async () => {
    return api.get('/admin/restaurant-updates');
  },
  processRestaurantUpdate: async (updateId, action, reason) => {
    const payload = { action };
    if (action === 'reject' && reason) {
      payload.reason = reason;
    }
    return api.post(`/admin/notifications/${updateId}/process`, payload);
  },
};

// Restaurant API methods
export const restaurantAPI = {
  // Get restaurant profile
  getProfile: async () => {
    return api.get('/restaurant/profile');
  },
  
  // Get dashboard data
  getDashboard: async () => {
    return api.get('/restaurant/dashboard');
  },
  
  // Update restaurant profile
  updateProfile: async (profileData) => {
    // Ensure FormData is sent as multipart/form-data to allow file uploads
    return api.put('/restaurant/profile', profileData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
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
  },
  
  // Get orders for the restaurant - with improved error handling
  getOrders: async () => {
    try {
      console.log('Attempting to fetch restaurant orders from:', `${api.defaults.baseURL}/orders/restaurant`);
      const token = localStorage.getItem('authToken');
      console.log('Using auth token (first 20 chars):', token ? token.substring(0, 20) + '...' : 'No token found');
      
      // Check user data
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          console.log('User role:', user.role, 'isRestaurantOwner:', user.isRestaurantOwner);
          // Ensure user has restaurant role
          if (user.role !== 'restaurant') {
            console.warn('User does not have restaurant role! Setting it...');
            user.role = 'restaurant';
            user.isRestaurantOwner = true;
            localStorage.setItem('userData', JSON.stringify(user));
          }
        } catch (err) {
          console.error('Error parsing userData:', err);
        }
      }
      
      // Make the actual request
      return await api.get('/orders/restaurant');
    } catch (error) {
      console.error('Error in getOrders API call:', error);
      
      // Log specific error details
      if (error.response) {
        console.error('Response error status:', error.response.status);
        console.error('Response error data:', error.response.data);
      } else if (error.request) {
        console.error('Request error - no response received:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      // Re-throw to let component handle the error
      throw error;
    }
  },
  
  // Update order status
  updateOrderStatus: async (orderId, status, reason) => {
    const payload = { status };
    if (reason) {
      payload.reason = reason;
    }
    return api.patch(`/orders/${orderId}/status`, payload);
  },
  
  // Assign rider to an order
  assignRider: async (orderId, riderId) => {
    return api.patch(`/orders/${orderId}/assign-rider`, { riderId });
  },
  
  // NEW: Get available riders
  getAvailableRiders: async () => {
    return api.get('/restaurant/available-riders');
  },
  
  // NEW: Get order status history
  getOrderStatusHistory: async (orderId) => {
    return api.get(`/orders/${orderId}/status-history`);
  },
  
  // Add check for pending admin update notification
  hasPendingUpdate: async () => {
     return api.get('/restaurant/pending-update-check');
  },
  
  // Get restaurant details to verify it exists
  getRestaurantDetails: async (restaurantId) => {
    try {
      // Ensure we have a valid restaurant ID
      if (!restaurantId) {
        console.error('Restaurant validation failed: Missing restaurantId');
        return { 
          data: { 
            success: false, 
            message: 'Missing restaurant ID' 
          } 
        };
      }

      // Clean the restaurantId - ensure it's a string and trim any whitespace or quotes
      const cleanedId = String(restaurantId).trim().replace(/^["']|["']$/g, '');
      
      console.log(`Validating restaurant with ID: ${cleanedId}`);
      
      // Use the restaurants endpoint to verify restaurant exists
      const response = await api.get(`/restaurants/${cleanedId}`);
      return response;
    } catch (error) {
      console.error('Error validating restaurant:', error);
      
      // Return structured error response
      const errorMessage = error.response?.data?.message || error.message;
      return { 
        data: { 
          success: false, 
          message: errorMessage 
        } 
      };
    }
  },
};

// User API methods
export const userAPI = {
  // Get user dashboard data
  getDashboard: async () => {
    return api.get('/user/dashboard');
  },
  
  // Get user profile
  getProfile: async () => {
    return api.get('/user/profile');
  },
  
  // Get user orders
  getOrders: async () => {
    return api.get('/orders/user');
  },
  
  // Get a specific order by ID
  getOrder: async (orderId) => {
    try {
      // Use the standard GET /orders/:id endpoint now
      console.log(`Fetching order details from /orders/${orderId}`);
      const response = await api.get(`/orders/${orderId}`);
      // The response should already be in the { success: true, data: order } format
      return response;
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error;
    }
  },
  
  // Get restaurant details to verify it exists
  getRestaurantDetails: async (restaurantId) => {
    // Use the restaurant API's implementation
    return restaurantAPI.getRestaurantDetails(restaurantId);
  },
  
  // Create a new order
  createOrder: async (orderData) => {
    return api.post('/orders', orderData);
  },
  
  // Submit a review
  submitReview: async (reviewData) => {
    return api.post('/reviews', reviewData);
  },
  
  // Submit a review for a delivery rider
  submitRiderReview: async (reviewData) => {
    return api.post('/reviews/rider', reviewData);
  },
  
  // Update user profile
  updateProfile: async (profileData) => {
    // Ensure fullName is used if name is provided
    if (profileData.name && !profileData.fullName) {
        profileData.fullName = profileData.name;
        delete profileData.name; // Remove the ambiguous 'name' field
    }
    return api.put('/user/profile', profileData);
  },
  
  // Update health profile
  updateHealthProfile: async (healthProfile) => {
    return api.put('/user/health-profile', { healthProfile });
  },
  
  // Update delivery rider details
  updateDeliveryDetails: async (deliveryDetailsData) => {
    console.log('Updating delivery details with:', deliveryDetailsData);
    // Assuming a new endpoint, adjust if it uses the main profile endpoint
    return api.put('/user/delivery-details', deliveryDetailsData);
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
    try {
      const response = await api.get('/user/notifications');
      return response;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Return a fallback response with empty data
      return { 
        data: { 
          success: true, 
          data: [] 
        } 
      };
    }
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
  },
  
  // Get user's order history
  getOrderHistory: async () => {
    return api.get('/user/order-history');
  },
  
  // Get food recommendations for the user
  getRecommendations: async () => {
    return api.get('/user/recommendations');
  },
  
  // Get personalized recommendations
  getPersonalizedRecommendations: async () => {
    return api.get('/search/personalized');
  },
  
  // Initiate Khalti payment
  initiateKhaltiPayment: async (paymentData) => {
    return api.post('/payment/khalti/initiate', paymentData);
  },
  
  // Verify Khalti payment
  verifyKhaltiPayment: async (verificationData) => {
    return api.post('/payment/khalti/verify', verificationData);
  },
  
  // Get payment status
  getPaymentStatus: async (orderId) => {
    return api.get(`/payment/status/${orderId}`);
  },
  
  // Get a user's saved addresses
  getAddresses: async () => {
    return api.get('/user/addresses');
  },
  
  // Add a new address
  addAddress: async (addressData) => {
    return api.post('/user/addresses', addressData);
  },
  
  // Update an existing address
  updateAddress: async (addressId, addressData) => {
    return api.put(`/user/addresses/${addressId}`, addressData);
  },
  
  // Delete an address
  deleteAddress: async (addressId) => {
    return api.delete(`/user/addresses/${addressId}`);
  },
  
  // Manage favorites
  getFavorites: async () => {
    return api.get('/user/favorites');
  },
  
  // Add item to favorites
  addFavorite: async (itemId) => {
    return api.post('/user/favorites', { itemId });
  },
  
  // Remove item from favorites
  removeFavorite: async (itemId) => {
    return api.delete(`/user/favorites/${itemId}`);
  },
  
  // Update order status
  updateOrderStatus: async (orderId, status) => {
    return api.patch(`/orders/${orderId}/status`, { status });
  },
  
  // Cancel an order (only for user's own pending orders)
  cancelOrder: async (orderId) => {
    return api.patch(`/orders/${orderId}/cancel`);
  },
};

// Delivery Rider API methods
export const deliveryAPI = {
  // Get dashboard data
  getDashboard: async () => {
    return api.get('/delivery/dashboard');
  },
  
  // Get active deliveries for the logged-in rider
  getActiveDeliveries: async () => {
    return api.get('/delivery/active');
  },

  // Get available orders for pickup
  getAvailableOrders: async () => {
    return api.get('/delivery/available');
  },

  // Get delivery history for the logged-in rider
  getDeliveryHistory: async (limit = 50) => {
    return api.get(`/delivery/history?limit=${limit}`);
  },

  // Get earnings summary for the logged-in rider
  getEarningsSummary: async () => {
    return api.get('/delivery/earnings-summary');
  },
  
  // Get comprehensive earnings data with period support
  getEarnings: async (period = 'week') => {
    return api.get(`/delivery/earnings?period=${period}`);
  },

  // Get details of a specific order
  getOrderDetails: async (orderId) => {
    // Note: This might need a specific delivery endpoint or use a general order endpoint
    // Assuming a general order endpoint exists for now
    return api.get(`/orders/${orderId}`); 
  },

  // Accept an available order for delivery
  acceptOrder: async (orderId) => {
    return api.post(`/delivery/accept/${orderId}`);
  },

  // Update the status of an order (e.g., picked up, delivered)
  updateOrderStatus: async (orderId, status) => {
    return api.post(`/delivery/update-status/${orderId}`, { status });
  },

  // Get the delivery rider's profile
  getProfile: async () => {
    // Assuming this uses the generic user profile endpoint
    return userAPI.getProfile();
  },

  // Update the delivery rider's profile
  updateProfile: async (profileData) => {
    // Assuming this uses the generic user profile update endpoint
    return userAPI.updateProfile(profileData);
  },

  // Update delivery rider settings (e.g., vehicle type, availability)
  updateSettings: async (settingsData) => {
    // This might need a specific endpoint, using user settings for now
    return userAPI.updateSettings(settingsData);
  },

  // Get notifications
  getNotifications: async () => {
    return api.get('/delivery/notifications');
  },
  
  // Get unread notification count
  getUnreadNotificationCount: async () => {
    return api.get('/delivery/notifications/unread-count');
  },
  
  // Mark notification as read
  markNotificationAsRead: async (notificationId) => {
    return api.put(`/delivery/notifications/${notificationId}/read`);
  },
  
  // Mark all notifications as read
  markAllNotificationsAsRead: async () => {
    return api.put('/delivery/notifications/mark-all-read');
  },
  
  // Delete notification
  deleteNotification: async (notificationId) => {
    return api.delete(`/delivery/notifications/${notificationId}`);
  },
  
  // Get reviews for the delivery rider
  getReviews: async () => {
    return api.get('/delivery/reviews');
  }
};

// --- NEW: Review API methods ---
export const reviewAPI = {
  // Create a new review
  createReview: async (reviewData) => {
    // reviewData should contain: { orderId, menuItemId, rating, comment }
    return api.post('/reviews', reviewData);
  },

  // Get reviews for a specific menu item (public)
  getMenuItemReviews: async (menuItemId) => {
    return api.get(`/reviews/menuItem/${menuItemId}`);
  },

  // Get reviews written by the logged-in user
  getMyReviews: async () => {
    return api.get('/reviews/my');
  },

  // Get reviews for the logged-in restaurant owner
  getMyRestaurantReviews: async () => {
    return api.get('/reviews/restaurant');
  },

  // Update a specific review
  updateReview: async (reviewId, updateData) => {
    // updateData should contain: { rating, comment }
    return api.put(`/reviews/${reviewId}`, updateData);
  },

  // Delete a specific review
  deleteReview: async (reviewId) => {
    return api.delete(`/reviews/${reviewId}`);
  },

  // Restaurant owner replies to a review
  replyToReview: async (reviewId, data) => {
    return api.put(`/reviews/${reviewId}/reply`, data);
  }
};
// --- END: Review API methods ---

// --- Loyalty API methods ---
export const loyaltyAPI = {
  // Get user's loyalty summary and tier info (scoped to a restaurant if provided)
  getInfo: async (restaurantId) => {
    const config = restaurantId ? { params: { restaurantId } } : {};
    return api.get('/loyalty/info', config);
  },
  // Get user's loyalty transactions with optional pagination/filter
  getTransactions: async (params) => api.get('/loyalty/transactions', { params }),
  // Earn points for an order (usually handled on backend automatically)
  earnPoints: async (data) => api.post('/loyalty/earn', data),
  // Redeem points for a reward or order (use rewardId or specify use case)
  redeemPoints: async (payload) => api.post('/loyalty/redeem', payload),
  // Get available loyalty rewards
  getRewards: async () => api.get('/loyalty/rewards'),
};
// --- End Loyalty API methods ---

// General Public API methods (examples)
export const publicAPI = {
  getFeaturedRestaurants: async () => {
    return api.get('/restaurants/featured');
  },
  getSettings: async () => {
    return api.get('/settings');
  },
  // Add other public endpoints like search, menu items etc. here
};

// Category API methods
export const categoryAPI = {
  // Get all categories
  getCategories: async () => {
    return api.get('/categories');
  }
};

// Export default instance
export default api; 
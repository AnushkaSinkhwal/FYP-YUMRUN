import axios from 'axios';

// Create a custom axios instance with retry functionality
const apiClient = axios.create();

// Add a retry mechanism for network errors
apiClient.interceptors.response.use(null, async (error) => {
  // Only retry on network errors or 5xx server errors
  if (error.code === 'ERR_NETWORK' || (error.response && error.response.status >= 500)) {
    const config = error.config;
    
    // Set max retries to 3
    if (!config || config.retry === undefined) {
      config.retry = 0;
    }
    
    if (config.retry < 3) {
      config.retry += 1;
      console.log(`Retrying request (${config.retry}/3)...`);
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, config.retry) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        // Add a timestamp to the URL to avoid caching issues
        const separator = config.url.includes('?') ? '&' : '?';
        config.url = `${config.url}${separator}_t=${Date.now()}`;
        
        return apiClient(config);
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        return Promise.reject(retryError);
      }
    }
  }
  
  return Promise.reject(error);
});

export const initiateKhaltiPayment = async (orderId, amount, customerDetails, callback) => {
  try {
    // Use the base API URL from environment variables
    const API_URL = import.meta.env.VITE_API_URL;
    console.log('Initiating Khalti payment to:', `${API_URL}/payment/khalti/initiate`);
    
    // Get the auth token from localStorage
    const authToken = localStorage.getItem('authToken');
    console.log('Auth token available:', !!authToken);
    
    if (!authToken) {
      throw new Error('Authentication token not found. Please log in again.');
    }
    
    // Store cart items in session storage for later use
    const cartItems = JSON.parse(sessionStorage.getItem('cartItems') || '[]');
    
    // Ensure amount is greater than or equal to Rs. 10 (Khalti requirement)
    if (amount < 10) {
      throw new Error('Payment amount must be at least Rs. 10');
    }
    
    // Format order data according to Khalti requirements
    const paymentData = {
      orderId,
      amount,
      returnUrl: `${window.location.origin}/payment-verify`,
      items: cartItems,
      customerInfo: {
        name: customerDetails.name,
        email: customerDetails.email,
        phone: customerDetails.phone
      }
    };
    
    console.log('Sending payment data:', paymentData);
    
    // Call backend to initiate payment with retry mechanism
    const response = await apiClient.post(`${API_URL}/payment/khalti/initiate`, paymentData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      timeout: 15000 // 15 seconds timeout
    });

    console.log('Payment initiation response:', response.data);

    if (response.data.success && response.data.paymentUrl) {
      // Save orderId and payment information in session storage for retrieval after payment
      sessionStorage.setItem('pendingOrder', JSON.stringify({
        orderId,
        items: cartItems,
        amount: amount,
        paymentMethod: 'khalti',
        paymentId: response.data.paymentId,
        pidx: response.data.pidx
      }));
      
      // Redirect to Khalti payment page
      window.location.href = response.data.paymentUrl;
      callback({ success: true });
    } else {
      callback({
        success: false, 
        message: response.data.message || 'Payment initiation failed'
      });
    }
  } catch (error) {
    console.error('Khalti payment error:', error);
    
    let errorMessage = 'Payment service unavailable';
    
    // Provide more specific error messages
    if (error.message === 'Authentication token not found. Please log in again.') {
      errorMessage = error.message;
    } else if (error.message === 'Payment amount must be at least Rs. 10') {
      errorMessage = error.message;
    } else if (error.code === 'ERR_NETWORK') {
      errorMessage = 'Network error. Please check your internet connection and try again.';
    } else if (error.response) {
      if (error.response.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid payment request';
      } else if (error.response.status === 503) {
        errorMessage = 'The payment service is temporarily unavailable. Please try again later.';
      } else {
        errorMessage = error.response.data?.message || error.response.data?.error || 
                      `Server error (${error.response.status}): ${error.response.statusText}`;
      }
    }
    
    callback({
      success: false,
      message: errorMessage
    });
  }
};

export const verifyKhaltiPayment = async (payload) => {
  try {
    const API_URL = import.meta.env.VITE_API_URL;
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
      throw new Error('Authentication token not found');
    }
    
    console.log('Verifying Khalti payment with payload:', payload);
    
    // Get any stored payment info from session storage
    let paymentInfo = {};
    const pendingOrderJson = sessionStorage.getItem('pendingOrder');
    if (pendingOrderJson) {
      try {
        const pendingOrder = JSON.parse(pendingOrderJson);
        if (pendingOrder.pidx === payload.pidx) {
          paymentInfo = {
            paymentId: pendingOrder.paymentId,
            orderId: pendingOrder.orderId
          };
        }
      } catch (error) {
        console.error('Error parsing pending order data:', error);
      }
    }
    
    // Merge with provided payload
    const verificationData = {
      ...payload,
      ...paymentInfo
    };
    
    console.log('Sending verification data:', verificationData);
    
    const response = await apiClient.post(`${API_URL}/payment/khalti/verify`, verificationData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      timeout: 15000 // 15 seconds timeout
    });
    
    console.log('Verification response:', response.data);
    
    // If status code is 202, payment is pending
    if (response.status === 202) {
      return {
        success: false,
        status: 'Pending',
        message: response.data.message || 'Payment is being processed'
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('Khalti verification error:', error);
    
    let errorMessage = 'Payment verification failed';
    let status = 'Failed';
    
    if (error.response) {
      console.error('Verification API response error:', {
        status: error.response.status,
        data: error.response.data
      });
      
      if (error.response.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response.status === 404) {
        errorMessage = 'Payment record not found';
      } else {
        errorMessage = error.response.data?.message || errorMessage;
        status = error.response.data?.status || status;
      }
    }
    
    return {
      success: false,
      status: status,
      message: errorMessage
    };
  }
};

export const getPaymentStatus = async (orderId) => {
  try {
    const API_URL = import.meta.env.VITE_API_URL;
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
      throw new Error('Authentication token not found');
    }
    
    const response = await apiClient.get(`${API_URL}/payment/status/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Payment status error:', error);
    return {
      success: false,
      message: 'Failed to retrieve payment status'
    };
  }
}; 
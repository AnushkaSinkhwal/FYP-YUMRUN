import axios from 'axios';

// Khalti payment configuration
const config = {
  publicKey: '601fca00f42e4b6b84a469febc7d846d',
  secretKey: 'cf6b3863ab5f430c9e6ea9419a8ac6d5',
  productIdentity: 'YumRun-Order',
  productName: 'YumRun Food Delivery',
};

export const initiateKhaltiPayment = async (orderId, amount, customerDetails, callback) => {
  try {
    // Amount in paisa (1 NPR = 100 paisa)
    const amountInPaisa = Math.round(amount * 100);
    
    // Prepare payload
    const payload = {
      return_url: `${window.location.origin}/payment/verify`,
      website_url: window.location.origin,
      amount: amountInPaisa,
      purchase_order_id: orderId,
      purchase_order_name: `Order #${orderId}`,
      customer_info: {
        name: customerDetails.fullName,
        email: customerDetails.email,
        phone: customerDetails.phone
      },
      product_details: [
        {
          identity: config.productIdentity,
          name: config.productName,
          total_price: amountInPaisa,
          quantity: 1,
        }
      ]
    };

    // Call backend to initiate payment (the backend will make the actual API call to Khalti)
    const response = await axios.post('/api/payments/khalti/initiate', {
      payload,
      orderId
    });

    if (response.data.success && response.data.paymentUrl) {
      // Redirect to Khalti payment page
      window.location.href = response.data.paymentUrl;
    } else {
      callback({
        success: false, 
        message: response.data.message || 'Payment initiation failed'
      });
    }
  } catch (error) {
    console.error('Khalti payment error:', error);
    callback({
      success: false,
      message: error.response?.data?.message || 'Payment service unavailable'
    });
  }
};

export const verifyKhaltiPayment = async (payload) => {
  try {
    const response = await axios.post('/api/payments/khalti/verify', payload);
    return response.data;
  } catch (error) {
    console.error('Khalti verification error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Payment verification failed'
    };
  }
};

export const getPaymentStatus = async (orderId) => {
  try {
    const response = await axios.get(`/api/payments/status/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Payment status error:', error);
    return {
      success: false,
      message: 'Failed to retrieve payment status'
    };
  }
}; 
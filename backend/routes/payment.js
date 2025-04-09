const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Order } = require('../models/order');
const Payment = require('../models/payment');
const { auth } = require('../middleware/auth');
const { isValidObjectId } = require('mongoose');

// Khalti API configuration
const KHALTI_API = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://khalti.com/api/v2' 
    : 'https://a.khalti.com/api/v2',
  secretKey: process.env.KHALTI_SECRET_KEY
};

// Initiate Khalti payment
router.post('/khalti/initiate', auth, async (req, res) => {
  try {
    const { orderId, returnUrl, amount, customerInfo, items } = req.body;
    
    console.log('Received payment request:', JSON.stringify(req.body, null, 2));
    console.log('Using Khalti API URL:', `${KHALTI_API.baseUrl}/epayment/initiate/`);
    console.log('Khalti secret key available:', !!KHALTI_API.secretKey);
    
    if (!orderId || !returnUrl || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required information' });
    }
    
    // Prepare payment data for Khalti
    const amountInPaisa = Math.round(parseFloat(amount) * 100); // Convert to paisa
    
    // Ensure amount is at least Rs. 10 (1000 paisa) as required by Khalti
    if (amountInPaisa < 1000) {
      return res.status(400).json({
        success: false,
        message: 'Amount should be greater than Rs. 10 (1000 paisa)'
      });
    }

    // Create a unique transaction id using timestamp and random string
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Extract the customer name correctly
    const customerName = customerInfo?.name || customerInfo?.fullName || req.user.name || 'Customer';
    
    console.log('Customer info received:', customerInfo);
    console.log('Using customer name:', customerName);

    const payload = {
      return_url: returnUrl,
      website_url: process.env.WEBSITE_URL || 'https://yumrun.com',
      amount: amountInPaisa,
      purchase_order_id: orderId,
      purchase_order_name: `YumRun Food Order #${orderId}`,
      customer_info: {
        name: customerName,
        email: customerInfo?.email || req.user.email,
        phone: customerInfo?.phone || req.user.phone || ''
      }
    };
    
    // Add product details if items are provided
    if (items && items.length > 0) {
      const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
      
      payload.product_details = [{
        identity: orderId,
        name: `YumRun Food Order (${totalItems} items)`,
        total_price: amountInPaisa,
        quantity: 1,
        unit_price: amountInPaisa
      }];
    }
    
    console.log('Sending payload to Khalti:', JSON.stringify(payload, null, 2));
    
    // Make API call to Khalti to initiate payment
    try {
      const response = await axios.post(
        `${KHALTI_API.baseUrl}/epayment/initiate/`, 
        payload,
        {
          headers: {
            'Authorization': `Key ${KHALTI_API.secretKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // Set a reasonable timeout
        }
      );
      
      console.log('Khalti response:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.payment_url) {
        // Log the user information to debug the userId issue
        console.log('User from request:', req.user);
        
        // Extract userId from JWT token payload, which is where the auth middleware places it
        const userId = req.user.userId; // This is how it's stored in the JWT
        
        if (!userId) {
          console.error('Could not extract valid userId from request:', req.user);
          return res.status(500).json({
            success: false,
            message: 'User identification error',
            error: 'Valid user ID not found in request'
          });
        }
        
        console.log('Using userId:', userId);
        
        // Create a new payment record
        const payment = new Payment({
          userId: userId,
          orderId: orderId.toString(),
          amount: amount,
          paymentMethod: 'KHALTI',
          status: 'INITIATED',
          transactionDetails: {
            khaltiRef: response.data.pidx,
            initiatedAt: new Date(),
            paymentUrl: response.data.payment_url,
            expiresAt: response.data.expires_at
          }
        });
        
        // Debug the payment object before saving
        console.log('Payment object to save:', payment);
        
        await payment.save();
        
        return res.status(200).json({
          success: true,
          paymentUrl: response.data.payment_url,
          paymentId: payment._id,
          pidx: response.data.pidx
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Failed to initiate payment with Khalti'
        });
      }
    } catch (axiosError) {
      console.error('Axios error making Khalti API call:', axiosError.message);
      if (axiosError.response) {
        console.error('Khalti API error response:', {
          status: axiosError.response.status,
          data: axiosError.response.data,
          headers: axiosError.response.headers
        });
        return res.status(500).json({
          success: false,
          message: 'Khalti API error',
          error: axiosError.response.data
        });
      } else if (axiosError.request) {
        console.error('No response received from Khalti API');
        return res.status(500).json({
          success: false,
          message: 'No response from payment gateway',
          error: 'Request made but no response received'
        });
      } else {
        console.error('Error setting up Khalti request:', axiosError.message);
        return res.status(500).json({
          success: false,
          message: 'Error preparing payment request',
          error: axiosError.message
        });
      }
    }
  } catch (error) {
    console.error('Khalti payment initiation error:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('Khalti API response error:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate payment',
      error: error.message
    });
  }
});

// Verify Khalti payment
router.post('/khalti/verify', auth, async (req, res) => {
  try {
    const { pidx } = req.body;
    
    if (!pidx) {
      return res.status(400).json({ success: false, message: 'Missing payment identifier (pidx)' });
    }
    
    // Find the payment by pidx
    const payment = await Payment.findOne({ 'transactionDetails.khaltiRef': pidx });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    // Verify with Khalti using lookup API
    const response = await axios.post(
      `${KHALTI_API.baseUrl}/epayment/lookup/`, 
      { pidx },
      {
        headers: {
          'Authorization': `Key ${KHALTI_API.secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Update payment status based on Khalti response
    if (response.data && response.data.status === 'Completed') {
      payment.status = 'PAID';
      payment.transactionDetails = {
        ...payment.transactionDetails,
        verifiedAt: new Date(),
        khaltiStatus: response.data.status,
        khaltiDetails: response.data,
        transactionId: response.data.transaction_id
      };
      
      await payment.save();
      
      // Update order status - Use toString() to avoid ObjectId comparison issues
      const order = await Order.findOne({ _id: payment.orderId.toString() });
      if (order) {
        order.paymentStatus = 'Paid';
        order.status = 'Confirmed';
        await order.save();
      }
      
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        payment
      });
    } else {
      const status = response.data?.status || 'Failed';
      
      payment.status = status === 'Pending' ? 'PENDING' : 'FAILED';
      payment.transactionDetails = {
        ...payment.transactionDetails,
        verifiedAt: new Date(),
        khaltiStatus: status,
        khaltiDetails: response.data
      };
      
      await payment.save();
      
      const statusCode = status === 'Pending' ? 202 : 400;
      
      return res.status(statusCode).json({
        success: status === 'Pending',
        message: status === 'Pending' ? 'Payment is pending' : 'Payment verification failed',
        status: status
      });
    }
  } catch (error) {
    console.error('Khalti payment verification error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.response?.data?.detail || error.message
    });
  }
});

// Get payment status by order ID
router.get('/status/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Removed ObjectId validation - now accepts string order IDs
    
    // Find the order, using string comparison if needed
    const order = await Order.findOne({ _id: orderId });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Check if user is authorized (owner, admin, or restaurant owner)
    const isOwner = order.user.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isRestaurantOwner = order.restaurant.toString() === req.user.restaurantId?.toString();
    
    if (!isOwner && !isAdmin && !isRestaurantOwner) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this order' });
    }
    
    // Find payment for this order
    const payment = await Payment.findOne({ orderId });
    
    if (!payment) {
      return res.status(200).json({
        success: true,
        paymentInitiated: false,
        message: 'Payment not initiated for this order'
      });
    }
    
    return res.status(200).json({
      success: true,
      paymentInitiated: true,
      payment
    });
  } catch (error) {
    console.error('Payment status error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: error.message
    });
  }
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const axios = require('axios');
const Order = require('../models/order');
const Payment = require('../models/payment');
const { auth } = require('../middleware/auth');
const { isValidObjectId } = require('mongoose');
const paymentController = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Khalti API configuration
const KHALTI_API = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://khalti.com/api/v2' 
    : 'https://dev.khalti.com/api/v2',
  secretKey: process.env.KHALTI_SECRET_KEY
};

// Khalti payment routes
router.post('/khalti/initiate', protect, paymentController.initiateKhaltiPayment);
router.post('/khalti/verify', protect, paymentController.verifyKhaltiPayment);
router.post('/khalti/webhook', paymentController.khaltiWebhook);

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
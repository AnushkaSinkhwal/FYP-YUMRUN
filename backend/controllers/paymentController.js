const axios = require('axios');
const { Order } = require('../models/order');
const Payment = require('../models/payment');
const { isValidObjectId } = require('mongoose');

// Khalti API configuration
const KHALTI_API = {
  baseUrl: 'https://a.khalti.com/api/v2',
  secretKey: process.env.KHALTI_SECRET_KEY
};

// Initiate payment with Khalti
exports.initiateKhaltiPayment = async (req, res) => {
  try {
    const { orderId, returnUrl, amount } = req.body;
    
    if (!orderId || !returnUrl || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required information' });
    }
    
    if (!isValidObjectId(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    // Find the order and verify it belongs to the user
    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    if (order.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Order is not in pending state' });
    }

    // Check if payment already initiated
    const existingPayment = await Payment.findOne({ orderId });
    if (existingPayment && existingPayment.status !== 'FAILED') {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment already initiated for this order',
        paymentId: existingPayment._id
      });
    }
    
    // Prepare payment data for Khalti
    const payload = {
      return_url: returnUrl,
      website_url: process.env.WEBSITE_URL || 'https://yumrun.com',
      amount: amount * 100, // Khalti expects amount in paisa
      purchase_order_id: orderId.toString(),
      purchase_order_name: `YumRun Order #${orderId}`,
      customer_info: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || ''
      }
    };
    
    // Make API call to Khalti to initiate payment
    const response = await axios.post(
      `${KHALTI_API.baseUrl}/epayment/initiate/`, 
      payload,
      {
        headers: {
          'Authorization': `Key ${KHALTI_API.secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data && response.data.payment_url) {
      // Create a new payment record
      const payment = new Payment({
        userId: req.user.id,
        orderId: orderId,
        amount: amount,
        paymentMethod: 'KHALTI',
        status: 'INITIATED',
        transactionDetails: {
          khaltiRef: response.data.pidx,
          initiatedAt: new Date(),
          paymentUrl: response.data.payment_url
        }
      });
      
      await payment.save();
      
      // Update order status
      order.paymentMethod = 'Khalti';
      await order.save();
      
      return res.status(200).json({
        success: true,
        paymentUrl: response.data.payment_url,
        paymentId: payment._id
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Failed to initiate payment with Khalti'
      });
    }
  } catch (error) {
    console.error('Khalti payment initiation error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate payment',
      error: error.response?.data?.detail || error.message
    });
  }
};

// Verify Khalti payment
exports.verifyKhaltiPayment = async (req, res) => {
  try {
    const { paymentId, pidx } = req.body;
    
    if (!paymentId || !pidx) {
      return res.status(400).json({ success: false, message: 'Missing payment ID or pidx' });
    }
    
    if (!isValidObjectId(paymentId)) {
      return res.status(400).json({ success: false, message: 'Invalid payment ID' });
    }
    
    // Find the payment
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    if (payment.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    // Check if payment is already verified
    if (payment.status === 'PAID') {
      return res.status(200).json({ 
        success: true, 
        message: 'Payment already verified',
        payment
      });
    }
    
    // Verify with Khalti
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
        khaltiDetails: response.data
      };
      
      await payment.save();
      
      // Update order status
      const order = await Order.findById(payment.orderId);
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
      payment.status = 'FAILED';
      payment.transactionDetails = {
        ...payment.transactionDetails,
        verifiedAt: new Date(),
        khaltiStatus: response.data?.status || 'Failed',
        khaltiDetails: response.data
      };
      
      await payment.save();
      
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        status: response.data?.status
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
};

// Get payment status by order ID
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!isValidObjectId(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }
    
    // Find the order
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
}; 
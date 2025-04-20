const axios = require('axios');
const Order = require('../models/order');
const Payment = require('../models/payment');
const { isValidObjectId } = require('mongoose');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// Khalti API configuration
const KHALTI_API = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://khalti.com/api/v2' 
    : 'https://dev.khalti.com/api/v2',
  secretKey: process.env.KHALTI_SECRET_KEY
};

/**
 * Initiate Khalti payment
 * @route POST /api/payment/khalti/initiate
 * @access Private
 */
exports.initiateKhaltiPayment = asyncHandler(async (req, res) => {
  const { amount, orderId, returnUrl } = req.body;
  const userId = req.user._id;
  
  console.log('Payment initiation request received:', { amount, orderId, returnUrl });
  console.log('Models available:', { Order: !!Order, Payment: !!Payment });
  
  if (!amount || !orderId) {
    throw new ErrorResponse('Amount and order ID are required', 400);
  }
  
  try {
    // Find the order - handle both MongoDB ObjectIds and string order numbers
    console.log('Looking up order with ID:', orderId);
    
    let order;
    if (isValidObjectId(orderId)) {
      order = await Order.findById(orderId);
    } else {
      // Try to find by orderNumber if it's not a valid ObjectId
      order = await Order.findOne({ orderNumber: orderId });
    }
    
    console.log('Order found:', !!order);
    
    if (!order) {
      throw new ErrorResponse(`Order not found with id: ${orderId}`, 404);
    }
    
    // Validate that the order belongs to the user
    console.log('Validating order belongs to user', { 
      orderUserId: order.userId.toString(), 
      requestUserId: userId.toString()
    });
    
    if (order.userId.toString() !== userId.toString()) {
      throw new ErrorResponse('Unauthorized - order does not belong to user', 403);
    }
    
    // Prepare data for Khalti API
    const khaltiData = {
      return_url: returnUrl || `${process.env.FRONTEND_URL}/payment/verify`,
      website_url: process.env.FRONTEND_URL,
      amount: Math.round(amount * 100), // Convert to paisa (Khalti uses smallest currency unit)
      purchase_order_id: orderId,
      purchase_order_name: `Order #${orderId}`,
      customer_info: {
        name: req.user.fullName,
        email: req.user.email,
        phone: req.user.phone
      }
    };
    
    console.log('Khalti payment data:', khaltiData);
    
    // Call Khalti API to initialize payment
    const khaltiResponse = await axios.post(
      `${KHALTI_API.baseUrl}/epayment/initiate/`,
      khaltiData,
      {
        headers: {
          'Authorization': `Key ${KHALTI_API.secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Khalti API response:', khaltiResponse.data);
    
    // Update order with payment information
    order.paymentDetails = {
      provider: 'khalti',
      status: 'initiated',
      sessionId: khaltiResponse.data.pidx,
      initiatedAt: Date.now()
    };
    await order.save();
    
    res.status(200).json({
      success: true,
      data: {
        paymentUrl: khaltiResponse.data.payment_url,
        pidx: khaltiResponse.data.pidx
      }
    });
  } catch (error) {
    console.error('Khalti API Error:', error);
    if (error.response) {
      console.error('API Response Error:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    throw new ErrorResponse('Failed to initiate Khalti payment: ' + (error.message || 'Unknown error'), 500);
  }
});

/**
 * Verify Khalti payment
 * @route POST /api/payment/khalti/verify
 * @access Private
 */
exports.verifyKhaltiPayment = asyncHandler(async (req, res) => {
  const { pidx, orderId } = req.body;
  
  console.log('Payment verification request received:', { pidx, orderId });
  
  if (!pidx || !orderId) {
    throw new ErrorResponse('Payment ID and order ID are required', 400);
  }
  
  try {
    // Find the order - handle both MongoDB ObjectIds and string order numbers
    console.log('Looking up order with ID:', orderId);
    
    let order;
    if (isValidObjectId(orderId)) {
      order = await Order.findById(orderId);
    } else {
      // Try to find by orderNumber if it's not a valid ObjectId
      order = await Order.findOne({ orderNumber: orderId });
    }
    
    console.log('Order found:', !!order);
    
    if (!order) {
      throw new ErrorResponse(`Order not found with id: ${orderId}`, 404);
    }
    
    // Check if this payment has already been verified
    if (order.paymentDetails?.status === 'completed') {
      return res.status(200).json({
        success: true,
        data: {
          message: 'Payment already verified',
          order
        }
      });
    }
    
    console.log('Verifying Khalti payment with pidx:', pidx);
    
    // Verify payment with Khalti
    const khaltiResponse = await axios.post(
      `${KHALTI_API.baseUrl}/epayment/lookup/`,
      { pidx },
      {
        headers: {
          'Authorization': `Key ${KHALTI_API.secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Khalti verification response:', khaltiResponse.data);
    
    const khaltiStatus = khaltiResponse.data.status;
    const transactionId = khaltiResponse.data.transaction_id || null;

    // Map Khalti status to our internal payment detail status
    let internalPaymentStatus;
    switch (khaltiStatus) {
      case 'Completed':
        internalPaymentStatus = 'completed';
        break;
      case 'Pending':
        internalPaymentStatus = 'pending';
        break;
      case 'Expired':
      case 'User canceled':
        internalPaymentStatus = 'failed'; // Treat expired/cancelled as failed
        break;
      case 'Refunded':
        internalPaymentStatus = 'refunded';
        break;
      default:
        internalPaymentStatus = 'failed'; // Default to failed for unknown statuses
        console.warn('Unknown Khalti verification status:', khaltiStatus);
    }

    // Update order with payment status
    order.paymentDetails = {
      ...order.paymentDetails,
      status: internalPaymentStatus,
      transaction_id: transactionId,
      verifiedAt: Date.now()
    };

    // If payment is successful, update order status and payment flags
    if (khaltiStatus === 'Completed') {
      order.status = 'CONFIRMED';
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentStatus = 'PAID';

      // Add a status update
      order.statusUpdates.push({
        status: 'CONFIRMED',
        timestamp: Date.now(),
        updatedBy: req.user._id // Assuming req.user is populated by auth middleware
      });
    } else if (khaltiStatus === 'Expired' || khaltiStatus === 'User canceled' || khaltiStatus === 'Refunded') {
       // Optionally, update main order status if payment permanently failed/refunded
       // order.status = 'CANCELLED'; // Or keep as 'PENDING' but mark payment as failed
       order.paymentStatus = khaltiStatus === 'Refunded' ? 'REFUNDED' : 'FAILED';
       order.isPaid = false; // Ensure isPaid is false
    } else if (khaltiStatus === 'Pending') {
        // Keep main order status as PENDING and paymentStatus as PENDING
        order.paymentStatus = 'PENDING';
        order.isPaid = false;
    }
    // For other statuses, paymentStatus remains PENDING or as previously set

    await order.save();

    // Award loyalty points only if payment is successfully completed
    if (khaltiStatus === 'Completed') {
      try {
        const loyaltyController = require('./loyaltyController');
        await loyaltyController.addOrderPoints({
          body: {
            orderId: order._id,
            orderTotal: order.totalPrice
          },
          user: { _id: order.userId }
        }, {
          status: () => ({ json: () => {} })
        });
      } catch (error) {
        console.error('Error awarding loyalty points:', error);
        // Don't throw error here - payment is still successful
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        status: khaltiStatus, // Return the actual Khalti status
        order
      }
    });
  } catch (error) {
    console.error('Khalti Verification Error:', error.response?.data || error.message);
    throw new ErrorResponse('Failed to verify Khalti payment', 500);
  }
});

/**
 * Handle Khalti payment webhook
 * @route POST /api/payment/khalti/webhook
 * @access Public
 */
exports.khaltiWebhook = asyncHandler(async (req, res) => {
  const { event, data } = req.body;

  console.log('Khalti webhook received:', { event, data });

  // TODO: Implement webhook signature validation for security
  // const signature = req.headers['x-khalti-signature']; // Example header, check Khalti docs
  // if (!isValidSignature(signature, req.rawBody)) { // Assuming rawBody middleware is used
  //   console.error('Invalid Khalti webhook signature');
  //   return res.status(401).json({ success: false, message: 'Invalid signature' });
  // }

  // For now, just log the event. Primary verification happens via /verify endpoint.
  console.log(`Received Khalti event: ${event || 'UNKNOWN'}`);
  if (data) {
    console.log('Webhook data:', data);
  }

  // Acknowledge receipt of webhook immediately
  res.status(200).json({ received: true });
});

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
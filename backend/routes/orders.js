const express = require('express');
const router = express.Router();
const { auth, isRestaurantOwner } = require('../middleware/auth');
const { protect } = require('../middleware/authMiddleware');
const Order = require('../models/order');
const Restaurant = require('../models/restaurant');
const User = require('../models/user');
const { 
  createOrderNotification, 
  createRestaurantOrderNotification 
} = require('../utils/notifications');
const { sendEmail, emailTemplates } = require('../utils/emailService');
const mongoose = require('mongoose');
const MenuItem = require('../models/menuItem');

// GET all orders
router.get('/', auth, async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET current user's orders
router.get('/user', protect, async (req, res) => {
    try {
        // Fix: use the correct user ID property - ensure we can access the user ID in any format
        const userId = req.user._id || req.user.userId || req.user.id;
        console.log(`[Orders API] Fetching orders for user: ${userId}`);
        
        // Check if we have a valid user ID
        if (!userId) {
            console.error('[Orders API] Missing user ID in request');
            return res.status(400).json({
                success: false,
                message: 'User ID is missing'
            });
        }
        
        console.log(`[Orders API] Querying database for orders with userId: ${userId}`);
        const orders = await Order.find({ userId })
            .populate('restaurantId', 'restaurantDetails.name restaurantDetails.address')
            .sort({ createdAt: -1 });
        
        console.log(`[Orders API] Found ${orders.length} orders for user ${userId}`);
        
        // Return only real orders from database
        return res.status(200).json({ 
            success: true, 
            data: orders 
        });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error loading your orders. Please try again later.' 
        });
    }
});

// GET restaurant orders for the logged-in owner (Fixed route placement)
router.get('/restaurant', auth, isRestaurantOwner, async (req, res) => {
    try {
        // Get user ID from auth middleware (this is the owner's user ID)
        const ownerUserId = req.user.userId;
        
        console.log(`[Orders API] Finding orders for restaurant owner with User ID: ${ownerUserId}`);
        
        if (!ownerUserId) {
            return res.status(400).json({
                success: false,
                message: 'Owner User ID is missing from token'
            });
        }
        
        // Find the User document for the owner
        const ownerUser = await User.findById(ownerUserId);
        if (!ownerUser) {
            console.log(`[Orders API] Owner user document not found for ID: ${ownerUserId}`);
            // Allow proceeding, maybe a Restaurant doc exists separately
        } else {
             console.log(`[Orders API] Found owner user document:`, {
                 id: ownerUser._id,
                 email: ownerUser.email,
                 role: ownerUser.role,
                 hasRestaurantDetails: !!ownerUser.restaurantDetails
             });
        }

        // Initialize possible IDs with the owner's User ID (as a string)
        const possibleRestaurantIds = [ownerUserId.toString()];
        
        // Although restaurantDetailsSchema doesn't have _id, log if it exists for debugging
        if (ownerUser && ownerUser.restaurantDetails) {
            console.log(`[Orders API] Owner user has restaurantDetails object.`);
            // If in the future restaurantDetails gets an _id, it would be added here.
            // if (ownerUser.restaurantDetails._id) {
            //     possibleRestaurantIds.push(ownerUser.restaurantDetails._id.toString());
            //     console.log(`[Orders API] Added restaurantDetails._id: ${ownerUser.restaurantDetails._id}`);
            // }
        }
        
        // Attempt to find a separate Restaurant document linked to the owner's User ID
        const ownedRestaurant = await Restaurant.findOne({ owner: ownerUserId });
        if (ownedRestaurant) {
            console.log(`[Orders API] Found linked Restaurant document with ID: ${ownedRestaurant._id}`);
            possibleRestaurantIds.push(ownedRestaurant._id.toString());
        } else {
            console.log(`[Orders API] No separate Restaurant document found linked to owner User ID: ${ownerUserId}`);
        }
        
        // Ensure IDs are unique strings
        const uniqueStringIds = [...new Set(possibleRestaurantIds)];
        
        console.log(`[Orders API] Final unique string IDs to search for orders:`, uniqueStringIds);
        
        // Find orders where restaurantId matches any of the collected IDs
        const orders = await Order.find({
            restaurantId: { $in: uniqueStringIds }
        })
            .sort({ createdAt: -1 })
            .populate('userId', 'firstName lastName fullName email phone') // Populate customer details
            .populate({ // Populate the user who updated the status in the history
                path: 'statusUpdates.updatedBy',
                select: 'name' // Select only the name field
            })
            .lean(); // Use lean for performance
        
        console.log(`[Orders API] Found ${orders.length} orders matching IDs: ${uniqueStringIds.join(', ')}`);
        
        // Return the found orders
        return res.status(200).json({
            success: true,
            data: orders
        });
        
    } catch (error) {
        console.error('[Orders API] Error fetching restaurant orders:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error while fetching restaurant orders. Please try again later.' 
        });
    }
});

// GET user orders by user ID (putting specific routes before param routes)
router.get('/user/:userId', auth, async (req, res) => {
    try {
        // Ensure user can only see their own orders
        if (req.user._id.toString() !== req.params.userId && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to view these orders' 
            });
        }
        
        const orders = await Order.find({ userId: req.params.userId })
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error(`Error fetching orders for user ${req.params.userId}:`, error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// NEW ROUTE: Safe route to get order details without authorization issues
router.get('/safe/details/:orderId', auth, async (req, res) => {
    console.log('SAFE ROUTE ACCESSED');
    try {
        const orderId = req.params.orderId;
        console.log(`SAFE ROUTE - Fetching order: ${orderId}`);
        
        const order = await Order.findById(orderId).lean();
        
        if (!order) {
            console.log('SAFE ROUTE - Order not found');
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        console.log('SAFE ROUTE - Order found, returning data');
        
        // Return a minimal, safe version of the order data
        return res.status(200).json({
            success: true,
            data: {
                _id: order._id,
                orderNumber: order.orderNumber || 'Unknown',
                status: order.status || 'Unknown',
                createdAt: order.createdAt,
                items: order.items || [],
                totalPrice: order.totalPrice || 0,
                deliveryFee: order.deliveryFee || 0,
                tax: order.tax || 0,
                grandTotal: order.grandTotal || 0,
                paymentMethod: order.paymentMethod || 'Unknown',
                paymentStatus: order.paymentStatus || 'Unknown',
                deliveryAddress: order.deliveryAddress || 'Unknown',
                specialInstructions: order.specialInstructions || ''
            }
        });
    } catch (error) {
        console.error('SAFE ROUTE ERROR:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET order by ID (moved to be AFTER the more specific routes)
router.get('/:id', auth, async (req, res) => {
    try {
        console.log(`ATTEMPTING TO FETCH ORDER: ${req.params.id}`);
        console.log(`USER AUTH INFO:`, req.user);
        
        // Ensure req.user and req.user.userId are available from the auth middleware
        if (!req.user || !req.user.userId) {
            console.error('Authorization Error: User information missing from request.');
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }
        
        const order = await Order.findById(req.params.id)
            .populate('userId', 'firstName lastName fullName email phone address')
            .populate('restaurantId', 'name owner') // Populate owner field for auth check
            .populate('deliveryPersonId', '_id') // Populate only the ID for auth check
            .populate({
              path: 'statusUpdates.updatedBy',
              select: 'name'
            });
            
        if (!order) {
            console.log(`ORDER NOT FOUND: ${req.params.id}`);
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        console.log(`ORDER FOUND: ${order._id}`);
        console.log(`ORDER USER ID:`, order.userId);
        console.log(`ORDER RESTAURANT ID:`, order.restaurantId);
        
        // TEMPORARILY BYPASS ALL AUTHORIZATION CHECKS
        // We'll just allow access to the order for testing purposes
        
        // Create formatted order without any risky .toString() calls
        const formattedOrder = {
            _id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            items: order.items,
            totalPrice: order.totalPrice,
            deliveryFee: order.deliveryFee,
            tax: order.tax,
            grandTotal: order.grandTotal,
            deliveryAddress: order.deliveryAddress,
            specialInstructions: order.specialInstructions,
            createdAt: order.createdAt,
            statusUpdates: order.statusUpdates || [],
            // Safely build restaurant info
            restaurant: null,
            // Safely build customer info
            customer: null
        };
        
        // Populate restaurant info if available
        if (order.restaurantId) {
           formattedOrder.restaurant = {
              id: order.restaurantId._id,
              name: order.restaurantId.name || order.restaurantId.restaurantDetails?.name || 'Unknown Restaurant'
              // Add other needed restaurant fields safely
           };
        }
        
        // Populate customer info if available
        if (order.userId) {
           formattedOrder.customer = {
              id: order.userId._id,
              name: order.userId.fullName || `${order.userId.firstName || ''} ${order.userId.lastName || ''}`.trim() || 'Unknown User',
              email: order.userId.email,
              phone: order.userId.phone
              // Add other needed user fields safely
           };
        }
        
        // --- Authorization Check --- 
        let authorized = false;
        const requestingUserId = req.user.userId.toString(); // Ensure it's a string for comparison

        // 1. Is the user an Admin?
        if (req.user.role === 'admin') {
            authorized = true;
            console.log('Access granted: Admin user.');
        }

        // 2. Is the user the customer who placed the order?
        if (!authorized && order.userId && order.userId._id.toString() === requestingUserId) {
            authorized = true;
            console.log('Access granted: User is the customer.');
        }

        // 3. Is the user the restaurant owner for this order?
        if (!authorized && req.user.role === 'restaurant' && order.restaurantId && order.restaurantId.owner) {
            // Check if the requesting user ID matches the owner ID populated from the restaurant
            if (order.restaurantId.owner.toString() === requestingUserId) {
               authorized = true;
               console.log('Access granted: User owns the restaurant.');
            }
        }

        // 4. Is the user the assigned delivery rider for this order?
        if (!authorized && req.user.role === 'delivery_rider' && order.deliveryPersonId) {
            if (order.deliveryPersonId._id.toString() === requestingUserId) {
                authorized = true;
                console.log('Access granted: User is the assigned delivery rider.');
            }
        }

        // If not authorized by any rule, deny access
        if (!authorized) {
            console.log('Authorization failed for user:', requestingUserId, 'role:', req.user.role);
            return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
        }
        // --- End Authorization Check ---
        
        console.log('Authorization check passed. Returning order.');
        return res.status(200).json({ success: true, data: formattedOrder });
    } catch (error) {
        console.error(`CRITICAL ERROR in GET /:id route:`, error);
        // Handle CastError for invalid ID format
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid order ID format' });
        }
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST create new order
router.post('/', auth, async (req, res) => {
    try {
        console.log('[Orders API] Creating new order, request body:', req.body);
        
        // Extract order data from request body
        const { 
            items: orderItems,
            restaurantId: providedRestaurantId,
            deliveryAddress: orderDeliveryAddress,
            paymentMethod: orderPaymentMethod,
            specialInstructions,
            totalPrice,
            deliveryFee,
            tax,
            orderNumber,
            grandTotal
        } = req.body;
        
        // Validate required fields
        if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order must include at least one item'
            });
        }

        if (!providedRestaurantId) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant ID is required'
            });
        }

        if (!orderDeliveryAddress) {
            return res.status(400).json({
                success: false,
                message: 'Delivery address is required'
            });
        }

        if (!orderPaymentMethod) {
            return res.status(400).json({
                success: false, 
                message: 'Payment method is required'
            });
        }
        
        // Get the user ID from authentication middleware
        const userId = req.user ? req.user.userId : null;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }
        
        // Ensure this is a valid restaurant ID (either a direct ID or a user ID for restaurant owner)
        let orderRestaurantId = providedRestaurantId;
        let isValidRestaurant = false;
        
        try {
            // First, try to find the restaurant directly
            const Restaurant = mongoose.model('Restaurant', mongoose.Schema({}), 'restaurants');
            let restaurant = await Restaurant.findById(providedRestaurantId);
            
            if (restaurant) {
                console.log(`[Orders API] Found restaurant directly with ID: ${providedRestaurantId}`);
                orderRestaurantId = restaurant._id.toString();
                isValidRestaurant = true;
            } else {
                // If not found directly, check if this is a user ID for a restaurant owner
                const user = await User.findById(providedRestaurantId);
                
                if (user && user.role === 'restaurant') {
                    console.log(`[Orders API] Found restaurant owner with ID: ${providedRestaurantId}`);
                    
                    // Check if user has restaurantDetails
                    if (user.restaurantDetails && user.restaurantDetails._id) {
                        orderRestaurantId = user.restaurantDetails._id.toString();
                        console.log(`[Orders API] Using restaurant ID from user.restaurantDetails: ${orderRestaurantId}`);
                        isValidRestaurant = true;
                    } else {
                        // Check if this user owns a restaurant in the Restaurant collection
                        const ownedRestaurant = await Restaurant.findOne({ owner: providedRestaurantId });
                        
                        if (ownedRestaurant) {
                            orderRestaurantId = ownedRestaurant._id.toString();
                            console.log(`[Orders API] Using restaurant ID from owner lookup: ${orderRestaurantId}`);
                            isValidRestaurant = true;
                        } else {
                            // Last resort: use the user ID itself as the restaurant ID
                            orderRestaurantId = providedRestaurantId;
                            console.log(`[Orders API] Using user ID as restaurant ID: ${orderRestaurantId}`);
                            isValidRestaurant = true;
                        }
                    }
                }
            }
        } catch (err) {
            console.error('[Orders API] Error validating restaurant:', err);
            // Continue with the provided ID as a fallback
            isValidRestaurant = true;
        }
        
        if (!isValidRestaurant) {
            return res.status(400).json({
                success: false,
                message: 'Invalid restaurant ID'
            });
        }

        // Generate the order number if not provided
        const generatedOrderNumber = orderNumber || `ORD-${Date.now()}-${Math.floor(Math.random() * 100)}`;
        
        // Process the order items - ensure proper productId is set
        const processedItems = orderItems.map(item => {
            // Make sure to keep the original productId separate from restaurantId
            // If the item doesn't have a proper productId, generate a new ObjectId
            const itemProductId = item.productId || new mongoose.Types.ObjectId();
            
            return {
                ...item,
                productId: itemProductId
            };
        });
        
        // Create the new order
        const newOrder = new Order({
            orderNumber: generatedOrderNumber,
            userId,
            restaurantId: orderRestaurantId, // Use the validated restaurant ID
            items: processedItems,
            totalPrice: parseFloat(totalPrice || 0),
            deliveryFee: parseFloat(deliveryFee || 0),
            tax: parseFloat(tax || 0),
            grandTotal: parseFloat(grandTotal || 0),
            status: 'PENDING',
            paymentMethod: orderPaymentMethod,
            paymentStatus: 'PENDING',
            deliveryAddress: orderDeliveryAddress,
            specialInstructions: specialInstructions || '',
            statusUpdates: [
                {
                    status: 'PENDING',
                    timestamp: new Date(),
                    updatedBy: userId
                }
            ]
        });
        
        console.log('[Orders API] Saving new order:', {
            orderNumber: newOrder.orderNumber,
            userId: newOrder.userId,
            restaurantId: newOrder.restaurantId,
            itemsCount: newOrder.items.length
        });
        
        // Save the order
        await newOrder.save();
        
        // Fetch the user details to include in the email
        const customer = await User.findById(userId);

        // Send notifications and email
        try {
            // Create promises for notifications and email
            const notificationPromises = [
                createRestaurantOrderNotification(
                    orderRestaurantId, 
                    `New Order #${newOrder.orderNumber}`,
                    `A new order has been placed for ${newOrder.grandTotal} with ${newOrder.items.length} items.`
                ),
                createOrderNotification(
                    userId,
                    `Order #${newOrder.orderNumber} Placed`,
                    `Your order has been placed and is waiting for restaurant confirmation.`
                )
            ];

            // Add email promise if customer exists and has an email
            if (customer && customer.email) {
                notificationPromises.push(
                    sendEmail({
                        to: customer.email,
                        subject: `YumRun Order Confirmation #${newOrder.orderNumber}`,
                        // Pass both order and customer objects to the template
                        html: emailTemplates.orderConfirmationEmail(newOrder, customer) 
                    })
                );
            } else {
                console.log(`[Orders API] Customer not found or no email for user ID: ${userId}. Skipping confirmation email.`);
            }

            // Execute all promises concurrently
            await Promise.all(notificationPromises).catch(err => {
                console.error('[Orders API] Error in post-order operations (notifications/email):', err);
                // Don't fail the request if these secondary operations fail
            });
            
        } catch (postOrderError) {
            console.error('[Orders API] General error during post-order operations:', postOrderError);
            // Continue with response even if notifications/email fail
        }
        
        // Return success response with the created order
        return res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: newOrder
        });
    } catch (error) {
        console.error('[Orders API] Error creating order:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while creating your order. Please try again.'
        });
    }
});

// PUT update order
router.put('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        // Only allow updates to certain fields
        const allowedUpdates = ['deliveryAddress', 'specialInstructions'];
        const updates = {};
        
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });
        
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No valid fields to update' 
            });
        }
        
        // Only allow updates if order is still pending
        if (order.status !== 'PENDING') {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot update order that is not in pending status' 
            });
        }
        
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true }
        );
        
        res.status(200).json({ 
            success: true, 
            message: 'Order updated successfully', 
            order: updatedOrder 
        });
    } catch (error) {
        console.error(`Error updating order ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST update order status (Restaurant Owner only)
router.post('/:id/status', auth, isRestaurantOwner, async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;
        const ownerUserId = req.user.userId;

        // Get restaurantId from middleware
        if (!req.user.restaurantId) {
            console.error('Middleware did not attach restaurantId to user object for owner:', ownerUserId);
            return res.status(403).json({ 
                success: false, 
                message: 'Could not verify restaurant ownership.' 
            });
        }
        const ownerRestaurantId = req.user.restaurantId;

        if (!status) {
            return res.status(400).json({ success: false, message: 'Please provide a status' });
        }
        
        const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Verify the order belongs to the restaurant owner
        if (order.restaurantId.toString() !== ownerRestaurantId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
        }

        // Update status
        order.status = status;
        order.statusUpdates.push({
            status,
            timestamp: new Date(),
            updatedBy: ownerUserId // Log which user performed the update
        });
        
        await order.save();
        
        // Send status update email to the customer
        const customer = await User.findById(order.userId);
        if (customer) {
            const emailOptions = {
                order: order, 
                status: status.toLowerCase(), // Use lowercase status for template key
                name: customer.fullName
            };
            sendEmail({
                to: customer.email,
                subject: `YumRun Order Update: ${order.orderNumber} is now ${status}`,
                html: emailTemplates.orderStatusUpdateEmail(emailOptions)
            }).catch(err => console.error('Failed to send order status update email:', err));
        } else {
            console.error('Could not find customer to send status update email for order:', order._id);
        }
        
        // Populate user details in the response
        const updatedOrder = await Order.findById(order._id)
            .populate('userId', 'fullName email phone');

        res.status(200).json({ 
            success: true, 
            message: 'Order status updated successfully', 
            data: updatedOrder 
        });
    } catch (error) {
        console.error(`Error updating status for order ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE order (Optional - maybe only admin?)
// Add DELETE route if needed, with appropriate authorization

// Get all orders (admin only)
router.get('/admin', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const orders = await Order.find()
            .populate('userId', 'firstName lastName email phone')
            .populate('restaurantId', 'name logo')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get orders by restaurant ID (for restaurant owners)
router.get('/restaurant/:restaurantId', auth, async (req, res) => {
    try {
        const { restaurantId } = req.params;
        
        // Check if the user is the owner of this restaurant
        const user = await User.findById(req.user.id);
        const isOwner = user.role === 'restaurant' && 
                       user.restaurantDetails && 
                       user.restaurantDetails._id.toString() === restaurantId;
        
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not own this restaurant.'
            });
        }

        const orders = await Order.find({ restaurantId })
            .populate('userId', 'firstName lastName email phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error(`Error fetching orders for restaurant ${req.params.restaurantId}:`, error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get user orders
router.get('/user', auth, async (req, res) => {
    try {
        // Fix: use correct user ID property (req.user._id or req.user.userId)
        const userId = req.user._id || req.user.userId || req.user.id;
        
        console.log(`[Orders API] Finding orders for user ID: ${userId}`);
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is missing from authentication data'
            });
        }
        
        const orders = await Order.find({ userId })
            .populate('restaurantId', 'name logo restaurantDetails.name')
            .sort({ createdAt: -1 });

        console.log(`[Orders API] Found ${orders.length} orders for user`);
        
        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error(`Error fetching orders for user:`, error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get a specific order
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('userId', 'firstName lastName email phone')
            .populate('restaurantId', 'name logo')
            .populate('deliveryRiderId', 'firstName lastName phone');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Only allow the user who placed the order, the restaurant owner, or admin to view
        const isOwner = req.user.role === 'restaurant' && 
                       req.user.restaurantDetails && 
                       req.user.restaurantDetails._id.toString() === order.restaurantId._id.toString();
        
        if (order.userId._id.toString() !== req.user.id && 
            !isOwner && 
            req.user.role !== 'admin' &&
            req.user.role !== 'delivery_rider') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error(`Error fetching order ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Create a new order
router.post('/', auth, async (req, res) => {
    try {
        const { items, restaurantId, deliveryAddress, orderNote, paymentMethod, totalPrice } = req.body;
        
        // Validate required fields
        if (!items || !items.length || !restaurantId || !deliveryAddress || !totalPrice) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: items, restaurantId, deliveryAddress, and totalPrice'
            });
        }

        // Verify that the restaurant exists
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        // Validate menu items and calculate total
        let calculatedTotal = 0;
        const validatedItems = [];

        for (const item of items) {
            const menuItem = await MenuItem.findById(item.menuItemId);
            if (!menuItem) {
                return res.status(404).json({
                    success: false,
                    message: `Menu item not found: ${item.menuItemId}`
                });
            }

            if (menuItem.restaurantId.toString() !== restaurantId) {
                return res.status(400).json({
                    success: false,
                    message: `Menu item ${menuItem.name} does not belong to the selected restaurant`
                });
            }

            const itemTotal = menuItem.price * item.quantity;
            calculatedTotal += itemTotal;

            validatedItems.push({
                menuItemId: menuItem._id,
                name: menuItem.name,
                price: menuItem.price,
                quantity: item.quantity,
                totalPrice: itemTotal,
                specialInstructions: item.specialInstructions || ''
            });
        }

        // Add delivery fee if applicable
        if (restaurant.deliveryFee) {
            calculatedTotal += restaurant.deliveryFee;
        }

        // Ensure the total price matches the calculated total (allowing for small rounding differences)
        if (Math.abs(calculatedTotal - totalPrice) > 1) {
            return res.status(400).json({
                success: false,
                message: `Total price mismatch. Calculated: ${calculatedTotal}, Received: ${totalPrice}`
            });
        }

        // Generate order number (date-based)
        const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;

        // Create the order
        const order = new Order({
            orderNumber,
            userId: req.user.id,
            items: validatedItems,
            restaurantId,
            deliveryAddress,
            orderNote,
            paymentMethod: paymentMethod || 'CASH_ON_DELIVERY',
            totalPrice: calculatedTotal,
            status: 'PENDING'
        });

        await order.save();

        // Add order to user's order history (if needed)
        // This part depends on your user model structure
        
        res.status(201).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Update order status (restaurant or admin)
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
        
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user has permission to update this order
        const isRestaurantOwner = req.user.role === 'restaurant' && 
                              req.user.restaurantDetails && 
                              req.user.restaurantDetails._id.toString() === order.restaurantId.toString();
        
        if (!isRestaurantOwner && req.user.role !== 'admin' && req.user.role !== 'delivery_rider') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to update this order.'
            });
        }

        // Specific status restrictions
        if (status === 'DELIVERED' && req.user.role !== 'delivery_rider' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only delivery riders can mark orders as delivered'
            });
        }

        // Update the order status
        order.status = status;
        
        // Add status history
        order.statusHistory.push({
            status,
            timestamp: new Date(),
            updatedBy: req.user.id
        });

        // If order is delivered, update delivery time
        if (status === 'DELIVERED') {
            order.deliveredAt = new Date();
        }

        await order.save();

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error(`Error updating order status for ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Assign delivery rider to order
router.patch('/:id/assign-rider', auth, async (req, res) => {
    try {
        const { riderId } = req.body;
        
        if (!riderId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a rider ID'
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user has permission to assign riders
        const isRestaurantOwner = req.user.role === 'restaurant' && 
                              req.user.restaurantDetails && 
                              req.user.restaurantDetails._id.toString() === order.restaurantId.toString();
        
        if (!isRestaurantOwner && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only restaurant owners or admins can assign riders.'
            });
        }

        // Verify the rider exists and is active
        const rider = await User.findById(riderId);
        if (!rider || rider.role !== 'delivery_rider') {
            return res.status(404).json({
                success: false,
                message: 'Delivery rider not found'
            });
        }

        // Update the order
        order.deliveryRiderId = riderId;
        order.status = 'OUT_FOR_DELIVERY';
        
        // Add status history
        order.statusHistory.push({
            status: 'OUT_FOR_DELIVERY',
            timestamp: new Date(),
            updatedBy: req.user.id
        });

        await order.save();

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error(`Error assigning rider to order ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Cancel order (user can cancel their own order)
router.patch('/:id/cancel', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if the order can be cancelled
        const cancelableStatuses = ['PENDING', 'CONFIRMED'];
        if (!cancelableStatuses.includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel order in ${order.status} status. Only orders in ${cancelableStatuses.join(', ')} status can be cancelled.`
            });
        }

        // Check if user has permission to cancel this order
        const isUser = order.userId.toString() === req.user.id;
        const isRestaurantOwner = req.user.role === 'restaurant' && 
                              req.user.restaurantDetails && 
                              req.user.restaurantDetails._id.toString() === order.restaurantId.toString();
        
        if (!isUser && !isRestaurantOwner && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to cancel this order.'
            });
        }

        // Update the order status
        order.status = 'CANCELLED';
        
        // Add status history
        order.statusHistory.push({
            status: 'CANCELLED',
            timestamp: new Date(),
            updatedBy: req.user.id
        });

        // Add cancellation reason if provided
        if (req.body.cancellationReason) {
            order.cancellationReason = req.body.cancellationReason;
        }

        await order.save();

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error(`Error cancelling order ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router; 
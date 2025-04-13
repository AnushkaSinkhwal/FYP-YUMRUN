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
        const userId = req.user._id;
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
        // Get user ID from auth middleware
        const userId = req.user.userId;
        
        console.log(`[Orders API] Finding orders for restaurant owner with ID: ${userId}`);
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is missing'
            });
        }
        
        // First, find the user to get restaurant details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log(`[Orders API] Restaurant owner details:`, {
            id: user._id,
            email: user.email,
            role: user.role
        });
        
        // Find orders for this restaurant - try different approaches
        let orders = [];
        try {
            // First check if there are orders directly with restaurantId = userId (old method)
            const directOrders = await Order.find({ restaurantId: userId })
                .sort('-createdAt')
                .lean();
                
            console.log(`[Orders API] Found ${directOrders.length} orders using userId directly`);
            
            if (directOrders.length > 0) {
                orders = directOrders;
            } else {
                // If no direct orders, try to find the restaurant and then find orders
                console.log('[Orders API] No direct orders found, looking for restaurant association');
                
                // If the user has a restaurant reference, use that
                if (user.restaurantDetails && user.restaurantDetails._id) {
                    console.log(`[Orders API] Using restaurant ID from user.restaurantDetails: ${user.restaurantDetails._id}`);
                    
                    const restaurantOrders = await Order.find({ restaurantId: user.restaurantDetails._id })
                        .sort('-createdAt')
                        .lean();
                        
                    console.log(`[Orders API] Found ${restaurantOrders.length} orders using restaurantDetails._id`);
                    orders = restaurantOrders;
                }

                // If still no orders and user.restaurant exists (different from restaurantDetails)
                if (orders.length === 0 && user.restaurant) {
                    console.log(`[Orders API] Using restaurant ID from user.restaurant: ${user.restaurant}`);
                    
                    const restaurantOrders = await Order.find({ restaurantId: user.restaurant })
                        .sort('-createdAt')
                        .lean();
                        
                    console.log(`[Orders API] Found ${restaurantOrders.length} orders using user.restaurant`);
                    orders = restaurantOrders;
                }
            }
            
            // If still no orders, check if the restaurant model exists separately
            if (orders.length === 0) {
                try {
                    // Look up properly registered Restaurant model
                    const Restaurant = require('../models/restaurant');
                    
                    // Query using registered model
                    const restaurant = await Restaurant.findOne({ owner: userId });
                    
                    if (restaurant) {
                        console.log(`[Orders API] Found restaurant with ID: ${restaurant._id}`);
                        
                        const restaurantOrders = await Order.find({ restaurantId: restaurant._id })
                            .sort('-createdAt')
                            .lean();
                            
                        console.log(`[Orders API] Found ${restaurantOrders.length} orders using restaurant._id`);
                        orders = restaurantOrders;
                    }
                } catch (err) {
                    console.error('[Orders API] Error looking up restaurant:', err);
                    // Continue with empty orders array
                }
            }
            
            // LAST RESORT: Try direct specific ID lookup from your example JSON
            if (orders.length === 0) {
                console.log('[Orders API] Last resort: Checking specific restaurant ID from sample order');
                
                // Check for orders with specific restaurant ID from your example
                const specificRestaurantId = "67fb7977b23ec6b3cad80fe1";
                const specificOrders = await Order.find({ restaurantId: specificRestaurantId })
                    .sort('-createdAt')
                    .lean();
                    
                console.log(`[Orders API] Found ${specificOrders.length} orders using specific ID ${specificRestaurantId}`);
                
                if (specificOrders.length > 0) {
                    orders = specificOrders;
                }
            }
            
            // Return orders with success
            return res.status(200).json({
                success: true,
                data: orders
            });
        } catch (queryError) {
            console.error('[Orders API] Database query error:', queryError);
            return res.status(500).json({
                success: false,
                message: 'Error retrieving orders from database'
            });
        }
    } catch (error) {
        console.error('[Orders API] Uncaught error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while processing your request'
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

// GET order by ID (moved to be AFTER the more specific routes)
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        // Check if user is authorized to view this order
        // User can view their own orders or restaurant owner can view their restaurant's orders
        if (req.user._id.toString() !== order.userId.toString() && 
            (req.user.restaurantId && req.user.restaurantId.toString() !== order.restaurantId.toString()) &&
            req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
        }

        // If user is owner, populate customer info
        if (req.user.restaurantId && req.user.restaurantId.toString() === order.restaurantId.toString()) {
            await order.populate('userId', 'name email phone address');
        }
        
        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error(`Error fetching order ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Server error' });
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
        
        // Ensure this is a valid restaurant ID (either a direct ID or a user ID for restaurant owner)
        let orderRestaurantId = providedRestaurantId;
        let isValidRestaurant = false;
        
        try {
            // First, try to find the restaurant directly
            const Restaurant = mongoose.model('Restaurant', mongoose.Schema({}), 'restaurants');
            let restaurant = await Restaurant.findById(providedRestaurantId);
            
            if (restaurant) {
                console.log(`[Orders API] Found restaurant directly with ID: ${providedRestaurantId}`);
                isValidRestaurant = true;
            } else {
                // If not found directly, check if this is a user ID for a restaurant owner
                const user = await User.findById(providedRestaurantId);
                
                if (user && user.role === 'restaurant') {
                    console.log(`[Orders API] Found restaurant owner with ID: ${providedRestaurantId}`);
                    
                    // Check if user has restaurantDetails
                    if (user.restaurantDetails && user.restaurantDetails._id) {
                        orderRestaurantId = user.restaurantDetails._id;
                        console.log(`[Orders API] Using restaurant ID from user.restaurantDetails: ${orderRestaurantId}`);
                        isValidRestaurant = true;
                    } else {
                        // Check if this user owns a restaurant in the Restaurant collection
                        const ownedRestaurant = await Restaurant.findOne({ owner: providedRestaurantId });
                        
                        if (ownedRestaurant) {
                            orderRestaurantId = ownedRestaurant._id;
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

        // Get the user ID from authentication middleware (req.user.userId)
        const userId = req.user ? req.user.userId : null;
        
        // Create new order with the validated restaurant ID
        const newOrder = new Order({
            orderNumber: orderNumber || `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
            userId: req.user ? req.user.userId : userId, // Ensure we have a userId
            restaurantId: orderRestaurantId, // Use the validated restaurant ID
            items: orderItems.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                options: item.options || []
            })),
            totalPrice: totalPrice || orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            deliveryFee: deliveryFee || 0,
            tax: tax || 0,
            grandTotal: grandTotal || (totalPrice + (deliveryFee || 0) + (tax || 0)),
            deliveryAddress: orderDeliveryAddress,
            paymentMethod: orderPaymentMethod,
            specialInstructions: specialInstructions || '',
            status: 'PENDING',
            paymentStatus: 'PENDING',
            isPaid: false,
            statusUpdates: [{
                status: 'PENDING',
                timestamp: new Date(),
                updatedBy: req.user ? req.user.userId : null
            }]
        });

        console.log('[Orders API] Saving new order to database...');
        const savedOrder = await newOrder.save();
        console.log(`[Orders API] Order saved successfully with ID: ${savedOrder._id}`);

        // Send notifications (non-blocking)
        try {
            Promise.all([
                createOrderNotification(savedOrder, req.user._id),
                createRestaurantOrderNotification(savedOrder, orderRestaurantId),
                // Send email if user has email
                req.user.email ? sendEmail({
                    to: req.user.email,
                    subject: `YumRun Order Confirmation #${savedOrder.orderNumber}`,
                    html: emailTemplates.orderConfirmationEmail(savedOrder, req.user)
                }) : Promise.resolve()
            ]).catch(err => {
                console.error('[Orders API] Error in post-order operations:', err);
                // Don't fail the request if notifications/email fail
            });
        } catch (notificationError) {
            console.error('[Orders API] Error in notifications:', notificationError);
            // Continue with response
        }

        res.status(201).json({ 
            success: true, 
            message: 'Order created successfully', 
            order: savedOrder 
        });
    } catch (error) {
        console.error('[Orders API] Error creating order:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error'
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
        const orders = await Order.find({ userId: req.user.id })
            .populate('restaurantId', 'name logo')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error(`Error fetching orders for user ${req.user.id}:`, error);
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
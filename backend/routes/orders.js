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
        
        // If no orders found, return dummy orders for testing (only in development)
        if (orders.length === 0 && process.env.NODE_ENV === 'development') {
            console.log('[Orders API] No orders found, generating dummy data');
            const dummyOrders = [
                {
                    _id: '60d21be9267d7acbc1230001',
                    orderNumber: 'ORD-123456-789',
                    userId: userId,
                    restaurantId: {
                        _id: '60d21be9267d7acbc1230002',
                        restaurantDetails: {
                            name: 'Delicious Bites',
                            address: '123 Main St, City'
                        }
                    },
                    items: [
                        {
                            name: 'Chicken Burger',
                            price: 12.99,
                            quantity: 2
                        },
                        {
                            name: 'Fries',
                            price: 4.99,
                            quantity: 1
                        }
                    ],
                    totalPrice: 30.97,
                    deliveryFee: 2.99,
                    tax: 3.40,
                    status: 'DELIVERED',
                    createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
                    deliveryAddress: '456 User St, Customer City',
                    paymentMethod: 'CREDIT_CARD',
                    grandTotal: 37.36
                },
                {
                    _id: '60d21be9267d7acbc1230003',
                    orderNumber: 'ORD-234567-789',
                    userId: userId,
                    restaurantId: {
                        _id: '60d21be9267d7acbc1230004',
                        restaurantDetails: {
                            name: 'Spice Garden',
                            address: '789 Food St, Town'
                        }
                    },
                    items: [
                        {
                            name: 'Butter Chicken',
                            price: 15.99,
                            quantity: 1
                        },
                        {
                            name: 'Naan',
                            price: 2.99,
                            quantity: 2
                        }
                    ],
                    totalPrice: 21.97,
                    deliveryFee: 2.99,
                    tax: 2.50,
                    status: 'PENDING',
                    createdAt: new Date(), // Today
                    deliveryAddress: '456 User St, Customer City',
                    paymentMethod: 'CASH',
                    grandTotal: 27.46
                }
            ];
            return res.status(200).json({ 
                success: true, 
                data: dummyOrders 
            });
        }
        
        // Return real orders
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
        
        // Find orders with simple query and proper error handling
        let orders = [];
        try {
            // Use the user's ID as the restaurantId
            orders = await Order.find({ restaurantId: userId })
                .sort('-createdAt')
                .lean();
                
            console.log(`[Orders API] Found ${orders.length} orders`);
            
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
        console.log('[Orders API] Creating new order...');
        const { 
            items, 
            restaurantId, 
            deliveryAddress, 
            paymentMethod, 
            specialInstructions,
            orderNumber,
            totalPrice,
            deliveryFee,
            tax,
            grandTotal
        } = req.body;

        console.log(`[Orders API] Order data - Restaurant: ${restaurantId}, Items: ${items?.length}, Method: ${paymentMethod}`);

        // Validate required fields
        if (!items?.length || !restaurantId || !deliveryAddress || !paymentMethod) {
            console.error('[Orders API] Missing required order fields');
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide all required fields' 
            });
        }

        // Validate restaurant exists
        console.log(`[Orders API] Validating restaurant: ${restaurantId}`);
        const restaurant = await Restaurant.findById(restaurantId).exec();
        if (!restaurant) {
            console.error(`[Orders API] Restaurant not found: ${restaurantId}`);
            return res.status(404).json({ 
                success: false, 
                message: 'Restaurant not found' 
            });
        }

        // Create new order
        const newOrder = new Order({
            orderNumber: orderNumber || `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
            userId: req.user._id,
            restaurantId,
            items: items.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                options: item.options || []
            })),
            totalPrice: totalPrice || items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            deliveryFee: deliveryFee || 0,
            tax: tax || 0,
            grandTotal: grandTotal || (totalPrice + (deliveryFee || 0) + (tax || 0)),
            deliveryAddress,
            paymentMethod,
            specialInstructions: specialInstructions || '',
            status: 'PENDING',
            paymentStatus: 'PENDING',
            isPaid: false,
            statusUpdates: [{
                status: 'PENDING',
                timestamp: new Date(),
                updatedBy: req.user._id
            }]
        });

        console.log('[Orders API] Saving new order to database...');
        const savedOrder = await newOrder.save();
        console.log(`[Orders API] Order saved successfully with ID: ${savedOrder._id}`);

        // Send notifications (non-blocking)
        Promise.all([
            createOrderNotification(savedOrder, req.user._id),
            createRestaurantOrderNotification(savedOrder, restaurantId),
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

module.exports = router; 
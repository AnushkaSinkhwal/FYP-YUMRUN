const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/order');
const Restaurant = require('../models/restaurant');
const { 
  createOrderNotification, 
  createRestaurantOrderNotification 
} = require('../utils/notifications');

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

// GET order by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
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
        const { 
            items, 
            restaurantId, 
            deliveryAddress, 
            paymentMethod, 
            specialInstructions 
        } = req.body;

        if (!items || !restaurantId || !deliveryAddress || !paymentMethod) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide all required fields' 
            });
        }

        // Validate restaurant exists
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ 
                success: false, 
                message: 'Restaurant not found' 
            });
        }

        // Create unique order number
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

        // Calculate total price
        const totalPrice = items.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);

        // Create new order
        const newOrder = new Order({
            orderNumber,
            userId: req.user._id,
            restaurantId,
            items,
            totalPrice,
            deliveryAddress,
            paymentMethod,
            specialInstructions,
            status: 'PENDING',
            createdAt: new Date()
        });

        await newOrder.save();

        // Create notifications for user and restaurant
        await createOrderNotification(newOrder, req.user._id);
        await createRestaurantOrderNotification(newOrder, restaurantId);

        res.status(201).json({ 
            success: true, 
            message: 'Order created successfully', 
            order: newOrder 
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, message: 'Server error' });
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

// GET user orders
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

// GET restaurant orders
router.get('/restaurant/:restaurantId', auth, async (req, res) => {
    try {
        // Ensure restaurant owner can only see their own restaurant's orders
        if (req.user.role === 'restaurantowner') {
            const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
            
            if (!restaurant || restaurant._id.toString() !== req.params.restaurantId) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Not authorized to view these orders' 
                });
            }
        }
        
        const orders = await Order.find({ restaurantId: req.params.restaurantId })
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error(`Error fetching orders for restaurant ${req.params.restaurantId}:`, error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST update order status
router.post('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide a status' 
            });
        }
        
        // Valid status transitions
        const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status' 
            });
        }
        
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        // Update status
        order.status = status;
        order.statusUpdates.push({
            status,
            timestamp: new Date(),
            updatedBy: req.user._id
        });
        
        await order.save();
        
        res.status(200).json({ 
            success: true, 
            message: 'Order status updated successfully', 
            order 
        });
    } catch (error) {
        console.error(`Error updating status for order ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router; 
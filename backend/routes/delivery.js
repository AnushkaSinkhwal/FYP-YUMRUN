const express = require('express');
const router = express.Router();
const { auth, isDeliveryRider, isAdmin } = require('../middleware/auth');
const Order = require('../models/order');
const User = require('../models/user');
const { createDeliveryNotification } = require('../utils/notifications');
const { sendEmail, emailTemplates } = require('../utils/emailService');

// GET all delivery staff (Admin only)
router.get('/staff', auth, isAdmin, async (req, res) => {
    try {
        const deliveryStaff = await User.find({ role: 'deliveryRider' })
            .select('-password')
            .sort({ fullName: 1 });
            
        res.status(200).json({ 
            success: true, 
            deliveryStaff 
        });
    } catch (error) {
        console.error('Error fetching delivery staff:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// GET delivery staff by ID (Admin only)
router.get('/staff/:id', auth, isAdmin, async (req, res) => {
    try {
        const staff = await User.findOne({ 
            _id: req.params.id, 
            role: 'deliveryRider' 
        }).select('-password');
        
        if (!staff) {
            return res.status(404).json({ 
                success: false, 
                message: 'Delivery staff not found' 
            });
        }
        
        res.status(200).json({ 
            success: true, 
            staff 
        });
    } catch (error) {
        console.error(`Error fetching delivery staff ${req.params.id}:`, error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// GET active deliveries (For delivery staff)
router.get('/active', auth, isDeliveryRider, async (req, res) => {
    try {
        const activeDeliveries = await Order.find({ 
            deliveryPersonId: req.user._id,
            status: { $in: ['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] }
        })
        .populate('userId', 'fullName email phone address')
        .populate('restaurantId', 'name address')
        .sort({ createdAt: -1 });
        
        res.status(200).json({ 
            success: true, 
            deliveries: activeDeliveries 
        });
    } catch (error) {
        console.error('Error fetching active deliveries:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// GET available orders for delivery (For delivery staff)
router.get('/available', auth, isDeliveryRider, async (req, res) => {
    try {
        // Find orders with status READY but no delivery person assigned
        const availableOrders = await Order.find({ 
            status: { $in: ['READY', 'Ready'] },
            $or: [
                { deliveryPersonId: { $exists: false } },
                { deliveryPersonId: null }
            ]
        })
        .populate('restaurantId', 'name address')
        .sort({ createdAt: 1 });
        
        res.status(200).json({ 
            success: true, 
            orders: availableOrders 
        });
    } catch (error) {
        console.error('Error fetching available orders:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// GET delivery history (For delivery staff)
router.get('/history', auth, isDeliveryRider, async (req, res) => {
    try {
        const completedDeliveries = await Order.find({ 
            deliveryPersonId: req.user._id,
            status: { $in: ['DELIVERED', 'CANCELLED'] }
        })
        .populate('userId', 'fullName')
        .populate('restaurantId', 'name')
        .sort({ updatedAt: -1 })
        .limit(50); // Limit to last 50 deliveries
        
        res.status(200).json({ 
            success: true, 
            deliveries: completedDeliveries 
        });
    } catch (error) {
        console.error('Error fetching delivery history:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// GET today's earnings summary (For delivery staff)
router.get('/earnings-summary', auth, isDeliveryRider, async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const completedDeliveriesToday = await Order.find({
            deliveryPersonId: req.user._id,
            status: 'DELIVERED',
            actualDeliveryTime: { $gte: startOfDay, $lt: endOfDay }
        });

        // Basic earnings calculation: assume a fixed amount per delivery for now
        // TODO: Implement a more realistic earnings model (e.g., based on distance, base pay + tips)
        const earnings = completedDeliveriesToday.length * 5; // Example: $5 per delivery
        const deliveriesCount = completedDeliveriesToday.length;

        res.status(200).json({
            success: true,
            summary: {
                todayEarnings: earnings,
                todayCompletedDeliveries: deliveriesCount
            }
        });
    } catch (error) {
        console.error('Error fetching earnings summary:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching earnings summary' 
        });
    }
});

// GET delivery status for specific order
router.get('/status/:orderId', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .select('status statusUpdates deliveryPersonId estimatedDeliveryTime actualDeliveryTime');
            
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }
        
        // Check authorization - only admin, restaurant owner, delivery person assigned to this order,
        // or the customer who placed the order can check status
        // This would be handled by middleware in a real implementation
        
        res.status(200).json({ 
            success: true, 
            delivery: {
                orderId: order._id,
                status: order.status,
                statusUpdates: order.statusUpdates,
                estimatedDeliveryTime: order.estimatedDeliveryTime,
                actualDeliveryTime: order.actualDeliveryTime
            }
        });
    } catch (error) {
        console.error(`Error fetching delivery status for order ${req.params.orderId}:`, error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// POST update delivery status (For delivery staff)
router.post('/update-status/:orderId', auth, isDeliveryRider, async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.orderId;
        
        if (!status) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide a status' 
            });
        }
        
        // Normalize status to uppercase for validation
        const normalizedStatus = status.toUpperCase();
        
        // Only allow delivery staff to set these statuses
        const validStatuses = ['OUT_FOR_DELIVERY', 'DELIVERED'];
        if (!validStatuses.includes(normalizedStatus)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status for delivery staff' 
            });
        }
        
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }
        
        // Check if this delivery person is assigned to this order
        if (order.deliveryPersonId && order.deliveryPersonId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to update this order' 
            });
        }
        
        // Update status - use the normalized uppercase status
        order.status = normalizedStatus;
        order.statusUpdates.push({
            status: normalizedStatus,
            timestamp: new Date(),
            updatedBy: req.user._id
        });
        
        // If delivered, set actual delivery time
        if (normalizedStatus === 'DELIVERED') {
            order.actualDeliveryTime = new Date();
        }
        
        await order.save();
        
        // Send status update email to the customer
        const customer = await User.findById(order.userId);
        if (customer) {
            const emailStatus = normalizedStatus.toLowerCase().replace(/_/g, '-'); // Convert OUT_FOR_DELIVERY to on-the-way
            const emailOptions = {
                order: order,
                status: emailStatus, 
                name: customer.fullName
            };
            sendEmail({
                to: customer.email,
                subject: `YumRun Order Update: ${order.orderNumber} is now ${normalizedStatus.replace('_', ' ')}`,
                html: emailTemplates.orderStatusUpdateEmail(emailOptions)
            }).catch(err => console.error('Failed to send delivery status update email:', err));
        } else {
            console.error('Could not find customer to send delivery status update email for order:', order._id);
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'Delivery status updated',
            order: {
                id: order._id,
                status: order.status,
                updatedAt: order.updatedAt
            }
        });
    } catch (error) {
        console.error(`Error updating delivery status for order ${req.params.orderId}:`, error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// POST accept delivery (For delivery staff)
router.post('/accept/:orderId', auth, isDeliveryRider, async (req, res) => {
    try {
        const orderId = req.params.orderId;
        
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }
        
        // Check if order is ready for delivery - support both uppercase and mixed case status values
        if (order.status !== 'READY' && order.status !== 'Ready') {
            return res.status(400).json({ 
                success: false, 
                message: 'Order is not ready for delivery' 
            });
        }
        
        // Check if order already has a delivery person assigned
        if (order.deliveryPersonId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Order already assigned to a delivery person' 
            });
        }
        
        // Assign delivery person and update status
        order.deliveryPersonId = req.user._id;
        order.status = 'OUT_FOR_DELIVERY';
        order.statusUpdates.push({
            status: 'OUT_FOR_DELIVERY',
            timestamp: new Date(),
            updatedBy: req.user._id
        });
        
        // Set estimated delivery time (30 minutes from now)
        const estimatedTime = new Date();
        estimatedTime.setMinutes(estimatedTime.getMinutes() + 30);
        order.estimatedDeliveryTime = estimatedTime;
        
        await order.save();
        
        // Create notification for customer
        // await createDeliveryNotification(order, 'OUT_FOR_DELIVERY');
        
        res.status(200).json({ 
            success: true, 
            message: 'Delivery accepted successfully',
            order: {
                id: order._id,
                status: order.status,
                estimatedDeliveryTime: order.estimatedDeliveryTime
            }
        });
    } catch (error) {
        console.error(`Error accepting delivery for order ${req.params.orderId}:`, error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// GET delivery staff assigned orders (Admin or Delivery Staff)
router.get('/staff/:id/orders', auth, async (req, res) => {
    try {
        // Check authorization - only admin or the delivery staff themselves
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to view these orders' 
            });
        }
        
        const orders = await Order.find({ deliveryPersonId: req.params.id })
            .populate('userId', 'fullName')
            .populate('restaurantId', 'name address')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ 
            success: true, 
            orders 
        });
    } catch (error) {
        console.error(`Error fetching orders for delivery staff ${req.params.id}:`, error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// POST assign delivery staff to order (Admin only)
router.post('/assign/:orderId/:staffId', auth, isAdmin, async (req, res) => {
    try {
        const { orderId, staffId } = req.params;
        
        // Verify order exists
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }
        
        // Verify staff exists and is a delivery rider
        const staff = await User.findOne({ _id: staffId, role: 'deliveryRider' });
        if (!staff) {
            return res.status(404).json({ 
                success: false, 
                message: 'Delivery staff not found' 
            });
        }
        
        // Check if order already has a delivery person assigned
        if (order.deliveryPersonId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Order already assigned to a delivery person' 
            });
        }
        
        // Assign delivery person
        order.deliveryPersonId = staffId;
        order.statusUpdates.push({
            status: order.status,
            timestamp: new Date(),
            updatedBy: req.user._id
        });
        
        await order.save();
        
        res.status(200).json({ 
            success: true, 
            message: 'Delivery staff assigned successfully',
            order: {
                id: order._id,
                status: order.status,
                deliveryPersonId: order.deliveryPersonId
            }
        });
    } catch (error) {
        console.error(`Error assigning delivery staff to order:`, error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// GET delivery dashboard data (combines multiple endpoints for one dashboard call)
router.get('/dashboard', auth, isDeliveryRider, async (req, res) => {
    try {
        const riderId = req.user._id;
        
        // Get active deliveries
        const activeDeliveries = await Order.find({ 
            deliveryPersonId: riderId,
            status: { $in: ['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] }
        })
        .populate('restaurantId', 'name')
        .sort({ createdAt: -1 });
        
        // Get available orders
        const availableOrders = await Order.find({ 
            status: { $in: ['READY', 'Ready'] },
            $or: [
                { deliveryPersonId: { $exists: false } },
                { deliveryPersonId: null }
            ]
        })
        .sort({ createdAt: 1 });

        // Get completed deliveries for today (for earnings calculation)
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const completedDeliveriesToday = await Order.find({
            deliveryPersonId: riderId,
            status: 'DELIVERED',
            actualDeliveryTime: { $gte: startOfDay, $lt: endOfDay }
        });

        // Get recent deliveries for activity feed
        const recentDeliveries = await Order.find({ 
            deliveryPersonId: riderId
        })
        .populate('restaurantId', 'name')
        .sort({ updatedAt: -1 })
        .limit(10);

        // Format recent activity
        const recentActivity = recentDeliveries.map(delivery => ({
            id: delivery._id,
            type: 'Delivery',
            details: `Order #${delivery.orderNumber || delivery._id.toString().substring(0, 6)} - ${delivery.restaurantId?.name || 'Restaurant'}`,
            status: delivery.status.toLowerCase(),
            date: delivery.updatedAt || delivery.createdAt,
            link: `/delivery/orders/${delivery._id}`
        }));

        // Basic earnings calculation: assume a fixed amount per delivery plus tips
        const basePayPerDelivery = 5; // $5 base pay per delivery
        const todayEarnings = completedDeliveriesToday.reduce((total, order) => {
            return total + basePayPerDelivery + (order.tip || 0);
        }, 0);

        res.status(200).json({
            success: true,
            data: {
                activeDeliveries: activeDeliveries.length,
                availableOrders: availableOrders.length,
                todayCompletedDeliveries: completedDeliveriesToday.length,
                todayEarnings: todayEarnings,
                recentActivity
            }
        });
    } catch (error) {
        console.error('Error fetching delivery dashboard data:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching dashboard data' 
        });
    }
});

module.exports = router; 
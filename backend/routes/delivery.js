const express = require('express');
const router = express.Router();
const { auth, isDeliveryRider, isAdmin } = require('../middleware/auth');
const Order = require('../models/order');
const User = require('../models/user');
const { createDeliveryNotification } = require('../utils/notifications');
const { sendEmail, emailTemplates } = require('../utils/emailService');
const Notification = require('../models/notification');
const RiderReview = require('../models/riderReview');

// GET all delivery staff (Admin only)
router.get('/staff', auth, isAdmin, async (req, res) => {
    try {
        const deliveryStaffWithCounts = await User.aggregate([
            { $match: { role: 'delivery_rider' } },
            {
                $lookup: {
                    from: 'orders', // The collection name for Orders
                    localField: '_id',
                    foreignField: 'deliveryPersonId',
                    as: 'deliveredOrders',
                    pipeline: [
                        { $match: { status: 'DELIVERED' } }
                    ]
                }
            },
            {
                $addFields: {
                    completedDeliveriesCount: { $size: '$deliveredOrders' }
                }
            },
            {
                $project: {
                    // Exclude fields if necessary, like password
                    // Include all original User fields and the new count
                    password: 0, 
                    deliveredOrders: 0 // Don't need to send the actual orders array
                }
            },
            { $sort: { fullName: 1 } }
        ]);

        // The aggregate pipeline returns plain objects, so we need to manually select fields
        // or re-fetch with Mongoose if full model instances are needed.
        // For this case, we'll map the results to ensure all necessary user fields are present.
        // This is a simplified approach; a more robust solution might involve a second query
        // or careful projection if many User fields are needed.
        
        // Fetch full user documents to retain all fields and virtuals
        const staffIds = deliveryStaffWithCounts.map(staff => staff._id);
        const fullStaffDetails = await User.find({ _id: { $in: staffIds } }).select('-password').lean();

        const staffMap = fullStaffDetails.reduce((map, staff) => {
            map[staff._id.toString()] = staff;
            return map;
        }, {});

        const finalDeliveryStaff = deliveryStaffWithCounts.map(staff => ({
            ...(staffMap[staff._id.toString()] || {}),
            completedDeliveriesCount: staff.completedDeliveriesCount,
            // Ensure other necessary fields like deliveryRiderDetails are present
            deliveryRiderDetails: staffMap[staff._id.toString()]?.deliveryRiderDetails || { approved: false, vehicleType: 'N/A' },
        }));

        res.status(200).json({ 
            success: true, 
            deliveryStaff: finalDeliveryStaff
        });
    } catch (error) {
        console.error('Error fetching delivery staff with counts:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching delivery staff' 
        });
    }
});

// GET delivery staff by ID (Admin only)
router.get('/staff/:id', auth, isAdmin, async (req, res) => {
    try {
        const staff = await User.findOne({ 
            _id: req.params.id, 
            role: 'delivery_rider' 
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
        console.log('[Delivery Routes] GET /delivery/active - req.user:', req.user);
        const activeDeliveries = await Order.find({ 
            status: { $in: ['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] },
            $or: [
                { deliveryPersonId: req.user._id },
                { assignedRider: req.user._id }
            ]
        })
        .populate('userId', 'fullName email phone address')
        .populate('restaurantId', 'name address')
        .populate({
          path: 'statusUpdates.updatedBy',
          select: 'name'
        })
        .sort({ updatedAt: -1 });
        
        console.log(`[Delivery Routes] Found ${activeDeliveries.length} active deliveries for rider ${req.user._id}`);
        
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
        console.log('[Delivery Routes] GET /delivery/history - req.user:', req.user);
        const limit = parseInt(req.query.limit, 10) || 50;
        // Fetch completed deliveries for this rider
        const completedDeliveries = await Order.find({ 
            deliveryPersonId: req.user._id,
            status: { $in: ['DELIVERED', 'CANCELLED'] }
        })
        .populate('userId', 'fullName')
        .populate('restaurantId', 'name address')
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean();

        // Fetch rider reviews for these orders
        const riderReviews = await RiderReview.find({
            rider: req.user._id,
            orderId: { $in: completedDeliveries.map(d => d._id) }
        }).lean();

        // Map orderId to rating
        const reviewMap = {};
        riderReviews.forEach(rr => {
            reviewMap[rr.orderId.toString()] = rr.rating;
        });
        // Attach ratings to deliveries
        const deliveriesWithRating = completedDeliveries.map(delivery => ({
            ...delivery,
            rating: reviewMap[delivery._id.toString()] || 0
        }));

        console.log(`[Delivery Routes] Found ${deliveriesWithRating.length} historical deliveries for rider ${req.user._id}`);

        res.status(200).json({
            success: true,
            deliveries: deliveriesWithRating
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
        
        // Check if rider is approved
        if (!req.user.deliveryRiderDetails || !req.user.deliveryRiderDetails.approved) {
            return res.status(403).json({
                success: false,
                message: 'Your account is not approved for deliveries yet'
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
        const staff = await User.findOne({ _id: staffId, role: 'delivery_rider' });
        if (!staff) {
            return res.status(404).json({ 
                success: false, 
                message: 'Delivery staff not found' 
            });
        }
        
        // Check if staff is approved
        if (!staff.deliveryRiderDetails || !staff.deliveryRiderDetails.approved) {
            return res.status(400).json({ 
                success: false, 
                message: 'Delivery staff is not approved for deliveries yet' 
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

// GET earnings data with period support (For delivery staff)
router.get('/earnings', auth, isDeliveryRider, async (req, res) => {
    try {
        const riderId = req.user._id;
        const period = req.query.period || 'week';
        
        // Define the date range based on period
        let startDate;
        const now = new Date();
        const endDate = now;
        
        switch(period) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate = new Date(now);
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
        }
        
        // Get all completed deliveries for the period
        const deliveries = await Order.find({
            deliveryPersonId: riderId,
            status: 'DELIVERED',
            actualDeliveryTime: { $gte: startDate, $lte: endDate }
        }).sort({ actualDeliveryTime: -1 });
        
        // Get previous period deliveries for comparison
        const previousStartDate = new Date(startDate);
        const previousEndDate = new Date(startDate);
        
        if (period === 'week') {
            previousStartDate.setDate(previousStartDate.getDate() - 7);
        } else if (period === 'month') {
            previousStartDate.setMonth(previousStartDate.getMonth() - 1);
        } else if (period === 'year') {
            previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
        }
        
        const previousDeliveries = await Order.find({
            deliveryPersonId: riderId,
            status: 'DELIVERED',
            actualDeliveryTime: { $gte: previousStartDate, $lte: previousEndDate }
        });
        
        // Calculate total earnings
        const basePayPerDelivery = 5; // $5 base pay per delivery
        
        const totalEarnings = deliveries.reduce((total, order) => {
            return total + basePayPerDelivery + (order.tip || 0);
        }, 0);
        
        const previousEarnings = previousDeliveries.reduce((total, order) => {
            return total + basePayPerDelivery + (order.tip || 0);
        }, 0);
        
        // Calculate change percentage
        let earningsChange = 0;
        if (previousEarnings > 0) {
            earningsChange = ((totalEarnings - previousEarnings) / previousEarnings) * 100;
        }
        
        // Calculate total distance
        const totalDistance = deliveries.reduce((total, order) => {
            return total + (order.distance || 0);
        }, 0);
        
        // Group by days for the chart data
        const dailyEarnings = {};
        deliveries.forEach(delivery => {
            const date = new Date(delivery.actualDeliveryTime);
            const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
            
            if (!dailyEarnings[dateString]) {
                dailyEarnings[dateString] = {
                    date: dateString,
                    earnings: 0,
                    deliveries: 0,
                    distance: 0
                };
            }
            
            dailyEarnings[dateString].earnings += basePayPerDelivery + (delivery.tip || 0);
            dailyEarnings[dateString].deliveries += 1;
            dailyEarnings[dateString].distance += (delivery.distance || 0);
        });
        
        // Convert daily earnings to array and sort by date
        const earningsByDay = Object.values(dailyEarnings).sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });
        
        // Calculate average earnings per delivery
        const avgEarningsPerDelivery = deliveries.length > 0 ? totalEarnings / deliveries.length : 0;
        
        // Format transactions for the frontend
        const recentTransactions = deliveries.slice(0, 5).map(delivery => ({
            id: delivery._id,
            orderNumber: delivery.orderNumber || delivery._id.toString().substring(0, 6),
            date: delivery.actualDeliveryTime,
            amount: basePayPerDelivery + (delivery.tip || 0),
            status: 'completed'
        }));
        
        res.status(200).json({
            success: true,
            data: {
                totalEarnings,
                totalDeliveries: deliveries.length,
                earningsChange: Math.round(earningsChange * 100) / 100, // Round to 2 decimal places
                totalDistance,
                avgEarningsPerDelivery,
                earningsByDay,
                recentTransactions
            }
        });
    } catch (error) {
        console.error('Error fetching earnings data:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching earnings data' 
        });
    }
});

// GET notifications for the delivery rider
router.get('/notifications', auth, isDeliveryRider, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Find notifications for this delivery rider
        const notifications = await Notification.find({
            userId: userId,
            isAdminNotification: { $ne: true }
        }).sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            notifications
        });
    } catch (error) {
        console.error('Error fetching delivery rider notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
});

// GET count of unread notifications
router.get('/notifications/unread-count', auth, isDeliveryRider, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Count unread notifications
        const count = await Notification.countDocuments({
            userId: userId,
            isRead: false,
            isAdminNotification: { $ne: true }
        });
        
        res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Error counting unread notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to count unread notifications'
        });
    }
});

// MARK notification as read
router.put('/notifications/:id/read', auth, isDeliveryRider, async (req, res) => {
    try {
        const userId = req.user.userId;
        const notificationId = req.params.id;
        
        // Find and update the notification
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId: userId },
            { isRead: true },
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read'
        });
    }
});

// MARK all notifications as read
router.put('/notifications/mark-all-read', auth, isDeliveryRider, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Update all notifications for this user
        const result = await Notification.updateMany(
            { userId: userId, isRead: false },
            { isRead: true }
        );
        
        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
            count: result.nModified || 0
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read'
        });
    }
});

// GET all reviews for the logged-in delivery rider
router.get('/reviews', auth, isDeliveryRider, async (req, res) => {
    try {
        const reviews = await RiderReview.find({ rider: req.user._id })
            .populate('user', 'fullName profilePic')
            .populate('orderId', 'orderNumber')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, reviews });
    } catch (error) {
        console.error('Error fetching rider reviews:', error);
        res.status(500).json({ success: false, message: 'Server error fetching reviews' });
    }
});

module.exports = router; 
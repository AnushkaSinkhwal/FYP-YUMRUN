const User = require('../models/user');
const Order = require('../models/order');
const { LoyaltyPoints } = require('../models/loyalty');
const mongoose = require('mongoose');

// Helper function to calculate points based on order total
const calculatePoints = (orderTotal) => {
    // For every 100 spent, earn 10 points
    return Math.floor(orderTotal / 100) * 10;
};

// Get user's current loyalty points
exports.getUserPoints = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            points: user.loyaltyPoints || 0
        });
    } catch (error) {
        console.error('Error fetching user loyalty points:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching loyalty points',
            error: error.message
        });
    }
};

// Add loyalty points to user account (after order completion)
exports.addPoints = async (req, res) => {
    try {
        const { userId, orderId, points, orderTotal } = req.body;

        if (!userId || (!points && !orderTotal)) {
            return res.status(400).json({
                success: false,
                message: 'User ID and either points or order total are required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Calculate points if not provided directly
        const pointsToAdd = points || calculatePoints(orderTotal);

        // Create a new loyalty points record
        const loyaltyRecord = new LoyaltyPoints({
            points: pointsToAdd,
            user: userId,
            orderId: orderId || null,
            type: 'earned',
            description: orderId ? `Points earned from order #${orderId}` : 'Points added to account'
        });

        await loyaltyRecord.save();

        // Update user's total points
        user.loyaltyPoints = (user.loyaltyPoints || 0) + pointsToAdd;
        await user.save();

        // If order ID is provided, update the order with points earned
        if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
            const order = await Order.findById(orderId);
            if (order) {
                order.loyaltyPointsEarned = pointsToAdd;
                await order.save();
            }
        }

        return res.status(200).json({
            success: true,
            message: `${pointsToAdd} points added successfully`,
            currentPoints: user.loyaltyPoints
        });
    } catch (error) {
        console.error('Error adding loyalty points:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while adding loyalty points',
            error: error.message
        });
    }
};

// Redeem loyalty points for discount
exports.redeemPoints = async (req, res) => {
    try {
        const { userId, points, orderId } = req.body;

        if (!userId || !points || !orderId) {
            return res.status(400).json({
                success: false,
                message: 'User ID, points, and order ID are required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID format'
            });
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user has enough points
        if ((user.loyaltyPoints || 0) < points) {
            return res.status(400).json({
                success: false,
                message: 'Not enough loyalty points'
            });
        }

        // Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Calculate discount (10 points = Rs. 1 off)
        const discountAmount = points / 10;

        // Create a new loyalty points record for redemption
        const loyaltyRecord = new LoyaltyPoints({
            points: -points, // Negative value for points spent
            user: userId,
            orderId: orderId,
            type: 'redeemed',
            description: `Points redeemed for Rs. ${discountAmount} discount on order #${orderId}`
        });

        await loyaltyRecord.save();

        // Update user's total points
        user.loyaltyPoints -= points;
        await user.save();

        // Update order with points used and adjust total
        order.loyaltyPointsUsed = points;
        // Reduce the total by the discount amount
        order.totalPrice = Math.max(0, order.totalPrice - discountAmount);
        await order.save();

        return res.status(200).json({
            success: true,
            message: `${points} points redeemed successfully for Rs. ${discountAmount} discount`,
            currentPoints: user.loyaltyPoints,
            updatedOrder: {
                id: order._id,
                totalPrice: order.totalPrice,
                loyaltyPointsUsed: order.loyaltyPointsUsed
            }
        });
    } catch (error) {
        console.error('Error redeeming loyalty points:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while redeeming loyalty points',
            error: error.message
        });
    }
};

// Get loyalty points history for a user
exports.getPointsHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const history = await LoyaltyPoints.find({ user: userId })
            .sort({ date: -1 }) // Most recent first
            .limit(50); // Limit to 50 records

        return res.status(200).json({
            success: true,
            history
        });
    } catch (error) {
        console.error('Error fetching loyalty points history:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching loyalty points history',
            error: error.message
        });
    }
};

// Get available rewards that can be redeemed with points
exports.getAvailableRewards = async (req, res) => {
    try {
        // Define a list of standard rewards
        const rewards = [
            { id: 1, name: 'Rs. 50 off your order', pointsRequired: 500, value: 50 },
            { id: 2, name: 'Rs. 100 off your order', pointsRequired: 1000, value: 100 },
            { id: 3, name: 'Rs. 200 off your order', pointsRequired: 2000, value: 200 },
            { id: 4, name: 'Free delivery', pointsRequired: 300, value: 'free_delivery' },
            { id: 5, name: 'Buy one get one free', pointsRequired: 1500, value: 'bogo' }
        ];

        return res.status(200).json({
            success: true,
            rewards
        });
    } catch (error) {
        console.error('Error fetching available rewards:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching available rewards',
            error: error.message
        });
    }
}; 
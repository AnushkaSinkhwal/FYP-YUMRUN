const User = require('../models/user');
const Order = require('../models/order');
const LoyaltyTransaction = require('../models/loyaltyTransaction');
const mongoose = require('mongoose');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { 
    calculateTier, 
    getTierBenefits,
    LOYALTY_TIERS,
    calculateOrderPoints
} = require('../utils/loyaltyUtils');

// Helper function to calculate base points based on order total
const calculateBasePoints = (orderTotal) => {
    // For every 100 spent, earn 10 points
    return Math.floor(orderTotal / 100) * 10;
};

/**
 * Get user's loyalty information including tier benefits
 * @route GET /api/loyalty/info
 * @access Private
 */
exports.getLoyaltyInfo = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const restaurantId = req.query.restaurantId;
    const user = await User.findById(userId);
    if (!user) {
        throw new ErrorResponse('User not found', 404);
    }
    
    // Start with global loyalty points
    let currentPoints = user.loyaltyPoints;
    // If a restaurantId is provided, try to scope points to that restaurant
    if (restaurantId) {
        try {
            const mongoose = require('mongoose');
            const match = {
                user: mongoose.Types.ObjectId(userId),
                restaurantId: mongoose.Types.ObjectId(restaurantId)
            };
            const aggResult = await LoyaltyTransaction.aggregate([
                { $match: match },
                { $group: { _id: null, totalPoints: { $sum: '$points' } } }
            ]);
            currentPoints = aggResult[0]?.totalPoints || 0;
        } catch (aggError) {
            console.error('Error aggregating loyalty points for restaurant', restaurantId, aggError);
            // Fallback to global points
            currentPoints = user.loyaltyPoints;
        }
    }
    
    // Get user's current tier and benefits (global tier)
    const tier = user.loyaltyTier;
    const tierBenefits = getTierBenefits(tier);
    
    // Calculate points needed for next tier
    let nextTier = null;
    let pointsToNextTier = 0;
    if (tier !== 'PLATINUM') {
        const tiers = Object.keys(LOYALTY_TIERS);
        const idx = tiers.indexOf(tier);
        nextTier = tiers[idx + 1];
        if (nextTier) {
            pointsToNextTier = LOYALTY_TIERS[nextTier] - user.lifetimeLoyaltyPoints;
        }
    }
    
    return res.status(200).json({
        success: true,
        data: {
            currentPoints,
            lifetimePoints: user.lifetimeLoyaltyPoints,
            currentTier: tier,
            tierBenefits,
            nextTier,
            pointsToNextTier: pointsToNextTier > 0 ? pointsToNextTier : 0,
            tierUpdateDate: user.tierUpdateDate
        }
    });
});

/**
 * Get user's loyalty transactions history
 * @route GET /api/loyalty/transactions
 * @access Private
 */
exports.getLoyaltyTransactions = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    const query = { user: userId };
    // Filter by restaurant if provided
    if (req.query.restaurantId && mongoose.Types.ObjectId.isValid(req.query.restaurantId)) {
        query.restaurantId = req.query.restaurantId;
    }
    
    // Allow filtering by transaction type
    if (req.query.type && ['EARN', 'REDEEM', 'ADJUST', 'EXPIRE'].includes(req.query.type.toUpperCase())) {
        query.type = req.query.type.toUpperCase();
    }
    
    // Date range filter
    if (req.query.startDate) {
        query.createdAt = { $gte: new Date(req.query.startDate) };
    }
    
    if (req.query.endDate) {
        query.createdAt = { ...query.createdAt || {}, $lte: new Date(req.query.endDate) };
    }
    
    const transactions = await LoyaltyTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    
    const total = await LoyaltyTransaction.countDocuments(query);
    
    return res.status(200).json({
        success: true,
        data: {
            transactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
});

/**
 * Add points from completed order
 * @route POST /api/loyalty/earn
 * @access Private
 */
exports.addOrderPoints = asyncHandler(async (req, res) => {
    const { orderId, orderTotal } = req.body;
    const userId = req.user._id;
    if (!orderId || !orderTotal) {
        throw new ErrorResponse('Order ID and total are required', 400);
    }
    // Determine restaurant for the order
    const order = await Order.findById(orderId);
    const restaurantId = order?.restaurantId;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // Find user
        const user = await User.findById(userId).session(session);
        if (!user) {
            throw new ErrorResponse('User not found', 404);
        }
        
        // Calculate points based on order total and user's tier
        const basePoints = calculateBasePoints(orderTotal);
        const pointsToAdd = calculateOrderPoints(basePoints, user.loyaltyTier);
        
        // Set expiry date (12 months from now)
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 12);
        
        // Create loyalty transaction
        const transaction = new LoyaltyTransaction({
            user: userId,
            restaurantId: restaurantId,
            points: pointsToAdd,
            type: 'EARN',
            source: 'ORDER',
            description: `Points earned from order #${orderId}`,
            referenceId: orderId,
            balance: user.loyaltyPoints + pointsToAdd,
            expiryDate
        });
        
        await transaction.save({ session });
        
        // Update user's points
        user.loyaltyPoints += pointsToAdd;
        user.lifetimeLoyaltyPoints += pointsToAdd;
        await user.save({ session });
        
        // Update order with points earned (if order model has this field)
        const orderRec = await Order.findById(orderId).session(session);
        if (orderRec) {
            orderRec.loyaltyPointsEarned = pointsToAdd;
            await orderRec.save({ session });
        }
        
        await session.commitTransaction();
        
        return res.status(200).json({
            success: true,
            data: {
                transaction,
                currentPoints: user.loyaltyPoints,
                lifetimePoints: user.lifetimeLoyaltyPoints
            }
        });
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

/**
 * Redeem points for a reward
 * @route POST /api/loyalty/redeem
 * @access Private
 */
exports.redeemPoints = asyncHandler(async (req, res) => {
    const { rewardId, pointsToRedeem } = req.body;
    const userId = req.user._id;
    if (!rewardId || !pointsToRedeem || pointsToRedeem <= 0) {
        throw new ErrorResponse('Valid reward and points amount are required', 400);
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        // Find user
        const user = await User.findById(userId).session(session);
        if (!user) {
            throw new ErrorResponse('User not found', 404);
        }
        
        // Check if user has enough points
        if (user.loyaltyPoints < pointsToRedeem) {
            throw new ErrorResponse('Insufficient loyalty points', 400);
        }
        
        // Determine restaurant context if redeeming for an order
        const restaurantId = req.body.restaurantId;
        
        // Create redemption transaction
        const transaction = new LoyaltyTransaction({
            user: userId,
            restaurantId: restaurantId,
            points: -pointsToRedeem, // Negative for redemption
            type: 'REDEEM',
            source: 'SYSTEM',
            description: `Redeemed points for reward: ${rewardId}`,
            referenceId: null, // Could store reward ID if rewards have ObjectIds
            balance: user.loyaltyPoints - pointsToRedeem
        });
        
        await transaction.save({ session });
        
        // Update user points
        user.loyaltyPoints -= pointsToRedeem;
        await user.save({ session });
        
        await session.commitTransaction();
        
        return res.status(200).json({
            success: true,
            data: {
                transaction,
                currentPoints: user.loyaltyPoints
            }
        });
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

/**
 * Admin endpoint to adjust user points
 * @route POST /api/loyalty/adjust
 * @access Private (Admin only)
 */
exports.adjustPoints = asyncHandler(async (req, res) => {
    const { userId, points, reason } = req.body;
    const adminId = req.user._id;
    
    if (!userId || !points || !reason) {
        throw new ErrorResponse('User ID, points and reason are required', 400);
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        // Find user
        const user = await User.findById(userId).session(session);
        if (!user) {
            throw new ErrorResponse('User not found', 404);
        }
        
        // Create adjustment transaction
        const transaction = new LoyaltyTransaction({
            user: userId,
            points: points, // Can be positive or negative
            type: 'ADJUST',
            source: 'ADMIN',
            description: reason,
            adjustedBy: adminId,
            balance: user.loyaltyPoints + points
        });
        
        await transaction.save({ session });
        
        // Update user points
        user.loyaltyPoints += points;
        
        // If adding points, also update lifetime points
        if (points > 0) {
            user.lifetimeLoyaltyPoints += points;
        }
        
        await user.save({ session });
        
        await session.commitTransaction();
        
        return res.status(200).json({
            success: true,
            data: {
                transaction,
                currentPoints: user.loyaltyPoints,
                lifetimePoints: user.lifetimeLoyaltyPoints
            }
        });
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

/**
 * Process expired points (cron job endpoint)
 * @route POST /api/loyalty/process-expired
 * @access Private (System/Admin only)
 */
exports.processExpiredPoints = asyncHandler(async (req, res) => {
    const { processExpiredPoints } = require('../utils/loyaltyUtils');
    
    const processed = await processExpiredPoints(LoyaltyTransaction, User);
    
    return res.status(200).json({
        success: true,
        data: {
            processed
        }
    });
}); 
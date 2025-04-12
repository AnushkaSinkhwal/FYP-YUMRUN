/**
 * Loyalty Program Tier Thresholds
 * Points required to reach each tier
 */
const BRONZE = 0;      // Starting tier
const SILVER = 1000;   // 1,000 points
const GOLD = 5000;     // 5,000 points
const PLATINUM = 10000; // 10,000 points

/**
 * Define loyalty tier thresholds
 * Points required to reach each tier
 */
const LOYALTY_TIERS = {
    BRONZE: 0,
    SILVER: 1000,
    GOLD: 5000,
    PLATINUM: 10000
};

/**
 * Calculate user's loyalty tier based on their points
 * @param {Number} points - User's current loyalty points
 * @returns {String} The loyalty tier (BRONZE, SILVER, GOLD, PLATINUM)
 */
const calculateTier = (points) => {
    if (points >= LOYALTY_TIERS.PLATINUM) return 'PLATINUM';
    if (points >= LOYALTY_TIERS.GOLD) return 'GOLD';
    if (points >= LOYALTY_TIERS.SILVER) return 'SILVER';
    return 'BRONZE';
};

/**
 * Get tier benefits for a specific tier
 * @param {String} tier - The loyalty tier
 * @returns {Object} Benefits associated with the tier
 */
const getTierBenefits = (tier) => {
    const benefits = {
        BRONZE: {
            pointsMultiplier: 1,
            perks: ['Basic member benefits']
        },
        SILVER: {
            pointsMultiplier: 1.2,
            perks: ['10% bonus points', 'Priority customer service']
        },
        GOLD: {
            pointsMultiplier: 1.5,
            perks: ['Free delivery', '20% bonus points', 'Exclusive promotions']
        },
        PLATINUM: {
            pointsMultiplier: 2,
            perks: ['Free delivery', 'Double points on all orders', 'Exclusive promotions', 'Birthday rewards']
        }
    };

    return benefits[tier] || benefits.BRONZE;
};

/**
 * Calculate points earned for an order based on tier multiplier
 * @param {Number} basePoints - Base points from order amount
 * @param {String} tier - User's loyalty tier
 * @returns {Number} Total points to award
 */
const calculateOrderPoints = (basePoints, tier) => {
    const { pointsMultiplier } = getTierBenefits(tier);
    return Math.round(basePoints * pointsMultiplier);
};

/**
 * Process points expiration
 * This function should be called by a scheduled job
 * @param {Model} LoyaltyTransaction - Mongoose model for transactions
 * @param {Model} User - Mongoose model for users
 * @returns {Promise<Number>} Number of processed transactions
 */
const processExpiredPoints = async (LoyaltyTransaction, User) => {
    const now = new Date();
    
    // Find expired points that haven't been processed
    const expiredTransactions = await LoyaltyTransaction.find({
        expiryDate: { $lt: now },
        type: 'EARN',
        processedExpiry: false
    });
    
    let processed = 0;
    
    for (const transaction of expiredTransactions) {
        const session = await LoyaltyTransaction.startSession();
        
        try {
            session.startTransaction();
            
            // Get user's current points
            const user = await User.findById(transaction.user);
            
            if (!user) {
                throw new Error(`User not found for transaction ${transaction._id}`);
            }
            
            // Create expiry transaction
            const expiryTransaction = new LoyaltyTransaction({
                user: transaction.user,
                points: -transaction.points, // Negative points for expiry
                type: 'EXPIRE',
                source: 'SYSTEM',
                description: `Expired points from transaction on ${transaction.createdAt.toISOString().split('T')[0]}`,
                referenceId: transaction._id,
                balance: Math.max(0, user.loyaltyPoints - transaction.points)
            });
            
            await expiryTransaction.save({ session });
            
            // Update user's points
            user.loyaltyPoints = Math.max(0, user.loyaltyPoints - transaction.points);
            await user.save({ session });
            
            // Mark original transaction as processed
            transaction.processedExpiry = true;
            await transaction.save({ session });
            
            await session.commitTransaction();
            processed++;
            
        } catch (error) {
            await session.abortTransaction();
            console.error(`Error processing expired points for transaction ${transaction._id}:`, error);
        } finally {
            session.endSession();
        }
    }
    
    return processed;
};

/**
 * Update a user's loyalty tier based on their points
 * @param {ObjectId} userId - The user's ID
 * @returns {Promise<Object>} The updated user object
 */
const updateUserTier = async (userId) => {
    const User = require('../models/user');
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
        throw new Error(`User not found with ID: ${userId}`);
    }
    
    // Calculate their tier based on lifetime points
    const newTier = calculateTier(user.lifetimeLoyaltyPoints);
    
    // If tier has changed, update it
    if (user.loyaltyTier !== newTier) {
        user.loyaltyTier = newTier;
        user.tierUpdateDate = new Date();
        await user.save();
        
        // Here you could also trigger tier change notifications, etc.
    }
    
    return user;
};

module.exports = {
    BRONZE,
    SILVER,
    GOLD,
    PLATINUM,
    LOYALTY_TIERS,
    calculateTier,
    getTierBenefits,
    calculateOrderPoints,
    processExpiredPoints,
    updateUserTier
}; 
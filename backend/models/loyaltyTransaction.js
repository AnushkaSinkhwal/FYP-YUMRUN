const mongoose = require('mongoose');

// Define the Loyalty Transaction Schema
const loyaltyTransactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // Associate transaction with a specific restaurant (for restaurant-scoped loyalty)
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        index: true
    },
    points: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['EARN', 'REDEEM', 'ADJUST', 'EXPIRE'],
        required: true,
        index: true
    },
    source: {
        type: String,
        enum: ['ORDER', 'REFUND', 'ADMIN', 'SYSTEM', 'PROMOTION'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        index: true,
        // Optional reference to order, etc.
    },
    balance: {
        type: Number,
        required: true,
        // Running balance after this transaction
    },
    expiryDate: {
        type: Date,
        // Points expiry date (for EARN transactions)
    },
    processedExpiry: {
        type: Boolean,
        default: false
        // Flag to indicate whether expiry was processed
    },
    // Admin who made the adjustment (for ADJUST type)
    adjustedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Index for querying transactions by date range (for reports/history)
loyaltyTransactionSchema.index({ createdAt: -1 });

// Index for querying expiring points
loyaltyTransactionSchema.index({ 
    expiryDate: 1, 
    type: 1, 
    processedExpiry: 1 
});

// Virtual for checking if transaction is expired
loyaltyTransactionSchema.virtual('isExpired').get(function() {
    if (!this.expiryDate) return false;
    return new Date() > this.expiryDate;
});

// Middleware to update User model after a transaction is saved
loyaltyTransactionSchema.post('save', async function(doc) {
    try {
        const User = mongoose.model('User');
        const loyaltyUtils = require('../utils/loyaltyUtils');
        
        // Update user tier based on updated points
        await loyaltyUtils.updateUserTier(doc.user);
    } catch (error) {
        console.error('Error in loyaltyTransaction post-save middleware:', error);
    }
});

const LoyaltyTransaction = mongoose.model('LoyaltyTransaction', loyaltyTransactionSchema);

module.exports = LoyaltyTransaction; 
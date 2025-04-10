const mongoose = require('mongoose');

const loyaltyPointsSchema = mongoose.Schema({
    points_id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
        primaryKey: true
    },
    points: {
        type: Number,
        required: true,
        default: 0
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    },
    type: {
        type: String,
        enum: ['earned', 'redeemed', 'expired', 'adjusted'],
        default: 'earned'
    },
    description: {
        type: String,
        default: ''
    },
    date: {
        type: Date,
        default: Date.now,
    }
});

loyaltyPointsSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

loyaltyPointsSchema.set('toJSON', {
    virtuals: true,
});

// Create index for faster querying
loyaltyPointsSchema.index({ user: 1 });
loyaltyPointsSchema.index({ date: -1 });

exports.LoyaltyPoints = mongoose.model('LoyaltyPoints', loyaltyPointsSchema);
exports.loyaltyPointsSchema = loyaltyPointsSchema; 
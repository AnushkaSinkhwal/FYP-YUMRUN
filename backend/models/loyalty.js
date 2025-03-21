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

exports.LoyaltyPoints = mongoose.model('LoyaltyPoints', loyaltyPointsSchema);
exports.loyaltyPointsSchema = loyaltyPointsSchema; 
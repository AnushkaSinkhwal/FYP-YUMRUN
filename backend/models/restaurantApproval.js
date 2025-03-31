const mongoose = require('mongoose');

const restaurantApprovalSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    currentData: {
        name: String,
        email: String,
        phone: String,
        restaurantName: String,
        restaurantAddress: String
    },
    requestedData: {
        name: String,
        email: String,
        phone: String,
        restaurantName: String,
        restaurantAddress: String
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
restaurantApprovalSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const RestaurantApproval = mongoose.model('RestaurantApproval', restaurantApprovalSchema);

module.exports = RestaurantApproval; 
const mongoose = require('mongoose');

const restaurantApprovalSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    currentData: {
        name: String,
        email: String,
        phone: String,
        restaurantName: String,
        restaurantAddress: String,
        description: String,
        cuisine: [String],
        openingHours: Object,
        isOpen: Boolean,
        deliveryRadius: Number,
        minimumOrder: Number,
        deliveryFee: Number,
        logo: String,
        coverImage: String,
        panNumber: String,
        priceRange: String
    },
    requestedData: {
        name: String,
        email: String,
        phone: String,
        restaurantName: String,
        restaurantAddress: String,
        description: String,
        cuisine: [String],
        openingHours: Object,
        isOpen: Boolean,
        deliveryRadius: Number,
        minimumOrder: Number,
        deliveryFee: Number,
        logo: String,
        coverImage: String,
        panNumber: String,
        priceRange: String
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    processedAt: {
        type: Date,
        default: null
    },
    rejectionReason: {
        type: String,
        default: null
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
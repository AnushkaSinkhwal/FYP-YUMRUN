const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
    review_id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
        primaryKey: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: false
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    helpful: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

reviewSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Add index for faster queries
reviewSchema.index({ menuItem: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ restaurant: 1 });

exports.Review = mongoose.model('Review', reviewSchema);
exports.reviewSchema = reviewSchema; 
const mongoose = require('mongoose');

const offerSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    offerType: {
        type: String,
        required: true,
        enum: ['Discount', 'Special Menu', 'Buy One Get One', 'Combo Deal', 'Other'],
        default: 'Discount'
    },
    discountPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    appliesTo: {
        type: String,
        enum: ['All Menu', 'Selected Items'],
        default: 'All Menu'
    },
    menuItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem'
    }],
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

offerSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Validate that endDate is after startDate
offerSchema.pre('validate', function(next) {
    if (this.startDate && this.endDate && this.startDate > this.endDate) {
        this.invalidate('endDate', 'End date must be after start date');
    }
    next();
});

exports.Offer = mongoose.model('Offer', offerSchema);
exports.offerSchema = offerSchema; 
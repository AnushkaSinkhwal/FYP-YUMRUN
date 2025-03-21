const mongoose = require('mongoose');

const deliverySchema = mongoose.Schema({
    delivery_id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
        primaryKey: true
    },
    delivery_status: {
        type: String,
        required: true,
        enum: ['Pending', 'Out for Delivery', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    deliveryPerson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    estimatedDeliveryTime: {
        type: Date
    },
    actualDeliveryTime: {
        type: Date
    },
    date: {
        type: Date,
        default: Date.now
    }
});

deliverySchema.virtual('id').get(function () {
    return this._id.toHexString();
});

deliverySchema.set('toJSON', {
    virtuals: true,
});

exports.Delivery = mongoose.model('Delivery', deliverySchema);
exports.deliverySchema = deliverySchema; 
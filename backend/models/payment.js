const mongoose = require('mongoose');

const paymentSchema = mongoose.Schema({
    payment_id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
        primaryKey: true
    },
    amount: {
        type: Number,
        required: true,
    },
    payment_method: {
        type: String,
        required: true,
        enum: ['Cash on Delivery', 'Khalti', 'Card']
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    status: {
        type: String,
        required: true,
        default: 'Pending',
        enum: ['Pending', 'Completed', 'Failed', 'Refunded']
    },
    date: {
        type: Date,
        default: Date.now,
    }
});

paymentSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

paymentSchema.set('toJSON', {
    virtuals: true,
});

exports.Payment = mongoose.model('Payment', paymentSchema);
exports.paymentSchema = paymentSchema; 
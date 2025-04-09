const mongoose = require('mongoose');
console.log('Payment model loaded');

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: String,
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['KHALTI', 'CASH', 'ESEWA'],
        required: true
    },
    status: {
        type: String,
        enum: ['INITIATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'],
        default: 'INITIATED'
    },
    transactionDetails: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Add index for faster lookups
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema); 
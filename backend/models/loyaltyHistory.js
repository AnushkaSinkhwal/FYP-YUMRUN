const mongoose = require('mongoose');

const loyaltyHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  points: {
    type: Number,
    required: true
  },
  action: {
    type: String,
    enum: ['earned', 'redeemed', 'expired', 'adjusted'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  rewardId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster querying
loyaltyHistorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('LoyaltyHistory', loyaltyHistorySchema);
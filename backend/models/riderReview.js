const mongoose = require('mongoose');

const riderReviewSchema = new mongoose.Schema({
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true }
}, {
  timestamps: true
});

riderReviewSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const RiderReview = mongoose.model('RiderReview', riderReviewSchema);
module.exports = RiderReview; 
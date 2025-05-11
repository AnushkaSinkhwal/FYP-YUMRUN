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

// Static method to calculate and update Rider average rating
riderReviewSchema.statics.calculateAverageRating = async function(riderId) {
    const stats = await this.aggregate([
        { $match: { rider: new mongoose.Types.ObjectId(riderId) } },
        { $group: { _id: '$rider', nRating: { $sum: 1 }, avgRating: { $avg: '$rating' } } }
    ]);
    try {
        if (stats.length > 0) {
            await mongoose.model('User').findByIdAndUpdate(riderId, {
                'deliveryRiderDetails.ratings.count': stats[0].nRating,
                'deliveryRiderDetails.ratings.average': stats[0].avgRating
            });
        } else {
            await mongoose.model('User').findByIdAndUpdate(riderId, {
                'deliveryRiderDetails.ratings.count': 0,
                'deliveryRiderDetails.ratings.average': 0
            });
        }
    } catch (err) {
        console.error(`Error updating Rider ${riderId} ratings:`, err);
    }
};

// Middleware to recalculate ratings after save
riderReviewSchema.post('save', function() {
    this.constructor.calculateAverageRating(this.rider);
});

// Capture document before deletion
riderReviewSchema.pre('findOneAndDelete', async function(next) {
    try {
        this.reviewToDelete = await this.model.findOne(this.getQuery());
        next();
    } catch (err) {
        next(err);
    }
});

// Recalculate ratings after delete
riderReviewSchema.post('findOneAndDelete', async function() {
    if (this.reviewToDelete) {
        await this.reviewToDelete.constructor.calculateAverageRating(this.reviewToDelete.rider);
    }
});

const RiderReview = mongoose.model('RiderReview', riderReviewSchema);
module.exports = RiderReview; 
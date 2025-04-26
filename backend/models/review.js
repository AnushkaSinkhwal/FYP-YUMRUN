const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
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
        ref: 'Restaurant',
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

reviewSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// --- Static method to calculate and update MenuItem average rating ---
reviewSchema.statics.calculateAverageRating = async function(menuItemId) {
    console.log(`Calculating average rating for menuItem: ${menuItemId}`);
    const stats = await this.aggregate([
        {
            $match: { menuItem: new mongoose.Types.ObjectId(menuItemId) } // Ensure correct ObjectId type
        },
        {
            $group: {
                _id: '$menuItem',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    console.log('Aggregation stats:', stats);

    try {
        if (stats.length > 0) {
            await mongoose.model('MenuItem').findByIdAndUpdate(menuItemId, {
                numberOfRatings: stats[0].nRating,
                averageRating: stats[0].avgRating
            });
             console.log(`MenuItem ${menuItemId} updated: ${stats[0].nRating} ratings, ${stats[0].avgRating} average.`);
        } else {
            // If no reviews left, reset rating
            await mongoose.model('MenuItem').findByIdAndUpdate(menuItemId, {
                numberOfRatings: 0,
                averageRating: 0 // Default to 0 or maybe null/undefined depending on schema needs
            });
             console.log(`MenuItem ${menuItemId} updated: No ratings found, reset to 0.`);
        }
    } catch (err) {
        console.error(`Error updating MenuItem ${menuItemId} ratings:`, err);
        // Consider how to handle this error - maybe retry?
    }
};
// --- End Static method ---

// --- Middleware to call calculateAverageRating after save/remove ---
// Called after a review is successfully saved (created or updated)
reviewSchema.post('save', function() {
    // 'this' points to the current review document
    // this.constructor points to the Model (Review)
    this.constructor.calculateAverageRating(this.menuItem);
});

// Called BEFORE a review is removed (findByIdAndDelete triggers findOneAndRemove)
// Need menuItemId *before* it's deleted
reviewSchema.pre('findOneAndDelete', async function(next) {
    // 'this' points to the query
    // We need to execute the query to get the document *before* deletion
    try {
        this.reviewToDelete = await this.model.findOne(this.getQuery());
        next();
    } catch (err) {
        next(err);
    }
});

// Called AFTER a review is removed
reviewSchema.post('findOneAndDelete', async function() {
    if (this.reviewToDelete) {
        await this.reviewToDelete.constructor.calculateAverageRating(this.reviewToDelete.menuItem);
    }
});
// --- End Middleware ---

// Add index for faster queries
reviewSchema.index({ menuItem: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ restaurant: 1 });
reviewSchema.index({ orderId: 1, menuItem: 1, user: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review; 
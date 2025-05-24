const Review = require('../models/review');
const MenuItem = require('../models/menuItem');
const User = require('../models/user');
const mongoose = require('mongoose');
const Order = require('../models/order');
const Restaurant = require('../models/restaurant');
const ErrorResponse = require('../utils/errorResponse');
const RiderReview = require('../models/riderReview');

/**
 * Create a review for a menu item
 * @route POST /api/reviews
 * @access Private
 */
exports.createReview = async (req, res) => {
    try {
        // Extract fields and enforce required ones
        let { orderId, menuItemId, rating, comment } = req.body;
        const userId = req.user.id;
        if (!menuItemId || rating === undefined) {
            return res.status(400).json({
                success: false,
                error: { message: 'menuItemId and rating are required', code: 'VALIDATION_ERROR' }
            });
        }
        // Validate rating range
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                error: { message: 'Rating must be between 1 and 5', code: 'VALIDATION_ERROR' }
            });
        }
        // Optional order validation
        let order = null;
        if (orderId) {
            order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ success: false, error: { message: 'Order not found', code: 'NOT_FOUND' } });
            }
            if (order.userId.toString() !== userId) {
                return res.status(403).json({ success: false, error: { message: 'You can only review items from your own orders', code: 'FORBIDDEN' } });
            }
            if (order.status !== 'DELIVERED') {
                return res.status(400).json({ success: false, error: { message: 'You can only review items after the order is delivered', code: 'VALIDATION_ERROR' } });
            }
        } else {
            orderId = null;
        }

        // 2. Optionally verify the menuItem exists in order if provided
        if (orderId && order) {
            const orderItem = order.items.find(item => item.productId && item.productId.toString() === menuItemId);
            if (!orderItem) {
                return res.status(404).json({
                    success: false,
                    error: { message: `Menu item not found in specified order`, code: 'NOT_FOUND' }
                });
            }
        }

        // 3. Get the restaurantId from the menuItem
        const menuItem = await MenuItem.findById(menuItemId);
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Menu item details not found',
                    code: 'NOT_FOUND'
                }
            });
        }
        const restaurantId = menuItem.restaurant;

        // 4. Check if a review already exists for this user, order, and menuItem
        const existingReview = await Review.findOne({ user: userId, orderId: orderId, menuItem: menuItemId });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'You have already reviewed this item for this order',
                    code: 'ALREADY_EXISTS'
                }
            });
        }

        // 5. Create the review
        const newReview = await Review.create({
            rating,
            comment,
            user: userId,
            menuItem: menuItemId,
            restaurant: restaurantId,
            orderId: orderId
        });

        res.status(201).json({
            success: true,
            data: {
                review: newReview
            }
        });
    } catch (err) {
        console.error("Error creating review:", err);
        res.status(500).json({
            success: false,
            error: {
                message: 'Server error while creating review',
                code: 'SERVER_ERROR'
            }
        });
    }
};

/**
 * Create a review for the delivery rider
 * @route POST /api/reviews/rider
 * @access Private
 */
exports.createRiderReview = async (req, res) => {
    console.log('[ReviewController] createRiderReview called with body:', req.body, 'user:', req.user?._id);

    try {
        const { orderId, rating, comment } = req.body;
        const userId = req.user.id;

        if (!orderId || !rating) {
            return res.status(400).json({ success: false, message: 'orderId and rating are required' });
        }
        // Fetch the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        // Ensure order belongs to user
        if (order.userId.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized to review this order' });
        }
        // Allow review only after delivery
        if (order.status !== 'DELIVERED') {
            return res.status(400).json({ success: false, message: 'Can only review rider after delivery' });
        }
        // Get rider ID
        const riderId = order.assignedRider || order.deliveryPersonId;
        if (!riderId) {
            return res.status(400).json({ success: false, message: 'No rider assigned to this order' });
        }
        // Check for existing review
        const existing = await RiderReview.findOne({ user: userId, orderId, rider: riderId });
        if (existing) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this rider for this order' });
        }
        // Create the rider review
        const newReview = await RiderReview.create({
            rating,
            comment,
            user: userId,
            rider: riderId,
            orderId
        });
        res.status(201).json({ success: true, data: { review: newReview } });
    } catch (err) {
        console.error('Error creating rider review:', err);
        res.status(500).json({ success: false, message: 'Server error while creating rider review' });
    }
};

/**
 * Get reviews for a menu item
 * @route GET /api/reviews/menuItem/:menuItemId
 * @access Public
 */
exports.getMenuItemReviews = async (req, res) => {
    console.log(`[getMenuItemReviews] Received request for menuItemId: ${req.params.menuItemId}`);
    try {
        const menuItemId = req.params.menuItemId;
        if (!menuItemId) {
            console.warn("[getMenuItemReviews] menuItemId is missing from params");
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Menu item ID is required',
                    code: 'VALIDATION_ERROR'
                }
            });
        }

        // Validate if menuItemId is a valid ObjectId string
        if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
            console.warn(`[getMenuItemReviews] Invalid menuItemId format: ${menuItemId}`);
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid Menu item ID format',
                    code: 'VALIDATION_ERROR'
                }
            });
        }

        console.log(`[getMenuItemReviews] Finding reviews for menuItemId: ${menuItemId}`);
        let reviews;
        try {
            reviews = await Review.find({ menuItem: menuItemId }) // Mongoose handles string to ObjectId conversion here
                .populate('user', 'fullName profilePic')
                .sort({ createdAt: -1 });
            console.log(`[getMenuItemReviews] Found ${reviews.length} reviews.`);
        } catch (findError) {
            console.error("[getMenuItemReviews] Error during Review.find():", findError);
            // This specific error might indicate issues with populate or the query itself
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Server error while finding reviews',
                    code: 'DB_FIND_ERROR',
                    details: findError.message
                }
            });
        }
        
        console.log(`[getMenuItemReviews] Aggregating stats for menuItemId: ${menuItemId}`);
        let stats;
        let typedObjectId;
        try {
            typedObjectId = new mongoose.Types.ObjectId(menuItemId); // Explicit conversion for aggregation
        } catch (conversionError) {
            console.error(`[getMenuItemReviews] Error converting menuItemId to ObjectId for aggregation: ${menuItemId}`, conversionError);
            // This should be caught by the isValid check above, but as a fallback
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid Menu item ID for aggregation',
                    code: 'INVALID_ID_AGGREGATION',
                    details: conversionError.message
                }
            });
        }

        try {
            stats = await Review.aggregate([
                { $match: { menuItem: typedObjectId } }, // Use the converted ObjectId
                { $group: { _id: '$menuItem', nRating: { $sum: 1 }, avgRating: { $avg: '$rating' } } }
            ]);
            console.log('[getMenuItemReviews] Aggregation stats:', stats);
        } catch (aggError) {
            console.error("[getMenuItemReviews] Error during Review.aggregate():", aggError);
            // This specific error would point to an aggregation stage problem
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Server error during review aggregation',
                    code: 'DB_AGGREGATE_ERROR',
                    details: aggError.message
                }
            });
        }
        
        const meta = stats.length > 0
            ? { averageRating: stats[0].avgRating, total: stats[0].nRating }
            : { averageRating: 0, total: 0 };

        console.log(`[getMenuItemReviews] Successfully fetched reviews and meta for ${menuItemId}`);
        res.status(200).json({
            success: true,
            results: reviews.length,
            data: {
                reviews,
                meta
            }
        });
    } catch (err) {
        // This is now a more general catch-all, ideally specific errors are caught above
        console.error("[getMenuItemReviews] Overall unhandled error for menuItemId:", req.params.menuItemId, err);
        res.status(500).json({
            success: false,
            error: {
                message: 'Server error while fetching reviews', // Original error message
                code: 'SERVER_ERROR',
                details: err.message // Add more details from the error
            }
        });
    }
};

/**
 * Get reviews by user
 * @route GET /api/reviews/my
 * @access Private
 */
exports.getUserReviews = async (req, res) => {
    try {
        const userId = req.user.id;

        const reviews = await Review.find({ user: userId })
            .populate('menuItem', 'item_name image')
            .populate('restaurant', 'name logo')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            results: reviews.length,
            data: {
                reviews
            }
        });
    } catch (err) {
        console.error("Error fetching user reviews:", err);
        res.status(500).json({
            success: false,
            error: {
                message: 'Server error while fetching reviews',
                code: 'SERVER_ERROR'
            }
        });
    }
};

/**
 * Update a review
 * @route PUT /api/reviews/:reviewId
 * @access Private
 */
exports.updateReview = async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const userId = req.user.id;
        const { rating, comment } = req.body;

        if (!rating && !comment) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Please provide rating or comment to update',
                    code: 'VALIDATION_ERROR'
                }
            });
        }
        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Rating must be between 1 and 5',
                    code: 'VALIDATION_ERROR'
                }
            });
        }

        const updateData = {};
        if (rating) updateData.rating = rating;
        if (comment) updateData.comment = comment;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Review not found',
                    code: 'NOT_FOUND'
                }
            });
        }

        // Check if the logged-in user is the author of the review
        if (review.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'You are not authorized to update this review',
                    code: 'FORBIDDEN'
                }
            });
        }

        // Perform the update
        const updatedReview = await Review.findByIdAndUpdate(reviewId, updateData, {
            new: true, // Return the updated document
            runValidators: true // Run schema validators on update
        });

        res.status(200).json({
            success: true,
            data: {
                review: updatedReview
            }
        });
    } catch (err) {
        console.error("Error updating review:", err);
        res.status(500).json({
            success: false,
            error: {
                message: 'Server error while updating review',
                code: 'SERVER_ERROR'
            }
        });
    }
};

/**
 * Delete a review
 * @route DELETE /api/reviews/:reviewId
 * @access Private
 */
exports.deleteReview = async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const userId = req.user.id;
        const userRole = req.user.role;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Review not found',
                    code: 'NOT_FOUND'
                }
            });
        }

        // Check if the logged-in user is the author OR an admin
        if (review.user.toString() !== userId && userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'You are not authorized to delete this review',
                    code: 'FORBIDDEN'
                }
            });
        }

        await Review.findByIdAndDelete(reviewId);

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully',
            data: null
        });
    } catch (err) {
        console.error("Error deleting review:", err);
        res.status(500).json({
            success: false,
            error: {
                message: 'Server error while deleting review',
                code: 'SERVER_ERROR'
            }
        });
    }
};

/**
 * Get reviews for a restaurant (for restaurant owners)
 * @route GET /api/reviews/restaurant
 * @access Private (restaurant owners only)
 */
exports.getRestaurantReviews = async (req, res) => {
    try {
        const ownerId = req.user.id;
        const userRole = req.user.role;

        // Ensure the user is a restaurant owner
        if (userRole !== 'restaurant') {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Access denied. Only restaurant owners can view these reviews.',
                    code: 'FORBIDDEN'
                }
            });
        }

        // Find the restaurant owned by the logged-in user
        const restaurant = await Restaurant.findOne({ owner: ownerId });

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'No restaurant found associated with this owner account',
                    code: 'NOT_FOUND'
                }
            });
        }

        const restaurantId = restaurant._id;

        // Find reviews for any menu item belonging to this restaurant
        const reviews = await Review.find({ restaurant: restaurantId })
            .populate('user', 'fullName profilePic')
            .populate('menuItem', 'item_name image')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            results: reviews.length,
            data: {
                reviews
            }
        });
    } catch (err) {
        console.error("Error fetching restaurant reviews:", err);
        res.status(500).json({
            success: false,
            error: {
                message: 'Server error while fetching restaurant reviews',
                code: 'SERVER_ERROR'
            }
        });
    }
};

/**
 * Reply to a review
 * @route PUT /api/reviews/:reviewId/reply
 * @access Private (restaurant owner only)
 */
exports.replyToReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const ownerId = req.user.id;
        const { reply } = req.body;

        if (!reply) {
            return res.status(400).json({ success: false, error: { message: 'Reply text is required', code: 'VALIDATION_ERROR' } });
        }

        // Ensure user is a restaurant owner
        if (req.user.role !== 'restaurant') {
            return res.status(403).json({ success: false, error: { message: 'Only restaurant owners can reply to reviews', code: 'FORBIDDEN' } });
        }

        // Find restaurant owned by this user
        const restaurant = await Restaurant.findOne({ owner: ownerId });
        if (!restaurant) {
            return res.status(404).json({ success: false, error: { message: 'Restaurant not found for owner', code: 'NOT_FOUND' } });
        }

        // Find the review
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, error: { message: 'Review not found', code: 'NOT_FOUND' } });
        }

        // Ensure review belongs to this restaurant
        if (review.restaurant.toString() !== restaurant._id.toString()) {
            return res.status(403).json({ success: false, error: { message: 'Cannot reply to reviews for other restaurants', code: 'FORBIDDEN' } });
        }

        // Update reply
        review.reply = reply;
        await review.save();

        res.status(200).json({ success: true, data: { review } });
    } catch (err) {
        console.error('Error replying to review:', err);
        res.status(500).json({ success: false, error: { message: 'Server error while replying to review', code: 'SERVER_ERROR' } });
    }
}; 
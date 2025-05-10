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
        const { orderId, menuItemId, rating, comment } = req.body;
        const userId = req.user.id; // From protect middleware

        // Basic validation
        if (!orderId || !menuItemId || !rating) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'OrderId, menuItemId, and rating are required',
                    code: 'VALIDATION_ERROR'
                }
            });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Rating must be between 1 and 5',
                    code: 'VALIDATION_ERROR'
                }
            });
        }

        // 1. Verify the order exists, belongs to the user, and is delivered
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Order not found',
                    code: 'NOT_FOUND'
                }
            });
        }
        if (order.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'You can only review items from your own orders',
                    code: 'FORBIDDEN'
                }
            });
        }
        // Allow review for DELIVERED or maybe COMPLETED status
        if (order.status !== 'DELIVERED') {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'You can only review items after the order is delivered',
                    code: 'VALIDATION_ERROR'
                }
            });
        }

        // 2. Verify the menuItem exists in that order
        const orderItem = order.items.find(item => item.productId && item.productId.toString() === menuItemId);
        if (!orderItem) {
            return res.status(404).json({
                success: false,
                error: {
                    message: `Menu item ${menuItemId} not found in order ${orderId}`,
                    code: 'NOT_FOUND'
                }
            });
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
    try {
        const menuItemId = req.params.menuItemId;
        if (!menuItemId) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Menu item ID is required',
                    code: 'VALIDATION_ERROR'
                }
            });
        }

        const reviews = await Review.find({ menuItem: menuItemId })
            .populate('user', 'name profileImage')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            results: reviews.length,
            data: {
                reviews
            }
        });
    } catch (err) {
        console.error("Error fetching menu item reviews:", err);
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
            .populate('user', 'name profileImage')
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
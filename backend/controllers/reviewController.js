const { Review } = require('../models/review');
const { MenuItem } = require('../models/menuItem');
const User = require('../models/user');
const mongoose = require('mongoose');

/**
 * Create a review for a menu item
 * @route POST /api/reviews
 * @access Private
 */
exports.createReview = async (req, res) => {
    try {
        const { menuItemId, rating, comment, orderId } = req.body;
        const userId = req.user._id;
        
        // Validate input
        if (!menuItemId || !rating || !orderId) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Menu item ID, rating, and order ID are required',
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
        
        // Verify menu item exists
        const menuItem = await MenuItem.findById(menuItemId);
        
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Menu item not found',
                    code: 'NOT_FOUND'
                }
            });
        }
        
        // Check if user has already reviewed this menu item for this order
        const existingReview = await Review.findOne({
            user: userId,
            menuItem: menuItemId,
            orderId
        });
        
        if (existingReview) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'You have already reviewed this item for this order',
                    code: 'ALREADY_EXISTS'
                }
            });
        }
        
        // Create new review
        const review = new Review({
            user: userId,
            menuItem: menuItemId,
            restaurant: menuItem.restaurant,
            rating,
            comment: comment || '',
            orderId
        });
        
        await review.save();
        
        return res.status(201).json({
            success: true,
            message: 'Review created successfully',
            data: {
                review: {
                    id: review._id,
                    rating: review.rating,
                    comment: review.comment,
                    date: review.date
                }
            }
        });
    } catch (error) {
        console.error('Error creating review:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Server error. Please try again.',
                code: 'SERVER_ERROR'
            }
        });
    }
};

/**
 * Get reviews for a menu item
 * @route GET /api/reviews/menuItem/:menuItemId
 * @access Public
 */
exports.getMenuItemReviews = async (req, res) => {
    try {
        const { menuItemId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Validate menu item ID
        if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid menu item ID',
                    code: 'VALIDATION_ERROR'
                }
            });
        }
        
        // Find all reviews for the menu item
        const reviews = await Review.find({ menuItem: menuItemId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'fullName')
            .lean();
        
        // Get total count
        const total = await Review.countDocuments({ menuItem: menuItemId });
        
        // Calculate average rating
        const avgRating = await Review.aggregate([
            { $match: { menuItem: mongoose.Types.ObjectId(menuItemId) } },
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]);
        
        const averageRating = avgRating.length > 0 ? avgRating[0].avgRating : 0;
        
        // Transform reviews for client
        const formattedReviews = reviews.map(review => ({
            id: review._id,
            rating: review.rating,
            comment: review.comment,
            date: review.createdAt,
            user: {
                id: review.user._id,
                name: review.user.fullName
            },
            helpful: review.helpful,
            isVerified: review.isVerified
        }));
        
        return res.status(200).json({
            success: true,
            data: {
                reviews: formattedReviews,
                meta: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                    averageRating: Number(averageRating.toFixed(1))
                }
            }
        });
    } catch (error) {
        console.error('Error fetching menu item reviews:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Server error. Please try again.',
                code: 'SERVER_ERROR'
            }
        });
    }
};

/**
 * Get reviews by user
 * @route GET /api/reviews/user
 * @access Private
 */
exports.getUserReviews = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Find all reviews by the user
        const reviews = await Review.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('menuItem', 'item_name image')
            .populate('restaurant', 'restaurantDetails.name')
            .lean();
        
        // Get total count
        const total = await Review.countDocuments({ user: userId });
        
        // Transform reviews for client
        const formattedReviews = reviews.map(review => ({
            id: review._id,
            rating: review.rating,
            comment: review.comment,
            date: review.createdAt,
            menuItem: {
                id: review.menuItem._id,
                name: review.menuItem.item_name,
                image: review.menuItem.image
            },
            restaurant: {
                id: review.restaurant._id,
                name: review.restaurant.restaurantDetails?.name || 'Restaurant'
            }
        }));
        
        return res.status(200).json({
            success: true,
            data: {
                reviews: formattedReviews,
                meta: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching user reviews:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Server error. Please try again.',
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
        const { reviewId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user._id;
        
        // Validate input
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Rating must be between 1 and 5',
                    code: 'VALIDATION_ERROR'
                }
            });
        }
        
        // Find review by ID
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
        
        // Check if user owns the review
        if (review.user.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Not authorized to update this review',
                    code: 'FORBIDDEN'
                }
            });
        }
        
        // Update review
        review.rating = rating;
        review.comment = comment || '';
        
        await review.save();
        
        return res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            data: {
                review: {
                    id: review._id,
                    rating: review.rating,
                    comment: review.comment,
                    date: review.date
                }
            }
        });
    } catch (error) {
        console.error('Error updating review:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Server error. Please try again.',
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
        const { reviewId } = req.params;
        const userId = req.user._id;
        
        // Find review by ID
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
        
        // Check if user owns the review or is admin
        const user = await User.findById(userId);
        
        if (review.user.toString() !== userId.toString() && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Not authorized to delete this review',
                    code: 'FORBIDDEN'
                }
            });
        }
        
        // Delete review
        await Review.findByIdAndDelete(reviewId);
        
        return res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Server error. Please try again.',
                code: 'SERVER_ERROR'
            }
        });
    }
}; 
const express = require('express');
const router = express.Router();
const { 
    createReview, 
    createRiderReview, 
    getMenuItemReviews, 
    getUserReviews, 
    getRestaurantReviews,
    updateReview, 
    deleteReview, 
    replyToReview
} = require('../controllers/reviewController');
const { protect, authorize, restaurant } = require('../middleware/authMiddleware');

// Public routes
router.get('/menuItem/:menuItemId', getMenuItemReviews);

// Protected routes
router.use(protect);

router.post('/', authorize('customer'), createReview);
router.post('/rider', authorize('customer'), createRiderReview);
router.get('/my', authorize('customer'), getUserReviews);
router.get('/restaurant', restaurant, getRestaurantReviews);

// Restaurant owner reply to a review
router.put('/:reviewId/reply', restaurant, replyToReview);

router.route('/:reviewId')
    .put(authorize('customer'), updateReview)
    .delete(authorize('customer', 'admin'), deleteReview);

module.exports = router; 
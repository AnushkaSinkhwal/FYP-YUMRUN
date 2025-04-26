const express = require('express');
const router = express.Router();
const { 
    createReview, 
    getMenuItemReviews, 
    getUserReviews, 
    getRestaurantReviews,
    updateReview, 
    deleteReview 
} = require('../controllers/reviewController');
const { protect, authorize, restaurant } = require('../middleware/authMiddleware');

// Public routes
router.get('/menuItem/:menuItemId', getMenuItemReviews);

// Protected routes
router.use(protect);

router.post('/', authorize('user'), createReview);
router.get('/my', authorize('user'), getUserReviews);
router.get('/restaurant', restaurant, getRestaurantReviews);
router.route('/:reviewId')
    .put(authorize('user'), updateReview)
    .delete(authorize('user', 'admin'), deleteReview);

module.exports = router; 
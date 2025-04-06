const express = require('express');
const router = express.Router();
const { 
    createReview, 
    getMenuItemReviews, 
    getUserReviews, 
    updateReview, 
    deleteReview 
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/menuItem/:menuItemId', getMenuItemReviews);

// Protected routes
router.post('/', protect, createReview);
router.get('/user', protect, getUserReviews);
router.put('/:reviewId', protect, updateReview);
router.delete('/:reviewId', protect, deleteReview);

module.exports = router; 
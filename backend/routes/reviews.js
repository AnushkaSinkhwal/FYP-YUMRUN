const express = require('express');
const router = express.Router();
const { Review } = require('../models/review');
const { Restaurant } = require('../models/restaurant');
const { auth } = require('../middleware/auth');

// GET all reviews
router.get('/', async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('user', 'name')
            .populate('restaurant', 'name');
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET review by ID
router.get('/:id', async (req, res) => {
    try {
        const review = await Review.findById(req.params.id)
            .populate('user', 'name')
            .populate('restaurant', 'name');
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        res.status(200).json(review);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET reviews by restaurant ID
router.get('/restaurant/:restaurantId', async (req, res) => {
    try {
        const reviews = await Review.find({ restaurant: req.params.restaurantId })
            .populate('user', 'name');
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET reviews by user ID
router.get('/user/:userId', async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.params.userId })
            .populate('restaurant', 'name');
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST write a new review
router.post('/', auth, async (req, res) => {
    try {
        const review = new Review({
            rating: req.body.rating,
            comment: req.body.comment,
            user: req.user.id,
            restaurant: req.body.restaurant
        });

        const savedReview = await review.save();

        // Update restaurant rating
        const restaurant = await Restaurant.findById(req.body.restaurant);
        if (restaurant) {
            const reviews = await Review.find({ restaurant: req.body.restaurant });
            const totalRating = reviews.reduce((sum, item) => sum + item.rating, 0);
            const avgRating = totalRating / reviews.length;
            
            await Restaurant.findByIdAndUpdate(
                req.body.restaurant,
                {
                    avgRating,
                    totalReviews: reviews.length
                }
            );
        }

        res.status(201).json(savedReview);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT update review
router.put('/:id', auth, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Check if the user is the owner of the review
        if (review.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'User not authorized to update this review' });
        }

        const updatedReview = await Review.findByIdAndUpdate(
            req.params.id,
            {
                rating: req.body.rating,
                comment: req.body.comment
            },
            { new: true }
        );

        // Update restaurant rating
        const restaurant = await Restaurant.findById(review.restaurant);
        if (restaurant) {
            const reviews = await Review.find({ restaurant: review.restaurant });
            const totalRating = reviews.reduce((sum, item) => sum + item.rating, 0);
            const avgRating = totalRating / reviews.length;
            
            await Restaurant.findByIdAndUpdate(
                review.restaurant,
                {
                    avgRating,
                    totalReviews: reviews.length
                }
            );
        }

        res.status(200).json(updatedReview);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE review
router.delete('/:id', auth, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Check if the user is the owner of the review
        if (review.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'User not authorized to delete this review' });
        }

        await Review.findByIdAndRemove(req.params.id);

        // Update restaurant rating
        const restaurant = await Restaurant.findById(review.restaurant);
        if (restaurant) {
            const reviews = await Review.find({ restaurant: review.restaurant });
            const totalRating = reviews.length > 0 ? reviews.reduce((sum, item) => sum + item.rating, 0) : 0;
            const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;
            
            await Restaurant.findByIdAndUpdate(
                review.restaurant,
                {
                    avgRating,
                    totalReviews: reviews.length
                }
            );
        }

        res.status(200).json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router; 
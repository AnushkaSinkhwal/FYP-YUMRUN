const express = require('express');
const router = express.Router();
const { getHealthRecommendations, getPersonalizedRecommendations } = require('../controllers/recommendationsController');
const { auth, isRestaurantOwner } = require('../middleware/auth');
const MenuItem = require('../models/menuItem');
const Restaurant = require('../models/restaurant');
const User = require('../models/user');

// GET personalized recommendations based on past orders and preferences
router.get('/personalized/:userId', auth, getPersonalizedRecommendations);

// GET health-based recommendations - Updated to use controller
router.get('/', getHealthRecommendations);

// Keep the legacy route for backward compatibility
router.get('/health/:condition', (req, res) => {
    // Pass the condition as a query parameter to the new controller
    req.query.healthCondition = req.params.condition;
    getHealthRecommendations(req, res);
});

// GET popular items recommendations
router.get('/popular', (req, res) => {
    res.status(200).json({ message: 'Popular items recommendations' });
});

// GET recommendations based on previous orders
router.get('/history/:userId', auth, (req, res) => {
    // Redirect to the new personalized endpoint
    req.params.userId = req.params.userId;
    getPersonalizedRecommendations(req, res);
});

module.exports = router; 
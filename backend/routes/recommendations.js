const express = require('express');
const router = express.Router();
const { getHealthRecommendations } = require('../controllers/recommendationsController');

// GET personalized recommendations for user
router.get('/user/:userId', (req, res) => {
    res.status(200).json({ message: `Personalized recommendations for user ID: ${req.params.userId}` });
});

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
router.get('/history/:userId', (req, res) => {
    res.status(200).json({ message: `Recommendations based on history for user ID: ${req.params.userId}` });
});

module.exports = router; 
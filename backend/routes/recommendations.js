const express = require('express');
const router = express.Router();

// GET personalized recommendations for user
router.get('/user/:userId', (req, res) => {
    res.status(200).json({ message: `Personalized recommendations for user ID: ${req.params.userId}` });
});

// GET health-based recommendations
router.get('/health/:condition', (req, res) => {
    res.status(200).json({ message: `Recommendations for health condition: ${req.params.condition}` });
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
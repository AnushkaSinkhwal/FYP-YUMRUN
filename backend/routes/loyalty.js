const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const loyaltyController = require('../controllers/loyaltyController');

// GET user loyalty points
router.get('/user/:userId', auth, loyaltyController.getUserPoints);

// POST add loyalty points
router.post('/add', auth, loyaltyController.addPoints);

// POST redeem loyalty points
router.post('/redeem', auth, loyaltyController.redeemPoints);

// GET loyalty history for user
router.get('/history/:userId', auth, loyaltyController.getPointsHistory);

// GET available rewards
router.get('/rewards', loyaltyController.getAvailableRewards);

module.exports = router; 
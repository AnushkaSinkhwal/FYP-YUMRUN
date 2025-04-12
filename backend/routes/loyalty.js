const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const loyaltyController = require('../controllers/loyaltyController');

// Get user's loyalty information with tier benefits
router.get('/info', protect, loyaltyController.getLoyaltyInfo);

// Get user's transaction history with pagination
router.get('/transactions', protect, loyaltyController.getLoyaltyTransactions);

// Add points from completed order
router.post('/earn', protect, loyaltyController.addOrderPoints);

// Redeem points for rewards
router.post('/redeem', protect, loyaltyController.redeemPoints);

// Admin endpoint to adjust user points (admin only)
router.post('/adjust', 
  protect, 
  authorize('admin'), 
  loyaltyController.adjustPoints
);

// Process expired points (admin/system only)
router.post('/process-expired', 
  protect, 
  authorize('admin'), 
  loyaltyController.processExpiredPoints
);

module.exports = router; 
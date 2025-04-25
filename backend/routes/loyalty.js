const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const loyaltyController = require('../controllers/loyaltyController');
const LoyaltyPoint = require('../models/loyaltyPoint');
const LoyaltyHistory = require('../models/loyaltyHistory');
const LoyaltyReward = require('../models/loyaltyReward');

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

/**
 * @route   GET /api/loyalty/user/me
 * @desc    Get user's loyalty points
 * @access  Private
 */
router.get('/user/me', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find the user's loyalty points
    let loyaltyData = await LoyaltyPoint.findOne({ userId });
    
    // If no loyalty data exists, create one
    if (!loyaltyData) {
      loyaltyData = new LoyaltyPoint({
        userId,
        points: 0,
        lifetimePoints: 0,
        tier: 'BRONZE'
      });
      
      await loyaltyData.save();
    }
    
    return res.status(200).json({
      success: true,
      data: {
        points: loyaltyData.points,
        tier: loyaltyData.tier,
        lifetimePoints: loyaltyData.lifetimePoints
      }
    });
  } catch (error) {
    console.error('Error fetching loyalty points:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching loyalty points'
    });
  }
});

/**
 * @route   GET /api/loyalty/history/me
 * @desc    Get user's loyalty points history
 * @access  Private
 */
router.get('/history/me', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find the user's loyalty history
    const history = await LoyaltyHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);
    
    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching loyalty history:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching loyalty history'
    });
  }
});

/**
 * @route   GET /api/loyalty/rewards
 * @desc    Get available loyalty rewards
 * @access  Private
 */
router.get('/rewards', protect, async (req, res) => {
  try {
    // Find active rewards
    const rewards = await LoyaltyReward.find({ active: true });
    
    return res.status(200).json({
      success: true,
      data: rewards
    });
  } catch (error) {
    console.error('Error fetching loyalty rewards:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching loyalty rewards'
    });
  }
});

/**
 * @route   POST /api/loyalty/redeem
 * @desc    Redeem loyalty points for a reward
 * @access  Private
 */
router.post('/redeem', protect, async (req, res) => {
  try {
    const { points, rewardId } = req.body;
    const userId = req.user._id;
    
    // Validate input
    if (!points || !rewardId) {
      return res.status(400).json({
        success: false,
        message: 'Points and reward ID are required'
      });
    }
    
    // Find the user's loyalty points
    let loyaltyData = await LoyaltyPoint.findOne({ userId });
    
    // If no loyalty data exists or not enough points
    if (!loyaltyData || loyaltyData.points < points) {
      return res.status(400).json({
        success: false,
        message: 'Not enough points to redeem this reward'
      });
    }
    
    // Find the reward
    const reward = await LoyaltyReward.findById(rewardId);
    
    if (!reward || !reward.active) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found or not available'
      });
    }
    
    // Verify points required
    if (reward.pointsRequired > points) {
      return res.status(400).json({
        success: false,
        message: `This reward requires ${reward.pointsRequired} points`
      });
    }
    
    // Update loyalty points
    loyaltyData.points -= points;
    await loyaltyData.save();
    
    // Create history record
    const history = new LoyaltyHistory({
      userId,
      points: points,
      action: 'redeemed',
      reason: `Redeemed for ${reward.name}`,
      rewardId: reward._id
    });
    
    await history.save();
    
    return res.status(200).json({
      success: true,
      data: {
        points: loyaltyData.points,
        reward: reward.name,
        pointsRedeemed: points
      },
      message: `Successfully redeemed ${points} points for ${reward.name}`
    });
  } catch (error) {
    console.error('Error redeeming loyalty points:', error);
    return res.status(500).json({
      success: false,
      message: 'Error redeeming loyalty points'
    });
  }
});

/**
 * @route   POST /api/loyalty/add
 * @desc    Add loyalty points to a user (admin only)
 * @access  Private/Admin
 */
router.post('/add', protect, async (req, res) => {
  try {
    // Check if admin (implement this middleware)
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to perform this action'
      });
    }
    
    const { userId, points, reason } = req.body;
    
    if (!userId || !points || !reason) {
      return res.status(400).json({
        success: false,
        message: 'User ID, points, and reason are required'
      });
    }
    
    // Find the user's loyalty points
    let loyaltyData = await LoyaltyPoint.findOne({ userId });
    
    // If no loyalty data exists, create one
    if (!loyaltyData) {
      loyaltyData = new LoyaltyPoint({
        userId,
        points: 0,
        lifetimePoints: 0,
        tier: 'BRONZE'
      });
    }
    
    // Update loyalty points
    loyaltyData.points += points;
    loyaltyData.lifetimePoints += points;
    
    // Update tier if needed
    loyaltyData.tier = calculateTier(loyaltyData.lifetimePoints);
    
    await loyaltyData.save();
    
    // Create history record
    const history = new LoyaltyHistory({
      userId,
      points,
      action: 'earned',
      reason: reason || 'Admin adjustment',
    });
    
    await history.save();
    
    return res.status(200).json({
      success: true,
      data: {
        points: loyaltyData.points,
        tier: loyaltyData.tier,
        lifetimePoints: loyaltyData.lifetimePoints
      },
      message: `Successfully added ${points} points to user`
    });
  } catch (error) {
    console.error('Error adding loyalty points:', error);
    return res.status(500).json({
      success: false,
      message: 'Error adding loyalty points'
    });
  }
});

/**
 * Helper function to calculate the tier based on lifetime points
 */
function calculateTier(lifetimePoints) {
  if (lifetimePoints >= 10000) return 'PLATINUM';
  if (lifetimePoints >= 7000) return 'GOLD';
  if (lifetimePoints >= 1000) return 'SILVER';
  return 'BRONZE';
}

module.exports = router; 
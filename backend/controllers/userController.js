const User = require('../models/user');
const { LoyaltyPoints } = require('../models/loyalty');
const Order = require('../models/order');

/**
 * Get count of unread notifications for a user
 * @route GET /api/user/notifications/unread-count
 * @access Private
 */
exports.getUnreadNotificationsCount = async (req, res) => {
  try {
    // For now, just return 0 as we haven't implemented the real notifications system yet
    return res.status(200).json({
      success: true,
      data: {
        count: 0
      }
    });
    
    // TODO: When notifications are implemented, replace with actual count:
    // const count = await Notification.countDocuments({ 
    //   user: req.user._id,
    //   read: false
    // });
    
    // return res.status(200).json({
    //   success: true,
    //   data: {
    //     count
    //   }
    // });
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Server error. Please try again.',
        code: 'SERVER_ERROR'
      }
    });
  }
};

/**
 * Get user profile
 * @route GET /api/user/profile
 * @access Private
 */
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'NOT_FOUND'
        }
      });
    }

    // Get loyalty points
    const loyaltyPoints = user.loyaltyPoints || 0;
    
    // Format response without sensitive data
    const userProfile = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      healthCondition: user.healthCondition,
      healthProfile: user.healthProfile,
      settings: user.settings,
      favorites: user.favorites,
      loyaltyPoints,
      createdAt: user.createdAt
    };

    // Add role-specific data
    if (user.role === 'restaurant') {
      userProfile.restaurantDetails = user.restaurantDetails;
    } else if (user.role === 'delivery_rider') {
      userProfile.deliveryRiderDetails = user.deliveryRiderDetails;
    }

    return res.status(200).json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Server error. Please try again.',
        code: 'SERVER_ERROR'
      }
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/user/profile
 * @access Private
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      address,
      healthCondition
    } = req.body;

    // Find user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'NOT_FOUND'
        }
      });
    }

    // Update basic profile fields
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    
    // Update health condition if user is a customer
    if (user.role === 'customer' && healthCondition) {
      user.healthCondition = healthCondition;
    }

    // Save updated user
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        healthCondition: user.healthCondition
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: {
          message: messages.join(', '),
          code: 'VALIDATION_ERROR'
        }
      });
    }
    
    return res.status(500).json({
      success: false,
      error: {
        message: 'Server error. Please try again.',
        code: 'SERVER_ERROR'
      }
    });
  }
};

/**
 * Update user health profile
 * @route PUT /api/user/health-profile
 * @access Private
 */
exports.updateHealthProfile = async (req, res) => {
  try {
    const { healthProfile } = req.body;
    
    if (!healthProfile) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Health profile data is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    // Find user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'NOT_FOUND'
        }
      });
    }

    // Only allow customers to update health profile
    if (user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Only customers can update health profiles',
          code: 'FORBIDDEN'
        }
      });
    }

    // Update health profile fields
    user.healthProfile = {
      ...user.healthProfile,
      ...healthProfile
    };

    // Save updated user
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Health profile updated successfully',
      data: {
        healthProfile: user.healthProfile
      }
    });
  } catch (error) {
    console.error('Error updating health profile:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: {
          message: messages.join(', '),
          code: 'VALIDATION_ERROR'
        }
      });
    }
    
    return res.status(500).json({
      success: false,
      error: {
        message: 'Server error. Please try again.',
        code: 'SERVER_ERROR'
      }
    });
  }
};

/**
 * Get user's order history with nutritional information
 * @route GET /api/user/order-history
 * @access Private
 */
exports.getOrderHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all orders for this user
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .populate('items.productId');
    
    // Format response with nutritional data
    const orderHistory = orders.map(order => ({
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalPrice: order.totalPrice,
      totalNutritionalInfo: order.totalNutritionalInfo,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        id: item._id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        nutritionalInfo: item.nutritionalInfo
      }))
    }));

    return res.status(200).json({
      success: true,
      data: orderHistory
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Server error. Please try again.',
        code: 'SERVER_ERROR'
      }
    });
  }
};

/**
 * Get user's loyalty points and history
 * @route GET /api/user/loyalty
 * @access Private
 */
exports.getLoyaltyDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user with loyalty points
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'NOT_FOUND'
        }
      });
    }

    const { calculateTier, getTierBenefits, LOYALTY_TIERS } = require('../utils/loyaltyUtils');
    
    // Get user's current tier and benefits
    const tier = user.loyaltyTier;
    const tierBenefits = getTierBenefits(tier);
    
    // Calculate points needed for next tier
    let nextTier = null;
    let pointsToNextTier = 0;
    
    if (tier !== 'PLATINUM') {
      // Find the next tier
      const tiers = Object.keys(LOYALTY_TIERS);
      const currentTierIndex = tiers.indexOf(tier);
      nextTier = tiers[currentTierIndex + 1];
      
      if (nextTier) {
        pointsToNextTier = LOYALTY_TIERS[nextTier] - user.lifetimeLoyaltyPoints;
      }
    }
    
    // Get loyalty history (last 10 transactions)
    const LoyaltyTransaction = require('../models/loyaltyTransaction');
    const loyaltyHistory = await LoyaltyTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10);
    
    return res.status(200).json({
      success: true,
      data: {
        currentPoints: user.loyaltyPoints,
        lifetimePoints: user.lifetimeLoyaltyPoints,
        currentTier: tier,
        tierBenefits,
        nextTier,
        pointsToNextTier: pointsToNextTier > 0 ? pointsToNextTier : 0,
        tierUpdateDate: user.tierUpdateDate,
        history: loyaltyHistory
      }
    });
  } catch (error) {
    console.error('Error fetching loyalty details:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Server error. Please try again.',
        code: 'SERVER_ERROR'
      }
    });
  }
}; 
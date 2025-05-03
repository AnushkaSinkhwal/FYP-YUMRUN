const User = require('../models/user');
const { LoyaltyPoints } = require('../models/loyalty');
const Order = require('../models/order');
const Restaurant = require('../models/restaurant');
const Notification = require('../models/notification');
const recommendationService = require('../services/recommendationService');

/**
 * Get count of unread notifications for a user
 * @route GET /api/user/notifications/unread-count
 * @access Private
 */
exports.getUnreadNotificationsCount = async (req, res) => {
  try {
    // For now, just return 0 as we haven't implemented the real notifications system yet
    /* return res.status(200).json({
      success: true,
      data: {
        count: 0
      }
    }); */
    
    // TODO: When notifications are implemented, replace with actual count:
    const count = await Notification.countDocuments({ 
      userId: req.user._id,
      isRead: false,
      isAdminNotification: { $ne: true }
    });
    
    return res.status(200).json({
      success: true,
      count
    });
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
    // Fetch user, excluding password related fields and populate restaurantId
    const user = await User.findById(req.user._id)
      .select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationOTP -emailVerificationOTPExpires')
      .populate('restaurantId', '_id name status address');
    
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
    
    // Format response object from user data
    const userProfile = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      healthCondition: user.healthCondition,
      healthProfile: user.healthProfile,
      favorites: user.favorites,
      loyaltyPoints,
      createdAt: user.createdAt,
      notifications: user.notifications,
      deliveryRiderDetails: user.deliveryRiderDetails,
      // Include the populated restaurantId directly
      restaurantId: user.restaurantId
    };

    return res.status(200).json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Server error while fetching user profile',
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
      healthCondition,
      notifications
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

    // Update notification settings if provided
    if (notifications) {
       // Ensure we merge, not overwrite completely, or handle partial updates
       // A simple merge works if the frontend sends the complete object
       user.notifications = { ...user.notifications, ...notifications };
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
        healthCondition: user.healthCondition,
        notifications: user.notifications
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
    const healthProfile = req.body.healthProfile;
    
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

    // Validate health profile data
    if (healthProfile.dietaryPreferences) {
      // Ensure dietaryPreferences is an array
      if (!Array.isArray(healthProfile.dietaryPreferences)) {
        healthProfile.dietaryPreferences = [healthProfile.dietaryPreferences];
      }
      
      // If 'None' is present with other options, remove 'None'
      if (healthProfile.dietaryPreferences.includes('None') && healthProfile.dietaryPreferences.length > 1) {
        healthProfile.dietaryPreferences = healthProfile.dietaryPreferences.filter(pref => pref !== 'None');
      }
    }
    
    if (healthProfile.healthConditions) {
      // Ensure healthConditions is an array
      if (!Array.isArray(healthProfile.healthConditions)) {
        healthProfile.healthConditions = [healthProfile.healthConditions];
      }
      
      // If 'None' is present with other options, remove 'None'
      if (healthProfile.healthConditions.includes('None') && healthProfile.healthConditions.length > 1) {
        healthProfile.healthConditions = healthProfile.healthConditions.filter(cond => cond !== 'None');
      }
    }
    
    // Ensure macroTargets percentages add up to 100%
    if (healthProfile.macroTargets) {
      const { protein, carbs, fat } = healthProfile.macroTargets;
      const total = (protein || 0) + (carbs || 0) + (fat || 0);
      
      if (total !== 100) {
        // Adjust proportionally to make total 100%
        const ratio = 100 / total;
        healthProfile.macroTargets.protein = Math.round((protein || 0) * ratio);
        healthProfile.macroTargets.carbs = Math.round((carbs || 0) * ratio);
        healthProfile.macroTargets.fat = Math.round((fat || 0) * ratio);
      }
    }

    // Update health profile with new validated data
    user.healthProfile = {
      ...user.healthProfile || {},
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

/**
 * Update delivery rider details
 * @route PUT /api/user/delivery-details
 * @access Private (Delivery Rider only)
 */
exports.updateDeliveryDetails = async (req, res) => {
  try {
    const {
      vehicleType,
      licenseNumber,
      vehicleRegistrationNumber,
      isAvailable
    } = req.body;

    // Find user and ensure they are a delivery rider
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'NOT_FOUND' }
      });
    }

    if (user.role !== 'delivery_rider') {
       return res.status(403).json({
        success: false,
        error: { message: 'Access denied. Only delivery riders can update these details.', code: 'FORBIDDEN' }
      });     
    }

    // Update fields within the deliveryRiderDetails sub-document
    const updates = {};
    if (vehicleType !== undefined) updates['deliveryRiderDetails.vehicleType'] = vehicleType;
    if (licenseNumber !== undefined) updates['deliveryRiderDetails.licenseNumber'] = licenseNumber;
    if (vehicleRegistrationNumber !== undefined) updates['deliveryRiderDetails.vehicleRegistrationNumber'] = vehicleRegistrationNumber;
    if (isAvailable !== undefined) updates['deliveryRiderDetails.isAvailable'] = isAvailable;

    // Only update if there are changes
    if (Object.keys(updates).length === 0) {
       return res.status(200).json({ 
         success: true, 
         message: 'No delivery details provided for update.', 
         data: user.deliveryRiderDetails 
       });
    }

    // Use findByIdAndUpdate for atomic updates on sub-documents if preferred,
    // but direct modification and save also works here.
    // Update the fields directly on the user object found earlier
    if (user.deliveryRiderDetails) {
        if (vehicleType !== undefined) user.deliveryRiderDetails.vehicleType = vehicleType;
        if (licenseNumber !== undefined) user.deliveryRiderDetails.licenseNumber = licenseNumber;
        if (vehicleRegistrationNumber !== undefined) user.deliveryRiderDetails.vehicleRegistrationNumber = vehicleRegistrationNumber;
        if (isAvailable !== undefined) user.deliveryRiderDetails.isAvailable = isAvailable;
    } else {
        // If sub-document doesn't exist, create it (should exist from registration)
        user.deliveryRiderDetails = { vehicleType, licenseNumber, vehicleRegistrationNumber, isAvailable };
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Delivery details updated successfully',
      data: user.deliveryRiderDetails // Return updated details
    });

  } catch (error) {
    console.error('Error updating delivery details:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: { message: messages.join(', '), code: 'VALIDATION_ERROR' }
      });
    }
    
    return res.status(500).json({
      success: false,
      error: { message: 'Server error. Please try again.', code: 'SERVER_ERROR' }
    });
  }
};

/**
 * Get food recommendations for the current user
 * @route GET /api/user/recommendations
 * @access Private
 */
exports.getUserRecommendations = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming user ID is available from auth middleware
    
    if (!userId) {
       return res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated',
          code: 'UNAUTHORIZED'
        }
      });
    }
    
    console.log(`Controller: Request received for recommendations for user ID: ${userId}`);
    
    const recommendations = await recommendationService.getRecommendationsForUser(userId);
    
    console.log(`Controller: Sending ${recommendations.length} recommendations.`);

    return res.status(200).json({
      success: true,
      data: recommendations
    });
    
  } catch (error) {
    console.error('Error fetching user recommendations:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Server error while fetching recommendations',
        code: 'SERVER_ERROR'
      }
    });
  }
};

/**
 * Add a favorite menu item for the current user
 * @route POST /api/user/favorites
 * @access Private
 */
exports.addFavorite = async (req, res) => {
  try {
    const { itemId } = req.body;
    const userId = req.user._id;
    
    if (!itemId) {
       return res.status(400).json({
        success: false,
        error: { message: 'Menu Item ID is required', code: 'VALIDATION_ERROR' }
      });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'NOT_FOUND' }
      });
    }
    
    // Add to favorites if not already present
    if (!user.favorites.includes(itemId)) {
      user.favorites.push(itemId);
      await user.save();
      console.log(`User ${userId} added item ${itemId} to favorites.`);
      return res.status(200).json({
        success: true,
        message: 'Item added to favorites',
        data: user.favorites // Return updated favorites list
      });
    } else {
      console.log(`Item ${itemId} already in favorites for user ${userId}.`);
      return res.status(200).json({ // Or status 409 Conflict if preferred
        success: true, // Still successful in the sense that the item *is* in favorites
        message: 'Item already in favorites',
        data: user.favorites
      });
    }
    
  } catch (error) {
    console.error('Error adding favorite:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Server error while adding favorite', code: 'SERVER_ERROR' }
    });
  }
}; 
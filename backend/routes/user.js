const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user'); // Import the User model
const router = express.Router();
const { body, validationResult } = require('express-validator'); // For validation
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');
const Notification = require('../models/notification');
const RestaurantApproval = require('../models/restaurantApproval');
const { auth } = require('../middleware/auth');
const mongoose = require('mongoose');
const userController = require('../controllers/userController');

// Sign Up Route
router.post(
  '/signup',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('phone').isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[0-9]/).withMessage('Password must contain at least one number')
      .matches(/[^a-zA-Z0-9]/).withMessage('Password must contain at least one special character'),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, email, password, healthCondition } = req.body;

    try {
      // Check if email already exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      // Create a new user
      const newUser = new User({
        name,
        phone,
        email,
        password,
        healthCondition
      });

      // Hash the password before saving
      const salt = await bcrypt.genSalt(10);
      newUser.password = await bcrypt.hash(password, salt);

      // Save the user to the database
      await newUser.save();

      // Send a success response
      res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error });
    }
  }
);

// POST sign up
router.post('/register', async (req, res) => {
    try {
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            healthCondition: req.body.healthCondition || 'Healthy',
            isAdmin: req.body.isAdmin || false,
            isRestaurantOwner: req.body.isRestaurantOwner || false,
            isDeliveryStaff: req.body.isDeliveryStaff || false
        });

        await user.save();

        const token = jwt.sign(
            { 
                id: user.id, 
                isAdmin: user.isAdmin,
                isRestaurantOwner: user.isRestaurantOwner,
                isDeliveryStaff: user.isDeliveryStaff
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                healthCondition: user.healthCondition,
                isAdmin: user.isAdmin,
                isRestaurantOwner: user.isRestaurantOwner,
                isDeliveryStaff: user.isDeliveryStaff
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Validate password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { 
                id: user.id, 
                isAdmin: user.isAdmin,
                isRestaurantOwner: user.isRestaurantOwner,
                isDeliveryStaff: user.isDeliveryStaff
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                healthCondition: user.healthCondition,
                isAdmin: user.isAdmin,
                isRestaurantOwner: user.isRestaurantOwner,
                isDeliveryStaff: user.isDeliveryStaff
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// User Profile Routes

/**
 * @route   GET /api/user/profile
 * @desc    Get the current user's profile
 * @access  Private
 */
router.get('/profile', protect, userController.getUserProfile);

/**
 * @route   PUT /api/user/profile
 * @desc    Update the current user's profile
 * @access  Private
 */
router.put('/profile', protect, userController.updateUserProfile);

/**
 * @route   PUT /api/user/health-profile
 * @desc    Update the current user's health profile
 * @access  Private
 */
router.put('/health-profile', protect, userController.updateHealthProfile);

/**
 * @route   GET /api/user/order-history
 * @desc    Get the user's order history with nutritional information
 * @access  Private
 */
router.get('/order-history', protect, userController.getOrderHistory);

/**
 * @route   GET /api/user/loyalty
 * @desc    Get the user's loyalty points and history
 * @access  Private
 */
router.get('/loyalty', protect, userController.getLoyaltyDetails);

/**
 * @route   GET /api/user/notifications/unread-count
 * @desc    Get count of unread notifications for a user
 * @access  Private
 */
router.get('/notifications/unread-count', protect, userController.getUnreadNotificationsCount);

/**
 * @route   PUT /api/user/profile/email
 * @desc    Request to update user's email (requires admin approval)
 * @access  Private
 */
router.put('/profile/email', protect, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Check if email is already in use
    const existingUser = await User.findOne({ email, _id: { $ne: req.user.userId } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already in use'
      });
    }
    
    // Find the user
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Create an approval request
    const approvalRequest = new RestaurantApproval({
      userId: user._id,
      type: 'EMAIL_CHANGE',
      details: {
        oldEmail: user.email,
        newEmail: email
      },
      status: 'PENDING'
    });
    
    await approvalRequest.save();
    
    // Notify admin of the request
    const adminNotification = new Notification({
      userId: null, // For all admins
      title: 'Email Change Request',
      message: `User ${user.fullName} has requested to change their email from ${user.email} to ${email}.`,
      type: 'APPROVAL_REQUEST',
      status: 'UNREAD',
      metadata: {
        approvalId: approvalRequest._id
      }
    });
    
    await adminNotification.save();
    
    return res.status(200).json({
      success: true,
      message: 'Email change request submitted for approval',
      approvalRequest
    });
  } catch (error) {
    console.error('Email change request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error submitting email change request'
    });
  }
});

/**
 * @route   GET /api/user/approval-requests
 * @desc    Get all approval requests for the current user
 * @access  Private
 */
router.get('/approval-requests', protect, async (req, res) => {
  try {
    const approvalRequests = await RestaurantApproval.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      approvalRequests
    });
  } catch (error) {
    console.error('Get approval requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching approval requests'
    });
  }
});

// PUT update health details (regular users only)
router.put('/health-details', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Check if user is a regular user (not admin, restaurant owner, or delivery staff)
        if (user.isAdmin || user.isRestaurantOwner || user.isDeliveryStaff) {
            return res.status(403).json({ success: false, message: 'Only regular users can update health details' });
        }

        const { healthCondition } = req.body;
        
        // Validate health condition
        if (!healthCondition) {
            return res.status(400).json({ success: false, message: 'Health condition is required' });
        }
        
        const validHealthConditions = ['Healthy', 'Diabetes', 'Heart Condition', 'Hypertension', 'Other'];
        if (!validHealthConditions.includes(healthCondition)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid health condition. Must be one of: ' + validHealthConditions.join(', ')
            });
        }
        
        // Only update if value changed
        if (healthCondition !== user.healthCondition) {
            // Record the change
            const change = { 
                healthCondition: { 
                    from: user.healthCondition, 
                    to: healthCondition 
                }
            };
            
            // Update health condition
            user.healthCondition = healthCondition;
            
            // Save with a promise
            const savedUser = await user.save();
            
            // Log the change
            console.log(`User health details updated. User ID: ${savedUser._id}, Health condition: ${savedUser.healthCondition}`);
            
            res.status(200).json({
                success: true,
                message: 'Health details updated successfully',
                user: {
                    id: savedUser._id,
                    name: savedUser.name,
                    email: savedUser.email,
                    healthCondition: savedUser.healthCondition
                }
            });
        } else {
            // No change needed
            res.status(200).json({
                success: true,
                message: 'No changes made to health details',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    healthCondition: user.healthCondition
                }
            });
        }
    } catch (error) {
        console.error('Update health details error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

/**
 * @route   GET /api/user/settings
 * @desc    Get user settings
 * @access  Private
 */
router.get('/settings', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Return user settings or default settings if not set
        const settings = user.settings || {
            notifications: {
                orderUpdates: true,
                promotions: false,
                newsletters: false,
                deliveryUpdates: true
            },
            preferences: {
                darkMode: false,
                language: 'en'
            },
            privacy: {
                shareOrderHistory: false,
                allowLocationTracking: true
            }
        };
        
        res.status(200).json({
            success: true,
            settings
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error retrieving settings: ' + error.message 
        });
    }
});

/**
 * @route   PUT /api/user/settings
 * @desc    Update user settings
 * @access  Private
 */
router.put('/settings', protect, async (req, res) => {
    try {
        const { notifications, preferences, privacy } = req.body;
        
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Initialize settings object if it doesn't exist
        if (!user.settings) {
            user.settings = {};
        }
        
        // Update settings with provided values or keep existing
        if (notifications) {
            user.settings.notifications = {
                ...user.settings.notifications,
                ...notifications
            };
        }
        
        if (preferences) {
            user.settings.preferences = {
                ...user.settings.preferences,
                ...preferences
            };
        }
        
        if (privacy) {
            user.settings.privacy = {
                ...user.settings.privacy,
                ...privacy
            };
        }
        
        // Save the updated user
        await user.save();
        
        res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            settings: user.settings
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating settings: ' + error.message 
        });
    }
});

// Change password
router.put('/change-password', protect, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[0-9]/).withMessage('Password must contain at least one number')
        .matches(/[^a-zA-Z0-9]/).withMessage('Password must contain at least one special character')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { currentPassword, newPassword } = req.body;

        // Get user with password
        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        // Make sure new password is different from the current one
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password must be different from current password' 
            });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Save the updated user with a promise to ensure it completes
        const savedUser = await user.save();
        
        // Log the password change (without exposing the password itself)
        console.log(`Password updated for user ID: ${savedUser._id}, at: ${new Date().toISOString()}`);

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating password: ' + error.message 
        });
    }
});

/**
 * @route   GET /api/users/profile/change-status
 * @desc    Get the status of pending profile changes
 * @access  Private
 */
router.get('/profile/change-status', protect, async (req, res) => {
    try {
        const Notification = require('../models/notification');
        
        // Find pending notifications for this user
        const pendingNotification = await Notification.findOne({
            userId: req.user._id,
            type: 'PROFILE_UPDATE',
            status: 'PENDING'
        }).sort({ createdAt: -1 });
        
        if (pendingNotification) {
            return res.status(200).json({
                success: true,
                hasPendingChanges: true,
                pendingChanges: pendingNotification.data,
                createdAt: pendingNotification.createdAt
            });
        }
        
        // Check if there are any recently rejected changes
        const rejectedNotification = await Notification.findOne({
            userId: req.user._id,
            type: 'PROFILE_UPDATE',
            status: 'REJECTED',
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        }).sort({ createdAt: -1 });
        
        if (rejectedNotification) {
            return res.status(200).json({
                success: true,
                hasPendingChanges: false,
                hasRejectedChanges: true,
                rejectedChanges: rejectedNotification.data,
                rejectionReason: rejectedNotification.rejectionReason,
                rejectedAt: rejectedNotification.processedAt
            });
        }
        
        // No pending or rejected changes
        return res.status(200).json({
            success: true,
            hasPendingChanges: false,
            hasRejectedChanges: false
        });
    } catch (error) {
        console.error('Get profile change status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching profile change status'
        });
    }
});

/**
 * @route   GET /api/user/notifications
 * @desc    Get user's notifications
 * @access  Private
 */
router.get('/notifications', protect, async (req, res) => {
    try {
        const Notification = require('../models/notification');
        
        const notifications = await Notification.find({
            userId: req.user._id
        }).sort({ createdAt: -1 });
        
        return res.status(200).json({
            success: true,
            data: notifications.map(notification => ({
                _id: notification._id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                status: notification.status,
                read: notification.isRead || false,
                createdAt: notification.createdAt,
                data: notification.data
            }))
        });
    } catch (error) {
        console.error('Get user notifications error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching notifications'
        });
    }
});

/**
 * @route   PUT /api/user/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.put('/notifications/:id/read', protect, async (req, res) => {
    try {
        const Notification = require('../models/notification');
        
        const notification = await Notification.findOne({
            _id: req.params.id,
            userId: req.user._id
        });
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        notification.isRead = true;
        await notification.save();
        
        return res.status(200).json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error marking notification as read'
        });
    }
});

/**
 * @route   PUT /api/user/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/notifications/mark-all-read', protect, async (req, res) => {
    try {
        const Notification = require('../models/notification');
        
        await Notification.updateMany(
            { userId: req.user._id, isRead: { $ne: true } },
            { $set: { isRead: true } }
        );
        
        return res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error marking all notifications as read'
        });
    }
});

/**
 * @route   DELETE /api/user/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/notifications/:id', protect, async (req, res) => {
    try {
        const Notification = require('../models/notification');
        
        const notification = await Notification.findOne({
            _id: req.params.id,
            userId: req.user._id
        });
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        await notification.deleteOne();
        
        return res.status(200).json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting notification'
        });
    }
});

/**
 * @route   GET /api/user/dashboard
 * @desc    Get user dashboard data
 * @access  Private
 */
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`[Dashboard API] Fetching dashboard data for user: ${userId}`);
    
    // Get user's orders count
    const Order = require('../models/order');
    console.log(`[Dashboard API] Counting total orders for userId: ${userId}`);
    let totalOrders = 0;
    try {
      totalOrders = await Order.countDocuments({ userId });
      console.log(`[Dashboard API] Found ${totalOrders} total orders`);
    } catch (error) {
      console.error('[Dashboard API] Error counting total orders:', error);
    }
    
    // Get pending orders count
    console.log(`[Dashboard API] Counting pending orders for userId: ${userId}`);
    let pendingOrders = 0;
    try {
      pendingOrders = await Order.countDocuments({ 
        userId, 
        status: { $in: ['PENDING', 'PREPARING', 'CONFIRMED', 'READY'] } 
      });
      console.log(`[Dashboard API] Found ${pendingOrders} pending orders`);
    } catch (error) {
      console.error('[Dashboard API] Error counting pending orders:', error);
    }
    
    // Get favorites count
    console.log(`[Dashboard API] Fetching user data for favorites`);
    let favoriteRestaurants = 0;
    try {
      const user = await User.findById(userId);
      favoriteRestaurants = user?.favorites?.length || 0;
      console.log(`[Dashboard API] User has ${favoriteRestaurants} favorite restaurants`);
    } catch (error) {
      console.error('[Dashboard API] Error getting favorites count:', error);
    }
    
    // Calculate amount saved from offers or use placeholder value
    console.log(`[Dashboard API] Calculating amount saved from offers`);
    let savedAmount = 0;
    try {
      // Get completed orders
      const completedOrders = await Order.find({ 
        userId, 
        status: 'DELIVERED',
        'discount.amount': { $gt: 0 }
      });
      
      // Calculate total discount amount
      savedAmount = completedOrders.reduce((total, order) => {
        return total + (order.discount?.amount || 0);
      }, 0);
      
      console.log(`[Dashboard API] Calculated saved amount: Rs ${savedAmount}`);
    } catch (error) {
      console.error('[Dashboard API] Error calculating saved amount:', error);
      // In development, use a placeholder value if calculation fails
      if (process.env.NODE_ENV === 'development') {
        savedAmount = Math.floor(Math.random() * 100);
      }
    }
    
    // Get recent orders for activity feed
    console.log(`[Dashboard API] Fetching recent orders for activity feed`);
    let recentOrders = [];
    try {
      recentOrders = await Order.find({ userId })
        .populate({
          path: 'restaurantId',
          select: 'restaurantDetails.name'
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
        
      console.log(`[Dashboard API] Found ${recentOrders.length} recent orders`);
    } catch (error) {
      console.error('[Dashboard API] Error fetching recent orders:', error);
    }
    
    // Get recent notifications
    console.log(`[Dashboard API] Fetching recent notifications`);
    const Notification = require('../models/notification');
    let notifications = [];
    try {
      notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
        
      console.log(`[Dashboard API] Found ${notifications.length} notifications`);
    } catch (error) {
      console.error('[Dashboard API] Error fetching notifications:', error);
    }
    
    // Get loyalty points
    console.log(`[Dashboard API] Fetching loyalty points`);
    let loyaltyPoints = 0;
    try {
      const LoyaltyPoint = require('../models/loyaltyPoint');
      const loyaltyData = await LoyaltyPoint.findOne({ userId });
      if (loyaltyData) {
        loyaltyPoints = loyaltyData.points;
      } else {
        // If no loyalty data exists, create it
        const newLoyaltyData = new LoyaltyPoint({
          userId,
          points: 0
        });
        await newLoyaltyData.save();
      }
      console.log(`[Dashboard API] User has ${loyaltyPoints} loyalty points`);
    } catch (error) {
      console.error('[Dashboard API] Error fetching loyalty points:', error);
    }
    
    // Combine orders and notifications for activity feed
    let recentActivity = [];
    
    // Map orders to activity items
    const orderActivities = recentOrders.map(order => {
      const restaurantName = order.restaurantId?.restaurantDetails?.name || 'Restaurant';
      
      return {
        id: order._id,
        title: `Order ${order.status === 'DELIVERED' ? 'Delivered' : 'Placed'}`,
        description: `Your order #${order.orderNumber || order._id.toString().substring(0, 6)} ${order.status === 'DELIVERED' ? 'from' : 'with'} ${restaurantName} ${order.status === 'DELIVERED' ? 'has been delivered' : 'has been ' + order.status.toLowerCase()}`,
        time: order.status === 'DELIVERED' ? order.updatedAt : order.createdAt,
        status: order.status.toLowerCase(),
        type: 'order',
        link: `/orders/${order._id}`
      };
    });
    
    // Map notifications to activity items
    const notificationActivities = notifications.map(notification => ({
      id: notification._id,
      title: notification.title || 'Notification',
      description: notification.message,
      time: notification.createdAt,
      status: notification.read ? 'completed' : 'pending',
      type: 'notification',
      link: `/user/notifications/${notification._id}`
    }));
    
    // Combine and sort by date
    recentActivity = [...orderActivities, ...notificationActivities]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 5);  // Take only the 5 most recent
    
    // Removed placeholder data to ensure only real data is displayed
    
    console.log(`[Dashboard API] Returning dashboard data with ${recentActivity.length} activity items`);
    
    return res.status(200).json({
      success: true,
      data: {
        totalOrders,
        favoriteRestaurants,
        savedAmount,
        pendingOrders,
        loyaltyPoints,
        recentActivity
      }
    });
  } catch (error) {
    console.error('[Dashboard API] Error fetching dashboard data:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

module.exports = router;

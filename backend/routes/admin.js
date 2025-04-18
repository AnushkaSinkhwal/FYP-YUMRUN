const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Notification = require('../models/notification');
const { auth, isAdmin, emailVerified } = require('../middleware/auth');
const RestaurantApproval = require('../models/restaurantApproval');
const Restaurant = require('../models/restaurant');
const mongoose = require('mongoose');

// Admin login route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username/email and password are required' 
            });
        }

        // Find user by username or email
        const user = await User.findOne({
            $or: [
                { username: username },
                { email: username }
            ]
        }).select('+password'); // Include password field which is excluded by default
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
        
        // Check if user is admin
        if (!user.isAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. Admin rights required.' 
            });
        }
        
        // Verify password
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                isAdmin: user.isAdmin 
            }, 
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        return res.status(200).json({ 
            success: true, 
            message: 'Login successful', 
            token: token, 
            user: { 
                id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                isAdmin: user.isAdmin,
                role: 'admin' 
            } 
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
});

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard data
 * @access  Private/Admin
 */
router.get('/dashboard', auth, isAdmin, async (req, res) => {
  try {
    // Get counts for dashboard
    const userCount = await User.countDocuments({ role: 'customer' });
    const restaurantCount = await User.countDocuments({ role: 'restaurant' });
    const pendingNotifications = await Notification.countDocuments({ status: 'PENDING' });
    
    // Return dashboard data
    return res.status(200).json({
      success: true,
      data: {
        userCount,
        restaurantCount,
        pendingNotifications
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Private/Admin
 */
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    return res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get user by ID
 * @access  Private/Admin
 */
router.get('/users/:userId', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
});

/**
 * @route   PUT /api/admin/users/:userId
 * @desc    Update user
 * @access  Private/Admin
 */
router.put('/users/:userId', auth, isAdmin, async (req, res) => {
  try {
    const { firstName, lastName, fullName, email, phone, role, isActive, healthCondition } = req.body;
    
    // Find the user
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Track changes for logging
    const changes = {};
    
    // Update user fields with validation
    if (firstName && firstName !== user.firstName) {
      changes.firstName = { from: user.firstName, to: firstName };
      user.firstName = firstName;
    }

    if (lastName && lastName !== user.lastName) {
      changes.lastName = { from: user.lastName, to: lastName };
      user.lastName = lastName;
    }

    if (fullName && fullName !== user.fullName) {
      changes.fullName = { from: user.fullName, to: fullName };
      user.fullName = fullName;
    }
    
    if (email && email !== user.email) {
      // Check if email is already in use
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another account'
        });
      }
      changes.email = { from: user.email, to: email };
      user.email = email;
    }
    
    // Handle phone number update with validation
    if (phone && phone !== user.phone) {
      // Validate phone number format (10 digits)
      if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Phone number must be exactly 10 digits'
        });
      }
      changes.phone = { from: user.phone, to: phone };
      user.phone = phone;
    }
    
    if (role !== undefined && role !== user.role) {
      // Prevent changing a user to admin role
      if (role === 'admin' && user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Changing a user role to admin is not allowed'
        });
      }
      changes.role = { from: user.role, to: role };
      user.role = role;
    }
    
    if (isActive !== undefined && isActive !== user.isActive) {
      changes.isActive = { from: user.isActive, to: isActive };
      user.isActive = isActive;
    }
    
    if (healthCondition && healthCondition !== user.healthCondition) {
      changes.healthCondition = { from: user.healthCondition, to: healthCondition };
      user.healthCondition = healthCondition;
    }
    
    // Save the updated user with a promise to ensure it completes
    const savedUser = await user.save();
    
    // Log that the save was successful with changes
    console.log(`User updated by admin. User ID: ${savedUser._id}, Changes:`, changes);
    
    // Send notification about the update
    const notification = new Notification({
      userId: savedUser._id,
      title: 'Profile Updated',
      message: `Your profile information was updated by an administrator.`,
      type: 'PROFILE_UPDATE',
      status: 'PENDING',
      data: changes
    });
    
    await notification.save();
    
    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: savedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating user: ' + error.message
    });
  }
});

/**
 * @route   PUT /api/admin/profile
 * @desc    Update admin's own profile
 * @access  Private/Admin
 */
router.put('/profile', auth, isAdmin, async (req, res) => {
  try {
    const { fullName, email, phone } = req.body;
    
    // Find the admin user
    const admin = await User.findById(req.user.userId);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    // Update admin fields with validation
    if (fullName && fullName !== admin.fullName) admin.fullName = fullName;
    
    if (email && email !== admin.email) {
      // Check if email is already in use
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.userId } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another account'
        });
      }
      admin.email = email;
    }
    
    if (phone && phone !== admin.phone) {
      // Validate phone number format (10 digits)
      if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Phone number must be exactly 10 digits'
        });
      }
      admin.phone = phone;
    }
    
    // Save the updated admin with a promise
    const savedAdmin = await admin.save();
    
    // Log the update
    console.log(`Admin profile updated. Admin ID: ${savedAdmin._id}, Email: ${savedAdmin.email}, Phone: ${savedAdmin.phone}`);
    
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: savedAdmin
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating profile: ' + error.message
    });
  }
});

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Delete user
 * @access  Private/Admin
 */
router.delete('/users/:userId', auth, isAdmin, async (req, res) => {
  try {
    // Cannot delete yourself
    if (req.params.userId === req.user.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }
    
    // Find the user first to check if they are an admin
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Cannot delete admin users
    if (user.role === 'admin' || user.isAdmin === true) {
      return res.status(403).json({
        success: false,
        message: 'Admin users cannot be deleted'
      });
    }
    
    // Delete the user
    await User.findByIdAndDelete(req.params.userId);
    
    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

/**
 * @route   GET /api/admin/notifications
 * @desc    Get all notifications
 * @access  Private/Admin
 */
router.get('/notifications', auth, isAdmin, async (req, res) => {
  try {
    // Get query parameters for filtering
    const { status, type, limit = 50, skip = 0 } = req.query;
    
    // Build the query
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    
    // Get notifications with pagination and sorting
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate('userId', 'name email');
    
    // Get total count for pagination
    const total = await Notification.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      notifications,
      total,
      limit: Number(limit),
      skip: Number(skip)
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
});

/**
 * @route   GET /api/admin/notifications/count
 * @desc    Get count of pending notifications
 * @access  Private/Admin
 */
router.get('/notifications/count', auth, isAdmin, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ status: 'PENDING' });
    
    return res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get notifications count error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching notifications count'
    });
  }
});

/**
 * @route   POST /api/admin/notifications/:notificationId/process
 * @desc    Process a notification (approve/reject user profile changes)
 * @access  Private - Admin only
 */
router.post('/notifications/:notificationId/process', auth, isAdmin, async (req, res) => {
  try {
    const { action, reason } = req.body;
    const { notificationId } = req.params;
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approve" or "reject"'
      });
    }
    
    // Find the notification
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Only process pending notifications
    if (notification.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot process notification with status "${notification.status}"`
      });
    }
    
    // Process based on notification type
    switch (notification.type) {
      case 'PROFILE_UPDATE':
        // Handle user profile update
        if (action === 'approve') {
          // Get the user
          const user = await User.findById(notification.userId);
          
          if (!user) {
            return res.status(404).json({
              success: false,
              message: 'User not found'
            });
          }
          
          // Update the user's profile with the requested changes
          if (notification.data.email) {
            user.email = notification.data.email;
          }
          
          await user.save();
          
          // Update notification status
          notification.status = 'APPROVED';
          notification.processedBy = req.user.id;
          notification.processedAt = new Date();
          await notification.save();
          
          // Create a notification for the user about the approval
          const userNotification = new Notification({
            userId: notification.userId,
            type: 'SYSTEM',
            title: 'Profile Update Approved',
            message: 'Your requested profile changes have been approved by the admin.',
            isRead: false,
            data: {}
          });
          
          await userNotification.save();
          
          return res.status(200).json({
            success: true,
            message: 'Profile update approved successfully'
          });
        } else {
          // Reject - need a reason
          if (!reason) {
            return res.status(400).json({
              success: false,
              message: 'Rejection reason is required'
            });
          }
          
          // Update notification status
          notification.status = 'REJECTED';
          notification.processedBy = req.user.id;
          notification.processedAt = new Date();
          notification.rejectionReason = reason;
          await notification.save();
          
          // Create a notification for the user about the rejection
          const userNotification = new Notification({
            userId: notification.userId,
            type: 'SYSTEM',
            title: 'Profile Update Rejected',
            message: `Your requested profile changes have been rejected by the admin. Reason: ${reason}`,
            isRead: false,
            data: {}
          });
          
          await userNotification.save();
          
          return res.status(200).json({
            success: true,
            message: 'Profile update rejected successfully'
          });
        }
        
      case 'RESTAURANT_UPDATE':
        // Handle restaurant update
        if (action === 'approve') {
          // Get the restaurant
          const restaurant = await Restaurant.findById(notification.data.restaurantId);
          
          if (!restaurant) {
            return res.status(404).json({
              success: false,
              message: 'Restaurant not found'
            });
          }
          
          // Update the restaurant with the requested changes
          if (notification.data.restaurantDetails) {
            const { name, address, cuisine, description, openingHours, contactInfo } = notification.data.restaurantDetails;
            
            if (name) restaurant.name = name;
            if (address) restaurant.address = address;
            if (cuisine) restaurant.cuisine = cuisine;
            if (description) restaurant.description = description;
            if (openingHours) restaurant.openingHours = openingHours;
            if (contactInfo) restaurant.contactInfo = contactInfo;
          }
          
          await restaurant.save();
          
          // Update notification status
          notification.status = 'APPROVED';
          notification.processedBy = req.user.id;
          notification.processedAt = new Date();
          await notification.save();
          
          // Create a notification for the restaurant owner
          const ownerNotification = new Notification({
            userId: notification.userId,
            type: 'SYSTEM',
            title: 'Restaurant Update Approved',
            message: 'Your requested restaurant profile changes have been approved by the admin.',
            isRead: false,
            data: {}
          });
          
          await ownerNotification.save();
          
          return res.status(200).json({
            success: true,
            message: 'Restaurant update approved successfully'
          });
        } else {
          // Reject - need a reason
          if (!reason) {
            return res.status(400).json({
              success: false,
              message: 'Rejection reason is required'
            });
          }
          
          // Update notification status
          notification.status = 'REJECTED';
          notification.processedBy = req.user.id;
          notification.processedAt = new Date();
          notification.rejectionReason = reason;
          await notification.save();
          
          // Create a notification for the restaurant owner
          const ownerNotification = new Notification({
            userId: notification.userId,
            type: 'SYSTEM',
            title: 'Restaurant Update Rejected',
            message: `Your requested restaurant profile changes have been rejected by the admin. Reason: ${reason}`,
            isRead: false,
            data: {}
          });
          
          await ownerNotification.save();
          
          return res.status(200).json({
            success: true,
            message: 'Restaurant update rejected successfully'
          });
        }
        
      default:
        return res.status(400).json({
          success: false,
          message: `Notification type "${notification.type}" cannot be processed`
        });
    }
  } catch (error) {
    console.error('Error processing notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while processing notification'
    });
  }
});

/**
 * @route   POST /api/admin/users/:userId/approve-changes
 * @desc    Directly approve user profile changes
 * @access  Private/Admin
 */
router.post('/users/:userId/approve-changes', auth, isAdmin, async (req, res) => {
  try {
    const changes = req.body;
    
    // Find the user
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Apply changes directly
    if (changes.name) user.name = changes.name;
    if (changes.email) user.email = changes.email;
    if (changes.phone) user.phone = changes.phone;
    
    // Update restaurant details if applicable
    if (changes.restaurantDetails && user.role === 'restaurant') {
      if (!user.restaurantDetails) {
        user.restaurantDetails = {};
      }
      
      if (changes.restaurantDetails.name) {
        user.restaurantDetails.name = changes.restaurantDetails.name;
      }
      
      if (changes.restaurantDetails.address) {
        user.restaurantDetails.address = changes.restaurantDetails.address;
      }
      
      if (changes.restaurantDetails.description) {
        user.restaurantDetails.description = changes.restaurantDetails.description;
      }
      
      if (changes.restaurantDetails.cuisineType) {
        user.restaurantDetails.cuisineType = changes.restaurantDetails.cuisineType;
      }
    }
    
    // Save the updated user
    await user.save();
    
    // Create a notification record for tracking
    const notification = new Notification({
      type: 'PROFILE_UPDATE',
      title: 'Profile Update',
      message: `Admin ${req.user.name} has updated user ${user.name}'s profile directly.`,
      userId: user._id,
      status: 'APPROVED',
      data: changes,
      processedBy: req.user._id,
      processedAt: new Date()
    });
    
    await notification.save();
    
    return res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Approve changes error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error approving changes'
    });
  }
});

/**
 * @route   POST /api/admin/users/:userId/reject-changes
 * @desc    Reject user profile changes
 * @access  Private/Admin
 */
router.post('/users/:userId/reject-changes', auth, isAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    // Find the user
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Create a notification record for tracking
    const notification = new Notification({
      type: 'PROFILE_UPDATE',
      title: 'Profile Update Rejected',
      message: `Admin ${req.user.name} has rejected profile changes for user ${user.name}.`,
      userId: user._id,
      status: 'REJECTED',
      rejectionReason: reason,
      processedBy: req.user._id,
      processedAt: new Date()
    });
    
    await notification.save();
    
    return res.status(200).json({
      success: true,
      message: 'Changes rejected successfully'
    });
  } catch (error) {
    console.error('Reject changes error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error rejecting changes'
    });
  }
});

// GET system statistics
router.get('/statistics', auth, isAdmin, async (req, res) => {
    try {
        const userCount = await User.countDocuments({ role: 'customer' });
        const ownerCount = await User.countDocuments({ role: 'restaurant' });
        const staffCount = await User.countDocuments({ role: 'delivery_rider' });
        
        res.status(200).json({ 
            success: true,
            data: {
                users: userCount,
                owners: ownerCount,
                staff: staffCount
            }
        });
    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// GET all restaurants 
router.get('/restaurants', auth, isAdmin, async (req, res) => {
    try {
        // Get restaurants from Restaurant collection
        const restaurantDocuments = await Restaurant.find()
            .populate('owner', 'name username email phone restaurantDetails.cuisine restaurantDetails.approved createdAt');

        // Format the restaurants combining data from both restaurant and owner documents
        const restaurants = restaurantDocuments.map(restaurant => {
            const owner = restaurant.owner;
            // Get cuisine from restaurant or owner's restaurantDetails
            let category = 'Uncategorized';
            if (restaurant.cuisine && restaurant.cuisine.length > 0) {
                category = restaurant.cuisine.join(', ');
            } else if (owner?.restaurantDetails?.cuisine && owner.restaurantDetails.cuisine.length > 0) {
                category = owner.restaurantDetails.cuisine.join(', ');
            }
            
            return {
                id: restaurant._id,
                name: restaurant.name,
                owner: owner?.name || owner?.fullName || owner?.username || 'Unknown Owner',
                ownerId: owner?._id,
                email: owner?.email || 'No email',
                address: restaurant.location || (restaurant.address?.formatted || JSON.stringify(restaurant.address || {})),
                phone: owner?.phone || restaurant.phone || 'No phone provided',
                status: restaurant.isApproved ? 'Approved' : 'Pending',
                isApproved: restaurant.isApproved,
                createdAt: restaurant.dateCreated || restaurant.createdAt,
                category: category,
                description: restaurant.description,
                logo: restaurant.logo
            };
        });

        res.status(200).json({ 
            success: true,
            restaurants
        });
    } catch (error) {
        console.error('Get restaurants error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// GET restaurant owners
router.get('/owners', auth, isAdmin, async (req, res) => {
    try {
        const owners = await User.find({ role: 'restaurant' }).select('-password');
        res.status(200).json({ 
            success: true,
            data: owners
        });
    } catch (error) {
        console.error('Get owners error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// GET restaurant approval requests
router.get('/restaurant-approvals', auth, isAdmin, async (req, res) => {
    try {
        const pendingApprovals = await RestaurantApproval.find({ status: 'pending' })
            .populate('restaurantId', 'name email phone restaurantName restaurantAddress')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            pendingApprovals
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/admin/restaurant-approvals/count
 * @desc    Get count of pending restaurant approvals
 * @access  Private/Admin
 */
router.get('/restaurant-approvals/count', auth, isAdmin, async (req, res) => {
    try {
        const count = await RestaurantApproval.countDocuments({ status: 'pending' });
        
        res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Approve restaurant profile changes
router.post('/restaurant-approvals/:approvalId/approve', auth, isAdmin, async (req, res) => {
    try {
        const approval = await RestaurantApproval.findById(req.params.approvalId);
        
        if (!approval) {
            return res.status(404).json({
                success: false,
                error: 'Approval request not found'
            });
        }

        if (approval.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'This request has already been processed'
            });
        }

        // Update restaurant profile
        const restaurant = await User.findById(approval.restaurantId);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                error: 'Restaurant not found'
            });
        }

        console.log("Current restaurant data:", {
            name: restaurant.name,
            email: restaurant.email,
            phone: restaurant.phone,
            restaurantName: restaurant.restaurantDetails?.name,
            restaurantAddress: restaurant.restaurantDetails?.address
        });

        console.log("Requested changes:", approval.requestedData);

        // Track changes for logging
        const changes = {};

        // Update restaurant data with validation
        if (approval.requestedData.name && approval.requestedData.name !== restaurant.name) {
            changes.name = { from: restaurant.name, to: approval.requestedData.name };
            restaurant.name = approval.requestedData.name;
        }
        
        if (approval.requestedData.email && approval.requestedData.email !== restaurant.email) {
            // Check if email is already in use
            const existingUser = await User.findOne({ 
                email: approval.requestedData.email, 
                _id: { $ne: approval.restaurantId } 
            });
            
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: 'Email is already in use by another account'
                });
            }
            
            changes.email = { from: restaurant.email, to: approval.requestedData.email };
            restaurant.email = approval.requestedData.email;
        }
        
        // Handle phone number with validation
        if (approval.requestedData.phone && approval.requestedData.phone !== restaurant.phone) {
            // Validate phone number format (10 digits)
            if (!/^\d{10}$/.test(approval.requestedData.phone)) {
                return res.status(400).json({
                    success: false,
                    error: 'Phone number must be exactly 10 digits'
                });
            }
            
            changes.phone = { from: restaurant.phone, to: approval.requestedData.phone };
            restaurant.phone = approval.requestedData.phone;
        }
        
        // Ensure restaurant details exist
        if (!restaurant.restaurantDetails) {
            restaurant.restaurantDetails = {};
        }
        
        // Update restaurant details
        if (approval.requestedData.restaurantName) {
            changes.restaurantName = { 
                from: restaurant.restaurantDetails?.name || '', 
                to: approval.requestedData.restaurantName 
            };
            restaurant.restaurantDetails.name = approval.requestedData.restaurantName;
        }
        
        if (approval.requestedData.restaurantAddress) {
            changes.restaurantAddress = { 
                from: restaurant.restaurantDetails?.address || '', 
                to: approval.requestedData.restaurantAddress 
            };
            restaurant.restaurantDetails.address = approval.requestedData.restaurantAddress;
        }

        // Log changes before saving
        console.log("Applying changes:", changes);

        // First try to save without validation in case there are schema issues
        try {
            // Save changes with a promise and bypass validation
            const savedRestaurant = await restaurant.save({ validateBeforeSave: false });
            
            // Log the update with specific changes
            console.log(`Restaurant profile approved by admin. Restaurant ID: ${savedRestaurant._id}, Changes:`, changes);
            
            // Update approval status
            approval.status = 'approved';
            approval.processedBy = req.user.userId;
            approval.processedAt = new Date();
            await approval.save();
            
            // Create notification for restaurant owner
            const notification = new Notification({
                type: 'PROFILE_UPDATE',
                title: 'Profile Update Approved',
                message: 'Your profile update request has been approved by the administrator.',
                userId: restaurant._id,
                status: 'PENDING',
                data: changes
            });
            
            await notification.save();

            // Double-check that changes were applied correctly
            const updatedRestaurant = await User.findById(restaurant._id);
            console.log("Updated restaurant data:", {
                name: updatedRestaurant.name,
                email: updatedRestaurant.email,
                phone: updatedRestaurant.phone,
                restaurantName: updatedRestaurant.restaurantDetails?.name,
                restaurantAddress: updatedRestaurant.restaurantDetails?.address
            });

            return res.status(200).json({
                success: true,
                message: 'Profile changes approved successfully',
                restaurant: {
                    id: savedRestaurant._id,
                    name: savedRestaurant.name,
                    email: savedRestaurant.email,
                    phone: savedRestaurant.phone,
                    restaurantDetails: savedRestaurant.restaurantDetails
                }
            });
        } catch (saveError) {
            console.error('Error saving restaurant profile:', saveError);
            
            // If there was an issue, try saving with individual field updates
            console.log("Attempting alternative save approach...");
            
            // Update fields directly using findByIdAndUpdate
            const updateFields = {};
            
            if (changes.name) updateFields.name = changes.name.to;
            if (changes.email) updateFields.email = changes.email.to;
            if (changes.phone) updateFields.phone = changes.phone.to;
            
            if (changes.restaurantName || changes.restaurantAddress) {
                updateFields.restaurantDetails = restaurant.restaurantDetails;
            }
            
            const updatedRestaurant = await User.findByIdAndUpdate(
                restaurant._id,
                { $set: updateFields },
                { new: true, runValidators: true }
            );
            
            console.log("Restaurant updated with alternative approach:", updatedRestaurant);
            
            // Update approval status
            approval.status = 'approved';
            approval.processedBy = req.user.userId;
            approval.processedAt = new Date();
            await approval.save();
            
            return res.status(200).json({
                success: true,
                message: 'Profile changes approved successfully with alternative method',
                restaurant: updatedRestaurant
            });
        }
    } catch (error) {
        console.error('Error approving restaurant profile:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Reject restaurant profile changes
router.post('/restaurant-approvals/:approvalId/reject', auth, isAdmin, async (req, res) => {
    try {
        const { reason } = req.body;
        
        if (!reason) {
            return res.status(400).json({
                success: false,
                error: 'Rejection reason is required'
            });
        }
        
        const approval = await RestaurantApproval.findById(req.params.approvalId);
        
        if (!approval) {
            return res.status(404).json({
                success: false,
                error: 'Approval request not found'
            });
        }

        if (approval.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'This request has already been processed'
            });
        }

        // Update approval status
        approval.status = 'rejected';
        approval.processedBy = req.user.userId;
        approval.processedAt = new Date();
        approval.rejectionReason = reason;
        await approval.save();
        
        // Create notification for restaurant owner
        const notification = new Notification({
            type: 'PROFILE_UPDATE',
            title: 'Profile Update Rejected',
            message: 'Your profile update request has been rejected by the administrator.',
            userId: approval.restaurantId,
            status: 'PENDING',
            data: {
                reason: reason,
                approvalId: approval._id,
                rejectedAt: new Date()
            }
        });
        
        await notification.save();
        
        console.log(`Restaurant profile changes rejected. Restaurant ID: ${approval.restaurantId}, Reason: ${reason}`);

        res.status(200).json({
            success: true,
            message: 'Profile changes rejected successfully'
        });
    } catch (error) {
        console.error('Error rejecting restaurant profile:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET all delivery staff approval requests
router.get('/delivery-staff-approvals', auth, isAdmin, (req, res) => {
    res.status(200).json({ message: 'Delivery staff approval requests' });
});

// POST approve/reject delivery staff
router.post('/delivery-staff-approvals/:id', auth, isAdmin, (req, res) => {
    res.status(200).json({ message: `Process delivery staff approval for ID: ${req.params.id}` });
});

// GET all notifications for admin
router.get('/notifications', auth, isAdmin, (req, res) => {
    try {
        // This would fetch notifications from a database in a real implementation
        // For now, we return mock data
        const notifications = [
            { 
                id: 1, 
                type: 'profile_update', 
                message: 'User John Doe updated their profile information', 
                status: 'pending',
                user: { id: 'user123', name: 'John Doe', email: 'john@example.com' },
                timestamp: new Date().toISOString(),
                changes: { phone: '123-456-7890', previousPhone: '987-654-3210' }
            },
            { 
                id: 2, 
                type: 'profile_update', 
                message: 'Restaurant owner Sarah Smith updated contact details', 
                status: 'pending',
                user: { id: 'user456', name: 'Sarah Smith', email: 'sarah@example.com', isRestaurantOwner: true },
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                changes: { email: 'sarah.new@example.com', previousEmail: 'sarah@example.com' }
            },
            { 
                id: 3, 
                type: 'profile_update', 
                message: 'Restaurant owner Michael Johnson updated contact information', 
                status: 'pending',
                user: { id: 'user789', name: 'Michael Johnson', email: 'michael@restaurant.com', isRestaurantOwner: true },
                timestamp: new Date(Date.now() - 172800000).toISOString(),
                changes: { 
                    phone: '555-123-4567', 
                    previousPhone: '555-987-6543',
                    name: 'Michael J. Johnson',
                    previousName: 'Michael Johnson'
                }
            }
        ];
        
        res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (error) {
        console.error('Admin notifications error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// POST process notification (approve/reject)
router.post('/notifications/:id', auth, isAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be "approved" or "rejected".'
            });
        }
        
        // In a real implementation, this would update the notification in the database
        // For now, we just acknowledge the request
        res.status(200).json({
            success: true,
            message: `Notification ${id} has been ${status}.`,
            data: {
                id,
                status
            }
        });
    } catch (error) {
        console.error('Process notification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

/**
 * @route   POST /api/admin/approval/:requestId
 * @desc    Approve or reject a change request
 * @access  Private/Admin
 */
router.post('/approval/:requestId', auth, isAdmin, async (req, res) => {
  try {
    const { status, feedback } = req.body;
    
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    // Find the approval request
    const approvalRequest = await RestaurantApproval.findById(req.params.requestId);
    
    if (!approvalRequest) {
      return res.status(404).json({
        success: false,
        message: 'Approval request not found'
      });
    }
    
    // Update the request status
    approvalRequest.status = status;
    approvalRequest.feedback = feedback || '';
    approvalRequest.processedAt = Date.now();
    approvalRequest.processedBy = req.user.userId;
    
    await approvalRequest.save();
    
    // If approved, update the user/restaurant details
    if (status === 'APPROVED' && approvalRequest.type === 'RESTAURANT_REGISTRATION') {
      const user = await User.findById(approvalRequest.userId);
      if (user) {
        if (user.restaurantDetails) {
          user.restaurantDetails.approved = true;
        }
        await user.save();
      }
    }
    
    // Create notification for the user
    const notification = new Notification({
      userId: approvalRequest.userId,
      title: `Request ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
      message: status === 'APPROVED' 
        ? 'Your request has been approved by the administrator.' 
        : `Your request has been rejected. Reason: ${feedback || 'No specific reason provided.'}`,
      type: 'APPROVAL_UPDATE',
      status: 'PENDING'
    });
    
    await notification.save();
    
    return res.status(200).json({
      success: true,
      message: `Request ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully`,
      approvalRequest
    });
  } catch (error) {
    console.error('Approval request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing approval request'
    });
  }
});

/**
 * @route   POST /api/admin/users
 * @desc    Create a new user
 * @access  Private/Admin
 */
router.post('/users', auth, isAdmin, async (req, res) => {
  try {
    console.log('POST /admin/users - Request received:', req.body);
    
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      role = 'customer',
      isActive = true,
      address = {}
    } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !password || !phone) {
      console.log('POST /admin/users - Validation failed, missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided: firstName, lastName, email, password, phone'
      });
    }
    
    // Check if email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`POST /admin/users - Email ${email} already in use`);
      return res.status(400).json({
        success: false,
        message: 'Email is already in use'
      });
    }
    
    // Prevent creating admin users
    if (role === 'admin') {
      console.log('POST /admin/users - Attempt to create admin user rejected');
      return res.status(403).json({
        success: false,
        message: 'Creating users with admin role is not allowed'
      });
    }
    
    // Create new user object
    console.log('POST /admin/users - Creating new user with data:', { firstName, lastName, email, phone, role });
    const newUser = new User({
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email,
      password, // Will be hashed by pre-save hook in User model
      phone,
      role,
      isActive,
      address,
      isEmailVerified: true // Auto-verify email for admin-created users
    });
    
    // Save user to database
    const savedUser = await newUser.save();
    console.log(`POST /admin/users - User created successfully with ID: ${savedUser._id}`);
    
    // Log the action
    console.log(`New user created by admin. User ID: ${savedUser._id}, Role: ${role}`);
    
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        fullName: savedUser.fullName,
        email: savedUser.email,
        phone: savedUser.phone,
        role: savedUser.role,
        isActive: savedUser.isActive
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating user: ' + error.message
    });
  }
});

// Temporary route for testing without auth middleware
/**
 * @route   POST /api/admin/create-user
 * @desc    Create a new user (TEST ROUTE)
 * @access  Public (temporary)
 */
router.post('/create-user', async (req, res) => {
  try {
    console.log('POST /admin/create-user - Request received:', req.body);
    
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      role = 'customer',
      isActive = true,
      address = {}
    } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !password || !phone) {
      console.log('POST /admin/create-user - Validation failed, missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided: firstName, lastName, email, password, phone'
      });
    }
    
    // Check if email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`POST /admin/create-user - Email ${email} already in use`);
      return res.status(400).json({
        success: false,
        message: 'Email is already in use'
      });
    }
    
    // Create new user object
    console.log('POST /admin/create-user - Creating new user with data:', { firstName, lastName, email, phone, role });
    const newUser = new User({
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email,
      password, // Will be hashed by pre-save hook in User model
      phone,
      role,
      isActive,
      address,
      isEmailVerified: true // Auto-verify email for admin-created users
    });
    
    // Save user to database
    const savedUser = await newUser.save();
    console.log(`POST /admin/create-user - User created successfully with ID: ${savedUser._id}`);
    
    // Log the action
    console.log(`New user created through test route. User ID: ${savedUser._id}, Role: ${role}`);
    
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        fullName: savedUser.fullName,
        email: savedUser.email,
        phone: savedUser.phone,
        role: savedUser.role,
        isActive: savedUser.isActive
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating user: ' + error.message
    });
  }
});

/**
 * @route   POST /api/admin/restaurants
 * @desc    Create a new restaurant and restaurant owner account
 * @access  Private/Admin
 */
router.post('/restaurants', auth, isAdmin, async (req, res) => {
  try {
    console.log('POST /admin/restaurants - Request received:', req.body);
    
    const { 
      // Restaurant owner (user) details
      firstName, 
      lastName, 
      email, 
      password, 
      phone,
      
      // Restaurant details
      restaurantName,
      restaurantAddress,
      restaurantDescription,
      cuisine = ['General'],
      isApproved = true,
      isActive = true,
      location,
      priceRange = '$$',
      panNumber // Extract PAN Number
    } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !password || !phone || !restaurantName || !restaurantAddress || !panNumber) {
      console.log('POST /admin/restaurants - Validation failed, missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided: firstName, lastName, email, password, phone, restaurantName, restaurantAddress, panNumber'
      });
    }
    
    // Validate PAN Number format (9 digits)
    if (!/^\d{9}$/.test(panNumber)) {
      console.log(`POST /admin/restaurants - PAN Number validation failed: ${panNumber}`);
      return res.status(400).json({
        success: false,
        message: 'PAN Number must be exactly 9 digits'
      });
    }
    
    // Check if email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`POST /admin/restaurants - Email ${email} already in use`);
      return res.status(400).json({
        success: false,
        message: 'Email is already in use'
      });
    }
    
    console.log('POST /admin/restaurants - Creating restaurant and owner with transaction');
    
    // Start a transaction session
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // 1. Create the restaurant owner (user) with role 'restaurant'
      console.log('POST /admin/restaurants - Creating restaurant owner user');
      const restaurantOwner = new User({
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        email,
        password, // Will be hashed by pre-save hook in User model
        phone,
        role: 'restaurant',
        isActive,
        isEmailVerified: true, // Auto-verify email for admin-created users
        restaurantDetails: {
          name: restaurantName,
          address: restaurantAddress,
          description: restaurantDescription || `${restaurantName} restaurant`,
          approved: isApproved,
          panNumber
        }
      });
      
      console.log('RestaurantOwner data before save:', {
        email,
        role: 'restaurant',
        restaurantDetails: {
          name: restaurantName,
          panNumber
        }
      });
      
      // Save user to database
      const savedUser = await restaurantOwner.save({ session });
      console.log(`POST /admin/restaurants - Owner user created with ID: ${savedUser._id}`);
      console.log('Saved user restaurantDetails:', savedUser.restaurantDetails);
      
      // 2. Create the restaurant record
      console.log('POST /admin/restaurants - Creating restaurant record');
      const restaurant = new Restaurant({
        name: restaurantName,
        location: location || restaurantAddress,
        address: {
          full: restaurantAddress,
          formatted: restaurantAddress
        },
        description: restaurantDescription || `${restaurantName} restaurant`,
        owner: savedUser._id,
        isApproved,
        isActive,
        cuisine,
        priceRange,
        phone,
        email,
        panNumber // Add PAN Number to restaurant record
      });
      
      // Save restaurant to database
      const savedRestaurant = await restaurant.save({ session });
      console.log(`POST /admin/restaurants - Restaurant created with ID: ${savedRestaurant._id}`);
      
      // Commit the transaction
      await session.commitTransaction();
      console.log('POST /admin/restaurants - Transaction committed successfully');
      session.endSession();
      
      // Log the action
      console.log(`New restaurant created by admin. Restaurant ID: ${savedRestaurant._id}, Owner ID: ${savedUser._id}`);
      
      return res.status(201).json({
        success: true,
        message: 'Restaurant and owner account created successfully',
        data: {
          restaurant: {
            id: savedRestaurant._id,
            name: savedRestaurant.name,
            address: savedRestaurant.address,
            isApproved: savedRestaurant.isApproved,
            isActive: savedRestaurant.isActive,
            panNumber: savedRestaurant.panNumber
          },
          owner: {
            id: savedUser._id,
            fullName: savedUser.fullName,
            email: savedUser.email,
            phone: savedUser.phone,
            role: savedUser.role
          }
        }
      });
    } catch (error) {
      // Abort the transaction in case of an error
      console.error('POST /admin/restaurants - Transaction error:', error);
      await session.abortTransaction();
      console.log('POST /admin/restaurants - Transaction aborted');
      session.endSession();
      throw error; // Re-throw to be caught by the outer try-catch
    }
  } catch (error) {
    console.error('Create restaurant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating restaurant: ' + error.message
    });
  }
});

// PATCH approve a restaurant
router.patch('/restaurants/:restaurantId/approve', auth, isAdmin, async (req, res) => {
    try {
        const restaurantId = req.params.restaurantId;
        
        // Find the restaurant
        const restaurant = await Restaurant.findById(restaurantId);
        
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }
        
        // Update approval status
        restaurant.isApproved = true;
        await restaurant.save();
        
        // Update the owner's restaurant details approval status as well
        const owner = await User.findById(restaurant.owner);
        if (owner) {
            if (!owner.restaurantDetails) {
                owner.restaurantDetails = {};
            }
            owner.restaurantDetails.approved = true;
            await owner.save();
            
            // Create notification for owner
            const notification = new Notification({
                userId: owner._id,
                title: 'Restaurant Approved',
                message: 'Your restaurant has been approved by the administrator.',
                type: 'RESTAURANT_APPROVAL',
                status: 'PENDING',
                data: {
                    restaurantId: restaurant._id,
                    restaurantName: restaurant.name
                }
            });
            
            await notification.save();
        }
        
        return res.status(200).json({
            success: true,
            message: 'Restaurant approved successfully',
            data: {
                restaurantId: restaurant._id,
                name: restaurant.name,
                isApproved: restaurant.isApproved
            }
        });
    } catch (error) {
        console.error('Approve restaurant error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error approving restaurant: ' + error.message
        });
    }
});

// PATCH reject a restaurant
router.patch('/restaurants/:restaurantId/reject', auth, isAdmin, async (req, res) => {
    try {
        const restaurantId = req.params.restaurantId;
        const { reason } = req.body;
        
        // Find the restaurant
        const restaurant = await Restaurant.findById(restaurantId);
        
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }
        
        // Update approval status
        restaurant.isApproved = false;
        await restaurant.save();
        
        // Update the owner's restaurant details approval status as well
        const owner = await User.findById(restaurant.owner);
        if (owner) {
            if (!owner.restaurantDetails) {
                owner.restaurantDetails = {};
            }
            owner.restaurantDetails.approved = false;
            await owner.save();
            
            // Create notification for owner
            const notification = new Notification({
                userId: owner._id,
                title: 'Restaurant Approval Rejected',
                message: reason || 'Your restaurant approval has been rejected by the administrator.',
                type: 'RESTAURANT_REJECTION',
                status: 'PENDING',
                data: {
                    restaurantId: restaurant._id,
                    restaurantName: restaurant.name,
                    reason: reason || 'No reason provided'
                }
            });
            
            await notification.save();
        }
        
        return res.status(200).json({
            success: true,
            message: 'Restaurant rejected successfully',
            data: {
                restaurantId: restaurant._id,
                name: restaurant.name,
                isApproved: restaurant.isApproved
            }
        });
    } catch (error) {
        console.error('Reject restaurant error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error rejecting restaurant: ' + error.message
        });
    }
});

// DELETE a restaurant
router.delete('/restaurants/:restaurantId', auth, isAdmin, async (req, res) => {
    try {
        const restaurantId = req.params.restaurantId;
        
        // Find the restaurant
        const restaurant = await Restaurant.findById(restaurantId);
        
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }
        
        // Delete the restaurant
        await Restaurant.findByIdAndDelete(restaurantId);
        
        // Optional: Update the owner to remove restaurant role or mark as inactive
        if (restaurant.owner) {
            const owner = await User.findById(restaurant.owner);
            if (owner) {
                // Option 1: Remove restaurant role
                // owner.role = 'customer';
                
                // Option 2: Mark as inactive
                owner.isActive = false;
                
                await owner.save();
                
                // Create notification for owner
                const notification = new Notification({
                    userId: owner._id,
                    title: 'Restaurant Deleted',
                    message: 'Your restaurant has been deleted by the administrator.',
                    type: 'RESTAURANT_DELETION',
                    status: 'PENDING',
                    data: {
                        restaurantName: restaurant.name
                    }
                });
                
                await notification.save();
            }
        }
        
        return res.status(200).json({
            success: true,
            message: 'Restaurant deleted successfully'
        });
    } catch (error) {
        console.error('Delete restaurant error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting restaurant: ' + error.message
        });
    }
});

/**
 * @route   GET /api/admin/restaurants/pending
 * @desc    Get restaurants pending approval
 * @access  Private/Admin
 */
router.get('/restaurants/pending', auth, isAdmin, async (req, res) => {
    try {
        const pendingRestaurants = await Restaurant.find({ status: 'pending_approval' }).populate('owner', 'firstName lastName email');
        return res.status(200).json({
            success: true,
            data: pendingRestaurants
        });
    } catch (error) {
        console.error('Error fetching pending restaurants:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch pending restaurants'
        });
    }
});

/**
 * @route   PATCH /api/admin/restaurants/:restaurantId/status
 * @desc    Update restaurant approval status
 * @access  Private/Admin
 */
router.patch('/restaurants/:restaurantId/status', auth, isAdmin, async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { status } = req.body;

        // Validate restaurant ID
        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ success: false, message: 'Invalid restaurant ID' });
        }

        // Validate status
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value. Must be \'approved\' or \'rejected\'.' });
        }

        // Find and update the restaurant
        const restaurant = await Restaurant.findByIdAndUpdate(
            restaurantId,
            { status: status },
            { new: true, runValidators: true } // Return the updated document and run schema validators
        );

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        // TODO: Optionally send notification to the restaurant owner about the status change

        return res.status(200).json({
            success: true,
            message: `Restaurant status updated to ${status}`,
            data: restaurant
        });

    } catch (error) {
        console.error('Error updating restaurant status:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update restaurant status'
        });
    }
});

module.exports = router; 
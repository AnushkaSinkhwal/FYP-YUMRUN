const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Notification = require('../models/notification');
const { auth, isAdmin, emailVerified } = require('../middleware/auth');
const RestaurantApproval = require('../models/restaurantApproval');
const Restaurant = require('../models/restaurant');
const Order = require('../models/order');
const mongoose = require('mongoose');
const fs = require('fs');
const { createNotification } = require('../utils/notifications'); // Import the function

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
    const userCount = await User.countDocuments(); // Removed { role: 'customer' } filter
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
    
    // Log incoming isActive value
    console.log(`[Admin Update User ${user._id}] Received isActive in body:`, req.body.isActive, `(type: ${typeof req.body.isActive})`);
    
    // Update isActive status - always update if provided in request
    if (isActive !== undefined) {
      console.log(`[Admin Update User ${user._id}] Current user.isActive:`, user.isActive);
      if (isActive !== user.isActive) { // Log only if it changes
         changes.isActive = { from: user.isActive, to: isActive };
         console.log(`[Admin Update User ${user._id}] Change detected for isActive. Setting to:`, isActive);
      }
      user.isActive = isActive;
      console.log(`[Admin Update User ${user._id}] user.isActive set to:`, user.isActive);
    }
    
    if (healthCondition && healthCondition !== user.healthCondition) {
      changes.healthCondition = { from: user.healthCondition, to: healthCondition };
      user.healthCondition = healthCondition;
    }
    
    // Log before saving
    console.log(`[Admin Update User ${user._id}] User object BEFORE save:`, { isActive: user.isActive, email: user.email, phone: user.phone });
    
    // Save the updated user with a promise to ensure it completes
    const savedUser = await user.save();
    
    // Log after saving
    console.log(`[Admin Update User ${user._id}] User object AFTER save:`, { isActive: savedUser.isActive, email: savedUser.email, phone: savedUser.phone });
    
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
      .select('-__v') // Exclude the __v field, include everything else including isRead
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
 * @route   GET /api/admin/notifications/unread-count
 * @desc    Get count of unread notifications
 * @access  Private/Admin
 */
router.get('/notifications/unread-count', auth, isAdmin, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ isRead: false });
    
    return res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get unread notifications count error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching unread notifications count'
    });
  }
});

/**
 * @route   PATCH /api/admin/notifications/:notificationId/read
 * @desc    Mark a notification as read
 * @access  Private/Admin
 */
router.patch('/notifications/:notificationId/read', auth, isAdmin, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Update the notification
    notification.isRead = true;
    await notification.save();
    
    return res.status(200).json({
      success: true,
      message: 'Notification marked as read successfully'
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
        const restaurantId = notification.data.restaurantId;
        if (!restaurantId) {
            return res.status(400).json({ success: false, message: 'Notification data missing restaurantId.' });
        }
        
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
             return res.status(404).json({ success: false, message: 'Restaurant associated with this update not found.' });
        }

        if (action === 'approve') {
          // Apply the changes stored in notification.data.submittedData
          const changesToApply = notification.data.submittedData;
          if (!changesToApply) {
               return res.status(400).json({ success: false, message: 'No changes found in notification data.' });
          }

          console.log(`Approving changes for restaurant ${restaurantId}:`, changesToApply);

          // Apply fields selectively
          if (changesToApply.name !== undefined) restaurant.name = changesToApply.name;
          if (changesToApply.description !== undefined) restaurant.description = changesToApply.description;
          if (changesToApply.address !== undefined) restaurant.address = changesToApply.address; // Assume direct assignment works for now
          if (changesToApply.openingHours !== undefined) restaurant.openingHours = changesToApply.openingHours;
          if (changesToApply.cuisine !== undefined) restaurant.cuisine = changesToApply.cuisine;
          if (changesToApply.isOpen !== undefined) restaurant.isActive = changesToApply.isOpen; // Map isOpen to isActive
          if (changesToApply.deliveryRadius !== undefined) restaurant.deliveryRadius = changesToApply.deliveryRadius;
          if (changesToApply.minimumOrder !== undefined) restaurant.minimumOrder = changesToApply.minimumOrder;
          if (changesToApply.deliveryFee !== undefined) restaurant.deliveryFee = changesToApply.deliveryFee;
          if (changesToApply.logo !== undefined) {
               // Optional: Delete old logo file before updating path
               // if (restaurant.logo && restaurant.logo !== changesToApply.logo && fs.existsSync(restaurant.logo.substring(1))) {
               //    fs.unlinkSync(restaurant.logo.substring(1));
               // }
               restaurant.logo = changesToApply.logo;
          }
           if (changesToApply.coverImage !== undefined) {
               // Optional: Delete old cover image file
               // if (restaurant.coverImage && restaurant.coverImage !== changesToApply.coverImage && fs.existsSync(restaurant.coverImage.substring(1))) {
               //    fs.unlinkSync(restaurant.coverImage.substring(1));
               // }
               restaurant.coverImage = changesToApply.coverImage;
          }
          // Add other fields as needed

          // Mark nested paths if necessary (e.g., if address or openingHours are complex objects)
          // restaurant.markModified('address');
          // restaurant.markModified('openingHours');

          try {
               await restaurant.save();
               console.log(`Restaurant ${restaurantId} updated successfully.`);
          } catch (saveError) {
               console.error(`Error saving restaurant ${restaurantId} during approval:`, saveError);
               return res.status(500).json({ success: false, message: `Failed to save restaurant updates: ${saveError.message}` });
          }
          
          // Update notification status
          notification.status = 'APPROVED';
          notification.processedBy = req.user.id;
          notification.processedAt = new Date();
          await notification.save();
          
          // Create a notification for the restaurant owner
          const ownerNotification = new Notification({
            userId: notification.userId, // The owner who requested the change
            type: 'SYSTEM',
            title: 'Restaurant Update Approved',
            message: 'Your requested restaurant profile changes have been approved by the admin.',
            isRead: false,
            data: { restaurantId: restaurant._id } // Include restaurant ID for context
          });
          await ownerNotification.save();
          
          return res.status(200).json({
            success: true,
            message: 'Restaurant update approved successfully'
          });
        } else { // action === 'reject'
          // Reject - need a reason
          if (!reason) {
            return res.status(400).json({ success: false, message: 'Rejection reason is required' });
          }

          console.log(`Rejecting changes for restaurant ${restaurantId}. Reason: ${reason}`);
          
          // Update notification status
          notification.status = 'REJECTED';
          notification.processedBy = req.user.id;
          notification.processedAt = new Date();
          notification.rejectionReason = reason;
          await notification.save();

          // **Important**: If files were uploaded during the rejected request, they should be deleted.
          // Access file paths from notification.data.submittedData.logo / .coverImage IF they differ from original restaurant.logo / .coverImage
          const rejectedData = notification.data.submittedData || {};
          const originalLogo = restaurant.logo;
          const originalCover = restaurant.coverImage;

          if (rejectedData.logo && rejectedData.logo !== originalLogo) {
               try {
                    if (fs.existsSync(rejectedData.logo.substring(1))) {
                         fs.unlinkSync(rejectedData.logo.substring(1));
                         console.log(`Deleted rejected logo file: ${rejectedData.logo}`);
                    }
               } catch (fileError) {
                    console.error(`Error deleting rejected logo file ${rejectedData.logo}:`, fileError);
               }
          }
           if (rejectedData.coverImage && rejectedData.coverImage !== originalCover) {
              try {
                   if (fs.existsSync(rejectedData.coverImage.substring(1))) {
                        fs.unlinkSync(rejectedData.coverImage.substring(1));
                        console.log(`Deleted rejected cover image file: ${rejectedData.coverImage}`);
                   }
              } catch (fileError) {
                   console.error(`Error deleting rejected cover image file ${rejectedData.coverImage}:`, fileError);
              }
          }
          
          // Create a notification for the restaurant owner
          const ownerNotification = new Notification({
            userId: notification.userId,
            type: 'SYSTEM',
            title: 'Restaurant Update Rejected',
            message: `Your requested restaurant profile changes have been rejected by the admin. Reason: ${reason}`,
            isRead: false,
            data: { restaurantId: restaurant._id, reason: reason }
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

/**
 * @route   GET /api/admin/restaurants
 * @desc    Get all restaurants for admin view
 * @access  Private/Admin
 */
router.get('/restaurants', auth, isAdmin, async (req, res) => {
    try {
        // Fetch ALL restaurants, including those marked as deleted
        // const restaurantDocuments = await Restaurant.find({ status: { $ne: 'deleted' } })
        const restaurantDocuments = await Restaurant.find()
            .populate('owner', 'name email') // Populate owner info
            .sort({ createdAt: -1 }); // Sort by creation date

        const restaurants = restaurantDocuments.map(restaurant => {
            // Basic validation for owner existence
            const ownerName = restaurant.owner ? restaurant.owner.name : 'N/A';
            const ownerEmail = restaurant.owner ? restaurant.owner.email : 'N/A';
            
            // Safely access nested properties
            const address = restaurant.address || {};
            const contactInfo = restaurant.contactInfo || {};

            return {
                id: restaurant._id,
                name: restaurant.name,
                ownerName: ownerName,
                ownerEmail: ownerEmail,
                ownerId: restaurant.owner ? restaurant.owner._id : null,
                email: contactInfo.email || 'N/A', // Assuming this is restaurant contact email
                phone: contactInfo.phone || 'N/A', // Assuming this is restaurant contact phone
                address: address.street ? `${address.street}, ${address.city}, ${address.state}` : 'N/A',
                cuisine: restaurant.cuisine && restaurant.cuisine.length > 0 ? restaurant.cuisine.join(', ') : 'N/A',
                joined: restaurant.createdAt.toLocaleDateString(),
                rating: restaurant.rating || 'N/A',
                logo: restaurant.logo, // Include logo for display
                status: restaurant.status || 'N/A' // Return raw status
            };
        });

        res.status(200).json({
            success: true,
            restaurants: restaurants
        });
    } catch (error) {
        console.error('Error fetching restaurants for admin:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching restaurants'
        });
    }
});

// GET route for detailed restaurant view (if needed by admin panel)
router.get('/restaurants/:id', auth, isAdmin, async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id)
                                      .populate('owner', 'name email');

        // If the restaurant document is not found at all, return 404
        if (!restaurant) { 
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        // Map to a detailed view model if necessary, similar to the list view
        // For now, returning the full restaurant object (excluding sensitive data if any)
        res.status(200).json({ success: true, restaurant }); 

    } catch (error) {
        console.error('Error fetching restaurant details for admin:', error);
        // Handle CastError specifically for invalid ID format
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: 'Invalid restaurant ID format' });
        }
        res.status(500).json({ success: false, message: 'Server error fetching restaurant details' });
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
            const notificationTitle = 'Restaurant Approved';
            const notificationMessage = 'Your restaurant has been approved by the administrator.';
            const notificationType = 'RESTAURANT_APPROVAL';
                 
            await createNotification({
                userId: restaurant._id,
                title: notificationTitle,
                message: notificationMessage,
                type: notificationType,
                status: 'PENDING',
                data: { 
                    restaurantId: restaurant._id, 
                    restaurantName: restaurant.name,
                    reason: undefined 
                }
            });

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
        const notificationTitle = 'Restaurant Rejected';
        const notificationMessage = `Your restaurant registration has been rejected by the administrator. Reason: ${reason}`;
        const notificationType = 'RESTAURANT_REJECTION';
                 
        await createNotification({
            userId: approval.restaurantId,
            title: notificationTitle,
            message: notificationMessage,
            type: notificationType,
            status: 'PENDING',
            data: { 
                restaurantId: approval.restaurantId, 
                restaurantName: approval.restaurantName,
                reason: reason 
            }
        });
        
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
    
    // *** START NEW VALIDATION ***
    // Prevent creating admin or restaurant users via this general user creation route
    if (role === 'admin' || role === 'restaurant') { 
      console.log(`POST /admin/users - Attempt to create restricted role (${role}) user rejected`);
      return res.status(403).json({
        success: false,
        message: `Creating users with role '${role}' is not allowed via this endpoint. Use Restaurant Management for owners.`
      });
    }
    // *** END NEW VALIDATION ***
    
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
    
    // Prevent creating admin or restaurant users via this route
    if (role === 'admin' || role === 'restaurant') { 
      console.log(`POST /admin/users - Attempt to create restricted role (${role}) user rejected`);
      return res.status(403).json({
        success: false,
        message: `Creating users with role '${role}' is not allowed via this endpoint. Use Restaurant Management for owners.`
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
          formatted: restaurantAddress,
          street: restaurantAddress, // Add street info for better display
          city: '', // These can be populated more specifically if address parts available
          state: '',
          zipCode: '',
          country: ''
        },
        description: restaurantDescription || `${restaurantName} restaurant`,
        owner: savedUser._id,
        isApproved,
        isActive,
        cuisine,
        priceRange,
        // Store contact info in the proper nested object
        contactInfo: {
          phone: phone,
          email: email,
          website: ''
        },
        // Keep top-level values for backward compatibility
        phone: phone,
        email: email,
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

// PATCH update restaurant status (approve, reject, delete)
router.patch('/restaurants/:restaurantId/status', auth, isAdmin, async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { status, reason } = req.body; // Expect 'status' ('approved', 'rejected', 'deleted') and optional 'reason'

        // Validate restaurant ID
        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ success: false, message: 'Invalid restaurant ID' });
        }

        // Validate status against the updated enum in the model
        const validStatuses = Restaurant.schema.path('status').enumValues;
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: `Invalid status value. Must be one of: ${validStatuses.join(', ')}.` 
            });
        }
        
        // If rejecting or deleting, reason might be required/useful
        if ((status === 'rejected' || status === 'deleted') && !reason) {
             console.warn(`${status === 'rejected' ? 'Rejecting' : 'Deleting'} restaurant ${restaurantId} without a reason.`);
             // Optionally enforce reason:
             // if (status === 'rejected') {
             //    return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
             // }
        }

        // Find the restaurant
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }
        
        const previousStatus = restaurant.status;
        restaurant.status = status;
        
        await restaurant.save();
        console.log(`Restaurant ${restaurantId} status updated from ${previousStatus} to ${status}.`);

        // Find owner for notification and potential deactivation
        const owner = await User.findById(restaurant.owner);
        if (owner) {
             // If owner details were linked to restaurant status, update them (e.g., restaurantDetails.approved)
             // This part might need removal if `isApproved` was removed from User model too
            // if (owner.restaurantDetails) {
            //     owner.restaurantDetails.approved = (status === 'approved');
            //     await owner.save();
            //     console.log(`Owner (${owner._id}) restaurantDetails.approved updated.`);
            // }

            // --- Handle Owner Login Status for 'deleted' --- 
            // If the restaurant is deleted, we might want to deactivate the owner account or remove their role
            // Option A: Deactivate owner account (prevents login)
            if (status === 'deleted' && owner.isActive) {
                owner.isActive = false;
                await owner.save();
                console.log(`Owner account ${owner._id} deactivated due to restaurant deletion.`);
            } else if (status === 'approved' && !owner.isActive) {
                // Optional: Reactivate owner if restaurant is approved (if previously deleted/deactivated)
                owner.isActive = true;
                await owner.save();
                console.log(`Owner account ${owner._id} reactivated due to restaurant approval.`);
            }
            // Option B: Change owner role (allows login as customer)
            // if (status === 'deleted' && owner.role === 'restaurant') {
            //     owner.role = 'customer';
            //     await owner.save();
            //     console.log(`Owner ${owner._id} role changed to customer due to restaurant deletion.`);
            // }
             // Option C: Keep owner active, but check restaurant status during login (preferred?)
             // -> This requires modification in the login route or auth middleware

            // --- Send Notification --- 
            let notificationTitle = '';
            let notificationMessage = '';
            let notificationType = '';

            switch (status) {
                case 'approved':
                    notificationTitle = 'Restaurant Approved';
                    notificationMessage = 'Your restaurant registration has been approved by the administrator.';
                    notificationType = 'RESTAURANT_APPROVAL';
                    break;
                case 'rejected':
                    notificationTitle = 'Restaurant Rejected';
                    notificationMessage = `Your restaurant registration has been rejected.${reason ? ' Reason: ' + reason : ''}`;
                    notificationType = 'RESTAURANT_REJECTION';
                    break;
                case 'deleted':
                    notificationTitle = 'Restaurant Deleted';
                    notificationMessage = `Your restaurant has been marked as deleted by the administrator.${reason ? ' Reason: ' + reason : ''}`;
                    notificationType = 'SYSTEM'; // Use generic SYSTEM type
                    break;
                // Add cases for 'active'/'inactive' if they are re-introduced
            }

            if (notificationTitle) {
                await createNotification({
                    userId: owner._id,
                    title: notificationTitle,
                    message: notificationMessage,
                    type: notificationType, // Use the determined type
                    status: 'PENDING', // Assuming admin actions generate PENDING notifications for user
                    data: { restaurantId: restaurant._id, restaurantName: restaurant.name, reason: reason }
                });
            } else {
                 console.warn(`Notification not created for status update to "${status}" for restaurant ${restaurantId} - title was empty.`);
            }
        } else {
             console.warn(`Owner (${restaurant.owner}) not found for restaurant ${restaurantId} during status update notification.`);
        }

        return res.status(200).json({
            success: true,
            message: `Restaurant status updated to ${status}`,
            data: { // Return updated restaurant basic info
                 id: restaurant._id,
                 name: restaurant.name,
                 status: restaurant.status
            }
        });

    } catch (error) {
        console.error('Error updating restaurant status:', error);
        if (error.name === 'ValidationError') {
             return res.status(400).json({ success: false, message: `Validation Error: ${error.message}` });
        }
        return res.status(500).json({
            success: false,
            message: 'Failed to update restaurant status: ' + error.message
        });
    }
});

// DELETE a restaurant - Replaced by PATCH status to 'deleted'
// router.delete('/restaurants/:restaurantId', auth, isAdmin, async (req, res) => { ... });

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

// PATCH update restaurant details (Admin only)
router.patch('/restaurants/:restaurantId/details', auth, isAdmin, async (req, res) => {
    const { restaurantId } = req.params;
    // Destructure all potentially editable fields from the request body
    const { 
        name, 
        description, 
        cuisine, // Expect array or comma-separated string
        priceRange, 
        contactInfo, // Expect { phone, email, website }
        address, // Expect { street, city, state, zipCode, country }
        openingHours // Expect object structure like in the model
        // Add other top-level fields if needed (e.g., logo, coverImage if admin can change these)
    } = req.body; 

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
        return res.status(400).json({ success: false, message: 'Invalid restaurant ID format' });
    }
    // Add more specific validation if needed, e.g., check if name is empty

    try {
        const restaurant = await Restaurant.findById(restaurantId);

        if (!restaurant || restaurant.status === 'deleted') {
            return res.status(404).json({ success: false, message: 'Restaurant not found or has been deleted' });
        }

        // Prepare update object and markModified paths
        const updateData = {};
        const modifiedPaths = [];

        if (name !== undefined) restaurant.name = name;
        if (description !== undefined) restaurant.description = description;
        if (priceRange !== undefined) restaurant.priceRange = priceRange;
        
        // Handle cuisine (assuming frontend sends array)
        if (cuisine !== undefined && Array.isArray(cuisine)) {
             restaurant.cuisine = cuisine;
             modifiedPaths.push('cuisine');
        }

        // Handle contactInfo (merge existing with new, allows partial updates)
        if (contactInfo !== undefined && typeof contactInfo === 'object') {
            restaurant.contactInfo = { ...restaurant.contactInfo, ...contactInfo };
            modifiedPaths.push('contactInfo');
        }

        // Handle address (merge existing with new)
        if (address !== undefined && typeof address === 'object') {
            restaurant.address = { ...restaurant.address, ...address };
            modifiedPaths.push('address');
        }
        
        // Handle openingHours (merge existing with new)
        if (openingHours !== undefined && typeof openingHours === 'object') {
             // Iterate through days and update if provided
             Object.keys(openingHours).forEach(day => {
                  if (restaurant.openingHours[day] && openingHours[day]) {
                       restaurant.openingHours[day] = { ...restaurant.openingHours[day], ...openingHours[day] };
                  }
             });
             modifiedPaths.push('openingHours');
        }
        
        // Mark modified paths for Mongoose to detect changes in nested objects/arrays
        modifiedPaths.forEach(path => restaurant.markModified(path));
        
        restaurant.updatedAt = Date.now(); // Explicitly update the timestamp

        const updatedRestaurant = await restaurant.save();
        console.log(`Restaurant ${restaurantId} details updated by admin.`);

        // Optionally, send notification to owner
        // await createNotification({ ... });

        return res.status(200).json({
            success: true,
            message: 'Restaurant details updated successfully',
            restaurant: updatedRestaurant // Return the full updated restaurant object
        });

    } catch (error) {
        console.error(`Error updating restaurant details for ${restaurantId}:`, error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: `Validation Error: ${error.message}` });
        }
        return res.status(500).json({
            success: false,
            message: 'Failed to update restaurant details: ' + error.message
        });
    }
});

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders for admin view
 * @access  Private/Admin
 */
router.get('/orders', auth, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email phone') // Populate user details including phone
      .populate('restaurantId', 'name') // Populate restaurant name
      .populate('assignedRider', 'name') // Populate assigned rider info
      .populate({ // Populate the user who updated the status in the history
        path: 'statusUpdates.updatedBy',
        select: 'name' // Select only the name field
      })
      .sort({ createdAt: -1 }); // Sort by newest first

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders: orders,
    });
  } catch (error) {
    console.error('Admin get orders error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching orders',
    });
  }
});

// Utility: allowed order status transitions
const allowedTransitions = {
  PENDING: ['CONFIRMED','CANCELLED'],
  CONFIRMED: ['PREPARING','CANCELLED'],
  PREPARING: ['READY','CANCELLED'],
  READY: ['OUT_FOR_DELIVERY','CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED','CANCELLED'],
  DELIVERED: [],
  CANCELLED: []
};

/**
 * @route   GET /api/admin/deliveries
 * @desc    Get deliveries for admin view (orders in progress)
 * @access  Private/Admin
 */
router.get('/deliveries', auth, isAdmin, async (req, res) => {
  try {
    const deliveries = await Order.find({ status: { $in: ['PREPARING','READY','OUT_FOR_DELIVERY'] } })
      .populate('userId', 'name email')
      .populate('restaurantId', 'name')
      .populate('assignedRider', 'name');  // Populate new assignedRider field
    return res.status(200).json({ success: true, deliveries });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch deliveries' });
  }
});

/**
 * @route   PATCH /api/admin/orders/:orderId/status
 * @desc    Update the status of an order with transition rules and optional rider assignment
 * @access  Private/Admin
 */
router.patch('/orders/:orderId/status', auth, isAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, riderId } = req.body;
    const adminUserId = req.user.userId;

    // Validate status
    const validStatuses = Order.schema.path('status').enumValues;
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const prev = order.status;
    // Enforce allowed transition
    if (!allowedTransitions[prev] || !allowedTransitions[prev].includes(status)) {
      return res.status(400).json({ success: false, message: `Cannot change status from ${prev} to ${status}` });
    }

    // If moving to OUT_FOR_DELIVERY, require riderId
    if (status === 'OUT_FOR_DELIVERY') {
      if (!riderId || !mongoose.Types.ObjectId.isValid(riderId)) {
        return res.status(400).json({ success: false, message: 'A valid riderId is required when assigning for delivery' });
      }
      // Assign rider to the order
      order.assignedRider = riderId;
      // For backward compatibility
      order.deliveryPersonId = riderId;
    }

    order.status = status;
    order.statusUpdates.push({ status, timestamp: new Date(), updatedBy: adminUserId });

    if (status === 'DELIVERED' && !order.actualDeliveryTime) {
      order.actualDeliveryTime = new Date();
    }

    const updated = await order.save();
    return res.status(200).json({ success: true, message: 'Order status updated', order: updated });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ success: false, message: 'Server error updating status' });
  }
});

/**
 * @route   PUT /api/admin/riders/:id/approve
 * @desc    Approve or reject a delivery rider
 * @access  Private/Admin
 */
router.put('/riders/:id/approve', auth, isAdmin, async (req, res) => {
  try {
    const { approved } = req.body;
    
    if (approved === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Approved status is required'
      });
    }
    
    // Find the rider
    const rider = await User.findOne({ 
      _id: req.params.id,
      role: 'delivery_rider'
    });
    
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'Delivery rider not found'
      });
    }
    
    // If rider doesn't have deliveryRiderDetails, initialize it
    if (!rider.deliveryRiderDetails) {
      rider.deliveryRiderDetails = {};
    }
    
    // Update approval status
    rider.deliveryRiderDetails.approved = approved;
    
    // Save the updated rider
    await rider.save();
    
    // Create notification for the rider
    await createNotification({
      userId: rider._id,
      title: approved ? 'Account Approved' : 'Account Approval Revoked',
      message: approved 
        ? 'Your delivery rider account has been approved. You can now accept delivery orders.'
        : 'Your delivery rider account approval has been revoked. Please contact support for more information.',
      type: 'ACCOUNT_UPDATE',
      status: 'PENDING'
    });
    
    return res.status(200).json({
      success: true,
      message: `Rider ${approved ? 'approved' : 'approval revoked'} successfully`,
      rider: {
        id: rider._id,
        fullName: rider.fullName,
        approved: rider.deliveryRiderDetails.approved
      }
    });
  } catch (error) {
    console.error('Error updating rider approval status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 
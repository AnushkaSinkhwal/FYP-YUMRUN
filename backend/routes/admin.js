const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Notification = require('../models/notification');
const { auth, isAdmin, adminOnly } = require('../middleware/auth');

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
router.get('/dashboard', auth, adminOnly, async (req, res) => {
  try {
    // Get counts for dashboard
    const userCount = await User.countDocuments({ isAdmin: false, isRestaurantOwner: false });
    const restaurantCount = await User.countDocuments({ isRestaurantOwner: true });
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
router.get('/users', auth, adminOnly, async (req, res) => {
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
router.get('/users/:userId', auth, adminOnly, async (req, res) => {
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
router.put('/users/:userId', auth, adminOnly, async (req, res) => {
  try {
    const { name, email, phone, isAdmin, isRestaurantOwner, isDeliveryStaff } = req.body;
    
    // Find the user
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    
    // Update role fields if provided
    if (isAdmin !== undefined) user.isAdmin = isAdmin;
    if (isRestaurantOwner !== undefined) user.isRestaurantOwner = isRestaurantOwner;
    if (isDeliveryStaff !== undefined) user.isDeliveryStaff = isDeliveryStaff;
    
    // Save the updated user
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
});

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Delete user
 * @access  Private/Admin
 */
router.delete('/users/:userId', auth, adminOnly, async (req, res) => {
  try {
    // Cannot delete yourself
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }
    
    const user = await User.findByIdAndDelete(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
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
router.get('/notifications', auth, adminOnly, async (req, res) => {
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
router.get('/notifications/count', auth, adminOnly, async (req, res) => {
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
 * @desc    Process a notification (approve/reject)
 * @access  Private/Admin
 */
router.post('/notifications/:notificationId/process', auth, adminOnly, async (req, res) => {
  try {
    const { action, reason } = req.body;
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approve" or "reject"'
      });
    }
    
    // If rejecting, require a reason
    if (action === 'reject' && !reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    // Find the notification
    const notification = await Notification.findById(req.params.notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Check if notification is already processed
    if (notification.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Notification is already ${notification.status.toLowerCase()}`
      });
    }
    
    // Get the user
    const user = await User.findById(notification.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Process based on notification type
    if (action === 'approve') {
      if (notification.type === 'PROFILE_UPDATE') {
        // Apply the changes to the user profile
        const changes = notification.data;
        
        // Update user fields
        if (changes.name) user.name = changes.name;
        if (changes.email) user.email = changes.email;
        if (changes.phone) user.phone = changes.phone;
        
        // Update restaurant details if applicable
        if (changes.restaurantDetails && user.isRestaurantOwner) {
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
      } else if (notification.type === 'RESTAURANT_REGISTRATION') {
        // Approve a restaurant registration
        if (user.restaurantDetails) {
          user.restaurantDetails.approved = true;
          user.restaurantDetails.approvedAt = new Date();
          user.restaurantDetails.approvedBy = req.user._id;
          
          // Save the updated user
          await user.save();
        }
      }
      
      // Update notification status
      notification.status = 'APPROVED';
    } else {
      // Reject the notification
      notification.status = 'REJECTED';
      notification.rejectionReason = reason;
    }
    
    // Update common fields
    notification.processedBy = req.user._id;
    notification.processedAt = new Date();
    
    // Save the notification
    await notification.save();
    
    return res.status(200).json({
      success: true,
      message: `Notification ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      notification
    });
  } catch (error) {
    console.error('Process notification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing notification'
    });
  }
});

/**
 * @route   POST /api/admin/users/:userId/approve-changes
 * @desc    Directly approve user profile changes
 * @access  Private/Admin
 */
router.post('/users/:userId/approve-changes', auth, adminOnly, async (req, res) => {
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
    if (changes.restaurantDetails && user.isRestaurantOwner) {
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
router.post('/users/:userId/reject-changes', auth, adminOnly, async (req, res) => {
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

// GET restaurant owners
router.get('/owners', auth, isAdmin, async (req, res) => {
    try {
        const owners = await User.find({ isRestaurantOwner: true }).select('-password');
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

// GET system statistics
router.get('/statistics', auth, isAdmin, async (req, res) => {
    try {
        const userCount = await User.countDocuments({ isAdmin: false });
        const ownerCount = await User.countDocuments({ isRestaurantOwner: true });
        const staffCount = await User.countDocuments({ isDeliveryStaff: true });
        
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

// GET restaurant approval requests
router.get('/restaurant-approvals', auth, isAdmin, (req, res) => {
    res.status(200).json({ message: 'Restaurant approval requests' });
});

// POST approve/reject restaurant
router.post('/restaurant-approvals/:id', auth, isAdmin, (req, res) => {
    res.status(200).json({ message: `Process restaurant approval for ID: ${req.params.id}` });
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

module.exports = router; 
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { auth, isAdmin } = require('../middleware/auth');

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
 * @desc    Get dashboard data for admin
 * @access  Private/Admin
 */
router.get('/dashboard', auth, isAdmin, async (req, res) => {
  try {
    // Get user counts
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ isAdmin: true });
    const restaurantOwners = await User.countDocuments({ isRestaurantOwner: true });
    const deliveryStaff = await User.countDocuments({ isDeliveryStaff: true });
    const regularUsers = await User.countDocuments({ 
      isAdmin: false, 
      isRestaurantOwner: false,
      isDeliveryStaff: false
    });

    // Return dashboard data
    return res.status(200).json({
      success: true,
      data: {
        userStats: {
          total: totalUsers,
          admins: adminUsers,
          restaurantOwners: restaurantOwners,
          deliveryStaff: deliveryStaff,
          regularUsers: regularUsers
        }
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users for admin
 * @access  Private/Admin
 */
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    return res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID for admin
 * @access  Private/Admin
 */
router.get('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Admin get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user by ID for admin
 * @access  Private/Admin
 */
router.put('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const { name, email, phone, isAdmin, isRestaurantOwner, isDeliveryStaff, healthCondition } = req.body;
    
    // Build update object with only provided fields
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (isAdmin !== undefined) updateFields.isAdmin = isAdmin;
    if (isRestaurantOwner !== undefined) updateFields.isRestaurantOwner = isRestaurantOwner;
    if (isDeliveryStaff !== undefined) updateFields.isDeliveryStaff = isDeliveryStaff;
    if (healthCondition) updateFields.healthCondition = healthCondition;
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user by ID for admin
 * @access  Private/Admin
 */
router.delete('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    // Don't allow admin to delete themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.deleteOne();
    
    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
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
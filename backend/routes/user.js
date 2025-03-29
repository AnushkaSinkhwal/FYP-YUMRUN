const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user'); // Import the User model
const router = express.Router();
const { body, validationResult } = require('express-validator'); // For validation
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth');

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

// GET user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prepare response based on user type
        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            isAdmin: user.isAdmin,
            isRestaurantOwner: user.isRestaurantOwner,
            isDeliveryStaff: user.isDeliveryStaff
        };

        // Add role-specific data
        if (!user.isAdmin && !user.isRestaurantOwner && !user.isDeliveryStaff) {
            userData.healthCondition = user.healthCondition;
        }

        if (user.isRestaurantOwner && user.restaurantDetails) {
            userData.restaurantDetails = user.restaurantDetails;
        }

        res.status(200).json({
            success: true,
            user: userData
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT update health details (regular users only)
router.put('/health-details', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Check if user is a regular user (not admin, restaurant owner, or delivery staff)
        if (user.isAdmin || user.isRestaurantOwner || user.isDeliveryStaff) {
            return res.status(403).json({ success: false, message: 'Only regular users can update health details' });
        }

        // Update health condition
        user.healthCondition = req.body.healthCondition;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Health details updated successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                healthCondition: user.healthCondition
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        // Find the current user data to compare changes
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if this is a restaurant owner (for approval process)
        const isRestaurantOwner = currentUser.isRestaurantOwner;
        const hasChanges = req.body.name !== currentUser.name || 
                         req.body.email !== currentUser.email || 
                         req.body.phone !== currentUser.phone;

        // For restaurant owners, if there are changes, we create a pending request
        // and don't immediately apply changes
        if (isRestaurantOwner && hasChanges) {
            // In a real implementation, save to a Notifications or PendingChanges collection
            // For this mock implementation, we'll return a success message
            
            // For a real app, you would:
            // 1. Create a notification in the database
            // 2. Return the original user data until approved
            
            return res.status(200).json({
                success: true,
                message: 'Your profile update request has been submitted for approval. Changes will be applied once approved by an administrator.',
                user: {
                    id: currentUser._id,
                    name: currentUser.name,
                    email: currentUser.email,
                    phone: currentUser.phone,
                    isAdmin: currentUser.isAdmin,
                    isRestaurantOwner: currentUser.isRestaurantOwner,
                    isDeliveryStaff: currentUser.isDeliveryStaff,
                    restaurantDetails: currentUser.restaurantDetails
                }
            });
        }
        
        // For regular users and admins, apply changes immediately
        const updatedFields = {};
        
        // Only update fields that are provided
        if (req.body.name) updatedFields.name = req.body.name;
        if (req.body.phone) updatedFields.phone = req.body.phone;
        
        // Email change requires special verification (in a real app)
        // For now, just update it
        if (req.body.email && req.body.email !== currentUser.email) {
            // Check if the new email is already in use
            const emailExists = await User.findOne({ email: req.body.email });
            if (emailExists) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
            updatedFields.email = req.body.email;
        }
        
        // Update restaurant details if applicable and provided
        if (isRestaurantOwner && req.body.restaurantDetails) {
            // Don't allow changes to approval status via this route
            const { name, address, description, cuisineType } = req.body.restaurantDetails;
            
            if (!currentUser.restaurantDetails) {
                currentUser.restaurantDetails = {};
            }
            
            if (name) updatedFields['restaurantDetails.name'] = name;
            if (address) updatedFields['restaurantDetails.address'] = address;
            if (description) updatedFields['restaurantDetails.description'] = description;
            if (cuisineType) updatedFields['restaurantDetails.cuisineType'] = cuisineType;
        }
        
        // Update health condition for regular users
        if (!isRestaurantOwner && !currentUser.isAdmin && !currentUser.isDeliveryStaff && req.body.healthCondition) {
            updatedFields.healthCondition = req.body.healthCondition;
        }

        // Update the user
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updatedFields },
            { new: true }
        );

        // Return the updated user
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                healthCondition: updatedUser.healthCondition,
                isAdmin: updatedUser.isAdmin,
                isRestaurantOwner: updatedUser.isRestaurantOwner,
                isDeliveryStaff: updatedUser.isDeliveryStaff,
                ...(updatedUser.restaurantDetails && { restaurantDetails: updatedUser.restaurantDetails })
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Change password
router.put('/change-password', auth, [
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

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Save the updated user
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   GET /api/users/profile/change-status
 * @desc    Get the status of pending profile changes
 * @access  Private
 */
router.get('/profile/change-status', auth, async (req, res) => {
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

module.exports = router;

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const RestaurantApproval = require('../models/restaurantApproval');
const User = require('../models/user');

// Placeholder route for getting all restaurants
router.get('/', async (req, res) => {
  try {
    // This is a placeholder - would normally fetch from database
    res.status(200).json({
      success: true,
      message: 'Restaurant routes working',
      data: []
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit profile update request
router.post('/update-profile', auth, async (req, res) => {
    try {
        // Verify user is a restaurant owner
        if (!req.user.isRestaurantOwner) {
            return res.status(403).json({
                success: false,
                error: 'Only restaurant owners can update their profile'
            });
        }

        const {
            name,
            email,
            phone,
            restaurantName,
            restaurantAddress
        } = req.body;

        // Create approval request
        const approval = new RestaurantApproval({
            restaurantId: req.user._id,
            currentData: {
                name: req.user.name,
                email: req.user.email,
                phone: req.user.phone,
                restaurantName: req.user.restaurantName,
                restaurantAddress: req.user.restaurantAddress
            },
            requestedData: {
                name,
                email,
                phone,
                restaurantName,
                restaurantAddress
            }
        });

        await approval.save();

        res.status(201).json({
            success: true,
            message: 'Profile update request submitted for approval'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get pending changes for a restaurant
router.get('/pending-changes', auth, async (req, res) => {
    try {
        // Verify user is a restaurant owner
        if (!req.user.isRestaurantOwner) {
            return res.status(403).json({
                success: false,
                error: 'Only restaurant owners can view their pending changes'
            });
        }

        const pendingChanges = await RestaurantApproval.findOne({
            restaurantId: req.user._id,
            status: 'pending'
        });

        res.status(200).json({
            success: true,
            pendingChanges
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Export the router
module.exports = router; 
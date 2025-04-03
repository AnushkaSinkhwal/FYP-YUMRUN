const express = require('express');
const router = express.Router();
const { auth, isRestaurantOwner } = require('../middleware/auth');
const RestaurantApproval = require('../models/restaurantApproval');
const User = require('../models/user');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Notification = require('../models/notification');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/restaurants';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// GET restaurant profile information
router.get('/profile', auth, isRestaurantOwner, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Check for pending approval changes
        const pendingApproval = await RestaurantApproval.findOne({
            restaurantId: req.user.userId,
            status: 'pending'
        });
        
        // Prepare the profile data with current values
        const profileData = {
            name: user.restaurantDetails?.name || '',
            description: user.restaurantDetails?.description || '',
            address: user.restaurantDetails?.address || '',
            phone: user.phone || '',
            email: user.email || '',
            openingHours: user.restaurantDetails?.openingHours || {},
            cuisine: user.restaurantDetails?.cuisine || [],
            isOpen: user.restaurantDetails?.isOpen !== undefined ? user.restaurantDetails.isOpen : true,
            deliveryRadius: user.restaurantDetails?.deliveryRadius || 5,
            minimumOrder: user.restaurantDetails?.minimumOrder || 0,
            deliveryFee: user.restaurantDetails?.deliveryFee || 0,
            logo: user.restaurantDetails?.logo || null,
            coverImage: user.restaurantDetails?.coverImage || null
        };
        
        // Return restaurant profile information with pending changes if they exist
        return res.status(200).json({
            success: true,
            data: profileData,
            pendingChanges: pendingApproval ? {
                hasPendingChanges: true,
                name: pendingApproval.requestedData.name,
                email: pendingApproval.requestedData.email,
                phone: pendingApproval.requestedData.phone,
                restaurantName: pendingApproval.requestedData.restaurantName,
                restaurantAddress: pendingApproval.requestedData.restaurantAddress,
                submittedAt: pendingApproval.createdAt
            } : {
                hasPendingChanges: false
            }
        });
    } catch (error) {
        console.error('Error fetching restaurant profile:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
});

// PUT update restaurant profile
router.put('/profile', [auth, isRestaurantOwner, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
])], async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Extract fields from request body
        const {
            name, 
            description, 
            address, 
            phone, 
            openingHours, 
            cuisine, 
            isOpen, 
            deliveryRadius, 
            minimumOrder, 
            deliveryFee
        } = req.body;
        
        // Update restaurant details
        if (!user.restaurantDetails) {
            user.restaurantDetails = {};
        }
        
        // Update fields if provided
        if (name) user.restaurantDetails.name = name;
        if (description) user.restaurantDetails.description = description;
        if (address) user.restaurantDetails.address = address;
        
        // Handle phone number update with validation
        if (phone && phone !== user.phone) {
            // Validate phone number format (10 digits)
            if (!/^\d{10}$/.test(phone)) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number must be exactly 10 digits'
                });
            }
            user.phone = phone;
        }
        
        // Handle JSON fields
        if (openingHours) {
            try {
                user.restaurantDetails.openingHours = typeof openingHours === 'string' 
                    ? JSON.parse(openingHours) 
                    : openingHours;
            } catch (e) {
                console.error('Error parsing openingHours:', e);
            }
        }
        
        if (cuisine) {
            try {
                user.restaurantDetails.cuisine = typeof cuisine === 'string' 
                    ? JSON.parse(cuisine) 
                    : cuisine;
            } catch (e) {
                console.error('Error parsing cuisine:', e);
            }
        }
        
        // Handle boolean/number fields
        if (isOpen !== undefined) {
            user.restaurantDetails.isOpen = isOpen === 'true' || isOpen === true;
        }
        
        if (deliveryRadius) {
            user.restaurantDetails.deliveryRadius = parseFloat(deliveryRadius);
        }
        
        if (minimumOrder) {
            user.restaurantDetails.minimumOrder = parseFloat(minimumOrder);
        }
        
        if (deliveryFee) {
            user.restaurantDetails.deliveryFee = parseFloat(deliveryFee);
        }
        
        // Handle uploaded files
        if (req.files) {
            // Handle logo upload
            if (req.files.logo && req.files.logo.length > 0) {
                // Delete old logo if exists
                if (user.restaurantDetails.logo && fs.existsSync(user.restaurantDetails.logo.substring(1))) {
                    try {
                        fs.unlinkSync(user.restaurantDetails.logo.substring(1));
                    } catch (e) {
                        console.error('Error deleting old logo:', e);
                    }
                }
                
                user.restaurantDetails.logo = '/' + req.files.logo[0].path;
            }
            
            // Handle cover image upload
            if (req.files.coverImage && req.files.coverImage.length > 0) {
                // Delete old cover image if exists
                if (user.restaurantDetails.coverImage && fs.existsSync(user.restaurantDetails.coverImage.substring(1))) {
                    try {
                        fs.unlinkSync(user.restaurantDetails.coverImage.substring(1));
                    } catch (e) {
                        console.error('Error deleting old cover image:', e);
                    }
                }
                
                user.restaurantDetails.coverImage = '/' + req.files.coverImage[0].path;
            }
        }
        
        // Explicitly save the user with a promise
        const savedUser = await user.save();
        
        // Log the successful update
        console.log(`Restaurant profile updated successfully. User ID: ${savedUser._id}, Phone: ${savedUser.phone}`);
        
        return res.status(200).json({
            success: true,
            message: 'Restaurant profile updated successfully',
            data: {
                name: savedUser.restaurantDetails.name,
                description: savedUser.restaurantDetails.description,
                address: savedUser.restaurantDetails.address,
                phone: savedUser.phone,
                email: savedUser.email,
                openingHours: savedUser.restaurantDetails.openingHours || {},
                cuisine: savedUser.restaurantDetails.cuisine || [],
                isOpen: savedUser.restaurantDetails.isOpen !== undefined ? savedUser.restaurantDetails.isOpen : true,
                deliveryRadius: savedUser.restaurantDetails.deliveryRadius || 5,
                minimumOrder: savedUser.restaurantDetails.minimumOrder || 0,
                deliveryFee: savedUser.restaurantDetails.deliveryFee || 0,
                logo: savedUser.restaurantDetails.logo || null,
                coverImage: savedUser.restaurantDetails.coverImage || null
            }
        });
    } catch (error) {
        console.error('Error updating restaurant profile:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message
        });
    }
});

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

/**
 * @route   GET /api/restaurant/notifications/unread-count
 * @desc    Get unread notification count for a restaurant
 * @access  Private/RestaurantOwner
 */
router.get('/notifications/unread-count', auth, isRestaurantOwner, async (req, res) => {
    try {
        const count = await Notification.countDocuments({ 
            userId: req.user.userId,
            status: 'PENDING'
        });
        
        return res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Error getting notification count:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
});

/**
 * @route   GET /api/restaurant/notifications
 * @desc    Get notifications for a restaurant
 * @access  Private/RestaurantOwner
 */
router.get('/notifications', auth, isRestaurantOwner, async (req, res) => {
    try {
        const notifications = await Notification.find({ 
            userId: req.user.userId 
        }).sort({ createdAt: -1 });
        
        return res.status(200).json({
            success: true,
            notifications
        });
    } catch (error) {
        console.error('Error getting notifications:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
});

/**
 * @route   GET /api/restaurant/profile/changes/status
 * @desc    Get status of any pending restaurant profile changes
 * @access  Private/RestaurantOwner
 */
router.get('/profile/changes/status', auth, isRestaurantOwner, async (req, res) => {
    try {
        const pendingApproval = await RestaurantApproval.findOne({
            restaurantId: req.user.userId,
            status: 'pending'
        });
        
        return res.status(200).json({
            success: true,
            hasPendingChanges: !!pendingApproval,
            pendingApproval: pendingApproval || null
        });
    } catch (error) {
        console.error('Error checking profile changes status:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
});

/**
 * @route   POST /api/restaurant/profile/changes
 * @desc    Submit restaurant profile changes for approval
 * @access  Private/RestaurantOwner
 */
router.post('/profile/changes', auth, isRestaurantOwner, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Check if there's already a pending approval
        const existingPendingApproval = await RestaurantApproval.findOne({
            restaurantId: userId,
            status: 'pending'
        });
        
        if (existingPendingApproval) {
            return res.status(400).json({ 
                success: false, 
                message: 'You already have pending changes awaiting approval' 
            });
        }
        
        // Extract fields from request body
        const { name, email, phone, restaurantName, restaurantAddress } = req.body;
        
        // Validate phone number if provided
        if (phone && !/^\d{10}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Phone number must be exactly 10 digits'
            });
        }
        
        // Create a new approval request
        const approvalRequest = new RestaurantApproval({
            restaurantId: userId,
            currentData: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                restaurantName: user.restaurantDetails?.name || '',
                restaurantAddress: user.restaurantDetails?.address || ''
            },
            requestedData: {
                name: name || user.name,
                email: email || user.email,
                phone: phone || user.phone,
                restaurantName: restaurantName || user.restaurantDetails?.name || '',
                restaurantAddress: restaurantAddress || user.restaurantDetails?.address || ''
            },
            status: 'pending'
        });
        
        const savedApproval = await approvalRequest.save();
        
        // Create a notification for admins
        const notification = new Notification({
            type: 'RESTAURANT_UPDATE',
            title: 'Restaurant Profile Update Request',
            message: `Restaurant ${user.restaurantDetails?.name || 'owner'} has requested profile changes.`,
            userId: userId,
            status: 'PENDING',
            data: {
                approvalId: savedApproval._id,
                changes: savedApproval.requestedData
            }
        });
        
        await notification.save();
        
        // Log the approval request
        console.log(`Restaurant profile changes submitted for approval. Restaurant ID: ${userId}, Requested phone: ${phone || 'unchanged'}`);
        
        return res.status(201).json({
            success: true,
            message: 'Profile changes submitted for approval',
            approvalRequest: savedApproval
        });
    } catch (error) {
        console.error('Error submitting profile changes:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again: ' + error.message
        });
    }
});

// Export the router
module.exports = router; 
const express = require('express');
const router = express.Router();
const { auth, isRestaurantOwner } = require('../middleware/auth');
const RestaurantApproval = require('../models/restaurantApproval');
const User = require('../models/user');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Notification = require('../models/notification');
const mongoose = require('mongoose');
const MenuItem = require('../models/menuItem');
const Order = require('../models/order');
const Offer = require('../models/offer');
const Restaurant = require('../models/restaurant');

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
        const userId = req.user.userId;
        
        // Find the restaurant owned by this user
        const restaurant = await Restaurant.findOne({ owner: userId });
        
        if (!restaurant) {
            return res.status(404).json({ 
                success: false, 
                message: 'Restaurant not found for this user' 
            });
        }
        
        // Get user for contact details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Check for pending approval changes
        const pendingApproval = await RestaurantApproval.findOne({
            restaurantId: restaurant._id,
            status: 'pending'
        });
        
        // Prepare the profile data with current values
        let profileData = {
            name: restaurant.name || '',
            description: restaurant.description || '',
            address: restaurant.address || '',
            phone: user.phone || '',
            email: user.email || '',
            openingHours: restaurant.openingHours || {},
            cuisine: restaurant.cuisine || [],
            isOpen: restaurant.isOpen !== undefined ? restaurant.isOpen : true,
            deliveryRadius: restaurant.deliveryRadius || 5,
            minimumOrder: restaurant.minimumOrder || 0,
            deliveryFee: restaurant.deliveryFee || 0,
            logo: restaurant.logo || null,
            coverImage: restaurant.coverImage || null,
            panNumber: restaurant.panNumber || '',
            priceRange: restaurant.priceRange || '$$'
        };
        
        // If there's a pending approval, overlay the requested changes (e.g., logo, coverImage, etc.)
        if (pendingApproval) {
            const rd = pendingApproval.requestedData || {};
            profileData = { ...profileData, ...rd };
        }
        
        // Return restaurant profile information with pending changes if they exist
        return res.status(200).json({
            success: true,
            data: profileData,
            pendingChanges: pendingApproval ? {
                hasPendingChanges: true,
                requestedData: pendingApproval.requestedData,
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

// PUT update restaurant profile - Creates pending approval request
router.put('/profile', [auth, isRestaurantOwner, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
])], async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Find the restaurant owned by this user
        const restaurant = await Restaurant.findOne({ owner: userId });
        
        if (!restaurant) {
            return res.status(404).json({ 
                success: false, 
                message: 'Restaurant not found for this user' 
            });
        }
        
        // Check if there's already a pending approval
        const existingPendingApproval = await RestaurantApproval.findOne({
            restaurantId: restaurant._id,
            status: 'pending'
        });
        
        if (existingPendingApproval) {
            return res.status(400).json({ 
                success: false, 
                message: 'You already have pending changes awaiting approval' 
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
            deliveryFee,
            panNumber,
            priceRange
        } = req.body;
        
        // Handle file uploads
        const files = req.files || {};
        let logoPath = restaurant.logo;
        let coverImagePath = restaurant.coverImage;
        
        if (files.logo && files.logo[0]) {
            logoPath = files.logo[0].path;
        }
        
        if (files.coverImage && files.coverImage[0]) {
            coverImagePath = files.coverImage[0].path;
        }
        
        // Parse JSON fields
        let parsedOpeningHours = restaurant.openingHours || {};
        let parsedCuisine = restaurant.cuisine || [];
        
        try {
            if (openingHours) {
                parsedOpeningHours = typeof openingHours === 'string' 
                    ? JSON.parse(openingHours) 
                    : openingHours;
            }
            
            if (cuisine) {
                parsedCuisine = typeof cuisine === 'string' 
                    ? JSON.parse(cuisine) 
                    : cuisine;
            }
        } catch (e) {
            console.error('Error parsing JSON fields:', e);
        }
        
        // Get associated user for contact details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Create approval request with current and requested data
        const approvalRequest = new RestaurantApproval({
            restaurantId: restaurant._id,
            currentData: {
                name: restaurant.name,
                description: restaurant.description,
                address: restaurant.address,
                phone: user.phone,
                cuisine: restaurant.cuisine,
                openingHours: restaurant.openingHours,
                isOpen: restaurant.isOpen,
                deliveryRadius: restaurant.deliveryRadius,
                minimumOrder: restaurant.minimumOrder,
                deliveryFee: restaurant.deliveryFee,
                logo: restaurant.logo,
                coverImage: restaurant.coverImage,
                panNumber: restaurant.panNumber,
                priceRange: restaurant.priceRange
            },
            requestedData: {
                name: name || restaurant.name,
                description: description || restaurant.description,
                address: address || restaurant.address,
                phone: phone || user.phone,
                cuisine: parsedCuisine,
                openingHours: parsedOpeningHours,
                isOpen: isOpen !== undefined ? isOpen : restaurant.isOpen,
                deliveryRadius: deliveryRadius || restaurant.deliveryRadius,
                minimumOrder: minimumOrder || restaurant.minimumOrder,
                deliveryFee: deliveryFee || restaurant.deliveryFee,
                logo: logoPath,
                coverImage: coverImagePath,
                panNumber: panNumber || restaurant.panNumber,
                priceRange: priceRange || restaurant.priceRange
            },
            status: 'pending'
        });
        
        await approvalRequest.save();
        
        // Create notification for admin
        try {
            const notification = new Notification({
                type: 'RESTAURANT_UPDATE',
                title: 'Restaurant Profile Update Request',
                message: `Restaurant "${restaurant.name}" has requested profile changes.`,
                isAdminNotification: true,
                isRead: false,
                data: {
                    restaurantId: restaurant._id,
                    approvalId: approvalRequest._id
                }
            });
            
            await notification.save();
        } catch (notificationError) {
            console.error('Error creating notification:', notificationError);
            // Continue processing even if notification creation fails
        }
        
        // Return response with pending approval information
        return res.status(202).json({
            success: true,
            message: 'Profile update request submitted for approval',
            data: {
                hasPendingChanges: true,
                approvalId: approvalRequest._id,
                submittedAt: approvalRequest.createdAt
            }
        });
    } catch (error) {
        console.error('Error submitting profile update request:', error);
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

        const userId = req.user.userId;
        
        // Find the restaurant associated with this user
        const restaurant = await Restaurant.findOne({ owner: userId });
        
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found for this user'
            });
        }

        const pendingChanges = await RestaurantApproval.findOne({
            restaurantId: restaurant._id,
            status: 'pending'
        });

        res.status(200).json({
            success: true,
            pendingChanges
        });
    } catch (error) {
        console.error('Error fetching pending changes:', error);
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
router.get('/notifications/unread-count', auth, async (req, res) => {
    try {
        console.log('[Notifications] Getting unread count, req.user:', JSON.stringify(req.user));
        
        // Determine role and check if user is a restaurant owner
        const role = req.user.role || 'unknown';
        const isRestaurantByRole = role === 'restaurant';
        const isRestaurantByFlag = !!req.user.isRestaurantOwner;
        
        console.log(`[Notifications] User role: ${role}, isRestaurantByRole: ${isRestaurantByRole}, isRestaurantByFlag: ${isRestaurantByFlag}`);
        
        if (!isRestaurantByRole && !isRestaurantByFlag) {
            console.log('[Notifications] Access denied - User is not a restaurant owner');
            return res.status(403).json({
                success: false,
                message: 'Access denied. Restaurant owner permissions required.'
            });
        }
        
        // Get user ID
        const userId = req.user.userId || req.user.id || req.user._id;
        
        if (!userId) {
            console.log('[Notifications] No valid user ID found');
            return res.status(400).json({
                success: false,
                message: 'User ID not found. Please contact support.'
            });
        }
        
        console.log('[Notifications] Looking for notifications for user ID:', userId);
        
        const count = await Notification.countDocuments({ 
            userId: userId,
            isRead: false,
            isAdminNotification: { $ne: true }
        });
        
        console.log('[Notifications] Found unread count:', count);
        
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
router.get('/notifications', auth, async (req, res) => {
    try {
        console.log('[Notifications] Getting notifications list, req.user:', JSON.stringify(req.user));
        
        // Determine role and check if user is a restaurant owner
        const role = req.user.role || 'unknown';
        const isRestaurantByRole = role === 'restaurant';
        const isRestaurantByFlag = !!req.user.isRestaurantOwner;
        
        console.log(`[Notifications] User role: ${role}, isRestaurantByRole: ${isRestaurantByRole}, isRestaurantByFlag: ${isRestaurantByFlag}`);
        
        if (!isRestaurantByRole && !isRestaurantByFlag) {
            console.log('[Notifications] Access denied - User is not a restaurant owner');
            return res.status(403).json({
                success: false,
                message: 'Access denied. Restaurant owner permissions required.'
            });
        }
        
        // Get user ID
        const userId = req.user.userId || req.user.id || req.user._id;
        
        if (!userId) {
            console.log('[Notifications] No valid user ID found');
            return res.status(400).json({
                success: false,
                message: 'User ID not found. Please contact support.'
            });
        }
        
        console.log('[Notifications] Looking for notifications for user ID:', userId);
        
        const notifications = await Notification.find({ 
            userId: userId,
            isAdminNotification: { $ne: true }
        }).sort({ createdAt: -1 });
        
        console.log('[Notifications] Found notifications:', notifications ? notifications.length : 'none');
        
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
 * @route   PUT /api/restaurant/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private/RestaurantOwner
 */
router.put('/notifications/:id/read', auth, isRestaurantOwner, async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            userId: req.user.userId
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
        console.error('Error marking notification as read:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

/**
 * @route   PUT /api/restaurant/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private/RestaurantOwner
 */
router.put('/notifications/mark-all-read', auth, isRestaurantOwner, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.userId, isRead: false },
            { $set: { isRead: true } }
        );

        return res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

/**
 * @route   DELETE /api/restaurant/notifications/:id
 * @desc    Delete a notification
 * @access  Private/RestaurantOwner
 */
router.delete('/notifications/:id', auth, isRestaurantOwner, async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            userId: req.user.userId
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
        console.error('Error deleting notification:', error);
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
        const userId = req.user.userId;
        
        // Find the restaurant associated with this user
        const restaurant = await Restaurant.findOne({ owner: userId });
        
        if (!restaurant) {
            return res.status(404).json({ 
                success: false, 
                message: 'Restaurant not found for this user' 
            });
        }
        
        const pendingApproval = await RestaurantApproval.findOne({
            restaurantId: restaurant._id,
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
        
        // Find the restaurant owned by this user
        const restaurant = await Restaurant.findOne({ owner: userId });
        
        if (!restaurant) {
            return res.status(404).json({ 
                success: false, 
                message: 'Restaurant not found for this user' 
            });
        }
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Check if there's already a pending approval
        const existingPendingApproval = await RestaurantApproval.findOne({
            restaurantId: restaurant._id,
            status: 'pending'
        });
        
        if (existingPendingApproval) {
            return res.status(400).json({ 
                success: false, 
                message: 'You already have pending changes awaiting approval' 
            });
        }
        
        // Extract all fields from request body
        const { 
            name, 
            email, 
            phone, 
            description, 
            address,
            cuisine,
            openingHours,
            isOpen,
            deliveryRadius,
            minimumOrder,
            deliveryFee,
            logo,
            coverImage,
            panNumber,
            priceRange
        } = req.body;
        
        // Validate phone number if provided
        if (phone && !/^\d{10}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Phone number must be exactly 10 digits'
            });
        }
        
        // Parse arrays and objects from JSON strings if they come as strings
        let parsedCuisine = cuisine;
        if (typeof cuisine === 'string') {
            try {
                parsedCuisine = JSON.parse(cuisine);
            } catch (e) {
                parsedCuisine = cuisine.split(',').map(item => item.trim());
            }
        }
        
        let parsedOpeningHours = openingHours;
        if (typeof openingHours === 'string') {
            try {
                parsedOpeningHours = JSON.parse(openingHours);
            } catch (e) {
                parsedOpeningHours = restaurant.openingHours;
            }
        }
        
        // Prepare current data object
        const currentData = {
            name: restaurant.name,
            email: user.email,
            phone: user.phone,
            description: restaurant.description,
            address: restaurant.address,
            cuisine: restaurant.cuisine,
            openingHours: restaurant.openingHours,
            isOpen: restaurant.isOpen,
            deliveryRadius: restaurant.deliveryRadius,
            minimumOrder: restaurant.minimumOrder,
            deliveryFee: restaurant.deliveryFee,
            logo: restaurant.logo,
            coverImage: restaurant.coverImage,
            panNumber: restaurant.panNumber,
            priceRange: restaurant.priceRange
        };
        
        // Prepare requested data object with all possible fields
        const requestedData = {
            name: name || restaurant.name,
            email: email || user.email,
            phone: phone || user.phone,
            description: description || restaurant.description,
            address: address || restaurant.address,
            cuisine: parsedCuisine || restaurant.cuisine,
            openingHours: parsedOpeningHours || restaurant.openingHours,
            isOpen: isOpen !== undefined ? isOpen : restaurant.isOpen,
            deliveryRadius: deliveryRadius !== undefined ? Number(deliveryRadius) : restaurant.deliveryRadius,
            minimumOrder: minimumOrder !== undefined ? Number(minimumOrder) : restaurant.minimumOrder,
            deliveryFee: deliveryFee !== undefined ? Number(deliveryFee) : restaurant.deliveryFee,
            logo: logo || restaurant.logo,
            coverImage: coverImage || restaurant.coverImage,
            panNumber: panNumber || restaurant.panNumber,
            priceRange: priceRange || restaurant.priceRange
        };
        
        // Create a new approval request
        const approvalRequest = new RestaurantApproval({
            restaurantId: restaurant._id,
            currentData,
            requestedData,
            status: 'pending'
        });
        
        const savedApproval = await approvalRequest.save();
        
        // Update restaurant status to pending_approval
        restaurant.status = 'pending_approval';
        await restaurant.save();
        
        // Create a notification for admins
        const notification = new Notification({
            type: 'RESTAURANT_UPDATE',
            title: 'Restaurant Profile Update Request',
            message: `Restaurant ${restaurant.name} has requested profile changes.`,
            isAdminNotification: true,
            isRead: false,
            data: {
                approvalId: savedApproval._id,
                restaurantId: restaurant._id,
                changes: savedApproval.requestedData,
                actionUrl: `/restaurant/profile`
            }
        });
        
        await notification.save();
        
        // Log the approval request
        console.log(`Restaurant profile changes submitted for approval. Restaurant ID: ${restaurant._id}`);
        
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

/**
 * @route   GET /api/restaurant/dashboard
 * @desc    Get restaurant dashboard data
 * @access  Private/RestaurantOwner
 */
router.get('/dashboard', auth, isRestaurantOwner, async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log(`[Dashboard] Starting dashboard fetch for user ID: ${userId}`);

        // Import models correctly
        const Order = require('../models/order');
        const MenuItem = require('../models/menuItem');
        const Offer = require('../models/offer');
        
        // Find the restaurant associated with this user
        const restaurant = await Restaurant.findOne({ owner: userId });
        
        if (!restaurant) {
            console.error(`[Dashboard] No restaurant found for user ${userId}`);
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found for this user'
            });
        }
        
        const restaurantId = restaurant._id;
        console.log(`[Dashboard] Found restaurant with ID: ${restaurantId}`);

        // Fetch counts and aggregated data with try/catch for each operation
        let totalOrders = 0, pendingOrders = 0, menuItems = 0, activeOffers = 0;
        let revenueData = [], recentOrders = [], recentMenuUpdates = [];
        
        try {
            const restaurantIdString = restaurantId.toString();
            console.log(`[Dashboard] Counting total orders for restaurantId: ${restaurantIdString}`);
            totalOrders = await Order.countDocuments({ restaurantId: restaurantIdString });
            console.log(`[Dashboard] Total orders count: ${totalOrders}`);
        } catch (err) {
            console.error('[Dashboard] Error counting total orders:', err);
        }
        
        try {
             const restaurantIdString = restaurantId.toString();
             console.log(`[Dashboard] Counting pending orders for restaurantId: ${restaurantIdString}`);
            pendingOrders = await Order.countDocuments({ 
                restaurantId: restaurantIdString, 
                status: { $in: ['PENDING', 'PREPARING', 'CONFIRMED'] } // Include preparing/confirmed as active/pending
            });
             console.log(`[Dashboard] Pending orders count: ${pendingOrders}`);
        } catch (err) {
            console.error('[Dashboard] Error counting pending orders:', err);
        }
        
        try {
            const restaurantIdString = restaurantId.toString();
            console.log(`[Dashboard] Counting menu items for restaurant (ID: ${restaurantIdString}) using query: { restaurant: "${restaurantIdString}" }`);
            menuItems = await MenuItem.countDocuments({ restaurant: restaurantIdString });
            console.log(`[Dashboard] Menu items count result: ${menuItems}`);
        } catch (err) {
            console.error('[Dashboard] Error counting menu items:', err);
        }
        
        try {
             const restaurantIdString = restaurantId.toString();
             console.log(`[Dashboard] Counting active offers for restaurantId: ${restaurantIdString}`);
            activeOffers = await Offer.countDocuments({
                restaurant: restaurantIdString,
                isActive: true
            });
             console.log(`[Dashboard] Active offers count: ${activeOffers}`);
        } catch (err) {
            console.error('[Dashboard] Error counting active offers:', err);
        }
        
        try {
             const restaurantIdString = restaurantId.toString();
             console.log(`[Dashboard] Aggregating revenue for restaurantId: ${restaurantIdString}`);
            revenueData = await Order.aggregate([
                { $match: { restaurantId: restaurantIdString, status: { $nin: ['CANCELLED', 'FAILED'] } } }, // Exclude cancelled/failed
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ]);
             console.log(`[Dashboard] Revenue aggregation result:`, revenueData);
        } catch (err) {
            console.error('[Dashboard] Error aggregating revenue data:', err);
        }
        
        // Get recent orders
        try {
             const restaurantIdString = restaurantId.toString();
             console.log(`[Dashboard] Fetching recent orders for restaurantId: ${restaurantIdString}`);
            recentOrders = await Order.find({ restaurantId: restaurantIdString })
                .sort('-createdAt')
                .limit(5)
                .lean();
             console.log(`[Dashboard] Found ${recentOrders.length} recent orders.`);
        } catch (err) {
            console.error('[Dashboard] Error fetching recent orders:', err);
        }
            
        // Get recent menu updates
        try {
             const restaurantIdString = restaurantId.toString();
             console.log(`[Dashboard] Fetching recent menu updates for restaurant: ${restaurantIdString}`);
            recentMenuUpdates = await MenuItem.find({ restaurant: restaurantId }) 
                .sort('-updatedAt')
                .limit(3)
                .lean();
             console.log(`[Dashboard] Found ${recentMenuUpdates.length} recent menu updates.`);
        } catch (err) {
            console.error('[Dashboard] Error fetching recent menu updates:', err);
        }
            
        // Format recent activity
        const recentActivity = [
            ...recentOrders.map(order => ({
                id: order._id,
                type: "Order",
                details: `New order #${order.orderNumber || order._id.toString().substring(0, 6)} received`,
                status: order.status?.toLowerCase() || 'pending',
                date: order.createdAt,
                link: `/restaurant/orders/${order._id}`
            })),
            ...recentMenuUpdates.map(item => ({
                id: item._id,
                type: "Menu Update",
                details: `${item.updatedAt > item.createdAt ? 'Updated' : 'Added new'} item '${item.item_name}'`,
                status: "completed",
                date: item.updatedAt || item.createdAt,
                link: "/restaurant/menu"
            }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        
        // Calculate total revenue
        const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;
        
        return res.status(200).json({
            success: true,
            data: {
                totalOrders,
                pendingOrders,
                menuItems,
                activeOffers,
                totalRevenue,
                recentActivity
            }
        });
    } catch (error) {
        console.error('Error fetching restaurant dashboard data:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data'
        });
    }
});

/**
 * @route   GET /api/restaurant/analytics
 * @desc    Get restaurant analytics data
 * @access  Private/RestaurantOwner
 */
router.get('/analytics', auth, isRestaurantOwner, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Find the restaurant owned by this user
        const restaurant = await Restaurant.findOne({ owner: userId });
        
        if (!restaurant) {
            return res.status(404).json({ 
                success: false, 
                message: 'Restaurant not found for this user' 
            });
        }
        
        const restaurantId = restaurant._id;
        const period = req.query.period || 'week';
        
        // Define the date range based on period
        let startDate;
        const now = new Date();
        const endDate = now;
        
        switch(period) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate = new Date(now);
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
        }
        
        // Get revenue data
        const revenueData = await Order.aggregate([
            { 
                $match: { 
                    restaurantId: restaurantId.toString(),
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $ne: 'CANCELLED' }
                } 
            },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);
        
        // Get previous period revenue for comparison
        const previousStartDate = new Date(startDate);
        const previousEndDate = new Date(startDate);
        
        if (period === 'week') {
            previousStartDate.setDate(previousStartDate.getDate() - 7);
        } else if (period === 'month') {
            previousStartDate.setMonth(previousStartDate.getMonth() - 1);
        } else if (period === 'year') {
            previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
        }
        
        const previousRevenueData = await Order.aggregate([
            { 
                $match: { 
                    restaurantId: restaurantId.toString(),
                    createdAt: { $gte: previousStartDate, $lte: previousEndDate },
                    status: { $ne: 'CANCELLED' }
                } 
            },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);
        
        // Calculate revenue change percentage
        const currentRevenue = revenueData.length > 0 ? revenueData[0].total : 0;
        const previousRevenue = previousRevenueData.length > 0 ? previousRevenueData[0].total : 0;
        let revenueChange = 0;
        
        if (previousRevenue > 0) {
            revenueChange = parseFloat((((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1));
        } else if (currentRevenue > 0) {
            revenueChange = 100; // if previous period had 0 revenue, but now has some
        }
        
        // Get order count data
        const orderCount = await Order.countDocuments({
            restaurantId: restaurantId.toString(),
            createdAt: { $gte: startDate, $lte: endDate }
        });
        
        const previousOrderCount = await Order.countDocuments({
            restaurantId: restaurantId.toString(),
            createdAt: { $gte: previousStartDate, $lte: previousEndDate }
        });
        
        // Calculate order change percentage
        let orderChange = 0;
        if (previousOrderCount > 0) {
            orderChange = parseFloat((((orderCount - previousOrderCount) / previousOrderCount) * 100).toFixed(1));
        } else if (orderCount > 0) {
            orderChange = 100;
        }
        
        // Get unique customer count
        const customerData = await Order.aggregate([
            { 
                $match: { 
                    restaurantId: restaurantId.toString(),
                    createdAt: { $gte: startDate, $lte: endDate }
                } 
            },
            { $group: { _id: "$userId" } },
            { $count: "total" }
        ]);
        
        const previousCustomerData = await Order.aggregate([
            { 
                $match: { 
                    restaurantId: restaurantId.toString(),
                    createdAt: { $gte: previousStartDate, $lte: previousEndDate }
                } 
            },
            { $group: { _id: "$userId" } },
            { $count: "total" }
        ]);
        
        const customerCount = customerData.length > 0 ? customerData[0].total : 0;
        const previousCustomerCount = previousCustomerData.length > 0 ? previousCustomerData[0].total : 0;
        
        // Calculate customer change percentage
        let customerChange = 0;
        if (previousCustomerCount > 0) {
            customerChange = parseFloat((((customerCount - previousCustomerCount) / previousCustomerCount) * 100).toFixed(1));
        } else if (customerCount > 0) {
            customerChange = 100;
        }
        
        // Calculate average order value
        const avgOrderValue = orderCount > 0 ? parseFloat((currentRevenue / orderCount).toFixed(2)) : 0;
        const previousAvgOrderValue = previousOrderCount > 0 ? parseFloat((previousRevenue / previousOrderCount).toFixed(2)) : 0;
        
        // Calculate average order value change
        let avgOrderValueChange = 0;
        if (previousAvgOrderValue > 0) {
            avgOrderValueChange = parseFloat((((avgOrderValue - previousAvgOrderValue) / previousAvgOrderValue) * 100).toFixed(1));
        }
        
        // Get popular items
        const popularItems = await Order.aggregate([
            { 
                $match: { 
                    restaurantId: restaurantId.toString(),
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $ne: 'CANCELLED' }
                } 
            },
            { $unwind: "$items" },
            { 
                $group: { 
                    _id: "$items.productId",
                    name: { $first: "$items.name" },
                    orders: { $sum: 1 },
                    revenue: { $sum: { $multiply: [ "$items.price", "$items.quantity" ] } }
                } 
            },
            { $sort: { orders: -1 } },
            { $limit: 5 }
        ]);
        
        return res.status(200).json({
            success: true,
            data: {
                revenue: {
                    total: currentRevenue,
                    change: revenueChange,
                    history: [] // You could add time series data here in the future
                },
                orders: {
                    total: orderCount,
                    change: orderChange,
                    history: []
                },
                customers: {
                    total: customerCount,
                    change: customerChange,
                    history: []
                },
                avgOrderValue: {
                    total: avgOrderValue,
                    change: avgOrderValueChange,
                    history: []
                },
                popularItems: popularItems
            }
        });
    } catch (error) {
        console.error('Error fetching restaurant analytics data:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching analytics data'
        });
    }
});

/**
 * @route   GET /api/restaurant/pending-update-check
 * @desc    Check if there is an active admin notification for a pending restaurant profile update
 * @access  Private/RestaurantOwner
 */
router.get('/pending-update-check', auth, isRestaurantOwner, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find the restaurant owned by this user
        const restaurant = await Restaurant.findOne({ owner: userId });
        if (!restaurant) {
            return res.status(200).json({ success: true, hasPendingUpdate: false });
        }

        // Only check for pending approval requests in the database
        const pendingApprovalDoc = await RestaurantApproval.findOne({
            restaurantId: restaurant._id,
            status: 'pending'
        });
        return res.status(200).json({
            success: true,
            hasPendingUpdate: !!pendingApprovalDoc
        });
    } catch (error) {
        console.error('Error checking for pending restaurant update status:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error checking pending update status.'
        });
    }
});

// NEW: Get available delivery riders
router.get('/available-riders', auth, isRestaurantOwner, async (req, res) => {
    try {
        // Find available riders
        const availableRiders = await User.find({
            role: 'delivery_rider',
            'deliveryRiderDetails.approved': true,
            'deliveryRiderDetails.isAvailable': true
        }).select('firstName lastName fullName phone deliveryRiderDetails.vehicleType deliveryRiderDetails.ratings');

        // Return the list of available riders
        return res.status(200).json({
            success: true,
            data: availableRiders
        });
    } catch (error) {
        console.error('Error fetching available riders:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.',
            error: error.message
        });
    }
});

// Export the router
module.exports = router; 
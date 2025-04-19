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
            isRead: false
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
            userId: userId 
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
            isRead: false,
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

/**
 * @route   GET /api/restaurant/dashboard
 * @desc    Get restaurant dashboard data
 * @access  Private/RestaurantOwner
 */
router.get('/dashboard', auth, isRestaurantOwner, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Import models correctly
        const Order = require('../models/order');
        const MenuItem = require('../models/menuItem');
        const Offer = require('../models/offer');
        
        // Find the restaurant associated with this user
        let restaurantId = userId; // Default to using userId directly
        
        // First check if user has restaurantDetails
        const user = await User.findById(userId);
        if (user && user.restaurantDetails && user.restaurantDetails._id) {
            restaurantId = user.restaurantDetails._id;
            console.log(`Using restaurant ID from user.restaurantDetails: ${restaurantId}`);
        } else {
            // Check if a separate restaurant document exists
            try {
                // Use proper Restaurant model
                const Restaurant = require('../models/restaurant');
                const restaurant = await Restaurant.findOne({ owner: userId });
                
                if (restaurant) {
                    restaurantId = restaurant._id;
                    console.log(`Using restaurant ID from Restaurant collection: ${restaurantId}`);
                }
            } catch (err) {
                console.error('Error looking up restaurant:', err);
                // Continue with userId as restaurantId if this fails
            }
        }
        
        // Fetch counts and aggregated data with try/catch for each operation
        let totalOrders = 0, pendingOrders = 0, menuItems = 0, activeOffers = 0;
        let revenueData = [], recentOrders = [], recentMenuUpdates = [];
        
        try {
            totalOrders = await Order.countDocuments({ restaurantId: restaurantId.toString() });
        } catch (err) {
            console.error('Error counting total orders:', err);
        }
        
        try {
            pendingOrders = await Order.countDocuments({ 
                restaurantId: restaurantId.toString(), 
                status: 'PENDING' 
            });
        } catch (err) {
            console.error('Error counting pending orders:', err);
        }
        
        try {
            menuItems = await MenuItem.countDocuments({ restaurant: restaurantId });
        } catch (err) {
            console.error('Error counting menu items:', err);
        }
        
        try {
            activeOffers = await Offer.countDocuments({
                restaurant: restaurantId.toString(),
                isActive: true
            });
        } catch (err) {
            console.error('Error counting active offers:', err);
        }
        
        try {
            revenueData = await Order.aggregate([
                { $match: { restaurantId: restaurantId.toString() } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ]);
        } catch (err) {
            console.error('Error aggregating revenue data:', err);
        }
        
        // Get recent orders
        try {
            recentOrders = await Order.find({ restaurantId: restaurantId.toString() })
                .sort('-createdAt')
                .limit(5)
                .lean();
        } catch (err) {
            console.error('Error fetching recent orders:', err);
        }
            
        // Get recent menu updates
        try {
            recentMenuUpdates = await MenuItem.find({ restaurant: restaurantId })
                .sort('-updatedAt')
                .limit(3)
                .lean();
        } catch (err) {
            console.error('Error fetching recent menu updates:', err);
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
 * @route   POST /api/restaurant/test-order
 * @desc    Create a test order for the restaurant (temporary, for development)
 * @access  Private/RestaurantOwner
 */
router.post('/test-order', auth, isRestaurantOwner, async (req, res) => {
    try {
        const restaurantId = req.user.userId;
        const Order = require('../models/order');
        
        // Generate a unique order number
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
        
        // Create a sample order
        const testOrder = new Order({
            orderNumber,
            userId: restaurantId, // Using restaurant owner as customer for simplicity
            restaurantId: restaurantId,
            items: [
                {
                    productId: new mongoose.Types.ObjectId(), // Generate a random ID
                    name: "Test Food Item",
                    price: 15.99,
                    quantity: 2,
                    options: [
                        { name: "Size", value: "Large", price: 2.00 }
                    ]
                }
            ],
            totalPrice: 33.98, // 15.99 * 2 + 2.00
            deliveryFee: 3.99,
            tax: 3.80,
            tip: 5.00,
            grandTotal: 46.77, // Total + fee + tax + tip
            status: 'PENDING',
            paymentMethod: 'CREDIT_CARD',
            paymentStatus: 'PAID',
            deliveryAddress: {
                street: "123 Test Street",
                city: "Test City",
                state: "TS",
                zipCode: "12345",
                country: "Test Country"
            },
            specialInstructions: "This is a test order for development",
            statusUpdates: [
                {
                    status: 'PENDING',
                    timestamp: new Date(),
                    updatedBy: restaurantId
                }
            ]
        });
        
        await testOrder.save();
        
        return res.status(200).json({
            success: true,
            message: 'Test order created successfully',
            data: testOrder
        });
    } catch (error) {
        console.error('Error creating test order:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating test order'
        });
    }
});

/**
 * @route   POST /api/restaurant/test-menu-item
 * @desc    Create a test menu item for the restaurant (temporary, for development)
 * @access  Private/RestaurantOwner
 */
router.post('/test-menu-item', auth, isRestaurantOwner, async (req, res) => {
    try {
        const restaurantId = req.user.userId;
        
        // Create a sample menu item
        const testMenuItem = new MenuItem({
            item_name: "Test Food Item " + Math.floor(Math.random() * 100),
            item_price: 15.99,
            description: "This is a test menu item created for development",
            restaurant: restaurantId,
            category: 'Main Course',
            isVegetarian: false,
            isVegan: false,
            isGlutenFree: false,
            isAvailable: true
        });
        
        await testMenuItem.save();
        
        return res.status(200).json({
            success: true,
            message: 'Test menu item created successfully',
            data: testMenuItem
        });
    } catch (error) {
        console.error('Error creating test menu item:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating test menu item'
        });
    }
});

/**
 * @route   POST /api/restaurant/test-offer
 * @desc    Create a test offer for the restaurant (temporary, for development)
 * @access  Private/RestaurantOwner
 */
router.post('/test-offer', auth, isRestaurantOwner, async (req, res) => {
    try {
        const restaurantId = req.user.userId;
        
        // Create a sample offer
        const testOffer = new Offer({
            title: "Test Offer " + Math.floor(Math.random() * 100),
            description: "This is a test offer created for development",
            offerType: 'Discount',
            discountPercentage: 20,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            isActive: true,
            appliesTo: 'All Menu',
            restaurant: restaurantId
        });
        
        await testOffer.save();
        
        return res.status(200).json({
            success: true,
            message: 'Test offer created successfully',
            data: testOffer
        });
    } catch (error) {
        console.error('Error creating test offer:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating test offer'
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
        const restaurantId = req.user.userId;
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

// Export the router
module.exports = router; 
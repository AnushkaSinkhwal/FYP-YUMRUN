const express = require('express');
const router = express.Router();
const { auth, isRestaurantOwner } = require('../middleware/auth');
const RestaurantApproval = require('../models/restaurantApproval');
const User = require('../models/user');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

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
        
        // Return restaurant profile information
        return res.status(200).json({
            success: true,
            data: {
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
        if (phone) user.phone = phone;
        
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
        
        // Save updated user
        await user.save();
        
        return res.status(200).json({
            success: true,
            message: 'Restaurant profile updated successfully',
            data: {
                name: user.restaurantDetails.name,
                description: user.restaurantDetails.description,
                address: user.restaurantDetails.address,
                phone: user.phone,
                email: user.email,
                openingHours: user.restaurantDetails.openingHours || {},
                cuisine: user.restaurantDetails.cuisine || [],
                isOpen: user.restaurantDetails.isOpen !== undefined ? user.restaurantDetails.isOpen : true,
                deliveryRadius: user.restaurantDetails.deliveryRadius || 5,
                minimumOrder: user.restaurantDetails.minimumOrder || 0,
                deliveryFee: user.restaurantDetails.deliveryFee || 0,
                logo: user.restaurantDetails.logo || null,
                coverImage: user.restaurantDetails.coverImage || null
            }
        });
    } catch (error) {
        console.error('Error updating restaurant profile:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
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

// Export the router
module.exports = router; 
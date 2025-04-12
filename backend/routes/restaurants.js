const express = require('express');
const router = express.Router();
const { auth, isRestaurantOwner } = require('../middleware/auth');
const User = require('../models/user');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Restaurant } = require('../models/restaurant');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/restaurant';
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
                    fs.unlinkSync(user.restaurantDetails.logo.substring(1));
                }
                
                user.restaurantDetails.logo = '/' + req.files.logo[0].path;
            }
            
            // Handle cover image upload
            if (req.files.coverImage && req.files.coverImage.length > 0) {
                // Delete old cover image if exists
                if (user.restaurantDetails.coverImage && fs.existsSync(user.restaurantDetails.coverImage.substring(1))) {
                    fs.unlinkSync(user.restaurantDetails.coverImage.substring(1));
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

// GET all restaurants (public) - FIXED
router.get('/', async (req, res) => {
    try {
        // Query the Restaurant collection for approved restaurants
        const approvedRestaurants = await Restaurant.find({ isApproved: true })
            .select('name description location logo cuisine owner dateCreated') // Select relevant fields
            .populate('owner', 'name') // Optionally populate owner name if needed
            .sort({ name: 1 });

        // Format data for the frontend (ensure it matches frontend expectations)
        const formattedRestaurants = approvedRestaurants.map(restaurant => ({
            _id: restaurant._id, // Use _id or id as expected by frontend
            id: restaurant.id,   // Include virtual id if used
            name: restaurant.name,
            description: restaurant.description || 'No description available.',
            location: restaurant.location || 'Location not specified.',
            logo: restaurant.logo || null, // Handle missing logo
            cuisine: restaurant.cuisine || [], // Assuming cuisine might be added later
            // Add other fields as needed by the frontend Shop component
            // e.g., isOpen (if available in Restaurant model, otherwise default or omit)
        }));

        return res.status(200).json({
            success: true,
            data: formattedRestaurants
        });
    } catch (error) {
        console.error('Error fetching approved restaurants:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// GET featured restaurants
router.get('/featured', async (req, res) => {
    try {
        // Placeholder: Fetch a few approved restaurants as featured
        // In a real app, you'd likely have an 'isFeatured' flag in the model
        const featuredRestaurants = await Restaurant.find({ isApproved: true }).limit(5);
        
        res.status(200).json({ 
            success: true, 
            data: featuredRestaurants 
        });
    } catch (error) {
        console.error('Error fetching featured restaurants:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error fetching featured restaurants.' 
        });
    }
});

// POST create new restaurant
router.post('/', (req, res) => {
    res.status(201).json({ message: 'Create restaurant endpoint' });
});

// PUT update restaurant
router.put('/:id', (req, res) => {
    res.status(200).json({ message: `Update restaurant with ID: ${req.params.id}` });
});

// DELETE restaurant
router.delete('/:id', (req, res) => {
    res.status(200).json({ message: `Delete restaurant with ID: ${req.params.id}` });
});

// GET restaurant menu
router.get('/:id/menu', (req, res) => {
    res.status(200).json({ message: `Menu for restaurant ID: ${req.params.id}` });
});

module.exports = router; 
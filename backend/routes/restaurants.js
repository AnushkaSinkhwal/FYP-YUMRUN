const express = require('express');
const router = express.Router();
const { auth, isRestaurantOwner } = require('../middleware/auth');
const User = require('../models/user');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Restaurant = require('../models/restaurant');
const MenuItem = require('../models/menuItem');
const mongoose = require('mongoose');
const Notification = require('../models/notification');

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
        // Find the associated Restaurant document for the logged-in user
        const restaurant = await Restaurant.findOne({ owner: req.user.userId });

        if (!restaurant) {
            return res.status(404).json({ 
                success: false, 
                message: 'Restaurant profile not found for this user.' 
            });
        }

        // Fetch the User document for owner details (like email/phone not in Restaurant model)
        const user = await User.findById(req.user.userId).select('email phone'); // Only select necessary fields
        if (!user) {
            // This should ideally not happen if restaurant was found, but handle defensively
            return res.status(404).json({ success: false, message: 'Owner details not found.'});
        }

        // Return combined restaurant profile information
        return res.status(200).json({
            success: true,
            data: {
                id: restaurant._id,
                name: restaurant.name,
                description: restaurant.description,
                address: restaurant.address, // Assuming address is stored directly in Restaurant
                phone: user.phone, // Get phone from User model
                email: user.email, // Get email from User model
                openingHours: restaurant.openingHours || {},
                cuisine: restaurant.cuisine || [],
                // isOpen: restaurant.isOpen !== undefined ? restaurant.isOpen : true, // Maybe use isActive?
                isActive: restaurant.isActive, // Use the isActive field from Restaurant model
                // deliveryRadius: restaurant.deliveryRadius || 5, // If these exist on Restaurant model
                // minimumOrder: restaurant.minimumOrder || 0,
                // deliveryFee: restaurant.deliveryFee || 0,
                logo: restaurant.logo || null,
                coverImage: restaurant.coverImage || null,
                status: restaurant.status // Include the restaurant status
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

// PUT update restaurant profile - Requires Admin Approval
router.put('/profile', [auth, isRestaurantOwner, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
])], async (req, res) => {
    try {
        const userId = req.user.userId;
        const restaurant = await Restaurant.findOne({ owner: userId });

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant profile not found for this user.' });
        }
        
        // Prepare the submitted data
        const submittedData = { ...req.body }; // Copy request body
        let logoPath = null;
        let coverImagePath = null;

        // Handle file uploads - store paths temporarily
        if (req.files) {
            if (req.files.logo?.[0]) {
                logoPath = '/' + req.files.logo[0].path;
                submittedData.logo = logoPath; // Include new logo path in submitted data
            }
            if (req.files.coverImage?.[0]) {
                coverImagePath = '/' + req.files.coverImage[0].path;
                submittedData.coverImage = coverImagePath; // Include new cover path
            }
        }

        // Clean up submitted data (e.g., parse JSON strings if needed)
        if (submittedData.openingHours && typeof submittedData.openingHours === 'string') {
            try { submittedData.openingHours = JSON.parse(submittedData.openingHours); } catch (e) { /* ignore parse error */ }
        }
         if (submittedData.cuisine && typeof submittedData.cuisine === 'string') {
            try { submittedData.cuisine = JSON.parse(submittedData.cuisine); } catch (e) { /* ignore parse error */ }
        }
        // Convert boolean strings
        if (submittedData.isOpen !== undefined) submittedData.isOpen = submittedData.isOpen === 'true' || submittedData.isOpen === true;
        // Convert numbers
        if (submittedData.deliveryRadius) submittedData.deliveryRadius = parseFloat(submittedData.deliveryRadius);
        if (submittedData.minimumOrder) submittedData.minimumOrder = parseFloat(submittedData.minimumOrder);
        if (submittedData.deliveryFee) submittedData.deliveryFee = parseFloat(submittedData.deliveryFee);

        // **Compare submittedData with current restaurant data to find actual changes**
        const currentData = {
            name: restaurant.name,
            description: restaurant.description,
            // address: restaurant.address, // Need careful comparison for objects/strings
            // phone: user.phone, // Phone might be on User model
            openingHours: restaurant.openingHours,
            cuisine: restaurant.cuisine,
            isActive: restaurant.isActive, // Assuming isOpen maps to isActive
            // deliveryRadius: restaurant.deliveryRadius,
            // minimumOrder: restaurant.minimumOrder,
            // deliveryFee: restaurant.deliveryFee,
            logo: restaurant.logo,
            coverImage: restaurant.coverImage
        };
        
        const changes = {};
        for (const key in submittedData) {
             // Simple comparison - needs improvement for nested objects like address/openingHours
             // Also need to consider User model fields like phone
            if (submittedData.hasOwnProperty(key) && JSON.stringify(submittedData[key]) !== JSON.stringify(currentData[key])) {
                changes[key] = { from: currentData[key], to: submittedData[key] };
            }
        }

        // If no actual changes detected (excluding file uploads for now)
        if (Object.keys(changes).length === 0 && !logoPath && !coverImagePath) {
             return res.status(200).json({
                success: true,
                message: 'No changes detected in profile data.',
                data: restaurant // Return current data
            });
        }

        // --- Changes detected - Create Notification for Admin --- 

        // Find existing pending update notification for this restaurant, if any
        const existingNotification = await Notification.findOne({
             'data.restaurantId': restaurant._id,
             type: 'RESTAURANT_UPDATE',
             status: 'PENDING'
        });

        if (existingNotification) {
            // Update existing notification with the latest requested changes
            existingNotification.data.requestedChanges = changes;
            existingNotification.data.submittedData = submittedData; // Store all submitted data
            existingNotification.updatedAt = Date.now();
            await existingNotification.save();
             console.log(`Updated existing pending notification ${existingNotification._id} for restaurant ${restaurant._id}`);
        } else {
            // Create a new notification
            const notification = new Notification({
                userId: userId, // The owner who submitted the request
                type: 'RESTAURANT_UPDATE',
                title: `Restaurant Update Request: ${restaurant.name}`,
                message: `Restaurant owner requested updates for ${restaurant.name}. Please review.`, 
                status: 'PENDING',
                data: {
                    restaurantId: restaurant._id,
                    restaurantName: restaurant.name,
                    requestedChanges: changes, // Store the detected changes
                    submittedData: submittedData // Store all submitted data for admin context
                }
            });
            await notification.save();
            console.log(`Created new pending notification ${notification._id} for restaurant ${restaurant._id}`);
        }

        // Respond to the restaurant owner
        return res.status(202).json({ // 202 Accepted: Request received, pending processing
            success: true,
            message: 'Profile update request submitted successfully. Changes require admin approval.',
            data: { status: 'pending_approval' } // Indicate pending status
        });

    } catch (error) {
        console.error('Error submitting restaurant profile update:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error submitting profile update.' 
        });
    }
});

// GET all restaurants
router.get('/', async (req, res) => {
    try {
        const restaurants = await Restaurant.find({ status: 'approved' }).select('-__v');
        
        const formattedRestaurants = restaurants.map(restaurant => ({
            id: restaurant._id,
            name: restaurant.name,
            description: restaurant.description,
            logo: restaurant.logo,
            coverImage: restaurant.coverImage,
            address: restaurant.address,
            location: restaurant.location,
            cuisine: restaurant.cuisine,
            priceRange: restaurant.priceRange,
            rating: restaurant.rating,
            totalRatings: restaurant.totalRatings,
            reviewCount: restaurant.reviewCount,
            isOpen: restaurant.isOpen !== undefined ? restaurant.isOpen : true,
            createdAt: restaurant.createdAt
        }));
        
        res.status(200).json({
            success: true,
            data: formattedRestaurants
        });
    } catch (error) {
        console.error('Error getting all restaurants:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// GET featured restaurants
router.get('/featured', async (req, res) => {
    try {
        // Fetch a few approved restaurants as featured
        const featuredRestaurants = await Restaurant.find({ status: 'approved' })
            .populate('owner', 'restaurantDetails.logo')
            .limit(5);
        
        // Format the restaurant data for frontend use
        const formattedRestaurants = featuredRestaurants.map(restaurant => {
            // Get logo from owner's restaurantDetails if available, otherwise use restaurant.logo
            let logo = restaurant.logo;
            if (restaurant.owner && restaurant.owner.restaurantDetails && restaurant.owner.restaurantDetails.logo) {
                logo = restaurant.owner.restaurantDetails.logo;
            }
            
            return {
                id: restaurant._id,
                name: restaurant.name,
                description: restaurant.description,
                location: restaurant.location,
                address: restaurant.location, // For consistency with frontend
                logo: logo,
                image: logo, // Provide both logo and image fields for flexibility
                cuisine: restaurant.cuisine || [],
                rating: restaurant.rating || 4.5, // Default rating if not available
                totalReviews: restaurant.totalReviews || 0,
                isOpen: restaurant.isOpen !== undefined ? restaurant.isOpen : true
            };
        });
        
        res.status(200).json({ 
            success: true, 
            data: formattedRestaurants 
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

// GET restaurant by ID
router.get('/:id', async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id)
            .populate('owner', 'email phone')
            .lean();
        
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }
        
        // Check if restaurant has menu items
        const menu = await MenuItem.find({ restaurant: restaurant._id })
            .select('_id item_name item_price category description image imageUrl isAvailable isVegetarian averageRating numberOfRatings')
            .lean();
        
        // Format menu items
        const formattedMenu = menu.map(item => ({
            id: item._id,
            name: item.item_name,
            price: item.item_price,
            category: item.category,
            description: item.description,
            imageUrl: item.imageUrl || item.image || 'uploads/placeholders/food-placeholder.jpg',
            isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
            isVegetarian: item.isVegetarian || false,
            rating: item.averageRating || 0,
            reviews: item.numberOfRatings || 0
        }));
        
        // Format restaurant response
        const response = {
            id: restaurant._id,
            name: restaurant.name,
            description: restaurant.description,
            logo: restaurant.logo,
            coverImage: restaurant.coverImage,
            address: restaurant.address || restaurant.location,
            location: restaurant.location,
            cuisine: restaurant.cuisine,
            priceRange: restaurant.priceRange,
            rating: restaurant.rating,
            totalReviews: restaurant.totalRatings || restaurant.reviewCount || 0,
            isOpen: restaurant.isOpen !== undefined ? restaurant.isOpen : true,
            owner: restaurant.owner ? {
                id: restaurant.owner._id,
                email: restaurant.owner.email,
                phone: restaurant.owner.phone
            } : null,
            menu: formattedMenu
        };
        
        return res.status(200).json({
            success: true,
            data: response
        });
    } catch (error) {
        console.error('Error fetching restaurant:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
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
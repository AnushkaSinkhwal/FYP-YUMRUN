const express = require('express');
const router = express.Router();
const { auth, isRestaurantOwner } = require('../middleware/auth');
const User = require('../models/user');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Restaurant } = require('../models/restaurant');
const { MenuItem } = require('../models/menuItem');
const mongoose = require('mongoose');

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
        const formattedRestaurants = await Promise.all(approvedRestaurants.map(async (restaurant) => {
            // For each restaurant, calculate average rating from related menu items
            const menuItems = await MenuItem.find({ restaurant: restaurant.owner });
            
            let totalRating = 0;
            let reviewCount = 0;
            
            menuItems.forEach(item => {
                if (item.numberOfRatings > 0) {
                    totalRating += (item.averageRating * item.numberOfRatings);
                    reviewCount += item.numberOfRatings;
                }
            });
            
            const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0;
            
            return {
                _id: restaurant._id, // Use _id or id as expected by frontend
                id: restaurant.id,   // Include virtual id if used
                name: restaurant.name,
                description: restaurant.description || 'No description available.',
                location: restaurant.location || 'Location not specified.',
                logo: restaurant.logo || null, // Handle missing logo
                cuisine: restaurant.cuisine || [], // Assuming cuisine might be added later
                rating: parseFloat(avgRating.toFixed(1)),
                totalReviews: reviewCount,
                // Add other fields as needed by the frontend Shop component
                isOpen: restaurant.isOpen !== undefined ? restaurant.isOpen : true
            };
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
        // Fetch a few approved restaurants as featured
        const featuredRestaurants = await Restaurant.find({ isApproved: true })
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

// GET a single restaurant by ID
router.get('/:id', async (req, res) => {
    try {
        const restaurantId = req.params.id;
        
        // Validate if it's a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid restaurant ID format'
            });
        }
        
        // Find the restaurant by ID
        const restaurant = await Restaurant.findById(restaurantId)
            .populate('owner', 'name email phone restaurantDetails');
            
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        // Get menu items for this restaurant
        const menuItems = await MenuItem.find({ restaurant: restaurant.owner._id })
            .sort({ category: 1, item_name: 1 });
            
        // Calculate restaurant rating from menu items
        let totalRating = 0;
        let reviewCount = 0;
        
        menuItems.forEach(item => {
            if (item.numberOfRatings > 0) {
                totalRating += (item.averageRating * item.numberOfRatings);
                reviewCount += item.numberOfRatings;
            }
        });
        
        const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0;
        
        // Format the response
        const responseData = {
            _id: restaurant._id,
            id: restaurant._id, // For frontend compatibility
            name: restaurant.name,
            description: restaurant.description || 'No description available',
            location: restaurant.location,
            address: restaurant.location, // For frontend compatibility
            logo: restaurant.logo,
            cuisine: restaurant.cuisine || [],
            isApproved: restaurant.isApproved,
            isOpen: restaurant.isOpen,
            openingTime: restaurant.openingTime,
            closingTime: restaurant.closingTime,
            priceRange: restaurant.priceRange,
            deliveryRadius: restaurant.deliveryRadius,
            minimumOrder: restaurant.minimumOrder,
            deliveryFee: restaurant.deliveryFee,
            owner: {
                id: restaurant.owner._id,
                name: restaurant.owner.name,
                email: restaurant.owner.email,
                phone: restaurant.owner.phone
            },
            rating: parseFloat(avgRating.toFixed(1)),
            totalReviews: reviewCount,
            menu: menuItems.map(item => ({
                id: item._id,
                name: item.item_name,
                description: item.description,
                price: item.item_price,
                image: item.image,
                category: item.category,
                isAvailable: item.isAvailable,
                isVegetarian: item.isVegetarian,
                isPopular: item.isPopular,
                rating: item.averageRating,
                reviews: item.numberOfRatings
            }))
        };
        
        return res.status(200).json({
            success: true,
            data: responseData
        });
    } catch (error) {
        console.error('Error fetching restaurant details:', error);
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
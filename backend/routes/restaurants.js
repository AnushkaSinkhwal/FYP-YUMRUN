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
const Offer = require('../models/offer');

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
                isOpen: restaurant.isOpen,
                deliveryRadius: restaurant.deliveryRadius,
                minimumOrder: restaurant.minimumOrder,
                deliveryFee: restaurant.deliveryFee,
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
        
        // Check for existing pending update to prevent duplicates
        const existingNotification = await Notification.findOne({
             'data.restaurantId': restaurant._id,
             type: 'RESTAURANT_UPDATE',
             status: 'PENDING'
        });
        if (existingNotification) {
            return res.status(409).json({ // 409 Conflict
                success: false, 
                message: 'You already have profile changes pending approval. Please wait for the current request to be processed.'
            });
        }

        // --- Process Submitted Data --- 
        const submittedData = { ...req.body }; // Copy text fields from req.body
        const files = req.files || {}; // Get uploaded files

        // Parse JSON fields safely
        try {
            if (submittedData.openingHours && typeof submittedData.openingHours === 'string') {
                submittedData.openingHours = JSON.parse(submittedData.openingHours);
            }
            if (submittedData.cuisine && typeof submittedData.cuisine === 'string') {
                submittedData.cuisine = JSON.parse(submittedData.cuisine);
            }
        } catch (parseError) {
            console.error('Error parsing JSON fields:', parseError);
            return res.status(400).json({ success: false, message: 'Invalid format for opening hours or cuisine data.'});
        }

        // Convert boolean strings/values (using isOpen from model)
        if (submittedData.isOpen !== undefined) {
            submittedData.isOpen = submittedData.isOpen === 'true' || submittedData.isOpen === true;
        } else {
            // If not submitted, default to current value or true?
             submittedData.isOpen = restaurant.isOpen; // Keep current if not sent
        }

        // Convert numbers, ensuring they are valid floats
        const numericFields = ['deliveryRadius', 'minimumOrder', 'deliveryFee'];
        for (const field of numericFields) {
            if (submittedData[field] !== undefined && submittedData[field] !== null && submittedData[field] !== '') {
                 const parsedValue = parseFloat(submittedData[field]);
                 if (!isNaN(parsedValue) && parsedValue >= 0) {
                    submittedData[field] = parsedValue;
                 } else {
                     // Handle invalid number input
                     return res.status(400).json({ success: false, message: `Invalid value provided for ${field}. Must be a non-negative number.`});
                 }
            } else {
                 delete submittedData[field]; // Remove if empty or undefined to avoid overwriting with NaN/null
            }
        }
        
        // Handle file paths
        if (files.logo?.[0]) {
            submittedData.logo = '/' + files.logo[0].path.replace(/\\/g, '/'); // Normalize path
        }
        if (files.coverImage?.[0]) {
            submittedData.coverImage = '/' + files.coverImage[0].path.replace(/\\/g, '/'); // Normalize path
        }

        // --- Compare with Current Data --- 
        const currentData = {
            name: restaurant.name,
            description: restaurant.description,
            address: restaurant.address, // Compare the whole address object
            openingHours: restaurant.openingHours,
            cuisine: restaurant.cuisine,
            isOpen: restaurant.isOpen,
            deliveryRadius: restaurant.deliveryRadius,
            minimumOrder: restaurant.minimumOrder,
            deliveryFee: restaurant.deliveryFee,
            logo: restaurant.logo,
            coverImage: restaurant.coverImage
        };
        
        const changes = {};
        // Iterate over keys in submittedData that are also in currentData model fields
        const relevantKeys = Object.keys(currentData);
        for (const key of relevantKeys) {
             // Handle address object comparison: Frontend sends simple string `address`
             // We will update only the `street` field for simplicity in this update request.
             // Admin can edit full address if needed.
             if (key === 'address' && submittedData.address !== undefined) {
                 if (submittedData.address !== (currentData.address?.street || '')) {
                     changes[key] = { from: currentData.address?.street || 'N/A', to: submittedData.address };
                     changes['address.street'] = { from: currentData.address?.street || 'N/A', to: submittedData.address }; // Indicate specific field for admin
                 }
             } else if (submittedData.hasOwnProperty(key)) {
                 // Use JSON stringify for robust comparison of objects/arrays (like openingHours, cuisine)
                 if (JSON.stringify(submittedData[key]) !== JSON.stringify(currentData[key])) {
                     changes[key] = { from: currentData[key], to: submittedData[key] };
                 }
             }
        }
        
        // Check if only files were changed
        let filesChanged = false;
        if (submittedData.logo && submittedData.logo !== currentData.logo) {
             changes.logo = { from: currentData.logo, to: submittedData.logo };
             filesChanged = true;
        }
         if (submittedData.coverImage && submittedData.coverImage !== currentData.coverImage) {
             changes.coverImage = { from: currentData.coverImage, to: submittedData.coverImage };
             filesChanged = true;
        }

        // If no actual changes detected
        if (Object.keys(changes).length === 0) {
             return res.status(200).json({
                success: true,
                message: 'No changes detected in profile data.',
                data: restaurant // Return current data
            });
        }

        // --- Changes detected - Create Notification for Admin --- 
        const notification = new Notification({
            type: 'PROFILE_UPDATE_REQUEST',
            title: 'Restaurant Profile Update Request',
            message: `Restaurant "${restaurant.name}" (ID: ${restaurant._id}) submitted profile changes for review.`,
            userId: req.user.userId,
            relatedEntityId: restaurant._id,
            relatedEntityType: 'Restaurant',
            data: { 
                changeRequestId: new mongoose.Types.ObjectId(),
                submittedAt: new Date(),
                submittedBy: req.user.userId,
                restaurantId: restaurant._id,
                changes: {
                    name: submittedData.name,
                    description: submittedData.description,
                    address: submittedData.address,
                    phone: submittedData.phone,
                    cuisine: submittedData.cuisine,
                    openingHours: submittedData.openingHours,
                    priceRange: submittedData.priceRange,
                    minimumOrder: submittedData.minimumOrder,
                    deliveryFee: submittedData.deliveryFee,
                    logo: submittedData.logo,
                    coverImage: submittedData.coverImage
                } 
            }
        });
        await notification.save();
        console.log(`Created new pending notification ${notification._id} for restaurant ${restaurant._id}`);
        

        // Respond to the restaurant owner
        return res.status(202).json({ // 202 Accepted: Request received, pending processing
            success: true,
            message: 'Profile update request submitted successfully. Changes require admin approval.',
            data: { 
                status: 'pending_approval',
                notificationId: notification._id // Optionally return notification ID
            }
        });

    } catch (error) {
        console.error('Error submitting restaurant profile update:', error);
        // Handle potential multer errors (e.g., file size limit)
        if (error instanceof multer.MulterError) {
            return res.status(400).json({ success: false, message: `File upload error: ${error.message}` });
        }
         // Handle Mongoose validation errors during notification save (less likely)
         if (error.name === 'ValidationError') {
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ success: false, message: `Validation Error: ${messages.join(', ')}` });
         }
        return res.status(500).json({ 
            success: false, 
            message: 'Server error submitting profile update.' 
        });
    }
});

// GET all restaurants
router.get('/', async (req, res) => {
    try {
        const restaurants = await Restaurant.find({ status: 'approved' }).lean(); // Only fetch approved restaurants

        // Fetch all active 'All Menu' offers
        const now = new Date();
        const activeOffers = await Offer.find({
            isActive: true,
            appliesTo: 'All Menu', // Find offers applicable to the whole menu
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).select('restaurant discountPercentage title').lean();

        // Create a map of restaurantId -> best offer details
        const restaurantOfferMap = {};
        activeOffers.forEach(offer => {
            const restaurantId = offer.restaurant.toString();
            if (!restaurantOfferMap[restaurantId] || offer.discountPercentage > restaurantOfferMap[restaurantId].percentage) {
                restaurantOfferMap[restaurantId] = {
                    percentage: offer.discountPercentage,
                    title: offer.title,
                    id: offer._id
                };
            }
        });

        // Add offer details to each restaurant
        const restaurantsWithOffers = restaurants.map(r => {
            const offerDetails = restaurantOfferMap[r._id.toString()];
            return {
                ...r,
                offerDetails: offerDetails || null // Add null if no offer
            };
        });

        res.status(200).json({ success: true, data: restaurantsWithOffers });
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        res.status(500).json({ success: false, message: 'Server error' });
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
            
            // Get cover image similarly
            let coverImage = restaurant.coverImage;
            if (restaurant.owner && restaurant.owner.restaurantDetails && restaurant.owner.restaurantDetails.coverImage) {
                coverImage = restaurant.owner.restaurantDetails.coverImage;
            }
            
            return {
                id: restaurant._id,
                name: restaurant.name,
                description: restaurant.description,
                location: restaurant.location,
                address: restaurant.location, // For consistency with frontend
                logo: logo,
                coverImage: coverImage, // Include coverImage in response
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

/**
 * @route   GET /api/restaurants/:id
 * @desc    Get restaurant by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Restaurants API] GET request for restaurant ID: ${id}`);
    
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`[Restaurants API] Invalid ObjectId format: ${id}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid restaurant ID format' 
      });
    }

    // Try to find the restaurant
    const restaurant = await Restaurant.findById(id)
      .populate('popularItems')
      .populate('menuItems')
      .populate('reviews');
    
    if (!restaurant) {
      console.log(`[Restaurants API] Restaurant not found with ID: ${id}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Restaurant not found' 
      });
    }

    // Return success response
    console.log(`[Restaurants API] Found restaurant: ${restaurant.name} (${restaurant._id})`);
    return res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    console.error('[Restaurants API] Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
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
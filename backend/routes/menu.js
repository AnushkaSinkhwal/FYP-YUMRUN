const express = require('express');
const router = express.Router();
let MenuItem;

try {
    MenuItem = require('../models/menuItem');
    console.log('MenuItem model loaded successfully');
    
    // Add pre-save hook to prevent self-referencing restaurant ID
    if (MenuItem.schema) {
        MenuItem.schema.pre('save', function(next) {
            // If this is a new document being created (no ID yet), just continue
            if (this.isNew) {
                return next();
            }
            
            // Check if restaurant ID equals menu item ID (self-reference)
            if (this.restaurant && this._id && this.restaurant.toString() === this._id.toString()) {
                console.error(`Prevented saving menu item ${this._id} with self-referencing restaurant ID`);
                // Set restaurant to null to prevent the save with invalid data
                this.restaurant = null;
            }
            
            next();
        });
        console.log('Added pre-save validation hook to MenuItem model');
    }
} catch (error) {
    console.error('Error loading MenuItem model or adding hooks:', error);
}

const { auth, isRestaurantOwner } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Offer = require('../models/offer'); // Import Offer model

// Add direct fix function for menu items with no restaurant
const fixMenuItemsWithNoRestaurant = async () => {
    try {
        // Find all restaurants (we'll use the first one as default if needed)
        const restaurants = await mongoose.model('Restaurant').find().limit(5);
        
        if (restaurants.length === 0) {
            console.log('No restaurants found in database to associate with menu items');
            return false;
        }
        
        console.log(`Found ${restaurants.length} restaurants for association with menu items`);
        
        // Find the first restaurant owned by user with ID 67fb7932b23ec6b3cad80fbb (from logs)
        // or use the first restaurant as fallback
        const primaryRestaurant = restaurants[0];
        console.log(`Using restaurant: ${primaryRestaurant.name} (ID: ${primaryRestaurant._id}) for items with no restaurant`);
        
        // First check for menu items with null restaurant field
        const nullRestaurantItems = await MenuItem.countDocuments({ restaurant: null });
        console.log(`Found ${nullRestaurantItems} menu items with null restaurant field`);
        
        if (nullRestaurantItems > 0) {
            // Update any menu items that have null restaurant field
            const updateResult = await MenuItem.updateMany(
                { restaurant: null }, 
                { restaurant: primaryRestaurant._id }
            );
            
            console.log(`Fixed ${updateResult.modifiedCount} menu items with null restaurant reference`);
        }
        
        // NEW CODE: Check for menu items where restaurant ID equals menu item ID
        const allMenuItems = await MenuItem.find({});
        let invalidRestaurantCount = 0;
        
        for (const item of allMenuItems) {
            // Check if ID equals restaurant ID (if restaurant is not null)
            if (item.restaurant && item._id.toString() === item.restaurant.toString()) {
                console.log(`Found menu item with its own ID as restaurant ID: ${item._id} (${item.item_name})`);
                invalidRestaurantCount++;
                
                // Fix this item by setting its restaurant ID to primary restaurant
                item.restaurant = primaryRestaurant._id;
                await item.save();
                
                console.log(`Fixed menu item ${item._id}: changed restaurant from self-ID to ${primaryRestaurant._id}`);
            }
        }
        
        console.log(`Fixed ${invalidRestaurantCount} menu items that used their own ID as restaurant ID`);
        
        return true;
    } catch (error) {
        console.error('Error fixing menu items with no restaurant:', error);
        return false;
    }
};

// Run the fix immediately when module loads
fixMenuItemsWithNoRestaurant().then(result => {
    console.log('Initial menu item fix completed with result:', result);
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/menu';
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

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size exceeds the limit (5MB)'
            });
        }
        return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`
        });
    } else if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next();
};

// GET related menu items for a specific menu item
router.get('/related/:id', async (req, res) => {
    try {
        const menuItem = await MenuItem.findById(req.params.id);
        
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }
        
        // Find related menu items based on the category and restaurant
        // Exclude the current item and limit to 8 items
        const relatedItems = await MenuItem.find({
            _id: { $ne: menuItem._id },
            $or: [
                { category: menuItem.category },
                { restaurant: menuItem.restaurant }
            ]
        })
        .limit(8)
        .populate('restaurant', 'name logo');
        
        // Format the response
        const formattedItems = relatedItems.map(item => ({
            id: item._id,
            name: item.item_name,
            description: item.description,
            price: item.item_price,
            image: item.image,
            restaurant: item.restaurant ? {
                id: item.restaurant._id,
                name: item.restaurant.name || 'Unknown Restaurant'
            } : {
                id: null,
                name: 'Unknown Restaurant'
            },
            category: item.category || 'Main Course',
            isVegetarian: item.isVegetarian,
            isVegan: item.isVegan,
            isGlutenFree: item.isGlutenFree,
            averageRating: item.averageRating || 0,
            numberOfRatings: item.numberOfRatings || 0,
            isPopular: item.numberOfRatings > 2 || item.averageRating > 4
        }));
        
        res.status(200).json({
            success: true,
            data: formattedItems
        });
    } catch (error) {
        console.error('Error fetching related menu items:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
});

// GET all menu items (publicly accessible)
router.get('/', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        console.log('GET /api/menu - Request query params:', req.query);
        
        // If a specific restaurantId is requested, find menu items for that restaurant directly
        if (restaurantId) {
            if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
                return res.status(400).json({ success: false, message: 'Invalid restaurant ID format' });
            }
            
            console.log(`Finding menu items for restaurant ID: ${restaurantId}`);
            const menuItems = await MenuItem.find({ restaurant: restaurantId })
                .populate({
                    path: 'restaurant',
                    select: 'name logo location cuisine status'
                })
                .lean();
            
            console.log(`Found ${menuItems.length} menu items for restaurant ${restaurantId}`);
            
            // Filter out items with null or self-referencing restaurant IDs
            const validItems = menuItems.filter(item => {
                // Log the item being checked
                // console.log(`[Menu Filter Debug] Checking item: ${item._id}, Restaurant field:`, item.restaurant);

                // Check 1: Ensure restaurant field exists
                // The 'restaurant' field directly on the lean object holds the ID before population
                const rawRestaurantId = item.restaurant; 
                
                if (!rawRestaurantId) {
                    console.error(`[Menu API Filter] Excluding item ${item._id} (${item.item_name || 'N/A'}) due to missing raw restaurant ID field.`);
                    return false; // Exclude item if restaurant ID field is missing
                }

                // Check 2: Ensure restaurant ID is not the same as the menu item ID using the raw ID
                // Convert both to string for safe comparison
                const itemIdStr = item._id.toString();
                const restaurantIdStr = rawRestaurantId.toString();

                if (itemIdStr === restaurantIdStr) {
                    console.error(`[Menu API Filter] Excluding item ${itemIdStr} (${item.item_name || 'N/A'}) due to self-referencing raw restaurant ID: ${restaurantIdStr}`);
                    return false; // Exclude self-referencing items
                }
                
                // Check 3: Also verify the populated structure just in case (double check)
                // Note: This check might be redundant if the raw check works, but adds safety.
                // We access populated data via item.restaurant._id AFTER population runs.
                // Let's assume population happened correctly for items passing the raw check.

                // If all checks pass, include the item
                return true; 
            });
            
            console.log(`[Menu API] Found ${menuItems.length} items total. Filtered down to ${validItems.length} valid items.`);

            // Fetch all active offers (can be optimized if needed)
            const now = new Date();
            const activeOffers = await Offer.find({
                isActive: true,
                startDate: { $lte: now },
                endDate: { $gte: now }
            }).lean();
            
            console.log(`Fetched ${activeOffers.length} active offers.`);

            // Format the response including offer calculations
            const formattedItems = validItems.map(item => {
                const itemRestaurantId = item.restaurant?._id?.toString();
                let bestOffer = null;
                let discountedPrice = item.item_price; // Default to original price

                if (itemRestaurantId) {
                    // Find offers applicable to this item
                    const applicableOffers = activeOffers.filter(offer => {
                        const offerRestaurantId = offer.restaurant?.toString();
                        // Check if offer is for the same restaurant
                        if (offerRestaurantId !== itemRestaurantId) {
                            return false;
                        }
                        // Check if offer applies to all items or this specific item
                        if (offer.appliesTo === 'All Menu') {
                            return true;
                        } else if (offer.appliesTo === 'Selected Items') {
                            // Ensure menuItems is an array and includes the current item's ID
                            return Array.isArray(offer.menuItems) && offer.menuItems.some(offerItemId => offerItemId.toString() === item._id.toString());
                        }
                        return false;
                    });

                    // Find the best offer (highest discount percentage) among applicable ones
                    if (applicableOffers.length > 0) {
                        bestOffer = applicableOffers.reduce((maxOffer, currentOffer) => 
                            (currentOffer.discountPercentage > maxOffer.discountPercentage) ? currentOffer : maxOffer, 
                            applicableOffers[0]
                        );
                    }
                }

                // Calculate discounted price if there's an applicable offer
                let discount = 0;
                if (bestOffer) {
                    discount = bestOffer.discountPercentage;
                    discountedPrice = Math.round((item.item_price * (100 - discount)) / 100);
                }

                // Format the item with complete information
                return {
                    id: item._id,
                    name: item.item_name,
                    description: item.description,
                    price: item.item_price,
                    discountedPrice: discountedPrice,
                    discount: discount,
                    image: item.image || item.imageUrl || 'uploads/placeholders/food-placeholder.jpg',
                    imageUrl: item.imageUrl || item.image || 'uploads/placeholders/food-placeholder.jpg',
                    restaurant: item.restaurant ? {
                        id: item.restaurant._id,
                        name: item.restaurant.name || 'Unknown Restaurant'
                    } : {
                        id: null,
                        name: 'Unknown Restaurant'
                    },
                    category: item.category || 'Main Course',
                    isVegetarian: item.isVegetarian || false,
                    isVegan: item.isVegan || false,
                    isGlutenFree: item.isGlutenFree || false,
                    isAvailable: item.isAvailable !== false, // default to true
                    averageRating: item.averageRating || 0,
                    numberOfRatings: item.numberOfRatings || 0,
                    isPopular: (item.numberOfRatings > 2) || (item.averageRating >= 4),
                    // Include customization options needed by IngredientCustomizer
                    customizationOptions: item.customizationOptions
                };
            });

            // Return the formatted menu items
            return res.status(200).json({
                success: true,
                data: formattedItems
            });
        }

        // Simple approach: Get all menu items, regardless of restaurant status
        console.log('Getting all menu items for public view');
        const allMenuItems = await MenuItem.find({ isAvailable: { $ne: false } })
            .populate({
                path: 'restaurant',
                select: 'name logo location cuisine'
            })
            .lean();
            
        console.log(`Found ${allMenuItems.length} menu items total`);
        
        // Filter out items with null or self-referencing restaurant IDs
        const validItems = allMenuItems.filter(item => {
            // Log the item being checked
            // console.log(`[Menu Filter Debug] Checking item: ${item._id}, Restaurant field:`, item.restaurant);

            // Check 1: Ensure restaurant field exists
            // The 'restaurant' field directly on the lean object holds the ID before population
            const rawRestaurantId = item.restaurant; 
            
            if (!rawRestaurantId) {
                console.error(`[Menu API Filter] Excluding item ${item._id} (${item.item_name || 'N/A'}) due to missing raw restaurant ID field.`);
                return false; // Exclude item if restaurant ID field is missing
            }

            // Check 2: Ensure restaurant ID is not the same as the menu item ID using the raw ID
            // Convert both to string for safe comparison
            const itemIdStr = item._id.toString();
            const restaurantIdStr = rawRestaurantId.toString();

            if (itemIdStr === restaurantIdStr) {
                console.error(`[Menu API Filter] Excluding item ${itemIdStr} (${item.item_name || 'N/A'}) due to self-referencing raw restaurant ID: ${restaurantIdStr}`);
                return false; // Exclude self-referencing items
            }
            
            // Check 3: Also verify the populated structure just in case (double check)
            // Note: This check might be redundant if the raw check works, but adds safety.
            // We access populated data via item.restaurant._id AFTER population runs.
            // Let's assume population happened correctly for items passing the raw check.

            // If all checks pass, include the item
            return true; 
        });
        
        console.log(`[Menu API] Found ${allMenuItems.length} items total. Filtered down to ${validItems.length} valid items.`);
        
        // Fetch active offers
        const now = new Date();
        const activeOffers = await Offer.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).lean();
        
        console.log(`Fetched ${activeOffers.length} active offers.`);

        // Format the response including offer calculations
        const formattedItems = validItems.map(item => {
            const itemRestaurantId = item.restaurant?._id?.toString();
            let bestOffer = null;
            let discountedPrice = item.item_price; // Default to original price

            if (itemRestaurantId) {
                // Find offers applicable to this item
                const applicableOffers = activeOffers.filter(offer => {
                    const offerRestaurantId = offer.restaurant?.toString();
                    // Check if offer is for the same restaurant
                    if (offerRestaurantId !== itemRestaurantId) {
                        return false;
                    }
                    // Check if offer applies to all items or this specific item
                    if (offer.appliesTo === 'All Menu') {
                        return true;
                    } else if (offer.appliesTo === 'Selected Items') {
                        // Ensure menuItems is an array and includes the current item's ID
                        return Array.isArray(offer.menuItems) && offer.menuItems.some(offerItemId => offerItemId.toString() === item._id.toString());
                    }
                    return false;
                });

                // Find the best offer (highest discount percentage) among applicable ones
                if (applicableOffers.length > 0) {
                    bestOffer = applicableOffers.reduce((maxOffer, currentOffer) => 
                        (currentOffer.discountPercentage > maxOffer.discountPercentage) ? currentOffer : maxOffer, 
                        applicableOffers[0]
                    );
                }
            }

            // Calculate discounted price if there's an applicable offer
            let discount = 0;
            if (bestOffer) {
                discount = bestOffer.discountPercentage;
                discountedPrice = Math.round((item.item_price * (100 - discount)) / 100);
            }

            // Format the item with complete information
            return {
                id: item._id,
                name: item.item_name,
                description: item.description,
                price: item.item_price,
                discountedPrice: discountedPrice,
                discount: discount,
                image: item.image || item.imageUrl || 'uploads/placeholders/food-placeholder.jpg',
                imageUrl: item.imageUrl || item.image || 'uploads/placeholders/food-placeholder.jpg',
                restaurant: item.restaurant ? {
                    id: item.restaurant._id,
                    name: item.restaurant.name || 'Unknown Restaurant'
                } : {
                    id: null,
                    name: 'Unknown Restaurant'
                },
                category: item.category || 'Main Course',
                isVegetarian: item.isVegetarian || false,
                isVegan: item.isVegan || false,
                isGlutenFree: item.isGlutenFree || false,
                isAvailable: item.isAvailable !== false, // default to true
                averageRating: item.averageRating || 0,
                numberOfRatings: item.numberOfRatings || 0,
                isPopular: (item.numberOfRatings > 2) || (item.averageRating >= 4),
                // Include customization options needed by IngredientCustomizer
                customizationOptions: item.customizationOptions
            };
        });

        // Return the formatted menu items
        return res.status(200).json({
            success: true,
            data: formattedItems
        });
    } catch (error) {
        console.error('Error retrieving menu items:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
});

// GET menu items for a specific restaurant (publicly accessible)
router.get('/restaurant/:id', async (req, res) => {
    try {
        console.log(`Fetching menu items for restaurant ID: ${req.params.id}`);
        
        // Find the restaurant first to verify it exists
        const restaurant = await mongoose.model('Restaurant').findById(req.params.id);
        if (!restaurant) {
            console.log(`Restaurant with ID ${req.params.id} not found`);
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }
        
        console.log(`Found restaurant: ${restaurant.name} (ID: ${restaurant._id})`);
        
        // Fix orphaned menu items by assigning them to this restaurant
        const updateResult = await MenuItem.updateMany(
            { restaurant: null }, 
            { restaurant: restaurant._id }
        );
        
        if (updateResult.modifiedCount > 0) {
            console.log(`Fixed ${updateResult.modifiedCount} menu items with missing restaurant reference`);
        }
        
        // Find menu items and populate restaurant
        const menuItems = await MenuItem.find({ restaurant: req.params.id }).populate({
            path: 'restaurant',
            select: 'name logo location cuisine'
        }).lean(); // Use lean
        
        console.log(`Found ${menuItems.length} menu items for restaurant ${restaurant.name}`);
        
        // Fetch active offers for this restaurant
        const now = new Date();
        const activeOffers = await Offer.find({
            restaurant: req.params.id, 
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).lean();
        console.log(`Found ${activeOffers.length} active offers for this restaurant.`);

        // Format the response including offer calculations
        const formattedItems = menuItems.map(item => {
            let bestOffer = null;
            let discountedPrice = item.item_price; // Default to original price

            // Find applicable offers for this specific item
            const applicableOffers = activeOffers.filter(offer => {
                if (offer.appliesTo === 'All Menu') {
                    return true;
                } else if (offer.appliesTo === 'Selected Items') {
                    return Array.isArray(offer.menuItems) && offer.menuItems.some(offerItemId => offerItemId.toString() === item._id.toString());
                }
                return false;
            });

            // Find the best offer (highest discount percentage)
            if (applicableOffers.length > 0) {
                bestOffer = applicableOffers.reduce((maxOffer, currentOffer) => 
                    (currentOffer.discountPercentage > maxOffer.discountPercentage) ? currentOffer : maxOffer, 
                    applicableOffers[0]
                );
            }

            // Prepare base item structure
            const formattedItem = {
                id: item._id,
                name: item.item_name,
                description: item.description,
                price: item.item_price,
                image: item.image || item.imageUrl || 'uploads/placeholders/food-placeholder.jpg',
                imageUrl: item.imageUrl || item.image || 'uploads/placeholders/food-placeholder.jpg',
                restaurant: {
                    id: restaurant._id,
                    name: restaurant.name
                },
                category: item.category || 'Main Course',
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs,
                fat: item.fat,
                isVegetarian: item.isVegetarian,
                isVegan: item.isVegan,
                isGlutenFree: item.isGlutenFree,
                isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
                averageRating: item.averageRating || 0,
                numberOfRatings: item.numberOfRatings || 0,
                isPopular: item.numberOfRatings > 2 || item.averageRating > 4,
                // Include customization options needed by RestaurantDetails page
                customizationOptions: item.customizationOptions
            };

            // Add offer details if applicable
            if (bestOffer && bestOffer.discountPercentage > 0) {
                formattedItem.originalPrice = item.item_price;
                formattedItem.discountedPrice = parseFloat((item.item_price * (1 - bestOffer.discountPercentage / 100)).toFixed(2));
                formattedItem.offerDetails = {
                    percentage: bestOffer.discountPercentage,
                    title: bestOffer.title,
                    id: bestOffer._id
                };
            }

            return formattedItem;
        });
        
        res.status(200).json({
            success: true,
            data: formattedItems
        });
    } catch (error) {
        console.error('Error fetching restaurant menu items:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
});

// GET menu items for the current restaurant owner (authenticated)
router.get('/restaurant', auth, async (req, res) => {
    try {
        console.log('Retrieving menu items for restaurant owner. req.user:', JSON.stringify(req.user));
        
        const userId = req.user.userId; // Use the consistent userId from auth middleware
        
        if (!userId) {
            console.log('Error: No valid userId found in token payload', req.user);
            return res.status(400).json({
                success: false,
                message: 'User ID not found in token. Please log in again.'
            });
        }

        // Find the Restaurant document associated with this user
        const Restaurant = mongoose.model('Restaurant');
        const userRestaurant = await Restaurant.findOne({ owner: userId });

        if (!userRestaurant) {
            console.log(`No restaurant found for owner ID: ${userId}`);
            // If the user is a restaurant owner but has no restaurant entry yet, return empty list
            return res.status(200).json({
                success: true,
                message: 'No restaurant profile found for this owner.',
                data: [] 
            });
        }

        const restaurantId = userRestaurant._id;
        console.log(`Found restaurant ID: ${restaurantId} for owner ${userId}`);
        
        // Now query MenuItems using the correct restaurantId
        console.log('Looking for items with restaurant ID:', restaurantId);
        
        // Ensure MenuItem model is available
        if (!MenuItem) {
            console.error('MenuItem model is undefined');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error. Please contact support.'
            });
        }
        
        // Check if the collection exists (optional, but can prevent errors if empty)
        if (!mongoose.connection.collections['menuitems']) {
            console.log('The menuitems collection does not exist yet');
            return res.status(200).json({
                success: true,
                data: []
            });
        }
        
        // Fetch menu items belonging to this specific restaurant
        const menuItems = await MenuItem.find({ restaurant: restaurantId }).lean(); // Use .lean() for performance
        console.log('Found menu items:', menuItems ? menuItems.length : 'none');
        
        // Debug the first menu item thoroughly if any exist
        if (menuItems && menuItems.length > 0) {
            console.log('First menu item debug:', {
                id: menuItems[0]._id,
                item_name: menuItems[0].item_name,
                item_price: menuItems[0].item_price,
                image: menuItems[0].image
            });
        }
        
        // Format the response, correctly mapping model field names to API response names
        const formattedItems = menuItems ? menuItems.map(item => {
            // Determine which image field to use, with fallbacks
            let imagePath = item.image || item.imageUrl || 'uploads/placeholders/food-placeholder.jpg'; // Add fallback
            
            // Debug the image path
            // console.log(`Processing image path for item ${item._id}: ${imagePath}`); // Can be verbose
            
            return {
                id: item._id,
                name: item.item_name, // Map item_name to name
                description: item.description,
                price: item.item_price, // Map item_price to price
                image: imagePath, // Use the determined image path
                // Ensure restaurant info is included, even if not populated
                restaurant: { 
                    id: restaurantId,
                    name: userRestaurant.name || 'Your Restaurant' // Use actual name if available
                },
                category: item.category || 'Main Course',
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs,
                fat: item.fat,
                isVegetarian: item.isVegetarian || false, // Default to false if undefined
                isVegan: item.isVegan || false, // Default to false if undefined
                isGlutenFree: item.isGlutenFree || false, // Default to false if undefined
                isAvailable: item.isAvailable !== undefined ? item.isAvailable : true, // Default to true if undefined
                averageRating: item.averageRating || 0,
                numberOfRatings: item.numberOfRatings || 0,
                isPopular: item.numberOfRatings > 2 || item.averageRating > 4,
                // Include customization options for owner view
                customizationOptions: item.customizationOptions
            };
        }) : [];
        
        res.status(200).json({
            success: true,
            data: formattedItems
        });
    } catch (error) {
        console.error('Error fetching restaurant menu items:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
});

// GET specific menu item by ID
router.get('/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        console.log(`Fetching menu item with ID: ${productId}`);
        
        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid menu item ID format' });
        }
        
        // Fetch the menu item and populate restaurant details
        const menuItem = await MenuItem.findById(productId).populate({
            path: 'restaurant',
            select: 'name logo location cuisine'
        }).lean(); // Use lean
        
        if (!menuItem) {
            console.log(`Menu item with ID ${productId} not found`);
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }
        
        console.log(`Found menu item: ${menuItem.item_name}`);
        
        // Fetch active offers relevant to this item's restaurant
        let bestOffer = null;
        const itemRestaurantId = menuItem.restaurant?._id?.toString();

        if (itemRestaurantId) {
            const now = new Date();
            const activeOffers = await Offer.find({
                restaurant: itemRestaurantId, // Filter by this item's restaurant
                isActive: true,
                startDate: { $lte: now },
                endDate: { $gte: now }
            }).lean();

            console.log(`Found ${activeOffers.length} active offers for restaurant ${itemRestaurantId}`);

            // Find applicable offers for this specific item
            const applicableOffers = activeOffers.filter(offer => {
                if (offer.appliesTo === 'All Menu') {
                    return true;
                } else if (offer.appliesTo === 'Selected Items') {
                    return Array.isArray(offer.menuItems) && offer.menuItems.some(offerItemId => offerItemId.toString() === menuItem._id.toString());
                }
                return false;
            });

            // Find the best offer (highest discount percentage)
            if (applicableOffers.length > 0) {
                bestOffer = applicableOffers.reduce((maxOffer, currentOffer) => 
                    (currentOffer.discountPercentage > maxOffer.discountPercentage) ? currentOffer : maxOffer, 
                    applicableOffers[0]
                );
                console.log(`Best applicable offer: '${bestOffer.title}' (${bestOffer.discountPercentage}%)`);
            }
        }
        
        // Format the response
        const formattedItem = {
            id: menuItem._id,
            name: menuItem.item_name,
            description: menuItem.description,
            price: menuItem.item_price, // Original price
            image: menuItem.image,
            restaurant: menuItem.restaurant ? {
                id: menuItem.restaurant._id,
                name: menuItem.restaurant.name || 'Unknown Restaurant'
            } : {
                id: null,
                name: 'Unknown Restaurant'
            },
            category: menuItem.category || 'Main Course',
            calories: menuItem.calories,
            protein: menuItem.protein,
            carbs: menuItem.carbs,
            fat: menuItem.fat,
            isVegetarian: menuItem.isVegetarian,
            isVegan: menuItem.isVegan,
            isGlutenFree: menuItem.isGlutenFree,
            isAvailable: menuItem.isAvailable !== undefined ? menuItem.isAvailable : true,
            averageRating: menuItem.averageRating || 0,
            numberOfRatings: menuItem.numberOfRatings || 0,
            isPopular: menuItem.numberOfRatings > 2 || menuItem.averageRating > 4,
            dateCreated: menuItem.dateCreated,
            // Add ingredients and customization options
            ingredients: menuItem.ingredients, // Include base ingredients if needed
            customizationOptions: menuItem.customizationOptions // Include full customization options
        };

        // Add offer details if applicable
        if (bestOffer && bestOffer.discountPercentage > 0) {
            formattedItem.originalPrice = menuItem.item_price;
            formattedItem.discountedPrice = parseFloat((menuItem.item_price * (1 - bestOffer.discountPercentage / 100)).toFixed(2));
            formattedItem.offerDetails = {
                percentage: bestOffer.discountPercentage,
                title: bestOffer.title,
                id: bestOffer._id
            };
        }
        
        res.status(200).json({
            success: true,
            data: formattedItem
        });
    } catch (error) {
        console.error('Error fetching menu item:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
});

// POST create a new menu item (Restaurant owner only)
router.post('/', auth, isRestaurantOwner, upload.single('image'), handleMulterError, async (req, res) => {
    try {
        console.log('Creating new menu item with data:', req.body);
        console.log('User from token:', req.user);
        
        let imagePath = null;
        if (req.file) {
            imagePath = `uploads/menu/${req.file.filename}`;
            console.log('Uploaded image saved to:', imagePath);
        } else {
            imagePath = 'uploads/placeholders/food-placeholder.jpg';
            console.log('No image uploaded, using default placeholder');
        }
        
        // Get owner ID from token
        const ownerId = req.user.id || req.user._id || req.user.userId;
        if (!ownerId) {
            console.log('Missing owner ID in request');
            return res.status(400).json({
                success: false,
                message: 'Owner ID is missing.'
            });
        }
        
        // Always find the restaurant ID first, don't use owner ID
        const Restaurant = mongoose.model('Restaurant');
        const restaurant = await Restaurant.findOne({ owner: ownerId });
        
        if (!restaurant) {
            console.log(`No restaurant found for owner ID: ${ownerId}`);
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found. You must have a registered restaurant to add menu items.'
            });
        }
        
        const restaurantId = restaurant._id;
        console.log(`Creating menu item for restaurant ID: ${restaurantId} (owner ID: ${ownerId})`);
        
        // Create a new menu item
        const menuItemData = {
            item_name: req.body.name, // Map from name (API) to item_name (model)
            item_price: req.body.price, // Map from price (API) to item_price (model)
            description: req.body.description,
            category: req.body.category,
            restaurant: restaurantId, // Use restaurant ID, never owner ID
            image: imagePath,
            imageUrl: imagePath
        };

        // Optional fields
        if (req.body.calories) menuItemData.calories = parseFloat(req.body.calories);
        if (req.body.protein) menuItemData.protein = parseFloat(req.body.protein);
        if (req.body.carbs) menuItemData.carbs = parseFloat(req.body.carbs);
        if (req.body.fat) menuItemData.fat = parseFloat(req.body.fat);
        if (req.body.sodium) menuItemData.sodium = parseFloat(req.body.sodium); // Added Sodium
        if (req.body.sugar) menuItemData.sugar = parseFloat(req.body.sugar);     // Added Sugar
        if (req.body.fiber) menuItemData.fiber = parseFloat(req.body.fiber);     // Added Fiber

        // Handle ingredients and customizationOptions (availableAddOns)
        try {
            if (req.body.ingredients && typeof req.body.ingredients === 'string') {
                 menuItemData.ingredients = JSON.parse(req.body.ingredients);
                 console.log('Parsed ingredients:', menuItemData.ingredients);
            } else if (Array.isArray(req.body.ingredients)) {
                 menuItemData.ingredients = req.body.ingredients;
            }

            if (req.body.availableAddOns && typeof req.body.availableAddOns === 'string') {
                const parsedAddOns = JSON.parse(req.body.availableAddOns);
                if (Array.isArray(parsedAddOns)) {
                     menuItemData.customizationOptions = {
                         ...menuItemData.customizationOptions,
                         availableAddOns: parsedAddOns
                     };
                     console.log('Parsed availableAddOns:', menuItemData.customizationOptions.availableAddOns);
                }
            } else if (Array.isArray(req.body.availableAddOns)) {
                 menuItemData.customizationOptions = {
                      ...menuItemData.customizationOptions,
                      availableAddOns: req.body.availableAddOns
                 };
            }
            // Parse cookingOptions if provided
            if (req.body.cookingOptions && typeof req.body.cookingOptions === 'string') {
                const parsedCooking = JSON.parse(req.body.cookingOptions);
                if (Array.isArray(parsedCooking)) {
                    menuItemData.customizationOptions = {
                        ...menuItemData.customizationOptions,
                        cookingOptions: parsedCooking
                    };
                }
            } else if (Array.isArray(req.body.cookingOptions)) {
                menuItemData.customizationOptions = {
                    ...menuItemData.customizationOptions,
                    cookingOptions: req.body.cookingOptions
                };
            }
            // Ensure customizationOptions object exists if adding addons
            if (menuItemData.customizationOptions && !req.body.customizationOptions) {
                 // If we added addons but the main object wasn't passed, initialize it
                 if (!menuItem.customizationOptions) menuItem.customizationOptions = {};
            }

        } catch (parseError) {
            console.error("Error parsing ingredients or add-ons JSON:", parseError);
            // Decide if this should be a blocking error or just log and continue
            // For now, log and continue without these fields
        }


        // Boolean fields (convert string values to boolean)
        menuItemData.isVegetarian = req.body.isVegetarian === 'true';
        menuItemData.isVegan = req.body.isVegan === 'true';
        menuItemData.isGlutenFree = req.body.isGlutenFree === 'true';
        menuItemData.isAvailable = req.body.isAvailable !== undefined ? (req.body.isAvailable === 'true') : true;
        
        console.log('Final menu item data to save:', menuItemData);
        
        const menuItem = new MenuItem(menuItemData);
        const savedItem = await menuItem.save();
        
        console.log('Menu item saved successfully:', savedItem._id);
        
        // Prepare response data with API field names (name, price)
        const responseItem = {
            id: savedItem._id,
            name: savedItem.item_name,
            price: savedItem.item_price,
            description: savedItem.description,
            category: savedItem.category,
            image: savedItem.image,
            imageUrl: savedItem.imageUrl,
            calories: savedItem.calories,
            protein: savedItem.protein,
            carbs: savedItem.carbs,
            fat: savedItem.fat,
            isVegetarian: savedItem.isVegetarian,
            isVegan: savedItem.isVegan,
            isGlutenFree: savedItem.isGlutenFree,
            isAvailable: savedItem.isAvailable
        };
        
        res.status(201).json({
            success: true,
            message: 'Menu item created successfully.',
            data: responseItem
        });
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// PUT update menu item
router.put('/:id', [
    auth, 
    isRestaurantOwner, 
    (req, res, next) => {
        upload.single('image')(req, res, (err) => {
            if (err) {
                return handleMulterError(err, req, res, next);
            }
            next();
        });
    }
], async (req, res) => {
    try {
        // First, find the restaurant owned by this user
        const Restaurant = mongoose.model('Restaurant');
        const restaurant = await Restaurant.findOne({ owner: req.user._id || req.user.userId || req.user.id });
        
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found. Please make sure you have a restaurant registered."
            });
        }
        
        // Find menu item and ensure it belongs to the restaurant owner
        const menuItem = await MenuItem.findOne({ 
            _id: req.params.id,
            restaurant: restaurant._id
        });
        
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found or you do not have permission to update it'
            });
        }
        
        const {
            name, description, price, category,
            calories, protein, carbs, fat,
            isVegetarian, isVegan, isGlutenFree, isAvailable
        } = req.body;
        
        // Validate required fields
        if (!name || !description || !price) {
            return res.status(400).json({
                success: false,
                message: 'Name, description, and price are required fields'
            });
        }

        // Validate price is a number
        if (isNaN(parseFloat(price))) {
            return res.status(400).json({
                success: false,
                message: 'Price must be a valid number'
            });
        }
        
        // Update menu item
        menuItem.item_name = name;
        menuItem.description = description;
        menuItem.item_price = parseFloat(price);
        menuItem.category = category || menuItem.category;

        // Update image if provided
        if (req.file) {
            const imagePath = `uploads/menu/${req.file.filename}`;
            console.log('New image uploaded, saved to:', imagePath);

            // Update both image and imageUrl for consistency
            menuItem.image = imagePath;
            menuItem.imageUrl = imagePath;
        }

        // Update optional fields
        if (calories !== undefined) menuItem.calories = parseFloat(calories) || 0;
        if (protein !== undefined) menuItem.protein = parseFloat(protein) || 0;
        if (carbs !== undefined) menuItem.carbs = parseFloat(carbs) || 0;
        if (fat !== undefined) menuItem.fat = parseFloat(fat) || 0;
        if (req.body.sodium !== undefined) menuItem.sodium = parseFloat(req.body.sodium) || 0; // Added Sodium
        if (req.body.sugar !== undefined) menuItem.sugar = parseFloat(req.body.sugar) || 0; // Added Sugar
        if (req.body.fiber !== undefined) menuItem.fiber = parseFloat(req.body.fiber) || 0; // Added Fiber

        // Update ingredients and customizationOptions (availableAddOns)
         try {
            if (req.body.ingredients) {
                 const parsedIngredients = (typeof req.body.ingredients === 'string')
                     ? JSON.parse(req.body.ingredients)
                     : req.body.ingredients;
                 if (Array.isArray(parsedIngredients)) {
                     menuItem.ingredients = parsedIngredients;
                     console.log('Updated ingredients:', menuItem.ingredients);
                 }
            }

            if (req.body.availableAddOns) {
                 const parsedAddOns = (typeof req.body.availableAddOns === 'string')
                     ? JSON.parse(req.body.availableAddOns)
                     : req.body.availableAddOns;
                 if (Array.isArray(parsedAddOns)) {
                     if (!menuItem.customizationOptions) {
                         menuItem.customizationOptions = {};
                     }
                     menuItem.customizationOptions.availableAddOns = parsedAddOns;
                     menuItem.markModified('customizationOptions');
                     console.log('Updated availableAddOns:', menuItem.customizationOptions.availableAddOns);
                 }
            }
         } catch (parseError) {
             console.error("Error parsing ingredients or add-ons JSON during update:", parseError);
             // Decide if this should be a blocking error or just log and continue
         }

        // Parse and update cookingOptions if provided
        if (req.body.cookingOptions) {
            const parsedCooking = (typeof req.body.cookingOptions === 'string')
                ? JSON.parse(req.body.cookingOptions)
                : req.body.cookingOptions;
            if (Array.isArray(parsedCooking)) {
                if (!menuItem.customizationOptions) {
                    menuItem.customizationOptions = {};
                }
                menuItem.customizationOptions.cookingOptions = parsedCooking;
                menuItem.markModified('customizationOptions');
                console.log('Updated cookingOptions:', menuItem.customizationOptions.cookingOptions);
            }
        }

        // Update boolean flags
        menuItem.isVegetarian = isVegetarian === 'true' || isVegetarian === true;
        menuItem.isVegan = isVegan === 'true' || isVegan === true;
        menuItem.isGlutenFree = isGlutenFree === 'true' || isGlutenFree === true;
        menuItem.isAvailable = isAvailable === 'true' || isAvailable === true;
        
        await menuItem.save();
        
        // Return formatted response
        res.status(200).json({
            success: true,
            message: 'Menu item updated successfully',
            data: {
                id: menuItem._id,
                name: menuItem.item_name,
                description: menuItem.description,
                price: menuItem.item_price,
                image: menuItem.image,
                imageUrl: menuItem.imageUrl,
                category: menuItem.category,
                calories: menuItem.calories,
                protein: menuItem.protein,
                carbs: menuItem.carbs,
                fat: menuItem.fat,
                isVegetarian: menuItem.isVegetarian,
                isVegan: menuItem.isVegan,
                isGlutenFree: menuItem.isGlutenFree,
                isAvailable: menuItem.isAvailable
            }
        });
    } catch (error) {
        console.error('Error updating menu item:', error);
        let errorMessage = 'Server error. Please try again.';
        
        if (error.name === 'ValidationError') {
            errorMessage = Object.values(error.errors).map(err => err.message).join(', ');
        }
        
        res.status(500).json({ 
            success: false, 
            message: errorMessage 
        });
    }
});

// DELETE menu item
router.delete('/:id', auth, isRestaurantOwner, async (req, res) => {
    try {
        // Step 1: Find the restaurant owned by this user
        const Restaurant = mongoose.model('Restaurant');
        // Use any potential user ID field from the token
        const ownerId = req.user._id || req.user.userId || req.user.id; 
        if (!ownerId) {
             return res.status(401).json({ success: false, message: 'Authentication error: User ID not found.' });
        }
        const restaurant = await Restaurant.findOne({ owner: ownerId });

        if (!restaurant) {
            return res.status(403).json({
                success: false,
                message: "Permission denied: No restaurant found for this user."
            });
        }

        // Step 2: Find menu item using the item ID and the owner's actual restaurant ID
        const menuItem = await MenuItem.findOne({
            _id: req.params.id,
            restaurant: restaurant._id // Use the verified restaurant ID
        });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found or it does not belong to your restaurant' // More specific message
            });
        }

        // Delete image if it exists and is not a placeholder
        const placeholderPath = 'uploads/placeholders/food-placeholder.jpg';
        if (menuItem.image && menuItem.image !== placeholderPath) {
             const imagePath = path.join(__dirname, '..', menuItem.image); // Construct absolute path
             if (fs.existsSync(imagePath)) {
                 try {
                     fs.unlinkSync(imagePath);
                     console.log(`Deleted image file: ${imagePath}`);
                 } catch (unlinkError) {
                      console.error(`Error deleting image file ${imagePath}:`, unlinkError);
                      // Decide if this should prevent item deletion or just log
                 }
             } else {
                 console.warn(`Image file not found, skipping delete: ${imagePath}`);
             }
        } else if (menuItem.image === placeholderPath) {
             console.log(`Skipping delete for placeholder image: ${menuItem.image}`);
        }


        // Delete menu item
        await MenuItem.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Menu item deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// FIX endpoint to repair menu items with incorrect restaurant association
router.post('/fix-menu-items', [auth, isRestaurantOwner], async (req, res) => {
    try {
        // Find the restaurant owned by this user
        const Restaurant = mongoose.model('Restaurant');
        const restaurant = await Restaurant.findOne({ owner: req.user._id || req.user.userId || req.user.id });
        
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found. Please make sure you have a restaurant registered."
            });
        }
        
        console.log(`Fixing menu items for restaurant: ${restaurant.name} (ID: ${restaurant._id})`);
        
        // Look for menu items with user ID as restaurant
        const userIds = [
            req.user._id,
            req.user.userId,
            req.user.id
        ].filter(Boolean).map(id => id.toString ? id.toString() : id);
        
        // Update menu items that have incorrect association
        const updateResult = await MenuItem.updateMany(
            { 
                $or: [
                    { restaurant: { $in: userIds } },
                    { restaurant: null }
                ]
            },
            { restaurant: restaurant._id }
        );
        
        console.log(`Updated ${updateResult.modifiedCount} menu items`);
        
        // Return success response
        res.status(200).json({
            success: true,
            message: `Fixed ${updateResult.modifiedCount} menu items`,
            data: {
                updatedCount: updateResult.modifiedCount,
                matchedCount: updateResult.matchedCount,
                restaurantId: restaurant._id,
                restaurantName: restaurant.name
            }
        });
    } catch (error) {
        console.error('Error fixing menu items:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fixing menu items'
        });
    }
});

module.exports = router; 
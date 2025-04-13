const express = require('express');
const router = express.Router();
let MenuItem;

try {
    MenuItem = require('../models/menuItem');
    console.log('MenuItem model loaded successfully');
} catch (error) {
    console.error('Error loading MenuItem model:', error);
}

const { auth, isRestaurantOwner } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

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
        // Check if restaurantId is provided as a query parameter
        const { restaurantId } = req.query;
        let query = {};
        
        // If restaurantId is provided, filter by restaurant
        if (restaurantId) {
            query.restaurant = restaurantId;
        }
        
        console.log('Query for menu items:', query);
        
        // DIRECT FIX: Find a restaurant to use for association
        const restaurant = await mongoose.model('Restaurant').findOne({
            $or: [
                { owner: "67fb7932b23ec6b3cad80fbb" }, // Try to match with user ID from logs
                {} // Fallback to any restaurant
            ]
        });
        
        if (restaurant) {
            console.log(`Found restaurant for direct fix: ${restaurant.name} (ID: ${restaurant._id})`);
            
            // Update all menu items in memory during this request
            const menuItems = await MenuItem.find(query);
            
            // Log detailed restaurant data for debugging
            if (menuItems.length > 0) {
                console.log(`Processing ${menuItems.length} menu items`);
                
                // Update any items with missing restaurant directly
                for (const item of menuItems) {
                    if (!item.restaurant) {
                        console.log(`Fixing menu item ${item.item_name} with missing restaurant`);
                        item.restaurant = restaurant._id;
                        await item.save();
                    }
                }
            } else {
                console.log('No menu items found for query:', query);
            }
        }
        
        // Now proceed with the regular query with populated data
        const processedMenuItems = await MenuItem.find(query).populate({
            path: 'restaurant',
            select: 'name logo location cuisine'
        });
        
        // Format the response
        const formattedItems = processedMenuItems.map(item => {
            // Detailed logging for each item
            const restaurantInfo = item.restaurant 
                ? `${item.restaurant._id} - ${item.restaurant.name}` 
                : 'Using default restaurant';
                
            console.log(`Processing item: ${item.item_name}, Restaurant:`, restaurantInfo);
            
            return {
                id: item._id,
                name: item.item_name,
                description: item.description,
                price: item.item_price,
                image: item.image,
                restaurant: item.restaurant ? {
                    id: item.restaurant._id,
                    name: item.restaurant.name
                } : {
                    id: restaurant ? restaurant._id : null,
                    name: restaurant ? restaurant.name : 'Unknown Restaurant'
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
                isPopular: item.numberOfRatings > 2 || item.averageRating > 4
            };
        });
        
        res.status(200).json({
            success: true,
            data: formattedItems
        });
    } catch (error) {
        console.error('Error fetching menu items:', error);
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
        
        // Find menu items and populate restaurant with all necessary data
        const menuItems = await MenuItem.find({ restaurant: req.params.id }).populate({
            path: 'restaurant',
            select: 'name logo location cuisine'
        });
        
        console.log(`Found ${menuItems.length} menu items for restaurant ${restaurant.name}`);
        
        // If items found, log the first one for debugging
        if (menuItems.length > 0) {
            console.log('First menu item debug:');
            console.log('- Item name:', menuItems[0].item_name);
            console.log('- Restaurant data:', JSON.stringify(menuItems[0].restaurant, null, 2));
        }
        
        // Format the response with restaurant data from our verified restaurant object
        const formattedItems = menuItems.map(item => ({
            id: item._id,
            name: item.item_name,
            description: item.description,
            price: item.item_price,
            image: item.image,
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
            isPopular: item.numberOfRatings > 2 || item.averageRating > 4
        }));
        
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
        
        // Determine role and check if user is a restaurant owner
        const role = req.user.role || 'unknown';
        const isRestaurantByRole = role === 'restaurant';
        const isRestaurantByFlag = !!req.user.isRestaurantOwner;
        
        console.log(`User role: ${role}, isRestaurantByRole: ${isRestaurantByRole}, isRestaurantByFlag: ${isRestaurantByFlag}`);
        
        if (!isRestaurantByRole && !isRestaurantByFlag) {
            console.log('Access denied - User is not a restaurant owner');
            return res.status(403).json({
                success: false,
                message: 'Access denied. Restaurant owner permissions required.'
            });
        }
        
        // Find some ID value to use as restaurantId
        let restaurantId = null;
        
        // Try different possible sources in order of preference
        if (req.user.userId) {
            restaurantId = req.user.userId;
            console.log('Using userId for restaurantId:', restaurantId);
        } else if (req.user.id) {
            restaurantId = req.user.id;
            console.log('Using id for restaurantId:', restaurantId);
        } else if (req.user._id) {
            restaurantId = req.user._id;
            console.log('Using _id for restaurantId:', restaurantId);
        }
        
        if (!restaurantId) {
            console.log('Error: No valid ID found in token payload', req.user);
            return res.status(400).json({
                success: false,
                message: 'Restaurant ID not found. Please contact support.'
            });
        }
        
        console.log('Looking for items with restaurant ID:', restaurantId);
        
        if (!MenuItem) {
            console.error('MenuItem model is undefined');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error. Please contact support.'
            });
        }
        
        // Check if the collection exists by examining the model
        if (!mongoose.connection.collections['menuitems']) {
            console.log('The menuitems collection does not exist yet');
            // Return empty array since there are no menu items yet
            return res.status(200).json({
                success: true,
                data: []
            });
        }
        
        const menuItems = await MenuItem.find({ restaurant: restaurantId });
        console.log('Found menu items:', menuItems ? menuItems.length : 'none');
        
        // Format the response
        const formattedItems = menuItems ? menuItems.map(item => ({
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
            isPopular: item.numberOfRatings > 2 || item.averageRating > 4
        })) : [];
        
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
        console.log(`Fetching menu item with ID: ${req.params.id}`);
        
        // Fully populate the restaurant data
        const menuItem = await MenuItem.findById(req.params.id).populate({
            path: 'restaurant',
            select: 'name logo location cuisine'
        });
        
        if (!menuItem) {
            console.log(`Menu item with ID ${req.params.id} not found`);
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }
        
        console.log(`Found menu item: ${menuItem.item_name}`);
        
        // Log restaurant data for debugging
        if (menuItem.restaurant) {
            console.log('Restaurant data:', JSON.stringify(menuItem.restaurant, null, 2));
        } else {
            console.log('No restaurant data found for this menu item');
        }
        
        // Format the response
        const formattedItem = {
            id: menuItem._id,
            name: menuItem.item_name,
            description: menuItem.description,
            price: menuItem.item_price,
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
            dateCreated: menuItem.dateCreated
        };
        
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

// POST create new menu item
router.post('/', [
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
        
        // Create menu item
        const menuItem = new MenuItem({
            item_name: name,
            item_price: parseFloat(price),
            description,
            image: req.file ? '/' + req.file.path : '',
            restaurant: req.user.restaurantId,
            category: category || 'Main Course',
            calories: calories ? parseFloat(calories) : 0,
            protein: protein ? parseFloat(protein) : 0,
            carbs: carbs ? parseFloat(carbs) : 0,
            fat: fat ? parseFloat(fat) : 0,
            isVegetarian: isVegetarian === 'true' || isVegetarian === true,
            isVegan: isVegan === 'true' || isVegan === true,
            isGlutenFree: isGlutenFree === 'true' || isGlutenFree === true,
            isAvailable: isAvailable === 'true' || isAvailable === true
        });
        
        await menuItem.save();
        
        // Return formatted response
        res.status(201).json({
            success: true,
            message: 'Menu item created successfully',
            data: {
                id: menuItem._id,
                name: menuItem.item_name,
                description: menuItem.description,
                price: menuItem.item_price,
                image: menuItem.image,
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
        console.error('Error creating menu item:', error);
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
        // Find menu item and ensure it belongs to the restaurant owner
        const menuItem = await MenuItem.findOne({ 
            _id: req.params.id,
            restaurant: req.user.restaurantId
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
            // Delete old image if it exists
            if (menuItem.image && fs.existsSync(menuItem.image.substring(1))) {
                fs.unlinkSync(menuItem.image.substring(1));
            }
            menuItem.image = '/' + req.file.path;
        }
        
        // Update optional fields
        if (calories !== undefined) menuItem.calories = parseFloat(calories) || 0;
        if (protein !== undefined) menuItem.protein = parseFloat(protein) || 0;
        if (carbs !== undefined) menuItem.carbs = parseFloat(carbs) || 0;
        if (fat !== undefined) menuItem.fat = parseFloat(fat) || 0;
        
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
        // Find menu item and ensure it belongs to the restaurant owner
        const menuItem = await MenuItem.findOne({ 
            _id: req.params.id,
            restaurant: req.user.restaurantId
        });
        
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found or you do not have permission to delete it'
            });
        }
        
        // Delete image if it exists
        if (menuItem.image && fs.existsSync(menuItem.image.substring(1))) {
            fs.unlinkSync(menuItem.image.substring(1));
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

module.exports = router; 
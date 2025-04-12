const express = require('express');
const router = express.Router();
const { MenuItem } = require('../models/menuItem');
const { auth, isRestaurantOwner } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// GET all menu items (publicly accessible)
router.get('/', async (req, res) => {
    try {
        const menuItems = await MenuItem.find().populate('restaurant', 'restaurantDetails.name');
        
        // Format the response
        const formattedItems = menuItems.map(item => ({
            id: item._id,
            name: item.item_name,
            description: item.description,
            price: item.item_price,
            image: item.image,
            restaurant: {
                id: item.restaurant._id,
                name: item.restaurant.restaurantDetails.name
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
        const menuItems = await MenuItem.find({ restaurant: req.params.id });
        
        // Format the response
        const formattedItems = menuItems.map(item => ({
            id: item._id,
            name: item.item_name,
            description: item.description,
            price: item.item_price,
            image: item.image,
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
router.get('/restaurant', auth, isRestaurantOwner, async (req, res) => {
    try {
        const menuItems = await MenuItem.find({ restaurant: req.user.userId });
        
        // Format the response
        const formattedItems = menuItems.map(item => ({
            id: item._id,
            name: item.item_name,
            description: item.description,
            price: item.item_price,
            image: item.image,
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

// GET specific menu item by ID
router.get('/:id', async (req, res) => {
    try {
        const menuItem = await MenuItem.findById(req.params.id).populate('restaurant', 'restaurantDetails.name');
        
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }
        
        // Format the response
        const formattedItem = {
            id: menuItem._id,
            name: menuItem.item_name,
            description: menuItem.description,
            price: menuItem.item_price,
            image: menuItem.image,
            restaurant: {
                id: menuItem.restaurant._id,
                name: menuItem.restaurant.restaurantDetails.name
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
            restaurant: req.user.userId,
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
            restaurant: req.user.userId
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
            restaurant: req.user.userId
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
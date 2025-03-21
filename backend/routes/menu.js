const express = require('express');
const router = express.Router();
const { MenuItem } = require('../models/menuItem');
const { auth, isRestaurantOwner } = require('../middleware/auth');

// GET all menu items
router.get('/', async (req, res) => {
    try {
        const menuItems = await MenuItem.find().populate('restaurant');
        res.status(200).json(menuItems);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET menu items by restaurant ID
router.get('/restaurant/:id', async (req, res) => {
    try {
        const menuItems = await MenuItem.find({ restaurant: req.params.id });
        res.status(200).json(menuItems);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET menu item by ID
router.get('/:id', async (req, res) => {
    try {
        const menuItem = await MenuItem.findById(req.params.id).populate('restaurant');
        if (!menuItem) {
            return res.status(404).json({ success: false, message: 'Menu item not found' });
        }
        res.status(200).json(menuItem);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST create new menu item (restricted to restaurant owners)
router.post('/', [auth, isRestaurantOwner], async (req, res) => {
    try {
        const menuItem = new MenuItem({
            item_name: req.body.item_name,
            item_price: req.body.item_price,
            description: req.body.description,
            image: req.body.image,
            restaurant: req.body.restaurant,
            calories: req.body.calories,
            protein: req.body.protein,
            carbs: req.body.carbs,
            fat: req.body.fat,
            isVegetarian: req.body.isVegetarian,
            isVegan: req.body.isVegan,
            isGlutenFree: req.body.isGlutenFree,
            isCustomizable: req.body.isCustomizable
        });

        const savedMenuItem = await menuItem.save();
        res.status(201).json(savedMenuItem);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT update menu item (restricted to restaurant owners)
router.put('/:id', [auth, isRestaurantOwner], async (req, res) => {
    try {
        const menuItem = await MenuItem.findByIdAndUpdate(
            req.params.id,
            {
                item_name: req.body.item_name,
                item_price: req.body.item_price,
                description: req.body.description,
                image: req.body.image,
                calories: req.body.calories,
                protein: req.body.protein,
                carbs: req.body.carbs,
                fat: req.body.fat,
                isVegetarian: req.body.isVegetarian,
                isVegan: req.body.isVegan,
                isGlutenFree: req.body.isGlutenFree,
                isCustomizable: req.body.isCustomizable
            },
            { new: true }
        );

        if (!menuItem) {
            return res.status(404).json({ success: false, message: 'Menu item not found' });
        }

        res.status(200).json(menuItem);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE menu item (restricted to restaurant owners)
router.delete('/:id', [auth, isRestaurantOwner], async (req, res) => {
    try {
        const menuItem = await MenuItem.findByIdAndRemove(req.params.id);
        
        if (!menuItem) {
            return res.status(404).json({ success: false, message: 'Menu item not found' });
        }

        res.status(200).json({ success: true, message: 'Menu item deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router; 
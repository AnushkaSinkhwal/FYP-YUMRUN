const User = require('../models/user');
const { MenuItem } = require('../models/menuItem');
const mongoose = require('mongoose');

/**
 * Add a menu item to user's favorites
 * @route POST /api/favorites
 * @access Private
 */
exports.addToFavorites = async (req, res) => {
    try {
        const { menuItemId } = req.body;
        const userId = req.user._id;
        
        if (!menuItemId) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Menu item ID is required',
                    code: 'VALIDATION_ERROR'
                }
            });
        }
        
        // Validate menu item exists
        const menuItem = await MenuItem.findById(menuItemId);
        
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Menu item not found',
                    code: 'NOT_FOUND'
                }
            });
        }
        
        // Update user's favorites, ensuring no duplicates
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'NOT_FOUND'
                }
            });
        }
        
        // Check if already in favorites
        if (user.favorites.includes(menuItemId)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Item already in favorites',
                    code: 'ALREADY_EXISTS'
                }
            });
        }
        
        // Add to favorites
        user.favorites.push(menuItemId);
        await user.save();
        
        return res.status(200).json({
            success: true,
            message: 'Item added to favorites',
            data: {
                menuItemId
            }
        });
    } catch (error) {
        console.error('Error adding to favorites:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Server error. Please try again.',
                code: 'SERVER_ERROR'
            }
        });
    }
};

/**
 * Remove a menu item from user's favorites
 * @route DELETE /api/favorites/:menuItemId
 * @access Private
 */
exports.removeFromFavorites = async (req, res) => {
    try {
        const { menuItemId } = req.params;
        const userId = req.user._id;
        
        // Validate menu item ID
        if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid menu item ID',
                    code: 'VALIDATION_ERROR'
                }
            });
        }
        
        // Update user's favorites
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'NOT_FOUND'
                }
            });
        }
        
        // Remove from favorites
        user.favorites = user.favorites.filter(id => id.toString() !== menuItemId);
        await user.save();
        
        return res.status(200).json({
            success: true,
            message: 'Item removed from favorites',
            data: {
                menuItemId
            }
        });
    } catch (error) {
        console.error('Error removing from favorites:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Server error. Please try again.',
                code: 'SERVER_ERROR'
            }
        });
    }
};

/**
 * Get user's favorites
 * @route GET /api/favorites
 * @access Private
 */
exports.getFavorites = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Find user and populate favorites
        const user = await User.findById(userId)
            .populate({
                path: 'favorites',
                select: 'item_name item_price description image category isVegetarian isVegan restaurant',
                populate: {
                    path: 'restaurant',
                    select: 'restaurantDetails.name restaurantDetails.address'
                }
            });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'NOT_FOUND'
                }
            });
        }
        
        return res.status(200).json({
            success: true,
            data: {
                favorites: user.favorites
            }
        });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Server error. Please try again.',
                code: 'SERVER_ERROR'
            }
        });
    }
};

/**
 * Check if a menu item is in user's favorites
 * @route GET /api/favorites/:menuItemId/check
 * @access Private
 */
exports.checkFavorite = async (req, res) => {
    try {
        const { menuItemId } = req.params;
        const userId = req.user._id;
        
        // Validate menu item ID
        if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid menu item ID',
                    code: 'VALIDATION_ERROR'
                }
            });
        }
        
        // Find user
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'NOT_FOUND'
                }
            });
        }
        
        // Check if in favorites
        const isFavorite = user.favorites.some(id => id.toString() === menuItemId);
        
        return res.status(200).json({
            success: true,
            data: {
                isFavorite
            }
        });
    } catch (error) {
        console.error('Error checking favorite status:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Server error. Please try again.',
                code: 'SERVER_ERROR'
            }
        });
    }
}; 
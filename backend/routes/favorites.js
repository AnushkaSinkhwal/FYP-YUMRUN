const express = require('express');
const router = express.Router();
const { addToFavorites, removeFromFavorites, getFavorites, checkFavorite } = require('../controllers/favoritesController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Add an item to favorites
router.post('/', addToFavorites);

// Remove an item from favorites
router.delete('/:menuItemId', removeFromFavorites);

// Get all favorites
router.get('/', getFavorites);

// Check if an item is in favorites
router.get('/:menuItemId/check', checkFavorite);

module.exports = router; 
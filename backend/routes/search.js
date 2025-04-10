const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const searchController = require('../controllers/searchController');

// Public search endpoint with filters
router.get('/menu-items', searchController.searchMenuItems);

// Personalized search based on user's health profile
router.get('/personalized', auth, searchController.personalizedMenuItems);

module.exports = router; 
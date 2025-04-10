const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const nutritionController = require('../controllers/nutritionController');

// GET nutritional info for a food item
router.get('/food/:id', nutritionController.getFoodNutrition);

// POST analyze ingredients for nutritional value
router.post('/analyze', auth, nutritionController.analyzeIngredients);

// GET nutritional info for a meal (combination of items)
router.get('/meal/:id', nutritionController.getMealNutrition);

// POST calculate nutritional value for custom meal
router.post('/calculate', auth, nutritionController.calculateCustomMealNutrition);

module.exports = router; 
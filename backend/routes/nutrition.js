const express = require('express');
const router = express.Router();
const nutritionController = require('../controllers/nutritionController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/nutrition/food/:id
 * @desc    Get nutritional info for a specific food item
 * @access  Public
 */
router.get('/food/:id', nutritionController.getFoodNutrition);

/**
 * @route   POST /api/nutrition/analyze
 * @desc    Analyze nutrition for custom ingredients
 * @access  Public
 */
router.post('/analyze', nutritionController.analyzeIngredients);

/**
 * @route   GET /api/nutrition/meal/:id
 * @desc    Get nutritional info for a meal (combination of menu items)
 * @access  Public
 */
router.get('/meal/:id', nutritionController.getMealNutrition);

/**
 * @route   POST /api/nutrition/calculate
 * @desc    Calculate nutrition for custom meal
 * @access  Public
 */
router.post('/calculate', nutritionController.calculateCustomMealNutrition);

/**
 * @route   GET /api/nutrition/user/daily
 * @desc    Get user's daily nutritional summary based on orders
 * @access  Private
 */
router.get('/user/daily', protect, nutritionController.getUserDailyNutrition);

/**
 * @route   GET /api/nutrition/user/weekly
 * @desc    Get user's weekly nutritional summary
 * @access  Private
 */
router.get('/user/weekly', protect, nutritionController.getUserWeeklyNutrition);

module.exports = router; 
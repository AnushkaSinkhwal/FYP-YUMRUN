const express = require('express');
const router = express.Router();
const { getHealthRecommendations } = require('../controllers/recommendationsController');
const { auth, isRestaurantOwner } = require('../middleware/auth');
const MenuItem = require('../models/menuItem');
const Restaurant = require('../models/restaurant');
const User = require('../models/user');

// GET personalized recommendations for user
router.get('/user/:userId', (req, res) => {
    res.status(200).json({ message: `Personalized recommendations for user ID: ${req.params.userId}` });
});

// GET health-based recommendations - Updated to use controller
router.get('/', getHealthRecommendations);

// Keep the legacy route for backward compatibility
router.get('/health/:condition', (req, res) => {
    // Pass the condition as a query parameter to the new controller
    req.query.healthCondition = req.params.condition;
    getHealthRecommendations(req, res);
});

// GET popular items recommendations
router.get('/popular', (req, res) => {
    res.status(200).json({ message: 'Popular items recommendations' });
});

// GET recommendations based on previous orders
router.get('/history/:userId', (req, res) => {
    res.status(200).json({ message: `Recommendations based on history for user ID: ${req.params.userId}` });
});

// Add this endpoint if it doesn't exist yet
router.get('/health', async (req, res) => {
  try {
    const { condition } = req.query;
    console.log(`Received health recommendations request for condition: ${condition}`);
    
    // Fallback recommendations based on health condition
    const recommendations = [];
    
    // Generate 4-6 recommendations
    const count = Math.floor(Math.random() * 3) + 4; // 4-6 items
    
    for (let i = 1; i <= count; i++) {
      // Base item data
      const item = {
        id: `item-${Date.now()}-${i}`,
        name: '',
        description: '',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        price: 0,
        image: '/uploads/placeholders/food-placeholder.jpg',
        restaurantId: '644b288c456889d7a2b5f9c7', // Default restaurant ID
        healthBenefits: []
      };
      
      // Customize based on condition
      switch(condition?.toLowerCase()) {
        case 'diabetes':
          item.name = ['Low-Carb Bowl', 'Diabetic-Friendly Salad', 'Protein Platter', 'Sugar-Free Smoothie', 'Balanced Meal Plate'][i % 5];
          item.description = 'Low glycemic index meal suitable for diabetic diet';
          item.calories = Math.floor(Math.random() * 200) + 200;
          item.protein = Math.floor(Math.random() * 15) + 15;
          item.carbs = Math.floor(Math.random() * 10) + 10;
          item.fat = Math.floor(Math.random() * 10) + 5;
          item.price = Math.floor(Math.random() * 400) + 200;
          item.healthBenefits = ['Low glycemic index', 'Controlled carbs', 'Blood sugar friendly'];
          break;
          
        case 'heart condition':
        case 'hypertension':
          item.name = ['Heart-Healthy Bowl', 'Low-Sodium Plate', 'Omega-3 Rich Meal', 'Mediterranean Diet Option', 'Leafy Green Salad'][i % 5];
          item.description = 'Low sodium, heart-healthy meal with balanced nutrients';
          item.calories = Math.floor(Math.random() * 150) + 250;
          item.protein = Math.floor(Math.random() * 10) + 15;
          item.carbs = Math.floor(Math.random() * 15) + 20;
          item.fat = Math.floor(Math.random() * 8) + 7;
          item.price = Math.floor(Math.random() * 350) + 250;
          item.healthBenefits = ['Low sodium', 'Heart-healthy fats', 'Cardiovascular support'];
          break;
          
        default: // Healthy options
          item.name = ['Fresh Salad Bowl', 'Balanced Meal Plate', 'Protein-Rich Option', 'Nutrient-Dense Bowl', 'Wholesome Platter'][i % 5];
          item.description = 'Nutritionally balanced meal with fresh ingredients';
          item.calories = Math.floor(Math.random() * 200) + 300;
          item.protein = Math.floor(Math.random() * 15) + 20;
          item.carbs = Math.floor(Math.random() * 20) + 30;
          item.fat = Math.floor(Math.random() * 10) + 10;
          item.price = Math.floor(Math.random() * 300) + 300;
          item.healthBenefits = ['Balanced nutrition', 'Natural ingredients', 'Nutrient-rich'];
      }
      
      recommendations.push(item);
    }
    
    // Return response
    return res.status(200).json({
      success: true,
      data: {
        recommendations,
        condition: condition || 'Healthy'
      }
    });
  } catch (error) {
    console.error('Error generating health recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate health recommendations'
    });
  }
});

module.exports = router; 
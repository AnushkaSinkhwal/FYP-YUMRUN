const { MenuItem } = require('../models/menuItem');
const mongoose = require('mongoose');

/**
 * Get health-focused meal recommendations based on user's health condition
 * @route GET /api/recommendations
 * @access Public
 */
exports.getHealthRecommendations = async (req, res) => {
    try {
        const { healthCondition } = req.query;
        
        console.log(`Getting recommendations for health condition: ${healthCondition || 'Healthy'}`);
        
        // If no mongoose or model is available, return dummy data
        if (!mongoose || !mongoose.connection.readyState) {
            console.log('Database not connected, returning fallback recommendations');
            return res.status(200).json({
                success: true,
                data: getFallbackRecommendations(healthCondition)
            });
        }
        
        try {
            // Try to dynamically require the MenuItem model
            const MenuItemModel = mongoose.models.MenuItem || require('../models/menuItem');
            
            // Check if model actually exists and has find method
            if (!MenuItemModel || typeof MenuItemModel.find !== 'function') {
                console.log('MenuItem model not available, returning fallback recommendations');
                return res.status(200).json({
                    success: true,
                    data: getFallbackRecommendations(healthCondition)
                });
            }
            
            // Query database for recommendations based on health condition
            const items = await MenuItemModel.find({
                $or: [
                    { 'healthTags': healthCondition || 'Healthy' },
                    { 'nutritionalInfo.calories': { $lt: 500 } }
                ]
            })
            .sort({ 'nutritionalInfo.calories': 1 })
            .limit(5);
            
            // If no recommendations found, return fallback
            if (!items || items.length === 0) {
                return res.status(200).json({
                    success: true,
                    data: getFallbackRecommendations(healthCondition)
                });
            }
            
            // Format the response
            const formattedItems = items.map(item => ({
                id: item._id,
                name: item.item_name,
                description: item.description,
                calories: item.nutritionalInfo?.calories || 'N/A',
                protein: item.nutritionalInfo?.protein || 'N/A',
                healthBenefits: getHealthBenefits(healthCondition)
            }));
            
            return res.status(200).json({
                success: true,
                data: formattedItems
            });
        } catch (modelError) {
            console.error('Model access error:', modelError);
            return res.status(200).json({
                success: true,
                data: getFallbackRecommendations(healthCondition)
            });
        }
    } catch (error) {
        console.error('Error fetching health recommendations:', error);
        return res.status(200).json({
            success: true,
            data: getFallbackRecommendations(healthCondition)
        });
    }
};

/**
 * Helper function to generate an appropriate health tag based on the menu item and health condition
 */
function getHealthTag(menuItem, healthCondition) {
    const { healthAttributes } = menuItem;
    
    switch(healthCondition) {
        case 'Diabetes':
            if (menuItem.sugar < 5) return 'No Added Sugar';
            if (healthAttributes.isLowGlycemicIndex) return 'Low Glycemic Index';
            return 'Diabetic Friendly';
            
        case 'Heart Condition':
            if (menuItem.sodium < 300) return 'Low Sodium';
            if (menuItem.fat < 10) return 'Low Fat';
            return 'Heart Healthy';
            
        case 'Hypertension':
            if (menuItem.sodium < 200) return 'Very Low Sodium';
            if (menuItem.sodium < 400) return 'Low Sodium';
            return 'BP Friendly';
            
        case 'Other':
            if (healthAttributes.isHighProtein) return 'High Protein';
            if (healthAttributes.isLowCarb) return 'Low Carb';
            return 'Customized Nutrition';
            
        default: // Healthy
            if (healthAttributes.isHighProtein) return 'High Protein';
            if (menuItem.fiber > 5) return 'High Fiber';
            return 'Well-Balanced';
    }
}

// Helper function to get fallback recommendations
function getFallbackRecommendations(healthCondition) {
    const condition = healthCondition || 'Healthy';
    
    const fallbackData = {
        'Healthy': [
            {
                id: 'healthy-1',
                name: 'Green Salad Bowl',
                description: 'Fresh mixed greens with seasonal vegetables',
                calories: 250,
                protein: 10,
                healthBenefits: ['Rich in vitamins', 'High fiber', 'Low calories']
            },
            {
                id: 'healthy-2',
                name: 'Grilled Chicken',
                description: 'Lean protein with herbs and spices',
                calories: 320,
                protein: 30,
                healthBenefits: ['High protein', 'Low fat', 'No added sugar']
            }
        ],
        'Diabetic': [
            {
                id: 'diabetic-1',
                name: 'Low-Carb Veggie Wrap',
                description: 'Vegetables and protein in a low-carb wrap',
                calories: 280,
                protein: 18,
                healthBenefits: ['Low glycemic index', 'High fiber', 'Balanced nutrition']
            },
            {
                id: 'diabetic-2',
                name: 'Quinoa Bowl',
                description: 'Nutritious quinoa with vegetables',
                calories: 310,
                protein: 12,
                healthBenefits: ['Complex carbs', 'Steady energy release', 'Rich in minerals']
            }
        ],
        'Heart-Healthy': [
            {
                id: 'heart-1',
                name: 'Omega-3 Rich Salmon',
                description: 'Grilled salmon with olive oil',
                calories: 350,
                protein: 25,
                healthBenefits: ['Omega-3 fatty acids', 'Heart-healthy fats', 'Anti-inflammatory']
            },
            {
                id: 'heart-2',
                name: 'Oatmeal with Berries',
                description: 'Whole grain oats with antioxidant-rich berries',
                calories: 290,
                protein: 8,
                healthBenefits: ['Lowers cholesterol', 'High in fiber', 'Antioxidants']
            }
        ]
    };
    
    // Return recommendations for specific condition or default to Healthy
    return fallbackData[condition] || fallbackData['Healthy'];
}

// Helper function to get health benefits
function getHealthBenefits(healthCondition) {
    const benefits = {
        'Healthy': ['Balanced nutrition', 'Supports overall health', 'Natural ingredients'],
        'Diabetic': ['Low glycemic index', 'Blood sugar friendly', 'Controlled carbohydrates'],
        'Heart-Healthy': ['Low sodium', 'Healthy fats', 'Supports cardiovascular health'],
        'High-Protein': ['Muscle recovery', 'Satiety', 'Lean protein source'],
        'Low-Calorie': ['Weight management', 'Portion controlled', 'Nutrient dense'],
        'Gluten-Free': ['No wheat products', 'Easily digestible', 'Alternative grains']
    };
    
    return benefits[healthCondition] || benefits['Healthy'];
} 
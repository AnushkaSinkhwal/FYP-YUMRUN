const { MenuItem } = require('../models/menuItem');

/**
 * Get health-focused meal recommendations based on user's health condition
 * @route GET /api/recommendations
 * @access Public
 */
exports.getHealthRecommendations = async (req, res) => {
    try {
        const { healthCondition } = req.query;
        
        if (!healthCondition) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Health condition is required',
                    code: 'VALIDATION_ERROR'
                }
            });
        }

        // Construct query based on health condition
        let query = { isAvailable: true };
        
        switch(healthCondition) {
            case 'Diabetes':
                query['healthAttributes.isDiabeticFriendly'] = true;
                // Low sugar is important for diabetics
                query.sugar = { $lt: 10 };
                break;
                
            case 'Heart Condition':
                query['healthAttributes.isHeartHealthy'] = true;
                // Low sodium and fat are important for heart health
                query.sodium = { $lt: 500 };
                query.fat = { $lt: 15 };
                break;
                
            case 'Hypertension':
                query['healthAttributes.isLowSodium'] = true;
                // Low sodium is critical for hypertension
                query.sodium = { $lt: 300 };
                break;
                
            case 'Other':
                // For 'Other', provide a mix of healthy options
                query.$or = [
                    { 'healthAttributes.isHeartHealthy': true },
                    { 'healthAttributes.isDiabeticFriendly': true },
                    { 'healthAttributes.isLowSodium': true },
                    { 'healthAttributes.isHighProtein': true }
                ];
                break;
                
            default: // Healthy
                // For healthy users, focus on balanced nutrition
                query['healthAttributes.isHighProtein'] = true;
                query.calories = { $lt: 800 }; // Moderate calorie count
                break;
        }

        // Find menu items that match the health requirements
        const menuItems = await MenuItem.find(query)
            .populate('restaurant', 'restaurantDetails.name restaurantDetails.address')
            .limit(10)
            .sort({ dateCreated: -1 });

        // Transform data for frontend
        const recommendations = menuItems.map(item => ({
            id: item._id,
            name: item.item_name,
            restaurant: item.restaurant?.restaurantDetails?.name || 'Restaurant',
            location: item.restaurant?.restaurantDetails?.address?.split(',')[0] || 'Location',
            price: item.item_price.toString(),
            rating: (4 + Math.random()).toFixed(1), // Random rating between 4.0-5.0 for demo
            image: item.image || `/uploads/placeholders/food-placeholder.jpg`,
            healthTag: getHealthTag(item, healthCondition),
            nutritionalInfo: {
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs,
                fat: item.fat,
                sodium: item.sodium,
                sugar: item.sugar,
                fiber: item.fiber
            }
        }));

        return res.status(200).json({
            success: true,
            data: {
                recommendations,
                healthCondition
            }
        });
    } catch (error) {
        console.error('Error fetching health recommendations:', error);
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
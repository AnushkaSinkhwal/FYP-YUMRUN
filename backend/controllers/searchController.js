const { MenuItem } = require('../models/menuItem');
const mongoose = require('mongoose');

// Advanced search for menu items with filtering capabilities
exports.searchMenuItems = async (req, res) => {
    try {
        const {
            query,
            category,
            minPrice,
            maxPrice,
            dietaryPreferences,
            healthConditions,
            allergens,
            minCalories,
            maxCalories,
            maxCarbs,
            minProtein,
            restaurant,
            sortBy
        } = req.query;

        // Build filter object based on provided parameters
        const filter = {};

        // Text search
        if (query) {
            filter.$or = [
                { item_name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ];
        }

        // Category filter
        if (category) {
            filter.category = category;
        }

        // Price range filter
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.item_price = {};
            if (minPrice !== undefined) filter.item_price.$gte = Number(minPrice);
            if (maxPrice !== undefined) filter.item_price.$lte = Number(maxPrice);
        }

        // Dietary preferences filters
        if (dietaryPreferences) {
            const preferences = Array.isArray(dietaryPreferences) 
                ? dietaryPreferences 
                : [dietaryPreferences];
            
            const dietaryFilters = [];
            
            preferences.forEach(pref => {
                switch (pref.toLowerCase()) {
                    case 'vegetarian':
                        dietaryFilters.push({ isVegetarian: true });
                        break;
                    case 'vegan':
                        dietaryFilters.push({ isVegan: true });
                        break;
                    case 'gluten-free':
                        dietaryFilters.push({ isGlutenFree: true });
                        break;
                }
            });
            
            if (dietaryFilters.length > 0) {
                filter.$and = filter.$and || [];
                filter.$and.push({ $or: dietaryFilters });
            }
        }

        // Health conditions filters
        if (healthConditions) {
            const conditions = Array.isArray(healthConditions) 
                ? healthConditions 
                : [healthConditions];
            
            const healthFilters = [];
            
            conditions.forEach(condition => {
                switch (condition.toLowerCase()) {
                    case 'diabetes':
                        healthFilters.push({ 'healthAttributes.isDiabeticFriendly': true });
                        break;
                    case 'heart disease':
                    case 'heart':
                        healthFilters.push({ 'healthAttributes.isHeartHealthy': true });
                        break;
                    case 'hypertension':
                    case 'high blood pressure':
                        healthFilters.push({ 'healthAttributes.isLowSodium': true });
                        break;
                    case 'low carb':
                        healthFilters.push({ 'healthAttributes.isLowCarb': true });
                        break;
                    case 'high protein':
                        healthFilters.push({ 'healthAttributes.isHighProtein': true });
                        break;
                }
            });
            
            if (healthFilters.length > 0) {
                filter.$and = filter.$and || [];
                filter.$and.push({ $or: healthFilters });
            }
        }

        // Allergen exclusion filter
        if (allergens) {
            const allergensArray = Array.isArray(allergens) ? allergens : [allergens];
            filter.allergens = { $nin: allergensArray };
        }

        // Calories range filter
        if (minCalories !== undefined || maxCalories !== undefined) {
            filter.calories = {};
            if (minCalories !== undefined) filter.calories.$gte = Number(minCalories);
            if (maxCalories !== undefined) filter.calories.$lte = Number(maxCalories);
        }

        // Carbs maximum filter
        if (maxCarbs !== undefined) {
            filter.carbs = { $lte: Number(maxCarbs) };
        }

        // Protein minimum filter
        if (minProtein !== undefined) {
            filter.protein = { $gte: Number(minProtein) };
        }

        // Restaurant filter
        if (restaurant) {
            filter.restaurant = mongoose.Types.ObjectId.isValid(restaurant) 
                ? mongoose.Types.ObjectId(restaurant) 
                : restaurant;
        }

        // Default sorting
        let sort = { item_name: 1 };
        
        // Custom sorting
        if (sortBy) {
            switch (sortBy) {
                case 'price_asc':
                    sort = { item_price: 1 };
                    break;
                case 'price_desc':
                    sort = { item_price: -1 };
                    break;
                case 'rating_desc':
                    sort = { averageRating: -1 };
                    break;
                case 'calories_asc':
                    sort = { calories: 1 };
                    break;
                case 'calories_desc':
                    sort = { calories: -1 };
                    break;
                case 'protein_desc':
                    sort = { protein: -1 };
                    break;
            }
        }

        // Get results
        const results = await MenuItem.find(filter)
            .sort(sort)
            .populate('restaurant', 'fullName restaurantDetails.name restaurantDetails.logo')
            .limit(100); // Limit to 100 results maximum

        return res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error('Error searching menu items:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while searching menu items',
            error: error.message
        });
    }
};

// Search for menu items based on user's health profile
exports.personalizedMenuItems = async (req, res) => {
    try {
        // Get user from auth middleware
        const user = req.user;
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Default filter
        const filter = { isAvailable: true };
        
        // Build filters based on user's health profile
        if (user.healthProfile) {
            // Dietary preferences filter
            if (user.healthProfile.dietaryPreferences && user.healthProfile.dietaryPreferences.length > 0) {
                // Skip if only 'None' is selected
                if (!(user.healthProfile.dietaryPreferences.length === 1 && user.healthProfile.dietaryPreferences[0] === 'None')) {
                    const dietaryFilters = [];
                    
                    user.healthProfile.dietaryPreferences.forEach(pref => {
                        switch (pref) {
                            case 'Vegetarian':
                                dietaryFilters.push({ isVegetarian: true });
                                break;
                            case 'Vegan':
                                dietaryFilters.push({ isVegan: true });
                                break;
                            case 'Gluten Free':
                                dietaryFilters.push({ isGlutenFree: true });
                                break;
                        }
                    });
                    
                    if (dietaryFilters.length > 0) {
                        filter.$and = filter.$and || [];
                        filter.$and.push({ $or: dietaryFilters });
                    }
                }
            }
            
            // Health conditions filter
            if (user.healthProfile.healthConditions && user.healthProfile.healthConditions.length > 0) {
                // Skip if only 'None' is selected
                if (!(user.healthProfile.healthConditions.length === 1 && user.healthProfile.healthConditions[0] === 'None')) {
                    const healthFilters = [];
                    
                    user.healthProfile.healthConditions.forEach(condition => {
                        switch (condition) {
                            case 'Diabetes':
                                healthFilters.push({ 'healthAttributes.isDiabeticFriendly': true });
                                break;
                            case 'Heart Disease':
                                healthFilters.push({ 'healthAttributes.isHeartHealthy': true });
                                break;
                            case 'Hypertension':
                                healthFilters.push({ 'healthAttributes.isLowSodium': true });
                                break;
                            case 'High Cholesterol':
                                healthFilters.push({ 
                                    $or: [
                                        { 'healthAttributes.isHeartHealthy': true },
                                        { fat: { $lt: 15 } }
                                    ]
                                });
                                break;
                            case 'Obesity':
                                healthFilters.push({ 
                                    $or: [
                                        { 'healthAttributes.isLowCarb': true },
                                        { calories: { $lt: 500 } }
                                    ]
                                });
                                break;
                        }
                    });
                    
                    if (healthFilters.length > 0) {
                        filter.$and = filter.$and || [];
                        filter.$and.push({ $or: healthFilters });
                    }
                }
            }
            
            // Calorie and macro filters based on user goals
            if (user.healthProfile.weightManagementGoal && user.healthProfile.weightManagementGoal !== 'None') {
                switch (user.healthProfile.weightManagementGoal) {
                    case 'Lose':
                        filter.calories = { $lt: 600 }; // Lower calorie meals
                        break;
                    case 'Gain':
                        filter.$or = [
                            { 'healthAttributes.isHighProtein': true },
                            { protein: { $gt: 20 } }
                        ];
                        break;
                }
            }
            
            // Exclude allergens
            if (user.healthProfile.allergies && user.healthProfile.allergies.length > 0) {
                filter.allergens = { $nin: user.healthProfile.allergies };
            }
        }
        
        // Get results
        const results = await MenuItem.find(filter)
            .sort({ averageRating: -1 })
            .populate('restaurant', 'fullName restaurantDetails.name restaurantDetails.logo')
            .limit(50);

        return res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error('Error finding personalized menu items:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while finding personalized menu items',
            error: error.message
        });
    }
}; 
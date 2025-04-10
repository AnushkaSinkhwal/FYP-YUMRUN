const { MenuItem } = require('../models/menuItem');
const mongoose = require('mongoose');

// Get nutritional info for a food item
exports.getFoodNutrition = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid food item ID format'
            });
        }

        const menuItem = await MenuItem.findById(id);
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found'
            });
        }

        // Extract nutritional information
        const nutritionalInfo = {
            calories: menuItem.calories || 0,
            protein: menuItem.protein || 0,
            carbs: menuItem.carbs || 0,
            fat: menuItem.fat || 0,
            sodium: menuItem.sodium || 0,
            sugar: menuItem.sugar || 0,
            fiber: menuItem.fiber || 0,
            healthAttributes: menuItem.healthAttributes || {},
            allergens: menuItem.allergens || [],
            isVegetarian: menuItem.isVegetarian || false,
            isVegan: menuItem.isVegan || false,
            isGlutenFree: menuItem.isGlutenFree || false
        };

        return res.status(200).json({
            success: true,
            nutritionalInfo,
            itemName: menuItem.item_name,
            itemId: menuItem._id
        });
    } catch (error) {
        console.error('Error fetching food nutrition:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching nutritional information',
            error: error.message
        });
    }
};

// Analyze nutritional value of a custom meal based on ingredients
exports.analyzeIngredients = async (req, res) => {
    try {
        const { ingredients, removedIngredients } = req.body;

        if (!ingredients || !Array.isArray(ingredients)) {
            return res.status(400).json({
                success: false,
                message: 'Ingredients array is required'
            });
        }

        // Initialize nutrition values
        const nutritionTotals = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            sodium: 0,
            sugar: 0,
            fiber: 0
        };

        // Calculate nutrition values from ingredients
        for (const ingredient of ingredients) {
            nutritionTotals.calories += ingredient.calories || 0;
            nutritionTotals.protein += ingredient.protein || 0;
            nutritionTotals.carbs += ingredient.carbs || 0;
            nutritionTotals.fat += ingredient.fat || 0;
            nutritionTotals.sodium += ingredient.sodium || 0;
            nutritionTotals.sugar += ingredient.sugar || 0;
            nutritionTotals.fiber += ingredient.fiber || 0;
        }

        // Subtract nutrition values for removed ingredients
        if (removedIngredients && Array.isArray(removedIngredients)) {
            for (const ingredient of removedIngredients) {
                nutritionTotals.calories -= ingredient.calories || 0;
                nutritionTotals.protein -= ingredient.protein || 0;
                nutritionTotals.carbs -= ingredient.carbs || 0;
                nutritionTotals.fat -= ingredient.fat || 0;
                nutritionTotals.sodium -= ingredient.sodium || 0;
                nutritionTotals.sugar -= ingredient.sugar || 0;
                nutritionTotals.fiber -= ingredient.fiber || 0;
            }
        }

        // Ensure no negative values
        Object.keys(nutritionTotals).forEach(key => {
            nutritionTotals[key] = Math.max(0, nutritionTotals[key]);
        });

        return res.status(200).json({
            success: true,
            nutritionalInfo: nutritionTotals
        });
    } catch (error) {
        console.error('Error analyzing ingredients:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while analyzing ingredients',
            error: error.message
        });
    }
};

// Get nutritional info for a meal (combination of menu items)
exports.getMealNutrition = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid meal ID format'
            });
        }

        // Assuming a meal consists of multiple menu items
        // You would need to fetch the order or meal object here
        // For now, we'll just return a placeholder response
        return res.status(200).json({
            success: true,
            message: 'Meal nutrition endpoint - Implementation needed',
            mealId: id
        });
    } catch (error) {
        console.error('Error fetching meal nutrition:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching meal nutrition',
            error: error.message
        });
    }
};

// Calculate nutrition for a custom meal based on menu items and customizations
exports.calculateCustomMealNutrition = async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Array of menu items is required'
            });
        }

        // Initialize nutrition totals
        const nutritionTotals = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            sodium: 0,
            sugar: 0,
            fiber: 0
        };

        // Process each menu item
        for (const item of items) {
            const { itemId, quantity, customizations } = item;

            if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
                continue; // Skip invalid items
            }

            // Fetch menu item details
            const menuItem = await MenuItem.findById(itemId);
            if (!menuItem) continue;

            // Base nutritional values multiplied by quantity
            let itemCalories = (menuItem.calories || 0) * (quantity || 1);
            let itemProtein = (menuItem.protein || 0) * (quantity || 1);
            let itemCarbs = (menuItem.carbs || 0) * (quantity || 1);
            let itemFat = (menuItem.fat || 0) * (quantity || 1);
            let itemSodium = (menuItem.sodium || 0) * (quantity || 1);
            let itemSugar = (menuItem.sugar || 0) * (quantity || 1);
            let itemFiber = (menuItem.fiber || 0) * (quantity || 1);

            // Apply customizations if available
            if (customizations) {
                // Handle removed ingredients
                if (customizations.removedIngredients && Array.isArray(customizations.removedIngredients)) {
                    for (const ingredientName of customizations.removedIngredients) {
                        const ingredient = menuItem.ingredients.find(ing => ing.name === ingredientName);
                        if (ingredient) {
                            itemCalories -= (ingredient.calories || 0) * (quantity || 1);
                            itemProtein -= (ingredient.protein || 0) * (quantity || 1);
                            itemCarbs -= (ingredient.carbs || 0) * (quantity || 1);
                            itemFat -= (ingredient.fat || 0) * (quantity || 1);
                            itemSodium -= (ingredient.sodium || 0) * (quantity || 1);
                            // Assume sugar and fiber not tracked at ingredient level
                        }
                    }
                }

                // Handle added ingredients/add-ons
                if (customizations.addedIngredients && Array.isArray(customizations.addedIngredients)) {
                    for (const addedIngredient of customizations.addedIngredients) {
                        if (addedIngredient.nutritionalInfo) {
                            itemCalories += (addedIngredient.nutritionalInfo.calories || 0) * (quantity || 1);
                            itemProtein += (addedIngredient.nutritionalInfo.protein || 0) * (quantity || 1);
                            itemCarbs += (addedIngredient.nutritionalInfo.carbs || 0) * (quantity || 1);
                            itemFat += (addedIngredient.nutritionalInfo.fat || 0) * (quantity || 1);
                            itemSodium += (addedIngredient.nutritionalInfo.sodium || 0) * (quantity || 1);
                            // Assume sugar and fiber not tracked at ingredient level
                        }
                    }
                }

                // Handle serving size adjustments
                if (customizations.servingSize) {
                    let sizeFactor = 1; // Default for 'Regular'
                    
                    switch (customizations.servingSize.toLowerCase()) {
                        case 'small':
                            sizeFactor = 0.7;
                            break;
                        case 'large':
                            sizeFactor = 1.3;
                            break;
                        case 'extra large':
                            sizeFactor = 1.5;
                            break;
                        // Default is 'regular' with factor 1
                    }

                    // Apply size factor to all nutritional values
                    itemCalories *= sizeFactor;
                    itemProtein *= sizeFactor;
                    itemCarbs *= sizeFactor;
                    itemFat *= sizeFactor;
                    itemSodium *= sizeFactor;
                    itemSugar *= sizeFactor;
                    itemFiber *= sizeFactor;
                }
            }

            // Ensure no negative values
            itemCalories = Math.max(0, itemCalories);
            itemProtein = Math.max(0, itemProtein);
            itemCarbs = Math.max(0, itemCarbs);
            itemFat = Math.max(0, itemFat);
            itemSodium = Math.max(0, itemSodium);
            itemSugar = Math.max(0, itemSugar);
            itemFiber = Math.max(0, itemFiber);

            // Add to totals
            nutritionTotals.calories += itemCalories;
            nutritionTotals.protein += itemProtein;
            nutritionTotals.carbs += itemCarbs;
            nutritionTotals.fat += itemFat;
            nutritionTotals.sodium += itemSodium;
            nutritionTotals.sugar += itemSugar;
            nutritionTotals.fiber += itemFiber;
        }

        return res.status(200).json({
            success: true,
            nutritionalInfo: nutritionTotals
        });
    } catch (error) {
        console.error('Error calculating custom meal nutrition:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while calculating custom meal nutrition',
            error: error.message
        });
    }
}; 
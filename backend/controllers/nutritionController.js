const { MenuItem } = require('../models/menuItem');
const mongoose = require('mongoose');
const { Order } = require('../models/order');
const { User } = require('../models/user');

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

// Get user's daily nutritional summary based on orders
exports.getUserDailyNutrition = async (req, res) => {
  try {
    const userId = req.user._id;
    const { date } = req.query;
    
    // Default to today if no date provided
    const targetDate = date ? new Date(date) : new Date();
    
    // Set time to start of day
    targetDate.setHours(0, 0, 0, 0);
    
    // Set time to end of day for query
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);
    
    // Find orders for this user on the target date
    const orders = await Order.find({
      userId,
      createdAt: { $gte: targetDate, $lte: endDate },
      status: { $nin: ['CANCELLED'] }
    });
    
    // Initialize nutrition totals
    const nutritionTotals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      sodium: 0,
      fiber: 0,
      sugar: 0,
      meals: []
    };
    
    // Calculate total nutrition from all orders
    orders.forEach(order => {
      if (order.totalNutritionalInfo) {
        nutritionTotals.calories += order.totalNutritionalInfo.calories || 0;
        nutritionTotals.protein += order.totalNutritionalInfo.protein || 0;
        nutritionTotals.carbs += order.totalNutritionalInfo.carbs || 0;
        nutritionTotals.fat += order.totalNutritionalInfo.fat || 0;
        nutritionTotals.sodium += order.totalNutritionalInfo.sodium || 0;
        nutritionTotals.fiber += order.totalNutritionalInfo.fiber || 0;
        nutritionTotals.sugar += order.totalNutritionalInfo.sugar || 0;
      }
      
      // Add meal info
      nutritionTotals.meals.push({
        orderId: order._id,
        orderNumber: order.orderNumber,
        time: order.createdAt,
        nutritionalInfo: order.totalNutritionalInfo
      });
    });
    
    // Get user's health profile for calculating percentages of daily goals
    const user = await User.findById(userId);
    let dailyGoals = null;
    
    if (user && user.healthProfile && user.healthProfile.dailyCalorieGoal) {
      const { dailyCalorieGoal, macroTargets } = user.healthProfile;
      
      dailyGoals = {
        calories: dailyCalorieGoal,
        protein: (dailyCalorieGoal * (macroTargets.protein / 100)) / 4, // Protein has 4 calories per gram
        carbs: (dailyCalorieGoal * (macroTargets.carbs / 100)) / 4, // Carbs have 4 calories per gram
        fat: (dailyCalorieGoal * (macroTargets.fat / 100)) / 9, // Fat has 9 calories per gram
        sodium: 2300, // Default recommendation in mg
        fiber: 28, // Default recommendation in grams
        sugar: 50 // Default recommendation in grams
      };
    }
    
    return res.status(200).json({
      success: true,
      data: {
        date: targetDate,
        nutritionTotals,
        dailyGoals,
        percentageOfGoals: dailyGoals ? {
          calories: Math.round((nutritionTotals.calories / dailyGoals.calories) * 100),
          protein: Math.round((nutritionTotals.protein / dailyGoals.protein) * 100),
          carbs: Math.round((nutritionTotals.carbs / dailyGoals.carbs) * 100),
          fat: Math.round((nutritionTotals.fat / dailyGoals.fat) * 100),
          sodium: Math.round((nutritionTotals.sodium / dailyGoals.sodium) * 100),
          fiber: Math.round((nutritionTotals.fiber / dailyGoals.fiber) * 100),
          sugar: Math.round((nutritionTotals.sugar / dailyGoals.sugar) * 100)
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching user daily nutrition:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching daily nutrition data',
      error: error.message
    });
  }
};

// Get user's weekly nutritional summary
exports.getUserWeeklyNutrition = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate } = req.query;
    
    // Default to start of current week if no date provided
    const now = new Date();
    let targetStartDate;
    
    if (startDate) {
      targetStartDate = new Date(startDate);
    } else {
      // Get start of current week (Sunday)
      targetStartDate = new Date(now);
      targetStartDate.setDate(now.getDate() - now.getDay());
    }
    
    // Set time to start of day
    targetStartDate.setHours(0, 0, 0, 0);
    
    // Calculate end date (7 days from start date)
    const targetEndDate = new Date(targetStartDate);
    targetEndDate.setDate(targetStartDate.getDate() + 7);
    targetEndDate.setHours(23, 59, 59, 999);
    
    // Find orders for this user within the date range
    const orders = await Order.find({
      userId,
      createdAt: { $gte: targetStartDate, $lte: targetEndDate },
      status: { $nin: ['CANCELLED'] }
    }).sort({ createdAt: 1 });
    
    // Prepare daily data for each day in the week
    const dailyData = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(targetStartDate);
      day.setDate(targetStartDate.getDate() + i);
      
      // Start and end of this day
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Filter orders for this day
      const dayOrders = orders.filter(order => 
        order.createdAt >= dayStart && order.createdAt <= dayEnd
      );
      
      // Calculate nutrition totals for this day
      const dayNutrition = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        sodium: 0,
        fiber: 0,
        sugar: 0
      };
      
      dayOrders.forEach(order => {
        if (order.totalNutritionalInfo) {
          dayNutrition.calories += order.totalNutritionalInfo.calories || 0;
          dayNutrition.protein += order.totalNutritionalInfo.protein || 0;
          dayNutrition.carbs += order.totalNutritionalInfo.carbs || 0;
          dayNutrition.fat += order.totalNutritionalInfo.fat || 0;
          dayNutrition.sodium += order.totalNutritionalInfo.sodium || 0;
          dayNutrition.fiber += order.totalNutritionalInfo.fiber || 0;
          dayNutrition.sugar += order.totalNutritionalInfo.sugar || 0;
        }
      });
      
      dailyData.push({
        date: day,
        orderCount: dayOrders.length,
        nutrition: dayNutrition
      });
    }
    
    // Calculate week totals
    const weekTotals = dailyData.reduce((totals, day) => {
      totals.calories += day.nutrition.calories;
      totals.protein += day.nutrition.protein;
      totals.carbs += day.nutrition.carbs;
      totals.fat += day.nutrition.fat;
      totals.sodium += day.nutrition.sodium;
      totals.fiber += day.nutrition.fiber;
      totals.sugar += day.nutrition.sugar;
      return totals;
    }, {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      sodium: 0,
      fiber: 0,
      sugar: 0
    });
    
    // Calculate daily averages
    const dailyAverage = {
      calories: Math.round(weekTotals.calories / 7),
      protein: Math.round(weekTotals.protein / 7),
      carbs: Math.round(weekTotals.carbs / 7),
      fat: Math.round(weekTotals.fat / 7),
      sodium: Math.round(weekTotals.sodium / 7),
      fiber: Math.round(weekTotals.fiber / 7),
      sugar: Math.round(weekTotals.sugar / 7)
    };
    
    return res.status(200).json({
      success: true,
      data: {
        startDate: targetStartDate,
        endDate: targetEndDate,
        dailyData,
        weekTotals,
        dailyAverage
      }
    });
  } catch (error) {
    console.error('Error fetching user weekly nutrition:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching weekly nutrition data',
      error: error.message
    });
  }
}; 
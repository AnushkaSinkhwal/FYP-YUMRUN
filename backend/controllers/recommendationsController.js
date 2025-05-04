const MenuItem = require("../models/menuItem");
const User = require("../models/user");
const mongoose = require("mongoose");

/**
 * Get health-focused meal recommendations based on user's health condition
 * @route GET /api/recommendations
 * @access Public
 */
exports.getHealthRecommendations = async (req, res) => {
  try {
    const { healthCondition, userId } = req.query;

    console.log(
      `Getting recommendations for health condition: ${
        healthCondition || "Healthy"
      } for user: ${userId || "Anonymous"}`
    );

    // Get user's health profile if userId is provided
    let userHealthProfile = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId);
      if (user && user.healthProfile) {
        userHealthProfile = user.healthProfile;
      }
    }

    // If no mongoose or model is available, return dummy data
    if (!mongoose || !mongoose.connection.readyState) {
      console.log("Database not connected, returning fallback recommendations");
      return res.status(200).json({
        success: true,
        data: getFallbackRecommendations(healthCondition, userHealthProfile),
      });
    }

    try {
      // Build query based on health conditions and user preferences
      let query = {};

      if (userHealthProfile) {
        // Filter based on dietary preferences
        if (
          userHealthProfile.dietaryPreferences &&
          userHealthProfile.dietaryPreferences.length > 0 &&
          !userHealthProfile.dietaryPreferences.includes("None")
        ) {
          const dietaryFilters = [];

          if (userHealthProfile.dietaryPreferences.includes("Vegetarian")) {
            dietaryFilters.push({ isVegetarian: true });
          }

          if (userHealthProfile.dietaryPreferences.includes("Vegan")) {
            dietaryFilters.push({ isVegan: true });
          }

          if (userHealthProfile.dietaryPreferences.includes("Gluten Free")) {
            dietaryFilters.push({ isGlutenFree: true });
          }

          if (dietaryFilters.length > 0) {
            query.$or = dietaryFilters;
          }
        }

        // Filter based on health conditions
        if (
          userHealthProfile.healthConditions &&
          userHealthProfile.healthConditions.length > 0 &&
          !userHealthProfile.healthConditions.includes("None")
        ) {
          const healthFilters = [];

          if (userHealthProfile.healthConditions.includes("Diabetes")) {
            healthFilters.push({ "healthAttributes.isLowGlycemicIndex": true });
            healthFilters.push({ "healthAttributes.isDiabeticFriendly": true });
          }

          if (
            userHealthProfile.healthConditions.includes("Heart Disease") ||
            userHealthProfile.healthConditions.includes("Hypertension")
          ) {
            healthFilters.push({ "healthAttributes.isLowSodium": true });
            healthFilters.push({ "healthAttributes.isHeartHealthy": true });
          }

          if (userHealthProfile.healthConditions.includes("Obesity")) {
            healthFilters.push({ calories: { $lt: 500 } });
          }

          // If healthFilters exist, add to query
          if (healthFilters.length > 0) {
            query.$or = query.$or
              ? [...query.$or, ...healthFilters]
              : healthFilters;
          }
        }

        // Handle allergies
        if (
          userHealthProfile.allergies &&
          userHealthProfile.allergies.length > 0
        ) {
          query.allergens = { $nin: userHealthProfile.allergies };
        }

        // Handle weight management goal
        if (userHealthProfile.weightManagementGoal) {
          switch (userHealthProfile.weightManagementGoal) {
            case "Lose":
              query.calories = { $lt: 500 };
              break;
            case "Gain":
              query.protein = { $gt: 20 };
              break;
          }
        }
      } else if (healthCondition) {
        // If no user profile but health condition is specified
        switch (healthCondition.toLowerCase()) {
          case "diabetes":
            query["healthAttributes.isDiabeticFriendly"] = true;
            break;
          case "heart disease":
          case "hypertension":
            query["healthAttributes.isHeartHealthy"] = true;
            break;
          case "low carb":
            query["healthAttributes.isLowCarb"] = true;
            break;
          case "high protein":
            query["healthAttributes.isHighProtein"] = true;
            break;
        }
      }

      // Use appropriate sorting based on health goals
      let sort = {};
      if (userHealthProfile && userHealthProfile.weightManagementGoal) {
        switch (userHealthProfile.weightManagementGoal) {
          case "Lose":
            sort = { calories: 1, protein: -1 }; // Low calories, high protein
            break;
          case "Gain":
            sort = { protein: -1, calories: -1 }; // High protein, high calories
            break;
          default:
            sort = { "healthAttributes.isHeartHealthy": -1, calories: 1 }; // Balanced
        }
      } else {
        sort = { averageRating: -1 }; // Default to highest rated
      }

      // Query database for recommendations
      const items = await MenuItem.find(query).sort(sort).limit(8);

      // If no recommendations found, return fallback
      if (!items || items.length === 0) {
        return res.status(200).json({
          success: true,
          data: getFallbackRecommendations(healthCondition, userHealthProfile),
        });
      }

      // Format the response
      const formattedItems = items.map((item) => ({
        id: item._id,
        name: item.item_name,
        description: item.description,
        price: item.item_price,
        image: item.image,
        calories: item.calories || "N/A",
        protein: item.protein || "N/A",
        carbs: item.carbs || "N/A",
        fat: item.fat || "N/A",
        restaurantId: item.restaurant,
        healthAttributes: item.healthAttributes || {},
        healthBenefits: getHealthBenefits(
          healthCondition,
          item.healthAttributes
        ),
        isCustomizable:
          item.customizationOptions?.allowAddIngredients ||
          item.customizationOptions?.allowRemoveIngredients,
      }));

      return res.status(200).json({
        success: true,
        data: {
          recommendations: formattedItems,
          userPreferences: userHealthProfile
            ? {
                dietaryPreferences: userHealthProfile.dietaryPreferences,
                healthConditions: userHealthProfile.healthConditions,
                allergies: userHealthProfile.allergies,
                weightManagementGoal: userHealthProfile.weightManagementGoal,
              }
            : null,
        },
      });
    } catch (modelError) {
      console.error("Model access error:", modelError);
      return res.status(200).json({
        success: true,
        data: getFallbackRecommendations(healthCondition, userHealthProfile),
      });
    }
  } catch (error) {
    console.error("Error fetching health recommendations:", error);
    return res.status(200).json({
      success: true,
      data: getFallbackRecommendations(healthCondition),
    });
  }
};

/**
 * Get personalized recommendations based on user's past orders and preferences
 * @route GET /api/recommendations/personalized/:userId
 * @access Private
 */
exports.getPersonalizedRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
      });
    }

    // Get user's health profile and past orders
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's past orders to analyze preferences
    const Order = mongoose.model("Order");
    const pastOrders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Extract items from past orders
    const pastOrderItems = new Set();
    const pastRestaurants = new Set();

    pastOrders.forEach((order) => {
      order.items.forEach((item) => {
        pastOrderItems.add(item.productId);
      });
      pastRestaurants.add(order.restaurantId.toString());
    });

    // Build query for recommendations
    let query = {};

    // Prefer items from restaurants the user has ordered from before
    if (pastRestaurants.size > 0) {
      query.restaurant = {
        $in: Array.from(pastRestaurants).map((id) =>
          mongoose.Types.ObjectId(id)
        ),
      };
    }

    // Exclude items the user has already ordered
    if (pastOrderItems.size > 0) {
      query._id = {
        $nin: Array.from(pastOrderItems).map((id) =>
          mongoose.Types.ObjectId(id)
        ),
      };
    }

    // Apply health profile filters if available
    if (user.healthProfile) {
      // Dietary preferences
      if (
        user.healthProfile.dietaryPreferences &&
        user.healthProfile.dietaryPreferences.length > 0 &&
        !user.healthProfile.dietaryPreferences.includes("None")
      ) {
        const dietaryFilters = [];

        if (user.healthProfile.dietaryPreferences.includes("Vegetarian")) {
          dietaryFilters.push({ isVegetarian: true });
        }

        if (user.healthProfile.dietaryPreferences.includes("Vegan")) {
          dietaryFilters.push({ isVegan: true });
        }

        if (dietaryFilters.length > 0) {
          query.$or = dietaryFilters;
        }
      }

      // Allergies
      if (
        user.healthProfile.allergies &&
        user.healthProfile.allergies.length > 0
      ) {
        query.allergens = { $nin: user.healthProfile.allergies };
      }
    }

    // Find recommended items
    const recommendedItems = await MenuItem.find(query)
      .sort({ averageRating: -1 })
      .limit(8);

    // Format the response
    const formattedItems = recommendedItems.map((item) => ({
      id: item._id,
      name: item.item_name,
      description: item.description,
      price: item.item_price,
      image: item.image,
      calories: item.calories || "N/A",
      protein: item.protein || "N/A",
      carbs: item.carbs || "N/A",
      fat: item.fat || "N/A",
      restaurantId: item.restaurant,
      healthAttributes: item.healthAttributes || {},
      isCustomizable:
        item.customizationOptions?.allowAddIngredients ||
        item.customizationOptions?.allowRemoveIngredients,
    }));

    return res.status(200).json({
      success: true,
      data: {
        recommendations: formattedItems,
        message:
          "Personalized recommendations based on your past orders and preferences",
      },
    });
  } catch (error) {
    console.error("Error getting personalized recommendations:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting personalized recommendations",
      error: error.message,
    });
  }
};

// Helper function to get fallback recommendations
function getFallbackRecommendations(healthCondition, userProfile = null) {
  let condition = healthCondition || "Healthy";

  // Use user profile if available
  if (
    userProfile &&
    userProfile.healthConditions &&
    userProfile.healthConditions.length > 0 &&
    !userProfile.healthConditions.includes("None")
  ) {
    condition = userProfile.healthConditions[0];
  }

  // If user has dietary preferences, filter the recommendations
  if (
    userProfile &&
    userProfile.dietaryPreferences &&
    userProfile.dietaryPreferences.length > 0 &&
    !userProfile.dietaryPreferences.includes("None")
  ) {
    // If vegetarian or vegan, ensure we return appropriate items
    if (
      userProfile.dietaryPreferences.includes("Vegetarian") ||
      userProfile.dietaryPreferences.includes("Vegan")
    ) {
      const vegItems = [
        {
          id: "veg-1",
          name: "Plant-Based Protein Bowl",
          description: "Complete plant proteins with fresh vegetables",
          calories: 340,
          protein: 18,
          carbs: 35,
          fat: 12,
          price: 380,
          image: "/uploads/placeholders/food-placeholder.jpg",
          healthBenefits: ["Plant protein", "Fiber rich", "Nutrient dense"],
          isCustomizable: true,
        },
        {
          id: "veg-2",
          name: "Mediterranean Hummus Wrap",
          description:
            "Chickpea hummus with fresh vegetables in a whole grain wrap",
          calories: 310,
          protein: 12,
          carbs: 40,
          fat: 10,
          price: 350,
          image: "/uploads/placeholders/food-placeholder.jpg",
          healthBenefits: ["Plant based", "Heart healthy", "Rich in fiber"],
          isCustomizable: true,
        },
      ];

      // Return customized recommendations for vegetarians/vegans
      return userProfile.dietaryPreferences.includes("Vegan")
        ? vegItems.map((item) => ({
            ...item,
            name: item.name.replace("Plant-Based", "Vegan"),
          }))
        : vegItems;
    }
  }

  // Return recommendations for specific condition or default to Healthy
  return false;
}

// Helper function to get health benefits based on health condition and menu item attributes
function getHealthBenefits(healthCondition, healthAttributes = {}) {
  // Default benefits
  const defaultBenefits = [
    "Balanced nutrition",
    "Fresh ingredients",
    "Quality proteins",
  ];

  // If no health condition or attributes, return defaults
  if (!healthCondition && !healthAttributes) {
    return defaultBenefits;
  }

  // Create benefits based on item's health attributes
  const attributeBenefits = [];

  if (healthAttributes) {
    if (healthAttributes.isDiabeticFriendly) {
      attributeBenefits.push("Diabetic friendly", "Blood sugar conscious");
    }

    if (healthAttributes.isLowSodium) {
      attributeBenefits.push("Low sodium", "Blood pressure friendly");
    }

    if (healthAttributes.isHeartHealthy) {
      attributeBenefits.push("Heart healthy", "Cardiovascular support");
    }

    if (healthAttributes.isLowGlycemicIndex) {
      attributeBenefits.push("Low glycemic index", "Steady energy release");
    }

    if (healthAttributes.isHighProtein) {
      attributeBenefits.push("High protein", "Muscle support");
    }

    if (healthAttributes.isLowCarb) {
      attributeBenefits.push("Low carb", "Keto-friendly");
    }
  }

  // If we have attribute-based benefits, return those
  if (attributeBenefits.length > 0) {
    return attributeBenefits.slice(0, 3); // Return up to 3 benefits
  }

  // Otherwise, return condition-specific benefits
  const conditionBenefits = {
    Healthy: [
      "Balanced nutrition",
      "Supports overall health",
      "Natural ingredients",
    ],
    Diabetic: [
      "Low glycemic index",
      "Blood sugar friendly",
      "Controlled carbohydrates",
    ],
    "Heart-Healthy": [
      "Low sodium",
      "Healthy fats",
      "Supports cardiovascular health",
    ],
    "High-Protein": ["Muscle recovery", "Satiety", "Lean protein source"],
    "Low-Calorie": [
      "Weight management",
      "Portion controlled",
      "Nutrient dense",
    ],
    "Gluten-Free": [
      "No wheat products",
      "Easily digestible",
      "Alternative grains",
    ],
  };

  return conditionBenefits[healthCondition] || defaultBenefits;
}

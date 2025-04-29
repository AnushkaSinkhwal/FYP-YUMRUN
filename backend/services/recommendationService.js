const User = require('../models/user');
const Order = require('../models/order');
const MenuItem = require('../models/menuItem');
const mongoose = require('mongoose');

/**
 * Generates food recommendations for a user based on health profile and order history.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array>} - A promise that resolves to an array of recommended menu items.
 */
const getRecommendationsForUser = async (userId) => {
  try {
    // 1. Fetch User Data (Health Profile, Favorites)
    const user = await User.findById(userId).select('healthProfile favorites').lean();
    if (!user) {
      console.log(`Recommendation Service: User not found for ID: ${userId}`);
      return [];
    }
    console.log(`Recommendation Service: Fetched user data for ${userId}`);
    const healthProfile = user.healthProfile || {};
    const favoriteItemIds = user.favorites || [];

    // 2. Fetch Recent Order History
    const recentOrders = await Order.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(20) // Limit to recent orders
      .select('items.productId') // Only select item IDs
      .lean();
      
    console.log(`Recommendation Service: Fetched ${recentOrders.length} recent orders for user ${userId}`);

    // 3. Fetch All Available Menu Items (Consider adding filters like isAvailable: true)
    // TODO: Potentially filter by restaurant availability based on user location if needed
    const allMenuItems = await MenuItem.find({ isAvailable: true })
       .populate('restaurant', 'name status') // Populate basic restaurant info
      .lean(); // Use lean for performance

    console.log(`Recommendation Service: Fetched ${allMenuItems.length} available menu items.`);

    if (!allMenuItems || allMenuItems.length === 0) {
        console.log("Recommendation Service: No menu items available to recommend.");
        return [];
    }

    // 4. Process Orders to get Item Frequencies
    const orderItemFrequency = {};
    recentOrders.forEach(order => {
      order.items.forEach(item => {
        // Ensure productId is treated as a string for comparison
        const productIdStr = item.productId?.toString();
        if (productIdStr) {
             orderItemFrequency[productIdStr] = (orderItemFrequency[productIdStr] || 0) + 1;
        }
      });
    });
     console.log(`Recommendation Service: Calculated item frequencies from past orders.`);


    // 5. Filter and Score Menu Items
    const scoredItems = allMenuItems
      .map(item => {
        let score = 0;
        const itemIdStr = item._id.toString();

        // --- Filtering ---
        
        // Filter by Allergens
        if (healthProfile.allergies && healthProfile.allergies.length > 0 && healthProfile.allergies[0] !== 'None') {
             const itemAllergens = item.allergens || [];
             const hasAllergy = healthProfile.allergies.some(allergy => itemAllergens.includes(allergy));
             if (hasAllergy) return null; // Exclude item
        }
        
        // Filter by Disliked Foods (assuming dislikedFoods contains item names or IDs)
        // This might require checking item_name or requires dislikedFoods to store IDs
        // For simplicity, let's assume it stores names and we check item.item_name
        if (healthProfile.dislikedFoods && healthProfile.dislikedFoods.length > 0) {
            const itemIsDisliked = healthProfile.dislikedFoods.some(disliked => 
                item.item_name.toLowerCase().includes(disliked.toLowerCase())
            );
            if (itemIsDisliked) return null; // Exclude item
        }


        // --- Scoring ---

        // Boost based on Dietary Preferences (e.g., Vegetarian, Vegan, Gluten-Free)
         if (healthProfile.dietaryPreferences && healthProfile.dietaryPreferences.length > 0 && healthProfile.dietaryPreferences[0] !== 'None') {
            healthProfile.dietaryPreferences.forEach(pref => {
                 if (pref === 'Vegetarian' && item.isVegetarian) score += 5;
                 if (pref === 'Vegan' && item.isVegan) score += 5;
                 if (pref === 'Gluten-Free' && item.isGlutenFree) score += 5;
                 // Add more preference checks if needed (e.g., against item.category or tags)
            });
         }
         
         // Boost based on Health Conditions (using healthAttributes)
         if (healthProfile.healthConditions && healthProfile.healthConditions.length > 0 && healthProfile.healthConditions[0] !== 'None') {
             healthProfile.healthConditions.forEach(condition => {
                // Simple example: boost diabetic friendly if user has diabetes
                if (condition.toLowerCase().includes('diabetes') && item.healthAttributes?.isDiabeticFriendly) score += 10;
                if (condition.toLowerCase().includes('hypertension') && item.healthAttributes?.isLowSodium) score += 10;
                if (condition.toLowerCase().includes('heart') && item.healthAttributes?.isHeartHealthy) score += 10;
                // Add more condition checks
             });
         }

        // Boost based on Past Orders
        if (orderItemFrequency[itemIdStr]) {
          score += orderItemFrequency[itemIdStr] * 2; // More weight to frequently ordered items
        }

        // Boost based on Favorites
        if (favoriteItemIds.some(favId => favId.toString() === itemIdStr)) {
          score += 20; // High boost for favorites
        }

        // Boost based on Rating
        score += (item.averageRating || 0) * 1; // Slight boost for higher rated items

        // Basic check to ensure item is from an approved/open restaurant
        // This check might be too simplistic depending on the 'status' field usage
        if (!item.restaurant || item.restaurant.status !== 'approved') {
            console.log(`Recommendation Service: Skipping item ${item.item_name} from non-approved/missing restaurant.`);
            return null; 
        }


        // Return item with score if not filtered out
        return { ...item, score };
      })
      .filter(item => item !== null && item.score > 0); // Filter out null items and those with zero score

    console.log(`Recommendation Service: Scored ${scoredItems.length} potential items.`);

    // 6. Sort by Score and Select Top 3
    scoredItems.sort((a, b) => b.score - a.score);

    const recommendations = scoredItems.slice(0, 3); // Get top 3

     console.log(`Recommendation Service: Final top ${recommendations.length} recommendations for user ${userId}.`);

    // Format recommendations for the API response (similar to menu routes)
     const formattedRecommendations = recommendations.map(item => ({
         id: item._id,
         name: item.item_name,
         description: item.description,
         price: item.item_price,
         image: item.image || item.imageUrl || 'uploads/placeholders/food-placeholder.jpg',
         imageUrl: item.imageUrl || item.image || 'uploads/placeholders/food-placeholder.jpg',
         restaurant: item.restaurant ? {
             id: item.restaurant._id,
             name: item.restaurant.name || 'Unknown Restaurant'
         } : { id: null, name: 'Unknown Restaurant' },
         category: item.category || 'Main Course',
         isVegetarian: item.isVegetarian || false,
         isVegan: item.isVegan || false,
         isGlutenFree: item.isGlutenFree || false,
         averageRating: item.averageRating || 0,
         // Add other fields as needed for the frontend card display
         score: item.score // Include score for debugging/potential future use
     }));


    return formattedRecommendations;

  } catch (error) {
    console.error(`Error generating recommendations for user ${userId}:`, error);
    // Depending on desired behavior, could return empty array or throw error
    return []; 
  }
};

module.exports = {
  getRecommendationsForUser,
}; 
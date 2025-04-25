/**
 * This script updates restaurant status to "approved" for restaurants that have menu items
 * but are not currently approved. It also fixes menu items with missing restaurant references.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to database
mongoose.connect(process.env.CONNECTION_STRING)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Load models
const Restaurant = require('../models/restaurant');
const MenuItem = require('../models/menuItem');

// Main function to update restaurant status and fix menu items
async function updateRestaurantStatusAndFixMenuItems() {
  try {
    console.log('Starting restaurant status update and menu item fixes...');

    // Get all restaurants
    const restaurants = await Restaurant.find().lean();
    console.log(`Found ${restaurants.length} total restaurants`);

    if (restaurants.length === 0) {
      console.log('No restaurants found. Cannot proceed with fixes.');
      return;
    }

    // Get approved restaurants
    const approvedRestaurants = restaurants.filter(r => r.status === 'approved');
    console.log(`Found ${approvedRestaurants.length} approved restaurants`);

    // Get non-approved restaurants
    const nonApprovedRestaurants = restaurants.filter(r => r.status !== 'approved');
    console.log(`Found ${nonApprovedRestaurants.length} non-approved restaurants`);

    // Check which non-approved restaurants have menu items
    let updatedRestaurantCount = 0;
    for (const restaurant of nonApprovedRestaurants) {
      const menuItems = await MenuItem.countDocuments({ restaurant: restaurant._id });
      
      if (menuItems > 0) {
        console.log(`Restaurant "${restaurant.name}" (ID: ${restaurant._id}) has ${menuItems} menu items but status is "${restaurant.status}". Updating to "approved"...`);
        
        // Update the restaurant status to approved
        await Restaurant.findByIdAndUpdate(restaurant._id, { status: 'approved' });
        updatedRestaurantCount++;
      }
    }

    console.log(`Updated ${updatedRestaurantCount} restaurants to "approved" status`);
    
    // Fix menu items with null or invalid restaurant reference
    console.log('Checking for menu items with missing restaurant references...');
    
    const menuItemsWithoutRestaurant = await MenuItem.find({ 
      $or: [
        { restaurant: null },
        { restaurant: { $exists: false } }
      ]
    });
    
    console.log(`Found ${menuItemsWithoutRestaurant.length} menu items with missing restaurant references`);
    
    // Use the first approved restaurant as default
    let defaultRestaurant = approvedRestaurants[0];
    if (!defaultRestaurant && restaurants.length > 0) {
      // If no approved restaurant, use the first restaurant and approve it
      defaultRestaurant = restaurants[0];
      await Restaurant.findByIdAndUpdate(defaultRestaurant._id, { status: 'approved' });
      console.log(`No approved restaurants found. Updated restaurant "${defaultRestaurant.name}" to approved status.`);
    }
    
    // Update menu items with null restaurant reference
    if (defaultRestaurant && menuItemsWithoutRestaurant.length > 0) {
      const updateResult = await MenuItem.updateMany(
        { 
          $or: [
            { restaurant: null },
            { restaurant: { $exists: false } }
          ]
        },
        { restaurant: defaultRestaurant._id }
      );
      
      console.log(`Updated ${updateResult.modifiedCount} menu items with missing restaurant references to restaurant "${defaultRestaurant.name}"`);
    }
    
    // Check for menu items with both image and imageUrl fields
    console.log('Checking for menu items with inconsistent image fields...');
    
    const menuItems = await MenuItem.find().lean();
    let imageFixCount = 0;
    
    for (const item of menuItems) {
      let needsUpdate = false;
      const updateData = {};
      
      // Check if image and imageUrl are inconsistent
      if (item.image && !item.imageUrl) {
        updateData.imageUrl = item.image;
        needsUpdate = true;
      } else if (!item.image && item.imageUrl) {
        updateData.image = item.imageUrl;
        needsUpdate = true;
      } else if (!item.image && !item.imageUrl) {
        // Neither field has a value, set both to the default
        updateData.image = 'uploads/placeholders/food-placeholder.jpg';
        updateData.imageUrl = 'uploads/placeholders/food-placeholder.jpg';
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await MenuItem.findByIdAndUpdate(item._id, updateData);
        imageFixCount++;
      }
    }
    
    console.log(`Fixed image fields for ${imageFixCount} menu items`);
    
    // Final check of all approved restaurants
    const finalApprovedCount = await Restaurant.countDocuments({ status: 'approved' });
    console.log(`Total approved restaurants after update: ${finalApprovedCount}`);

    console.log('Fixes completed successfully');
  } catch (error) {
    console.error('Error during fixes:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
}

// Run the update function
updateRestaurantStatusAndFixMenuItems(); 
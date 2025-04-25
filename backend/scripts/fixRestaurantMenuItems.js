/**
 * Script to fix restaurant with missing menu items
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.CONNECTION_STRING)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Load models
const Restaurant = require('../models/restaurant');
const MenuItem = require('../models/menuItem');

// Function to fix restaurant menu items
async function fixRestaurantMenuItems() {
  try {
    // Specific restaurant ID
    const restaurantId = '6809d3cab1cacf26317a4446';
    
    // Find the restaurant
    const restaurant = await Restaurant.findById(restaurantId);
    
    if (!restaurant) {
      console.log(`Restaurant with ID ${restaurantId} not found`);
      return;
    }
    
    console.log(`Found restaurant: ${restaurant.name} (${restaurant._id})`);
    
    // Make sure restaurant is approved
    if (restaurant.status !== 'approved') {
      console.log(`Updating restaurant status from ${restaurant.status} to approved`);
      restaurant.status = 'approved';
      await restaurant.save();
    }

    // Find menu items for this restaurant owner
    const ownerId = restaurant.owner;
    console.log(`Looking for menu items with restaurant field set to owner ID: ${ownerId}`);
    
    const menuItemsByOwner = await MenuItem.find({ restaurant: ownerId });
    console.log(`Found ${menuItemsByOwner.length} menu items with restaurant = owner ID`);

    // Find menu items for restaurant ID
    const menuItemsByRestaurant = await MenuItem.find({ restaurant: restaurantId });
    console.log(`Found ${menuItemsByRestaurant.length} menu items with restaurant = restaurant ID`);

    // Check if we need to fix menu items
    if (menuItemsByOwner.length > 0 && menuItemsByRestaurant.length === 0) {
      console.log(`Updating ${menuItemsByOwner.length} menu items to reference restaurant ID instead of owner ID`);
      
      // Update menu items to reference restaurant ID
      for (const item of menuItemsByOwner) {
        item.restaurant = restaurantId;
        await item.save();
        console.log(`Updated menu item: ${item.item_name} (${item._id})`);
      }
    }

    // Find menu items with no restaurant field or null
    const orphanedMenuItems = await MenuItem.find({
      $or: [
        { restaurant: null },
        { restaurant: { $exists: false } }
      ]
    });
    
    console.log(`Found ${orphanedMenuItems.length} orphaned menu items`);
    
    if (orphanedMenuItems.length > 0) {
      console.log(`Assigning ${orphanedMenuItems.length} orphaned menu items to restaurant ID: ${restaurantId}`);
      
      // Update orphaned menu items
      for (const item of orphanedMenuItems) {
        item.restaurant = restaurantId;
        await item.save();
        console.log(`Assigned orphaned menu item: ${item.item_name} (${item._id})`);
      }
    }

    // Validate restaurant has isOpen field
    if (restaurant.isOpen === undefined) {
      console.log('Restaurant missing isOpen field, setting to true');
      restaurant.isOpen = true;
      await restaurant.save();
    }

    // Validate menu items have isAvailable field
    const menuItems = await MenuItem.find({ restaurant: restaurantId });
    let updatedItemCount = 0;
    
    for (const item of menuItems) {
      if (item.isAvailable === undefined) {
        item.isAvailable = true;
        await item.save();
        updatedItemCount++;
      }
    }
    
    console.log(`Set isAvailable=true on ${updatedItemCount} menu items`);
    
    console.log('Fix completed successfully');
  } catch (error) {
    console.error('Error fixing restaurant menu items:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
fixRestaurantMenuItems(); 
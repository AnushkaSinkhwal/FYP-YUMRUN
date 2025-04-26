// Script to find and fix menu items with invalid restaurant IDs
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Load models - we need to require these before using them
require('../models/restaurant');
require('../models/menuItem');

async function fixMenuItems() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.CONNECTION_STRING);
    console.log('Connected to MongoDB');

    // Load models now that they're registered
    const MenuItem = mongoose.model('MenuItem');
    const Restaurant = mongoose.model('Restaurant');

    // Find restaurants to use for fixing
    const restaurants = await Restaurant.find().limit(5);
    if (restaurants.length === 0) {
      console.error('No restaurants found');
      process.exit(1);
    }

    const primaryRestaurant = restaurants[0];
    console.log(`Using primary restaurant: ${primaryRestaurant.name} (${primaryRestaurant._id})`);

    // Find all menu items
    const allMenuItems = await MenuItem.find({});
    console.log(`Found ${allMenuItems.length} total menu items`);

    // Find and fix problematic items
    let fixedCount = 0;
    for (const item of allMenuItems) {
      if (!item.restaurant) {
        console.log(`Fixing item with null restaurant: ${item._id} (${item.item_name || 'Unknown name'})`);
        item.restaurant = primaryRestaurant._id;
        await item.save();
        fixedCount++;
      } else if (item._id.toString() === item.restaurant.toString()) {
        console.log(`Fixing self-referencing item: ${item._id} (${item.item_name || 'Unknown name'})`);
        item.restaurant = primaryRestaurant._id;
        await item.save();
        fixedCount++;
      }
    }

    console.log(`✅ Fixed ${fixedCount} problematic menu items`);
    
    // Verify all items are now valid
    const remainingInvalid = await MenuItem.countDocuments({ 
      $expr: { $eq: [{ $toString: "$_id" }, { $toString: "$restaurant" }] } 
    });
    
    console.log(`Verification: ${remainingInvalid} problematic items remain`);
    
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error fixing menu items:', error);
    process.exit(1);
  }
}

// Run the fix
fixMenuItems(); 
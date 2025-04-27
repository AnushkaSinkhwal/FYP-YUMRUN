const mongoose = require('mongoose');
const MenuItem = require('../models/menuItem');
const Restaurant = require('../models/restaurant');
require('dotenv').config();

/**
 * Script to fix menu items with incorrect restaurant ID references.
 * This script identifies and fixes:
 * 1. Menu items with self-referencing restaurant IDs
 * 2. Menu items with missing restaurant IDs
 */
async function connectDB() {
    try {
        // Using direct connection string as fallback if CONNECTION_STRING is not defined
        const dbUri = "mongodb+srv://anushkasinkhwal77:Anushka77@cluster0.udx2z.mongodb.net/eshopDatabase?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(dbUri);
        console.log('MongoDB connected for menu item fix script');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
}

async function fixMenuItems() {
    try {
        console.log('Starting menu item fix script...');
        
        // Find all menu items
        const menuItems = await MenuItem.find({});
        console.log(`Found ${menuItems.length} menu items to check`);
        
        let fixedCount = 0;
        let hasIssuesCount = 0;
        
        for (const item of menuItems) {
            let needsUpdate = false;
            
            // Case 1: Self-referencing restaurant ID
            if (item.restaurant && item._id && item.restaurant.toString() === item._id.toString()) {
                console.log(`Found self-referencing restaurant ID in menu item ${item._id} (${item.item_name})`);
                hasIssuesCount++;
                
                // Find a valid restaurant
                const restaurant = await Restaurant.findOne({}).sort({createdAt: 1});
                
                if (restaurant) {
                    console.log(`Fixing menu item ${item._id} by associating with restaurant ${restaurant._id} (${restaurant.name})`);
                    item.restaurant = restaurant._id;
                    needsUpdate = true;
                    fixedCount++;
                } else {
                    console.error('No valid restaurant found to fix the menu item');
                }
            }
            
            // Case 2: Missing restaurant ID
            if (!item.restaurant) {
                console.log(`Menu item ${item._id} (${item.item_name}) has no restaurant association`);
                hasIssuesCount++;
                
                // Find a valid restaurant
                const restaurant = await Restaurant.findOne({}).sort({createdAt: 1});
                
                if (restaurant) {
                    console.log(`Fixing menu item ${item._id} by associating with restaurant ${restaurant._id} (${restaurant.name})`);
                    item.restaurant = restaurant._id;
                    needsUpdate = true;
                    fixedCount++;
                } else {
                    console.error('No valid restaurant found to fix the menu item');
                }
            }
            
            // Case 3: Restaurant doesn't exist
            if (item.restaurant) {
                const restaurantExists = await Restaurant.findById(item.restaurant);
                if (!restaurantExists) {
                    console.log(`Menu item ${item._id} (${item.item_name}) has invalid restaurant ID ${item.restaurant}`);
                    hasIssuesCount++;
                    
                    // Find a valid restaurant
                    const restaurant = await Restaurant.findOne({}).sort({createdAt: 1});
                    
                    if (restaurant) {
                        console.log(`Fixing menu item ${item._id} by associating with restaurant ${restaurant._id} (${restaurant.name})`);
                        item.restaurant = restaurant._id;
                        needsUpdate = true;
                        fixedCount++;
                    } else {
                        console.error('No valid restaurant found to fix the menu item');
                    }
                }
            }
            
            // Save if needed
            if (needsUpdate) {
                try {
                    await item.save();
                    console.log(`Saved fixed menu item ${item._id}`);
                } catch (error) {
                    console.error(`Error saving fixed menu item ${item._id}:`, error);
                }
            }
        }
        
        console.log('Menu item fix script completed');
        console.log(`Total items checked: ${menuItems.length}`);
        console.log(`Items with issues: ${hasIssuesCount}`);
        console.log(`Items fixed: ${fixedCount}`);
        
    } catch (error) {
        console.error('Error in fixMenuItems script:', error);
    } finally {
        mongoose.disconnect();
        console.log('MongoDB disconnected');
    }
}

// Run the script
connectDB().then(() => {
    fixMenuItems();
}); 
/**
 * Fix Menu Items Script
 * 
 * This script fixes menu items that have no restaurant association by
 * finding available restaurants and assigning them to menu items.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get MongoDB URI or use default
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/yumrun';
console.log('Using MongoDB URI:', MONGO_URI);

// Initialize models
const MenuItem = require('../models/menuItem');
const Restaurant = require('../models/restaurant');

async function fixMenuItems() {
    try {
        // Connect to database
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all restaurants
        const restaurants = await Restaurant.find();
        
        if (restaurants.length === 0) {
            console.log('No restaurants found in database!');
            process.exit(1);
        }
        
        console.log(`Found ${restaurants.length} restaurants`);
        const primaryRestaurant = restaurants[0];
        console.log(`Using primary restaurant: ${primaryRestaurant.name} (ID: ${primaryRestaurant._id})`);
        
        // Find all menu items with no restaurant
        const menuItemsWithNoRestaurant = await MenuItem.find({ restaurant: null });
        console.log(`Found ${menuItemsWithNoRestaurant.length} menu items with no restaurant`);
        
        if (menuItemsWithNoRestaurant.length === 0) {
            // Also check for menu items with invalid restaurant IDs
            const allMenuItems = await MenuItem.find();
            console.log(`Found ${allMenuItems.length} total menu items`);
            
            // Verify each menu item has a valid restaurant
            let invalidRestaurantCount = 0;
            
            for (const item of allMenuItems) {
                if (!item.restaurant) {
                    invalidRestaurantCount++;
                    continue;
                }
                
                try {
                    const restaurantExists = await Restaurant.findById(item.restaurant);
                    if (!restaurantExists) {
                        invalidRestaurantCount++;
                        
                        // Fix this item
                        item.restaurant = primaryRestaurant._id;
                        await item.save();
                        console.log(`Fixed menu item ${item.item_name} with invalid restaurant ID`);
                    }
                } catch (err) {
                    console.error(`Error checking restaurant for item ${item.item_name}:`, err);
                    invalidRestaurantCount++;
                    
                    // Fix this item
                    item.restaurant = primaryRestaurant._id;
                    await item.save();
                    console.log(`Fixed menu item ${item.item_name} with invalid restaurant ID`);
                }
            }
            
            console.log(`Fixed ${invalidRestaurantCount} menu items with invalid restaurant IDs`);
            
            if (invalidRestaurantCount === 0) {
                console.log('All menu items already have valid restaurants assigned');
                await mongoose.disconnect();
                process.exit(0);
            }
        }
        
        // Fix menu items with no restaurant
        const updateResult = await MenuItem.updateMany(
            { restaurant: null }, 
            { restaurant: primaryRestaurant._id }
        );
        
        console.log(`Fixed ${updateResult.modifiedCount} menu items with null restaurant reference`);
        
        // Double-check that all menu items now have a restaurant
        const remainingItemsWithNoRestaurant = await MenuItem.countDocuments({ restaurant: null });
        console.log(`Remaining menu items with no restaurant: ${remainingItemsWithNoRestaurant}`);
        
        if (remainingItemsWithNoRestaurant > 0) {
            console.error('Failed to fix all menu items!');
        } else {
            console.log('Successfully fixed all menu items!');
        }
        
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing menu items:', error);
        process.exit(1);
    }
}

// Run the fix
fixMenuItems(); 
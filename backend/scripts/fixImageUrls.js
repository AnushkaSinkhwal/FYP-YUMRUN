/**
 * Script to fix image URLs in the database
 * 
 * This script:
 * 1. Ensures all MenuItem documents have both image and imageUrl fields set properly
 * 2. Fixes path issues (adds missing uploads/ prefix or removes incorrect leading slashes)
 * 3. Ensures empty image fields are set to the default placeholder
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

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
const MenuItem = require('../models/menuItem');
const Restaurant = require('../models/restaurant');

// Default placeholder paths
const PLACEHOLDERS = {
  FOOD: 'uploads/placeholders/food-placeholder.jpg',
  RESTAURANT: 'uploads/placeholders/restaurant-placeholder.jpg',
  BANNER: 'uploads/placeholders/banner-placeholder.jpg',
  USER: 'uploads/placeholders/user-placeholder.jpg'
};

// Helper function to normalize image path
function normalizeImagePath(originalPath) {
  if (!originalPath) return PLACEHOLDERS.FOOD;
  
  // If it's already a URL, return as is
  if (originalPath.startsWith('http://') || originalPath.startsWith('https://')) {
    return originalPath;
  }
  
  // Remove leading slash if present
  let normalized = originalPath.startsWith('/') ? originalPath.substring(1) : originalPath;
  
  // If it doesn't start with uploads/ and it's not just a filename, add uploads/ prefix
  if (!normalized.startsWith('uploads/') && !normalized.match(/^[^/]+\.(jpg|jpeg|png|gif|webp)$/i)) {
    // If it's just a filename (no directory), add uploads/menu/
    if (normalized.match(/^[^/]+\.(jpg|jpeg|png|gif|webp)$/i)) {
      normalized = `uploads/menu/${normalized}`;
    } else {
      normalized = `uploads/${normalized}`;
    }
  }
  
  return normalized;
}

// Helper function to check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error(`Error checking if file exists at ${filePath}:`, error);
    return false;
  }
}

// Main function to fix image URLs
async function fixImageUrls() {
  try {
    console.log('Starting image URL fix...');
    
    // Fix menu item images
    console.log('Fixing menu item images...');
    const menuItems = await MenuItem.find();
    console.log(`Found ${menuItems.length} menu items to check`);
    
    let menuItemFixCount = 0;
    
    for (const item of menuItems) {
      let needsUpdate = false;
      let originalImage = item.image;
      let originalImageUrl = item.imageUrl;
      
      // Normalize image paths
      const normalizedImage = normalizeImagePath(item.image);
      const normalizedImageUrl = normalizeImagePath(item.imageUrl);
      
      // Check if either field needs updating
      if (normalizedImage !== item.image) {
        item.image = normalizedImage;
        needsUpdate = true;
      }
      
      if (normalizedImageUrl !== item.imageUrl) {
        item.imageUrl = normalizedImageUrl;
        needsUpdate = true;
      }
      
      // Make sure both fields are consistent
      if (item.image && !item.imageUrl) {
        item.imageUrl = item.image;
        needsUpdate = true;
      } else if (!item.image && item.imageUrl) {
        item.image = item.imageUrl;
        needsUpdate = true;
      }
      
      // Check if file exists - use placeholder if not
      if (item.image && item.image !== PLACEHOLDERS.FOOD) {
        const exists = fileExists(item.image);
        if (!exists) {
          console.log(`File ${item.image} not found. Using placeholder instead.`);
          item.image = PLACEHOLDERS.FOOD;
          item.imageUrl = PLACEHOLDERS.FOOD;
          needsUpdate = true;
        }
      }
      
      // Check if isAvailable is set properly
      if (item.isAvailable !== true) {
        console.log(`Setting isAvailable to true for menu item ${item._id} (${item.item_name})`);
        item.isAvailable = true;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log(`Fixing menu item ${item._id} (${item.item_name}):`);
        console.log(`  Original image: ${originalImage} -> ${item.image}`);
        console.log(`  Original imageUrl: ${originalImageUrl} -> ${item.imageUrl}`);
        
        await item.save();
        menuItemFixCount++;
      }
    }
    
    console.log(`Fixed ${menuItemFixCount} menu items`);
    
    // Fix restaurant images
    console.log('\nFixing restaurant images...');
    const restaurants = await Restaurant.find();
    console.log(`Found ${restaurants.length} restaurants to check`);
    
    let restaurantFixCount = 0;
    
    for (const restaurant of restaurants) {
      let needsUpdate = false;
      let originalLogo = restaurant.logo;
      let originalCoverImage = restaurant.coverImage;
      
      // Normalize image paths
      const normalizedLogo = normalizeImagePath(restaurant.logo);
      const normalizedCoverImage = normalizeImagePath(restaurant.coverImage);
      
      // Check if either field needs updating
      if (normalizedLogo !== restaurant.logo) {
        restaurant.logo = normalizedLogo;
        needsUpdate = true;
      }
      
      if (normalizedCoverImage !== restaurant.coverImage) {
        restaurant.coverImage = normalizedCoverImage;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log(`Fixing restaurant ${restaurant._id} (${restaurant.name}):`);
        console.log(`  Original logo: ${originalLogo} -> ${restaurant.logo}`);
        console.log(`  Original coverImage: ${originalCoverImage} -> ${restaurant.coverImage}`);
        
        await restaurant.save();
        restaurantFixCount++;
      }
    }
    
    console.log(`Fixed ${restaurantFixCount} restaurants`);
    
    console.log('\nImage URL fix completed successfully');
  } catch (error) {
    console.error('Error fixing image URLs:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
}

// Run the fix function
fixImageUrls(); 
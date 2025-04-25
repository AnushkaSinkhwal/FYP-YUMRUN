/**
 * Status API routes for system health checks
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// GET system status
router.get('/', async (req, res) => {
  try {
    // Basic system status
    const status = {
      api: {
        status: 'Online',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      },
      database: {
        connected: mongoose.connection.readyState === 1,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      },
      uploads: {
        directory: path.resolve(__dirname, '../uploads'),
        accessible: false,
        placeholders: {
          food: false,
          restaurant: false
        }
      }
    };

    // Check uploads directory
    try {
      const uploadsPath = path.resolve(__dirname, '../uploads');
      const uploadsStats = fs.statSync(uploadsPath);
      status.uploads.accessible = uploadsStats.isDirectory();
      
      // Check placeholders
      const foodPlaceholder = path.resolve(uploadsPath, 'placeholders/food-placeholder.jpg');
      const restaurantPlaceholder = path.resolve(uploadsPath, 'placeholders/restaurant-placeholder.jpg');
      
      status.uploads.placeholders.food = fs.existsSync(foodPlaceholder);
      status.uploads.placeholders.restaurant = fs.existsSync(restaurantPlaceholder);
    } catch (err) {
      console.error('Error checking uploads directory:', err);
    }

    // Check MongoDB collections
    if (status.database.connected) {
      try {
        // Get counts from key collections
        const Restaurant = mongoose.model('Restaurant');
        const MenuItem = mongoose.model('MenuItem');
        const User = mongoose.model('User');
        
        const [restaurantCount, menuItemCount, userCount] = await Promise.all([
          Restaurant.countDocuments(),
          MenuItem.countDocuments(),
          User.countDocuments()
        ]);
        
        status.database.collections = {
          restaurants: restaurantCount,
          menuItems: menuItemCount,
          users: userCount
        };
        
        // Check for approved restaurants
        const approvedRestaurants = await Restaurant.countDocuments({ status: 'approved' });
        status.database.approvedRestaurants = approvedRestaurants;
        
      } catch (err) {
        console.error('Error getting collection counts:', err);
        status.database.collections = 'Error retrieving collection data';
      }
    }

    return res.status(200).json(status);
  } catch (error) {
    console.error('Error in status endpoint:', error);
    return res.status(500).json({ 
      status: 'Error',
      message: 'Failed to retrieve system status',
      error: error.message
    });
  }
});

// GET detailed uploads status
router.get('/uploads', async (req, res) => {
  try {
    const uploadsPath = path.resolve(__dirname, '../uploads');
    const uploadsStatus = {
      uploadsPath,
      exists: false,
      isDirectory: false,
      directories: {},
      placeholderImages: {}
    };
    
    // Check if uploads directory exists
    if (fs.existsSync(uploadsPath)) {
      uploadsStatus.exists = true;
      const stats = fs.statSync(uploadsPath);
      uploadsStatus.isDirectory = stats.isDirectory();
      
      if (uploadsStatus.isDirectory) {
        // Check key directories
        const dirs = ['menu', 'restaurants', 'placeholders', 'users'];
        for (const dir of dirs) {
          const dirPath = path.join(uploadsPath, dir);
          uploadsStatus.directories[dir] = fs.existsSync(dirPath);
          
          // If directory exists, count files
          if (uploadsStatus.directories[dir]) {
            try {
              const files = fs.readdirSync(dirPath);
              uploadsStatus.directories[`${dir}_files`] = files.length;
              
              // List placeholder images
              if (dir === 'placeholders') {
                files.forEach(file => {
                  uploadsStatus.placeholderImages[file] = true;
                });
              }
            } catch (err) {
              console.error(`Error reading directory ${dir}:`, err);
              uploadsStatus.directories[`${dir}_error`] = err.message;
            }
          }
        }
      }
    }
    
    return res.status(200).json(uploadsStatus);
  } catch (error) {
    console.error('Error in uploads status endpoint:', error);
    return res.status(500).json({ 
      status: 'Error',
      message: 'Failed to retrieve uploads status',
      error: error.message
    });
  }
});

module.exports = router; 
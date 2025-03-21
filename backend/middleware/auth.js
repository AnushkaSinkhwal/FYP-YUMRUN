const jwt = require('jsonwebtoken');
const User = require('../models/user');

/**
 * Authentication middleware
 * Validates the JWT token and attaches the user to the request
 */
const auth = async (req, res, next) => {
  try {
    let token;

    // Check if authorization header is present and uses Bearer scheme
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token, return unauthorized
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by id from decoded token
      const user = await User.findById(decoded.userId).select('-password');

      // If user not found
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid authentication token.'
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Your session has expired. Please log in again.'
        });
      }
      
      // If token verification fails
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication.'
    });
  }
};

/**
 * Admin access middleware
 * Checks if the authenticated user is an admin
 */
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

/**
 * Restaurant owner access middleware
 * Checks if the authenticated user is a restaurant owner
 */
const isRestaurantOwner = (req, res, next) => {
  if (!req.user || !req.user.isRestaurantOwner) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Restaurant owner privileges required.'
    });
  }
  next();
};

/**
 * Delivery staff access middleware
 * Checks if the authenticated user is delivery staff
 */
const isDeliveryStaff = (req, res, next) => {
  if (!req.user || !req.user.isDeliveryStaff) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Delivery staff privileges required.'
    });
  }
  next();
};

module.exports = { auth, isAdmin, isRestaurantOwner, isDeliveryStaff }; 
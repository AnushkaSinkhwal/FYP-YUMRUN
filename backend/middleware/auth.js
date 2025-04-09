const jwt = require('jsonwebtoken');
const User = require('../models/user');

/**
 * Authentication middleware
 * Validates the JWT token and attaches the user to the request
 */
const auth = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    console.log('[Auth Middleware] Auth header:', authHeader ? `${authHeader.substring(0, 15)}...` : 'None');
    
    if (!token) {
      console.log('[Auth Middleware] No token found');
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }
    
    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('[Auth Middleware] Token verified, user:', decoded.userId, 'role:', decoded.role);
      
      // Add user data to request
      req.user = decoded;
      
      next();
    } catch (jwtError) {
      console.log('[Auth Middleware] Token verification failed:', jwtError.message);
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }
  } catch (error) {
    console.error('[Auth Middleware] Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

/**
 * Admin access middleware
 * Checks if the authenticated user is an admin
 */
const isAdmin = (req, res, next) => {
  if (!req.user.role || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin permissions required.'
    });
  }
  next();
};

/**
 * Restaurant owner access middleware
 * Checks if the authenticated user is a restaurant owner
 */
const isRestaurantOwner = (req, res, next) => {
  if (!req.user.role || req.user.role !== 'restaurantOwner') {
    console.log('[Auth Middleware] Access denied - Not a restaurant owner. User role:', req.user.role);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Restaurant owner permissions required.'
    });
  }
  
  // Add the user's ID as the restaurantId for convenience in routes
  req.user.restaurantId = req.user.userId;
  
  console.log('[Auth Middleware] Restaurant owner access granted');
  next();
};

/**
 * Delivery staff access middleware
 * Checks if the authenticated user is delivery staff
 */
const isDeliveryRider = (req, res, next) => {
  if (!req.user.role || req.user.role !== 'deliveryRider') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Delivery rider permissions required.'
    });
  }
  next();
};

module.exports = {
  auth,
  isAdmin,
  isRestaurantOwner,
  isDeliveryRider
}; 
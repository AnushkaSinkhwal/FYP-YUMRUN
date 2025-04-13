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
      console.log('[Auth Middleware] Full token payload:', JSON.stringify(decoded));
      
      // Add user data to request
      req.user = decoded;
      
      // Fix for older tokens that might use id instead of userId
      if (!req.user.userId && req.user.id) {
        req.user.userId = req.user.id;
        console.log('[Auth Middleware] Set userId from id:', req.user.userId);
      }
      
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
  console.log('[Auth Middleware] Checking restaurant owner access, req.user:', JSON.stringify(req.user));
  
  if (!req.user.role || req.user.role !== 'restaurant') {
    console.log('[Auth Middleware] Access denied - Not a restaurant owner. User role:', req.user.role);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Restaurant owner permissions required.'
    });
  }
  
  // Find some ID value to use as restaurantId
  let idToUse = null;
  
  // Try different possible sources in order of preference
  if (req.user.userId) {
    idToUse = req.user.userId;
    console.log('[Auth Middleware] Using userId for restaurantId:', idToUse);
  } else if (req.user.id) {
    idToUse = req.user.id;
    console.log('[Auth Middleware] Using id for restaurantId:', idToUse);
  } else if (req.user._id) {
    idToUse = req.user._id;
    console.log('[Auth Middleware] Using _id for restaurantId:', idToUse);
  }
  
  if (!idToUse) {
    console.log('[Auth Middleware] Error: No valid ID found in token payload', req.user);
    return res.status(500).json({
      success: false,
      message: 'Server error: User identification issue'
    });
  }
  
  // Set the restaurantId and ensure userId is also set
  req.user.restaurantId = idToUse;
  req.user.userId = idToUse; // Ensure userId is set for consistency
  
  console.log('[Auth Middleware] Restaurant owner access granted for role:', req.user.role, 'restaurantId set to:', req.user.restaurantId);
  next();
};

/**
 * Delivery staff access middleware
 * Checks if the authenticated user is delivery staff
 */
const isDeliveryRider = (req, res, next) => {
  if (!req.user.role || req.user.role !== 'delivery_rider') {
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
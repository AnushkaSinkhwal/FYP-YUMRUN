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
      
      // Ensure role is set correctly
      if (!req.user.role) {
        if (req.user.isAdmin) {
          req.user.role = 'admin';
        } else if (req.user.isRestaurantOwner) {
          req.user.role = 'restaurant';
        } else if (req.user.isDeliveryStaff) {
          req.user.role = 'delivery_rider';
        } else {
          req.user.role = 'customer';
        }
        console.log('[Auth Middleware] Set role from legacy properties:', req.user.role);
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
const isRestaurantOwner = async (req, res, next) => {
  console.log('[Auth Middleware] Checking restaurant owner access, req.user:', JSON.stringify(req.user));
  
  if (!req.user.role || req.user.role !== 'restaurant') {
    console.log('[Auth Middleware] Access denied - Not a restaurant owner. User role:', req.user.role);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Restaurant owner permissions required.'
    });
  }
  
  // Find some ID value to use as userId
  let userId = null;
  
  // Try different possible sources in order of preference
  if (req.user.userId) {
    userId = req.user.userId;
    console.log('[Auth Middleware] Using userId:', userId);
  } else if (req.user.id) {
    userId = req.user.id;
    console.log('[Auth Middleware] Using id:', userId);
  } else if (req.user._id) {
    userId = req.user._id;
    console.log('[Auth Middleware] Using _id:', userId);
  }
  
  if (!userId) {
    console.log('[Auth Middleware] Error: No valid ID found in token payload', req.user);
    return res.status(500).json({
      success: false,
      message: 'Server error: User identification issue'
    });
  }
  
  // Set the userId for consistency
  req.user.userId = userId;
  
  try {
    // Try to find a restaurant document first
    const Restaurant = require('../models/restaurant');
    const restaurant = await Restaurant.findOne({ owner: userId });
    
    if (restaurant) {
      // If we found a restaurant document, use its ID
      req.user.restaurantId = restaurant._id.toString();
      console.log('[Auth Middleware] Found restaurant document with ID:', req.user.restaurantId);
    } else {
      // If no restaurant document, use the user ID as a fallback
      req.user.restaurantId = userId;
      console.log('[Auth Middleware] No restaurant document found, using user ID as restaurantId:', req.user.restaurantId);
    }
    
    console.log('[Auth Middleware] Restaurant owner access granted for role:', req.user.role, 'restaurantId set to:', req.user.restaurantId);
    next();
  } catch (error) {
    console.error('[Auth Middleware] Error finding restaurant:', error.message);
    // Continue with user ID as a fallback
    req.user.restaurantId = userId;
    console.log('[Auth Middleware] Error occurred, using user ID as restaurantId:', req.user.restaurantId);
    next();
  }
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

/**
 * Email verification check middleware
 * Ensures the user's email is verified before allowing access to protected routes
 */
const emailVerified = async (req, res, next) => {
  try {
    // Ensure we have a user in the request
    if (!req.user || !req.user.userId) {
      console.log('[Email Verification Middleware] No user in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Find the user in the database to check verification status
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      console.log('[Email Verification Middleware] User not found in database:', req.user.userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check verification status
    if (!user.isEmailVerified) {
      console.log('[Email Verification Middleware] Email not verified for user:', req.user.userId);
      return res.status(403).json({
        success: false,
        message: 'Email verification required. Please verify your email before accessing this resource.',
        requiresVerification: true
      });
    }
    
    console.log('[Email Verification Middleware] Email verified for user:', req.user.userId);
    next();
  } catch (error) {
    console.error('[Email Verification Middleware] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while checking email verification'
    });
  }
};

module.exports = {
  auth,
  isAdmin,
  isRestaurantOwner,
  isDeliveryRider,
  emailVerified
}; 
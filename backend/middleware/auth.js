const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Middleware to protect routes that require authentication
const auth = async (req, res, next) => {
  try {
    let token;

    // Check if authorization header is present and uses Bearer scheme
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token, return unauthorized
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Not authorized to access this route',
          code: 'UNAUTHORIZED'
        }
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
          error: {
            message: 'User not found',
            code: 'UNAUTHORIZED'
          }
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      // If token verification fails
      return res.status(401).json({
        success: false,
        error: {
          message: 'Not authorized to access this route',
          code: 'UNAUTHORIZED'
        }
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        message: 'Server error',
        code: 'SERVER_ERROR'
      }
    });
  }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  // The auth middleware must be called before this middleware
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Admin access required',
        code: 'FORBIDDEN'
      }
    });
  }
  next();
};

// Middleware to check if user is restaurant owner
const isRestaurantOwner = (req, res, next) => {
  // The auth middleware must be called before this middleware
  if (!req.user || !req.user.isRestaurantOwner) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Restaurant owner access required',
        code: 'FORBIDDEN'
      }
    });
  }
  next();
};

// Middleware to check if user is delivery staff
const isDeliveryStaff = (req, res, next) => {
  // The auth middleware must be called before this middleware
  if (!req.user || !req.user.isDeliveryStaff) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Delivery staff access required',
        code: 'FORBIDDEN'
      }
    });
  }
  next();
};

module.exports = {
  auth,
  isAdmin,
  isRestaurantOwner,
  isDeliveryStaff
}; 
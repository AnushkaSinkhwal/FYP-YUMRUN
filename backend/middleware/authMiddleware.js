const jwt = require('jsonwebtoken');
const User = require('../models/user');

/**
 * Middleware to protect routes by verifying JWT token
 * Adds the decoded user data to req.user if authentication is successful
 */
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Add user to request object (without password)
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({
        success: false,
        error: {
          message: 'Not authorized, token failed',
          code: 'AUTH_ERROR'
        }
      });
    }
  }

  // Check for token in cookies as fallback
  if (!token && req.cookies && req.cookies.authToken) {
    try {
      token = req.cookies.authToken;
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add user to request object (without password)
      req.user = await User.findById(decoded.id).select('-password');
      
      next();
    } catch (error) {
      console.error('Auth middleware cookie error:', error);
      return res.status(401).json({
        success: false,
        error: {
          message: 'Not authorized, token failed',
          code: 'AUTH_ERROR'
        }
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Not authorized, no token',
        code: 'AUTH_ERROR'
      }
    });
  }
};

/**
 * Middleware to restrict access to admin users only
 */
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Not authorized as admin',
        code: 'PERMISSION_DENIED'
      }
    });
  }
};

/**
 * Middleware to restrict access to restaurant owners only
 */
exports.restaurantOwner = (req, res, next) => {
  if (req.user && (req.user.role === 'restaurant' || req.user.role === 'restaurantOwner')) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Not authorized as restaurant owner',
        code: 'PERMISSION_DENIED'
      }
    });
  }
};

/**
 * Middleware to restrict access to delivery staff only
 */
exports.deliveryStaff = (req, res, next) => {
  if (req.user && req.user.role === 'deliveryRider') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Not authorized as delivery staff',
        code: 'PERMISSION_DENIED'
      }
    });
  }
}; 
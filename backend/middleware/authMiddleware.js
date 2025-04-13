const jwt = require('jsonwebtoken');
const User = require('../models/user');

/**
 * Middleware to protect routes by verifying JWT token
 * Adds the decoded user data to req.user if authentication is successful
 */
exports.protect = async (req, res, next) => {
  let token;

  // 1. Try finding token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
        token = req.headers.authorization.split(' ')[1];
    } catch (error) {
        console.error('Error splitting Bearer token:', error);
        // Let it proceed to check cookies or fail if no token found
    }
  }

  // 2. If no header token, try finding token in cookies
  if (!token && req.cookies && req.cookies.authToken) {
    token = req.cookies.authToken;
  }

  // 3. If no token was found in either location
  if (!token) {
    console.log('[Auth Middleware] No token found in header or cookies.');
    return res.status(401).json({
      success: false,
      error: {
        message: 'Not authorized, no token provided',
        code: 'AUTH_ERROR'
      }
    });
  }

  // 4. Verify the found token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user based on userId in token payload
    req.user = await User.findById(decoded.id || decoded.userId).select('-password');

    // Check if user exists
    if (!req.user) {
      console.log(`[Auth Middleware] User not found for token userId: ${decoded.id || decoded.userId}`);
      return res.status(401).json({
         success: false,
         error: { message: 'User associated with this token no longer exists.', code: 'AUTH_ERROR' }
      });
    }

    // Success: Attach user to request and proceed
    console.log(`[Auth Middleware] User ${req.user._id} authenticated via token.`);
    next();

  } catch (error) {
    // Handle token verification errors (expired, invalid signature etc.)
    console.error('[Auth Middleware] Token verification failed:', error.name, error.message);
    
    let errorMessage = 'Not authorized, token failed';
    let statusCode = 401;
    
    if (error.name === 'TokenExpiredError') {
        errorMessage = 'Token expired, please log in again.';
    } else if (error.name === 'JsonWebTokenError') {
        errorMessage = 'Invalid token signature.';
    } 
    // Add other specific JWT error checks if needed
    
    return res.status(statusCode).json({
      success: false,
      error: { message: errorMessage, code: 'AUTH_ERROR' }
    });
  }
};

/**
 * Middleware to authorize based on user roles
 * @param {...string} roles - Allowed roles for the route
 * @returns {function} - Express middleware
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_ERROR'
        }
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: `User role '${req.user.role}' is not authorized to access this resource`,
          code: 'PERMISSION_DENIED'
        }
      });
    }
    
    next();
  };
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
exports.restaurant = (req, res, next) => {
  if (req.user && req.user.role === 'restaurant') {
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
  if (req.user && req.user.role === 'delivery_rider') {
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

/**
 * Middleware to verify email status
 * Restricts access to routes for users who haven't verified their email
 */
exports.emailVerificationCheck = async (req, res, next) => {
  try {
    // Ensure user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_ERROR'
        }
      });
    }
    
    // Check if email is verified
    if (!req.user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Email verification required',
          code: 'EMAIL_NOT_VERIFIED',
          requiresOTP: true,
          email: req.user.email
        }
      });
    }
    
    // Email is verified, proceed
    next();
  } catch (error) {
    console.error('[Email Verification Middleware] Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Server error while checking email verification',
        code: 'SERVER_ERROR'
      }
    });
  }
}; 
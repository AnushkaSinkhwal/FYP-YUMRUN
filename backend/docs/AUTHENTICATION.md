# YumRun Authentication Guide

This document explains the authentication implementation for the YumRun backend, including JWT setup, middleware, and role-based access control.

## Authentication Flow

YumRun uses JSON Web Tokens (JWT) for authentication with the following flow:

1. User registers or logs in with credentials
2. Server validates credentials and generates a JWT token
3. Token is returned to the client
4. Client stores token and includes it in subsequent API requests
5. Server validates token and allows/denies access to resources

## JWT Implementation

### Token Structure

Each JWT token contains:

- **Header**: Algorithm and token type
- **Payload**:
  - `userId`: MongoDB ID of the authenticated user
  - `name`: User's full name
  - `email`: User's email address
  - `isAdmin`: Boolean flag for admin status
  - `isOwner`: Boolean flag for restaurant owner status
  - `isDeliveryStaff`: Boolean flag for delivery staff status
  - `iat`: Issued at timestamp
  - `exp`: Expiration timestamp
- **Signature**: Verifies token authenticity

### Token Generation

Tokens are generated during:
- User registration (`/api/auth/register`)
- User login (`/api/auth/login`)

Example implementation:
```javascript
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      isOwner: user.isOwner,
      isDeliveryStaff: user.isDeliveryStaff
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY }
  );
};
```

## Authentication Middleware

### Token Validation

The `authMiddleware.js` contains middleware functions for verifying tokens and checking user roles:

```javascript
// Verify token middleware
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token, return error
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Not authorized, no token provided',
          code: 'UNAUTHORIZED'
        }
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by id
    const user = await User.findById(decoded.userId).select('-password');
    
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
    return res.status(401).json({
      success: false,
      error: {
        message: 'Not authorized, invalid token',
        code: 'UNAUTHORIZED'
      }
    });
  }
};
```

## Role-Based Access Control

YumRun implements role-based access control (RBAC) for different user types:

### Admin Access

```javascript
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Not authorized as admin',
        code: 'FORBIDDEN'
      }
    });
  }
};
```

### Restaurant Owner Access

```javascript
const requireOwner = (req, res, next) => {
  if (req.user && req.user.isOwner) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Not authorized as restaurant owner',
        code: 'FORBIDDEN'
      }
    });
  }
};
```

### Delivery Staff Access

```javascript
const requireDeliveryStaff = (req, res, next) => {
  if (req.user && req.user.isDeliveryStaff) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Not authorized as delivery staff',
        code: 'FORBIDDEN'
      }
    });
  }
};
```

## Using Authentication in Routes

The middleware can be applied to specific routes:

```javascript
const router = express.Router();
const { protect, requireAdmin, requireOwner } = require('../middleware/authMiddleware');

// Public routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Protected routes (any authenticated user)
router.get('/users/me', protect, userController.getProfile);
router.put('/users/me', protect, userController.updateProfile);

// Admin routes
router.get('/admin/users', protect, requireAdmin, adminController.getAllUsers);
router.get('/admin/statistics', protect, requireAdmin, adminController.getStatistics);

// Restaurant owner routes
router.post('/owner/restaurants', protect, requireOwner, restaurantController.createRestaurant);

// Mixed role routes (admin OR owner)
router.put('/restaurants/:id', protect, (req, res, next) => {
  if (req.user.isAdmin || (req.user.isOwner && req.restaurant.owner.equals(req.user._id))) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Not authorized to update this restaurant',
        code: 'FORBIDDEN'
      }
    });
  }
}, restaurantController.updateRestaurant);
```

## Frontend Integration

### Storing Tokens

Tokens should be stored in:
- Local storage (for persistence)
- Memory (for session-only authentication)

Example:
```javascript
// Store token
localStorage.setItem('token', receivedToken);

// Get token
const token = localStorage.getItem('token');
```

### Adding Token to Requests

Using Axios for API requests:
```javascript
import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Add token to each request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);
```

## Security Considerations

1. **Token Expiration**: Set a reasonable expiration time (24 hours to 7 days)
2. **HTTPS**: Use HTTPS in production to protect token transmission
3. **Secure Headers**: Implement security headers (CORS, XSS protection, etc.)
4. **Token Refresh**: Implement a token refresh mechanism for longer sessions
5. **Logout Handling**: Clear tokens on logout
6. **Password Hashing**: Store passwords using bcrypt with appropriate salt rounds
7. **Rate Limiting**: Implement rate limiting on authentication endpoints to prevent brute force attacks

## Troubleshooting

Common authentication issues:

1. **"Invalid token" error**:
   - Check that the token is being correctly sent in the Authorization header
   - Verify that the token hasn't expired
   - Ensure the JWT_SECRET in the .env file matches the one used to generate the token

2. **"Not authorized" error**:
   - Confirm the user has the required role for the resource
   - Check if the user account is still active

3. **"User not found" error**:
   - The user record may have been deleted while their token is still valid
   - Re-login to generate a new token 
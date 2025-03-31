const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { auth } = require('../middleware/auth');

/**
 * @route   POST /api/auth/login
 * @desc    Login user (all types including admin)
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    // Extract credentials, handling both direct and nested objects
    let email, password;
    
    if (typeof req.body.email === 'object' && req.body.email !== null) {
      // If email is an object (probably contains both email and password)
      const credentials = req.body.email;
      email = credentials.email;
      password = credentials.password;
    } else {
      // Normal case
      email = req.body.email;
      password = req.body.password;
    }

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    // Prepare user data (exclude sensitive fields)
    const userData = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      healthCondition: user.healthCondition,
      restaurantDetails: user.restaurantDetails,
      deliveryRiderDetails: user.deliveryRiderDetails
    };

    // Determine dashboard redirect based on user role
    let dashboardPath = '/';
    if (user.role === 'admin') {
      dashboardPath = '/admin/dashboard'; // Admin dashboard
    } else if (user.role === 'restaurantOwner') {
      dashboardPath = '/restaurant/dashboard'; // Restaurant dashboard
    } else if (user.role === 'deliveryRider') {
      dashboardPath = '/delivery/dashboard'; // Delivery dashboard
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userData,
      dashboardPath // Include the dashboard path
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with role selection
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      phone,
      password, 
      role,
      healthCondition,
      restaurantName,
      restaurantAddress,
      restaurantDescription,
      panNumber,
      vehicleType,
      licenseNumber,
      vehicleRegistrationNumber
    } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user with base fields
    const userFields = {
      fullName,
      email,
      phone,
      password, // Will be hashed by pre-save hook
      role
    };

    // Add role-specific fields
    if (role === 'customer') {
      userFields.healthCondition = healthCondition || 'Healthy';
    } else if (role === 'restaurantOwner') {
      userFields.restaurantDetails = {
        name: restaurantName,
        address: restaurantAddress,
        description: restaurantDescription,
        panNumber,
        approved: false // Requires admin approval
      };
    } else if (role === 'deliveryRider') {
      userFields.deliveryRiderDetails = {
        vehicleType,
        licenseNumber,
        vehicleRegistrationNumber
      };
    } else if (role === 'admin') {
      // Admin creation should only be done through a separate secure route
      return res.status(403).json({
        success: false,
        message: 'Admin registration not allowed through public API'
      });
    }

    const user = new User(userFields);

    // Save user to database
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    // Prepare user data (exclude sensitive fields)
    const userData = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      healthCondition: user.healthCondition,
      restaurantDetails: user.restaurantDetails,
      deliveryRiderDetails: user.deliveryRiderDetails
    };

    res.status(201).json({
      success: true,
      token,
      user: userData
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', auth, async (req, res) => {
  try {
    // User is already attached to request by auth middleware
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side action)
 * @access  Public
 */
router.post('/logout', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router; 
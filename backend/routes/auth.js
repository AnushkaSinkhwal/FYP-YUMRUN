const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { auth } = require('../middleware/auth');

/**
 * @route   POST /api/auth/login
 * @desc    Login user (all types)
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: email },
        { username: email }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin,
        isRestaurantOwner: user.isRestaurantOwner,
        isDeliveryStaff: user.isDeliveryStaff
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    // Prepare user data (exclude sensitive fields)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
      isRestaurantOwner: user.isRestaurantOwner,
      isDeliveryStaff: user.isDeliveryStaff
    };

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
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
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, healthCondition } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      phone,
      password, // Will be hashed by pre-save hook
      healthCondition: healthCondition || 'Healthy'
    });

    // Save user to database
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin,
        isRestaurantOwner: user.isRestaurantOwner,
        isDeliveryStaff: user.isDeliveryStaff
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    // Prepare user data (exclude sensitive fields)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
      isRestaurantOwner: user.isRestaurantOwner,
      isDeliveryStaff: user.isDeliveryStaff
    };

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
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
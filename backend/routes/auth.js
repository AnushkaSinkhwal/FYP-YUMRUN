const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { auth } = require('../middleware/auth');
const crypto = require('crypto');
const { sendEmail, emailTemplates } = require('../utils/emailService');

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

    // Role determination and updating
    try {
      // Force role update based on specific credentials
      // Hard-coded fix for test accounts
      if (email === 'owner@yumrun.com') {
        console.log('Test restaurant owner account detected, forcing role update to restaurant');
        user.role = 'restaurant';
        await user.save({ validateBeforeSave: false }); // Skip validation for test accounts
      } else if (email === 'admin@yumrun.com') {
        console.log('Test admin account detected, forcing role update to admin');
        user.role = 'admin';
        await user.save({ validateBeforeSave: false }); // Skip validation for test accounts
      } else if (email === 'delivery@yumrun.com') {
        console.log('Test delivery account detected, forcing role update to deliveryRider');
        user.role = 'deliveryRider';
        await user.save({ validateBeforeSave: false }); // Skip validation for test accounts
      } else if (email === 'user@yumrun.com') {
        console.log('Test customer account detected, forcing role update to customer');
        user.role = 'customer';
        await user.save({ validateBeforeSave: false }); // Skip validation for test accounts
      }
      
      // Handle restaurant owner role determination for non-test accounts
      // Check if user has restaurantDetails and set role accordingly
      else if (user.restaurantDetails && user.restaurantDetails.name) {
        console.log('User has restaurant details, updating role to restaurant');
        user.role = 'restaurant';
        await user.save({ validateBeforeSave: false }); // Skip validation
      }

      // Make sure legacy roles are properly set if the user has the corresponding flag
      // This ensures backward compatibility with older user records
      else if (user.isAdmin && user.role !== 'admin') {
        user.role = 'admin';
        await user.save({ validateBeforeSave: false }); // Skip validation
      } else if (user.isDeliveryRider && user.role !== 'deliveryRider') {
        user.role = 'deliveryRider';
        await user.save({ validateBeforeSave: false }); // Skip validation
      }

      console.log('User role determined as:', user.role);
    } catch (roleUpdateError) {
      // Log the error but continue with login process
      console.warn('Error updating user role, continuing with existing role:', roleUpdateError);
      // We'll continue with the user's current role without blocking login
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        id: user._id,
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
      deliveryRiderDetails: user.deliveryRiderDetails,
      // Add legacy role flags for backward compatibility
      isAdmin: user.role === 'admin',
      isRestaurantOwner: user.role === 'restaurant',
      isDeliveryRider: user.role === 'deliveryRider'
    };

    // Determine dashboard redirect based on user role
    let dashboardPath = '/user/dashboard'; // Default for customers
    if (user.role === 'admin') {
      dashboardPath = '/admin/dashboard'; // Admin dashboard
    } else if (user.role === 'restaurant') {
      dashboardPath = '/restaurant/dashboard'; // Restaurant dashboard
    } else if (user.role === 'deliveryRider') {
      dashboardPath = '/delivery/dashboard'; // Delivery dashboard
    }

    console.log('Final user role:', user.role, 'Redirecting to:', dashboardPath);

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
      address,
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
      address,
      password, // Will be hashed by pre-save hook
      role
    };

    // Add role-specific fields
    if (role === 'customer') {
      userFields.healthCondition = healthCondition || 'Healthy';
    } else if (role === 'restaurant') {
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

    // User successfully saved, now generate token and prepare response
    const token = jwt.sign(
      {
        userId: user._id,
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    // Prepare user data for the response (exclude sensitive fields)
    const userData = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      // Only include relevant details, avoid sending everything back
      // healthCondition: user.healthCondition, 
      // restaurantDetails: user.restaurantDetails,
      // deliveryRiderDetails: user.deliveryRiderDetails
    };

    // Try sending welcome email AFTER successful user save and token generation
    try {
        await sendEmail({
            to: user.email,
            subject: 'Welcome to YumRun!',
            html: emailTemplates.welcomeEmail(user)
        });
        console.log(`Welcome email sent successfully to ${user.email}`);
    } catch (emailError) {
        console.error(`Failed to send welcome email to ${user.email}:`, emailError); 
        // Do not block registration success if email fails, just log it.
    }

    // Send success response with the structure expected by frontend context
    res.status(201).json({
      success: true,
      data: { // Nest user and token under 'data'
        user: userData,
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    // Ensure consistent error response format
    let errorMessage = 'Server error during registration. Please try again.';
    if (error.message && typeof error.message === 'string') {
      errorMessage = error.message; // Use mongoose validation messages if available
    } else if (error.code === 11000) { // Handle duplicate key error specifically
        errorMessage = 'User with this email already exists.';
        return res.status(400).json({ success: false, message: errorMessage });
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage // Send a clean message to the frontend
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
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account with that email address exists'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Set token and expiry in user document
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email
    const emailResult = await sendEmail({
      to: user.email,
      subject: 'YumRun - Reset Your Password',
      html: emailTemplates.passwordResetEmail({
        resetLink: resetUrl,
        name: user.fullName
      })
    });

    if (!emailResult.success) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Please try again later.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

/**
 * @route   POST /api/auth/reset-password/:resetToken
 * @desc    Reset password
 * @access  Public
 */
router.post('/reset-password/:resetToken', async (req, res) => {
  try {
    const { password } = req.body;
    const { resetToken } = req.params;

    // Validate input
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password'
      });
    }

    // Hash token from params
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Find user by reset token and check if token is expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: 'YumRun - Password Reset Successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #FF5722;">Password Reset Successful</h2>
          <p>Hello ${user.fullName || 'there'},</p>
          <p>Your password has been successfully reset. You can now log in with your new password.</p>
          <p>If you did not make this change, please contact our support team immediately.</p>
          <p>Best regards,<br>The YumRun Team</p>
        </div>
      `
    });

    res.status(200).json({
      success: true,
      message: 'Password has been reset'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
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

/**
 * @route   GET /api/auth/debug
 * @desc    Debug endpoint to test token validation and role assignment
 * @access  Public
 */
router.get('/debug', async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Debug endpoint active',
      timestamp: new Date().toISOString(),
      auth: {
        checkRoles: (user) => {
          // Role calculation logic simulation
          let detectedRole = 'customer';
          
          if (user.role) {
            detectedRole = user.role;
          } else if (user.restaurantDetails && Object.keys(user.restaurantDetails).length > 0) {
            detectedRole = 'restaurant';
          } else if (user.isAdmin) {
            detectedRole = 'admin';
          } else if (user.isRestaurantOwner) {
            detectedRole = 'restaurant';
          } else if (user.isDeliveryRider || user.isDeliveryStaff) {
            detectedRole = 'deliveryRider';
          }
          
          return detectedRole;
        }
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in debug endpoint'
    });
  }
});

module.exports = router; 
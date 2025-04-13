const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { auth } = require('../middleware/auth');
const crypto = require('crypto');
const { sendEmail, emailTemplates, sendVerificationOTP } = require('../utils/emailService');
const { generateOTP, isOTPExpired, generateOTPExpiry } = require('../utils/otpUtils');
const authController = require('../controllers/authController');

// Use the controller methods for authentication routes
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-otp', authController.resendOTP);
router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', auth, authController.getCurrentUser);

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
            detectedRole = 'delivery_rider';
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
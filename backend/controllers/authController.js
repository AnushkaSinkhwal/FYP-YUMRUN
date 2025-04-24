const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendVerificationOTP } = require('../utils/emailService');
const { generateOTP, isOTPExpired, generateOTPExpiry } = require('../utils/otpUtils');
const Restaurant = require('../models/restaurant');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            isRestaurantOwner: user.isRestaurantOwner,
            isDeliveryStaff: user.isDeliveryStaff,
            role: user.role || (user.isAdmin ? 'admin' : user.isRestaurantOwner ? 'restaurant' : user.isDeliveryStaff ? 'delivery_rider' : 'customer')
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );
};

// User login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Please provide email and password',
                    code: 'VALIDATION_ERROR'
                }
            });
        }

        // Find user by email and select password for comparison
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                error: {
                    message: 'Invalid credentials',
                    code: 'UNAUTHORIZED'
                }
            });
        }
        
        // Verify password
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                error: {
                    message: 'Invalid credentials',
                    code: 'UNAUTHORIZED'
                }
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({ 
                success: false, 
                error: {
                    message: 'Your account is currently inactive. Please contact support.',
                    code: 'ACCOUNT_INACTIVE'
                }
            });
        }

        // Check if email is verified - strict enforcement
        if (!user.isEmailVerified) {
            // Generate a new OTP for verification
            const otp = generateOTP();
            const otpExpiry = generateOTPExpiry();
            
            // Update user with new OTP
            user.emailVerificationOTP = otp;
            user.emailVerificationOTPExpires = otpExpiry;
            await user.save();
            
            // Send verification email
            await sendVerificationOTP({
                email: user.email,
                otp,
                name: user.fullName || `${user.firstName} ${user.lastName}`
            });
            
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Email not verified. A new verification code has been sent to your email.',
                    code: 'EMAIL_NOT_VERIFIED'
                },
                requiresOTP: true,
                email: user.email
            });
        }
        
        // Determine role based on user properties
        let role = user.role || 'customer';
        
        // Override with legacy properties if needed
        if (!role || role === 'customer') {
            if (user.isAdmin) {
                role = 'admin';
            } else if (user.isRestaurantOwner || (user.restaurantDetails && Object.keys(user.restaurantDetails).length > 0)) {
                role = 'restaurant';
            } else if (user.isDeliveryStaff) {
                role = 'delivery_rider';
            }
        }
        
        // Update user's role if it's not set
        if (!user.role && role !== 'customer') {
            user.role = role;
            await user.save();
            console.log(`Updated user ${user._id} with role: ${role}`);
        }
        
        // Generate JWT token
        const token = generateToken({
            ...user.toObject(),
            role // Ensure the role is explicitly passed to token generator
        });
        
        // Return response with user details and token
        return res.status(200).json({ 
            success: true, 
            message: 'Login successful', 
            data: {
                user: { 
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    isAdmin: user.isAdmin,
                    isRestaurantOwner: user.isRestaurantOwner,
                    isDeliveryStaff: user.isDeliveryStaff,
                    role
                },
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            success: false, 
            error: {
                message: 'Server error. Please try again.',
                code: 'SERVER_ERROR'
            }
        });
    }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { 
    firstName, 
    lastName, 
    fullName,
    email, 
    password, 
    phone,
    role,
    address,
    // Restaurant specific fields
    restaurantName,
    restaurantAddress,
    restaurantDescription,
    panNumber,
    // Delivery rider specific fields
    vehicleType,
    licenseNumber,
    vehicleRegistrationNumber,
    // Customer specific fields
    healthCondition
  } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !password || !phone) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Please provide all required fields',
        code: 'VALIDATION_ERROR'
      }
    });
  }

  // Check if email is already in use
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Email is already in use',
        code: 'DUPLICATE_EMAIL'
      }
    });
  }

  // Create user with default health profile and loyalty
  const user = await User.create({
    firstName,
    lastName,
    fullName: fullName || `${firstName} ${lastName}`,
    email,
    password,
    phone,
    role,
    address,
    // Initialize health profile with default values
    healthProfile: {
      dietaryPreferences: ['None'],
      healthConditions: ['None'],
      allergies: [],
      weightManagementGoal: 'None',
      fitnessLevel: 'None',
      dailyCalorieGoal: 2000,
      macroTargets: {
        protein: 25,
        carbs: 50,
        fat: 25
      }
    },
    // Initialize loyalty points
    loyaltyPoints: 0,
    lifetimeLoyaltyPoints: 0,
    loyaltyTier: 'BRONZE',
    tierUpdateDate: Date.now()
  });
  
  // Generate email verification OTP
  const otp = generateOTP(6);
  
  // Set OTP expiration (10 minutes from now)
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  
  // Save OTP to user document
  user.emailVerificationOTP = otp;
  user.emailVerificationOTPExpires = otpExpires;
  await user.save();
  
  // Send welcome email with OTP
  try {
    await sendVerificationOTP({
      email: user.email,
      otp,
      name: user.fullName
    });
    console.log(`Email sent successfully: <${email}>`);
  } catch (emailError) {
    console.error("Failed to send verification email:", emailError);
    // Don't fail the registration, but log the error
  }

  // If the user is a restaurant owner, create a corresponding restaurant entry
  if (role === 'restaurant') {
    // Validate required restaurant fields
    if (!restaurantName || !panNumber) { 
      // Clean up created user if restaurant creation fails validation
      await User.findByIdAndDelete(user._id); 
      return res.status(400).json({
          success: false,
          error: {
              message: 'Restaurant name and PAN number are required for restaurant registration.',
              code: 'VALIDATION_ERROR'
          }
      });
    }

    try {
      // Create new restaurant document
      const newRestaurant = new Restaurant({
        name: restaurantName,
        location: restaurantAddress || address || '', 
        address: {
          street: restaurantAddress || address || '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        description: restaurantDescription || `${restaurantName} restaurant`,
        panNumber: panNumber,
        owner: user._id,
        contactInfo: { 
          email: user.email, 
          phone: user.phone 
        },
        cuisine: ['General'],
        status: 'pending_approval'
      });
      
      // Save restaurant to database
      const savedRestaurant = await newRestaurant.save();
      console.log(`Restaurant entry created for user ${user._id} with ID ${savedRestaurant._id}`);
      
      // Update user with restaurantId reference
      user.restaurantId = savedRestaurant._id;
      await user.save();
      
    } catch (restaurantError) {
      console.error('Error creating restaurant entry:', restaurantError);
      // Clean up the created user if restaurant creation fails
      await User.findByIdAndDelete(user._id); 
      
      // If validation error, return the specific message
      if (restaurantError.name === 'ValidationError') {
        const messages = Object.values(restaurantError.errors).map(val => val.message);
        return res.status(400).json({
          success: false,
          error: {
            message: messages.join(', '),
            code: 'VALIDATION_ERROR'
          }
        });
      }
      
      return res.status(500).json({
          success: false,
          error: {
              message: 'Failed to create associated restaurant profile: ' + restaurantError.message,
              code: 'RESTAURANT_CREATION_FAILED'
          }
      });
    }
  } else if (role === 'delivery_rider') {
    // Additional validation for delivery rider
    if (!vehicleType || !licenseNumber || !vehicleRegistrationNumber) {
       await User.findByIdAndDelete(user._id); // Clean up user
      return res.status(400).json({
          success: false,
          error: {
              message: 'Delivery rider details are required',
              code: 'VALIDATION_ERROR'
          }
      });
    }
     // Set delivery rider details
     user.deliveryRiderDetails = {
         vehicleType,
         licenseNumber,
         vehicleRegistrationNumber,
         approved: false // Requires admin approval
     };
     await user.save(); // Save rider details
  }

  // Return success response (user needs to verify email)
  return res.status(201).json({ 
      success: true, 
      message: 'Registration successful. Please check your email to verify your account.',
      requiresOTP: true,
      email: user.email
  });
});

// Verify email with OTP
exports.verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        // Validate input
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Please provide email and OTP',
                    code: 'VALIDATION_ERROR'
                }
            });
        }
        
        // Find user by email
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'NOT_FOUND'
                }
            });
        }
        
        // Check if OTP matches and is not expired
        if (user.emailVerificationOTP !== otp || isOTPExpired(user.emailVerificationOTPExpires)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid or expired OTP',
                    code: 'INVALID_OTP'
                }
            });
        }
        
        // Mark email as verified and clear OTP
        user.isEmailVerified = true;
        user.emailVerificationOTP = null;
        user.emailVerificationOTPExpires = null;
        await user.save();
        
        // Simple success response - always redirect to sign-in
        return res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            redirectToSignIn: true,
            // No token, no user data to prevent auto-login
        });
    } catch (error) {
        console.error('Email verification error:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Server error. Please try again.',
                code: 'SERVER_ERROR'
            }
        });
    }
};

// Resend verification OTP
exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Validate input
        if (!email) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Please provide email',
                    code: 'VALIDATION_ERROR'
                }
            });
        }
        
        // Find user by email
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'NOT_FOUND'
                }
            });
        }
        
        // Check if email is already verified
        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Email is already verified',
                    code: 'ALREADY_VERIFIED'
                }
            });
        }
        
        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = generateOTPExpiry();
        
        // Update user with new OTP
        user.emailVerificationOTP = otp;
        user.emailVerificationOTPExpires = otpExpiry;
        await user.save();
        
        // Send verification email
        await sendVerificationOTP({
            email: user.email,
            otp,
            name: user.name
        });
        
        return res.status(200).json({
            success: true,
            message: 'Verification OTP sent successfully',
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Server error. Please try again.',
                code: 'SERVER_ERROR'
            }
        });
    }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'NOT_FOUND'
                }
            });
        }
        
        return res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    healthCondition: user.healthCondition,
                    isAdmin: user.isAdmin,
                    isRestaurantOwner: user.isRestaurantOwner,
                    isDeliveryStaff: user.isDeliveryStaff,
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Server error. Please try again.',
                code: 'SERVER_ERROR'
            }
        });
    }
}; 
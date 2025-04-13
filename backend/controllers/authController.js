const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendVerificationOTP } = require('../utils/emailService');
const { generateOTP, isOTPExpired, generateOTPExpiry } = require('../utils/otpUtils');

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            isRestaurantOwner: user.isRestaurantOwner,
            isDeliveryStaff: user.isDeliveryStaff
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

        // Check if email is verified
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
        
        // Generate JWT token
        const token = generateToken(user);
        
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
                    isDeliveryStaff: user.isDeliveryStaff
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

// Register new user
exports.register = async (req, res) => {
    try {
        const { name, email, phone, password, healthCondition, role, restaurantName, restaurantAddress, restaurantDescription, panNumber } = req.body;
        
        // Validate input
        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Please provide all required fields',
                    code: 'VALIDATION_ERROR'
                }
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'User with this email already exists',
                    code: 'VALIDATION_ERROR'
                }
            });
        }
        
        // Set user roles based on role parameter
        let isAdmin = false;
        let isRestaurantOwner = false;
        let isDeliveryStaff = false;
        
        if (role === 'restaurant') {
            isRestaurantOwner = true;
            // Additional validation for restaurant owner
            if (!restaurantName || !restaurantAddress || !restaurantDescription) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Restaurant details are required',
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
        } else if (role === 'delivery_rider') {
            isDeliveryStaff = true;
        } else if (role === 'admin') {
            isAdmin = true;
        }
        
        // Generate verification OTP
        const otp = generateOTP();
        const otpExpiry = generateOTPExpiry();
        
        // Create new user
        const user = new User({
            name,
            email,
            phone,
            password,
            healthCondition: healthCondition || 'Healthy',
            isAdmin,
            isRestaurantOwner,
            isDeliveryStaff,
            // Add email verification fields
            isEmailVerified: false,
            emailVerificationOTP: otp,
            emailVerificationOTPExpires: otpExpiry
        });
        
        await user.save();
        
        // If registering as restaurant owner, create restaurant entry (not approved by default)
        if (isRestaurantOwner) {
            try {
                const Restaurant = require('../models/restaurant').Restaurant;
                const newRestaurant = new Restaurant({
                    name: restaurantName,
                    location: restaurantAddress,
                    description: restaurantDescription,
                    owner: user._id,
                    isApproved: false, // Not approved by default
                });
                
                await newRestaurant.save();
                console.log(`Restaurant created for user ${user._id} (awaiting approval)`);
            } catch (restaurantError) {
                console.error('Error creating restaurant:', restaurantError);
                // Continue with registration even if restaurant creation fails
                // We'll handle this case separately
            }
        }
        
        // Send verification email with OTP
        await sendVerificationOTP({
            email: user.email,
            otp,
            name: user.name
        });
        
        // Return response (without token to enforce verification)
        return res.status(201).json({
            success: true,
            message: 'Registration successful! Please verify your email to continue.',
            requiresOTP: true,
            email: user.email
        });
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
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
                message: 'Server error. Please try again.',
                code: 'SERVER_ERROR'
            }
        });
    }
};

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
        
        // Generate token for auto-login after verification
        const token = generateToken(user);
        
        // Return success with user details and token
        return res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    isAdmin: user.isAdmin,
                    isRestaurantOwner: user.isRestaurantOwner,
                    isDeliveryStaff: user.isDeliveryStaff
                },
                token
            }
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
                    isDeliveryStaff: user.isDeliveryStaff
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
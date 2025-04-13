const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendVerificationOTP } = require('../utils/emailService');
const { generateOTP, isOTPExpired, generateOTPExpiry } = require('../utils/otpUtils');
const Restaurant = require('../models/restaurant');

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

// Register new user
exports.register = async (req, res) => {
    try {
        const { 
            firstName, lastName, fullName,
            email, phone, password, address,
            role, healthCondition, 
            restaurantName, restaurantAddress, restaurantDescription, panNumber,
            vehicleType, licenseNumber, vehicleRegistrationNumber
        } = req.body;
        
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
        
        // Validate name fields
        if (!firstName || !lastName) {
            const missingFields = [];
            if (!firstName) missingFields.push('First name is required');
            if (!lastName) missingFields.push('Last name is required');
            
            return res.status(400).json({
                success: false,
                error: {
                    message: missingFields.join(', '),
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
        
        // Generate verification OTP
        const otp = generateOTP();
        const otpExpiry = generateOTPExpiry();
        
        // Create user data object
        const userData = {
            firstName,
            lastName,
            fullName: fullName || `${firstName} ${lastName}`,
            email,
            phone,
            password,
            address,
            role: role || 'customer',
            isEmailVerified: false,
            emailVerificationOTP: otp,
            emailVerificationOTPExpires: otpExpiry
        };
        
        // Add role-specific fields
        if (role === 'customer') {
            userData.healthCondition = healthCondition || 'Healthy';
        } else if (role === 'restaurant') {
            // Additional validation for restaurant owner
            if (!restaurantName || !restaurantAddress || !restaurantDescription || !panNumber) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Restaurant details are required',
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            userData.restaurantDetails = {
                name: restaurantName,
                address: restaurantAddress,
                description: restaurantDescription,
                panNumber,
                approved: false // Requires admin approval
            };
        } else if (role === 'delivery_rider') {
            // Additional validation for delivery rider
            if (!vehicleType || !licenseNumber || !vehicleRegistrationNumber) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Delivery rider details are required',
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            userData.deliveryRiderDetails = {
                vehicleType,
                licenseNumber,
                vehicleRegistrationNumber,
                approved: false // Requires admin approval
            };
        }
        
        // Create user
        const newUser = new User(userData);
        await newUser.save();
        
        // If this is a restaurant user, create a restaurant record as well
        if (role === 'restaurant' && restaurantName) {
            // Create a restaurant entry
            const restaurant = new Restaurant({
                name: restaurantName,
                address: restaurantAddress ? { formatted: restaurantAddress } : {},
                description: restaurantDescription,
                owner: newUser._id,
                isApproved: false,  // Default to not approved
                isActive: true,
                cuisine: userData.restaurantDetails.cuisine || ['General'],
                email: email,
                phone: phone
            });
            
            try {
                await restaurant.save();
                console.log(`Created restaurant record for user ${newUser._id}`);
            } catch (restaurantError) {
                console.error('Error creating restaurant record:', restaurantError);
                // Continue with user creation even if restaurant creation fails
            }
        }
        
        // Send verification email
        await sendVerificationOTP({
            email: newUser.email,
            otp,
            name: newUser.fullName || `${newUser.firstName} ${newUser.lastName}`
        });
        
        // Generate token for auto-login
        const token = generateToken(newUser);
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please verify your email with the OTP sent.',
            data: {
                user: {
                    id: newUser._id,
                    firstName: newUser.firstName,
                    lastName: newUser.lastName,
                    fullName: newUser.fullName || `${newUser.firstName} ${newUser.lastName}`,
                    email: newUser.email,
                    role: newUser.role
                },
                token
            }
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
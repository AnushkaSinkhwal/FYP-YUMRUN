const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
        const { name, email, phone, password, healthCondition } = req.body;
        
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
        
        // Create new user (regular user, not admin)
        const user = new User({
            name,
            email,
            phone,
            password,
            healthCondition: healthCondition || 'Healthy',
            isAdmin: false,
            isRestaurantOwner: false,
            isDeliveryStaff: false
        });
        
        await user.save();
        
        // Generate JWT token
        const token = generateToken(user);
        
        // Return response with user details and token
        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
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
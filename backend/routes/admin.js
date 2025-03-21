const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { auth, isAdmin } = require('../middleware/auth');

// Admin login route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user by email (username is actually the email in this case)
        const user = await User.findOne({ email: username });
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
        
        // Check if user is admin
        if (!user.isAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. Admin rights required.' 
            });
        }
        
        // Verify password
        const isMatch = await user.comparePassword(password);
        
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
                isAdmin: user.isAdmin 
            }, 
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        return res.status(200).json({ 
            success: true, 
            message: 'Login successful', 
            token: token, 
            user: { 
                id: user._id,
                name: user.name,
                email: user.email,
                role: 'admin' 
            } 
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
});

// GET admin dashboard data - protected route
router.get('/dashboard', auth, isAdmin, async (req, res) => {
    try {
        // Get counts for dashboard statistics
        const userCount = await User.countDocuments({ isAdmin: false, isRestaurantOwner: false, isDeliveryStaff: false });
        const ownerCount = await User.countDocuments({ isRestaurantOwner: true });
        
        // Return dashboard data
        res.status(200).json({ 
            success: true,
            data: {
                users: userCount,
                owners: ownerCount,
                // Add more statistics as needed
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// GET all users
router.get('/users', auth, isAdmin, async (req, res) => {
    try {
        const users = await User.find({ isAdmin: false }).select('-password');
        res.status(200).json({ 
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// GET user by ID
router.get('/users/:id', auth, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found'
            });
        }
        
        res.status(200).json({ 
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// PUT update user
router.put('/users/:id', auth, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found'
            });
        }
        
        // Update user properties
        const { name, phone, email, isRestaurantOwner, isDeliveryStaff } = req.body;
        
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (email) user.email = email;
        if (isRestaurantOwner !== undefined) user.isRestaurantOwner = isRestaurantOwner;
        if (isDeliveryStaff !== undefined) user.isDeliveryStaff = isDeliveryStaff;
        
        await user.save();
        
        res.status(200).json({ 
            success: true,
            data: user,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// GET restaurant owners
router.get('/owners', auth, isAdmin, async (req, res) => {
    try {
        const owners = await User.find({ isRestaurantOwner: true }).select('-password');
        res.status(200).json({ 
            success: true,
            data: owners
        });
    } catch (error) {
        console.error('Get owners error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// GET system statistics
router.get('/statistics', auth, isAdmin, async (req, res) => {
    try {
        const userCount = await User.countDocuments({ isAdmin: false });
        const ownerCount = await User.countDocuments({ isRestaurantOwner: true });
        const staffCount = await User.countDocuments({ isDeliveryStaff: true });
        
        res.status(200).json({ 
            success: true,
            data: {
                users: userCount,
                owners: ownerCount,
                staff: staffCount
            }
        });
    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// GET restaurant approval requests
router.get('/restaurant-approvals', auth, isAdmin, (req, res) => {
    res.status(200).json({ message: 'Restaurant approval requests' });
});

// POST approve/reject restaurant
router.post('/restaurant-approvals/:id', auth, isAdmin, (req, res) => {
    res.status(200).json({ message: `Process restaurant approval for ID: ${req.params.id}` });
});

// GET all delivery staff approval requests
router.get('/delivery-staff-approvals', auth, isAdmin, (req, res) => {
    res.status(200).json({ message: 'Delivery staff approval requests' });
});

// POST approve/reject delivery staff
router.post('/delivery-staff-approvals/:id', auth, isAdmin, (req, res) => {
    res.status(200).json({ message: `Process delivery staff approval for ID: ${req.params.id}` });
});

module.exports = router; 
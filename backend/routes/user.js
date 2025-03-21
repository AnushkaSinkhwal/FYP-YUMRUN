const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user'); // Import the User model
const router = express.Router();
const { body, validationResult } = require('express-validator'); // For validation
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth');

// Sign Up Route
router.post(
  '/signup',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('phone').isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[0-9]/).withMessage('Password must contain at least one number')
      .matches(/[^a-zA-Z0-9]/).withMessage('Password must contain at least one special character'),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, email, password, healthCondition } = req.body;

    try {
      // Check if email already exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      // Create a new user
      const newUser = new User({
        name,
        phone,
        email,
        password,
        healthCondition
      });

      // Hash the password before saving
      const salt = await bcrypt.genSalt(10);
      newUser.password = await bcrypt.hash(password, salt);

      // Save the user to the database
      await newUser.save();

      // Send a success response
      res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error });
    }
  }
);

// POST sign up
router.post('/register', async (req, res) => {
    try {
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            healthCondition: req.body.healthCondition || 'Healthy',
            isAdmin: req.body.isAdmin || false,
            isRestaurantOwner: req.body.isRestaurantOwner || false,
            isDeliveryStaff: req.body.isDeliveryStaff || false
        });

        await user.save();

        const token = jwt.sign(
            { 
                id: user.id, 
                isAdmin: user.isAdmin,
                isRestaurantOwner: user.isRestaurantOwner,
                isDeliveryStaff: user.isDeliveryStaff
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                healthCondition: user.healthCondition,
                isAdmin: user.isAdmin,
                isRestaurantOwner: user.isRestaurantOwner,
                isDeliveryStaff: user.isDeliveryStaff
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Validate password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { 
                id: user.id, 
                isAdmin: user.isAdmin,
                isRestaurantOwner: user.isRestaurantOwner,
                isDeliveryStaff: user.isDeliveryStaff
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                healthCondition: user.healthCondition,
                isAdmin: user.isAdmin,
                isRestaurantOwner: user.isRestaurantOwner,
                isDeliveryStaff: user.isDeliveryStaff
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                healthCondition: user.healthCondition,
                isAdmin: user.isAdmin,
                isRestaurantOwner: user.isRestaurantOwner,
                isDeliveryStaff: user.isDeliveryStaff
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT update health details
router.put('/health-details', auth, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { healthCondition: req.body.healthCondition },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                healthCondition: user.healthCondition,
                isAdmin: user.isAdmin,
                isRestaurantOwner: user.isRestaurantOwner,
                isDeliveryStaff: user.isDeliveryStaff
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const updates = {
            name: req.body.name,
            email: req.body.email
        };

        // If password is provided, update it
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(req.body.password, salt);
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                healthCondition: user.healthCondition,
                isAdmin: user.isAdmin,
                isRestaurantOwner: user.isRestaurantOwner,
                isDeliveryStaff: user.isDeliveryStaff
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

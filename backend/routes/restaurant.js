const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Placeholder route for getting all restaurants
router.get('/', async (req, res) => {
  try {
    // This is a placeholder - would normally fetch from database
    res.status(200).json({
      success: true,
      message: 'Restaurant routes working',
      data: []
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export the router
module.exports = router; 
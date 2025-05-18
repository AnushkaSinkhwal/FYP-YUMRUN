const express = require('express');
const router = express.Router();
const Setting = require('../models/setting');

/**
 * @route   GET /api/settings
 * @desc    Get public site settings
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 
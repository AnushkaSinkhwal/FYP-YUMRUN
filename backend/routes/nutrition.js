const express = require('express');
const router = express.Router();

// GET nutritional info for a food item
router.get('/food/:id', (req, res) => {
    res.status(200).json({ message: `Nutritional info for food ID: ${req.params.id}` });
});

// POST analyze ingredients for nutritional value
router.post('/analyze', (req, res) => {
    res.status(200).json({ message: 'Analyze ingredients endpoint' });
});

// GET nutritional info for a meal (combination of items)
router.get('/meal/:id', (req, res) => {
    res.status(200).json({ message: `Nutritional info for meal ID: ${req.params.id}` });
});

// POST calculate nutritional value for custom meal
router.post('/calculate', (req, res) => {
    res.status(200).json({ message: 'Calculate custom meal nutrition endpoint' });
});

module.exports = router; 
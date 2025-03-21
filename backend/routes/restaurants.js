const express = require('express');
const router = express.Router();

// GET all restaurants
router.get('/', (req, res) => {
    res.status(200).json({ message: 'Restaurant list endpoint' });
});

// GET restaurant by ID
router.get('/:id', (req, res) => {
    res.status(200).json({ message: `Restaurant details for ID: ${req.params.id}` });
});

// POST create new restaurant
router.post('/', (req, res) => {
    res.status(201).json({ message: 'Create restaurant endpoint' });
});

// PUT update restaurant
router.put('/:id', (req, res) => {
    res.status(200).json({ message: `Update restaurant with ID: ${req.params.id}` });
});

// DELETE restaurant
router.delete('/:id', (req, res) => {
    res.status(200).json({ message: `Delete restaurant with ID: ${req.params.id}` });
});

// GET restaurant menu
router.get('/:id/menu', (req, res) => {
    res.status(200).json({ message: `Menu for restaurant ID: ${req.params.id}` });
});

module.exports = router; 
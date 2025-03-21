const express = require('express');
const router = express.Router();
const { Payment } = require('../models/payment');
const { Order } = require('../models/order');
const { auth } = require('../middleware/auth');

// GET all payments (admin only)
router.get('/', auth, async (req, res) => {
    try {
        const payments = await Payment.find().populate('order');
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET payment by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id).populate('order');
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET payments by order ID
router.get('/order/:orderId', auth, async (req, res) => {
    try {
        const payments = await Payment.find({ order: req.params.orderId });
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST process a new payment
router.post('/', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.body.order);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const payment = new Payment({
            amount: req.body.amount,
            payment_method: req.body.payment_method,
            order: req.body.order,
            status: 'Pending'
        });

        const savedPayment = await payment.save();
        
        // Update order payment status
        await Order.findByIdAndUpdate(req.body.order, {
            isPaid: true,
            paidAt: Date.now()
        });

        res.status(201).json(savedPayment);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT update payment status
router.put('/:id', auth, async (req, res) => {
    try {
        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            {
                status: req.body.status
            },
            { new: true }
        );

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router; 
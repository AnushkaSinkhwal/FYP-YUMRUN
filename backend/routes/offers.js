const express = require('express');
const router = express.Router();
const Offer = require('../models/offer');
const MenuItem = require('../models/menuItem');
const { auth, isRestaurantOwner } = require('../middleware/auth');

// Get all offers for the authenticated restaurant owner
router.get('/restaurant', auth, isRestaurantOwner, async (req, res) => {
    try {
        const offers = await Offer.find({ restaurant: req.user.userId })
            .populate('menuItems', 'item_name item_price image')
            .sort({ created: -1 });
        
        return res.status(200).json({
            success: true,
            data: offers
        });
    } catch (error) {
        console.error('Error fetching restaurant offers:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// Get a specific offer by ID
router.get('/:id', auth, isRestaurantOwner, async (req, res) => {
    try {
        const offer = await Offer.findOne({ 
            _id: req.params.id,
            restaurant: req.user.userId
        }).populate('menuItems', 'item_name item_price image');
        
        if (!offer) {
            return res.status(404).json({
                success: false,
                message: 'Offer not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: offer
        });
    } catch (error) {
        console.error('Error fetching offer:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// Create a new offer
router.post('/', auth, isRestaurantOwner, async (req, res) => {
    try {
        const {
            title,
            description,
            offerType,
            discountPercentage,
            startDate,
            endDate,
            isActive,
            appliesTo,
            menuItems
        } = req.body;
        
        // Validate required fields
        if (!title || !description || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }
        
        // Validate date ranges
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        if (endDateObj < startDateObj) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }
        
        // Validate menuItems if appliesTo is 'Selected Items'
        if (appliesTo === 'Selected Items' && (!menuItems || menuItems.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'Please select at least one menu item'
            });
        }
        
        // Create new offer
        const offer = new Offer({
            title,
            description,
            offerType: offerType || 'Discount',
            discountPercentage: discountPercentage || 0,
            startDate: startDateObj,
            endDate: endDateObj,
            isActive: isActive !== undefined ? isActive : true,
            appliesTo: appliesTo || 'All Menu',
            menuItems: menuItems || [],
            restaurant: req.user.userId
        });
        
        const savedOffer = await offer.save();
        
        // Populate menu items
        const populatedOffer = await Offer.findById(savedOffer._id)
            .populate('menuItems', 'item_name item_price image');
        
        return res.status(201).json({
            success: true,
            message: 'Offer created successfully',
            data: populatedOffer
        });
    } catch (error) {
        console.error('Error creating offer:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// Update an offer
router.put('/:id', auth, isRestaurantOwner, async (req, res) => {
    try {
        const {
            title,
            description,
            offerType,
            discountPercentage,
            startDate,
            endDate,
            isActive,
            appliesTo,
            menuItems
        } = req.body;
        
        // Find offer first to ensure it belongs to the authenticated restaurant
        const existingOffer = await Offer.findOne({
            _id: req.params.id,
            restaurant: req.user.userId
        });
        
        if (!existingOffer) {
            return res.status(404).json({
                success: false,
                message: 'Offer not found or you do not have permission to edit it'
            });
        }
        
        // Validate required fields
        if (!title || !description || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }
        
        // Validate date ranges
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        if (endDateObj < startDateObj) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }
        
        // Validate menuItems if appliesTo is 'Selected Items'
        if (appliesTo === 'Selected Items' && (!menuItems || menuItems.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'Please select at least one menu item'
            });
        }
        
        // Update offer
        const updatedOffer = await Offer.findByIdAndUpdate(
            req.params.id,
            {
                title,
                description,
                offerType: offerType || 'Discount',
                discountPercentage: discountPercentage || 0,
                startDate: startDateObj,
                endDate: endDateObj,
                isActive: isActive !== undefined ? isActive : existingOffer.isActive,
                appliesTo: appliesTo || 'All Menu',
                menuItems: menuItems || []
            },
            { new: true }
        ).populate('menuItems', 'item_name item_price image');
        
        return res.status(200).json({
            success: true,
            message: 'Offer updated successfully',
            data: updatedOffer
        });
    } catch (error) {
        console.error('Error updating offer:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// Toggle offer active status
router.patch('/:id/toggle-active', auth, isRestaurantOwner, async (req, res) => {
    try {
        const offer = await Offer.findOne({
            _id: req.params.id,
            restaurant: req.user.userId
        });
        
        if (!offer) {
            return res.status(404).json({
                success: false,
                message: 'Offer not found or you do not have permission to modify it'
            });
        }
        
        offer.isActive = !offer.isActive;
        await offer.save();
        
        return res.status(200).json({
            success: true,
            message: `Offer ${offer.isActive ? 'activated' : 'deactivated'} successfully`,
            data: {
                id: offer._id,
                isActive: offer.isActive
            }
        });
    } catch (error) {
        console.error('Error toggling offer status:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// Delete an offer
router.delete('/:id', auth, isRestaurantOwner, async (req, res) => {
    try {
        const offer = await Offer.findOne({
            _id: req.params.id,
            restaurant: req.user.userId
        });
        
        if (!offer) {
            return res.status(404).json({
                success: false,
                message: 'Offer not found or you do not have permission to delete it'
            });
        }
        
        await Offer.findByIdAndDelete(req.params.id);
        
        return res.status(200).json({
            success: true,
            message: 'Offer deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting offer:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// Get all active offers for a specific restaurant (public)
router.get('/public/restaurant/:id', async (req, res) => {
    try {
        const today = new Date();
        
        const offers = await Offer.find({
            restaurant: req.params.id,
            isActive: true,
            startDate: { $lte: today },
            endDate: { $gte: today }
        }).populate('menuItems', 'item_name item_price image');
        
        return res.status(200).json({
            success: true,
            data: offers
        });
    } catch (error) {
        console.error('Error fetching public restaurant offers:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

module.exports = router; 
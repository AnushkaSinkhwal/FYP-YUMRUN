const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
require('dotenv').config();  // Ensure you're loading sensitive data from environment variables
const { Category } = require('../models/category');


cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categoryList = await Category.find();
        if (!categoryList) {
            return res.status(404).json({ success: false, message: "No categories found." });
        }
        res.status(200).json(categoryList);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get category by ID
router.get('/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'The Category with the given ID was not found.' });
        }
        res.status(200).json(category);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Create category
router.post('/create', async (req, res) => {
    try {
        // Dynamically import p-limit
        const { default: pLimit } = await import('p-limit');
        const limit = pLimit(2);  // Set concurrency limit to 2

        const imagesToUpload = req.body.images.map((image) => {
            return limit(async () => {
                const result = await cloudinary.uploader.upload(image);
                return result;
            });
        });

        const uploadStatus = await Promise.all(imagesToUpload);
        const imgurl = uploadStatus.map((item) => item.secure_url);

        if (!uploadStatus) {
            return res.status(500).json({
                error: "Images could not be uploaded!",
                status: false
            });
        }

        let category = new Category({
            name: req.body.name,
            images: imgurl,
            color: req.body.color
        });

        if (!category) {
            return res.status(500).json({
                message: 'Category cannot be created!',
                success: false
            });
        }

        category = await category.save();
        res.status(201).json(category);

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Delete category by ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedCategory = await Category.findByIdAndDelete(req.params.id);
        if (!deletedCategory) {
            return res.status(404).json({
                message: 'Category not found!',
                success: false
            });
        }
        res.status(200).json({
            success: true,
            message: 'Category Deleted!'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update category by ID
router.put('/:id', async (req, res) => {
    try {
        // Dynamically import p-limit
        const { default: pLimit } = await import('p-limit');
        const limit = pLimit(2);  // Set concurrency limit to 2

        const imagesToUpload = req.body.images.map((image) => {
            return limit(async () => {
                const result = await cloudinary.uploader.upload(image);
                return result;
            });
        });

        const uploadStatus = await Promise.all(imagesToUpload);
        const imgurl = uploadStatus.map((item) => item.secure_url);

        if (!uploadStatus) {
            return res.status(500).json({
                error: "Images could not be uploaded!",
                status: false
            });
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                images: imgurl,
                color: req.body.color
            },
            { new: true }
        );

        if (!category) {
            return res.status(500).json({
                message: 'Category cannot be updated!',
                success: false
            });
        }

        res.status(200).json(category);

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});



module.exports = router;

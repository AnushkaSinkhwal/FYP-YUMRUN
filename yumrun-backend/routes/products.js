const { Category } = require('../models/category.js');
const { Product } = require('../models/products.js');
const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2; // Make sure cloudinary is required

router.get('/', async (req, res) => {
    try {
        const productList = await Product.find().populate("category");
        if (!productList) {
            return res.status(404).json({ success: false, message: "No products found." });
        }
        res.status(200).json(productList);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'The Product with the given ID was not found.' });
        }
        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/create', async (req, res) => {
    const category = await Category.findById(req.body.category);
    if (!category) {
        return res.status(404).send("Invalid Category!");
    }

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

        let product = new Product({
            name: req.body.name,
            description: req.body.description,  // Corrected typo here
            images: imgurl,
            brand: req.body.brand,
            category: req.body.category,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
        });

        product = await product.save();
        if (!product) {
            return res.status(500).json({
                error: "Failed to save product",
                success: false
            });
        }
        res.status(201).json(product);
    } catch (err) {
        res.status(500).json({
            error: err.message,
            success: false
        });
    }
});

// Delete category by ID
router.delete('/:id', async (req, res) => {
    try {
        const deleteProduct= await Product.findByIdAndDelete(req.params.id);
        if (!deleteProduct) {
            return res.status(404).json({
                message: 'product not found!',
                success: false
            });
        }
        res.status(200).send({
            success: true,
            message: 'Product Deleted!'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
router.put('/:id', async (req, res) => {
    try {
        // Dynamically import p-limit
        const { default: pLimit } = await import('p-limit');
        const limit = pLimit(2);  // Set concurrency limit to 2

        let imgurl = [];
        if (req.body.images && req.body.images.length > 0) {
            const imagesToUpload = req.body.images.map((image) => {
                return limit(async () => {
                    const result = await cloudinary.uploader.upload(image);
                    return result;
                });
            });

            const uploadStatus = await Promise.all(imagesToUpload);
            imgurl = uploadStatus.map((item) => item.secure_url);

            if (!uploadStatus) {
                return res.status(500).json({
                    error: "Images could not be uploaded!",
                    status: false
                });
            }
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                description: req.body.description,  // Corrected typo here
                images: imgurl.length > 0 ? imgurl : req.body.images,  // Use existing images if no new ones are uploaded
                restaurant: req.body.brand,
                price:req.body.price,
                oldPrice:req.body.oldPrice,
                category: req.body.category,
                rating: req.body.rating,
                isFeatured: req.body.isFeatured,
            },
            { new: true }
        );

        if (!product) {
            return res.status(500).json({
                message: 'Product cannot be updated!',
                success: false
            });
        }

        res.status(200).json(product);  // Return updated product

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


module.exports = router;

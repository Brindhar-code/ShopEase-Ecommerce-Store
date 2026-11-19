const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// Get Wishlist
router.get("/", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate("wishlist");

        res.json(user.wishlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add Product to Wishlist
router.post("/:productId", auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        const user = await User.findById(req.user.id);

        if (user.wishlist.includes(product._id)) {
            return res.status(400).json({
                message: "Product already in wishlist"
            });
        }

        user.wishlist.push(product._id);
        await user.save();

        res.json({
            message: "Product added to wishlist",
            wishlist: user.wishlist
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Remove Product from Wishlist
router.delete("/:productId", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        user.wishlist = user.wishlist.filter(
            id => id.toString() !== req.params.productId
        );

        await user.save();

        res.json({
            message: "Product removed from wishlist"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const router = express.Router();

// Add product to cart
router.post("/:userId", async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        const qty = Number(quantity) || 1;

        if (qty < 1 || !Number.isInteger(qty)) {
            return res.status(400).json({
                message: "Invalid quantity"
            });
        }

        if (qty > product.stock) {
            return res.status(400).json({
                message: "Insufficient stock"
            });
        }

        let cart = await Cart.findOne({ user: req.params.userId });

        if (!cart) {
            cart = new Cart({
                user: req.params.userId,
                items: []
            });
        }

        const item = cart.items.find(
            i => i.product.toString() === productId
        );

        if (item) {
            if (item.quantity + qty > product.stock) {
                return res.status(400).json({
                    message: "Insufficient stock"
                });
            }
            item.quantity += qty;
        } else {
            cart.items.push({
                product: productId,
                quantity: qty
            });
        }

        await cart.save();

        res.status(200).json({
            message: "Product added to cart",
            cart
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// View cart
router.get("/:userId", async (req, res) => {
    try {
        const cart = await Cart.findOne({
            user: req.params.userId
        }).populate("items.product");

        res.status(200).json(cart || { items: [] });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update quantity
router.patch("/:userId/:productId", async (req, res) => {
    try {
        const { quantity } = req.body;

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                message: "Invalid quantity"
            });
        }

        const product = await Product.findById(req.params.productId);

        if (!product || quantity > product.stock) {
            return res.status(400).json({
                message: "Invalid product or insufficient stock"
            });
        }

        const cart = await Cart.findOne({
            user: req.params.userId
        });

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found"
            });
        }

        const item = cart.items.find(
            i => i.product.toString() === req.params.productId
        );

        if (!item) {
            return res.status(404).json({
                message: "Product not in cart"
            });
        }

        item.quantity = quantity;
        await cart.save();

        res.json({
            message: "Cart updated successfully",
            cart
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Remove product from cart
router.delete("/:userId/:productId", async (req, res) => {
    try {
        const cart = await Cart.findOne({
            user: req.params.userId
        });

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found"
            });
        }

        cart.items = cart.items.filter(
            i => i.product.toString() !== req.params.productId
        );

        await cart.save();

        res.json({
            message: "Product removed from cart",
            cart
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Clear entire cart after successful order
router.delete("/:userId", async (req, res) => {
    try {
        const cart = await Cart.findOne({
            user: req.params.userId
        });

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found"
            });
        }

        cart.items = [];
        await cart.save();

        res.json({
            message: "Cart cleared successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;
const express = require("express");
const Order = require("../models/Order");

const router = express.Router();

// Place a new order
router.post("/", async (req, res) => {
    try {
        const {
            user,
            products,
            totalAmount,
            shippingAddress,
            paymentMethod
        } = req.body;

        if (!user || !products || products.length === 0 ||
            !totalAmount || !shippingAddress) {
            return res.status(400).json({
                message: "Please provide all order details"
            });
        }

        const order = new Order({
            user,
            products,
            totalAmount,
            shippingAddress,
            paymentMethod
        });

        const savedOrder = await order.save();

        res.status(201).json({
            message: "Order placed successfully",
            order: savedOrder
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});

// Get all orders for a user
router.get("/:userId", async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.params.userId
        }).populate("products.product");

        res.status(200).json(orders);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;
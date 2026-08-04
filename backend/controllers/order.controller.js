import mongoose from "mongoose";
import Order from "../models/orders.model.js";
import OrderItem from "../models/orderItem.model.js";
import Customer from "../models/customer.model.js";
import Product from "../models/products.model.js";
import Idempotency from "../models/idempotency.model.js";

/**
 * Create a new order
 * @route POST /api/orders
 */
export const createOrder = async (req, res) => {
    try {
        const { customer_id, products } = req.body;

        // 1. Validate Request Structure
        if (!customer_id || !mongoose.Types.ObjectId.isValid(customer_id)) {
            await handleFailure(req, "Invalid or missing customer_id");
            return res.status(400).json({
                success: false,
                message: "A valid customer_id is required",
            });
        }

        if (!products || !Array.isArray(products) || products.length === 0) {
            await handleFailure(req, "Products array is empty or invalid");
            return res.status(400).json({
                success: false,
                message: "Products array is required and cannot be empty",
            });
        }

        // Validate each item in the products array
        for (const item of products) {
            if (!item.product_id || !mongoose.Types.ObjectId.isValid(item.product_id)) {
                await handleFailure(req, "Invalid or missing product_id in products list");
                return res.status(400).json({
                    success: false,
                    message: "Each product must have a valid product_id",
                });
            }
            if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity < 1) {
                await handleFailure(req, "Invalid product quantity");
                return res.status(400).json({
                    success: false,
                    message: "Product quantity must be an integer of 1 or more",
                });
            }
        }

        // 2. Validate Customer Exists
        const customer = await Customer.findById(customer_id);
        if (!customer) {
            await handleFailure(req, "Customer not found");
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        // 4. Calculate Total Amount & Validate Products
        const productIds = products.map(p => p.product_id);
        
        // Fetch all requested products
        const dbProducts = await Product.find({ _id: { $in: productIds } });
        
        // Create lookup map
        const productMap = {};
        dbProducts.forEach(p => {
            productMap[p._id.toString()] = p;
        });

        // Verify that all requested products were found in the database
        for (const item of products) {
            if (!productMap[item.product_id.toString()]) {
                await handleFailure(req, `Product not found: ${item.product_id}`);
                return res.status(404).json({
                    success: false,
                    message: `Product with ID ${item.product_id} not found`,
                });
            }
        }

        // Calculate subtotals and total amount
        let total_amt = 0;
        const orderItemsData = [];

        for (const item of products) {
            const product = productMap[item.product_id.toString()];
            const subtotal = item.quantity * product.amount;
            total_amt += subtotal;

            orderItemsData.push({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: product.amount,
                subtotal: subtotal
            });
        }

        // 7. Create "processing" record in orders status and payment status as pending
        const order = new Order({
            customer_id,
            total_amt,
            status: "processing",
            payment_status: "pending",
        });

        await order.save();

        // Save order items associated with the order
        const finalOrderItems = orderItemsData.map(item => ({
            ...item,
            order_id: order._id
        }));

        await OrderItem.insertMany(finalOrderItems);

        // 11. Update Idempotency Record
        const responseBody = {
            success: true,
            order_id: order._id,
            total_amt: total_amt
        };

        if (req.idempotencyRecord) {
            await Idempotency.findByIdAndUpdate(req.idempotencyRecord._id, {
                state: "completed",
                order_id: order._id,
                status_code: 201,
                response_body: responseBody
            });
        }

        // 12. Return order_id, total amount
        return res.status(201).json(responseBody);

    } catch (error) {
        console.error("Error in createOrder controller:", error);
        await handleFailure(req, "Internal exception in createOrder");
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Utility function to mark idempotency record as failed in case of validation or system errors
 */
const handleFailure = async (req, errorMsg) => {
    if (req.idempotencyRecord) {
        try {
            // Option: Mark as failed or delete it.
            // Since we want client retries to succeed cleanly, we delete the record.
            // This is safer than keeping a failed state where a subsequent request might be blocked.
            await Idempotency.deleteOne({ _id: req.idempotencyRecord._id });
        } catch (err) {
            console.error("Failed to delete/fail idempotency record:", err);
        }
    }
};

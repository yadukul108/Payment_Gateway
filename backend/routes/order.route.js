import express from "express";
import { createOrder } from "../controllers/order.controller.js";
import { checkIdempotency } from "../middlewares/idempotency.middleware.js";

const router = express.Router();

// Route: POST /api/orders
// Applies the idempotency check middleware before order creation controller
router.post("/", checkIdempotency, createOrder);

export default router;

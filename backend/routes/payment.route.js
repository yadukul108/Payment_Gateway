import express from "express";
import { createPayment, verifyPayment, handleWebhook } from "../controllers/payments.controller.js";

const router = express.Router();

// Route: POST /api/payments/create
router.post("/create", createPayment);

// Route: POST /api/payments/verify
router.post("/verify", verifyPayment);

// Route: POST /api/payments/webhook
router.post("/webhook", handleWebhook);

export default router;

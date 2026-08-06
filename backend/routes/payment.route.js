import express from "express";
import { createPayment, verifyPayment } from "../controllers/payments.controller.js";

const router = express.Router();

// Route: POST /api/payments/create
router.post("/create", createPayment);

// Route: POST /api/payments/verify
router.post("/verify", verifyPayment);

export default router;

import express from "express";
import { createPayment } from "../controllers/payments.controller.js";

const router = express.Router();

// Route: POST /api/payments/create
router.post("/create", createPayment);

export default router;

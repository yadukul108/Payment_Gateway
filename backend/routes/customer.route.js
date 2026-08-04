import express from "express";
import { createCustomer } from "../controllers/customer.controller.js";

const router = express.Router();

// Route: POST /api/customers
router.post("/", createCustomer);

export default router;

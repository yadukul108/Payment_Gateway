import mongoose from "mongoose";
import { getRazorpayClient } from "../config/razorpay.js";
import Order from "../models/orders.model.js";
import Payment from "../models/payments.model.js";
import PaymentEvent from "../models/paymentsEvents.model.js";

/**
 * Create a payment order on Razorpay and save state locally
 * @route POST /api/payments/create
 */
export const createPayment = async (req, res) => {
  try {
    const { order_id } = req.body;

    // 1. Validate Request Input
    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: "order_id is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(order_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order_id format",
      });
    }

    // 2. Fetch Order from Database
    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // 3. Check if order is already paid
    if (order.payment_status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Order has already been paid",
      });
    }

    // 4. Calculate Amount in Paise (INR only)
    const amountInRupees = order.total_amt;
    const amountInPaise = Math.round(amountInRupees * 100);

    // 5. Create Razorpay Order
    let razorpayOrder;
    try {
      const razorpay = getRazorpayClient();
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_order_${order._id.toString()}`,
      });
    } catch (rzpError) {
      console.error("Razorpay order creation failed:", rzpError);
      return res.status(502).json({
        success: false,
        message: "Failed to create order with Razorpay gateway",
        details: rzpError.message,
      });
    }

    // 6. Create Payment row in database
    const payment = new Payment({
      order_id: order._id,
      customer_id: order.customer_id,
      gateway_order_id: razorpayOrder.id,
      amount: amountInRupees,
      status: "created",
    });
    await payment.save();

    // 7. Create PaymentEvent (created) row in database
    const paymentEvent = new PaymentEvent({
      payment_id: payment._id,
      event_type: "created",
      gateway_event_id: null,
      payload: razorpayOrder,
    });
    await paymentEvent.save();

    // 8. Return response to frontend
    return res.status(201).json({
      success: true,
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount, // in paise
      currency: razorpayOrder.currency,
      razorpay_key: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error) {
    console.error("Error in createPayment controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

import crypto from "crypto";
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

/**
 * Verify Razorpay payment signature, update payment and order tables, log the captured event
 * @route POST /api/payments/verify
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    // 1. Validate Request Payload
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "razorpay_payment_id, razorpay_order_id, and razorpay_signature are required",
      });
    }

    // 2. Cryptographically Verify Signature
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(text)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature verification failed",
      });
    }

    // 3. Find the Payment row using gateway_order_id
    const payment = await Payment.findOne({ gateway_order_id: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found for the given razorpay_order_id",
      });
    }

    // 4. Update Payment record status
    if (payment.status !== "captured") {
      payment.gateway_payment_id = razorpay_payment_id;
      payment.status = "captured";
      await payment.save();
    }

    // 5. Update Order record status
    const order = await Order.findById(payment.order_id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order associated with payment not found",
      });
    }

    if (order.payment_status !== "paid") {
      order.payment_status = "paid";
      order.status = "completed";
      order.paid_at = new Date();
      await order.save();
    }

    // 6. Insert PaymentEvent (captured)
    const paymentEvent = new PaymentEvent({
      payment_id: payment._id,
      event_type: "captured",
      gateway_event_id: razorpay_payment_id,
      payload: {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
      },
    });
    await paymentEvent.save();

    // 7. Return success response
    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
    });

  } catch (error) {
    console.error("Error in verifyPayment controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during payment verification",
    });
  }
};

/**
 * Handle Webhook events sent by Razorpay
 * @route POST /api/payments/webhook
 */
export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: "Missing x-razorpay-signature header",
      });
    }

    // 1. Verify Webhook Signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.rawBody || "")
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature verification failed",
      });
    }

    const { event, payload } = req.body;
    if (!event || !payload) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook payload structure",
      });
    }

    // 2. We only care about payments-related events
    const paymentData = payload.payment?.entity;
    if (!paymentData) {
      return res.status(200).json({
        success: true,
        message: "Event ignored: no payment entity",
      });
    }

    const razorpay_order_id = paymentData.order_id;
    const razorpay_payment_id = paymentData.id;

    if (!razorpay_order_id) {
      return res.status(200).json({
        success: true,
        message: "Event ignored: missing order_id",
      });
    }

    // 3. Find Payment in DB
    const payment = await Payment.findOne({ gateway_order_id: razorpay_order_id });
    if (!payment) {
      console.warn(`Payment record not found for webhook order_id: ${razorpay_order_id}`);
      return res.status(200).json({
        success: true,
        message: `Payment record not found for order ${razorpay_order_id}`,
      });
    }

    // 4. Log Webhook Event
    const paymentEvent = new PaymentEvent({
      payment_id: payment._id,
      event_type: "webhook_received",
      gateway_event_id: req.headers["x-razorpay-event-id"] || razorpay_payment_id,
      payload: req.body,
    });
    await paymentEvent.save();

    // 5. Update statuses based on event type
    if (event === "payment.captured") {
      // Update Payment
      if (payment.status !== "captured") {
        payment.gateway_payment_id = razorpay_payment_id;
        payment.status = "captured";
        await payment.save();
      }

      // Update Order
      const order = await Order.findById(payment.order_id);
      if (order && order.payment_status !== "paid") {
        order.payment_status = "paid";
        order.status = "completed";
        order.paid_at = new Date();
        await order.save();
      }
    } else if (event === "payment.failed") {
      // Update Payment to failed
      if (payment.status !== "captured" && payment.status !== "failed") {
        payment.status = "failed";
        await payment.save();
      }

      // Update Order to failed
      const order = await Order.findById(payment.order_id);
      if (order && order.payment_status !== "paid" && order.payment_status !== "failed") {
        order.payment_status = "failed";
        await order.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
    });

  } catch (error) {
    console.error("Error handling webhook:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during webhook handling",
    });
  }
};

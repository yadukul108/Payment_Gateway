import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    gateway_payment_id: {
      type: String,
      default: null,
    },
    gateway_order_id: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "created",
        "authorized",
        "captured",
        "failed",
        "refunded",
      ],
      default: "created",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
import mongoose from "mongoose";

const paymentEventSchema = new mongoose.Schema(
  {
    payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    event_type: {
      type: String,
      required: true,
      enum: [
        "created",
        "authorized",
        "captured",
        "failed",
        "refunded",
        "webhook_received",
      ],
    },
    gateway_event_id: {
      type: String,
      default: null,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

const PaymentEvent = mongoose.model("PaymentEvent", paymentEventSchema);

export default PaymentEvent;
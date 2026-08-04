import mongoose from "mongoose";

const idempotencySchema = new mongoose.Schema(
  {
    idempotency_key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    request_hash: {
      type: String,
      required: true,
    },

    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    response_body: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    status_code: {
      type: Number,
      default: null,
    },

    state: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },

    expiry_date: { // deletes when expiry date is reached
      type: Date,
      required: true,
      expires: 0, // MongoDB TTL index
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

const Idempotency = mongoose.model("Idempotency", idempotencySchema);

export default Idempotency;
import Razorpay from "razorpay";

let razorpayInstance = null;

/**
 * Returns a lazily initialized Razorpay client instance.
 * This avoids ES module import ordering conflicts with dotenv config.
 */
export const getRazorpayClient = () => {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "mock_key",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "mock_secret",
    });
  }
  return razorpayInstance;
};

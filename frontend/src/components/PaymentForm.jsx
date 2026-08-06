import React, { useState, useEffect } from "react";

export default function PaymentForm({ orderId, amount, onLog, onNotify, backendUrl, onPaymentSuccess }) {
  const [localOrderId, setLocalOrderId] = useState(orderId || "");
  const [localAmount, setLocalAmount] = useState(amount || "");
  const [rzpPayload, setRzpPayload] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sync prop changes to local state
  useEffect(() => {
    if (orderId) setLocalOrderId(orderId);
    if (amount) setLocalAmount(amount);
  }, [orderId, amount]);

  const handleInitPayment = async () => {
    if (!localOrderId.trim()) {
      onLog("Validation Error", "Order ID is required.", "error");
      return;
    }

    setLoading(true);
    onLog("Request: POST /api/payments/create", { order_id: localOrderId.trim() }, "request");

    try {
      const res = await fetch(`${backendUrl}/payments/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: localOrderId.trim() }),
      });

      const data = await res.json();
      onLog(`Response: POST /api/payments/create [Status: ${res.status}]`, data, res.ok ? "response" : "error");

      if (res.ok && data.success) {
        setRzpPayload(data);
        onNotify("RZP Order Created", `ID: ${data.razorpay_order_id}`, true);
      } else {
        setRzpPayload(null);
        onNotify("Payment Init Failed", data.message || "Failed to init payment", false);
      }
    } catch (err) {
      onLog("Network Error", err.message, "error");
      onNotify("Network Error", "Unable to reach server", false);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCheckout = () => {
    if (!rzpPayload) {
      onLog("Error", "No active Razorpay order initialized.", "error");
      return;
    }

    onLog("Opening Razorpay Modal...", {
      key: rzpPayload.razorpay_key,
      amount: rzpPayload.amount,
      currency: rzpPayload.currency,
      order_id: rzpPayload.razorpay_order_id
    }, "info");

    const options = {
      key: rzpPayload.razorpay_key,
      amount: rzpPayload.amount,
      currency: rzpPayload.currency,
      name: "Developer Store",
      description: "Test Purchase Transaction",
      order_id: rzpPayload.razorpay_order_id,
      handler: async function (response) {
        onLog("Razorpay Handler Success Callback Triggered", response, "info");

        // Verify the payment
        const verifyPayload = {
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature
        };

        onLog("Request: POST /api/payments/verify", verifyPayload, "request");

        try {
          const verifyRes = await fetch(`${backendUrl}/payments/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(verifyPayload),
          });

          const verifyData = await verifyRes.json();
          onLog(`Response: POST /api/payments/verify [Status: ${verifyRes.status}]`, verifyData, verifyRes.ok ? "response" : "error");

          if (verifyRes.ok && verifyData.success) {
            onNotify("Verification Succeeded", "Payment Captured & Saved!");
            setRzpPayload(null);
            onPaymentSuccess();
          } else {
            onNotify("Verification Failed", verifyData.message || "Could not verify signature", false);
          }
        } catch (err) {
          onLog("Network Error during verification", err.message, "error");
          onNotify("Network Error", "Verification call failed", false);
        }
      },
      prefill: {
        name: "Test User",
        email: "testuser@example.com",
        contact: "9999999999"
      },
      notes: {
        address: "Developer Headquarters"
      },
      theme: {
        color: "#64ffda"
      }
    };

    if (window.Razorpay) {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        onLog("Razorpay Payment Failed Callback", response.error, "error");
        onNotify("Payment Failed", response.error.description, false);
      });
      rzp.open();
    } else {
      onLog("Error", "Razorpay Checkout script is not loaded.", "error");
      onNotify("Script Error", "Razorpay checkout script not found", false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span>💳</span> Initiate Payment & Checkout
        </div>
        <div className="card-step">Step 3 & 4</div>
      </div>
      <div>
        <div className="form-group">
          <label htmlFor="payment-order-id">Order ID</label>
          <input
            type="text"
            id="payment-order-id"
            className="form-control"
            placeholder="Order ID from Step 2"
            value={localOrderId}
            onChange={(e) => setLocalOrderId(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="payment-amount">Order Total Amount</label>
          <input
            type="text"
            id="payment-amount"
            className="form-control"
            placeholder="Calculated Total"
            value={localAmount ? `₹${localAmount}` : ""}
            readOnly
          />
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            type="button"
            className="btn"
            style={{ flex: 1 }}
            onClick={handleInitPayment}
            disabled={loading}
          >
            {loading ? "Initializing..." : "1. Create RZP Order"}
          </button>
          <button
            type="button"
            className="btn btn-blue"
            style={{ flex: 1 }}
            onClick={handleOpenCheckout}
            disabled={!rzpPayload}
          >
            2. Open Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

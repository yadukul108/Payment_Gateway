import React, { useState } from "react";

export default function OrderForm({ customerId, onOrderCreated, onLog, onNotify, backendUrl }) {
  const [localCustomerId, setLocalCustomerId] = useState(customerId || "");
  const [productId, setProductId] = useState("6a723f3aa06a4340b0eb721f"); // Laptop ID
  const [quantity, setQuantity] = useState(2);
  const [loading, setLoading] = useState(false);

  // Sync prop changes to local state
  React.useEffect(() => {
    if (customerId) {
      setLocalCustomerId(customerId);
    }
  }, [customerId]);

  const productsList = [
    { id: "6a723f3aa06a4340b0eb721f", name: "Laptop", price: 1000 },
    { id: "6a723f3aa06a4340b0eb721e", name: "Smartphone (Demo)", price: 500 }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!localCustomerId.trim()) {
      onLog("Validation Error", "Customer ID is required.", "error");
      return;
    }

    setLoading(true);
    const payload = {
      customer_id: localCustomerId.trim(),
      products: [
        { product_id: productId, quantity: parseInt(quantity) }
      ]
    };

    onLog("Request: POST /api/orders", payload, "request");

    try {
      const idempotencyKey = "key_" + Math.random().toString(36).substring(2, 12);
      const res = await fetch(`${backendUrl}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      onLog(`Response: POST /api/orders [Status: ${res.status}]`, data, res.ok ? "response" : "error");

      if (res.ok && data.success) {
        onOrderCreated(data.order_id, data.total_amt);
        onNotify("Order Created", `ID: ${data.order_id}`, true);
      } else {
        onNotify("Order Failed", data.message || "Could not create order", false);
      }
    } catch (err) {
      onLog("Network Error", err.message, "error");
      onNotify("Network Error", "Unable to reach server", false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span>📦</span> Create Order
        </div>
        <div className="card-step">Step 2</div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="order-customer-id">Customer ID</label>
          <input
            type="text"
            id="order-customer-id"
            className="form-control"
            placeholder="6a722bd2ead298d4ab75997f"
            value={localCustomerId}
            onChange={(e) => setLocalCustomerId(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="order-product">Select Product</label>
          <select
            id="order-product"
            className="form-control"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            disabled={loading}
          >
            {productsList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} - ₹{p.price}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="order-qty">Quantity</label>
          <input
            type="number"
            id="order-qty"
            className="form-control"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={loading}
          />
        </div>
        <button type="submit" className="btn btn-blue" disabled={loading}>
          {loading ? "Creating..." : "Create Order"}
        </button>
      </form>
    </div>
  );
}

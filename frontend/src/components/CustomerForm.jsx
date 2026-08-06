import React, { useState } from "react";

export default function CustomerForm({ onCustomerCreated, onLog, onNotify, backendUrl }) {
  const [name, setName] = useState("Test User");
  const [email, setEmail] = useState("testuser@example.com");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      onLog("Validation Error", "Name and email are required.", "error");
      return;
    }

    setLoading(true);
    const payload = { name: name.trim(), email: email.trim() };
    onLog("Request: POST /api/customers", payload, "request");

    try {
      const res = await fetch(`${backendUrl}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      onLog(`Response: POST /api/customers [Status: ${res.status}]`, data, res.ok ? "response" : "error");

      if (res.ok && data.success) {
        onCustomerCreated(data.data._id, data.data.name, data.data.email);
        onNotify("Customer Created", `ID: ${data.data._id}`, true);
      } else {
        onNotify("Creation Failed", data.message || "Could not create customer", false);
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
          <span>🚀</span> Create Customer
        </div>
        <div className="card-step">Step 1</div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="cust-name">Name</label>
          <input
            type="text"
            id="cust-name"
            className="form-control"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="cust-email">Email</label>
          <input
            type="email"
            id="cust-email"
            className="form-control"
            placeholder="jane@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Creating..." : "Create Customer"}
        </button>
      </form>
    </div>
  );
}

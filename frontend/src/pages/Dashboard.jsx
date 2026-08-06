import React, { useState } from "react";
import CustomerForm from "../components/CustomerForm";
import OrderForm from "../components/OrderForm";
import PaymentForm from "../components/PaymentForm";
import ConsoleTerminal from "../components/ConsoleTerminal";
import NotificationToast from "../components/NotificationToast";

const BACKEND_URL = "http://localhost:5000/api";

export default function Dashboard() {
  const [logs, setLogs] = useState([
    {
      id: "init",
      time: new Date().toLocaleTimeString(),
      title: "Console initialized. Ready to test payment flow.",
      type: "info",
      data: null
    }
  ]);
  const [customerId, setCustomerId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [notification, setNotification] = useState({ show: false, title: "", desc: "", isSuccess: true });

  const addLog = (title, data, type = "info") => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        time: new Date().toLocaleTimeString(),
        title,
        data,
        type
      }
    ]);
  };

  const handleNotify = (title, desc, isSuccess = true) => {
    setNotification({ show: true, title, desc, isSuccess });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleClearLogs = () => {
    setLogs([
      {
        id: "clear",
        time: new Date().toLocaleTimeString(),
        title: "Console cleared.",
        type: "info",
        data: null
      }
    ]);
  };

  const handleCustomerCreated = (id, name, email) => {
    setCustomerId(id);
  };

  const handleOrderCreated = (id, orderAmt) => {
    setOrderId(id);
    setAmount(orderAmt);
  };

  const handlePaymentSuccess = () => {
    setOrderId("");
    setAmount("");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{
        padding: "1.5rem 2rem",
        borderBottom: "1px solid var(--border-color)",
        backgroundColor: "rgba(10, 25, 47, 0.85)",
        backdropFilter: "blur(10px)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <h1 style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "var(--accent-teal)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <span>payment-gateway</span> / console
        </h1>
        <div className="badge">Razorpay API v1 (React)</div>
      </header>

      {/* Main Grid */}
      <main style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        height: "calc(100vh - 70px)",
        overflow: "hidden"
      }}>
        {/* Left Forms Panel */}
        <div className="panel left-panel" style={{ padding: "2rem", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.5rem", borderRight: "1px solid var(--border-color)", backgroundColor: "rgba(10, 25, 47, 0.4)" }}>
          <CustomerForm
            backendUrl={BACKEND_URL}
            onCustomerCreated={handleCustomerCreated}
            onLog={addLog}
            onNotify={handleNotify}
          />
          <OrderForm
            backendUrl={BACKEND_URL}
            customerId={customerId}
            onOrderCreated={handleOrderCreated}
            onLog={addLog}
            onNotify={handleNotify}
          />
          <PaymentForm
            backendUrl={BACKEND_URL}
            orderId={orderId}
            amount={amount}
            onLog={addLog}
            onNotify={handleNotify}
            onPaymentSuccess={handlePaymentSuccess}
          />
        </div>

        {/* Right Terminal Panel */}
        <ConsoleTerminal logs={logs} onClear={handleClearLogs} />
      </main>

      {/* Floating Notifications */}
      <NotificationToast notification={notification} />
    </div>
  );
}

import React from "react";

export default function NotificationToast({ notification }) {
  if (!notification || !notification.show) return null;

  const successColor = "var(--success-green)";
  const errorColor = "var(--error-red)";
  const borderColor = notification.isSuccess ? successColor : errorColor;
  const icon = notification.isSuccess ? "✓" : "✗";

  return (
    <div
      className="notification show"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        backgroundColor: "var(--card-bg)",
        border: `1px solid ${borderColor}`,
        borderRadius: "6px",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)",
        zIndex: 1000,
        animation: "slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(150%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div className="notification-icon" style={{ color: borderColor, fontSize: "1.25rem", fontWeight: "bold" }}>
        {icon}
      </div>
      <div className="notification-text">
        <h4 style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{notification.title}</h4>
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>{notification.desc}</p>
      </div>
    </div>
  );
}

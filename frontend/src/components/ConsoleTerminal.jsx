import React, { useEffect, useRef } from "react";

export default function ConsoleTerminal({ logs, onClear }) {
  const consoleEndRef = useRef(null);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  return (
    <div className="panel right-panel" style={{ height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="console-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-color)" }}>
        <div className="console-title" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", alignContent: "center", alignItems: "center", gap: "0.5rem" }}>
          <div className="console-dot" style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent-teal)" }}></div>
          Developer Logs Terminal
        </div>
        <button
          onClick={onClear}
          className="btn"
          style={{ padding: "0.25rem 0.5rem", fontSize: "0.65rem", borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
        >
          Clear
        </button>
      </div>

      <div
        className="console-area"
        style={{
          flex: 1,
          backgroundColor: "#020c1b",
          border: "1px solid var(--border-color)",
          borderRadius: "6px",
          padding: "1rem",
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          lineHeight: 1.4,
          overflowY: "auto",
          color: "#8892b0",
          display: "flex",
          flexDirection: "column",
          gap: "1rem"
        }}
      >
        {logs.map((log) => (
          <div key={log.id} className="log-entry" style={{ borderLeft: "2px solid var(--border-color)", paddingLeft: "0.75rem", marginBottom: "0.5rem" }}>
            <div className="log-time" style={{ color: "var(--text-secondary)", fontSize: "0.65rem", marginBottom: "0.25rem" }}>{log.time}</div>
            <div className={`log-title ${log.type}`} style={{ fontWeight: 500, marginBottom: "0.25rem" }}>
              {log.title}
            </div>
            {log.data && (
              <pre style={{ backgroundColor: "rgba(2, 12, 27, 0.7)", padding: "0.5rem", borderRadius: "4px", border: "1px solid rgba(35, 53, 84, 0.3)", whiteSpace: "pre-wrap", wordBreak: "break-all", color: "#e6f1ff", marginTop: "0.25rem" }}>
                {typeof log.data === "object" ? JSON.stringify(log.data, null, 2) : log.data}
              </pre>
            )}
          </div>
        ))}
        <div ref={consoleEndRef} />
      </div>
    </div>
  );
}

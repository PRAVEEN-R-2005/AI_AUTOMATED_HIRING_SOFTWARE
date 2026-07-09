/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

let listeners = new Set();
let queue = [];
let nextId = 0;
let hostElement = null;
let toastRoot = null;

const getHostElement = () => {
  if (typeof document === "undefined") {
    return null;
  }

  if (!hostElement) {
    hostElement = document.createElement("div");
    hostElement.setAttribute("data-toast-host", "true");
    hostElement.style.position = "fixed";
    hostElement.style.top = "16px";
    hostElement.style.right = "16px";
    hostElement.style.zIndex = "9999";
    hostElement.style.display = "flex";
    hostElement.style.flexDirection = "column";
    hostElement.style.gap = "8px";
    hostElement.style.pointerEvents = "none";
    document.body.appendChild(hostElement);
  }

  return hostElement;
};

const renderToasts = (toasts) => {
  const host = getHostElement();
  if (!host) {
    return;
  }

  if (!toastRoot) {
    toastRoot = createRoot(host);
  }

  toastRoot.render(
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {toasts.map((toast) => {
        const accent = {
          success: "#16a34a",
          error: "#dc2626",
          warning: "#d97706",
          info: "#2563eb"
        }[toast.kind] || "#2563eb";

        return (
          <div
            key={toast.id}
            style={{
              minWidth: "260px",
              maxWidth: "360px",
              background: "#111827",
              color: "#f9fafb",
              border: `1px solid ${accent}`,
              borderRadius: "10px",
              padding: "12px 14px",
              boxShadow: "0 12px 30px rgba(0, 0, 0, 0.2)",
              pointerEvents: "auto"
            }}
          >
            <strong style={{ display: "block", marginBottom: "4px" }}>
              {toast.kind.charAt(0).toUpperCase() + toast.kind.slice(1)}
            </strong>
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};

const publishToast = (kind, message) => {
  const toast = { id: ++nextId, kind, message };
  queue = [...queue, toast].slice(-4);
  listeners.forEach((listener) => listener([...queue]));
  renderToasts(queue);

  window.setTimeout(() => {
    queue = queue.filter((item) => item.id !== toast.id);
    listeners.forEach((listener) => listener([...queue]));
    renderToasts(queue);
  }, 3200);
};

export function useToast() {
  const [, setToasts] = useState([]);

  useEffect(() => {
    const listener = (value) => setToasts(value);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  return {
    success: (message) => publishToast("success", message),
    error: (message) => publishToast("error", message),
    warning: (message) => publishToast("warning", message),
    info: (message) => publishToast("info", message)
  };
}

export default function Toast() {
  return null;
}

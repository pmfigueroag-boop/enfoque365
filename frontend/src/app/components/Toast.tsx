"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

/* ── Types ─────────────────────────────────────────────────── */
type ToastType = "success" | "error" | "info" | "action";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  exiting: boolean;
  action?: ToastAction;
}

interface ToastAPI {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
  action: (msg: string, action: ToastAction) => void;
}

interface ToastContextValue {
  toast: ToastAPI;
}

/* ── Context ───────────────────────────────────────────────── */
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

/* ── Styles ────────────────────────────────────────────────── */
const TOAST_COLORS: Record<ToastType, { border: string; accent: string; bg: string }> = {
  success: {
    border: "rgba(16,185,129,0.45)",
    accent: "#10b981",
    bg: "rgba(16,185,129,0.08)",
  },
  error: {
    border: "rgba(239,68,68,0.45)",
    accent: "#ef4444",
    bg: "rgba(239,68,68,0.08)",
  },
  info: {
    border: "rgba(59,130,246,0.45)",
    accent: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
  },
  action: {
    border: "rgba(139,92,246,0.45)",
    accent: "#8b5cf6",
    bg: "rgba(139,92,246,0.08)",
  },
};

const ICONS: Record<ToastType, React.ReactNode> = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  action: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
};

/* ── Single Toast ──────────────────────────────────────────── */
function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const colors = TOAST_COLORS[item.type];

  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        padding: "12px 16px",
        minWidth: "280px",
        maxWidth: "420px",
        borderRadius: "10px",
        border: `1px solid ${colors.border}`,
        borderLeft: `3px solid ${colors.accent}`,
        background: colors.bg,
        backdropFilter: "blur(16px) saturate(1.6)",
        WebkitBackdropFilter: "blur(16px) saturate(1.6)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35), 0 0 1px rgba(255,255,255,0.08) inset",
        color: "var(--text-primary, #e2e8f0)",
        fontSize: "0.85rem",
        lineHeight: 1.5,
        fontFamily: "inherit",
        animation: item.exiting
          ? "toast-slide-out 0.3s ease-in forwards"
          : "toast-slide-in 0.35s cubic-bezier(0.21,1.02,0.73,1) forwards",
        pointerEvents: "auto",
        cursor: "pointer",
        wordBreak: "break-word",
      }}
      onClick={() => !item.action && onDismiss(item.id)}
    >
      <span style={{ flexShrink: 0, marginTop: "1px" }}>{ICONS[item.type]}</span>
      <span style={{ flex: 1 }}>
        {item.message}
        {item.action && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              item.action!.onClick();
              onDismiss(item.id);
            }}
            style={{
              display: "inline-block",
              marginLeft: "8px",
              padding: "2px 10px",
              borderRadius: "6px",
              border: `1px solid ${colors.accent}`,
              background: `${colors.accent}22`,
              color: colors.accent,
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s ease",
              verticalAlign: "middle",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = `${colors.accent}44`;
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = `${colors.accent}22`;
            }}
          >
            {item.action.label}
          </button>
        )}
      </span>
      <button
        aria-label="Cerrar"
        onClick={(e) => { e.stopPropagation(); onDismiss(item.id); }}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-muted, #94a3b8)",
          cursor: "pointer",
          padding: "0 2px",
          fontSize: "1rem",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        x
      </button>
    </div>
  );
}

/* ── Provider ──────────────────────────────────────────────── */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const show = useCallback((type: ToastType, message: string, action?: ToastAction) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, type, message, exiting: false, action }]);
    // Action toasts get longer timeout (5s) to allow undo
    const timeout = action ? 5000 : 4000;
    setTimeout(() => dismiss(id), timeout);
  }, [dismiss]);

  const toast: ToastAPI = React.useMemo(
    () => ({
      success: (msg: string) => show("success", msg),
      error: (msg: string) => show("error", msg),
      info: (msg: string) => show("info", msg),
      action: (msg: string, action: ToastAction) => show("action", msg, action),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Keyframes injected once */}
      <style>{`
        @keyframes toast-slide-in {
          from { opacity: 0; transform: translateX(100%) translateY(-8px); }
          to   { opacity: 1; transform: translateX(0) translateY(0); }
        }
        @keyframes toast-slide-out {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(100%); }
        }
      `}</style>

      {/* Container */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            pointerEvents: "none",
          }}
        >
          {toasts.map((t) => (
            <ToastCard key={t.id} item={t} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

type ToastListener = (toasts: ToastMessage[]) => void;

let activeToasts: ToastMessage[] = [];
const listeners: Set<ToastListener> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener([...activeToasts]));
}

export const toast = {
  success: (message: string, durationMs = 4000) => {
    addToast("success", message, durationMs);
  },
  error: (message: string, durationMs = 5000) => {
    addToast("error", message, durationMs);
  },
  info: (message: string, durationMs = 4000) => {
    addToast("info", message, durationMs);
  },
};

function addToast(type: "success" | "error" | "info", message: string, durationMs: number) {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: ToastMessage = { id, type, message };
  activeToasts = [...activeToasts, newToast];
  notifyListeners();

  setTimeout(() => {
    removeToast(id);
  }, durationMs);
}

function removeToast(id: string) {
  activeToasts = activeToasts.filter((t) => t.id !== id);
  notifyListeners();
}

export function useToast() {
  return toast;
}

/**
 * Global Toast Container component.
 * Placed in RootLayout or automatically rendered on page.
 */
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    setToasts([...activeToasts]);
    const listener: ToastListener = (updated) => setToasts(updated);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl p-4 shadow-brand-md motion-slide-up transition-all border ${
            t.type === "success"
              ? "bg-white text-secondary border-emerald-500/30 ring-1 ring-emerald-500/10"
              : t.type === "error"
              ? "bg-white text-secondary border-coral/30 ring-1 ring-coral/10 motion-shake"
              : "bg-white text-secondary border-border"
          }`}
        >
          <div className="flex items-center gap-3">
            {t.type === "success" && (
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            )}
            {t.type === "error" && (
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-coral/10 text-coral">
                <AlertCircle className="h-4 w-4" />
              </div>
            )}
            {t.type === "info" && (
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sand text-ink/70">
                <Info className="h-4 w-4" />
              </div>
            )}
            <p className="text-xs font-bold leading-snug">{t.message}</p>
          </div>
          <button
            type="button"
            onClick={() => removeToast(t.id)}
            className="text-ink/40 hover:text-ink transition shrink-0 p-1"
            aria-label="Dismiss toast"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default toast;


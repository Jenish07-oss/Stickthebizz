"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, AlertCircle } from "lucide-react";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOffline(false);
      setIsSlow(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleSlow = () => {
      setIsSlow(true);
      setTimeout(() => setIsSlow(false), 4000);
    };
    window.addEventListener("stb_slow_network", handleSlow);

    if (!navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("stb_slow_network", handleSlow);
    };
  }, []);

  if (!isOffline && !isSlow) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="offline-banner no-print fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-amber-500 text-white px-4 py-2 text-xs font-bold shadow-float transition-all animate-in fade-in slide-in-from-bottom-2"
    >
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>You are currently offline. Check-ins will synchronize once reconnected.</span>
        </>
      ) : (
        <>
          <AlertCircle className="h-4 w-4 shrink-0 animate-spin" />
          <span>Slow connection — retrying request...</span>
        </>
      )}
    </div>
  );
}


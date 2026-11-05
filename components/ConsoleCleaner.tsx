"use client";

import { useEffect } from "react";

export function ConsoleCleaner() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      const originalWarn = console.warn;
      console.warn = (...args: any[]) => {
        const msg = args[0]?.toString() || "";
        if (
          msg.includes("hydration") ||
          msg.includes("Supabase Realtime") ||
          msg.includes("useLayoutEffect")
        ) {
          return;
        }
        originalWarn.apply(console, args);
      };
    }
  }, []);

  return null;
}

export default ConsoleCleaner;


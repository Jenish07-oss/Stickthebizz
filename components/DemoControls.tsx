"use client";

import React, { useState } from "react";
import { FastForward, RefreshCw, Zap, SlidersHorizontal, ChevronUp, ChevronDown } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export default function DemoControls() {
  const { fastForwardTime, jumpToNearReward, resetDemo, rule } = useStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  return (
    <aside
      aria-label="Demo Simulator Controls"
      className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 w-[min(94vw,520px)]"
    >
      {notification && (
        <div className="mb-2 animate-bounce rounded-full bg-secondary px-4 py-2 text-center text-xs font-bold text-white shadow-float">
          {notification}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-secondary/20 bg-white/95 p-3 shadow-float backdrop-blur-md">
        <div className="flex items-center justify-between px-2 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/15 text-primary">
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Demo Simulation Bar
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink/70 hover:bg-sand"
            aria-label={isExpanded ? "Collapse controls" : "Expand controls"}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                fastForwardTime(12);
                showToast("⚡ Fast-forwarded time! Midnight lock unlocked.");
              }}
              className="flex min-h-[48px] flex-col items-center justify-center rounded-xl bg-sand p-2 text-center text-xs font-bold text-secondary transition hover:bg-primary hover:text-white"
            >
              <FastForward className="h-4 w-4 mb-1" />
              <span>Skip 12h / Midnight</span>
            </button>

            <button
              type="button"
              onClick={() => {
                jumpToNearReward();
                showToast(`🎯 Set visits to ${rule.visitsRequired - 1}/${rule.visitsRequired}! Next scan unlocks reward.`);
              }}
              className="flex min-h-[48px] flex-col items-center justify-center rounded-xl bg-sand p-2 text-center text-xs font-bold text-secondary transition hover:bg-primary hover:text-white"
            >
              <Zap className="h-4 w-4 mb-1" />
              <span>Jump to 9 Stamps</span>
            </button>

            <button
              type="button"
              onClick={() => {
                resetDemo();
                showToast("🔄 Reset customer to 0 visits!");
              }}
              className="flex min-h-[48px] flex-col items-center justify-center rounded-xl bg-sand p-2 text-center text-xs font-bold text-ink/70 transition hover:bg-primary hover:text-white"
            >
              <RefreshCw className="h-4 w-4 mb-1" />
              <span>Reset Customer</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

"use client";

import React from "react";
import { Wifi, BatteryMedium, Signal } from "lucide-react";

interface PhoneFrameProps {
  children: React.ReactNode;
  className?: string;
}

export default function PhoneFrame({ children, className = "" }: PhoneFrameProps) {
  return (
    <div
      className={`relative mx-auto w-full max-w-[390px] rounded-[3.2rem] border-[10px] border-secondary/90 bg-slate-900 p-2.5 shadow-[0_30px_70px_-15px_rgba(49,91,140,0.35)] transition-all ${className}`}
    >
      {/* Outer Phone Bezel Buttons Accent */}
      <div className="absolute -left-3.5 top-24 h-10 w-1 rounded-l-md bg-secondary/70 hidden sm:block" />
      <div className="absolute -left-3.5 top-36 h-10 w-1 rounded-l-md bg-secondary/70 hidden sm:block" />
      <div className="absolute -right-3.5 top-28 h-14 w-1 rounded-r-md bg-secondary/70 hidden sm:block" />

      {/* Screen Inner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-sand flex flex-col h-[670px] max-h-[85vh]">
        {/* Phone Dynamic Island / Status Bar */}
        <div className="shrink-0 z-10 flex items-center justify-between bg-sand/95 px-7 pt-3 pb-2 text-[11px] font-bold text-ink border-b border-ink/5">
          <span className="font-mono">9:41 AM</span>

          {/* Dynamic Island Notch Pill */}
          <div className="h-5 w-24 rounded-full bg-slate-900 flex items-center justify-end px-2 gap-1.5 shadow-inner">
            <span className="h-2 w-2 rounded-full bg-slate-800" />
            <span className="h-2 w-2 rounded-full bg-blue-950/60" />
          </div>

          <div className="flex items-center gap-1.5 text-ink/80">
            <Signal className="h-3 w-3" />
            <Wifi className="h-3 w-3" />
            <BatteryMedium className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Screen Content - Scrollable without visible scrollbar */}
        <div className="flex-1 overflow-y-auto px-4 pt-2 pb-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {children}
        </div>

        {/* Home Indicator Gesture Bar (Sticky at bottom) */}
        <div className="shrink-0 bg-sand/95 py-2.5 border-t border-ink/5">
          <div className="mx-auto h-1 w-28 rounded-full bg-ink/30" />
        </div>
      </div>
    </div>
  );
}

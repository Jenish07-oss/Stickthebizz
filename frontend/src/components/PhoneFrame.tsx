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
      className={`max-w-[360px] h-[720px] rounded-[3rem] p-3 bg-[#09090b] shadow-2xl relative mx-auto ${className}`}
    >
      {/* Outer Phone Bezel Buttons */}
      <div className="absolute -left-1 top-24 h-10 w-1 rounded-l-md bg-zinc-800" />
      <div className="absolute -left-1 top-36 h-10 w-1 rounded-l-md bg-zinc-800" />
      <div className="absolute -right-1 top-28 h-14 w-1 rounded-r-md bg-zinc-800" />

      {/* Screen Inner Viewport */}
      <div className="h-full w-full rounded-[2.5rem] bg-[#F5EBDD] overflow-y-auto scrollbar-hide pb-24 relative flex flex-col [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Dynamic Island Notch & Status Bar */}
        <div className="shrink-0 z-30 sticky top-0 flex items-center justify-between bg-[#F5EBDD]/90 backdrop-blur-sm px-6 pt-3 pb-2 text-[11px] font-bold text-ink">
          <span className="font-mono text-xs">9:41 AM</span>

          {/* Dynamic Island Pill */}
          <div className="w-24 h-6 bg-black rounded-full flex items-center justify-end px-2 gap-1.5 shadow-inner">
            <span className="h-2 w-2 rounded-full bg-zinc-800" />
            <span className="h-2 w-2 rounded-full bg-zinc-900" />
          </div>

          <div className="flex items-center gap-1.5 text-ink/80">
            <Signal className="h-3 w-3" />
            <Wifi className="h-3 w-3" />
            <BatteryMedium className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 px-3 pt-2">
          {children}
        </div>
      </div>
    </div>
  );
}


"use client";

import React from "react";
import { Check } from "lucide-react";
import { StarStampIcon, GiftBoxIcon } from "@/components/BrandIcons";

interface StampGridProps {
  totalVisits: number;
  completedVisits: number;
  rewardName?: string;
  recentlyStampedIndex?: number | null;
}

export default function StampGrid({
  totalVisits = 10,
  completedVisits = 7,
  rewardName = "Free Reward",
  recentlyStampedIndex = null,
}: StampGridProps) {
  // Determine grid column layout based on total count
  const getGridColsClass = () => {
    if (totalVisits === 7) return "grid-cols-4 sm:grid-cols-7";
    if (totalVisits === 15) return "grid-cols-5";
    if (totalVisits === 20) return "grid-cols-5";
    return "grid-cols-5"; // Default 10 visits: 2 rows of 5
  };

  const stamps = Array.from({ length: totalVisits }, (_, i) => i + 1);

  return (
    <div className="w-full">
      <div className={`grid ${getGridColsClass()} gap-2 sm:gap-2.5`}>
        {stamps.map((visitNumber) => {
          const isCompleted = visitNumber <= completedVisits;
          const isTarget = visitNumber === totalVisits;
          const isNextUp = visitNumber === completedVisits + 1;
          const isJustStamped = recentlyStampedIndex === visitNumber;

          if (isCompleted) {
            return (
              <div
                key={visitNumber}
                className={`group relative flex aspect-square items-center justify-center rounded-2xl bg-gradient-to-b from-white to-sand/40 border-2 border-emerald-500/60 shadow-sm transition-all duration-300 hover:scale-105 ${
                  isJustStamped ? "animate-stamp-pop scale-110 ring-4 ring-primary/40" : ""
                }`}
                title={`Visit #${visitNumber} Completed`}
              >
                <div className="flex items-center justify-center p-1">
                  <StarStampIcon size={26} className="filter drop-shadow-sm" />
                </div>
                <span className="absolute bottom-0.5 right-1 font-mono text-[8px] font-bold text-emerald-700/80">
                  #{visitNumber}
                </span>
              </div>
            );
          }

          if (isTarget) {
            return (
              <div
                key={visitNumber}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed p-1 text-center transition-all ${
                  isNextUp
                    ? "border-primary bg-primary/10 text-primary animate-flame-pulse shadow-sm"
                    : "border-secondary/40 bg-sand/30 text-secondary"
                }`}
                title={`Final visit unlocks ${rewardName}`}
              >
                <GiftBoxIcon size={22} className="animate-bounce" />
                <span className="mt-0.5 text-[9px] font-extrabold uppercase leading-none tracking-tight text-primary">
                  FREE
                </span>
                <span className="absolute bottom-0.5 right-1 font-mono text-[8px] font-bold opacity-60">
                  #{visitNumber}
                </span>
              </div>
            );
          }

          // Unclaimed stamp
          return (
            <div
              key={visitNumber}
              className={`relative flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed text-xs font-bold transition-all shadow-inner ${
                isNextUp
                  ? "border-primary/80 bg-primary/5 text-primary ring-2 ring-primary/20"
                  : "border-ink/20 bg-white/60 text-ink/40"
              }`}
              title={`Visit #${visitNumber}`}
            >
              <span className="font-mono text-sm font-bold">{visitNumber}</span>
              {isNextUp && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary"></span>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

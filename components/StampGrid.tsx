"use client";

import React from "react";
import { Check, Gift } from "lucide-react";

interface StampGridProps {
  totalVisits: number;
  completedVisits: number;
  rewardName?: string;
}

export default function StampGrid({
  totalVisits = 10,
  completedVisits = 7,
  rewardName = "Free Reward",
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
      <div className={`grid ${getGridColsClass()} gap-2.5 sm:gap-3`}>
        {stamps.map((visitNumber) => {
          const isCompleted = visitNumber <= completedVisits;
          const isTarget = visitNumber === totalVisits;
          const isNextUp = visitNumber === completedVisits + 1;

          if (isCompleted) {
            return (
              <div
                key={visitNumber}
                className="group relative flex aspect-square items-center justify-center rounded-2xl bg-primary text-white shadow-sm transition-transform duration-200 hover:scale-105"
                title={`Visit #${visitNumber} Completed`}
              >
                <div className="animate-stamp-pop flex items-center justify-center">
                  <Check className="h-5 w-5 sm:h-6 sm:w-6 stroke-[3]" />
                </div>
                <span className="absolute bottom-1 right-1 font-mono text-[9px] font-bold text-white/80">
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
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-secondary/40 bg-sand/40 text-secondary"
                }`}
                title={`Final visit unlocks ${rewardName}`}
              >
                <Gift className="h-5 w-5 animate-pulse sm:h-6 sm:w-6 text-primary" />
                <span className="mt-0.5 text-[10px] font-extrabold uppercase leading-none tracking-tight">
                  Free!
                </span>
                <span className="absolute bottom-1 right-1 font-mono text-[9px] font-bold opacity-60">
                  #{visitNumber}
                </span>
              </div>
            );
          }

          // Unclaimed stamp
          return (
            <div
              key={visitNumber}
              className={`relative flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed text-sm font-bold transition-colors ${
                isNextUp
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-ink/20 bg-white/40 text-ink/40"
              }`}
              title={`Visit #${visitNumber}`}
            >
              <span className="font-mono text-base font-bold">{visitNumber}</span>
              {isNextUp && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-primary"></span>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

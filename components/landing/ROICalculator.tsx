"use client";

import React, { useState, useEffect } from "react";
import { AnalyticsIcon } from "@/components/BrandIcons";
import { Users, IndianRupee } from "lucide-react";

interface ROICalculatorProps {
  initialWalkIns?: number;
  initialAvgBill?: number;
  onCalculationChange?: (result: { extraRevenue: number; extraVisits: number }) => void;
}

export default function ROICalculator({
  initialWalkIns = 180,
  initialAvgBill = 120,
  onCalculationChange,
}: ROICalculatorProps) {
  const [dailyWalkIns, setDailyWalkIns] = useState<number>(initialWalkIns);
  const [avgBill, setAvgBill] = useState<number>(initialAvgBill);

  // 18% estimated lift from digital streak loyalty in Indian retail
  const monthlyExtraVisits = Math.round(dailyWalkIns * 0.18 * 30);
  const monthlyExtraRevenue = Math.round(monthlyExtraVisits * avgBill);

  useEffect(() => {
    if (onCalculationChange) {
      onCalculationChange({ extraRevenue: monthlyExtraRevenue, extraVisits: monthlyExtraVisits });
    }
  }, [monthlyExtraRevenue, monthlyExtraVisits, onCalculationChange]);

  return (
    <div className="w-full rounded-[2rem] border border-border bg-white/90 p-5 shadow-card">
      <div className="flex items-center justify-between pb-3 border-b border-border/70">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
            <AnalyticsIcon size={18} />
          </span>
          <div>
            <h4 className="font-display text-sm font-extrabold text-secondary">
              Interactive ROI Calculator
            </h4>
            <p className="text-[10px] text-ink/65">
              Drag the sliders below to estimate your monthly retail revenue lift:
            </p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 font-mono text-[10px] font-bold">
          18% Average Lift
        </span>
      </div>

      <div className="mt-4 space-y-4">
        {/* Slider 1: Daily Walk-ins */}
        <div>
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="daily-walkins-slider" className="flex items-center gap-1.5 font-bold text-secondary">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span>Daily Walk-ins:</span>
            </label>
            <span className="font-mono text-xs font-extrabold text-primary">
              {dailyWalkIns} customers / day
            </span>
          </div>
          <input
            id="daily-walkins-slider"
            type="range"
            min={30}
            max={1000}
            step={10}
            value={dailyWalkIns}
            onChange={(e) => setDailyWalkIns(Number(e.target.value))}
            aria-label="Daily Walk-ins Slider"
            className="mt-2 w-full h-2 bg-sand rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[9px] font-mono text-ink/50 mt-1">
            <span>30 / day</span>
            <span>500 / day</span>
            <span>1,000 / day</span>
          </div>
        </div>

        {/* Slider 2: Avg Bill */}
        <div>
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="avg-bill-slider" className="flex items-center gap-1.5 font-bold text-secondary">
              <IndianRupee className="h-3.5 w-3.5 text-primary" />
              <span>Avg Bill Amount:</span>
            </label>
            <span className="font-mono text-xs font-extrabold text-primary">
              ₹{avgBill} / bill
            </span>
          </div>
          <input
            id="avg-bill-slider"
            type="range"
            min={20}
            max={1000}
            step={10}
            value={avgBill}
            onChange={(e) => setAvgBill(Number(e.target.value))}
            aria-label="Average Bill Slider"
            className="mt-2 w-full h-2 bg-sand rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[9px] font-mono text-ink/50 mt-1">
            <span>₹20</span>
            <span>₹500</span>
            <span>₹1,000</span>
          </div>
        </div>

        {/* Real-time Calculated Lift Result */}
        <div className="mt-3 rounded-2xl bg-sand/60 border border-primary/20 p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-ink/65 uppercase tracking-wider">
              Projected Monthly Revenue Lift:
            </p>
            <p className="font-display text-xl font-extrabold text-secondary mt-0.5">
              +₹{monthlyExtraRevenue.toLocaleString("en-IN")} / mo
            </p>
          </div>
          <div className="text-right">
            <span className="rounded-full bg-emerald-500/15 text-emerald-800 border border-emerald-500/20 px-3 py-1 font-mono text-xs font-bold inline-block">
              +{monthlyExtraVisits} repeat visits
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Sparkles, RotateCcw, Check } from "lucide-react";
import { StarStampIcon, GiftBoxIcon } from "@/components/BrandIcons";
import { playScanChime, playMilestoneFanfare } from "@/lib/audio";

export interface PassRuleConfig {
  shopName: string;
  tagline: string;
  minSpend: number;
  visitsRequired: number;
  rewardName: string;
  validityDays: number;
}

interface InteractiveStampPassProps {
  rule: PassRuleConfig;
  onVisitChange?: (visits: number) => void;
}

export default function InteractiveStampPass({
  rule,
  onVisitChange,
}: InteractiveStampPassProps) {
  const [visits, setVisits] = useState<number>(7);
  const [isScanning, setIsScanning] = useState(false);
  const [recentlyStamped, setRecentlyStamped] = useState<number | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const totalRequired = rule.visitsRequired || 10;
  const progressPercent = Math.min(100, Math.round((visits / totalRequired) * 100));
  const isRewardReady = visits >= totalRequired;

  const punchStamp = (targetVisit?: number) => {
    if (isScanning) return;
    setIsScanning(true);

    const nextVisits = targetVisit !== undefined ? targetVisit : Math.min(totalRequired, visits + 1);
    setRecentlyStamped(nextVisits);

    playScanChime();

    setTimeout(() => {
      setVisits(nextVisits);
      setIsScanning(false);
      if (onVisitChange) onVisitChange(nextVisits);

      if (nextVisits >= totalRequired) {
        playMilestoneFanfare();
        setFeedbackToast(`🎉 Reward Ready! 10/10 stamps collected.`);
      } else {
        setFeedbackToast(`✨ Stamp #${nextVisits} punched!`);
      }

      setTimeout(() => setFeedbackToast(null), 2500);
    }, 200);
  };

  const handleReset = () => {
    setVisits(0);
    setRecentlyStamped(null);
    setFeedbackToast("Sample pass reset. Tap any stamp to start!");
    if (onVisitChange) onVisitChange(0);
    setTimeout(() => setFeedbackToast(null), 2000);
  };

  const stamps = Array.from({ length: totalRequired }, (_, i) => i + 1);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="relative rounded-[2.5rem] p-3 shadow-float border-4 border-secondary/10 bg-[#102B4C] transition-all">
        {/* Pass Top Bar */}
        <div className="rounded-t-[2rem] bg-secondary p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-coral text-white font-extrabold text-xs">
                SB
              </span>
              <div>
                <h4 className="font-display text-sm font-extrabold text-white leading-tight">
                  {rule.shopName}
                </h4>
                <p className="text-[10px] text-white/70">Verified Counter Pass</p>
              </div>
            </div>
            <span className="rounded-full bg-primary/20 border border-primary/30 px-2.5 py-0.5 font-mono text-[10px] font-bold text-coral">
              Min ₹{rule.minSpend}
            </span>
          </div>
          <p className="mt-2 text-[11px] font-medium text-white/80">{rule.tagline}</p>
        </div>

        {/* Pass Body */}
        <div className="relative bg-white p-5 rounded-b-[2rem]">
          {/* Punch Status */}
          <div className="flex items-center justify-between pb-3 border-b border-border/70">
            <div>
              <span className="font-display text-lg font-extrabold text-secondary">
                {visits} of {totalRequired} visits
              </span>
              <p className="text-[10px] text-ink/70">
                Reward: <strong className="text-primary">{rule.rewardName}</strong>
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-extrabold ${
                isRewardReady ? "bg-emerald-100 text-emerald-800" : "bg-coral/15 text-primary"
              }`}
            >
              {isRewardReady ? "REWARD READY" : `${progressPercent}% DONE`}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sand">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Interactive Stamp Circles (Clickable) */}
          <div className="mt-4">
            <p className="text-[10px] font-bold text-ink/60 uppercase tracking-wider mb-2 text-center">
              Tap any circle below or press button to punch:
            </p>
            <div className="grid grid-cols-5 gap-2">
              {stamps.map((num) => {
                const isCompleted = num <= visits;
                const isFinal = num === totalRequired;
                const isNext = num === visits + 1;
                const isPunchedNow = recentlyStamped === num;

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => punchStamp(num)}
                    aria-label={`Punch stamp number ${num}`}
                    className={`relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary ${
                      isCompleted
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-brand-sm"
                        : isFinal
                        ? "border-primary bg-primary/10 text-primary border-dashed"
                        : isNext
                        ? "border-primary bg-primary/5 text-primary border-dashed ring-2 ring-primary/20 animate-pulse"
                        : "border-border bg-white text-ink/40 border-dashed hover:border-primary/50"
                    } ${isPunchedNow ? "ring-4 ring-primary scale-110 shadow-lg" : ""}`}
                  >
                    {isCompleted ? (
                      <StarStampIcon size={24} className="filter drop-shadow-sm text-emerald-600" />
                    ) : isFinal ? (
                      <GiftBoxIcon size={20} className="text-primary" />
                    ) : (
                      <span className="font-mono text-xs font-bold">{num}</span>
                    )}
                    <span className="absolute bottom-0.5 right-1 font-mono text-[7px] font-bold opacity-60">
                      #{num}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="mt-4">
            {isRewardReady ? (
              <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50 p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800">
                  <GiftBoxIcon size={18} />
                  <span>REWARD READY &amp; UNLOCKED!</span>
                </div>
                <p className="mt-1 font-mono text-sm font-extrabold text-secondary tracking-widest">
                  STB-7Q4K-29
                </p>
                <p className="text-[10px] text-ink/70">
                  Show this voucher to claim your {rule.rewardName}.
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-2.5 inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl border border-secondary/30 bg-white px-3 text-xs font-bold text-secondary shadow-sm transition hover:bg-sand cursor-pointer active:scale-95"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Sample &amp; Punch Again</span>
                </button>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => punchStamp()}
                  className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-white shadow-brand-sm transition-all duration-200 hover:bg-secondary cursor-pointer active:scale-95 ${
                    isScanning ? "opacity-75 cursor-wait" : ""
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isScanning ? "Simulating Punch..." : "✨ Tap to Punch Stamp (Interactive Preview)"}</span>
                </button>
              </div>
            )}

            {feedbackToast && (
              <p className="mt-2 text-center text-xs font-bold text-primary animate-pulse" role="status">
                {feedbackToast}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

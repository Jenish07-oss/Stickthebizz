"use client";

import React, { useState, useEffect } from "react";
import { Zap, X, Coffee, ShoppingBag, Utensils, Sparkles } from "lucide-react";

interface ActivityItem {
  id: string;
  icon: React.ReactNode;
  time: string;
  text: string;
}

const ACTIVITIES: ActivityItem[] = [
  {
    id: "act-1",
    icon: <Utensils className="h-3.5 w-3.5 text-primary" />,
    time: "Just now",
    text: "A customer redeemed a Free Burger at Sector 14, Gurugram.",
  },
  {
    id: "act-2",
    icon: <Coffee className="h-3.5 w-3.5 text-primary" />,
    time: "1 min ago",
    text: "Customer 98***45 completed 10/10 visits at Kesar Chai Corner.",
  },
  {
    id: "act-3",
    icon: <ShoppingBag className="h-3.5 w-3.5 text-primary" />,
    time: "3 mins ago",
    text: "Patel Kirana Superstore verified a ₹3,200 counter purchase.",
  },
  {
    id: "act-4",
    icon: <Sparkles className="h-3.5 w-3.5 text-primary" />,
    time: "5 mins ago",
    text: "New regular joined Sharma Sweets loyalty program.",
  },
];

export default function LiveActivityToast() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isDismissed) return;

    const interval = setInterval(() => {
      // Fade out, change, fade in
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ACTIVITIES.length);
        setIsVisible(true);
      }, 400);
    }, 7000);

    return () => clearInterval(interval);
  }, [isDismissed]);

  if (isDismissed) return null;

  const current = ACTIVITIES[currentIndex];

  return (
    <div
      className={`fixed bottom-5 left-5 z-40 max-w-sm transition-all duration-400 transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-white/95 px-4 py-3 shadow-float backdrop-blur-md">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-sand shrink-0">
          {current.icon}
        </span>

        <div className="text-xs pr-2">
          <div className="flex items-center gap-1.5 font-bold text-secondary">
            <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="font-mono text-[10px] uppercase text-ink/50">{current.time}</span>
          </div>
          <p className="mt-0.5 text-ink/80 leading-snug">{current.text}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-ink/40 hover:text-ink transition p-1"
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}


"use client";

import React from "react";
import { ChaiCupIcon, BasketIcon, StreakIcon, AntiFraudIcon, CustomersIcon } from "@/components/BrandIcons";
import { PassRuleConfig } from "./InteractiveStampPass";

export type PresetKey = "chai" | "kirana" | "burger" | "strict" | "dpdp";

export interface PresetItem {
  key: PresetKey;
  name: string;
  badge: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  config: PassRuleConfig;
}

export const PRESET_OPTIONS: PresetItem[] = [
  {
    key: "chai",
    name: "Chai Stall",
    badge: "10 Visits → Free Chai",
    icon: ChaiCupIcon,
    config: {
      shopName: "Kesar Chai Corner",
      tagline: "10 Visits in 45 Days → 1 Special Masala Chai Free",
      minSpend: 40,
      visitsRequired: 10,
      rewardName: "Special Masala Chai",
      validityDays: 45,
    },
  },
  {
    key: "kirana",
    name: "Patel Kirana",
    badge: "10 Visits → 1L Oil",
    icon: BasketIcon,
    config: {
      shopName: "Patel Super Kirana",
      tagline: "10 Visits with ₹300 Min Bill → 1L Groundnut Oil Free",
      minSpend: 300,
      visitsRequired: 10,
      rewardName: "1L Groundnut Oil",
      validityDays: 60,
    },
  },
  {
    key: "burger",
    name: "Burger Joint",
    badge: "7 Visits → Free Burger",
    icon: StreakIcon,
    config: {
      shopName: "Bombay Burger Co.",
      tagline: "7 Visits in 30 Days → Free Cheese Burger",
      minSpend: 150,
      visitsRequired: 7,
      rewardName: "Cheese Burger",
      validityDays: 30,
    },
  },
  {
    key: "strict",
    name: "Strict 1-Scan",
    badge: "Daily 12:00 AM Reset",
    icon: AntiFraudIcon,
    config: {
      shopName: "Daily Regulars Cafe",
      tagline: "Strict 1-Scan per Day Anti-Fraud Rule (Resets 12:00 AM IST)",
      minSpend: 80,
      visitsRequired: 5,
      rewardName: "Cold Coffee",
      validityDays: 30,
    },
  },
  {
    key: "dpdp",
    name: "DPDP Safe",
    badge: "Zero App Download",
    icon: CustomersIcon,
    config: {
      shopName: "Royal Sweets & Dairy",
      tagline: "DPDP 2023 Compliant Customer Privacy Guarantee",
      minSpend: 100,
      visitsRequired: 10,
      rewardName: "250g Kaju Katli",
      validityDays: 45,
    },
  },
];

interface RetailPresetSelectorProps {
  selectedPreset: PresetKey;
  onSelectPreset: (preset: PresetItem) => void;
}

export default function RetailPresetSelector({
  selectedPreset,
  onSelectPreset,
}: RetailPresetSelectorProps) {
  return (
    <div className="w-full">
      <p className="text-xs font-bold uppercase tracking-wider text-ink/60 mb-2.5">
        Select a retail preset to preview live:
      </p>
      <div className="flex flex-wrap items-center gap-2.5">
        {PRESET_OPTIONS.map((preset) => {
          const Icon = preset.icon;
          const isSelected = selectedPreset === preset.key;

          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => onSelectPreset(preset)}
              aria-label={`Select ${preset.name} preset`}
              className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 active:scale-95 shadow-sm border ${
                isSelected
                  ? "bg-secondary text-white shadow-brand-sm border-secondary ring-2 ring-primary/30"
                  : "bg-white/80 text-ink/80 hover:bg-white hover:border-ink/20 border-border"
              }`}
            >
              <Icon size={18} />
              <span>{preset.name} ({preset.badge})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

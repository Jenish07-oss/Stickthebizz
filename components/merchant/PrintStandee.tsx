"use client";

import React, { useState } from "react";
import { Printer, Download, Eye } from "lucide-react";
import CounterQR from "@/components/CounterQR";

interface PrintStandeeProps {
  shopName: string;
  slug: string;
  minSpend?: number;
  visitsRequired?: number;
  rewardName?: string;
  validityDays?: number;
}

export default function PrintStandee({
  shopName,
  slug,
  minSpend = 100,
  visitsRequired = 10,
  rewardName = "Free Special Reward",
  validityDays = 30,
}: PrintStandeeProps) {
  return (
    <div className="w-full">
      <CounterQR
        shopName={shopName}
        slug={slug}
        minSpend={minSpend}
        visitsRequired={visitsRequired}
        rewardName={rewardName}
        validityDays={validityDays}
      />
    </div>
  );
}

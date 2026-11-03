"use client";

import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Sparkles, Store, ShieldCheck } from "lucide-react";

interface CounterQRProps {
  shopName: string;
  slug: string;
  minSpend: number;
  visitsNeeded: number;
  rewardName: string;
}

export default function CounterQR({
  shopName = "Kesar Chai Corner",
  slug = "kesar-chai",
  minSpend = 100,
  visitsNeeded = 10,
  rewardName = "Free Masala Chai",
}: CounterQRProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const scanUrl = `https://stickthebizz.in/s/${slug}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center">
      {/* Printable Counter Stand Card */}
      <div
        ref={qrRef}
        className="w-full max-w-[340px] rounded-[2rem] border-4 border-secondary bg-white p-6 text-center shadow-float"
      >
        {/* Top Header Badge */}
        <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 text-xs font-bold text-secondary">
          <Store className="h-3.5 w-3.5 text-primary" />
          Official Counter QR
        </div>

        {/* Shop Name */}
        <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-secondary">
          {shopName}
        </h2>
        <p className="mt-1 text-xs font-semibold text-ink/65">
          Scan with your Phone Camera • No App Needed
        </p>

        {/* QR Code Container */}
        <div className="my-5 flex justify-center rounded-2xl border-2 border-dashed border-border bg-sand/30 p-4">
          <QRCodeSVG
            value={scanUrl}
            size={180}
            level="H"
            bgColor="#FFFFFF"
            fgColor="#413333"
            includeMargin={true}
          />
        </div>

        {/* Reward Incentive Box */}
        <div className="rounded-2xl bg-secondary p-4 text-white">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-primary">
            <Sparkles className="h-4 w-4" />
            <span>LOYSALTY REWARD</span>
          </div>
          <p className="mt-1 font-display text-lg font-extrabold">
            {rewardName}
          </p>
          <p className="mt-1 font-mono text-xs text-white/80">
            Spend ₹{minSpend}+ • Collect {visitsNeeded} stamps
          </p>
        </div>

        {/* Anti-Fraud Footer */}
        <div className="mt-4 flex items-center justify-center gap-1 text-[11px] font-medium text-ink/50">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          Verified 12H Anti-Fraud Protected
        </div>
      </div>

      {/* Action Buttons (Hidden on Print) */}
      <div className="no-print mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-secondary px-6 text-sm font-bold text-white shadow-sm transition hover:bg-primary"
        >
          <Printer className="h-4 w-4" />
          Print Counter Stand
        </button>

        <a
          href="/customer"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-border bg-white px-5 text-sm font-bold text-secondary transition hover:bg-sand"
        >
          Test Scan URL →
        </a>
      </div>
    </div>
  );
}

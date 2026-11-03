"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Sparkles, Store, ShieldCheck, QrCode } from "lucide-react";

interface CounterQRProps {
  shopName?: string;
  name?: string;
  slug?: string;
  minSpend?: number;
  visitsNeeded?: number;
  visitsRequired?: number;
  rewardName?: string;
}

export default function CounterQR({
  shopName,
  name,
  slug = "kesar-chai",
  minSpend = 100,
  visitsNeeded,
  visitsRequired,
  rewardName = "Free Masala Chai",
}: CounterQRProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const displayName = shopName || name || "Kesar Chai Corner";
  const displayVisits = visitsRequired || visitsNeeded || 10;
  const scanUrl = `https://stickthebizz.in/s/${slug}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center">
      {/* 3D Acrylic Table Standee Container */}
      <div className="relative pt-4 pb-8 flex flex-col items-center">
        {/* Glossy Acrylic Standee Body */}
        <div
          ref={qrRef}
          className="relative w-full max-w-[330px] rounded-t-3xl border-4 border-b-0 border-white/80 bg-gradient-to-b from-white via-white to-white/95 p-6 text-center shadow-[0_20px_50px_rgba(49,91,140,0.18)] backdrop-blur-md"
        >
          {/* Acrylic Gloss Reflection Highlight */}
          <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-72 -rotate-45 bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          {/* Standee Top Badge */}
          <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 text-[11px] font-bold text-secondary shadow-sm">
            <Store className="h-3.5 w-3.5 text-primary" />
            Official Counter QR Stand
          </div>

          {/* Shop Title */}
          <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-secondary">
            {displayName}
          </h2>
          <p className="mt-0.5 text-xs font-semibold text-ink/65">
            Scan with any phone camera • Zero app needed
          </p>

          {/* QR Code Inset Box */}
          <div className="my-4 flex justify-center rounded-2xl border-2 border-dashed border-border bg-sand/30 p-4 shadow-inner">
            <QRCodeSVG
              value={scanUrl}
              size={175}
              level="H"
              bgColor="#FFFFFF"
              fgColor="#413333"
              includeMargin={true}
            />
          </div>

          {/* Reward Callout */}
          <div className="rounded-2xl bg-secondary p-4 text-white shadow-md">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-primary">
              <Sparkles className="h-4 w-4" />
              <span>COUNTER REWARD</span>
            </div>
            <p className="mt-1 font-display text-lg font-extrabold">
              {rewardName}
            </p>
            <p className="mt-1 font-mono text-xs text-white/80">
              Spend ₹{minSpend}+ • Complete {displayVisits} stamps
            </p>
          </div>

          {/* Anti-Fraud Notice */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-medium text-ink/50">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            DPDP Safe • 12H Anti-Fraud Guard
          </div>
        </div>

        {/* Acrylic Horizontal Tabletop Base Stand */}
        <div className="relative z-10 w-[360px] h-5 rounded-b-2xl bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 border-t-2 border-slate-300 shadow-[0_12px_24px_rgba(0,0,0,0.18)] flex items-center justify-center">
          <div className="h-1.5 w-36 rounded-full bg-slate-400/60 shadow-inner" />
        </div>

        {/* Physical Table Perspective Ground Shadow */}
        <div className="w-[340px] h-4 bg-slate-900/15 rounded-full blur-md -mt-1" />
      </div>

      {/* Action Buttons (Hidden on Print) */}
      <div className="no-print mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-secondary px-6 text-sm font-bold text-white shadow-sm transition hover:bg-primary"
        >
          <Printer className="h-4 w-4" />
          Print Counter Acrylic Stand
        </button>

        <Link
          href={`/s/${slug}`}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-border bg-white px-5 text-sm font-bold text-secondary transition hover:bg-sand"
        >
          <QrCode className="h-4 w-4 text-primary" />
          Open Live Mobile URL →
        </Link>
      </div>
    </div>
  );
}

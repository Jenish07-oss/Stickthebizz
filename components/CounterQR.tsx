"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Store, ShieldCheck, QrCode, Copy, Check, ExternalLink, X, Download } from "lucide-react";
import { LogoIcon } from "@/components/Logo";
import { decodeHtml } from "@/lib/utils/sanitize";

interface CounterQRProps {
  shopName?: string;
  name?: string;
  slug?: string;
  minSpend?: number;
  visitsNeeded?: number;
  visitsRequired?: number;
  rewardName?: string;
  validityDays?: number;
  qrToken?: string;
  onRotateQr?: () => void;
  isRotating?: boolean;
}

export default function CounterQR({
  shopName,
  name,
  slug = "kesar-chai",
  minSpend = 100,
  visitsNeeded,
  visitsRequired,
  rewardName = "Free Special Item",
  validityDays = 30,
  qrToken,
  onRotateQr,
  isRotating = false,
}: CounterQRProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const rawName = shopName || name || "Kesar Chai Corner";
  const displayName = decodeHtml(rawName);

  const [baseUrl, setBaseUrl] = useState("https://stickthebizz.in");
  const [copied, setCopied] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  // Formulate scan URL with monthly cycle / token parameter
  const tokenQuery = qrToken ? `?cycle=${encodeURIComponent(qrToken)}` : "";
  const scanUrl = `${baseUrl}/s/${slug}${tokenQuery}`;

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(scanUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    // Isolated 1-page print frame: completely bypasses the multi-page dashboard DOM
    const oldFrame = document.getElementById("standee-print-frame");
    if (oldFrame) oldFrame.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "standee-print-frame";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const svgEl = document.getElementById("clean-standee-qr");
    const svgHtml = svgEl ? svgEl.outerHTML : "";

    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${displayName} - Counter QR Standee</title>
  <style>
    @page {
      size: portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      height: 100%;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      page-break-after: avoid;
      break-after: avoid;
    }
    .card {
      width: 100%;
      max-width: 440px;
      text-align: center;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    h1 {
      font-size: 34px;
      font-weight: 900;
      color: #102B4C;
      margin-bottom: 8px;
      line-height: 1.2;
    }
    .sub {
      font-size: 14px;
      font-weight: 600;
      color: #555555;
      margin-bottom: 20px;
    }
    .qr-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 8px 0;
      padding: 16px;
      background: #ffffff;
      border: 2px solid #E5E7EB;
      border-radius: 20px;
    }
    .qr-container svg {
      width: 270px !important;
      height: 270px !important;
    }
    .notice {
      font-size: 12px;
      color: #777777;
      margin-top: 14px;
      margin-bottom: 20px;
    }
    .footer {
      border-top: 2px solid #E5E7EB;
      padding-top: 14px;
      width: 100%;
      max-width: 320px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .footer-text {
      font-size: 13px;
      font-weight: 800;
      color: #102B4C;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>${displayName}</h1>
    <p class="sub">Scan with Phone Camera to Punch Stamp</p>
    <div class="qr-container">
      ${svgHtml}
    </div>
    <p class="notice">No customer app download required • Instant digital loyalty pass</p>
    <div class="footer">
      <svg width="22" height="22" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="14" width="96" height="96" rx="30" fill="#EE634A"/>
        <circle cx="96" cy="18" r="11" fill="#102B4C" stroke="#FFFFFF" stroke-width="4"/>
        <text x="57" y="75" text-anchor="middle" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="44" letter-spacing="-1.5px">sb</text>
      </svg>
      <span class="footer-text"><span style="color: #102B4C; font-weight: 800;">stickthe</span><span style="color: #EE634A; font-weight: 800;">bizz</span><span style="color: #555555; font-weight: 700;">.in</span></span>
    </div>
  </div>
</body>
</html>`);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 250);
  };

  const handleDownloadQr = () => {
    try {
      const svg = document.getElementById("clean-standee-qr");
      if (!svg) return;
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = 1000;
        canvas.height = 1000;
        if (ctx) {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, 1000, 1000);
          ctx.drawImage(img, 0, 0, 1000, 1000);
          const pngFile = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.download = `${slug}-counter-qr.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
        }
      };
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error("QR download error:", err);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Strict Print CSS: isolates ONLY the Standee Print Area and hides all web UI */}
      <style>{`
        @media print {
          html, body {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          body > *:not(#standee-print-target) {
            display: none !important;
          }
          #standee-print-target {
            display: flex !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            max-height: 100vh !important;
            margin: 0 !important;
            padding: 24px !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          @page {
            size: portrait;
            margin: 0;
          }
        }
      `}</style>

      {/* 3D Acrylic Table Standee Container (Dashboard On-Screen Preview) */}
      <div className="relative pt-4 pb-8 flex flex-col items-center">
        {/* Glossy Acrylic Standee Body */}
        <div
          ref={qrRef}
          className="relative w-full max-w-[330px] rounded-t-3xl border-4 border-b-0 border-white/80 bg-gradient-to-b from-white via-white to-white/95 p-6 text-center shadow-[0_20px_50px_rgba(49,91,140,0.18)]"
        >
          {/* Acrylic Gloss Reflection Highlight */}
          <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-72 -rotate-45 bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          {/* Shop Title */}
          <div className="mb-2">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-secondary">
              {displayName}
            </h2>
            <p className="mt-1 text-xs font-semibold text-ink/65">
              Scan with Phone Camera to Punch Stamp
            </p>
          </div>

          {/* QR Code Inset Box */}
          <div className="my-4 flex justify-center rounded-2xl border-2 border-dashed border-border bg-sand/30 p-4 shadow-inner">
            <QRCodeSVG
              id="clean-standee-qr"
              value={scanUrl}
              size={185}
              level="H"
              bgColor="#FFFFFF"
              fgColor="#102B4C"
              includeMargin={true}
            />
          </div>

          {/* Permanent Static Bottom Mark (Strictly NO dynamic changing rules) */}
          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-center gap-1.5 text-xs text-ink/70">
            <LogoIcon size={16} />
            <span className="font-bold text-secondary">stickthebizz.in</span>
            <span className="text-ink/40">• Digital Loyalty Pass</span>
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
      <div className="no-print mt-2 flex flex-col items-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPrintModalOpen(true)}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-secondary px-6 text-sm font-bold text-white shadow-sm transition hover:bg-primary"
          >
            <Printer className="h-4 w-4" />
            <span>Print Acrylic Counter Standee (5x7)</span>
          </button>

          {onRotateQr && (
            <button
              type="button"
              disabled={isRotating}
              onClick={onRotateQr}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-primary bg-primary/10 px-5 text-sm font-bold text-primary transition hover:bg-primary hover:text-white disabled:opacity-50"
            >
              <QrCode className="h-4 w-4" />
              {isRotating ? "Rotating QR..." : "Rotate / Refresh Monthly QR"}
            </button>
          )}

          <Link
            href={`/s/${slug}${tokenQuery}`}
            target="_self"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-border bg-white px-5 text-sm font-bold text-secondary transition hover:bg-sand"
          >
            <ExternalLink className="h-4 w-4 text-primary" />
            <span>Test Customer Pass (/s/{slug})</span>
          </Link>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-border bg-white px-5 text-sm font-bold text-secondary transition hover:bg-sand"
          >
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-primary" />}
            <span>{copied ? "URL Copied!" : "Copy Scan URL"}</span>
          </button>
        </div>

        {/* Scan URL Indicator */}
        <div className="mt-1 flex items-center gap-2 text-xs font-mono text-ink/60 bg-sand/60 px-3 py-1.5 rounded-xl border border-border">
          <span className="font-bold text-secondary">Live QR Link:</span>
          <span className="text-primary truncate max-w-[280px] sm:max-w-md">{scanUrl}</span>
        </div>
      </div>

      {/* PRINT PREVIEW MODAL */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/80 p-4 backdrop-blur-sm animate-in fade-in no-print">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-border">
            <button
              type="button"
              onClick={() => setPrintModalOpen(false)}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-sand text-ink/60 hover:text-secondary"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 text-xs font-bold text-secondary">
                <Printer className="h-3.5 w-3.5 text-primary" />
                PRINT-READY 5x7 COUNTER STANDEE
              </span>
              <h3 className="mt-2 font-display text-xl font-extrabold text-secondary">
                Physical Acrylic Standee Preview
              </h3>
              <p className="mt-1 text-xs text-ink/65">
                Optimized with zero background web clutter. Only your fixed shop name, sharp QR code, and small bottom company mark.
              </p>
            </div>

            {/* Standee Preview Frame */}
            <div className="my-6 mx-auto flex flex-col items-center justify-center rounded-2xl border-2 border-border/80 bg-white p-6 shadow-sm max-w-[320px]">
              <h4 className="font-display text-2xl font-extrabold text-[#102B4C] text-center">
                {displayName}
              </h4>
              <p className="mt-1 text-[11px] font-semibold text-ink/70 text-center">
                Scan with Phone Camera to Punch Stamp
              </p>

              <div className="my-4 p-2 bg-white rounded-xl border border-border/60">
                <QRCodeSVG
                  value={scanUrl}
                  size={190}
                  level="H"
                  bgColor="#FFFFFF"
                  fgColor="#102B4C"
                  includeMargin={true}
                />
              </div>

              <p className="text-[10px] text-ink/50 text-center">
                Zero app downloads • Instant digital pass
              </p>

              <div className="mt-3 pt-2.5 border-t border-border/50 w-full flex items-center justify-center gap-1.5 text-[11px] text-ink/60">
                <LogoIcon size={14} />
                <span className="font-bold text-secondary">stickthebizz.in</span>
              </div>
            </div>

            {/* Print Modal Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-white shadow-card transition hover:bg-primary/90"
              >
                <Printer className="h-4 w-4" />
                <span>Print Standee Now</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadQr}
                className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-border bg-sand/40 px-4 text-xs font-bold text-secondary transition hover:bg-sand"
              >
                <Download className="h-4 w-4 text-primary" />
                <span>Download QR (PNG)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED PRINT CONTAINER: This is the ONLY element visible during window.print() */}
      <div id="standee-print-target" className="hidden print:flex">
        <div style={{ textAlign: "center", maxWidth: "420px", width: "100%", padding: "24px", boxSizing: "border-box" }}>
          <h1 style={{ fontFamily: "sans-serif", fontSize: "36px", fontWeight: "900", color: "#102B4C", margin: "0 0 8px 0", letterSpacing: "-0.5px" }}>
            {displayName}
          </h1>
          <p style={{ fontFamily: "sans-serif", fontSize: "14px", fontWeight: "600", color: "#555555", margin: "0 0 24px 0" }}>
            Scan with Phone Camera to Punch Stamp
          </p>

          <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
            <QRCodeSVG
              value={scanUrl}
              size={290}
              level="H"
              bgColor="#FFFFFF"
              fgColor="#102B4C"
              includeMargin={true}
            />
          </div>

          <p style={{ fontFamily: "sans-serif", fontSize: "12px", color: "#777777", margin: "16px 0 24px 0" }}>
            No customer app download required • Instant digital loyalty card
          </p>

          <div style={{ borderTop: "2px solid #E5E7EB", paddingTop: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <LogoIcon size={20} />
            <span style={{ fontFamily: "sans-serif", fontSize: "14px", fontWeight: "800" }}>
              <span style={{ color: "#102B4C" }}>stickthe</span>
              <span style={{ color: "#EE634A" }}>bizz</span>
              <span style={{ color: "#555555" }}>.in</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

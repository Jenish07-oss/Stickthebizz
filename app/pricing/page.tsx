"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  CheckCircle2,
  Sparkles,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Calculator,
  ChevronDown,
} from "lucide-react";

export default function PricingPage() {
  const [dailyFootfall, setDailyFootfall] = useState(150);
  const [avgBill, setAvgBill] = useState(120);

  // Return visits uplift calculation (18% return lift)
  const monthlyExtraVisits = Math.round(dailyFootfall * 0.18 * 30);
  const extraRevenue = Math.round(monthlyExtraVisits * avgBill);

  return (
    <div className="flex min-h-screen flex-col bg-sand overflow-x-hidden">
      <Navbar />

      <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-white/80 px-4 py-1.5 font-mono text-xs font-bold text-secondary shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              TRANSPARENT, FLAT-RATE BILLING
            </div>
            <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-secondary sm:text-5xl">
              One Flat Price. Unlimited Daily Customer Loyalty.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink/75">
              Zero commission on your sales. No hardware rental. One low monthly fee turns walk-ins into guaranteed repeat regulars.
            </p>
          </div>

          {/* Definitive Single Plan Card */}
          <div className="mt-14 max-w-2xl mx-auto">
            <div className="relative rounded-[2.5rem] border-2 border-primary bg-secondary p-8 sm:p-12 text-white shadow-float flex flex-col justify-between overflow-hidden">
              {/* Highlight ribbon */}
              <div className="absolute top-0 right-0 rounded-bl-2xl bg-primary px-5 py-1.5 font-mono text-xs font-extrabold uppercase tracking-wider text-white">
                ALL-INCLUSIVE PRO COUNTER
              </div>

              <div>
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 font-mono text-xs font-bold text-coral">
                  SINGLE DEFINITIVE TIER
                </span>
                <h2 className="mt-4 font-display text-3xl sm:text-4xl font-extrabold text-white">
                  Unlimited Retail Counter Plan
                </h2>

                <div className="mt-6 flex items-baseline gap-2 border-b border-white/15 pb-6">
                  <span className="font-display text-5xl sm:text-6xl font-extrabold text-white">
                    ₹749
                  </span>
                  <span className="text-base font-semibold text-white/70">
                    / month (flat rate, no hidden cuts)
                  </span>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-white/80">
                  Everything you need to turn walk-in diners and shoppers into habit-forming daily regulars.
                </p>

                <ul className="mt-8 space-y-4 text-sm font-semibold text-white/95">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-coral shrink-0 mt-0.5" />
                    <span>Unlimited customer passes &amp; digital punch cards</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-coral shrink-0 mt-0.5" />
                    <span>Unlimited counter QR scans &amp; automated daily midnight resets</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-coral shrink-0 mt-0.5" />
                    <span>Multi-category custom streak rules (e.g., 10 Chais → 1 Free; ₹3,000 Spend → 1L Oil)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-coral shrink-0 mt-0.5" />
                    <span>High-resolution, printable custom acrylic QR Standee artwork (5x7 inch)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-coral shrink-0 mt-0.5" />
                    <span>Real-time cashier terminal with WebSockets audio feedback</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-coral shrink-0 mt-0.5" />
                    <span>Full customer analytics, visit timestamps, and retention logs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-coral shrink-0 mt-0.5" />
                    <span>WhatsApp &amp; Web Push customer re-engagement capabilities</span>
                  </li>
                </ul>
              </div>

              <div className="mt-10 pt-6 border-t border-white/15">
                <Link
                  href="/auth/owner/register"
                  replace={false}
                  className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-bold text-white shadow-card transition hover:bg-primary/90 hover:scale-[1.01] active:scale-95"
                >
                  <span>Register My Shop Counter Now</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <p className="mt-2.5 text-center font-mono text-xs text-white/60">
                  Instant activation • Zero POS hardware required • Cancel anytime
                </p>
              </div>
            </div>
          </div>

          {/* ROI Calculator Section */}
          <div className="mt-20 mx-auto max-w-4xl rounded-[2.5rem] border border-border bg-white p-8 sm:p-12 shadow-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 font-mono text-xs font-bold text-secondary">
                  <Calculator className="h-3.5 w-3.5 text-primary" />
                  RETAIL ROI CALCULATOR
                </div>
                <h3 className="mt-3 font-display text-2xl font-extrabold text-secondary">
                  Estimate Your Monthly Net Revenue Gain
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-ink/70">
                  See how an estimated 18% lift in repeat footfall compares against the flat ₹749/mo fee.
                </p>
              </div>

              <div className="rounded-2xl bg-sand/60 p-5 border border-border text-right shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-ink/60">
                  Estimated Monthly Net Gain
                </span>
                <p className="font-display text-3xl sm:text-4xl font-extrabold text-success">
                  +₹{(extraRevenue - 749).toLocaleString("en-IN")}
                </p>
                <span className="font-mono text-xs text-ink/60">
                  +{monthlyExtraVisits} extra customer visits
                </span>
              </div>
            </div>

            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="footfall" className="text-sm font-bold text-secondary">
                    Average Daily Footfall
                  </label>
                  <span className="font-mono text-base font-extrabold text-primary">
                    {dailyFootfall} customers / day
                  </span>
                </div>
                <input
                  id="footfall"
                  type="range"
                  min="30"
                  max="600"
                  step="10"
                  value={dailyFootfall}
                  onChange={(e) => setDailyFootfall(Number(e.target.value))}
                  className="mt-3 w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-ink/50 mt-1">
                  <span>30</span>
                  <span>300</span>
                  <span>600+</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="avgBill" className="text-sm font-bold text-secondary">
                    Average Order Value (₹)
                  </label>
                  <span className="font-mono text-base font-extrabold text-primary">
                    ₹{avgBill}
                  </span>
                </div>
                <input
                  id="avgBill"
                  type="range"
                  min="20"
                  max="1000"
                  step="10"
                  value={avgBill}
                  onChange={(e) => setAvgBill(Number(e.target.value))}
                  className="mt-3 w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-ink/50 mt-1">
                  <span>₹20</span>
                  <span>₹500</span>
                  <span>₹1,000+</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transparent FAQ */}
          <div className="mt-20 mx-auto max-w-3xl">
            <h3 className="text-center font-display text-3xl font-extrabold text-secondary">
              Frequently Asked Questions
            </h3>
            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <h4 className="font-display text-base font-bold text-secondary">
                  Do my customers need to download an app from Play Store or App Store?
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-ink/75">
                  No! Customers simply scan the QR standee with their standard smartphone camera. The pass opens instantly in their browser with zero app installation, zero downloads, and zero passwords.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <h4 className="font-display text-base font-bold text-secondary">
                  How does the strict 1-scan per day frequency restriction work?
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-ink/75">
                  Our system enforces a database-level unique constraint per (customer, store, calendar date IST). Once verified, the pass automatically locks and displays a live countdown unlocking strictly at 12:00:00 AM IST. Customers cannot spam repeat scans.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <h4 className="font-display text-base font-bold text-secondary">
                  Do I need to buy a POS machine or barcode scanner?
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-ink/75">
                  No expensive hardware is needed. You open your merchant terminal on any smartphone, tablet, or cashier computer to receive instant audio dings and approve scans with 1 tap.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <h4 className="font-display text-base font-bold text-secondary">
                  Can I change my reward rule later (e.g. 7 visits vs 10 visits)?
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-ink/75">
                  Yes, you have full control in your merchant dashboard to update your minimum bill spend, required visits count, and reward description anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

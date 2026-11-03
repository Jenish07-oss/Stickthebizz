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
              TRANSPARENT, HONEST BILLING
            </div>
            <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-secondary sm:text-5xl">
              Pay ₹199/Month. Gain ₹15,000+ in Repeat Revenue.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink/75">
              No hidden fees, no per-scan cuts, no hardware rental. First 50 customers are 100% free to test at your counter.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="mt-14 grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto items-stretch">
            {/* Free Trial Tier */}
            <div className="rounded-[2.5rem] border border-border bg-white p-8 sm:p-10 shadow-card flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center rounded-full bg-sand px-3 py-1 font-mono text-xs font-bold text-secondary">
                  STARTER COUNTER TRIAL
                </span>
                <h2 className="mt-4 font-display text-3xl font-extrabold text-secondary">
                  First 50 Customers
                </h2>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-extrabold text-ink">₹0</span>
                  <span className="text-sm font-semibold text-ink/60">forever for first 50 scans</span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink/70">
                  Perfect for testing customer reception at your tea stall, bakery, or salon before subscribing.
                </p>

                <ul className="mt-8 space-y-3.5 text-sm font-semibold text-ink/80">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                    <span>Printable Acrylic Counter Stand QR</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                    <span>12-Hour Midnight Anti-Fraud Guard</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                    <span>Verified Customer Ratings &amp; Reviews</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                    <span>Live Cashier Counter Terminal</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                    <span>Zero Credit Card Required</span>
                  </li>
                </ul>
              </div>

              <div className="mt-10">
                <Link
                  href="/owner"
                  className="flex min-h-[48px] w-full items-center justify-center rounded-full border-2 border-secondary bg-white text-sm font-bold text-secondary transition hover:bg-secondary hover:text-white"
                >
                  Start Free Counter Trial
                </Link>
              </div>
            </div>

            {/* Pro Unlimited Tier */}
            <div className="relative rounded-[2.5rem] border-2 border-primary bg-secondary p-8 sm:p-10 text-white shadow-float flex flex-col justify-between">
              <div className="absolute -top-3.5 right-8 rounded-full bg-primary px-4 py-1 font-mono text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                MOST POPULAR
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-mono text-xs font-bold text-primary">
                  <Zap className="h-3.5 w-3.5" />
                  UNLIMITED GROWTH PLAN
                </span>
                <h2 className="mt-4 font-display text-3xl font-extrabold text-white">
                  Unlimited Regulars
                </h2>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-extrabold text-primary">₹199</span>
                  <span className="text-sm font-semibold text-white/75">/ month (all inclusive)</span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/80">
                  Less than the cost of 2 special chais or 1 thali. Build thousands of verified daily regulars without worrying about scan limits.
                </p>

                <ul className="mt-8 space-y-3.5 text-sm font-semibold text-white/90">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span><strong>Unlimited</strong> Scans &amp; Punch Cards</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>Free Pre-Printed Acrylic Table Standee Shipped</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>Real-time Sound Synthesis &amp; Multi-Device Terminal</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>Full DPDP Act 2023 Masked Customer Directory</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>Priority WhatsApp Onboarding &amp; Phone Support</span>
                  </li>
                </ul>
              </div>

              <div className="mt-10">
                <Link
                  href="/owner"
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-white shadow-sm transition hover:bg-white hover:text-secondary"
                >
                  <span>Activate Unlimited Plan</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Interactive ROI Calculator */}
          <div className="mt-20 rounded-[2.5rem] border border-border bg-white p-8 sm:p-12 shadow-card max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-coral/15 px-3 py-1 font-mono text-xs font-bold text-primary">
                <Calculator className="h-3.5 w-3.5" />
                INTERACTIVE ROI ESTIMATOR
              </span>
              <h3 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold text-secondary">
                See Your Store&apos;s Return on ₹199/Month
              </h3>
            </div>

            <div className="mt-10 grid gap-8 md:grid-cols-12 items-center">
              <div className="space-y-6 md:col-span-7">
                <div>
                  <div className="flex justify-between text-sm font-bold text-secondary">
                    <span>Average Daily Footfall</span>
                    <span className="font-mono text-primary font-extrabold text-base">
                      {dailyFootfall} Customers
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={500}
                    step={10}
                    value={dailyFootfall}
                    onChange={(e) => setDailyFootfall(Number(e.target.value))}
                    className="mt-3 w-full accent-primary h-2 rounded-lg bg-sand cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-ink/40 mt-1">
                    <span>50 customers/day</span>
                    <span>500 customers/day</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-bold text-secondary">
                    <span>Average Bill Value</span>
                    <span className="font-mono text-primary font-extrabold text-base">
                      ₹{avgBill} / Visit
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={500}
                    step={10}
                    value={avgBill}
                    onChange={(e) => setAvgBill(Number(e.target.value))}
                    className="mt-3 w-full accent-primary h-2 rounded-lg bg-sand cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-ink/40 mt-1">
                    <span>₹50</span>
                    <span>₹500</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-secondary p-6 text-white text-center md:col-span-5 shadow-card">
                <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                  Estimated Monthly Revenue Lift
                </p>
                <p className="mt-3 font-display text-4xl sm:text-5xl font-extrabold text-primary">
                  +₹{extraRevenue.toLocaleString("en-IN")}
                </p>
                <p className="mt-1 font-mono text-xs text-white/75">
                  Generated from ~{monthlyExtraVisits} repeat customer visits
                </p>
                <div className="mt-5 border-t border-white/15 pt-3 text-xs text-white/80">
                  Cost: ₹199/mo • Net Profit:{" "}
                  <strong className="text-success font-bold">
                    +₹{(extraRevenue - 199).toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing FAQ */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h3 className="font-display text-2xl font-extrabold text-secondary text-center">
              Pricing Questions &amp; Answers
            </h3>

            <div className="mt-8 space-y-4">
              <details className="group rounded-2xl border border-border bg-white p-5 open:bg-sand/40 transition">
                <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between font-display text-base font-bold text-secondary">
                  Is there any lock-in contract or cancellation fee?
                  <ChevronDown className="h-5 w-5 text-primary transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-ink/75">
                  No lock-ins. You can cancel your ₹199/month subscription anytime with one click. Your printed QR stand remains valid until the end of your billing cycle.
                </p>
              </details>

              <details className="group rounded-2xl border border-border bg-white p-5 open:bg-sand/40 transition">
                <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between font-display text-base font-bold text-secondary">
                  Do I have to pay per customer scan or SMS?
                  <ChevronDown className="h-5 w-5 text-primary transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-ink/75">
                  No! StickTheBizz does not charge per-scan commissions or SMS fees. Everything runs directly in the mobile browser without draining your wallet.
                </p>
              </details>

              <details className="group rounded-2xl border border-border bg-white p-5 open:bg-sand/40 transition">
                <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between font-display text-base font-bold text-secondary">
                  How do I receive the physical acrylic QR stand?
                  <ChevronDown className="h-5 w-5 text-primary transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-ink/75">
                  You can immediately print the ready-made standee from your terminal on any printer. Additionally, Pro subscribers can request a pre-printed heavy acrylic standee shipped directly to their counter address.
                </p>
              </details>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


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
  Clock,
  Tag,
} from "lucide-react";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [dailyFootfall, setDailyFootfall] = useState(150);
  const [avgBill, setAvgBill] = useState(120);

  // Return visits uplift calculation (18% return lift)
  const monthlyExtraVisits = Math.round(dailyFootfall * 0.18 * 30);
  const extraRevenue = Math.round(monthlyExtraVisits * avgBill);
  const planFee = billingCycle === "yearly" ? 599 : 749;

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
              Zero commission on your sales. No hardware rental. One flat fee turns walk-ins into guaranteed repeat regulars.
            </p>

            {/* Billing Interval Switcher */}
            <div className="mt-8 inline-flex items-center rounded-full bg-white p-1.5 border border-border shadow-sm">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-secondary text-white shadow-sm"
                    : "text-ink/70 hover:text-secondary"
                }`}
              >
                Monthly Plan (₹749/mo)
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition-all ${
                  billingCycle === "yearly"
                    ? "bg-primary text-white shadow-sm"
                    : "text-ink/70 hover:text-secondary"
                }`}
              >
                <span>Annual Plan (20% OFF)</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white">
                  Save ₹1,798
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Comparison Grid */}
          <div className="mt-12 grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
            {/* 1. Monthly Plan */}
            <div className={`relative rounded-[2.5rem] p-8 sm:p-10 flex flex-col justify-between transition-all border-2 ${
              billingCycle === "monthly"
                ? "border-primary bg-white shadow-float ring-2 ring-primary/20"
                : "border-border bg-white/70"
            }`}>
              <div>
                <span className="inline-flex items-center rounded-full bg-sand px-3 py-1 font-mono text-xs font-bold text-secondary">
                  FLEXIBLE MONTHLY
                </span>
                <h2 className="mt-4 font-display text-2xl sm:text-3xl font-extrabold text-secondary">
                  Monthly Counter Pro
                </h2>
                <div className="mt-4 flex items-baseline gap-2 border-b border-border pb-6">
                  <span className="font-display text-4xl sm:text-5xl font-extrabold text-secondary">
                    ₹749
                  </span>
                  <span className="text-xs font-semibold text-ink/65">
                    / month (flat rate)
                  </span>
                </div>

                <p className="mt-4 text-xs sm:text-sm text-ink/75 leading-relaxed">
                  Ideal for new shops starting digital streak loyalty with month-to-month flexibility.
                </p>

                <ul className="mt-6 space-y-3.5 text-xs font-semibold text-secondary">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Unlimited customer passes &amp; digital punch cards</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Custom acrylic QR standee artwork (5x7 inch)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Real-time cashier terminal with audio feedback</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Automated daily 12:00 AM IST visit resets</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>1-Day Grace Period</strong> on renewal date</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <Link
                  href="/auth/owner/register?plan=monthly"
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-secondary text-sm font-bold text-white shadow-sm transition hover:bg-secondary/90"
                >
                  <span>Choose Monthly Plan (₹749)</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-2 text-center text-[11px] text-ink/50">
                  Includes 1-day grace period • Cancel anytime
                </p>
              </div>
            </div>

            {/* 2. Yearly Plan (20% OFF) */}
            <div className={`relative rounded-[2.5rem] p-8 sm:p-10 flex flex-col justify-between text-white transition-all border-2 ${
              billingCycle === "yearly"
                ? "border-primary bg-secondary shadow-float ring-2 ring-primary/30"
                : "border-secondary bg-secondary/90"
            }`}>
              {/* Highlight ribbon */}
              <div className="absolute top-0 right-0 rounded-bl-2xl bg-primary px-4 py-1.5 font-mono text-xs font-extrabold uppercase tracking-wider text-white">
                BEST VALUE • SAVE 20%
              </div>

              <div>
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 font-mono text-xs font-bold text-coral">
                  ANNUAL PREPAID PASS
                </span>
                <h2 className="mt-4 font-display text-2xl sm:text-3xl font-extrabold text-white">
                  Annual Counter Pro
                </h2>
                <div className="mt-4 flex items-baseline gap-2 border-b border-white/15 pb-6">
                  <span className="font-display text-4xl sm:text-5xl font-extrabold text-white">
                    ₹7,190
                  </span>
                  <span className="text-xs line-through text-white/50">
                    ₹8,988
                  </span>
                  <span className="text-xs font-semibold text-white/80">
                    / year (~₹599/mo)
                  </span>
                </div>

                <p className="mt-4 text-xs sm:text-sm text-white/80 leading-relaxed">
                  Best value for established cafes and retail stores. Lock in 365 days of repeat regulars with 20% savings.
                </p>

                <ul className="mt-6 space-y-3.5 text-xs font-semibold text-white/95">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-coral shrink-0 mt-0.5" />
                    <span><strong>Everything in Monthly Plan</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-coral shrink-0 mt-0.5" />
                    <span><strong>Flat 20% Discount</strong> (Save ₹1,798 every year)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-coral shrink-0 mt-0.5" />
                    <span>High-resolution vector standee artwork (PDF + SVG)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-coral shrink-0 mt-0.5" />
                    <span>Priority WhatsApp &amp; phone onboarding support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-coral shrink-0 mt-0.5" />
                    <span><strong>1-Day Grace Period</strong> upon expiry date</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-white/15">
                <Link
                  href="/auth/owner/register?plan=yearly"
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-white shadow-card transition hover:bg-primary/90 hover:scale-[1.01]"
                >
                  <span>Choose Annual Plan (₹7,190 • Save 20%)</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-2 text-center text-[11px] text-white/60">
                  Instant activation • 365 days + 1 day grace period
                </p>
              </div>
            </div>
          </div>

          {/* Redeem Code Guarantee Banner */}
          <div className="mt-12 max-w-3xl mx-auto rounded-3xl bg-white p-6 border border-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-display text-sm font-extrabold text-secondary">
                  Have a Partner Redeem Code or Beta Pass?
                </h4>
                <p className="text-xs text-ink/70">
                  You can enter your redeem code on the registration page for instant discounts or ₹0 free activation.
                </p>
              </div>
            </div>
            <Link
              href="/auth/owner/register"
              className="shrink-0 rounded-xl bg-sand px-4 py-2 text-xs font-bold text-secondary border border-border hover:bg-white"
            >
              Enter Redeem Code →
            </Link>
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
                  See how an estimated 18% lift in repeat footfall compares against the {billingCycle === "yearly" ? "₹599/mo (annual)" : "₹749/mo"} subscription.
                </p>
              </div>

              <div className="rounded-2xl bg-sand/60 p-5 border border-border text-right shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-ink/60">
                  Estimated Monthly Net Gain
                </span>
                <p className="font-display text-3xl sm:text-4xl font-extrabold text-success">
                  +₹{(extraRevenue - planFee).toLocaleString("en-IN")}
                </p>
                <span className="font-mono text-xs text-ink/60">
                  +{monthlyExtraVisits} extra customer visits
                </span>
              </div>
            </div>

            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <div>
                <div className="flex justify-between text-xs font-bold text-secondary">
                  <span>Current Daily Footfall:</span>
                  <span className="font-mono text-primary">{dailyFootfall} walk-ins/day</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="800"
                  step="10"
                  value={dailyFootfall}
                  onChange={(e) => setDailyFootfall(Number(e.target.value))}
                  className="mt-3 w-full accent-primary cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-secondary">
                  <span>Average Bill Amount:</span>
                  <span className="font-mono text-primary">₹{avgBill} / customer</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="1200"
                  step="20"
                  value={avgBill}
                  onChange={(e) => setAvgBill(Number(e.target.value))}
                  className="mt-3 w-full accent-primary cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

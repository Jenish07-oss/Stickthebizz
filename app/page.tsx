"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StampGrid from "@/components/StampGrid";
import ConfettiEffect from "@/components/ConfettiEffect";
import { useStore, CategoryPreset, CATEGORY_PRESETS } from "@/context/StoreContext";
import {
  Sparkles,
  ArrowRight,
  Store,
  Smartphone,
  CheckCircle2,
  Lock,
  ChevronDown,
  TrendingUp,
  Calculator,
  Coffee,
  ShoppingBag,
  Utensils,
  BellRing,
} from "lucide-react";

export default function HomePage() {
  const {
    rule,
    setCategory,
    customer,
    pendingQueue,
    submitScan,
    approveScan,
  } = useStore();

  const [activeCategory, setActiveCategory] = useState<CategoryPreset>("chai");
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // ROI Calculator states
  const [dailyFootfall, setDailyFootfall] = useState<number>(180);
  const [averageBill, setAverageBill] = useState<number>(120);

  // Extra return visits from loyalty streak (estimated 18% lift)
  const monthlyExtraVisits = Math.round(dailyFootfall * 0.18 * 30);
  const monthlyExtraRevenue = Math.round(monthlyExtraVisits * averageBill);

  const handleCategoryChange = (cat: CategoryPreset) => {
    setActiveCategory(cat);
    setCategory(cat);
  };

  const handleSimulateScan = () => {
    const res = submitScan(rule.minSpend);
    setFeedbackToast(res.message);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handleApproveFromHome = (id: string) => {
    approveScan(id);
    if (customer.visits + 1 >= rule.visitsRequired) {
      setShowConfetti(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-sand overflow-x-hidden">
      <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="grain relative overflow-hidden px-4 pb-20 pt-12 sm:px-6 sm:pt-20 lg:px-8 lg:pb-28">
          <div className="pointer-events-none absolute -right-36 top-10 h-96 w-96 rounded-full border-[40px] border-primary/10" />
          <div className="pointer-events-none absolute -left-24 bottom-10 h-64 w-64 rounded-full bg-secondary/5" />

          <div className="mx-auto max-w-7xl">
            {/* Value Proposition */}
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-white/70 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-secondary shadow-sm">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Made for Bharat&apos;s Retail Counters
              </div>

              <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-secondary sm:text-5xl lg:text-6xl">
                Turn Walk-in Diners &amp; Kirana Shoppers into{" "}
                <span className="text-primary underline decoration-primary/30 decoration-wavy">
                  Daily Regulars.
                </span>
              </h1>

              <p className="mt-5 text-lg leading-relaxed text-ink/80 sm:text-xl">
                Zero app downloads. One counter QR stand. Watch how an interactive punch card on a customer&apos;s phone syncs live with the shopkeeper&apos;s terminal.
              </p>

              {/* Category Template Selector */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleCategoryChange("chai")}
                  className={`inline-flex min-h-[48px] items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition shadow-sm ${
                    activeCategory === "chai"
                      ? "bg-secondary text-white"
                      : "bg-white text-ink/70 hover:bg-sand"
                  }`}
                >
                  <Coffee className="h-4 w-4 text-primary" />
                  Chai Stall (10 Visits → Free Chai)
                </button>

                <button
                  type="button"
                  onClick={() => handleCategoryChange("kirana")}
                  className={`inline-flex min-h-[48px] items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition shadow-sm ${
                    activeCategory === "kirana"
                      ? "bg-secondary text-white"
                      : "bg-white text-ink/70 hover:bg-sand"
                  }`}
                >
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  Patel Kirana (₹3k Spend → 1L Oil)
                </button>

                <button
                  type="button"
                  onClick={() => handleCategoryChange("burger")}
                  className={`inline-flex min-h-[48px] items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition shadow-sm ${
                    activeCategory === "burger"
                      ? "bg-secondary text-white"
                      : "bg-white text-ink/70 hover:bg-sand"
                  }`}
                >
                  <Utensils className="h-4 w-4 text-primary" />
                  Burger Joint (7 Visits → Free Burger)
                </button>
              </div>
            </div>

            {/* SIDE-BY-SIDE LIVE SIMULATOR */}
            <div className="mt-14 grid items-start gap-8 lg:grid-cols-2">
              {/* LEFT: Customer Phone Card */}
              <div className="rounded-[2.4rem] border-2 border-secondary/20 bg-white p-6 shadow-phone">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
                      <Smartphone className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
                        Customer Mobile View
                      </p>
                      <h2 className="font-display text-base font-extrabold text-secondary">
                        {rule.name}
                      </h2>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-primary">
                    Min ₹{rule.minSpend}
                  </span>
                </div>

                <div className="mt-5 rounded-2xl bg-sand/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display text-lg font-extrabold text-secondary">
                        {customer.visits} of {rule.visitsRequired} visits
                      </p>
                      <p className="text-xs text-ink/65">
                        Reward: <strong className="text-primary">{rule.rewardName}</strong>
                      </p>
                    </div>
                    <span className="rounded-full bg-coral/15 px-2.5 py-1 font-mono text-[10px] font-bold text-primary">
                      {customer.visits >= rule.visitsRequired ? "REWARD UNLOCKED" : "ACTIVE"}
                    </span>
                  </div>

                  <div className="mt-4">
                    <StampGrid
                      totalVisits={rule.visitsRequired}
                      completedVisits={customer.visits}
                      rewardName={rule.rewardName}
                    />
                  </div>

                  {/* Customer Scan Action */}
                  <div className="mt-5">
                    {customer.lockedUntilMidnight ? (
                      <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-center text-xs font-semibold text-ink">
                        <Lock className="inline h-3.5 w-3.5 text-warning mr-1" />
                        Today&apos;s visit verified! Next stamp unlocks at 12:00 AM IST.
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSimulateScan}
                        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-sm transition hover:bg-secondary focus-visible:outline focus-visible:outline-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        Simulate Customer Camera Scan
                      </button>
                    )}

                    {feedbackToast && (
                      <p className="mt-2 text-center text-xs font-bold text-primary animate-pulse">
                        {feedbackToast}
                      </p>
                    )}
                  </div>
                </div>

                <p className="mt-3 text-center text-[11px] text-ink/50">
                  Customer opens this directly in browser • No app download needed
                </p>
              </div>

              {/* RIGHT: Shopkeeper Counter Terminal */}
              <div className="rounded-[2.4rem] border-2 border-secondary/20 bg-secondary p-6 text-white shadow-card">
                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-primary">
                      <Store className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                        Cashier Counter Terminal
                      </p>
                      <h2 className="font-display text-base font-extrabold text-white">
                        Live Incoming Queue
                      </h2>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-mono text-xs font-bold text-primary">
                    <BellRing className="h-3 w-3 animate-bell-ring" />
                    {pendingQueue.filter((q) => q.status === "pending").length} Waiting
                  </span>
                </div>

                {/* Queue items */}
                <div className="mt-5 space-y-3">
                  {pendingQueue.filter((q) => q.status === "pending").length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center">
                      <p className="text-sm font-semibold text-white/80">
                        Queue is currently clear!
                      </p>
                      <p className="mt-1 text-xs text-white/60">
                        Tap &ldquo;Simulate Customer Camera Scan&rdquo; on the left card to send a live check-in.
                      </p>
                    </div>
                  ) : (
                    pendingQueue
                      .filter((q) => q.status === "pending")
                      .map((scan) => (
                        <div
                          key={scan.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-white p-4 text-ink shadow-sm animate-stamp-pop"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-extrabold text-secondary">
                                {scan.customerMasked}
                              </span>
                              <span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink/70">
                                ₹{scan.amount} Bill
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-ink/50">{scan.formattedTime}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleApproveFromHome(scan.id)}
                              className="inline-flex min-h-[48px] items-center gap-1 rounded-xl bg-success px-5 text-xs font-bold text-white transition hover:opacity-90 shadow-sm"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              1-Tap Approve
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>

                {/* Counter Terminal Info */}
                <div className="mt-5 rounded-2xl bg-white/10 p-4 text-xs text-white/80 flex items-center justify-between">
                  <span>Merchant audio feedback enabled</span>
                  <Link
                    href="/owner"
                    className="font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    Open Full Terminal →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE ROI CALCULATOR */}
        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-coral/15 px-3 py-1 font-mono text-xs font-bold text-primary">
                <Calculator className="h-3.5 w-3.5" />
                PROVEN RETAIL ROI
              </span>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-secondary sm:text-4xl">
                How much extra revenue can StickTheBizz bring you?
              </h2>
              <p className="mt-2 text-sm text-ink/70">
                Adjust your daily footfall and bill size to estimate extra monthly sales generated by customer streaks.
              </p>
            </div>

            <div className="mt-12 rounded-[2.5rem] border border-border bg-sand/30 p-8 shadow-card sm:p-12 md:grid md:grid-cols-12 md:gap-8 items-center">
              {/* Sliders (7 cols) */}
              <div className="space-y-6 md:col-span-7">
                <div>
                  <div className="flex justify-between text-sm font-bold text-secondary">
                    <span>Daily Counter Footfall</span>
                    <span className="font-mono text-primary text-base font-extrabold">
                      {dailyFootfall} Customers / Day
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
                    <span>50 customers</span>
                    <span>500 customers</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-bold text-secondary">
                    <span>Average Customer Bill Amount</span>
                    <span className="font-mono text-primary text-base font-extrabold">
                      ₹{averageBill} / Visit
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={500}
                    step={10}
                    value={averageBill}
                    onChange={(e) => setAverageBill(Number(e.target.value))}
                    className="mt-3 w-full accent-primary h-2 rounded-lg bg-sand cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-ink/40 mt-1">
                    <span>₹50</span>
                    <span>₹500</span>
                  </div>
                </div>
              </div>

              {/* Calculator Output Card (5 cols) */}
              <div className="mt-8 md:mt-0 rounded-3xl bg-secondary p-6 text-white shadow-card md:col-span-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                  Estimated Monthly Uplift
                </p>
                <p className="mt-3 font-display text-4xl sm:text-5xl font-extrabold text-primary">
                  +₹{monthlyExtraRevenue.toLocaleString("en-IN")}
                </p>
                <p className="mt-2 font-mono text-xs text-white/80">
                  From ~{monthlyExtraVisits} extra return visits/mo
                </p>
                <div className="mt-6 border-t border-white/15 pt-4 text-xs text-white/75">
                  StickTheBizz costs just <strong>₹199/month</strong>. That is a{" "}
                  <span className="font-bold text-success">
                    {Math.round(monthlyExtraRevenue / 199)}x ROI
                  </span>{" "}
                  on your investment!
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <h2 className="font-display text-3xl font-extrabold text-secondary sm:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-2 text-sm text-ink/70">
                Everything you need to know about setting up digital punch cards at your counter.
              </p>
            </div>

            <div className="mt-10 space-y-4">
              <details className="group rounded-2xl border border-border bg-white p-5 open:bg-sand/40 transition">
                <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between font-display text-base font-bold text-secondary">
                  Do customers need to download an app from Google Play Store?
                  <ChevronDown className="h-5 w-5 text-primary transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-ink/75">
                  Zero app downloads! That is why StickTheBizz converts walk-ins into regulars. Customers simply open their native camera app, scan your tabletop QR code, and their punch card opens instantly in Chrome or Safari.
                </p>
              </details>

              <details className="group rounded-2xl border border-border bg-white p-5 open:bg-sand/40 transition">
                <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between font-display text-base font-bold text-secondary">
                  How does the 12-hour anti-fraud lock work?
                  <ChevronDown className="h-5 w-5 text-primary transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-ink/75">
                  Once a customer&apos;s visit is verified, their card is automatically locked until midnight (or 12 hours). This completely prevents repeat fraudulent scans while keeping checkout lines fast.
                </p>
              </details>

              <details className="group rounded-2xl border border-border bg-white p-5 open:bg-sand/40 transition">
                <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between font-display text-base font-bold text-secondary">
                  Can I change the reward or minimum bill threshold?
                  <ChevronDown className="h-5 w-5 text-primary transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-ink/75">
                  Yes, at any time from your Shop Owner Terminal! The printed tabletop QR code remains exactly the same; your customer cards update dynamically in real time.
                </p>
              </details>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

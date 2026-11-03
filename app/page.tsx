"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StampGrid from "@/components/StampGrid";
import ConfettiEffect from "@/components/ConfettiEffect";
import PhoneFrame from "@/components/PhoneFrame";
import LiveActivityToast from "@/components/LiveActivityToast";
import { useStore, CategoryPreset } from "@/context/StoreContext";
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
  Star,
  Users,
  QrCode,
  Gift,
  HelpCircle,
  Quote,
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
      <LiveActivityToast />
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="grain relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:px-8 lg:pb-24">
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
              {/* LEFT: Customer Phone Card (Rendered in Realistic Phone Bezel) */}
              <div className="flex flex-col items-center">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-primary" />
                  Customer Smartphone View (Scan In Seconds)
                </p>

                <PhoneFrame>
                  <div className="p-1">
                    <div className="flex items-center justify-between border-b border-border/70 pb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
                          Store Loyalty Pass
                        </span>
                        <h2 className="font-display text-base font-extrabold text-secondary">
                          {rule.name}
                        </h2>
                      </div>
                      <span className="font-mono text-xs font-bold text-primary">
                        Min ₹{rule.minSpend}
                      </span>
                    </div>

                    <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-display text-base font-extrabold text-secondary">
                            {customer.visits} of {rule.visitsRequired} visits
                          </p>
                          <p className="text-[11px] text-ink/65">
                            Reward: <strong className="text-primary">{rule.rewardName}</strong>
                          </p>
                        </div>
                        <span className="rounded-full bg-coral/15 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                          {customer.visits >= rule.visitsRequired ? "REWARD READY" : "ACTIVE"}
                        </span>
                      </div>

                      <div className="mt-3">
                        <StampGrid
                          totalVisits={rule.visitsRequired}
                          completedVisits={customer.visits}
                          rewardName={rule.rewardName}
                        />
                      </div>

                      {/* Customer Scan Action */}
                      <div className="mt-4">
                        {customer.lockedUntilMidnight ? (
                          <div className="rounded-xl border border-warning/30 bg-warning/10 p-2.5 text-center text-xs font-semibold text-ink">
                            <Lock className="inline h-3.5 w-3.5 text-warning mr-1" />
                            Today&apos;s visit verified! Next stamp unlocks at 12:00 AM IST.
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSimulateScan}
                            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-white shadow-sm transition hover:bg-secondary focus-visible:outline focus-visible:outline-2"
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
                  </div>
                </PhoneFrame>
              </div>

              {/* RIGHT: Shopkeeper Counter Terminal */}
              <div className="flex flex-col items-center">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                  <Store className="h-4 w-4 text-primary" />
                  Shop Owner Cashier Terminal (1-Tap Approve)
                </p>

                <div className="w-full rounded-[2.5rem] border-2 border-secondary/20 bg-secondary p-6 sm:p-8 text-white shadow-card min-h-[580px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-white/15 pb-4">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-primary">
                          <Store className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                            Cashier Desk Terminal
                          </p>
                          <h2 className="font-display text-lg font-extrabold text-white">
                            Live Incoming Queue
                          </h2>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 font-mono text-xs font-bold text-primary">
                        <BellRing className="h-3.5 w-3.5 animate-bell-ring" />
                        {pendingQueue.filter((q) => q.status === "pending").length} Waiting
                      </span>
                    </div>

                    {/* Queue items */}
                    <div className="mt-6 space-y-3">
                      {pendingQueue.filter((q) => q.status === "pending").length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center">
                          <p className="text-sm font-semibold text-white/80">
                            No pending scans right now. Waiting for customers...
                          </p>
                          <p className="mt-1.5 text-xs text-white/60">
                            Tap &ldquo;Simulate Customer Camera Scan&rdquo; on the left phone to send a live check-in.
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
                                  className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl bg-success px-5 text-xs font-bold text-white transition hover:opacity-90 shadow-sm"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  1-Tap Approve
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  {/* Counter Terminal Info */}
                  <div className="mt-6 rounded-2xl bg-white/10 p-4 text-xs text-white/80 flex items-center justify-between">
                    <span>Audio bell confirmation enabled</span>
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
          </div>
        </section>

        {/* TRUSTED BY BANNER (TICKER BELOW HERO) */}
        <section aria-label="Trusted Stores Across Bharat" className="border-y border-border bg-white py-6">
          <div className="mx-auto max-w-7xl px-4">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-secondary/70">
              Trusted by 500+ daily retail counters across Bharat
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-bold text-ink/70">
              <span className="flex items-center gap-1.5">
                <Coffee className="h-4 w-4 text-primary" />
                Sharma Sweets &amp; Dairy (Jaipur)
              </span>
              <span className="hidden sm:inline text-border">•</span>
              <span className="flex items-center gap-1.5">
                <Store className="h-4 w-4 text-secondary" />
                The Daily Grind Cafe (Bengaluru)
              </span>
              <span className="hidden sm:inline text-border">•</span>
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4 text-primary" />
                Patel Kirana Superstore (Ahmedabad)
              </span>
              <span className="hidden sm:inline text-border">•</span>
              <span className="flex items-center gap-1.5">
                <Coffee className="h-4 w-4 text-secondary" />
                Chai Shai Express (Mumbai)
              </span>
              <span className="hidden sm:inline text-border">•</span>
              <span className="flex items-center gap-1.5">
                <Utensils className="h-4 w-4 text-primary" />
                The Bun Co. (Pune)
              </span>
            </div>
          </div>
        </section>

        {/* THREE-PILLAR VALUE PROPOSITION */}
        <section id="for-shops" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Built for busy counters
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-secondary sm:text-4xl">
                Loyalty that works as hard as your cash desk.
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <article className="rounded-3xl border border-border bg-white p-8 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-coral/15 text-primary">
                    <TrendingUp className="h-6 w-6" />
                  </span>
                  <span className="font-mono text-sm font-bold text-success">+42% Retention</span>
                </div>
                <h3 className="mt-6 font-display text-xl font-extrabold text-secondary">
                  Bring Customers Back
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">
                  Visual punch progress bars tap into human habit psychology. Diners and shoppers return to complete their streak instead of going to competitors.
                </p>
              </article>

              <article className="rounded-3xl border border-border bg-white p-8 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/10 text-secondary">
                    <Users className="h-6 w-6" />
                  </span>
                  <span className="font-mono text-xs font-bold text-ink/50">DPDP SAFE</span>
                </div>
                <h3 className="mt-6 font-display text-xl font-extrabold text-secondary">
                  Know Your Regulars
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">
                  Masked customer directory (<span className="font-mono font-bold">98***12</span>) protects customer phone privacy while letting you know who your top 20% high-value regulars are.
                </p>
              </article>

              <article className="rounded-3xl border border-border bg-white p-8 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-warning/15 text-warning">
                    <Lock className="h-6 w-6" />
                  </span>
                  <span className="font-mono text-xs font-bold text-secondary">12H LOCK</span>
                </div>
                <h3 className="mt-6 font-display text-xl font-extrabold text-secondary">
                  Zero-Fraud Verification
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">
                  100% hardware-free. Counter QR stand + 12-hour midnight lock prevents multiple scans in the same visit without holding up checkout queues.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS (3 STEPS) */}
        <section id="how-it-works" className="bg-secondary px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                3 Tiny Steps
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                How StickTheBizz Works at Your Counter
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <div className="rounded-3xl bg-white p-8 text-ink shadow-float">
                <span className="font-display text-4xl font-extrabold text-primary">01</span>
                <h3 className="mt-4 font-display text-xl font-extrabold text-secondary">
                  Set Your Spend Rule
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/75">
                  Choose your minimum bill amount (e.g., Spend ₹100+, 10 visits in 40 days) and your reward (e.g., Free Masala Chai).
                </p>
              </div>

              <div className="rounded-3xl bg-white p-8 text-ink shadow-float">
                <span className="font-display text-4xl font-extrabold text-primary">02</span>
                <h3 className="mt-4 font-display text-xl font-extrabold text-secondary">
                  Display Counter QR
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/75">
                  Print your acrylic QR stand once and place it on your cash billing counter. Customers scan using their normal phone camera.
                </p>
              </div>

              <div className="rounded-3xl bg-white p-8 text-ink shadow-float">
                <span className="font-display text-4xl font-extrabold text-primary">03</span>
                <h3 className="mt-4 font-display text-xl font-extrabold text-secondary">
                  1-Tap Approve &amp; Build Regulars
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/75">
                  Your terminal rings with audio confirmation. Tap approve. Customers unlock rewards and return daily.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* REAL-WORLD TESTIMONIALS SECTION */}
        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-coral/15 px-3 py-1 font-mono text-xs font-bold text-primary">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                VERIFIED SHOP OWNER STORIES
              </span>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-secondary sm:text-4xl">
                Real Shopkeepers. Real Daily Repeat Revenue.
              </h2>
              <p className="mt-3 text-sm text-ink/70">
                Hear how Indian counters replaced discarded paper cards with digital streaks.
              </p>
            </div>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {/* Testimonial 1 */}
              <div className="flex flex-col justify-between rounded-3xl border border-border bg-sand/30 p-8 shadow-card">
                <div>
                  <div className="flex items-center gap-1 text-warning">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-ink/80 italic">
                    &ldquo;We stopped printing paper punch cards that customers lost in their pockets. StickTheBizz increased our evening chai sales by 30% because customers want to finish their streaks.&rdquo;
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-3 border-t border-border/80 pt-4">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary font-bold text-white text-sm">
                    RS
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-extrabold text-secondary">
                      Rahul Sharma
                    </h4>
                    <p className="text-xs text-ink/60">The Daily Grind Cafe, Bengaluru</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="flex flex-col justify-between rounded-3xl border border-border bg-sand/30 p-8 shadow-card">
                <div>
                  <div className="flex items-center gap-1 text-warning">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-ink/80 italic">
                    &ldquo;Our regulars at the kirana store now add an extra biscuit packet or oil pouch just to cross the ₹150 minimum bill. It paid for itself on day 3.&rdquo;
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-3 border-t border-border/80 pt-4">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary font-bold text-white text-sm">
                    DP
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-extrabold text-secondary">
                      Dinesh Patel
                    </h4>
                    <p className="text-xs text-ink/60">Patel Kirana Superstore, Ahmedabad</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="flex flex-col justify-between rounded-3xl border border-border bg-sand/30 p-8 shadow-card">
                <div>
                  <div className="flex items-center gap-1 text-warning">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-ink/80 italic">
                    &ldquo;College kids in our area love competing for the Free Burger reward. Our Monday-Wednesday slow afternoons are now packed with return customers.&rdquo;
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-3 border-t border-border/80 pt-4">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary font-bold text-white text-sm">
                    AR
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-extrabold text-secondary">
                      Ananya Roy
                    </h4>
                    <p className="text-xs text-ink/60">The Bun Co., Pune</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRANSPARENT PRICING PREVIEW */}
        <section id="pricing" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Honest Pricing
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-secondary sm:text-4xl">
                Start Free. Upgrade to ₹199/Month.
              </h2>
            </div>

            <div className="mt-10 overflow-hidden rounded-[2.5rem] border border-border bg-white shadow-float md:grid md:grid-cols-2">
              <div className="p-8 sm:p-12">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-coral/15 px-3 py-1 font-mono text-xs font-bold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  FIRST 50 SCANS FREE
                </span>
                <h3 className="mt-4 font-display text-3xl font-extrabold text-secondary">
                  Zero Risk Trial
                </h3>
                <p className="mt-2 text-sm text-ink/70">
                  Test customer engagement directly at your cashier counter without committing upfront.
                </p>

                <ul className="mt-6 space-y-3 text-sm font-semibold text-ink/80">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span>Printable Acrylic QR Table Standee</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span>12-Hour Midnight Anti-Fraud Protection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span>Verified Customer Ratings &amp; Feedback</span>
                  </li>
                </ul>

                <div className="mt-8">
                  <Link
                    href="/pricing"
                    className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-secondary px-7 text-sm font-bold text-white shadow-sm transition hover:bg-primary"
                  >
                    <span>View Full Pricing &amp; Plans</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="flex flex-col justify-between bg-secondary p-8 text-white sm:p-12">
                <div>
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-white/70">
                    Pro Unlimited Plan
                  </p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display text-5xl font-extrabold text-primary">₹199</span>
                    <span className="text-sm font-semibold text-white/75">/ month</span>
                  </div>
                  <p className="mt-3 text-sm text-white/80">
                    Unlimited scans, unlimited customer regulars, zero SMS fees, and zero commissions on sales.
                  </p>
                </div>

                <div className="mt-8 rounded-2xl bg-white/10 p-4 text-xs text-white/85">
                  💡 Generates an estimated <strong>₹15,000+</strong> in repeat sales for the cost of two special chais.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMPREHENSIVE FAQ SECTION (TASK 4 SPECIFICATIONS) */}
        <section id="faq" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 font-mono text-xs font-bold text-secondary">
                <HelpCircle className="h-3.5 w-3.5 text-primary" />
                FREQUENTLY ASKED QUESTIONS
              </span>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-secondary sm:text-4xl">
                Clear Answers for Busy Indian Shop Owners
              </h2>
              <p className="mt-2 text-sm text-ink/70">
                Everything you need to know about setting up digital punch cards at your cash desk.
              </p>
            </div>

            <div className="mt-12 space-y-4">
              {/* FAQ 1 */}
              <details className="group rounded-2xl border border-border bg-sand/30 p-5 open:bg-sand/60 transition">
                <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between font-display text-base font-bold text-secondary">
                  Do customers need to download an app from Google Play Store?
                  <ChevronDown className="h-5 w-5 text-primary transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-ink/80">
                  <strong>No app download is needed.</strong> Customers simply open their regular phone camera (iPhone or budget Android) and point it at your acrylic QR stand. Their digital stamp card opens instantly in Chrome or Safari.
                </p>
              </details>

              {/* FAQ 2 */}
              <details className="group rounded-2xl border border-border bg-sand/30 p-5 open:bg-sand/60 transition">
                <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between font-display text-base font-bold text-secondary">
                  How do you prevent fake or duplicate scans in one day?
                  <ChevronDown className="h-5 w-5 text-primary transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-ink/80">
                  StickTheBizz uses an automated <strong>12-hour midnight anti-fraud guard</strong>. Once a customer collects their verified stamp today, their card is locked until 12:00 AM IST. Furthermore, each stamp requires 1-tap confirmation on the shop owner&apos;s counter terminal, so dishonest scans are impossible.
                </p>
              </details>

              {/* FAQ 3 */}
              <details className="group rounded-2xl border border-border bg-sand/30 p-5 open:bg-sand/60 transition">
                <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between font-display text-base font-bold text-secondary">
                  Who pays for the customer&apos;s free treat or reward?
                  <ChevronDown className="h-5 w-5 text-primary transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-ink/80">
                  The shop owner provides the reward. Since you decide your own rules (e.g., Spend ₹100+, 10 times to get a ₹15 chai or ₹40 snack), the customer spends over <strong>₹1,000+</strong> at your counter before earning a reward that costs you just ₹10–₹20. The return on investment is massive.
                </p>
              </details>

              {/* FAQ 4 */}
              <details className="group rounded-2xl border border-border bg-sand/30 p-5 open:bg-sand/60 transition">
                <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between font-display text-base font-bold text-secondary">
                  Do I need an expensive POS billing computer or thermal printer?
                  <ChevronDown className="h-5 w-5 text-primary transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-ink/80">
                  <strong>Zero hardware required.</strong> You only need a printed acrylic tabletop standee placed at your cash desk and any smartphone or tablet to open your Shop Owner Terminal.
                </p>
              </details>

              {/* FAQ 5 */}
              <details className="group rounded-2xl border border-border bg-sand/30 p-5 open:bg-sand/60 transition">
                <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between font-display text-base font-bold text-secondary">
                  What happens to customer phone numbers and data?
                  <ChevronDown className="h-5 w-5 text-primary transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-ink/80">
                  StickTheBizz strictly complies with India&apos;s <strong>Digital Personal Data Protection (DPDP) Act 2023</strong>. Customer phone numbers are masked in your terminal (<span className="font-mono">98***12</span>), never sold to third parties, and never spammed with marketing messages. Customers can also request immediate data erasure at any time.
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

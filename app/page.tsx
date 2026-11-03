"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StampGrid from "@/components/StampGrid";
import ConfettiEffect from "@/components/ConfettiEffect";
import PhoneFrame from "@/components/PhoneFrame";
import LiveActivityToast from "@/components/LiveActivityToast";
import AnimatedHero from "@/components/AnimatedHero";
import { CategoryPreset } from "@/context/StoreContext";
import {
  ChaiCupIcon,
  BasketIcon,
  StarStampIcon,
  QrCodeIcon,
  MobilePhoneIcon,
  GiftBoxIcon,
  StreakIcon,
  AnalyticsIcon,
  LocationIcon,
  AntiFraudIcon,
  CustomersIcon,
  SupportIcon,
} from "@/components/BrandIcons";
import {
  Sparkles,
  ArrowRight,
  Store,
  Smartphone,
  CheckCircle2,
  Lock,
  ChevronDown,
  Calculator,
  Star,
  HelpCircle,
  RotateCcw,
} from "lucide-react";

interface CategoryData {
  slug: string;
  name: string;
  minSpend: number;
  visitsRequired: number;
  rewardName: string;
  location: string;
  tagline: string;
}

const CATEGORY_MAP: Record<CategoryPreset, CategoryData> = {
  chai: {
    slug: "kesar-chai",
    name: "Kesar Chai Corner",
    minSpend: 100,
    visitsRequired: 10,
    rewardName: "Free Masala Chai",
    location: "Sector 14 Counter",
    tagline: "Buy 10, Get 1 Special Chai Free",
  },
  kirana: {
    slug: "patel-kirana",
    name: "Patel Kirana Superstore",
    minSpend: 250,
    visitsRequired: 10,
    rewardName: "1L Cooking Oil Pouch",
    location: "Main Market Stall",
    tagline: "Spend ₹250+ 10 Times → Free 1L Oil",
  },
  burger: {
    slug: "the-bun-co",
    name: "The Bun Co. Burgers",
    minSpend: 150,
    visitsRequired: 7,
    rewardName: "Free Crispy Burger",
    location: "College Road Branch",
    tagline: "7 Visits in 30 Days → Free Burger",
  },
};

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<CategoryPreset>("chai");
  const [visits, setVisits] = useState<number>(7);
  const [isScanning, setIsScanning] = useState(false);
  const [recentlyStamped, setRecentlyStamped] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // ROI Calculator states
  const [dailyFootfall, setDailyFootfall] = useState<number>(180);
  const [averageBill, setAverageBill] = useState<number>(120);

  // Extra return visits from loyalty streak (estimated 18% lift)
  const monthlyExtraVisits = Math.round(dailyFootfall * 0.18 * 30);
  const monthlyExtraRevenue = Math.round(monthlyExtraVisits * averageBill);

  const currentRule = CATEGORY_MAP[activeCategory];

  const handleCategoryChange = (cat: CategoryPreset) => {
    setActiveCategory(cat);
    // adjust initial visits when switching category
    const maxVisits = CATEGORY_MAP[cat].visitsRequired;
    setVisits((prev) => Math.min(prev, maxVisits - 2));
    setRecentlyStamped(null);
  };

  // Crystal clear Web Audio API chime
  const playChime = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Primary chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.12); // C6
      gain1.gain.setValueAtTime(0.28, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Harmonious overtone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      gain2.gain.setValueAtTime(0.12, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.4);
    } catch {
      // Audio playback graceful fallback
    }
  };

  const handleSimulateScan = () => {
    if (isScanning) return;
    if (visits >= currentRule.visitsRequired) return;

    setIsScanning(true);
    setFeedbackToast("Scanning counter QR stand...");

    setTimeout(() => {
      setIsScanning(false);
      playChime();
      const nextVisits = visits + 1;
      setVisits(nextVisits);
      setRecentlyStamped(nextVisits);

      if (nextVisits >= currentRule.visitsRequired) {
        setShowConfetti(true);
        setFeedbackToast("🎉 Stamp 10 claimed! Free reward unlocked!");
      } else {
        setFeedbackToast(
          `✨ Verified ₹${currentRule.minSpend}+ spend! Stamp #${nextVisits} added.`
        );
      }

      setTimeout(() => setFeedbackToast(null), 3500);
    }, 1000);
  };

  const handleResetDemo = () => {
    setVisits(1);
    setRecentlyStamped(null);
    setShowConfetti(false);
    setFeedbackToast("Demo card reset to 1 visit.");
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  const progressPercent = Math.min(
    100,
    Math.round((visits / currentRule.visitsRequired) * 100)
  );

  return (
    <div className="flex min-h-screen flex-col bg-sand overflow-x-hidden">
      <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <LiveActivityToast />
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION - INTERACTIVE ANIMATED MESH GRADIENT & SPOTLIGHT */}
        <AnimatedHero className="px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:px-8 lg:pb-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
              {/* Left Column: Value Proposition & Category Selector */}
              <div className="lg:col-span-7 flex flex-col items-start text-left">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/40 backdrop-blur-md px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-secondary shadow-sm">
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
                  Zero app downloads. One counter QR standee. Watch how an interactive punch card on a customer&apos;s phone rewards repeat visits with zero cashier friction.
                </p>

                {/* Category Preset Selector */}
                <div className="mt-7 w-full">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink/60 mb-2.5">
                    Select a retail preset to preview live:
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleCategoryChange("chai")}
                      className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition shadow-sm ${
                        activeCategory === "chai"
                          ? "bg-secondary text-white shadow-md"
                          : "bg-white/40 backdrop-blur-md text-ink/75 hover:bg-white/70 border border-white/30"
                      }`}
                    >
                      <ChaiCupIcon size={20} />
                      Chai Stall (10 Visits → Free Chai)
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCategoryChange("kirana")}
                      className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition shadow-sm ${
                        activeCategory === "kirana"
                          ? "bg-secondary text-white shadow-md"
                          : "bg-white/40 backdrop-blur-md text-ink/75 hover:bg-white/70 border border-white/30"
                      }`}
                    >
                      <BasketIcon size={20} />
                      Patel Kirana (10 Visits → 1L Oil)
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCategoryChange("burger")}
                      className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition shadow-sm ${
                        activeCategory === "burger"
                          ? "bg-secondary text-white shadow-md"
                          : "bg-white/40 backdrop-blur-md text-ink/75 hover:bg-white/70 border border-white/30"
                      }`}
                    >
                      <StreakIcon size={20} />
                      Burger Joint (7 Visits → Free Burger)
                    </button>
                  </div>
                </div>

                {/* Key Bullet Highlights with Glassmorphism */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-ink/80 w-full">
                  <div className="flex items-center gap-2 rounded-xl bg-white/40 backdrop-blur-md p-3 border border-white/30 shadow-sm">
                    <AntiFraudIcon size={20} />
                    <span>12-Hour Midnight Anti-Fraud Guard</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/40 backdrop-blur-md p-3 border border-white/30 shadow-sm">
                    <CustomersIcon size={20} />
                    <span>DPDP Safe Customer Privacy</span>
                  </div>
                </div>

                {/* Primary CTAs */}
                <div className="mt-8 flex flex-wrap items-center gap-3.5">
                  <Link
                    href="/auth/owner/register"
                    target="_self"
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-bold text-white shadow-card transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span>Register My Shop Counter</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/owner"
                    target="_self"
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-white/40 bg-white/40 backdrop-blur-md px-6 text-sm font-bold text-secondary shadow-sm transition hover:bg-white/70"
                  >
                    <Store className="h-4 w-4 text-primary" />
                    <span>Open Merchant Desk</span>
                  </Link>
                </div>

                {/* Glassmorphic ROI Lift Card inside Hero */}
                <div className="mt-8 flex items-center justify-between gap-4 rounded-2xl bg-white/40 backdrop-blur-md border border-white/30 p-3.5 shadow-sm max-w-md w-full">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
                      <AnalyticsIcon size={18} />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/60">
                        Live ROI Calculator Lift
                      </p>
                      <p className="font-display text-base font-extrabold text-secondary">
                        +₹{monthlyExtraRevenue.toLocaleString("en-IN")} / mo
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 text-emerald-800 border border-emerald-500/20 px-2.5 py-1 font-mono text-xs font-bold">
                    +{monthlyExtraVisits} visits
                  </span>
                </div>
              </div>

              {/* Right Column: Ultra-Realistic Apple Wallet Style Smartphone Pass with Glassmorphic Pedestal */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <div className="relative w-full flex flex-col items-center rounded-[3.2rem] p-4 backdrop-blur-md bg-white/40 border border-white/20 shadow-xl">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4 text-primary" />
                    Interactive Customer Pass (Tap Below To Test)
                  </p>

                  <PhoneFrame className="max-w-[340px]">
                    {/* Apple Wallet Style Digital Pass Card */}
                    <div className="relative flex flex-col">
                      {/* Laser sweep animation bar */}
                      {isScanning && (
                        <div className="absolute inset-x-0 z-30 pointer-events-none animate-laser-sweep">
                          <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#F2765E] to-transparent shadow-[0_0_12px_#F2765E]" />
                        </div>
                      )}

                      {/* Apple Wallet Header with Navy Surface */}
                      <div className="rounded-t-3xl bg-secondary p-4 text-white shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-white">
                              {activeCategory === "chai" && <ChaiCupIcon size={20} />}
                              {activeCategory === "kirana" && <BasketIcon size={20} />}
                              {activeCategory === "burger" && <StreakIcon size={20} />}
                            </span>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                                Digital Loyalty Pass
                              </p>
                              <h3 className="font-display text-sm font-extrabold text-white">
                                {currentRule.name}
                              </h3>
                            </div>
                          </div>
                          <span className="rounded-full bg-primary/20 border border-primary/30 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                            Min ₹{currentRule.minSpend}
                          </span>
                        </div>

                        <p className="mt-2.5 text-[11px] font-medium text-white/80">
                          {currentRule.tagline}
                        </p>
                      </div>

                      {/* Notched White Ticket Body with Glassmorphism */}
                      <div className="relative rounded-b-3xl bg-white/85 backdrop-blur-md p-4 shadow-card border border-t-0 border-white/40">
                        {/* Perforated ticket circles */}
                        <div className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-sand" />
                        <div className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-sand" />

                        {/* Visit Status Bar */}
                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                          <div>
                            <span className="font-display text-base font-extrabold text-secondary">
                              {visits} of {currentRule.visitsRequired} visits
                            </span>
                            <p className="text-[10px] text-ink/65">
                              Reward: <strong className="text-primary">{currentRule.rewardName}</strong>
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                              visits >= currentRule.visitsRequired
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-coral/15 text-primary"
                            }`}
                          >
                            {visits >= currentRule.visitsRequired ? "REWARD READY" : `${progressPercent}% DONE`}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-sand">
                          <div
                            className="h-full bg-primary transition-all duration-500 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>

                        {/* Stamp Grid with StarStampIcon & GiftBoxIcon */}
                        <div className="mt-4">
                          <StampGrid
                            totalVisits={currentRule.visitsRequired}
                            completedVisits={visits}
                            rewardName={currentRule.rewardName}
                            recentlyStampedIndex={recentlyStamped}
                          />
                        </div>

                        {/* Action Area */}
                        <div className="mt-5">
                          {visits >= currentRule.visitsRequired ? (
                            <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/70 p-3 text-center shadow-inner">
                              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800">
                                <GiftBoxIcon size={18} />
                                <span>REWARD UNLOCKED!</span>
                              </div>
                              <p className="mt-1 font-mono text-sm font-extrabold text-secondary tracking-widest">
                                STB-7Q4K-29
                              </p>
                              <p className="text-[10px] text-ink/70">
                                Show this voucher code to the cashier to claim your {currentRule.rewardName}.
                              </p>
                              <button
                                type="button"
                                onClick={handleResetDemo}
                                className="mt-2.5 inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-xl border border-secondary/30 bg-white px-3 text-xs font-bold text-secondary shadow-sm transition hover:bg-sand"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Reset Demo &amp; Scan Again
                              </button>
                            </div>
                          ) : (
                            <div>
                              <button
                                type="button"
                                disabled={isScanning}
                                onClick={handleSimulateScan}
                                className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-secondary active:scale-95 ${
                                  isScanning ? "opacity-75 cursor-wait" : "hover:shadow-md"
                                }`}
                              >
                                <Sparkles className="h-4 w-4 animate-spin" />
                                <span>{isScanning ? "Scanning Standee..." : "✨ Scan Counter QR"}</span>
                              </button>
                              <p className="mt-1.5 text-center text-[10px] text-ink/50">
                                Tap to test laser sweep scan &amp; sound chime
                              </p>
                            </div>
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
              </div>
            </div>
          </div>
        </AnimatedHero>

        {/* TRUSTED BY BANNER (TICKER BELOW HERO WITH LOCATION ICON) */}
        <section aria-label="Trusted Stores Across Bharat" className="border-y border-border bg-white py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary/75">
              <LocationIcon size={18} />
              <span>Trusted by 500+ daily retail counters across Bharat</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-bold text-ink/70">
              <span className="flex items-center gap-1.5">
                <ChaiCupIcon size={18} />
                Sharma Sweets &amp; Dairy (Jaipur)
              </span>
              <span className="hidden sm:inline text-border">•</span>
              <span className="flex items-center gap-1.5">
                <Store className="h-4 w-4 text-secondary" />
                The Daily Grind Cafe (Bengaluru)
              </span>
              <span className="hidden sm:inline text-border">•</span>
              <span className="flex items-center gap-1.5">
                <BasketIcon size={18} />
                Patel Kirana Superstore (Ahmedabad)
              </span>
              <span className="hidden sm:inline text-border">•</span>
              <span className="flex items-center gap-1.5">
                <ChaiCupIcon size={18} />
                Chai Shai Express (Mumbai)
              </span>
              <span className="hidden sm:inline text-border">•</span>
              <span className="flex items-center gap-1.5">
                <StreakIcon size={18} />
                The Bun Co. (Pune)
              </span>
            </div>
          </div>
        </section>

        {/* THREE-PILLAR VALUE PROPOSITION WITH 12 BRAND ICONS */}
        <section id="for-shops" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                <StreakIcon size={16} />
                Built for busy counters
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-secondary sm:text-4xl">
                Loyalty that works as hard as your cash desk.
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {/* Card 1: Bring Customers Back */}
              <article className="rounded-3xl border border-border bg-white p-8 shadow-card transition hover:shadow-float">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-coral/15 text-primary">
                    <StreakIcon size={28} />
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

              {/* Card 2: Know Your Regulars */}
              <article className="rounded-3xl border border-border bg-white p-8 shadow-card transition hover:shadow-float">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/10 text-secondary">
                    <CustomersIcon size={28} />
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

              {/* Card 3: Zero-Fraud Verification */}
              <article className="rounded-3xl border border-border bg-white p-8 shadow-card transition hover:shadow-float">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-warning/15 text-warning">
                    <AntiFraudIcon size={28} />
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

        {/* HOW IT WORKS (3 STEPS WITH BRAND ICONS) */}
        <section id="how-it-works" className="bg-secondary px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                <StarStampIcon size={16} />
                3 Tiny Steps
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                How StickTheBizz Works at Your Counter
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <div className="rounded-3xl bg-white p-8 text-ink shadow-float">
                <div className="flex items-center justify-between">
                  <span className="font-display text-4xl font-extrabold text-primary">01</span>
                  <MobilePhoneIcon size={32} />
                </div>
                <h3 className="mt-4 font-display text-xl font-extrabold text-secondary">
                  Set Your Spend Rule
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/75">
                  Choose your minimum bill amount (e.g., Spend ₹100+, 10 visits in 40 days) and your reward (e.g., Free Masala Chai).
                </p>
              </div>

              <div className="rounded-3xl bg-white p-8 text-ink shadow-float">
                <div className="flex items-center justify-between">
                  <span className="font-display text-4xl font-extrabold text-primary">02</span>
                  <QrCodeIcon size={32} />
                </div>
                <h3 className="mt-4 font-display text-xl font-extrabold text-secondary">
                  Display Counter QR
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/75">
                  Print your acrylic QR stand once and place it on your cash billing counter. Customers scan using their normal phone camera.
                </p>
              </div>

              <div className="rounded-3xl bg-white p-8 text-ink shadow-float">
                <div className="flex items-center justify-between">
                  <span className="font-display text-4xl font-extrabold text-primary">03</span>
                  <GiftBoxIcon size={32} />
                </div>
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-warning">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                      ))}
                    </div>
                    <ChaiCupIcon size={24} />
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-warning">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                      ))}
                    </div>
                    <BasketIcon size={24} />
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-warning">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                      ))}
                    </div>
                    <StreakIcon size={24} />
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

        {/* INTERACTIVE ROI CALCULATOR WITH ANALYTICS ICON */}
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl rounded-[2.5rem] border border-white/40 bg-white/60 backdrop-blur-md p-8 shadow-card sm:p-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/60 pb-8">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-coral/15 px-3 py-1 font-mono text-xs font-bold text-primary">
                  <AnalyticsIcon size={18} />
                  RETAIL ROI CALCULATOR
                </div>
                <h2 className="mt-3 font-display text-2xl font-extrabold text-secondary sm:text-3xl">
                  Calculate Your Monthly Revenue Lift
                </h2>
                <p className="mt-1 text-sm text-ink/70">
                  Estimate the additional revenue generated by converting 18% of walk-ins into repeat streak customers.
                </p>
              </div>

              <div className="rounded-2xl bg-white/40 backdrop-blur-md p-4 border border-white/30 text-right">
                <span className="text-xs font-bold text-ink/60 uppercase">Estimated Monthly Lift</span>
                <p className="font-display text-3xl font-extrabold text-success">
                  +₹{monthlyExtraRevenue.toLocaleString("en-IN")}
                </p>
                <span className="font-mono text-xs font-semibold text-ink/70">
                  +{monthlyExtraVisits} extra customer visits
                </span>
              </div>
            </div>

            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="footfall" className="text-sm font-bold text-secondary">
                    Average Daily Footfall (Customers)
                  </label>
                  <span className="font-mono text-base font-extrabold text-primary">
                    {dailyFootfall} / day
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
                  <label htmlFor="averageBill" className="text-sm font-bold text-secondary">
                    Average Order Value (₹ Bill)
                  </label>
                  <span className="font-mono text-base font-extrabold text-primary">
                    ₹{averageBill}
                  </span>
                </div>
                <input
                  id="averageBill"
                  type="range"
                  min="40"
                  max="800"
                  step="10"
                  value={averageBill}
                  onChange={(e) => setAverageBill(Number(e.target.value))}
                  className="mt-3 w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-ink/50 mt-1">
                  <span>₹40 (Chai)</span>
                  <span>₹250 (Cafe)</span>
                  <span>₹800 (Kirana)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRANSPARENT PRICING PREVIEW */}
        <section id="pricing" className="px-4 py-16 sm:px-6 lg:px-8">
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
                    target="_self"
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

        {/* COMPREHENSIVE FAQ SECTION */}
        <section id="faq" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 font-mono text-xs font-bold text-secondary">
                <SupportIcon size={18} />
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
              <details className="group rounded-2xl border border-border bg-sand/30 p-5 transition [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-base font-bold text-secondary">
                  <span>Do customers need to download an app from Play Store?</span>
                  <span className="transition duration-300 group-open:-rotate-180">
                    <ChevronDown className="h-5 w-5 text-primary" />
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">
                  No! That is the core advantage of StickTheBizz. Customers scan your counter QR using Google Lens, Paytm, WhatsApp, or their phone camera. The punch card opens immediately as a lightweight web app in their browser.
                </p>
              </details>

              <details className="group rounded-2xl border border-border bg-sand/30 p-5 transition [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-base font-bold text-secondary">
                  <span>How do I prevent customers from scanning the QR code multiple times a day?</span>
                  <span className="transition duration-300 group-open:-rotate-180">
                    <ChevronDown className="h-5 w-5 text-primary" />
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">
                  StickTheBizz enforces an automated 12-hour anti-fraud lock. Once a customer verifies a visit, their punch card locks until 12:00 AM IST midnight. Furthermore, each stamp requires 1-tap confirmation from your cashier terminal.
                </p>
              </details>

              <details className="group rounded-2xl border border-border bg-sand/30 p-5 transition [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-base font-bold text-secondary">
                  <span>What hardware or billing machines do I need?</span>
                  <span className="transition duration-300 group-open:-rotate-180">
                    <ChevronDown className="h-5 w-5 text-primary" />
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">
                  Zero hardware required! You only need any standard smartphone or tablet running Chrome or Safari at your billing counter, plus the printed acrylic QR standee we provide for your desk.
                </p>
              </details>

              <details className="group rounded-2xl border border-border bg-sand/30 p-5 transition [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-base font-bold text-secondary">
                  <span>Is customer phone number data secure under Indian DPDP law?</span>
                  <span className="transition duration-300 group-open:-rotate-180">
                    <ChevronDown className="h-5 w-5 text-primary" />
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">
                  Yes, 100%. StickTheBizz complies with India&apos;s Digital Personal Data Protection (DPDP) Act. Customer mobile numbers are masked (e.g. 98***12) on cashier displays and never shared or sold to third-party telemarketers.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION */}
        <section className="bg-gradient-to-b from-sand to-sand/40 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-display text-3xl font-extrabold text-secondary sm:text-4xl">
              Ready to turn occasional walk-ins into daily regulars?
            </h2>
            <p className="mt-3 text-base text-ink/80 max-w-xl mx-auto">
              Join 500+ Indian retail counters. Setup takes 2 minutes and your first 50 scans are 100% free.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/auth/owner/register"
                target="_self"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-bold text-white shadow-card transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5"
              >
                <span>Register Shop Counter (2 Mins)</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/customer"
                target="_self"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-secondary bg-white px-7 text-sm font-bold text-secondary shadow-sm transition hover:bg-sand"
              >
                <Smartphone className="h-4 w-4 text-primary" />
                <span>Open Customer Card</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

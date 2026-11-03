"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StampGrid from "@/components/StampGrid";
import {
  Sparkles,
  ArrowRight,
  Store,
  Smartphone,
  ShieldCheck,
  TrendingUp,
  Users,
  Lock,
  QrCode,
  Gift,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

export default function HomePage() {
  const [demoPunches, setDemoPunches] = useState(7);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);

  const handleDemoPunch = () => {
    if (demoPunches < 10) {
      const next = demoPunches + 1;
      setDemoPunches(next);
      if (next === 10) {
        setDemoMessage("🎉 10th visit unlocked! Free Masala Chai voucher ready!");
      } else {
        setDemoMessage(`Visit #${next} recorded! Only ${10 - next} visits left.`);
      }
    } else {
      setDemoPunches(1);
      setDemoMessage("Card reset for new cycle!");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-sand overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="grain relative overflow-hidden px-4 pb-20 pt-12 sm:px-6 sm:pt-20 lg:px-8 lg:pb-28">
          {/* Subtle Decorative Backdrop Elements */}
          <div className="pointer-events-none absolute -right-36 top-10 h-96 w-96 rounded-full border-[40px] border-primary/10" />
          <div className="pointer-events-none absolute -left-24 bottom-10 h-64 w-64 rounded-full bg-secondary/5" />

          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            {/* Left Content */}
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-wider text-secondary shadow-sm">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Made for Bharat&apos;s Local Legends
              </div>

              <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-secondary sm:text-5xl lg:text-6xl">
                Turn walk-in diners &amp; kirana shoppers into{" "}
                <span className="text-primary underline decoration-primary/30 decoration-wavy">
                  daily regulars.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/80 sm:text-xl">
                A simple digital punch card for the chai stalls, salons, bakeries, and neighbourhood stores you love.{" "}
                <strong className="text-secondary font-bold">Zero app downloads.</strong> No costly hardware.
              </p>

              {/* Badges */}
              <div className="mt-6 flex flex-wrap items-center gap-2.5 text-xs font-bold text-secondary">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/80 px-4 py-2 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  No App to Install
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/80 px-4 py-2 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Works at Any Counter
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/80 px-4 py-2 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Instant Camera QR Scan
                </span>
              </div>

              {/* Dual CTAs */}
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/customer"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-primary px-8 text-base font-bold text-white shadow-card transition hover:-translate-y-1 hover:bg-secondary focus-visible:outline focus-visible:outline-2"
                >
                  <Smartphone className="h-5 w-5" />
                  Try Customer Stamp Card
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/owner"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border-2 border-secondary bg-white px-8 text-base font-bold text-secondary transition hover:-translate-y-1 hover:bg-secondary hover:text-white"
                >
                  <Store className="h-5 w-5" />
                  Open Shop Terminal
                </Link>
              </div>

              {/* Trust Metric */}
              <div className="mt-8 flex items-center gap-3 text-sm font-semibold text-ink/70">
                <div className="flex -space-x-2" aria-hidden="true">
                  <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-sand bg-primary text-xs font-bold text-white">
                    K
                  </span>
                  <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-sand bg-secondary text-xs font-bold text-white">
                    C
                  </span>
                  <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-sand bg-ink text-xs font-bold text-white">
                    S
                  </span>
                </div>
                <span>Loved by 2,000+ local retail counters across India</span>
              </div>
            </div>

            {/* Right Interactive Mockup */}
            <div className="relative mx-auto w-full max-w-[420px]">
              {/* Floating Stat Pill 1 */}
              <div className="absolute -left-6 top-6 z-20 hidden rounded-2xl border border-border bg-white p-4 shadow-float sm:block animate-float">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
                  This Week
                </p>
                <p className="font-display text-2xl font-extrabold text-secondary">
                  +34 Regulars
                </p>
                <div className="mt-2 flex gap-1">
                  <span className="h-1.5 w-16 rounded-full bg-primary" />
                  <span className="h-1.5 w-6 rounded-full bg-primary/25" />
                </div>
              </div>

              {/* Floating Stat Pill 2 */}
              <div className="absolute -right-4 bottom-8 z-20 rounded-2xl border border-border bg-white p-4 shadow-float">
                <div className="flex items-center gap-2 text-xs font-bold text-secondary">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-white text-xs">
                    ✓
                  </span>
                  <span>Stamp approved!</span>
                </div>
                <p className="mt-1 pl-8 font-mono text-[11px] text-ink/60">
                  Just now • Kesar Chai
                </p>
              </div>

              {/* Phone Frame */}
              <div className="relative rounded-[2.5rem] border-[10px] border-secondary bg-secondary p-2 shadow-phone">
                <div className="overflow-hidden rounded-[2rem] bg-sand">
                  {/* Status Bar */}
                  <div className="flex items-center justify-between bg-secondary px-6 py-2.5 text-[11px] font-bold text-white">
                    <span>9:41 AM</span>
                    <span className="tracking-widest">● ● ▰</span>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-ink/50">
                          Live Interactive Demo
                        </span>
                        <h2 className="font-display text-lg font-extrabold text-secondary">
                          Kesar Chai Corner
                        </h2>
                      </div>
                      <span className="rounded-full bg-coral/15 px-2.5 py-1 text-[10px] font-extrabold text-primary">
                        ACTIVE CARD
                      </span>
                    </div>

                    <div className="mt-4 rounded-3xl border border-border bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono text-xs font-bold text-ink/50">
                            RULE: SPEND ₹100+
                          </p>
                          <p className="font-display text-lg font-extrabold text-secondary">
                            {demoPunches} of 10 visits
                          </p>
                        </div>
                        <span className="font-mono text-xs font-bold text-primary">
                          Cycle: Day 23/40
                        </span>
                      </div>

                      {/* Interactive Stamp Grid */}
                      <div className="mt-4">
                        <StampGrid
                          totalVisits={10}
                          completedVisits={demoPunches}
                          rewardName="Free Masala Chai"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleDemoPunch}
                        className="mt-5 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-secondary text-sm font-bold text-white transition hover:bg-primary shadow-sm"
                      >
                        {demoPunches >= 10
                          ? "Reset Demo Card"
                          : "Simulate Counter Tap (+1 Stamp)"}
                      </button>

                      {demoMessage && (
                        <p className="mt-2 text-center text-xs font-bold text-primary">
                          {demoMessage}
                        </p>
                      )}
                    </div>

                    {/* Streak Banner */}
                    <div className="mt-4 flex items-center gap-3 rounded-2xl bg-secondary p-3 text-white">
                      <span className="text-2xl">☕</span>
                      <div>
                        <p className="text-xs font-bold">Keep your streak going</p>
                        <p className="text-[11px] text-white/70">
                          {10 - demoPunches} more visits for Free Masala Chai
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-center text-xs font-bold uppercase tracking-widest text-secondary/60">
                A better habit, one scan at a time
              </p>
            </div>
          </div>
        </section>

        {/* INFINITE MARQUEE / CATEGORY TICKER */}
        <section
          aria-label="Supported Businesses"
          className="overflow-hidden border-y border-border bg-white py-4.5"
        >
          <div className="flex w-max animate-marquee gap-8 whitespace-nowrap text-sm font-bold text-secondary/75">
            <span>Tea Stalls</span>
            <span className="text-primary">✦</span>
            <span>Cafés</span>
            <span className="text-primary">✦</span>
            <span>Bakeries</span>
            <span className="text-primary">✦</span>
            <span>Kirana Stores</span>
            <span className="text-primary">✦</span>
            <span>Sweet Shops</span>
            <span className="text-primary">✦</span>
            <span>Salons</span>
            <span className="text-primary">✦</span>
            <span>Juice Bars</span>
            <span className="text-primary">✦</span>
            <span>Fast Food Stalls</span>
            <span className="text-primary">✦</span>
            {/* Duplicated for continuous loop */}
            <span>Tea Stalls</span>
            <span className="text-primary">✦</span>
            <span>Cafés</span>
            <span className="text-primary">✦</span>
            <span>Bakeries</span>
            <span className="text-primary">✦</span>
            <span>Kirana Stores</span>
            <span className="text-primary">✦</span>
            <span>Sweet Shops</span>
            <span className="text-primary">✦</span>
            <span>Salons</span>
            <span className="text-primary">✦</span>
            <span>Juice Bars</span>
            <span className="text-primary">✦</span>
            <span>Fast Food Stalls</span>
            <span className="text-primary">✦</span>
          </div>
        </section>

        {/* THREE-PILLAR VALUE PROPOSITION */}
        <section id="for-shops" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Built for busy counters
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-secondary sm:text-4xl lg:text-5xl">
                Loyalty that works as hard as your counter.
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {/* Pillar 1 */}
              <article className="rounded-3xl border border-border bg-white p-8 shadow-card transition hover:-translate-y-1 hover:shadow-float">
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
                  Visual stamp cards tap into the natural human instinct to complete a streak. Customers choose your counter over competitors to hit their goal.
                </p>
                <div className="mt-6 h-2.5 rounded-full bg-sand">
                  <div className="h-full w-4/5 rounded-full bg-primary" />
                </div>
              </article>

              {/* Pillar 2 */}
              <article className="rounded-3xl border border-border bg-white p-8 shadow-card transition hover:-translate-y-1 hover:shadow-float">
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
                  Identify top VIP spenders and loyal visitors without violating privacy laws. Masked directories safeguard customer numbers while giving you rich insights.
                </p>
                <div className="mt-5 space-y-2 font-mono text-xs text-ink/70">
                  <div className="flex justify-between rounded-xl bg-sand px-3 py-2">
                    <span>98***12</span>
                    <span className="font-bold text-success">VIP REGULAR</span>
                  </div>
                  <div className="flex justify-between rounded-xl bg-sand px-3 py-2">
                    <span>r***h@example.com</span>
                    <span className="text-primary font-bold">8/10 VISITS</span>
                  </div>
                </div>
              </article>

              {/* Pillar 3 */}
              <article className="rounded-3xl border border-border bg-white p-8 shadow-card transition hover:-translate-y-1 hover:shadow-float">
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
                  100% hardware-free. An automatic 12-hour midnight lock and single-scan security prevent dishonest scans without making your billing counter wait.
                </p>
                <div className="mt-6 flex items-center gap-2 rounded-xl bg-sand px-3.5 py-2.5 text-xs font-bold text-secondary">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  Counter QR + 4-Digit Voucher PIN
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS (3 STEPS) */}
        <section id="how-it-works" className="bg-secondary px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                No tech degree required
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                Three tiny steps.<br />
                <span className="text-primary">A big boost</span> for your revenue.
              </h2>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {/* Step 1 */}
              <article className="rounded-3xl bg-white p-8 text-ink shadow-float">
                <div className="flex items-center justify-between">
                  <span className="font-display text-4xl font-extrabold text-primary">01</span>
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sand text-secondary">
                    <Store className="h-5 w-5" />
                  </span>
                </div>
                <h3 className="mt-6 font-display text-xl font-extrabold text-secondary">
                  Set Your Custom Rule
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">
                  Define your spend threshold (e.g., Spend ₹100+, collect 10 stamps in 40 days) and choose your reward, like a free chai or ₹50 discount.
                </p>
              </article>

              {/* Step 2 */}
              <article className="rounded-3xl bg-white p-8 text-ink shadow-float">
                <div className="flex items-center justify-between">
                  <span className="font-display text-4xl font-extrabold text-primary">02</span>
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sand text-secondary">
                    <QrCode className="h-5 w-5" />
                  </span>
                </div>
                <h3 className="mt-6 font-display text-xl font-extrabold text-secondary">
                  Display Your Counter QR
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">
                  Print your ready-made QR stand with one click and stick it on your cash register. Customers scan directly with their regular phone camera.
                </p>
              </article>

              {/* Step 3 */}
              <article className="rounded-3xl bg-white p-8 text-ink shadow-float">
                <div className="flex items-center justify-between">
                  <span className="font-display text-4xl font-extrabold text-primary">03</span>
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sand text-secondary">
                    <Gift className="h-5 w-5" />
                  </span>
                </div>
                <h3 className="mt-6 font-display text-xl font-extrabold text-secondary">
                  Approve &amp; Build Streaks
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">
                  Customers collect stamps in seconds. When they complete the card, they present their 4-digit PIN ticket to claim their reward.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* TRANSPARENT PRICING SECTION */}
        <section id="pricing" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Honest Pricing
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-secondary sm:text-4xl lg:text-5xl">
                Start completely free. Scale smoothly.
              </h2>
            </div>

            <div className="mt-12 overflow-hidden rounded-[2.5rem] border border-border bg-white shadow-float md:grid md:grid-cols-2">
              {/* Left Plan Details */}
              <div className="p-8 sm:p-12">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-coral/15 px-3 py-1 font-mono text-xs font-bold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  ZERO-RISK TRIAL TIER
                </span>

                <h3 className="mt-4 font-display text-3xl font-extrabold text-secondary">
                  First 50 Customers Free
                </h3>
                <p className="mt-2 text-sm text-ink/70">
                  Test StickTheBizz on your counter with zero credit card or upfront commitment.
                </p>

                <ul className="mt-8 space-y-3.5 text-sm font-semibold text-ink/80">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span>Instant printable Counter QR stand</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span>Visit tracking &amp; 12-hour anti-fraud lock</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span>Verified customer star ratings &amp; reviews</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span>Free digital counter menu page</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span>WhatsApp onboarding &amp; merchant support</span>
                  </li>
                </ul>

                <div className="mt-10">
                  <Link
                    href="/owner"
                    className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-primary px-8 text-sm font-bold text-white shadow-sm transition hover:bg-secondary"
                  >
                    Start Free Shop Trial →
                  </Link>
                </div>
              </div>

              {/* Right Flat Rate Pricing Box */}
              <div className="flex flex-col justify-between bg-secondary p-8 text-white sm:p-12">
                <div>
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-white/70">
                    Unlimited Growth Tier
                  </p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display text-5xl font-extrabold">₹199</span>
                    <span className="text-base text-white/75">/ month</span>
                  </div>
                  <p className="mt-3 text-sm text-white/80">
                    Less than the cost of two cups of special chai per month. Unlimited customer scans, unlimited rewards, and unlimited regulars.
                  </p>
                </div>

                <div className="mt-10 rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
                  <p className="text-xs font-semibold text-white/90">
                    💡 If StickTheBizz brings just <strong>3 extra customers</strong> back each week, it pays for itself 10 times over.
                  </p>
                  <Link
                    href="/contact"
                    className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-white text-sm font-bold text-secondary transition hover:bg-sand"
                  >
                    Talk to our Merchant Team
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE FAQ ACCORDION (Native HTML details/summary for instant zero-JS response) */}
        <section id="faq" className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Got questions?
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-secondary sm:text-4xl">
                Simple answers for busy shop owners.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-ink/75">
                Everything you need to know about setting up digital punch cards at your billing desk.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-flex min-h-[48px] items-center text-sm font-bold text-primary hover:underline"
              >
                Have a different question? WhatsApp us →
              </Link>
            </div>

            <div className="space-y-4">
              <details className="group rounded-2xl border border-border bg-sand/30 p-5 open:bg-sand/60 transition">
                <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between font-display text-base font-bold text-secondary">
                  Do customers need to download an app from Play Store?
                  <ChevronDown className="h-5 w-5 text-primary transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-ink/75">
                  No! That is the secret to StickTheBizz. Customers scan your counter QR using any phone camera (iPhone or Android). Their digital stamp card opens instantly in Chrome or Safari.
                </p>
              </details>

              <details className="group rounded-2xl border border-border bg-sand/30 p-5 open:bg-sand/60 transition">
                <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between font-display text-base font-bold text-secondary">
                  How does the 12-hour lock prevent fake scans?
                  <ChevronDown className="h-5 w-5 text-primary transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-ink/75">
                  Once a customer receives their daily verified stamp, their digital card is locked until the next calendar day or after a 12-hour window. This stops anyone from scanning the counter QR multiple times in one visit.
                </p>
              </details>

              <details className="group rounded-2xl border border-border bg-sand/30 p-5 open:bg-sand/60 transition">
                <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between font-display text-base font-bold text-secondary">
                  Can I change the minimum spend or reward later?
                  <ChevronDown className="h-5 w-5 text-primary transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-ink/75">
                  Yes, anytime! From your Shop Owner Terminal, you can change your rule (e.g., from 10 visits to 7 visits, or ₹100 spend to ₹150 spend). Your printed counter QR code stays the exact same.
                </p>
              </details>

              <details className="group rounded-2xl border border-border bg-sand/30 p-5 open:bg-sand/60 transition">
                <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between font-display text-base font-bold text-secondary">
                  Is customer data safe under India&apos;s DPDP Act?
                  <ChevronDown className="h-5 w-5 text-primary transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-ink/75">
                  Yes. StickTheBizz strictly follows consent-first data logging. Customer phone numbers are masked in dashboards, never sold to third parties, and customers have a one-tap option to delete their profile.
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

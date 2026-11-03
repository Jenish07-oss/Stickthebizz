"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StampGrid from "@/components/StampGrid";
import RewardTicket from "@/components/RewardTicket";
import ReviewModal from "@/components/ReviewModal";
import ConfettiEffect from "@/components/ConfettiEffect";
import PhoneFrame from "@/components/PhoneFrame";
import { useStore } from "@/context/StoreContext";
import {
  Sparkles,
  QrCode,
  ShieldCheck,
  Star,
  ArrowRight,
  Store,
  Calendar,
  Lock,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function CustomerPage() {
  const {
    rule,
    customer,
    loginCustomer,
    submitScan,
    markRewardGiven,
    getCountdownToMidnight,
  } = useStore();

  const [otpModalOpen, setOtpModalOpen] = useState(!customer.isLoggedIn);
  const [phoneNumber, setPhoneNumber] = useState(customer.phone || "9820012345");
  const [consentChecked, setConsentChecked] = useState(customer.hasConsent);
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Live countdown ticker to 12:00 AM IST
  const [countdownStr, setCountdownStr] = useState("");

  const safeVisits = Math.min(customer.visits, rule.visitsRequired);
  const isGoalCompleted = customer.visits >= rule.visitsRequired;

  useEffect(() => {
    const updateCountdown = () => {
      const { formatted } = getCountdownToMidnight();
      setCountdownStr(formatted);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [getCountdownToMidnight]);

  // Trigger confetti if reward is ready and not yet redeemed
  useEffect(() => {
    if (isGoalCompleted && !customer.isRedeemed) {
      setShowConfetti(true);
    }
  }, [isGoalCompleted, customer.isRedeemed]);

  // Simulated OTP handling
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !consentChecked) return;
    setOtpSent(true);
    setOtpCode("8492");
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length === 4) {
      loginCustomer(phoneNumber);
      setOtpModalOpen(false);
    }
  };

  // Perform Stamp Scan
  const handleScanCounterQR = () => {
    const result = submitScan(rule.minSpend);
    setScanFeedback(result.message);
  };

  return (
    <div className="flex min-h-screen flex-col bg-sand overflow-x-hidden">
      <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <Navbar />

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-[440px]">
          {/* Top Label */}
          <div className="mb-4 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-1.5 font-mono text-xs font-bold text-secondary border border-border shadow-sm">
              <Store className="h-3.5 w-3.5 text-primary" />
              {rule.name} Loyalty Pass
            </span>
          </div>

          {/* REALISTIC SMARTPHONE BEZEL */}
          <PhoneFrame>
            {/* Header Strip inside phone */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink/50">
                Customer View
              </span>

              <button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-ink/75 border border-border transition hover:bg-sand"
              >
                <Star className="h-3 w-3 fill-warning text-warning" />
                <span>{customer.hasReviewed ? "Rated 5★" : "Rate"}</span>
              </button>
            </div>

            {/* STAMP CARD CONTAINER */}
            <div className="rounded-[2rem] border border-border bg-white p-5 shadow-sm pb-10">
              {/* Shop Header & Rule Badge */}
              <div className="border-b border-border/70 pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="font-display text-xl font-extrabold tracking-tight text-secondary">
                      {rule.name}
                    </h1>
                    <p className="text-[11px] text-ink/65">
                      Digital Counter Loyalty Card
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                      isGoalCompleted
                        ? "bg-success/15 text-success"
                        : "bg-coral/15 text-primary"
                    }`}
                  >
                    {isGoalCompleted ? "CARD COMPLETED" : "COLLECTING"}
                  </span>
                </div>

                {/* Rule Pills */}
                <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                  <span className="rounded-md bg-sand/70 px-2 py-0.5 text-ink/80">
                    Bill ₹{rule.minSpend}+
                  </span>
                  <span className="rounded-md bg-sand/70 px-2 py-0.5 text-ink/80">
                    {rule.visitsRequired} visits in {rule.validityDays}d
                  </span>
                </div>
              </div>

              {/* Visit Progress & Cycle Days (Capped at visitsRequired) */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="font-display text-base text-secondary flex items-center gap-1.5">
                    {safeVisits} of {rule.visitsRequired} visits
                    {isGoalCompleted && (
                      <CheckCircle2 className="h-4 w-4 text-success inline" />
                    )}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[11px] text-ink/60">
                    <Calendar className="h-3 w-3" />
                    Day 23/{rule.validityDays}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-sand">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (safeVisits / rule.visitsRequired) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* STAMP GRID COMPONENT */}
              <div className="mt-4">
                <StampGrid
                  totalVisits={rule.visitsRequired}
                  completedVisits={safeVisits}
                  rewardName={rule.rewardName}
                />
              </div>

              {/* REWARD TICKET IF UNLOCKED */}
              {isGoalCompleted && (
                <div className="mt-5 animate-stamp-pop">
                  <RewardTicket
                    ticket={{
                      code: customer.activeRewardCode || "STB-7Q4K-29",
                      pin: customer.redemptionPin || "8492",
                      rewardName: rule.rewardName,
                      expiryDate: "Valid for 14 days",
                      isRedeemed: customer.isRedeemed,
                    }}
                    onRedeem={() => {
                      markRewardGiven(customer.phone);
                      setScanFeedback("🎉 Reward voucher redeemed! Enjoy your free treat!");
                    }}
                  />
                </div>
              )}

              {/* ANTI-FRAUD SCAN BUTTON OR ACTIVE COUNTDOWN */}
              <div className="mt-5">
                {isGoalCompleted && !customer.isRedeemed ? (
                  <div className="rounded-2xl border border-success/40 bg-success/10 p-3.5 text-center">
                    <p className="text-xs font-bold text-success flex items-center justify-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-success" />
                      Goal reached! Show your 4-digit PIN above to cashier.
                    </p>
                  </div>
                ) : customer.lockedUntilMidnight ? (
                  <div className="rounded-2xl border border-warning/40 bg-warning/10 p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-ink">
                      <Lock className="h-4 w-4 text-warning" />
                      <span>Today&apos;s visit verified!</span>
                    </div>
                    <p className="mt-1 text-[11px] text-ink/75">
                      Next stamp unlocks at <strong>12:00 AM IST</strong>
                    </p>
                    <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-mono text-xs font-extrabold text-secondary shadow-sm">
                      <Clock className="h-3 w-3 text-primary animate-pulse" />
                      <span>{countdownStr || "Unlocks at midnight"}</span>
                    </div>
                    <button
                      disabled
                      className="mt-2.5 flex min-h-[48px] w-full cursor-not-allowed items-center justify-center rounded-xl bg-border text-xs font-bold text-ink/40"
                    >
                      Counter Stamp Locked
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleScanCounterQR}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-card transition hover:bg-secondary focus-visible:outline focus-visible:outline-2"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>Scan Counter QR (+1 Stamp)</span>
                  </button>
                )}

                {/* Scan Feedback Message */}
                {scanFeedback && (
                  <div className="mt-2.5 rounded-xl bg-sand p-2.5 text-center text-xs font-bold text-secondary animate-pulse">
                    {scanFeedback}
                  </div>
                )}
              </div>

              {/* Next reward incentive preview */}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-sand/50 p-2.5 text-[11px] text-ink/75">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold">Goal Reward:</span>
                </div>
                <span className="font-display font-extrabold text-secondary">
                  {rule.rewardName}
                </span>
              </div>
            </div>

            {/* Privacy notice inside phone */}
            <div className="mt-3 flex items-center justify-center gap-1 text-center text-[10px] text-ink/50 pb-4">
              <ShieldCheck className="h-3 w-3 text-success" />
              <span>DPDP Act 2023 Compliant • No spam</span>
            </div>
          </PhoneFrame>

          {/* Change Number Button */}
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => setOtpModalOpen(true)}
              className="text-xs font-semibold text-secondary hover:underline"
            >
              Logged in as {customer.phone} (Change Mobile Number)
            </button>
          </div>
        </div>
      </main>

      {/* PASSWORDLESS ONBOARDING MODAL (SIMULATED) */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] border border-border bg-white p-6 shadow-float">
            <div className="text-center">
              <span className="grid mx-auto h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </span>
              <h2 className="mt-3 font-display text-xl font-extrabold text-secondary">
                Your Digital Stamp Card
              </h2>
              <p className="mt-1 text-xs text-ink/65">
                Zero app downloads. Enter your mobile number to track rewards at {rule.name}.
              </p>
            </div>

            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="mobile"
                    className="block text-xs font-bold uppercase tracking-wider text-ink/70"
                  >
                    10-Digit Mobile Number
                  </label>
                  <input
                    id="mobile"
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 9820012345"
                    className="mt-1.5 w-full rounded-xl border border-border p-3 text-sm font-semibold text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Mandatory Consent Checkbox */}
                <div className="flex items-start gap-2.5 rounded-xl bg-sand/40 p-3">
                  <input
                    id="consent"
                    type="checkbox"
                    required
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="consent" className="text-[11px] leading-relaxed text-ink/75">
                    I agree that <strong>{rule.name}</strong> can view my visit count. My data is stored solely for this loyalty card under the DPDP Act.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!consentChecked || !phoneNumber}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition hover:bg-secondary disabled:opacity-50 shadow-sm"
                >
                  <span>Continue with OTP</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
                <div className="rounded-xl bg-sand/60 p-3 text-center text-xs text-ink/75">
                  Simulation OTP sent to <strong className="font-mono">{phoneNumber}</strong>
                </div>

                <div>
                  <label
                    htmlFor="otp"
                    className="block text-center text-xs font-bold uppercase tracking-wider text-ink/70"
                  >
                    Enter 4-Digit OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    maxLength={4}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="mt-2 w-full text-center font-mono text-2xl font-extrabold tracking-widest rounded-xl border border-border p-3 text-secondary focus:border-primary focus:outline-none"
                  />
                  <p className="mt-1 text-center font-mono text-[11px] text-ink/50">
                    Auto-filled: 8492 (Demo Simulator)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={otpCode.length !== 4}
                  className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-secondary text-sm font-bold text-white transition hover:bg-primary shadow-sm"
                >
                  Verify &amp; Open Card
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* VERIFIED CUSTOMER REVIEW MODAL */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
      />

      <Footer />
    </div>
  );
}

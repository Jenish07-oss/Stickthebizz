"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StampGrid from "@/components/StampGrid";
import RewardTicket from "@/components/RewardTicket";
import DemoControls from "@/components/DemoControls";
import ReviewModal from "@/components/ReviewModal";
import { useStore } from "@/context/StoreContext";
import {
  Sparkles,
  QrCode,
  ShieldCheck,
  Star,
  Clock,
  ArrowRight,
  Store,
  Calendar,
  Lock,
} from "lucide-react";

export default function CustomerPage() {
  const { rule, customer, loginCustomer, scanStamp, checkLockStatus, markRewardGiven } =
    useStore();

  const [otpModalOpen, setOtpModalOpen] = useState(!customer.isLoggedIn);
  const [phoneOrEmail, setPhoneOrEmail] = useState(customer.identifier || "");
  const [consentChecked, setConsentChecked] = useState(customer.hasConsent);
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const lockInfo = checkLockStatus();

  // Simulated OTP handling
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOrEmail || !consentChecked) return;
    setOtpSent(true);
    setOtpCode("4892"); // Pre-filled simulation OTP for convenience
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length === 4) {
      loginCustomer(phoneOrEmail);
      setOtpModalOpen(false);
    }
  };

  // Perform Stamp Scan
  const handleScanCounterQR = () => {
    const result = scanStamp();
    setScanFeedback(result.message);
  };

  return (
    <div className="flex min-h-screen flex-col bg-sand overflow-x-hidden">
      <Navbar />

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-[420px]">
          {/* Header Strip */}
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 font-mono text-xs font-bold text-secondary border border-border shadow-sm">
              <Store className="h-3.5 w-3.5 text-primary" />
              {rule.shopName}
            </span>

            <button
              type="button"
              onClick={() => setReviewModalOpen(true)}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-ink/75 border border-border transition hover:bg-white"
            >
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              <span>{customer.hasReviewed ? "Rated 5★" : "Rate Shop"}</span>
            </button>
          </div>

          {/* MAIN STAMP CARD CONTAINER */}
          <div className="rounded-[2.4rem] border-2 border-secondary/20 bg-white p-6 shadow-float">
            {/* Shop Header & Rule Badge */}
            <div className="border-b border-border/70 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="font-display text-2xl font-extrabold tracking-tight text-secondary">
                    {rule.shopName}
                  </h1>
                  <p className="mt-0.5 text-xs text-ink/65">
                    Official Digital Loyalty Card
                  </p>
                </div>
                <span className="rounded-full bg-coral/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-primary">
                  {customer.visits >= rule.visitsNeeded ? "REWARD READY" : "COLLECTING"}
                </span>
              </div>

              {/* Rule Pills */}
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-lg bg-sand/70 px-2.5 py-1 text-ink/80">
                  Bill ₹{rule.minSpend}+ per visit
                </span>
                <span className="rounded-lg bg-sand/70 px-2.5 py-1 text-ink/80">
                  {rule.visitsNeeded} visits in {rule.expiryDays} days
                </span>
              </div>
            </div>

            {/* Visit Progress & Cycle Days */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="font-display text-lg text-secondary">
                  {customer.visits} of {rule.visitsNeeded} visits
                </span>
                <span className="flex items-center gap-1 font-mono text-ink/60">
                  <Calendar className="h-3.5 w-3.5" />
                  Day 23 of {rule.expiryDays}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-2.5 h-3 w-full overflow-hidden rounded-full bg-sand">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (customer.visits / rule.visitsNeeded) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* STAMP GRID COMPONENT */}
            <div className="mt-6">
              <StampGrid
                totalVisits={rule.visitsNeeded}
                completedVisits={customer.visits}
                rewardName={rule.rewardName}
              />
            </div>

            {/* REWARD TICKET IF UNLOCKED */}
            {customer.rewardTicket && (
              <div className="mt-6">
                <RewardTicket
                  ticket={customer.rewardTicket}
                  onRedeem={() => {
                    markRewardGiven(customer.identifier);
                    setScanFeedback("🎉 Reward voucher redeemed! Enjoy your free treat!");
                  }}
                />
              </div>
            )}

            {/* ANTI-FRAUD SCAN BUTTON */}
            <div className="mt-6">
              {lockInfo.isLocked ? (
                <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-ink">
                    <Lock className="h-4 w-4 text-warning" />
                    <span>Already checked in today!</span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-ink/75">
                    Next stamp opens in {lockInfo.hoursRemaining} hours (at {lockInfo.nextOpenTime}).
                  </p>
                  <button
                    disabled
                    className="mt-3 flex min-h-[48px] w-full cursor-not-allowed items-center justify-center rounded-xl bg-border text-sm font-bold text-ink/40"
                  >
                    Counter Stamp Locked
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleScanCounterQR}
                  className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-white shadow-card transition hover:bg-secondary focus-visible:outline focus-visible:outline-2"
                >
                  <QrCode className="h-5 w-5" />
                  <span>Scan Counter QR (+1 Stamp)</span>
                </button>
              )}

              {/* Scan Feedback Message */}
              {scanFeedback && (
                <div className="mt-3 rounded-xl bg-sand p-3 text-center text-xs font-bold text-secondary">
                  {scanFeedback}
                </div>
              )}
            </div>

            {/* Next reward incentive preview */}
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-sand/50 p-3 text-xs text-ink/75">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-semibold">Goal Reward:</span>
              </div>
              <span className="font-display font-extrabold text-secondary">
                {rule.rewardName}
              </span>
            </div>
          </div>

          {/* Privacy & Anti-Fraud Footer */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-ink/50">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            <span>DPDP Act 2023 Compliant • No phone spam</span>
          </div>

          {/* Re-Open Login / Change Number Button */}
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => setOtpModalOpen(true)}
              className="text-[11px] font-semibold text-secondary hover:underline"
            >
              Logged in as {customer.identifier} (Change)
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
                Zero app downloads. Log in with your phone or email to track rewards at {rule.shopName}.
              </p>
            </div>

            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="identifier"
                    className="block text-xs font-bold uppercase tracking-wider text-ink/70"
                  >
                    Mobile Number or Email
                  </label>
                  <input
                    id="identifier"
                    type="text"
                    required
                    value={phoneOrEmail}
                    onChange={(e) => setPhoneOrEmail(e.target.value)}
                    placeholder="e.g. 9820012345 or you@email.com"
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
                    I agree that <strong>{rule.shopName}</strong> can view my visit count. My data is stored solely for this loyalty card under the DPDP Act.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!consentChecked || !phoneOrEmail}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition hover:bg-secondary disabled:opacity-50 shadow-sm"
                >
                  <span>Continue with OTP</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
                <div className="rounded-xl bg-sand/60 p-3 text-center text-xs text-ink/75">
                  Simulation OTP sent to <strong className="font-mono">{phoneOrEmail}</strong>
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
                    Auto-filled: 4892 (Demo Simulator)
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

      {/* FAST-FORWARD DEMO CONTROLS FLOATING BAR */}
      <DemoControls />

      <Footer />
    </div>
  );
}

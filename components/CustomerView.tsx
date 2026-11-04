"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";
import StampGrid from "@/components/StampGrid";

const RewardTicket = dynamic(() => import("@/components/RewardTicket"), {
  ssr: false,
});
const ReviewModal = dynamic(() => import("@/components/ReviewModal"), {
  ssr: false,
});
const ConfettiEffect = dynamic(() => import("@/components/ConfettiEffect"), {
  ssr: false,
});
import { submitScan as submitScanAction, getCustomerMerchantStatus } from "@/app/actions/scan";
import { playScanChime } from "@/lib/audio";
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
  Phone,
  User,
  LogOut,
  AlertCircle,
} from "lucide-react";

export interface InitialMerchantData {
  id?: string;
  slug: string;
  name: string;
  minSpend: number;
  visitsRequired: number;
  rewardName: string;
  validityDays?: number;
}

export interface InitialCustomerData {
  id?: string;
  phone: string;
  fullName?: string | null;
  email?: string | null;
}

export interface InitialStatusData {
  visitsCount: number;
  isLockedToday: boolean;
}

export default function CustomerView({
  initialMerchant,
  initialCustomer,
  initialStatus,
}: {
  initialMerchant?: InitialMerchantData;
  initialCustomer?: InitialCustomerData | null;
  initialStatus?: InitialStatusData | null;
}) {
  const merchant = initialMerchant || {
    id: "default-store",
    slug: "kesar-chai",
    name: "Kesar Chai Corner",
    minSpend: 100,
    visitsRequired: 10,
    rewardName: "Free Masala Chai",
    validityDays: 30,
  };

  const visitsRequired = Number(merchant.visitsRequired) || 10;
  const validityDays = Number(merchant.validityDays) || 30;

  // Real Database State
  const [customer, setCustomer] = useState<{ id?: string; phone: string; fullName?: string | null } | null>(
    initialCustomer ? { id: initialCustomer.id, phone: initialCustomer.phone, fullName: initialCustomer.fullName } : null
  );
  const [visitsCount, setVisitsCount] = useState<number>(initialStatus?.visitsCount || 0);
  const [isLockedToday, setIsLockedToday] = useState(initialStatus?.isLockedToday || false);
  const [loadingStatus, setLoadingStatus] = useState(!initialCustomer);

  // Form Inputs for New / Unauthenticated Customer
  const [mobileInput, setMobileInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [consentChecked, setConsentChecked] = useState(true);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [countdownStr, setCountdownStr] = useState("");
  const [changeNumberModal, setChangeNumberModal] = useState(false);

  // 1. Calculate Countdown to 12:00:00 AM IST
  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      // IST is UTC + 5h30m
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const istTime = new Date(utc + 5.5 * 3600000);

      const istMidnight = new Date(istTime);
      istMidnight.setHours(24, 0, 0, 0);

      const diffMs = istMidnight.getTime() - istTime.getTime();
      if (diffMs <= 0) {
        setCountdownStr("Unlocking now...");
        setIsLockedToday(false);
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setCountdownStr(
        `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`
      );
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Load Real Customer Session from Server Prop, LocalStorage or Supabase
  useEffect(() => {
    async function loadCustomerState() {
      try {
        if (initialCustomer?.phone) {
          if (typeof window !== "undefined") {
            localStorage.setItem("stb_customer_phone", initialCustomer.phone);
            if (initialCustomer.fullName) {
              localStorage.setItem("stb_customer_name", initialCustomer.fullName);
            }
          }
          setLoadingStatus(false);
          return;
        }

        let savedPhone = "";
        if (typeof window !== "undefined") {
          savedPhone = localStorage.getItem("stb_customer_phone") || "";
          const savedName = localStorage.getItem("stb_customer_name") || "";
          if (savedPhone) {
            setCustomer({ phone: savedPhone, fullName: savedName });
          }
        }

        if (merchant.id) {
          const res = await getCustomerMerchantStatus(merchant.id, savedPhone);
          if (res.customer) {
            setCustomer(res.customer);
            setVisitsCount(res.visitsCount || 0);
            setIsLockedToday(res.isLockedToday);
            if (typeof window !== "undefined" && res.customer.phone) {
              localStorage.setItem("stb_customer_phone", res.customer.phone);
              if (res.customer.full_name) {
                localStorage.setItem("stb_customer_name", res.customer.full_name);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load customer state:", err);
      } finally {
        setLoadingStatus(false);
      }
    }

    loadCustomerState();
  }, [merchant.id, initialCustomer]);

  const safeVisits = Math.min(visitsCount, visitsRequired);
  const isGoalCompleted = visitsCount >= visitsRequired;

  // 3. Claim / Punch Stamp (Connected directly to Supabase submitScan)
  const handleClaimStamp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setFeedbackMessage(null);

    const targetPhone = customer?.phone || mobileInput.replace(/\D/g, "");
    const targetName = customer?.fullName || nameInput.trim();

    if (!targetPhone || targetPhone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!consentChecked && !customer) {
      setErrorMessage("Please check the consent box to create your loyalty pass.");
      return;
    }

    if (!merchant.id) {
      setErrorMessage("Store configuration missing. Please reload.");
      return;
    }

    setIsSubmitting(true);
    playScanChime();

    try {
      const res = await submitScanAction(targetPhone, merchant.id, merchant.minSpend, targetName);

      if (res.locked) {
        setIsLockedToday(true);
        setFeedbackMessage(res.message);
        return;
      }

      if (res.success) {
        const nextVisits = visitsCount + 1;
        setVisitsCount(nextVisits);
        setIsLockedToday(true);
        setCustomer({ phone: targetPhone, fullName: targetName });

        if (typeof window !== "undefined") {
          localStorage.setItem("stb_customer_phone", targetPhone);
          if (targetName) localStorage.setItem("stb_customer_name", targetName);
        }

        setFeedbackMessage("✓ Today's stamp punched! Cashier counter notified.");

        if (nextVisits >= visitsRequired) {
          setShowConfetti(true);
        }
      } else {
        setErrorMessage(res.message || "Failed to verify stamp.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while claiming stamp.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchNumber = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("stb_customer_phone");
      localStorage.removeItem("stb_customer_name");
    }
    setCustomer(null);
    setVisitsCount(0);
    setIsLockedToday(false);
    setMobileInput("");
    setNameInput("");
    setChangeNumberModal(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-sand overflow-x-hidden">
      <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <Navbar />

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-[440px]">
          {/* Top Label */}
          <div className="mb-4 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 font-mono text-xs font-bold text-secondary border border-border shadow-sm">
              <Store className="h-3.5 w-3.5 text-primary" />
              {merchant.name} Loyalty Pass
            </span>
          </div>

          {/* CUSTOMER PASS CONTAINER (Optimized for all mobile devices) */}
          <div className="w-full max-w-[380px] mx-auto">
            {/* Header Strip inside phone */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink/50">
                Official Digital Pass
              </span>

              <button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-ink/75 border border-border transition hover:bg-sand"
              >
                <Star className="h-3 w-3 fill-warning text-warning" />
                <span>Rate Store</span>
              </button>
            </div>

            {/* STAMP CARD CONTAINER */}
            <div className="rounded-[2rem] border border-border bg-white p-5 shadow-sm pb-8">
              {/* Shop Header & Rule Badge */}
              <div className="border-b border-border/70 pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="font-display text-xl font-extrabold tracking-tight text-secondary">
                      {merchant.name}
                    </h1>
                    <p className="text-[11px] text-ink/65">
                      Counter Streak Loyalty Card
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
                    Min Bill ₹{merchant.minSpend}+
                  </span>
                  <span className="rounded-md bg-sand/70 px-2 py-0.5 text-ink/80">
                    {visitsRequired} visits in {validityDays}d
                  </span>
                </div>
              </div>

              {/* Visit Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="font-display text-base text-secondary flex items-center gap-1.5">
                    {safeVisits} of {visitsRequired} visits
                    {isGoalCompleted && (
                      <CheckCircle2 className="h-4 w-4 text-success inline" />
                    )}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[11px] text-ink/60">
                    <Calendar className="h-3 w-3" />
                    Valid {validityDays} Days
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-sand">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (safeVisits / visitsRequired) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* STAMP GRID COMPONENT */}
              <div className="mt-4">
                <StampGrid
                  totalVisits={visitsRequired}
                  completedVisits={safeVisits}
                  rewardName={merchant.rewardName}
                />
              </div>

              {/* REWARD TICKET IF UNLOCKED */}
              {isGoalCompleted && (
                <div className="mt-5 animate-stamp-pop">
                  <RewardTicket
                    ticket={{
                      code: `STB-${targetMerchantCode(merchant.slug)}`,
                      
                      rewardName: merchant.rewardName,
                      expiryDate: `Valid for 14 days`,
                      isRedeemed: false,
                    }}
                    onRedeem={() => {
                      setFeedbackMessage("Present your unique Voucher Code above to the cashier at the counter!");
                    }}
                  />
                </div>
              )}

              {/* USER STATUS / ACTION SECTION */}
              <div className="mt-5">
                {customer ? (
                  // Identified Customer View
                  <div>
                    <div className="mb-3 flex items-center justify-between rounded-xl bg-sand/50 px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-secondary" />
                        <span className="font-bold text-secondary">
                          {customer.fullName || `+91 ${customer.phone}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setChangeNumberModal(true)}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Change
                      </button>
                    </div>

                    {isLockedToday ? (
                      <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-ink">
                          <Lock className="h-4 w-4 text-warning" />
                          <span>Today&apos;s visit verified!</span>
                        </div>
                        <p className="mt-1 text-[11px] text-ink/75">
                          Next stamp unlocks at <strong>12:00 AM IST</strong>
                        </p>
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-mono text-xs font-extrabold text-secondary shadow-sm">
                          <Clock className="h-3 w-3 text-primary animate-pulse" />
                          <span>{countdownStr || "Unlocks at midnight"}</span>
                        </div>
                        <button
                          disabled
                          className="mt-3 flex min-h-[46px] w-full cursor-not-allowed items-center justify-center rounded-xl bg-border text-xs font-bold text-ink/40"
                        >
                          Counter Stamp Claimed Today
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleClaimStamp()}
                        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-card transition hover:bg-secondary focus-visible:outline focus-visible:outline-2 disabled:opacity-70"
                      >
                        <QrCode className="h-4 w-4" />
                        <span>{isSubmitting ? "Verifying Scan..." : "Punch Today's Stamp (+1 Visit)"}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  // First-Time Visitor Check-In Form (Seamless, No Fake OTP Modal!)
                  <form onSubmit={handleClaimStamp} className="space-y-3 rounded-2xl bg-sand/30 p-4 border border-border">
                    <div className="text-center">
                      <p className="text-xs font-extrabold text-secondary">
                        Claim Your Visit Stamp
                      </p>
                      <p className="text-[11px] text-ink/65 mt-0.5">
                        Enter mobile number to save your progress. Zero app download.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-ink/70">
                        10-Digit Mobile Number
                      </label>
                      <div className="relative mt-1">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-bold text-ink/50">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={mobileInput}
                          onChange={(e) => setMobileInput(e.target.value.replace(/\D/g, ""))}
                          placeholder="98765 43210"
                          className="w-full rounded-xl border border-border bg-white py-2.5 pl-12 pr-3 text-sm font-semibold text-secondary placeholder:text-ink/35 focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-ink/70">
                        Your Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="e.g. Rahul Patel"
                        className="mt-1 w-full rounded-xl border border-border bg-white py-2.5 px-3 text-sm font-semibold text-secondary placeholder:text-ink/35 focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="flex items-start gap-2 pt-1">
                      <input
                        id="consent-check"
                        type="checkbox"
                        checked={consentChecked}
                        onChange={(e) => setConsentChecked(e.target.checked)}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
                      />
                      <label htmlFor="consent-check" className="text-[10px] leading-relaxed text-ink/70">
                        I agree to save my loyalty visits with <strong>{merchant.name}</strong> under the DPDP Act 2023.
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || mobileInput.length < 10 || !consentChecked}
                      className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-sm transition hover:bg-secondary disabled:opacity-50"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>{isSubmitting ? "Verifying..." : "Punch Stamp & Save Pass"}</span>
                    </button>
                  </form>
                )}

                {/* Feedback & Error Alerts */}
                {feedbackMessage && (
                  <div className="mt-3 rounded-xl bg-sand p-3 text-center text-xs font-bold text-secondary border border-border">
                    {feedbackMessage}
                  </div>
                )}
                {errorMessage && (
                  <div className="mt-3 rounded-xl bg-primary/10 p-3 text-center text-xs font-bold text-primary border border-primary/20 flex items-center justify-center gap-1.5">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Goal Reward Preview */}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-sand/50 p-2.5 text-[11px] text-ink/75">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold">Goal Reward:</span>
                </div>
                <span className="font-display font-extrabold text-secondary">
                  {merchant.rewardName}
                </span>
              </div>
            </div>

            {/* Privacy notice inside phone */}
            <div className="mt-3 flex items-center justify-center gap-1 text-center text-[10px] text-ink/50 pb-2">
              <ShieldCheck className="h-3 w-3 text-success" />
              <span>DPDP Act 2023 Compliant • Anti-Fraud Protection</span>
            </div>
          </div>

          {/* Quick Links at Bottom */}
          <div className="mt-4 text-center space-y-2">
            <Link
              href="/customer/dashboard"
              className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:underline"
            >
              <span>View all my digital passes</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </main>

      {/* Switch Number Confirmation Modal */}
      {changeNumberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-sm rounded-[2rem] border border-border bg-white p-6 shadow-float text-center">
            <h3 className="font-display text-lg font-extrabold text-secondary">
              Switch Mobile Number?
            </h3>
            <p className="mt-2 text-xs text-ink/70 leading-relaxed">
              This will log you out of this pass on this device. You can log back in anytime with your mobile number.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setChangeNumberModal(false)}
                className="flex-1 min-h-[44px] rounded-xl border border-border text-xs font-bold text-ink/70 hover:bg-sand"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSwitchNumber}
                className="flex-1 min-h-[44px] rounded-xl bg-primary text-xs font-bold text-white hover:bg-primary/90"
              >
                Yes, Switch
              </button>
            </div>
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

function targetMerchantCode(slug: string) {
  const clean = slug.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return clean.slice(0, 4) || "CARD";
}

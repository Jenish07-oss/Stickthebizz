"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";
const StampGrid = dynamic(() => import("@/components/StampGrid"), {
  ssr: false,
});

const RewardTicket = dynamic(() => import("@/components/RewardTicket"), {
  ssr: false,
});
const ReviewModal = dynamic(() => import("@/components/ReviewModal"), {
  ssr: false,
});
const ConfettiEffect = dynamic(() => import("@/components/ConfettiEffect"), {
  ssr: false,
});
import { api } from "@/lib/api/client";
import { playScanChime } from "@/lib/audio";
import { useTerminalSocket } from "@/lib/ws/useTerminalSocket";
import { useToast } from "@/components/ui/Toast";
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
  AlertCircle,
} from "lucide-react";
import { decodeHtml } from "@/lib/utils/sanitize";

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
  const [customer, setCustomer] = useState<{ id?: string; phone: string; displayPhone?: string; fullName?: string | null; email?: string | null } | null>(
    initialCustomer ? { id: initialCustomer.id, phone: initialCustomer.phone, fullName: initialCustomer.fullName, email: initialCustomer.email } : null
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
  const autoPunchedRef = useRef(false);

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
          const cleanInit = initialCustomer.phone.replace(/\D/g, "");
          if (cleanInit.length === 10) {
            if (typeof window !== "undefined") {
              localStorage.setItem("stb_customer_phone", cleanInit);
              if (initialCustomer.fullName) {
                localStorage.setItem("stb_customer_name", initialCustomer.fullName);
              }
            }
            setCustomer({ id: initialCustomer.id, phone: cleanInit, fullName: initialCustomer.fullName });
            setLoadingStatus(false);
            return;
          }
        }

        let savedPhone = "";
        const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const queryPhone = urlParams?.get("phone")?.replace(/\D/g, "");
        if (queryPhone && queryPhone.length === 10) {
          savedPhone = queryPhone;
          const queryName = urlParams?.get("name") || (queryPhone === "9820012345" ? "Demo Customer" : "");
          setCustomer({ phone: queryPhone, fullName: queryName });
          if (typeof window !== "undefined") {
            localStorage.setItem("stb_customer_phone", queryPhone);
            if (queryName) localStorage.setItem("stb_customer_name", queryName);
          }
        }

        if (!savedPhone && typeof window !== "undefined") {
          const raw = localStorage.getItem("stb_customer_phone") || "";
          const clean = raw.replace(/\D/g, "");
          if (clean.length === 10) {
            savedPhone = clean;
            const savedName = localStorage.getItem("stb_customer_name") || "";
            setCustomer({ phone: clean, fullName: savedName });
          } else {
            localStorage.removeItem("stb_customer_phone");
          }
        }

        // Demo Cafe Credential Resolution Fallback
        if (!savedPhone && merchant.slug === "demo-cafe") {
          savedPhone = "9820012345";
          setCustomer({
            phone: "9820012345",
            fullName: "Demo Customer",
            email: "demo.customer@stickthebizz.in",
          });
        }

        if (!savedPhone) {
          try {
            const meRes = await api.auth.getMe();
            if (meRes?.user && meRes.user.role === "CUSTOMER") {
              const uPhone = (meRes.user.phone || "").replace(/\D/g, "");
              const uName = meRes.user.fullName || meRes.customer?.fullName || "";
              if (uName) setNameInput(uName);
              if (uPhone && uPhone.length === 10) {
                savedPhone = uPhone;
                setCustomer({ id: meRes.customer?.id, phone: uPhone, fullName: uName, email: meRes.user.email });
                if (typeof window !== "undefined") {
                  localStorage.setItem("stb_customer_phone", uPhone);
                  if (uName) localStorage.setItem("stb_customer_name", uName);
                  if (meRes.user.email) localStorage.setItem("stb_customer_email", meRes.user.email);
                }
              }
            }
          } catch {
            // silent client session check
          }
        }

        if (merchant.id) {
          const res = await api.scans.status(merchant.id, savedPhone);
          if (res.customer) {
            const validPhone = (res.customer.phone || savedPhone || "").replace(/\D/g, "");
            const custObj = {
              ...res.customer,
              phone: validPhone,
              fullName: res.customer.fullName || (typeof window !== "undefined" ? localStorage.getItem("stb_customer_name") : "") || "Loyal Customer",
            };
            setCustomer(custObj);
            setVisitsCount(res.visitsCount || 0);
            setIsLockedToday(res.isLockedToday);
            if (typeof window !== "undefined") {
              if (validPhone) localStorage.setItem("stb_customer_phone", validPhone);
              if (custObj.fullName) localStorage.setItem("stb_customer_name", custObj.fullName);
              if (res.customer.email) localStorage.setItem("stb_customer_email", res.customer.email);
            }

            // Direct auto-punch for existing/returning account on QR scan
            if (!autoPunchedRef.current && !res.isLockedToday && (res.visitsCount || 0) < visitsRequired && validPhone.length === 10) {
              autoPunchedRef.current = true;
              setIsSubmitting(true);
              setFeedbackMessage("⚡ Verified account recognized! Punching today's stamp...");
              playScanChime();

              try {
                const punchRes = await api.scans.punch({
                  customerPhone: validPhone,
                  merchantId: merchant.id,
                  billAmount: merchant.minSpend,
                  customerName: custObj.fullName || "",
                });

                if (punchRes.locked) {
                  setIsLockedToday(true);
                  setFeedbackMessage(punchRes.message);
                } else if (punchRes.success) {
                  const nextVisits = (res.visitsCount || 0) + 1;
                  setVisitsCount(nextVisits);
                  setIsLockedToday(true);
                  setFeedbackMessage("✓ Today's stamp punched directly! Cashier counter notified.");
                  if (nextVisits >= visitsRequired) {
                    setShowConfetti(true);
                  }
                } else {
                  setErrorMessage(punchRes.message || "Failed to punch stamp.");
                }
              } catch (autoErr) {
                console.error("Auto punch error:", autoErr);
              } finally {
                setIsSubmitting(false);
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

  const toast = useToast();

  useTerminalSocket({
    customerId: customer?.id,
    onCheckInApproved: (payload) => {
      if (typeof payload?.newStampCount === "number") {
        setVisitsCount(payload.newStampCount);
      }
      setIsLockedToday(true);
      toast.success("Visit approved by cashier!");
      if (payload?.rewardReady) {
        setShowConfetti(true);
      }
    },
    onRewardBurned: (payload) => {
      setShowConfetti(true);
      toast.success(`Enjoy your ${payload?.rewardTitle || "Reward"}!`);
    },
  });

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
      setErrorMessage("Please enter your 10-digit mobile number to collect your stamp.");
      setChangeNumberModal(true);
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
        setCustomer({ id: res.customer?.id || res.customerId, phone: targetPhone, fullName: targetName });

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
        localStorage.removeItem("stb_customer_email");
        localStorage.removeItem("stb_customer_device_session");
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
              {decodeHtml(merchant.name)} Loyalty Pass
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
                      {decodeHtml(merchant.name)}
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
                {loadingStatus ? (
                  <div className="rounded-2xl border border-border bg-sand/40 p-6 text-center">
                    <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-xs font-bold text-secondary">Checking verified pass status...</p>
                    <p className="mt-0.5 text-[10px] text-ink/50">Restoring your stamps &amp; visit streak...</p>
                  </div>
                ) : customer ? (
                  // Identified Customer View - Already logged in, can punch directly
                  <div>
                    <div className="mb-3 flex items-center justify-between rounded-xl bg-sand/60 px-3 py-2 text-xs border border-border">
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-ink/50">Verified Customer</p>
                          <span className="font-extrabold text-secondary text-xs">
                            {customer.fullName || customer.displayPhone || (customer.phone ? `+91 ${customer.phone}` : (customer.email || "Loyal Customer"))}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setChangeNumberModal(true)}
                        className="text-[11px] font-bold text-primary hover:underline"
                      >
                        Switch Account
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
                                // NOT LOGGED IN - Must create account FIRST via /auth/customer/login
                                <div className="space-y-3.5 rounded-2xl bg-sand/30 p-5 border border-border">
                                  <div className="text-center">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-coral/15 px-3 py-1 font-mono text-[10px] font-extrabold tracking-wider text-primary">
                                      <ShieldCheck className="h-3 w-3" />
                                      ACCOUNT REQUIRED
                                    </span>
                                    <h2 className="mt-2 font-display text-base font-extrabold text-secondary">
                                      Log In to Collect Stamps
                                    </h2>
                                    <p className="text-[11px] text-ink/70 mt-0.5 leading-snug">
                                      For security & anti-fraud, please create your verified account first.
                                      Then scan this QR again to punch your stamp instantly.
                                    </p>
                                  </div>

                                  <div className="space-y-3">
                                    <Link
                                      href={`/auth/customer/login?redirect=/s/${merchant.slug}`}
                                      className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-card transition hover:bg-secondary"
                                    >
                                      <QrCode className="h-4 w-4" />
                                      <span>Log In / Sign Up via Email OTP</span>
                                    </Link>

                                    <p className="text-center text-[11px] text-ink/60">
                                      Create your verified account to collect stamps and unlock rewards.
                                    </p>
                                  </div>

                                  <div className="mt-3 text-center text-xs text-ink/70 pt-2.5 border-t border-border/60">
                                    <p>Your data is protected under DPDP Act 2023. No spam, ever.</p>
                                  </div>
                                </div>
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

      {/* Switch / Link Mobile Number Modal */}
      {changeNumberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-sm rounded-[2rem] border border-border bg-white p-6 shadow-float">
            {!customer?.phone ? (
              // Link Phone Number form for email-verified customers
              <div>
                <h3 className="font-display text-lg font-extrabold text-secondary">
                  Link Your Mobile Number
                </h3>
                <p className="mt-1 text-xs text-ink/70 leading-relaxed">
                  Enter your 10-digit mobile number to link your counter pass and punch your stamp.
                </p>
                <div className="mt-4">
                  <label className="block text-[11px] font-bold uppercase text-ink/60">
                    Mobile Number (+91)
                  </label>
                  <div className="relative mt-1">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-mono font-bold text-secondary">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      autoFocus
                      placeholder="98200 12345"
                      value={mobileInput}
                      onChange={(e) => setMobileInput(e.target.value.replace(/\D/g, ""))}
                      className="w-full rounded-xl border border-border p-2.5 pl-12 font-mono text-sm font-bold text-secondary focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setChangeNumberModal(false)}
                    className="flex-1 min-h-[44px] rounded-xl border border-border text-xs font-bold text-ink/70 hover:bg-sand"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const clean = mobileInput.replace(/\D/g, "");
                      if (clean.length === 10) {
                        setCustomer((prev) => (prev ? { ...prev, phone: clean } : { phone: clean, fullName: nameInput }));
                        if (typeof window !== "undefined") {
                          localStorage.setItem("stb_customer_phone", clean);
                        }
                        setChangeNumberModal(false);
                        const { syncCustomerAccountAction } = await import("@/app/actions/customer");
                        await syncCustomerAccountAction({ phone: clean, email: customer?.email || undefined });
                        submitScanAction(clean, merchant.id || "", merchant.minSpend, customer?.fullName || nameInput || "").then((res) => {
                          if (res.success) {
                            setVisitsCount((prev) => prev + 1);
                            setIsLockedToday(true);
                            setFeedbackMessage("✓ Stamp punched! Mobile linked to your pass.");
                          } else {
                            setFeedbackMessage(res.message);
                          }
                        });
                      }
                    }}
                    disabled={mobileInput.replace(/\D/g, "").length !== 10}
                    className="flex-1 min-h-[44px] rounded-xl bg-primary text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50"
                  >
                    Save &amp; Punch
                  </button>
                </div>
              </div>
            ) : (
              // Switch Account Modal (for logged-in customers with existing phone)
              <div className="text-center">
                <h3 className="font-display text-lg font-extrabold text-secondary">
                  Switch Account / Phone?
                </h3>
                <p className="mt-2 text-xs text-ink/70 leading-relaxed">
                  Currently signed in as <strong className="text-secondary">{customer.fullName || `+91 ${customer.phone}`}</strong>.
                  Switching will allow you to log in with a different pass.
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setChangeNumberModal(false)}
                    className="flex-1 min-h-[44px] rounded-xl border border-border text-xs font-bold text-ink/70 hover:bg-sand"
                  >
                    Keep Account
                  </button>
                  <button
                    type="button"
                    onClick={handleSwitchNumber}
                    className="flex-1 min-h-[44px] rounded-xl bg-primary text-xs font-bold text-white hover:bg-primary/90"
                  >
                    Log Out &amp; Switch
                  </button>
                </div>
              </div>
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

function targetMerchantCode(slug: string) {
  const clean = slug.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return clean.slice(0, 4) || "CARD";
}

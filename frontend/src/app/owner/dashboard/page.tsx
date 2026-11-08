"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";

const CounterQR = dynamic(() => import("@/components/CounterQR"), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full max-w-[330px] rounded-3xl bg-sand/40 animate-pulse border border-border" />
  ),
});
const ConfettiEffect = dynamic(() => import("@/components/ConfettiEffect"), {
  ssr: false,
});

import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { frontendEnv } from "@/lib/config/env";
import { useTerminalSocket } from "@/lib/ws/useTerminalSocket";
import { playApprovalBell, playScanChime } from "@/lib/audio";
import { decodeHtml } from "@/lib/utils/sanitize";
import {
  Store,
  Gift,
  QrCode,
  CheckCircle2,
  XCircle,
  Sliders,
  KeyRound,
  BellRing,
  ShieldCheck,
  RefreshCw,
  LogOut,
  ArrowRight,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SUBSCRIPTION_PLANS, calculatePlanPricing, SubscriptionPlanId } from "@/lib/pricing";

interface LivePendingScan {
  id: string;
  customerName: string;
  customerMasked: string;
  amount: number;
  formattedTime: string;
  status: string;
}

interface LedgerRecord {
  id: string;
  customerName: string;
  contactMasked: string;
  visitDate: string;
  billAmount: number;
  status: string;
  createdAt: string;
}

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { user, merchant: authMerchant, logout } = useAuth();
  const toast = useToast();

  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form Rule inputs
  const [shopNameInput, setShopNameInput] = useState("");
  const [minSpendInput, setMinSpendInput] = useState(100);
  const [visitsInput, setVisitsInput] = useState(10);
  const [rewardInput, setRewardInput] = useState("Free Masala Chai");
  const [validityInput, setValidityInput] = useState(45);
  const [ruleSaveMessage, setRuleSaveMessage] = useState<string | null>(null);
  const [isRotatingQr, setIsRotatingQr] = useState(false);

  // Live Queue & Ledger
  const [pendingQueue, setPendingQueue] = useState<LivePendingScan[]>([]);
  const [ledger, setLedger] = useState<LedgerRecord[]>([]);

  // 4-Digit Voucher PIN Verification
  const [pinInput, setPinInput] = useState("");
  const [pinCustomerPhone, setPinCustomerPhone] = useState("");
  const [pinFeedback, setPinFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [exitingCardIds, setExitingCardIds] = useState<string[]>([]);
  const processedVisitIdsRef = useRef<Set<string>>(new Set());
  const processedStatusMapRef = useRef<Map<string, string>>(new Map());
  const knownVisitIdsRef = useRef<Set<string>>(new Set());

  // Subscription State
  const [subStatus, setSubStatus] = useState<"ACTIVE" | "GRACE_PERIOD" | "INACTIVE">("ACTIVE");
  const [subDetails, setSubDetails] = useState<any>(null);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [renewPlan, setRenewPlan] = useState<SubscriptionPlanId>("YEARLY");
  const [renewPromo, setRenewPromo] = useState("");
  const [renewPromoApplied, setRenewPromoApplied] = useState<string | null>(null);
  const [renewPromoMsg, setRenewPromoMsg] = useState<string | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);

  const loadQueue = useCallback(async (merchantId: string) => {
    try {
      const res = await api.scans.pending(merchantId);
      if (res && res.visits) {
        const activePending = res.visits.filter(
          (v: any) => !processedVisitIdsRef.current.has(v.id)
        );
        setPendingQueue(
          activePending.map((v: any) => ({
            id: v.id,
            customerName: v.customer?.fullName || "Diner / Shopper",
            customerMasked: v.customer?.phone ? `+91 ${v.customer.phone.slice(0, 2)}***` : "Counter Scan",
            amount: Number(v.billAmount) || 100,
            formattedTime: v.createdAt
              ? new Date(v.createdAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  timeZone: "Asia/Kolkata",
                  hour12: true,
                })
              : "Just now",
            status: v.status,
          }))
        );
      }
    } catch {
      // silent queue load
    }
  }, []);

  const loadLedger = useCallback(async (merchantId: string) => {
    try {
      const res = await api.scans.ledger(merchantId);
      if (res && res.visits) {
        setLedger(
          res.visits.map((v: any) => ({
            id: v.id,
            customerName: v.customer?.fullName || "Customer",
            contactMasked: v.customer?.phone ? `+91 ${v.customer.phone.slice(0, 2)}***` : "Walk-in",
            visitDate: v.visitDateIst || "",
            billAmount: Number(v.billAmount) || 100,
            status: processedStatusMapRef.current.get(v.id) || v.status,
            createdAt: v.createdAt,
          }))
        );
      }
    } catch {
      // silent ledger load
    }
  }, []);

  // Real-time terminal socket connection
  const { wsStatus } = useTerminalSocket({
    merchantId: merchant?.id,
    onCheckInNew: () => {
      playScanChime();
      if (merchant?.id) loadQueue(merchant.id);
    },
    onCheckInApproved: (payload) => {
      if (payload?.visitId) {
        setPendingQueue((prev) => prev.filter((q) => q.id !== payload.visitId));
      }
      if (merchant?.id) loadLedger(merchant.id);
    },
    onCheckInRejected: (payload) => {
      if (payload?.visitId) {
        setPendingQueue((prev) => prev.filter((q) => q.id !== payload.visitId));
      }
      if (merchant?.id) loadLedger(merchant.id);
    },
    onRewardBurned: () => {
      if (merchant?.id) loadLedger(merchant.id);
    },
  });

  // Initial Load of Merchant
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const res = await api.merchants.me();
        if (!res || !res.merchant) {
          if (mounted) router.replace("/auth/owner/login");
          return;
        }

        const m = res.merchant;
        if (mounted) {
          setMerchant(m);
          setShopNameInput(m.name);
          setMinSpendInput(Number(m.minSpend) || 100);
          setVisitsInput(Number(m.visitsRequired) || 10);
          setRewardInput(m.rewardName);
          setValidityInput(Number(m.validityDays) || 45);

          // Check subscription status
          try {
            const subRes = await api.subscriptions.status(m.id);
            if (subRes) {
              setSubStatus(subRes.status as any);
              setSubDetails(subRes);
            }
          } catch {
            // fallback
          }

          loadQueue(m.id);
          loadLedger(m.id);
        }
      } catch (err) {
        console.error("Dashboard init error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [router, loadQueue, loadLedger]);

  // Periodic queue sync fallback
  useEffect(() => {
    if (!merchant?.id) return;
    const interval = setInterval(() => {
      loadQueue(merchant.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [merchant?.id, loadQueue]);

  // 1-Tap Actions
  const handleApprove = async (scanId: string) => {
    processedVisitIdsRef.current.add(scanId);
    processedStatusMapRef.current.set(scanId, "APPROVED");
    setActionLoadingId(scanId);
    playApprovalBell();

    setExitingCardIds((prev) => [...prev, scanId]);
    setTimeout(() => {
      setPendingQueue((prev) => prev.filter((q) => q.id !== scanId));
      setExitingCardIds((prev) => prev.filter((id) => id !== scanId));
      setActionLoadingId(null);
    }, 220);

    setLedger((prev) =>
      prev.map((row) => (row.id === scanId ? { ...row, status: "APPROVED" } : row))
    );

    try {
      await api.scans.approve(scanId);
      toast.success("Visit approved!");
    } catch (err) {
      console.error("Approve visit server error:", err);
    }

    if (merchant?.id) loadLedger(merchant.id);
  };

  const handleReject = async (scanId: string) => {
    processedVisitIdsRef.current.add(scanId);
    processedStatusMapRef.current.set(scanId, "REJECTED");
    setActionLoadingId(scanId);

    setExitingCardIds((prev) => [...prev, scanId]);
    setTimeout(() => {
      setPendingQueue((prev) => prev.filter((q) => q.id !== scanId));
      setExitingCardIds((prev) => prev.filter((id) => id !== scanId));
      setActionLoadingId(null);
    }, 220);

    setLedger((prev) =>
      prev.map((row) => (row.id === scanId ? { ...row, status: "REJECTED" } : row))
    );

    try {
      await api.scans.reject(scanId);
      toast.info("Visit rejected.");
    } catch (err) {
      console.error("Reject visit server error:", err);
    }

    if (merchant?.id) loadLedger(merchant.id);
  };

  const handleRotateQr = async () => {
    if (!merchant?.id) return;
    setIsRotatingQr(true);
    try {
      const res = await api.merchants.rotateQr(merchant.id);
      if (res.success && res.merchant) {
        setMerchant(res.merchant);
        toast.success("QR code rotated! Old links remain valid for 30 days.");
        setRuleSaveMessage("✓ QR Standee rotated for fresh cycle! Old QR code expired.");
        setTimeout(() => setRuleSaveMessage(null), 3500);
      } else {
        toast.error("Failed to rotate QR code.");
      }
    } catch {
      toast.error("Error rotating QR code.");
    } finally {
      setIsRotatingQr(false);
    }
  };

  // Rule Update
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant?.id) return;

    setRuleSaveMessage(null);
    try {
      const res = await api.merchants.updateRules({
        merchantId: merchant.id,
        name: shopNameInput,
        minSpend: Number(minSpendInput),
        visitsRequired: Number(visitsInput),
        rewardName: rewardInput,
        validityDays: Number(validityInput),
      });

      if (res.success) {
        setMerchant(res.merchant);
        setRuleSaveMessage("✓ Streak rules updated instantly across all customer passes!");
        toast.success("Rules saved successfully!");
        setTimeout(() => setRuleSaveMessage(null), 3500);
      } else {
        toast.error(res.message || "Failed to update rules.");
      }
    } catch {
      toast.error("Error saving rules.");
    }
  };

  // PIN Redemption
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant?.id || !pinInput) return;

    try {
      const res = await api.scans.redeem(merchant.id, pinInput, pinCustomerPhone);
      setPinFeedback(res);

      if (res.success) {
        setShowConfetti(true);
        setPinInput("");
        setPinCustomerPhone("");
        toast.success("Reward redeemed successfully!");
        if (merchant.id) loadLedger(merchant.id);
      } else {
        toast.error(res.message || "Invalid PIN or redemption failed.");
      }
    } catch (err: any) {
      setPinFeedback({ success: false, message: err.message || "Redemption error." });
    }
  };

  // Razorpay Script Loader
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if ((window as any).Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleApplyRenewPromo = async () => {
    if (!renewPromo.trim()) return;
    try {
      const res = await api.subscriptions.validatePromo(renewPromo.trim(), renewPlan);
      if (res.success && res.code) {
        setRenewPromoApplied(res.code);
        setRenewPromoMsg(`✓ ${res.description || res.message}`);
      } else {
        setRenewPromoApplied(null);
        setRenewPromoMsg(res.message || "Invalid code.");
      }
    } catch {
      setRenewPromoMsg("Error validating code.");
    }
  };

  const handleExecuteRenewal = async () => {
    if (!merchant?.id) return;
    setIsRenewing(true);
    setRenewError(null);

    try {
      const orderRes = await api.subscriptions.createOrder(renewPlan, renewPromoApplied || undefined);

      if (!orderRes.success) {
        setRenewError(orderRes.message || "Failed to create renewal order.");
        setIsRenewing(false);
        return;
      }

      if (orderRes.isFree) {
        const actRes = await api.subscriptions.activate({
          orderId: orderRes.orderId,
          planId: renewPlan,
          promoCode: renewPromoApplied || undefined,
        });

        if (actRes.success) {
          setSubStatus("ACTIVE");
          setRenewModalOpen(false);
          setShowConfetti(true);
          toast.success("Plan reactivated successfully!");
        } else {
          setRenewError(actRes.message || "Renewal activation failed.");
        }
        setIsRenewing(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setRenewError("Failed to load Razorpay payment gateway.");
        setIsRenewing(false);
        return;
      }

      const options = {
        key: orderRes.keyId || frontendEnv.RAZORPAY_KEY_ID,
        amount: orderRes.amountPaise,
        currency: "INR",
        name: "StickTheBizz",
        description: `Renew ${SUBSCRIPTION_PLANS[renewPlan].name}`,
        image: "/icon.png",
        order_id: orderRes.orderId,
        prefill: {
          name: user?.fullName || "Owner",
          email: user?.email || "",
          contact: merchant.mobile || "",
        },
        theme: { color: "#E05A47" },
        handler: async (resp: any) => {
          const actRes = await api.subscriptions.activate({
            orderId: resp.razorpay_order_id,
            paymentId: resp.razorpay_payment_id,
            signature: resp.razorpay_signature,
            planId: renewPlan,
            promoCode: renewPromoApplied || undefined,
          });

          if (actRes.success) {
            setSubStatus("ACTIVE");
            setRenewModalOpen(false);
            setShowConfetti(true);
            toast.success("Plan renewed successfully!");
          } else {
            setRenewError(actRes.message || "Renewal failed.");
          }
          setIsRenewing(false);
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", () => {
        setRenewError("Payment cancelled or failed.");
        setIsRenewing(false);
      });
      rzp.open();
    } catch (err: any) {
      setRenewError(err.message || "Unexpected error during renewal.");
      setIsRenewing(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.push("/auth/owner/login");
  };

  const scanUrl = `https://stickthebizz.in/s/${merchant?.slug || "kesar-chai"}`;

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-sand">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="font-display text-lg font-extrabold text-secondary">
              Connecting to Counter Terminal...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Subscription Inactive Lockdown Screen
  if (subStatus === "INACTIVE") {
    const renewPricing = calculatePlanPricing(renewPlan, renewPromoApplied || undefined);

    return (
      <div className="flex min-h-screen flex-col bg-sand">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-xl rounded-[2.5rem] border-2 border-red-200 bg-white p-8 sm:p-10 shadow-float text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-red-100 text-red-600">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <span className="inline-flex items-center rounded-full bg-red-50 border border-red-200 px-3 py-1 font-mono text-xs font-bold text-red-700">
              SUBSCRIPTION INACTIVE • GRACE PERIOD EXPIRED
            </span>
            <h1 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold text-secondary">
              Counter Terminal Deactivated
            </h1>
            <p className="mt-2 text-xs text-ink/75 leading-relaxed">
              Your subscription for <strong className="text-secondary">{merchant.name}</strong> has expired and the 24-hour grace window has ended. Your counter QR standee is paused and diners/shoppers cannot claim stamps until renewed.
            </p>

            {renewError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {renewError}
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3 text-left">
              <button
                type="button"
                onClick={() => setRenewPlan("MONTHLY")}
                className={`rounded-2xl p-4 border-2 transition ${
                  renewPlan === "MONTHLY" ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-white"
                }`}
              >
                <span className="block font-mono text-[10px] font-bold uppercase text-ink/60">Monthly Plan</span>
                <span className="font-display text-xl font-extrabold text-secondary">₹749</span>
                <span className="text-[11px] text-ink/60 block">30 days access</span>
              </button>

              <button
                type="button"
                onClick={() => setRenewPlan("YEARLY")}
                className={`rounded-2xl p-4 border-2 transition relative ${
                  renewPlan === "YEARLY" ? "border-primary bg-secondary text-white shadow-sm" : "border-border bg-white"
                }`}
              >
                <span className="absolute top-1 right-2 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
                  20% OFF
                </span>
                <span className={`block font-mono text-[10px] font-bold uppercase ${renewPlan === "YEARLY" ? "text-coral" : "text-primary"}`}>Annual Plan</span>
                <span className="font-display text-xl font-extrabold">₹7,190</span>
                <span className={`text-[11px] block ${renewPlan === "YEARLY" ? "text-white/70" : "text-ink/60"}`}>Save ₹1,798</span>
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={renewPromo}
                onChange={(e) => setRenewPromo(e.target.value.toUpperCase())}
                placeholder="Partner / Promo Code"
                className="flex-1 rounded-xl border border-border bg-sand/30 px-3 py-2 text-xs font-mono font-bold uppercase outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleApplyRenewPromo}
                className="rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-white hover:bg-primary"
              >
                Apply
              </button>
            </div>

            {renewPromoMsg && (
              <p className="mt-1 text-[11px] font-semibold text-emerald-700 text-left">
                {renewPromoMsg}
              </p>
            )}

            <button
              type="button"
              disabled={isRenewing}
              onClick={handleExecuteRenewal}
              className="mt-6 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-card transition hover:bg-primary/90 disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" />
              <span>
                {isRenewing
                  ? "Processing..."
                  : renewPricing.isFreeActivation
                  ? "✓ Reactivate Counter Free (₹0 Code Applied)"
                  : `Pay ₹${renewPricing.finalAmount.toLocaleString("en-IN")} via Razorpay & Reactivate`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="mt-4 text-xs font-bold text-ink/60 hover:text-secondary"
            >
              Log Out of Account
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="flex min-h-screen flex-col bg-sand">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-lg rounded-[2.5rem] border border-border bg-white p-8 sm:p-10 shadow-float text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Store className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-extrabold text-secondary">
              Set Up Your Shop Counter
            </h1>
            <p className="mt-2 text-xs text-ink/70 leading-relaxed">
              We couldn&apos;t find an active counter linked to your account yet. Please register your shop counter first.
            </p>
            <div className="mt-6">
              <Link
                href="/auth/owner/register"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-primary px-7 text-xs font-bold text-white shadow-sm transition hover:bg-primary/90"
              >
                <span>Register Shop Counter</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-sand overflow-x-hidden">
      <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <Navbar />

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* GRACE PERIOD URGENT WARNING BANNER */}
          {subStatus === "GRACE_PERIOD" && (
            <div className="mb-6 rounded-3xl border-2 border-amber-300 bg-amber-50 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-200 text-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-extrabold text-amber-950 uppercase tracking-wider">
                    ⚠️ Subscription Expired — 1-Day Grace Period Active!
                  </h3>
                  <p className="mt-0.5 text-xs text-amber-800">
                    Your counter QR standee and terminal will be permanently deactivated in <strong>{subDetails?.hoursRemaining || 24} hours</strong> unless renewed.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRenewModalOpen(true)}
                className="shrink-0 inline-flex min-h-[42px] items-center gap-1.5 rounded-full bg-primary px-5 text-xs font-bold text-white shadow-sm hover:bg-primary/90"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Renew Counter Plan</span>
              </button>
            </div>
          )}

          {/* Top Title Banner & Profile Card */}
          <div className="rounded-3xl bg-white p-6 sm:p-8 border border-border shadow-card mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border/80">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 font-mono text-xs font-bold text-secondary">
                  <Store className="h-3.5 w-3.5 text-primary" />
                  MERCHANT COUNTER DESK
                </div>
                <h1 className="mt-2 font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-secondary">
                  {decodeHtml(merchant?.name || "My Counter")}
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-ink/75">
                  Category: <strong className="text-secondary">{decodeHtml(merchant?.category || "Retail")}</strong> • Counter Pass:{" "}
                  <a
                    href={scanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-bold text-primary underline"
                  >
                    stickthebizz.in/s/{merchant?.slug}
                  </a>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold border shadow-xs ${
                  wsStatus === "ONLINE"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : wsStatus === "RECONNECTING"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-gray-100 text-gray-700 border-gray-300"
                }`}>
                  <span className={`h-2 w-2 rounded-full ${
                    wsStatus === "ONLINE"
                      ? "bg-emerald-500 animate-pulse"
                      : wsStatus === "RECONNECTING"
                      ? "bg-amber-500 animate-ping"
                      : "bg-gray-400"
                  }`} />
                  {wsStatus === "ONLINE"
                    ? "🟢 Terminal Online"
                    : wsStatus === "RECONNECTING"
                    ? "🔴 Reconnecting..."
                    : "⚪ Offline"}
                </span>

                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold border ${
                  subStatus === "ACTIVE"
                    ? "bg-sand text-secondary border-border"
                    : "bg-amber-100 text-amber-800 border-amber-300"
                }`}>
                  <CreditCard className="h-3 w-3 text-primary" />
                  <span>
                    {subStatus === "GRACE_PERIOD"
                      ? "Grace Period (1 Day Left)"
                      : subDetails?.daysRemaining
                      ? `${subDetails.daysRemaining} Days Left`
                      : "Plan Active"}
                  </span>
                </span>

                <Link
                  href="/owner/profile"
                  className="inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary px-4 py-2 text-xs font-bold text-white shadow-brand-sm hover:bg-secondary/90 transition active:scale-95"
                >
                  <Store className="h-3.5 w-3.5 text-amber-300" />
                  <span>Store Profile &amp; Plan →</span>
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-sand/40 px-4 py-2 text-xs font-bold text-ink/75 hover:text-secondary hover:bg-sand shadow-sm"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>

            {/* Quick Profile & Counter Stats Strip */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="rounded-2xl bg-sand/30 p-3.5 border border-border/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink/50">Store PIN</span>
                <p className="mt-0.5 font-mono text-base font-extrabold text-secondary">{merchant?.redemptionPin || "••••"}</p>
              </div>
              <div className="rounded-2xl bg-sand/30 p-3.5 border border-border/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink/50">Minimum Bill</span>
                <p className="mt-0.5 font-mono text-base font-extrabold text-secondary">₹{merchant?.minSpend || 100}</p>
              </div>
              <div className="rounded-2xl bg-sand/30 p-3.5 border border-border/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink/50">Streak Reward</span>
                <p className="mt-0.5 font-display text-sm font-extrabold text-secondary truncate">{merchant?.rewardName || "Special Item"}</p>
              </div>
              <div className="rounded-2xl bg-sand/30 p-3.5 border border-border/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink/50">Visits Required</span>
                <p className="mt-0.5 font-mono text-base font-extrabold text-secondary">{merchant?.visitsRequired || 10} Visits</p>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN LAYOUT: LIVE QUEUE (Left 7 cols) & PIN REDEMPTION (Right 5 cols) */}
          <div className="mt-8 grid gap-8 lg:grid-cols-12">
            {/* 1. LIVE PENDING CHECK-IN STREAM */}
            <div className="rounded-[2.2rem] border-2 border-secondary bg-secondary p-6 text-white shadow-card sm:p-8 lg:col-span-7">
              <div className="flex items-center justify-between border-b border-white/15 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-primary">
                    <BellRing className="h-5 w-5 animate-bell-ring" />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-white">
                      Live Customer Check-In Queue
                    </h2>
                    <p className="text-xs text-white/70">
                      Real-time audio chime stream from counter QR scans.
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold rounded-full bg-primary px-3 py-1 text-white">
                  {pendingQueue.length} Pending
                </span>
              </div>

              {/* Approval Cards Stream */}
              <div className="mt-6 space-y-3">
                {pendingQueue.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-white/75">
                    <p className="font-semibold text-sm">
                      No pending scans right now. Waiting for customers...
                    </p>
                    <p className="mt-1 text-xs text-white/55">
                      When a customer scans your counter QR stand, their 1-tap check-in will ding here with a gentle acoustic chime.
                    </p>
                  </div>
                ) : (
                  pendingQueue.map((item) => {
                    const isExiting = exitingCardIds.includes(item.id);
                    const isBusy = actionLoadingId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-4 text-ink shadow-sm transition-all duration-200 ease-out will-change-[opacity,transform] ${
                          isExiting
                            ? "opacity-0 -translate-y-2 scale-95 pointer-events-none"
                            : "opacity-100 translate-y-0 scale-100"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display text-sm font-extrabold text-secondary">
                              {item.customerName}
                            </span>
                            <span className="font-mono text-xs font-semibold text-ink/60">
                              {item.customerMasked}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="rounded bg-sand px-2 py-0.5 font-mono text-xs font-bold text-ink/80">
                              Bill ₹{item.amount}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                              🕒 {item.formattedTime} IST
                            </span>
                            <span className="text-[11px] text-ink/50">
                              • Counter Camera Scan
                            </span>
                          </div>
                        </div>

                        {/* Large Touch Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isBusy || isExiting}
                            onClick={() => handleApprove(item.id)}
                            className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-success px-4 text-xs font-bold text-white shadow-sm transition hover:opacity-90 active:scale-95 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{isBusy ? "Approving..." : "1-Tap Approve"}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy || isExiting}
                            onClick={() => handleReject(item.id)}
                            className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-white active:scale-95 disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 2. PIN REDEMPTION TERMINAL */}
            <div className="rounded-[2.2rem] border border-border bg-white p-6 shadow-card sm:p-8 lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 border-b border-border/70 pb-4">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-sand text-secondary">
                    <KeyRound className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-secondary">
                      Voucher PIN Redemption
                    </h2>
                    <p className="text-xs text-ink/65">
                      Verify customer&apos;s 4-digit code to release reward.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleVerifyPin} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                      Enter Store Cashier PIN (4-Digits)
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••"
                      className="mt-2 w-full text-center font-mono text-3xl font-extrabold tracking-widest rounded-xl border border-border p-3 text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                    />
                    <p className="mt-1 text-center font-mono text-[11px] text-ink/50">
                      Authorizes voucher burn on merchant ledger
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                      Customer Phone Number (+91)
                    </label>
                    <input
                      type="tel"
                      value={pinCustomerPhone}
                      onChange={(e) => setPinCustomerPhone(e.target.value)}
                      placeholder="e.g. 9820012345"
                      className="mt-1.5 w-full rounded-xl border border-border p-2.5 text-xs font-mono font-semibold text-secondary focus:border-primary focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-white shadow-sm transition hover:bg-primary/90 active:scale-95"
                  >
                    <Gift className="h-4 w-4" />
                    <span>Validate PIN &amp; Mark Redeemed</span>
                  </button>
                </form>

                {pinFeedback && (
                  <div
                    className={`mt-4 rounded-xl p-3.5 text-xs font-bold text-center border ${
                      pinFeedback.success
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-coral/10 text-primary border-primary/30"
                    }`}
                  >
                    {pinFeedback.message}
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-2xl bg-sand/60 p-4 border border-border/80">
                <span className="text-[11px] font-bold text-secondary flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Anti-Theft Protocol Active
                </span>
                <p className="mt-1 text-[11px] text-ink/65 leading-relaxed">
                  Only give rewards when the screen shows &ldquo;Voucher Verified&rdquo;. Prevents unauthorized claims.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: COUNTER QR ARTWORK STUDIO & STREAK CONFIGURATION */}
          <div className="mt-10 grid gap-8 lg:grid-cols-12 items-start">
            {/* STANDEE QR CODE STUDIO (Left 5 cols) */}
            <div className="rounded-[2.5rem] border border-border bg-white p-6 sm:p-8 shadow-card lg:col-span-5">
              <div className="flex items-center justify-between border-b border-border/70 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-sand text-secondary">
                    <QrCode className="h-5 w-5 text-primary" />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-secondary">
                      Counter QR Standee
                    </h2>
                    <p className="text-xs text-ink/65">
                      Printable 5x7 acrylic standee artwork.
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Standee Preview */}
              <div className="mt-6 flex flex-col items-center">
                <CounterQR
                  shopName={merchant?.name || shopNameInput}
                  slug={merchant?.slug || "kesar-chai"}
                  minSpend={Number(minSpendInput)}
                  visitsRequired={Number(visitsInput)}
                  rewardName={rewardInput}
                  validityDays={Number(validityInput)}
                  qrToken={merchant?.qrToken}
                  onRotateQr={handleRotateQr}
                  isRotating={isRotatingQr}
                />
              </div>
            </div>

            {/* STREAK RULE CONFIGURATION STUDIO (Right 7 cols) */}
            <div className="rounded-[2.5rem] border border-border bg-white p-6 sm:p-8 shadow-card lg:col-span-7">
              <div className="flex items-center gap-2.5 border-b border-border/70 pb-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-sand text-secondary">
                  <Sliders className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-extrabold text-secondary">
                    Streak Rule Configuration
                  </h2>
                  <p className="text-xs text-ink/65">
                    Customize your spend thresholds and reward rules.
                  </p>
                </div>
              </div>

              {ruleSaveMessage && (
                <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-xs font-bold text-emerald-800 text-center">
                  {ruleSaveMessage}
                </div>
              )}

              <form onSubmit={handleSaveRule} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Store Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={shopNameInput}
                    onChange={(e) => setShopNameInput(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border p-3 text-sm font-semibold text-secondary focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                      Minimum Bill per Scan (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={minSpendInput}
                      onChange={(e) => setMinSpendInput(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-border p-3 font-mono text-sm font-semibold text-secondary focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                      Visits Needed for Reward
                    </label>
                    <input
                      type="number"
                      required
                      min={3}
                      max={30}
                      value={visitsInput}
                      onChange={(e) => setVisitsInput(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-border p-3 font-mono text-sm font-semibold text-secondary focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Customer Reward Description
                  </label>
                  <input
                    type="text"
                    required
                    value={rewardInput}
                    onChange={(e) => setRewardInput(e.target.value)}
                    placeholder="e.g. Free 1L Mustard Oil Pouch"
                    className="mt-1.5 w-full rounded-xl border border-border p-3 text-sm font-semibold text-secondary focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Streak Expiry Period (Days)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={validityInput}
                    onChange={(e) => setValidityInput(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-border p-3 font-mono text-sm font-semibold text-secondary focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90"
                  >
                    <span>Save &amp; Update Customer Passes</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* SECTION 3: VISIT HISTORY & ANALYTICS LEDGER */}
          <div className="mt-12">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-secondary">
                  Customer Visit Ledger
                </h2>
                <p className="text-xs text-ink/65">
                  Verified check-in timestamps, customer contacts &amp; audit history.
                </p>
              </div>
              <span className="font-mono text-xs font-bold rounded-full bg-white px-3 py-1 text-secondary border border-border">
                {ledger.length} Recent Scans
              </span>
            </div>

            <div className="mt-6 rounded-3xl border border-border bg-white overflow-hidden shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-ink/80">
                  <thead className="border-b border-border bg-sand/40 text-[11px] font-bold uppercase tracking-wider text-secondary">
                    <tr>
                      <th className="px-6 py-4">Customer Name</th>
                      <th className="px-6 py-4">Masked Contact</th>
                      <th className="px-6 py-4">Date (IST)</th>
                      <th className="px-6 py-4">Time (IST)</th>
                      <th className="px-6 py-4">Bill Amount</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-semibold">
                    {ledger.length > 0 ? (
                      ledger.map((row) => {
                        const scanTime = row.createdAt
                          ? new Date(row.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              timeZone: "Asia/Kolkata",
                              hour12: true,
                            })
                          : "--";
                        return (
                          <tr key={row.id} className="hover:bg-sand/20 transition-colors">
                            <td className="px-6 py-4 font-display font-bold text-secondary">
                              {row.customerName}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-ink/70">
                              {row.contactMasked}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-ink/70">
                              {row.visitDate}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-primary font-semibold">
                              {scanTime}
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-secondary">
                              ₹{row.billAmount}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${
                                  row.status === "APPROVED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : row.status === "REDEEMED"
                                    ? "bg-secondary text-white"
                                    : row.status === "PENDING"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-coral/15 text-primary"
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-xs text-ink/50">
                          No customer scans recorded yet today. Customers will appear here when they scan your standee!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


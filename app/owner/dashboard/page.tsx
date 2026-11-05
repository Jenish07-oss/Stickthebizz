"use client";

import React, { useState, useEffect, useRef } from "react";
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
const LiveActivityToast = dynamic(() => import("@/components/LiveActivityToast"), {
  ssr: false,
});
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import {
  approveVisit,
  rejectVisit,
  verifyRedemptionPin,
  getPendingVisits,
  getMerchantLedger,
} from "@/app/actions/scan";
import { getOwnerMerchant, updateMerchantRuleAction, rotateMerchantQrAction, registerMerchantAction } from "@/app/actions/merchant";
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
  Printer,
  ShieldCheck,
  RefreshCw,
  LogOut,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  checkMerchantSubscriptionStatusAction,
  createSubscriptionOrderAction,
  verifyAndActivateSubscriptionAction,
  validatePromoCodeAction,
} from "@/app/actions/subscription";
import { SUBSCRIPTION_PLANS, calculatePlanPricing, SubscriptionPlanId } from "@/lib/razorpay";
import { AlertTriangle, Tag, CreditCard } from "lucide-react";

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
  const supabase = createClient();
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

  // Live WebSocket Queue
  const [pendingQueue, setPendingQueue] = useState<LivePendingScan[]>([]);
  const [ledger, setLedger] = useState<LedgerRecord[]>([]);

  // 4-Digit Voucher PIN Verification
  const [pinInput, setPinInput] = useState("");
  const [pinCustomerPhone, setPinCustomerPhone] = useState("");
  const [pinFeedback, setPinFeedback] = useState<{ success: boolean; message: string } | null>(
    null
  );
  const [showConfetti, setShowConfetti] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [exitingCardIds, setExitingCardIds] = useState<string[]>([]);
  const processedVisitIdsRef = useRef<Set<string>>(new Set());
  const processedStatusMapRef = useRef<Map<string, string>>(new Map());
  const knownVisitIdsRef = useRef<Set<string>>(new Set());
  const [isCreatingShop, setIsCreatingShop] = useState(false);
  const [newShopName, setNewShopName] = useState("");
  const [newShopCategory, setNewShopCategory] = useState("Cafe / Chai");

  // Subscription & 1-Day Grace Period State
  const [subStatus, setSubStatus] = useState<"ACTIVE" | "GRACE_PERIOD" | "INACTIVE">("ACTIVE");
  const [subDetails, setSubDetails] = useState<any>(null);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [renewPlan, setRenewPlan] = useState<SubscriptionPlanId>("YEARLY");
  const [renewPromo, setRenewPromo] = useState("");
  const [renewPromoApplied, setRenewPromoApplied] = useState<string | null>(null);
  const [renewPromoMsg, setRenewPromoMsg] = useState<string | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim()) return;
    setIsCreatingShop(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await registerMerchantAction({
        name: newShopName.trim(),
        category: newShopCategory,
        ownerId: user?.id,
      });
      if (res.success && res.merchant) {
        setMerchant(res.merchant);
        setShopNameInput(res.merchant.name);
        setMinSpendInput(Number(res.merchant.min_spend) || 100);
        setVisitsInput(Number(res.merchant.visits_required) || 10);
        setRewardInput(res.merchant.reward_name);
        setValidityInput(Number(res.merchant.validity_days) || 45);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingShop(false);
    }
  };

  // 1. Initial Load of Merchant and Historical Ledger (Direct client-first + server fallback with timeout safeguard)
  useEffect(() => {
    let mounted = true;
    const timeoutTimer = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 4000);

    async function init() {
      try {
        // Direct browser session check
        const { data: { user: clientUser } } = await supabase.auth.getUser();

        let activeUser = clientUser;
        let m: any = null;

        if (activeUser) {
          // Direct client query to merchants table (fetch latest shop to prevent multi-row errors)
          const { data: merchantData } = await supabase
            .from("merchants")
            .select("*")
            .eq("owner_id", activeUser.id)
            .order("created_at", { ascending: false })
            .limit(1);

          if (merchantData && merchantData.length > 0) {
            m = merchantData[0];
          }
        }

        // Server action fallback
        if (!m) {
          const res = await getOwnerMerchant();
          if (res?.user) activeUser = res.user;
          if (res?.merchant) m = res.merchant;
          if (res?.needsSetup) {
            if (mounted) {
              setMerchant(null);
              setLoading(false);
            }
            return;
          }
        }

        if (!activeUser) {
          if (mounted) router.replace("/auth/owner/login");
          return;
        }

        if (!m) {
          if (mounted) {
            setMerchant(null);
            setLoading(false);
          }
          return;
        }

        if (m && mounted) {
          setMerchant(m);
          setShopNameInput(m.name);
          setMinSpendInput(Number(m.min_spend) || 100);
          setVisitsInput(Number(m.visits_required) || 10);
          setRewardInput(m.reward_name);
          setValidityInput(Number(m.validity_days) || 45);

          // Fetch pending visits
          const { visits: pending } = await getPendingVisits(m.id);
          if (mounted) {
            const initialQueue: LivePendingScan[] = (pending || []).map((v: any) => {
              knownVisitIdsRef.current.add(v.id);
              return {
                id: v.id,
                customerName: v.customers?.full_name || "Diner / Shopper",
                customerMasked: v.customers?.phone || "Customer Check-in",
                amount: Number(v.bill_amount) || m.min_spend,
                formattedTime: "Just now",
                status: processedStatusMapRef.current.get(v.id) || v.status,
              };
            });
            setPendingQueue(initialQueue);
          }

          // Check Subscription & 1-Day Grace Period
          const subCheck = await checkMerchantSubscriptionStatusAction(m.id);
          if (mounted) {
            setSubStatus(subCheck.status as any);
            setSubDetails(subCheck);
          }

          // Fetch ledger
          const { visits: leg } = await getMerchantLedger(m.id);
          if (mounted) {
            const initialLedger: LedgerRecord[] = (leg || []).map((v: any) => {
              const raw = v.customers?.phone || "";
              const msk =
                raw.length >= 10
                  ? `+91 ${raw.slice(0, 2)}*** **${raw.slice(-2)}`
                  : "Walk-in";
              return {
                id: v.id,
                customerName: v.customers?.full_name || "Customer",
                contactMasked: msk,
                visitDate: v.visit_date_ist,
                billAmount: Number(v.bill_amount) || m.min_spend,
                status: processedStatusMapRef.current.get(v.id) || v.status,
                createdAt: v.created_at,
              };
            });
            setLedger(initialLedger);
          }
        }
      } catch (err) {
        console.error("Dashboard init error:", err);
      } finally {
        clearTimeout(timeoutTimer);
        if (mounted) {
          setLoading(false);
        }
      }
    }
    init();

    return () => {
      mounted = false;
      clearTimeout(timeoutTimer);
    };
  }, []);

  // 2. Realtime WebSocket Subscription to 'visits'
  useEffect(() => {
    if (!merchant?.id) return;

    const channel = supabase
      .channel(`merchant:${merchant.id}`)
      .on("broadcast", { event: "new_scan" }, async () => {
        playApprovalBell();
        const { visits: freshPending } = await getPendingVisits(merchant.id);
        if (freshPending) {
          const activePending = freshPending.filter(
            (item: any) => !processedVisitIdsRef.current.has(item.id)
          );
          const updatedQueue: LivePendingScan[] = activePending.map((item: any) => ({
            id: item.id,
            customerName: item.customers?.full_name || "Customer Check-in",
            customerMasked: item.customers?.phone || "Customer Check-in",
            amount: Number(item.bill_amount) || merchant.min_spend,
            formattedTime: "Just now",
            status: item.status,
          }));
          setPendingQueue(updatedQueue);
        }
      })
      .on("broadcast", { event: "queue_updated" }, async (payload: any) => {
        const visitId = payload?.payload?.visitId;
        if (visitId) {
          setPendingQueue((prev) => prev.filter((q) => q.id !== visitId));
        }
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "visits",
          filter: `merchant_id=eq.${merchant.id}`,
        },
        async (payload) => {
          const v = payload.new;
          if (v.status === "PENDING" && !processedVisitIdsRef.current.has(v.id)) {
            playApprovalBell();
            const { visits: freshPending } = await getPendingVisits(merchant.id);
            if (freshPending) {
              const activePending = freshPending.filter(
                (item: any) => !processedVisitIdsRef.current.has(item.id)
              );
              const updatedQueue: LivePendingScan[] = activePending.map((item: any) => ({
                id: item.id,
                customerName: item.customers?.full_name || "Customer Check-in",
                customerMasked: item.customers?.phone || "Customer Check-in",
                amount: Number(item.bill_amount) || merchant.min_spend,
                formattedTime: "Just now",
                status: item.status,
              }));
              setPendingQueue(updatedQueue);
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "visits",
          filter: `merchant_id=eq.${merchant.id}`,
        },
        (payload) => {
          const updated = payload.new;
          if (updated.status !== "PENDING") {
            setPendingQueue((prev) => prev.filter((q) => q.id !== updated.id));
          }
        }
      )
      .subscribe();

    // 3. Resilient Polling Fallback (Polls pending queue every 3.5 seconds)
    // Guarantees real-time check-in stream updates even if WebSocket drops or publication is delayed
    const pollTimer = setInterval(async () => {
      try {
        const { visits: freshPending } = await getPendingVisits(merchant.id);
        if (freshPending) {
          // Exclude visits that were already approved or rejected in this session
          const activePending = freshPending.filter(
            (item: any) => !processedVisitIdsRef.current.has(item.id)
          );

          const updatedQueue: LivePendingScan[] = activePending.map((item: any) => ({
            id: item.id,
            customerName: item.customers?.full_name || "Customer Check-in",
            customerMasked: item.customers?.phone || "Customer Check-in",
            amount: Number(item.bill_amount) || merchant.min_spend,
            formattedTime: "Just now",
            status: item.status,
          }));

          // Only play gentle chime for genuinely new visits
          let hasNewVisits = false;
          updatedQueue.forEach((v) => {
            if (!knownVisitIdsRef.current.has(v.id)) {
              knownVisitIdsRef.current.add(v.id);
              hasNewVisits = true;
            }
          });

          if (hasNewVisits) {
            playScanChime();
          }

          setPendingQueue((prev) => {
            const prevIds = prev.map((p) => p.id).join(",");
            const newIds = updatedQueue.map((p) => p.id).join(",");
            if (prevIds !== newIds) {
              return updatedQueue;
            }
            return prev;
          });
        }
      } catch (pollErr) {
        // silent polling catch
      }
    }, 3500);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollTimer);
    };
  }, [merchant?.id, merchant?.min_spend, supabase]);

  // 1-Tap Actions (Immediate optimistic feedback + zero flicker)
  const handleApprove = async (scanId: string) => {
    // 1. Mark as processed immediately so polling NEVER re-adds it
    processedVisitIdsRef.current.add(scanId);
    processedStatusMapRef.current.set(scanId, "APPROVED");
    setActionLoadingId(scanId);
    playApprovalBell();

    // 2. Smooth hardware-accelerated exit animation
    setExitingCardIds((prev) => [...prev, scanId]);
    setTimeout(() => {
      setPendingQueue((prev) => prev.filter((q) => q.id !== scanId));
      setExitingCardIds((prev) => prev.filter((id) => id !== scanId));
      setActionLoadingId(null);
    }, 220);

    // 3. Immediately update ledger row so it doesn't show PENDING
    setLedger((prev) =>
      prev.map((row) => (row.id === scanId ? { ...row, status: "APPROVED" } : row))
    );

    // 4. Server call to finalize approval
    try {
      await approveVisit(scanId);
    } catch (err) {
      console.error("Approve visit server error:", err);
    }

    // 5. Silent refresh of full ledger
    if (merchant?.id) {
      try {
        const { visits: leg } = await getMerchantLedger(merchant.id);
        if (leg && leg.length > 0) {
          setLedger(
            leg.map((v: any) => ({
              id: v.id,
              customerName: v.customers?.full_name || "Customer",
              contactMasked: v.customers?.phone ? `+91 ${v.customers.phone.slice(0, 2)}***` : "Walk-in",
              visitDate: v.visit_date_ist,
              billAmount: Number(v.bill_amount) || merchant.min_spend,
              status: processedStatusMapRef.current.get(v.id) || v.status,
              createdAt: v.created_at,
            }))
          );
        }
      } catch {
        // silent sync fallback
      }
    }
  };

  const handleReject = async (scanId: string) => {
    // 1. Mark as processed immediately so polling NEVER re-adds it
    processedVisitIdsRef.current.add(scanId);
    processedStatusMapRef.current.set(scanId, "REJECTED");
    setActionLoadingId(scanId);

    // 2. Smooth hardware-accelerated exit animation
    setExitingCardIds((prev) => [...prev, scanId]);
    setTimeout(() => {
      setPendingQueue((prev) => prev.filter((q) => q.id !== scanId));
      setExitingCardIds((prev) => prev.filter((id) => id !== scanId));
      setActionLoadingId(null);
    }, 220);

    // 3. Immediately update ledger row to REJECTED so it doesn't show PENDING
    setLedger((prev) =>
      prev.map((row) => (row.id === scanId ? { ...row, status: "REJECTED" } : row))
    );

    // 4. Server call to finalize reject
    try {
      await rejectVisit(scanId);
    } catch (err) {
      console.error("Reject visit server error:", err);
    }

    // 5. Silent refresh of full ledger
    if (merchant?.id) {
      try {
        const { visits: leg } = await getMerchantLedger(merchant.id);
        if (leg && leg.length > 0) {
          setLedger(
            leg.map((v: any) => ({
              id: v.id,
              customerName: v.customers?.full_name || "Customer",
              contactMasked: v.customers?.phone ? `+91 ${v.customers.phone.slice(0, 2)}***` : "Walk-in",
              visitDate: v.visit_date_ist,
              billAmount: Number(v.bill_amount) || merchant.min_spend,
              status: processedStatusMapRef.current.get(v.id) || v.status,
              createdAt: v.created_at,
            }))
          );
        }
      } catch {
        // silent sync fallback
      }
    }
  };

  const handleRotateQr = async () => {
    if (!merchant?.id) return;
    setIsRotatingQr(true);
    const res = await rotateMerchantQrAction(merchant.id);
    if (res.success && res.merchant) {
      setMerchant(res.merchant);
      toast.success("QR code rotated! Old links work for 30 days.");
      setRuleSaveMessage("✓ QR Standee rotated for fresh 30-day cycle! Old QR code expired.");
      setTimeout(() => setRuleSaveMessage(null), 3500);
    } else {
      toast.error("Failed to rotate QR code.");
    }
    setIsRotatingQr(false);
  };

  // Rule Update
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant?.id) return;

    setRuleSaveMessage(null);
    const res = await updateMerchantRuleAction({
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
      setTimeout(() => setRuleSaveMessage(null), 3500);
    }
  };

  // PIN Redemption
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant?.id || !pinInput) return;

    const res = await verifyRedemptionPin(merchant.id, pinInput, pinCustomerPhone);
    setPinFeedback(res);

    if (res.success) {
      setShowConfetti(true);
      setPinInput("");
      setPinCustomerPhone("");
    }
  };


  // Load Razorpay Script for Renewal
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
      const res = await validatePromoCodeAction({
        code: renewPromo.trim(),
        planId: renewPlan,
      });
      if (res.success && res.code) {
        setRenewPromoApplied(res.code);
        setRenewPromoMsg(`✓ ${res.description}`);
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
      const { data: { user } } = await supabase.auth.getUser();
      const orderRes = await createSubscriptionOrderAction({
        planId: renewPlan,
        promoCode: renewPromoApplied || undefined,
        shopName: merchant.name,
        email: user?.email || "",
        mobile: user?.phone || user?.user_metadata?.phone || "9999999999",
      });

      if (!orderRes.success) {
        setRenewError(orderRes.message || "Failed to create renewal order.");
        setIsRenewing(false);
        return;
      }

      if (orderRes.isFree) {
        const actRes = await verifyAndActivateSubscriptionAction({
          orderId: orderRes.orderId,
          planId: renewPlan,
          promoCode: renewPromoApplied || undefined,
          shopName: merchant.name,
          ownerName: user?.user_metadata?.full_name || "Owner",
          category: merchant.category || "Cafe / Chai",
          mobile: user?.phone || "9999999999",
          email: user?.email || "",
          ownerId: user?.id,
        });

        if (actRes.success) {
          setSubStatus("ACTIVE");
          setRenewModalOpen(false);
          setShowConfetti(true);
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
        key: orderRes.keyId,
        amount: orderRes.amountPaise,
        currency: "INR",
        name: "StickTheBizz",
        description: `Renew ${SUBSCRIPTION_PLANS[renewPlan].name}`,
        image: "/icon.png",
        order_id: orderRes.orderId,
        prefill: {
          name: user?.user_metadata?.full_name || "Owner",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: { color: "#E05A47" },
        handler: async (resp: any) => {
          const actRes = await verifyAndActivateSubscriptionAction({
            orderId: resp.razorpay_order_id,
            paymentId: resp.razorpay_payment_id,
            signature: resp.razorpay_signature,
            planId: renewPlan,
            promoCode: renewPromoApplied || undefined,
            shopName: merchant.name,
            ownerName: user?.user_metadata?.full_name || "Owner",
            category: merchant.category || "Cafe / Chai",
            mobile: user?.phone || "9999999999",
            email: user?.email || "",
            ownerId: user?.id,
          });

          if (actRes.success) {
            setSubStatus("ACTIVE");
            setRenewModalOpen(false);
            setShowConfetti(true);
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
    await supabase.auth.signOut();
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


  // 3. Subscription Inactive Lockdown Screen (When 1-Day Grace Period Has Ended)
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

            {/* Plan Selector */}
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

            {/* Redeem Code Input */}
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

            {/* Renew Button */}
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
              We couldn&apos;t find an active counter linked to your account yet. Enter your shop details below to generate your counter QR standee immediately.
            </p>

            <form onSubmit={handleCreateShop} className="mt-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  Shop / Business Name
                </label>
                <input
                  type="text"
                  required
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  placeholder="e.g. Kesar Chai Corner, Gupta Kirana"
                  className="mt-1.5 w-full rounded-xl border border-border bg-sand/30 px-3.5 py-2.5 text-xs font-bold text-secondary outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  Retail Category
                </label>
                <select
                  value={newShopCategory}
                  onChange={(e) => setNewShopCategory(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-sand/30 px-3.5 py-2.5 text-xs font-bold text-secondary outline-none focus:border-primary"
                >
                  <option value="Cafe / Chai">Cafe / Chai</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Kirana / Grocery">Kirana / Grocery</option>
                  <option value="Quick Service Restaurant">Quick Service Restaurant</option>
                  <option value="Salon / Spa">Salon / Spa</option>
                  <option value="Other Retail">Other Retail</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isCreatingShop}
                className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-primary text-xs font-bold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
              >
                {isCreatingShop ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Activating Counter...</span>
                  </>
                ) : (
                  <>
                    <span>Activate Counter &amp; Standee QR</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
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
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Terminal Online
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
                <p className="mt-0.5 font-mono text-base font-extrabold text-secondary">{merchant?.redemption_pin || "••••"}</p>
              </div>
              <div className="rounded-2xl bg-sand/30 p-3.5 border border-border/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink/50">Minimum Bill</span>
                <p className="mt-0.5 font-mono text-base font-extrabold text-secondary">₹{merchant?.min_spend || 100}</p>
              </div>
              <div className="rounded-2xl bg-sand/30 p-3.5 border border-border/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink/50">Streak Reward</span>
                <p className="mt-0.5 font-display text-sm font-extrabold text-secondary truncate">{merchant?.reward_name || "Special Item"}</p>
              </div>
              <div className="rounded-2xl bg-sand/30 p-3.5 border border-border/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink/50">Visits Required</span>
                <p className="mt-0.5 font-mono text-base font-extrabold text-secondary">{merchant?.visits_required || 10} Visits</p>
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
                            <span className="text-[11px] text-ink/50">
                              {item.formattedTime} • Counter Camera Scan
                            </span>
                          </div>
                        </div>

                        {/* Large Touch Buttons Optimized for Low-End Mobile */}
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
                  qrToken={merchant?.qr_token}
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
                      <th className="px-6 py-4">Bill Amount</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-semibold">
                    {ledger.length > 0 ? (
                      ledger.map((row) => (
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-xs text-ink/50">
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

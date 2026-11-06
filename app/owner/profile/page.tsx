"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import {
  getOwnerMerchant,
  updateMerchantRuleAction,
} from "@/app/actions/merchant";
import {
  checkMerchantSubscriptionStatusAction,
  createSubscriptionOrderAction,
  verifyAndActivateSubscriptionAction,
  validatePromoCodeAction,
} from "@/app/actions/subscription";
import { SUBSCRIPTION_PLANS, calculatePlanPricing, SubscriptionPlanId } from "@/lib/razorpay";
import { decodeHtml } from "@/lib/utils/sanitize";
import {
  Store,
  Calendar,
  Clock,
  ShieldCheck,
  CreditCard,
  Sliders,
  KeyRound,
  ArrowRight,
  LogOut,
  Tag,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function OwnerProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();

  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Store Rules State
  const [shopNameInput, setShopNameInput] = useState("");
  const [minSpendInput, setMinSpendInput] = useState(100);
  const [visitsInput, setVisitsInput] = useState(10);
  const [rewardInput, setRewardInput] = useState("Free Masala Chai");
  const [validityInput, setValidityInput] = useState(45);
  const [ruleSaveMessage, setRuleSaveMessage] = useState<string | null>(null);
  const [isSavingRules, setIsSavingRules] = useState(false);

  // Subscription State
  const [subStatus, setSubStatus] = useState<"ACTIVE" | "GRACE_PERIOD" | "INACTIVE">("ACTIVE");
  const [subDetails, setSubDetails] = useState<any>(null);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [renewPlan, setRenewPlan] = useState<SubscriptionPlanId>("YEARLY");
  const [renewPromo, setRenewPromo] = useState("");
  const [renewPromoMsg, setRenewPromoMsg] = useState<string | null>(null);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/auth/owner/login");
          return;
        }

        const res = await getOwnerMerchant();
        if (!res.merchant) {
          router.replace("/auth/owner/login");
          return;
        }

        const m = res.merchant;
        if (mounted) {
          setMerchant(m);
          setShopNameInput(m.name);
          setMinSpendInput(Number(m.min_spend) || 100);
          setVisitsInput(Number(m.visits_required) || 10);
          setRewardInput(m.reward_name);
          setValidityInput(Number(m.validity_days) || 45);

          const subCheck = await checkMerchantSubscriptionStatusAction(m.id);
          setSubStatus(subCheck.status as any);
          setSubDetails(subCheck);
        }
      } catch (err) {
        console.error("Error loading owner profile:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant?.id) return;
    setIsSavingRules(true);
    setRuleSaveMessage(null);

    try {
      const res = await updateMerchantRuleAction({
        merchantId: merchant.id,
        name: shopNameInput.trim(),
        minSpend: Number(minSpendInput),
        visitsRequired: Number(visitsInput),
        rewardName: rewardInput.trim(),
        validityDays: Number(validityInput),
      });

      if (res.success) {
        setRuleSaveMessage("✓ Store parameters updated successfully!");
        toast.success("Store parameters updated successfully!");
      } else {
        setRuleSaveMessage(res.error || "Failed to update store rules.");
        toast.error(res.error || "Failed to update store rules.");
      }
    } catch (err: any) {
      setRuleSaveMessage(err.message || "An error occurred.");
    } finally {
      setIsSavingRules(false);
    }
  };

  const handleApplyRenewPromo = async () => {
    if (!renewPromo.trim() || !merchant?.id) return;
    setRenewPromoMsg(null);
    setRenewError(null);

    try {
      const res = await validatePromoCodeAction({
        code: renewPromo.trim(),
        planId: renewPlan,
      });
      if (res.success) {
        setAppliedPromoCode(renewPromo.trim().toUpperCase());
        setRenewPromoMsg(res.description || res.message || "Promo code applied!");
        toast.success(res.description || res.message || "Promo code applied!");
      } else {
        setRenewPromoMsg(res.message || "Invalid promo code.");
        setAppliedPromoCode(null);
      }
    } catch (err: any) {
      setRenewPromoMsg(err.message || "Failed to validate code.");
    }
  };

  const renewPricing = calculatePlanPricing(renewPlan, appliedPromoCode || undefined);

  const handleExecuteRenewal = async () => {
    if (!merchant?.id) return;
    setIsRenewing(true);
    setRenewError(null);

    try {
      const orderRes = await createSubscriptionOrderAction({
        planId: renewPlan,
        promoCode: appliedPromoCode || undefined,
        shopName: merchant.name,
        email: merchant.owner_email || "merchant@stickthebizz.in",
        mobile: merchant.owner_phone || "9820012345",
      });

      if (!orderRes.success) {
        setRenewError(orderRes.message || "Failed to initiate renewal.");
        setIsRenewing(false);
        return;
      }

      if (orderRes.isFree) {
        const verifyRes = await verifyAndActivateSubscriptionAction({
          planId: renewPlan,
          promoCode: appliedPromoCode || undefined,
          shopName: merchant.name,
          ownerName: merchant.owner_name || merchant.name,
          category: merchant.category || "Retail",
          mobile: merchant.owner_phone || "9820012345",
          email: merchant.owner_email || "merchant@stickthebizz.in",
          ownerId: merchant.owner_id,
        });

        if (verifyRes.success) {
          toast.success("Subscription reactivated successfully!");
          setRenewModalOpen(false);
          const freshSub = await checkMerchantSubscriptionStatusAction(merchant.id);
          setSubStatus(freshSub.status as any);
          setSubDetails(freshSub);
        } else {
          setRenewError(verifyRes.message || "Failed to activate pass.");
        }
        setIsRenewing(false);
        return;
      }

      if (!orderRes.orderId || !orderRes.keyId) {
        setRenewError("Razorpay credentials unavailable.");
        setIsRenewing(false);
        return;
      }

      if (typeof window.Razorpay === "undefined") {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
          document.body.appendChild(script);
        });
      }

      const options = {
        key: orderRes.keyId,
        amount: orderRes.amountPaise,
        currency: orderRes.currency || "INR",
        name: "StickTheBizz",
        description: `${SUBSCRIPTION_PLANS[renewPlan].name} Renewal (${merchant.name})`,
        order_id: orderRes.orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await verifyAndActivateSubscriptionAction({
              planId: renewPlan,
              promoCode: appliedPromoCode || undefined,
              shopName: merchant.name,
              ownerName: merchant.owner_name || merchant.name,
              category: merchant.category || "Retail",
              mobile: merchant.owner_phone || "9820012345",
              email: merchant.owner_email || "merchant@stickthebizz.in",
              ownerId: merchant.owner_id,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              toast.success("Subscription renewed successfully!");
              setRenewModalOpen(false);
              const freshSub = await checkMerchantSubscriptionStatusAction(merchant.id);
              setSubStatus(freshSub.status as any);
              setSubDetails(freshSub);
            } else {
              setRenewError(verifyRes.message || "Payment verification failed.");
            }
          } catch (verErr: any) {
            setRenewError(verErr.message || "Activation error.");
          } finally {
            setIsRenewing(false);
          }
        },
        prefill: {
          name: merchant.owner_name || merchant.name,
          contact: merchant.owner_phone ? `+91${merchant.owner_phone}` : undefined,
        },
        theme: {
          color: "#F2765E",
        },
        modal: {
          ondismiss: () => {
            setIsRenewing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setRenewError(err.message || "Renewal checkout failed.");
      setIsRenewing(false);
    }
  };

  const handleSignOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("stb_customer_phone");
      localStorage.removeItem("stb_customer_name");
      localStorage.removeItem("stb_customer_email");
    }
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-sand">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
            <p className="text-sm font-bold text-secondary">Loading shop profile &amp; subscription...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const daysRemaining = subDetails?.daysRemaining ?? 30;

  return (
    <div className="flex min-h-screen flex-col bg-sand">
      <Navbar />

      <main className="flex-1 pb-16 pt-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Top Bar: Back to Terminal & Store Banner */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-border shadow-brand-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-ink/50">
                  Shop Owner Profile &amp; Plan
                </span>
                <h1 className="font-display text-2xl font-extrabold text-secondary">
                  {decodeHtml(merchant?.name || "Shop Counter")}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs text-ink/65">
                    /s/{merchant?.slug}
                  </span>
                  <a
                    href={`/s/${merchant?.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                  >
                    <span>View Public Standee Link</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/owner/dashboard"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-secondary px-5 text-xs font-bold text-white shadow-brand-sm transition hover:bg-secondary/90 active:scale-95"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Open Terminal Dashboard</span>
              </Link>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 items-start">
            {/* Left 6 Cols: Subscription & Billing Overview */}
            <div className="space-y-6 lg:col-span-6">
              {/* Subscription Card */}
              <div className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-brand-md">
                <div className="flex items-center justify-between border-b border-border/70 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <CreditCard className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="font-display text-lg font-extrabold text-secondary">
                        Subscription Plan
                      </h2>
                      <p className="text-xs text-ink/65">
                        Counter terminal &amp; streak loyalty pass access.
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-bold ${
                      subStatus === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-800"
                        : subStatus === "GRACE_PERIOD"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-coral/20 text-primary"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                    {subStatus === "ACTIVE" ? "ACTIVE PLAN" : subStatus === "GRACE_PERIOD" ? "1-DAY GRACE PERIOD" : "INACTIVE"}
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  {/* Plan Badge & Days Remaining */}
                  <div className="rounded-2xl bg-sand/60 p-4 border border-border">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold uppercase text-ink/60">
                        Current Plan
                      </span>
                      <span className="font-display text-base font-extrabold text-secondary">
                        {merchant?.subscription_plan || "Annual Counter Pro"}
                      </span>
                    </div>

                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="font-display text-3xl font-extrabold text-primary">
                        {daysRemaining}
                      </span>
                      <span className="text-xs font-bold text-ink/70">
                        Days Remaining on Counter Pass
                      </span>
                    </div>

                    {/* Progress indicator */}
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, Math.max(5, (daysRemaining / 365) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Expiry Details */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-border bg-white p-3">
                      <span className="block font-mono text-[10px] font-bold text-ink/50 uppercase">
                        Current Period Ends
                      </span>
                      <span className="font-bold text-secondary text-xs mt-0.5 block">
                        {subDetails?.validUntil
                          ? new Date(subDetails.validUntil).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              timeZone: "Asia/Kolkata",
                            })
                          : "30 Days from activation"}
                      </span>
                    </div>

                    <div className="rounded-xl border border-border bg-white p-3">
                      <span className="block font-mono text-[10px] font-bold text-ink/50 uppercase">
                        1-Day Grace Period
                      </span>
                      <span className="font-bold text-emerald-700 text-xs mt-0.5 block">
                        Guaranteed +24h Buffer
                      </span>
                    </div>
                  </div>

                  {/* Renew Button */}
                  <button
                    type="button"
                    onClick={() => setRenewModalOpen(true)}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-brand-sm transition hover:bg-primary/90 active:scale-95"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Renew / Extend Subscription Pass</span>
                  </button>

                  <div className="rounded-xl bg-sand/40 p-3 text-[11px] text-ink/65 border border-border/60">
                    <p className="flex items-center gap-1.5 font-bold text-secondary">
                      <ShieldCheck className="h-3.5 w-3.5 text-success" />
                      100% Tax Deductible Business Expense
                    </p>
                    <p className="mt-0.5">
                      Includes custom 5x7 acrylic standee PDF/SVG artwork, unlimited digital passes, and instant cashier audio notifications.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cashier Terminal PIN Info */}
              <div className="rounded-2xl border border-border bg-white p-6 shadow-brand-sm">
                <div className="flex items-center gap-2.5 border-b border-border/70 pb-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-sand text-secondary">
                    <KeyRound className="h-4 w-4 text-primary" />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-extrabold text-secondary">
                      Cashier Terminal Security PIN
                    </h3>
                    <p className="text-[11px] text-ink/60">
                      Used on /owner/dashboard to burn vouchers and release customer rewards.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-sand/60 p-3.5 border border-border">
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-ink/50">
                      Store Cashier PIN
                    </span>
                    <span className="font-mono text-xl font-extrabold tracking-widest text-secondary">
                      {merchant?.redemption_pin ? "••••" : "Not Set"}
                    </span>
                  </div>
                  <Link
                    href="/owner/dashboard"
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-secondary border border-border hover:bg-sand"
                  >
                    Open Dashboard Terminal →
                  </Link>
                </div>
              </div>

              {/* Sign Out Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-white text-xs font-bold text-primary hover:bg-primary/10 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out of Shop Owner Account</span>
                </button>
              </div>
            </div>

            {/* Right 6 Cols: Store Loyalty Program Parameters */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-brand-md">
                <div className="flex items-center gap-2.5 border-b border-border/70 pb-4">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-sand text-secondary">
                    <Sliders className="h-5 w-5 text-primary" />
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-extrabold text-secondary">
                      Loyalty Program Rules
                    </h2>
                    <p className="text-xs text-ink/65">
                      Configure your minimum bill amounts, required stamps, and reward descriptions.
                    </p>
                  </div>
                </div>

                {ruleSaveMessage && (
                  <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 text-center">
                    {ruleSaveMessage}
                  </div>
                )}

                <form onSubmit={handleSaveRules} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                      Store Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={shopNameInput}
                      onChange={(e) => setShopNameInput(e.target.value)}
                      placeholder="e.g. Kesar Chai Corner"
                      className="mt-1.5 w-full rounded-xl border border-border p-3 text-sm font-semibold text-secondary focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                        Min Bill Amount (₹)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={minSpendInput}
                        onChange={(e) => setMinSpendInput(Number(e.target.value))}
                        className="mt-1.5 w-full rounded-xl border border-border p-3 font-mono text-sm font-semibold text-secondary focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                        Visits for Reward
                      </label>
                      <input
                        type="number"
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
                      Stamp Expiry Period (Days)
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

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isSavingRules}
                      className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-secondary px-6 text-sm font-bold text-white shadow-brand-sm transition hover:bg-secondary/90 active:scale-95 disabled:opacity-60"
                    >
                      <span>{isSavingRules ? "Saving Changes..." : "Save Store Parameters"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* RENEWAL MODAL */}
      {renewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-brand-xl">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-mono text-[10px] font-extrabold tracking-wider text-primary">
                RENEW STICKTHEBIZZ PASS
              </span>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-secondary">
                Extend {decodeHtml(merchant?.name)}
              </h2>
              <p className="mt-1 text-xs text-ink/70">
                Keep your acrylic counter QR standee active and retain customer regulars.
              </p>
            </div>

            {renewError && (
              <div className="mt-4 rounded-xl bg-primary/10 border border-primary/20 p-3 text-xs font-bold text-primary text-center">
                {renewError}
              </div>
            )}

            {/* Plan Selector */}
            <div className="mt-6 grid grid-cols-2 gap-3 text-left">
              <button
                type="button"
                onClick={() => setRenewPlan("MONTHLY")}
                className={`rounded-2xl p-4 border-2 transition ${
                  renewPlan === "MONTHLY" ? "border-primary bg-primary/5 shadow-brand-sm" : "border-border bg-white"
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
                  renewPlan === "YEARLY" ? "border-primary bg-[#1A2A3A] text-white shadow-brand-sm" : "border-border bg-white"
                }`}
              >
                <span className="absolute top-1 right-2 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
                  20% OFF
                </span>
                <span className={`block font-mono text-[10px] font-bold uppercase ${renewPlan === "YEARLY" ? "text-coral" : "text-primary"}`}>
                  Annual Plan
                </span>
                <span className="font-display text-xl font-extrabold">₹7,190</span>
                <span className={`text-[11px] block ${renewPlan === "YEARLY" ? "text-white/70" : "text-ink/60"}`}>
                  Save ₹1,798
                </span>
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
                className="rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-white hover:bg-primary active:scale-95 transition"
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
              className="mt-6 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-brand-md transition hover:bg-primary/90 active:scale-95 disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" />
              <span>
                {isRenewing
                  ? "Processing..."
                  : renewPricing.isFreeActivation
                  ? "✓ Reactivate Counter Free (₹0 Code Applied)"
                  : `Pay ₹${renewPricing.finalAmount.toLocaleString("en-IN")} via Razorpay & Extend`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRenewModalOpen(false)}
              className="mt-3 w-full text-center text-xs font-bold text-ink/60 hover:text-secondary py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

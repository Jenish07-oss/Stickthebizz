"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Store,
  User,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  Tag,
  Zap,
  Sparkles,
  AlertCircle,
  Clock,
} from "lucide-react";
import Logo from "@/components/Logo";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { frontendEnv } from "@/lib/config/env";
import {
  SubscriptionPlanId,
  SUBSCRIPTION_PLANS,
  calculatePlanPricing,
} from "@/lib/pricing";

const CATEGORIES = [
  "Cafe / Chai",
  "Bakery",
  "Kirana / Grocery",
  "Quick Service Restaurant",
  "Salon / Spa",
  "Other Retail",
];

function OwnerRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { user } = useAuth();

  // Plan selection
  const initialPlan = (searchParams.get("plan")?.toUpperCase() === "YEARLY" ? "YEARLY" : "MONTHLY") as SubscriptionPlanId;
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>(initialPlan);

  // Form Inputs
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [category, setCategory] = useState("Cafe / Chai");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Promo Code State
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoMessage, setPromoMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  // Localhost detection for testing
  const [isLocalhost, setIsLocalhost] = useState(false);

  const handleApplyPromo = async (codeToUse?: string | React.FormEvent) => {
    if (codeToUse && typeof codeToUse !== "string" && "preventDefault" in codeToUse) {
      codeToUse.preventDefault();
    }
    const targetCode = (typeof codeToUse === "string" ? codeToUse : promoInput).trim();
    if (!targetCode) return;

    setIsValidatingPromo(true);
    setPromoMessage(null);
    try {
      const res = await api.subscriptions.validatePromo(targetCode, selectedPlan);

      if (res.success && res.code) {
        setAppliedPromo(res.code);
        setPromoInput(res.code);
        if (typeof window !== "undefined") {
          localStorage.setItem("stb_applied_promo", res.code);
        }

        let feedbackText = `✅ Promo applied — ₹${res.pricing?.discountAmount || 0} OFF`;
        if (res.code === "BETA100" || res.code === "FREE100" || res.code === "FOUNDERPASS" || res.is100PercentOff) {
          feedbackText = "✅ Promo applied — 100% OFF";
        } else if (res.code === "TEST1" || res.code === "RUPEE1") {
          feedbackText = "✅ Test mode — ₹1 checkout";
        }

        setPromoMessage({
          success: true,
          text: feedbackText,
        });
        toast.success(feedbackText);
      } else {
        setAppliedPromo(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("stb_applied_promo");
        }
        setPromoMessage({
          success: false,
          text: res.message || "Invalid redeem code.",
        });
        toast.error(res.message || "Invalid promo code");
      }
    } catch {
      setPromoMessage({ success: false, text: "Error verifying redeem code." });
    } finally {
      setIsValidatingPromo(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsLocalhost(
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.endsWith(".local")
      );

      const urlPromo = new URLSearchParams(window.location.search).get("promo");
      const savedPromo = urlPromo || localStorage.getItem("stb_applied_promo");
      if (savedPromo) {
        handleApplyPromo(savedPromo);
      }
    }
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const pricing = calculatePlanPricing(selectedPlan, appliedPromo || undefined);

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

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoMessage(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("stb_applied_promo");
    }
  };

  // Main Submit & Payment Flow
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanPhone = mobile.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number (+91).");
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create Subscription Order
      const orderRes = await api.subscriptions.createOrder({
        planId: selectedPlan,
        promoCode: appliedPromo || undefined,
        shopName: shopName.trim(),
        email: email.trim().toLowerCase(),
        mobile: cleanPhone,
      });

      if (!orderRes.success) {
        setErrorMessage(orderRes.message || "Failed to initialize order.");
        setIsSubmitting(false);
        return;
      }

      // CASE A: 100% Free Activation
      if (orderRes.isFree) {
        setSuccessMessage("Activating counter subscription...");

        // First register user if not already logged in
        let registeredUser = user;
        if (!registeredUser) {
          try {
            const regRes = await api.auth.ownerRegister({
              email: email.trim().toLowerCase(),
              password,
              fullName: ownerName.trim(),
              phone: cleanPhone,
              shopName: shopName.trim(),
            });
            if (regRes && regRes.data?.user) {
              registeredUser = regRes.data.user;
            }
          } catch (regErr: any) {
            // If already registered, attempt login
            try {
              const loginRes = await api.auth.ownerLogin({
                email: email.trim().toLowerCase(),
                password,
              });
              if (loginRes && loginRes.data?.user) {
                registeredUser = loginRes.data.user;
              }
            } catch {
              setErrorMessage(regErr.message || "Registration failed.");
              setIsSubmitting(false);
              return;
            }
          }
        }

        const activationRes = await api.subscriptions.activate({
          orderId: orderRes.orderId,
          planId: selectedPlan,
          promoCode: appliedPromo || undefined,
          shopName: shopName.trim(),
          ownerName: ownerName.trim(),
          category,
          mobile: cleanPhone,
          email: email.trim().toLowerCase(),
        });

        if (activationRes.success) {
          setSuccessMessage("✓ Subscription activated! Redirecting to your Counter Terminal...");
          setTimeout(() => {
            window.location.href = "/owner/dashboard";
          }, 1200);
        } else {
          setErrorMessage(activationRes.message || "Activation failed. Please try again.");
          setIsSubmitting(false);
        }
        return;
      }

      // CASE B: Paid Activation via Razorpay
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setErrorMessage("Failed to load Razorpay payment gateway. Please check your internet connection.");
        setIsSubmitting(false);
        return;
      }

      const options = {
        key: orderRes.keyId || frontendEnv.RAZORPAY_KEY_ID,
        amount: orderRes.amountPaise,
        currency: orderRes.currency || "INR",
        name: "StickTheBizz",
        description: `${SUBSCRIPTION_PLANS[selectedPlan].name} Activation (${shopName.trim()})`,
        image: "/icon.png",
        order_id: orderRes.orderId,
        prefill: {
          name: ownerName.trim(),
          email: email.trim().toLowerCase(),
          contact: `+91${cleanPhone}`,
        },
        theme: {
          color: "#E05A47",
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
            toast.info("Payment window closed. Form details preserved.");
          },
        },
        handler: async (response: any) => {
          setSuccessMessage("Payment verified! Finalizing your counter account...");
          try {
            // Ensure account exists
            let registeredUser = user;
            if (!registeredUser) {
              try {
                const regRes = await api.auth.ownerRegister({
                  email: email.trim().toLowerCase(),
                  password,
                  fullName: ownerName.trim(),
                  phone: cleanPhone,
                  shopName: shopName.trim(),
                });
                if (regRes && regRes.data?.user) {
                  registeredUser = regRes.data.user;
                }
              } catch {
                try {
                  const loginRes = await api.auth.ownerLogin({
                    email: email.trim().toLowerCase(),
                    password,
                  });
                  if (loginRes && loginRes.data?.user) {
                    registeredUser = loginRes.data.user;
                  }
                } catch {
                  // continue to activation
                }
              }
            }

            const activationRes = await api.subscriptions.activate({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              planId: selectedPlan,
              promoCode: appliedPromo || undefined,
              shopName: shopName.trim(),
              ownerName: ownerName.trim(),
              category,
              mobile: cleanPhone,
              email: email.trim().toLowerCase(),
            });

            if (activationRes.success) {
              setSuccessMessage("✓ Account & Subscription Active! Redirecting to terminal...");
              setTimeout(() => {
                window.location.href = "/owner/dashboard";
              }, 1200);
            } else {
              setErrorMessage(activationRes.message || "Verification failed. Contact support with payment ID: " + response.razorpay_payment_id);
              setIsSubmitting(false);
            }
          } catch (verifyErr: any) {
            setErrorMessage("Account provisioning error: " + verifyErr.message);
            setIsSubmitting(false);
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (resp: any) => {
        setErrorMessage(`Payment Failed: ${resp.error?.description || "Transaction declined by bank."}`);
        setIsSubmitting(false);
      });
      rzp.open();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during subscription setup.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-sand py-8 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="mx-auto w-full max-w-4xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center text-center">
          <Link href="/" className="inline-flex items-center transition-transform hover:scale-105">
            <Logo size="md" />
          </Link>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-secondary/20 bg-white px-3.5 py-1 font-mono text-[11px] font-bold text-secondary shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>OFFICIAL SHOP COUNTER ONBOARDING</span>
          </div>
          <h1 className="mt-4 font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-secondary tracking-tight max-w-2xl">
            Activate Your Shop Counter Subscription
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-ink/70 max-w-xl leading-relaxed">
            Choose your subscription plan to generate your physical acrylic standee QR, activate your live counter terminal, and start turning walk-in diners &amp; shoppers into daily regulars.
          </p>
        </div>

        {/* STEP 1: PLAN SELECTOR */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {/* Monthly Plan Option */}
          <button
            type="button"
            onClick={() => setSelectedPlan("MONTHLY")}
            className={`relative rounded-3xl p-6 text-left transition-all border-2 ${
              selectedPlan === "MONTHLY"
                ? "border-primary bg-white shadow-float ring-2 ring-primary/20"
                : "border-border bg-white/60 hover:bg-white hover:border-ink/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink/60">
                Monthly Counter Plan
              </span>
              <div className={`grid h-5 w-5 place-items-center rounded-full border ${
                selectedPlan === "MONTHLY" ? "border-primary bg-primary text-white" : "border-border bg-white"
              }`}>
                {selectedPlan === "MONTHLY" && <CheckCircle2 className="h-3.5 w-3.5" />}
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-extrabold text-secondary">
                ₹749
              </span>
              <span className="text-xs font-semibold text-ink/60">/ month</span>
            </div>
            <p className="mt-2 text-xs text-ink/75 leading-relaxed">
              Full unlimited counter features. 30-day billing cycle with automated 1-day grace period.
            </p>
          </button>

          {/* Yearly Plan Option */}
          <button
            type="button"
            onClick={() => setSelectedPlan("YEARLY")}
            className={`relative rounded-3xl p-6 text-left transition-all border-2 overflow-hidden ${
              selectedPlan === "YEARLY"
                ? "border-primary bg-secondary text-white shadow-float ring-2 ring-primary/30"
                : "border-border bg-white/60 hover:bg-white hover:border-ink/20"
            }`}
          >
            <div className="absolute top-0 right-0 rounded-bl-2xl bg-primary px-3.5 py-1 font-mono text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-white shadow-xs">
              SAVE 20% (₹1,798 OFF)
            </div>

            <div className="flex items-center justify-between">
              <span className={`font-mono text-xs font-bold uppercase tracking-wider pr-24 sm:pr-0 ${
                selectedPlan === "YEARLY" ? "text-coral" : "text-primary"
              }`}>
                Annual Pro Counter Plan
              </span>
              <div className={`grid h-5 w-5 place-items-center rounded-full border shrink-0 ${
                selectedPlan === "YEARLY" ? "border-primary bg-primary text-white" : "border-border bg-white"
              }`}>
                {selectedPlan === "YEARLY" && <CheckCircle2 className="h-3.5 w-3.5" />}
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className={`font-display text-4xl font-extrabold ${selectedPlan === "YEARLY" ? "text-white" : "text-secondary"}`}>
                ₹7,190
              </span>
              <span className={`text-xs line-through ${selectedPlan === "YEARLY" ? "text-white/50" : "text-ink/40"}`}>
                ₹8,988
              </span>
              <span className={`text-xs font-semibold ${selectedPlan === "YEARLY" ? "text-white/80" : "text-ink/60"}`}>
                / year (₹599/mo)
              </span>
            </div>
            <p className={`mt-2 text-xs leading-relaxed ${selectedPlan === "YEARLY" ? "text-white/80" : "text-ink/75"}`}>
              Full 365 days of guaranteed regular retention. Flat 20% discount + priority VIP onboarding support.
            </p>
          </button>
        </div>

        {/* STEP 2: REGISTRATION FORM + ORDER SUMMARY */}
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {/* Main Form (7 Cols) */}
          <div className="lg:col-span-7 rounded-[2rem] border border-border bg-white p-6 sm:p-8 shadow-card">
            <h2 className="font-display text-xl font-extrabold text-secondary flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <span>Counter &amp; Owner Credentials</span>
            </h2>
            <p className="mt-1 text-xs text-ink/60">
              Your store details for counter acrylic standee generation and daily cashier access.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {errorMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Shop Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  Shop / Business Name
                </label>
                <div className="relative mt-1.5">
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Kesar Chai Corner, Gupta Kirana"
                    className="w-full rounded-xl border border-border bg-sand/30 pl-10 pr-4 py-2.5 text-xs font-bold text-secondary outline-none focus:border-primary focus:bg-white"
                  />
                  <Store className="absolute left-3 top-3 h-4 w-4 text-ink/40" />
                </div>
              </div>

              {/* Owner Name & Category Grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Owner Full Name
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Rajesh Patel"
                      className="w-full rounded-xl border border-border bg-sand/30 pl-10 pr-4 py-2.5 text-xs font-bold text-secondary outline-none focus:border-primary focus:bg-white"
                    />
                    <User className="absolute left-3 top-3 h-4 w-4 text-ink/40" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Retail Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border bg-sand/30 px-3 py-2.5 text-xs font-bold text-secondary outline-none focus:border-primary focus:bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mobile & Email Grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Mobile Number (+91)
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210"
                      className="w-full rounded-xl border border-border bg-sand/30 pl-10 pr-4 py-2.5 text-xs font-bold text-secondary outline-none focus:border-primary focus:bg-white"
                    />
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-ink/40" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Email Address
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="shop@example.com"
                      className="w-full rounded-xl border border-border bg-sand/30 pl-10 pr-4 py-2.5 text-xs font-bold text-secondary outline-none focus:border-primary focus:bg-white"
                    />
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-ink/40" />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  Terminal Password (Min. 8 characters)
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full rounded-xl border border-border bg-sand/30 pl-10 pr-10 py-2.5 text-xs font-bold text-secondary outline-none focus:border-primary focus:bg-white"
                  />
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-ink/40" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-ink/40 hover:text-ink"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-card transition hover:bg-primary/90 disabled:opacity-60"
              >
                <span>
                  {isSubmitting
                    ? "Processing Subscription..."
                    : pricing.isFreeActivation
                    ? "Activate Free Plan"
                    : `Proceed to Pay ₹${pricing.finalAmount.toLocaleString("en-IN")} via Razorpay`}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Sidebar: Redeem Code & Checkout Summary (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* REDEEM CODE / PARTNER COUPON CARD */}
            <div className="rounded-[2rem] border border-border bg-white p-6 shadow-card">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-extrabold text-secondary uppercase tracking-wider">
                  Redeem Code / Partner Coupon
                </h3>
              </div>
              <p className="mt-1 text-[11px] text-ink/65 leading-relaxed">
                Have a partner pass or promotional coupon? Enter your code below to claim your discount.
              </p>

              {appliedPromo ? (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-800">
                      {appliedPromo}
                    </span>
                    <p className="text-[10px] text-emerald-700">
                      {pricing.appliedPromo?.description || "Discount Applied"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Enter partner / promo code"
                    className="flex-1 rounded-xl border border-border bg-sand/30 px-3 py-2 text-xs font-mono font-bold text-secondary uppercase outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyPromo()}
                    disabled={isValidatingPromo || !promoInput.trim()}
                    className="rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-white transition hover:bg-primary disabled:opacity-50"
                  >
                    {isValidatingPromo ? "..." : "Apply"}
                  </button>
                </div>
              )}

              {promoMessage && (
                <p className={`mt-2 text-[11px] font-semibold ${promoMessage.success ? "text-emerald-700" : "text-red-600"}`}>
                  {promoMessage.text}
                </p>
              )}

              {/* LOCALHOST DEV TESTING HELPER */}
              {isLocalhost && (
                <div className="mt-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50/90 p-3.5 text-xs text-amber-950">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-amber-900">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      <span>Localhost Test Codes:</span>
                    </span>
                    <span className="rounded-full bg-amber-200/80 px-2 py-0.5 font-mono text-[9px] font-extrabold uppercase text-amber-800">
                      Localhost Only
                    </span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyPromo("TEST1")}
                      className="group flex flex-col items-start rounded-xl border border-amber-200 bg-white p-2.5 text-left transition hover:border-primary hover:shadow-xs active:scale-95"
                    >
                      <span className="font-mono text-xs font-extrabold text-primary group-hover:underline">
                        TEST1 (₹1)
                      </span>
                      <span className="text-[10px] text-ink/70 leading-tight mt-0.5">
                        Test live Razorpay UPI / Card checkout
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyPromo("FREE100")}
                      className="group flex flex-col items-start rounded-xl border border-amber-200 bg-white p-2.5 text-left transition hover:border-emerald-600 hover:shadow-xs active:scale-95"
                    >
                      <span className="font-mono text-xs font-extrabold text-emerald-700 group-hover:underline">
                        FREE100 (₹0)
                      </span>
                      <span className="text-[10px] text-ink/70 leading-tight mt-0.5">
                        Test 100% free instant activation
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* BILLING BREAKDOWN CARD */}
            <div className="rounded-[2rem] border border-border bg-white p-6 shadow-card">
              <h3 className="font-display text-sm font-extrabold text-secondary uppercase tracking-wider border-b border-border pb-3">
                Subscription Summary
              </h3>

              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink/70">Plan Selected</span>
                  <span className="font-bold text-secondary">
                    {SUBSCRIPTION_PLANS[selectedPlan].name}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-ink/70">Billing Duration</span>
                  <span className="font-mono font-semibold text-secondary">
                    {SUBSCRIPTION_PLANS[selectedPlan].durationDays} Days (+ 1 Day Grace)
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-ink/70">Base Price</span>
                  <span className="font-mono font-semibold text-secondary">
                    ₹{pricing.baseAmount.toLocaleString("en-IN")}
                  </span>
                </div>

                {pricing.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Redeem Code Discount</span>
                    <span>-₹{pricing.discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-border flex justify-between items-baseline">
                  <span className="font-bold text-secondary">Total Payable</span>
                  <div className="text-right">
                    <span className="font-display text-2xl font-extrabold text-primary">
                      ₹{pricing.finalAmount.toLocaleString("en-IN")}
                    </span>
                    {pricing.isFreeActivation && (
                      <span className="block font-mono text-[10px] font-bold text-emerald-700">
                        100% OFF APPLIED
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 1-Day Grace Policy Notice */}
              <div className="mt-5 rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-[11px] text-amber-900 flex items-start gap-2">
                <Clock className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-bold">1-Day Grace Period Guarantee</p>
                  <p className="mt-0.5 text-amber-800 leading-relaxed">
                    If your subscription finishes after {SUBSCRIPTION_PLANS[selectedPlan].durationDays} days, you receive a full 24-hour grace window to renew before your counter QR is deactivated.
                  </p>
                </div>
              </div>

              {/* Guarantee badges */}
              <div className="mt-5 space-y-2 border-t border-border pt-4 text-[11px] font-semibold text-ink/70">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Verified 256-Bit SSL Razorpay Payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>UPI, Google Pay, PhonePe, Cards &amp; NetBanking</span>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-ink/60">
              Already have an active merchant account?{" "}
              <Link href="/auth/owner/login" className="font-bold text-primary hover:underline">
                Sign In to Terminal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OwnerRegisterPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-sand">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <OwnerRegisterForm />
    </React.Suspense>
  );
}


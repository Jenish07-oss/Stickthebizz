import crypto from "crypto";
import Razorpay from "razorpay";

export type SubscriptionPlanId = "MONTHLY" | "YEARLY";

export interface PlanConfig {
  id: SubscriptionPlanId;
  name: string;
  tagline: string;
  basePrice: number; // in INR
  originalPrice?: number; // for displaying strike-through
  discountPercent?: number;
  durationDays: number;
  gracePeriodDays: number;
  intervalText: string;
  savingsBadge?: string;
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, PlanConfig> = {
  MONTHLY: {
    id: "MONTHLY",
    name: "Monthly Counter Pro",
    tagline: "Turn walk-in footfall into daily regulars with zero hardware.",
    basePrice: 749,
    durationDays: 30,
    gracePeriodDays: 1,
    intervalText: "per month",
    features: [
      "Unlimited customer passes & digital punch-cards",
      "Printable custom 5x7 inch acrylic QR standee artwork",
      "Real-time cashier terminal with WebSockets audio chime",
      "Multi-category rules (10 Chais → 1 Free, ₹3,000 spend)",
      "Automated 12:00 AM IST daily visit reset",
      "Full audit logs, retention ledger & DPDP compliance",
    ],
  },
  YEARLY: {
    id: "YEARLY",
    name: "Annual Counter Pro",
    tagline: "Full-year guaranteed regular retention with maximum savings.",
    basePrice: 7190, // 20% OFF from 12 * 749 = 8,988 (Save ₹1,798)
    originalPrice: 8988,
    discountPercent: 20,
    durationDays: 365,
    gracePeriodDays: 1,
    intervalText: "per year (billed annually)",
    savingsBadge: "SAVE 20% (₹1,798 OFF)",
    features: [
      "Everything in Monthly Plan",
      "₹599/mo effective pricing (20% flat discount applied)",
      "High-resolution vector standee artwork (PDF + SVG)",
      "Priority WhatsApp & phone onboarding support",
      "365-day uninterrupted regular retention lock",
      "Dedicated merchant success review every quarter",
    ],
  },
};

export interface PromoCodeDefinition {
  code: string;
  discountType: "PERCENT" | "FLAT" | "FIXED_FINAL";
  discountValue: number;
  description: string;
  is100PercentOff?: boolean;
  isRupeeOneTest?: boolean;
}

// Built-in high-availability promo codes
export const BUILTIN_PROMO_CODES: Record<string, PromoCodeDefinition> = {
  TEST1: {
    code: "TEST1",
    discountType: "FIXED_FINAL",
    discountValue: 1,
    description: "₹1 Payment Test Pass (Razorpay Live UPI / Card)",
    isRupeeOneTest: true,
  },
  RUPEE1: {
    code: "RUPEE1",
    discountType: "FIXED_FINAL",
    discountValue: 1,
    description: "₹1 Payment Test Pass (Razorpay Live UPI / Card)",
    isRupeeOneTest: true,
  },
  FREE100: {
    code: "FREE100",
    discountType: "PERCENT",
    discountValue: 100,
    description: "100% Free Activation Test Pass (₹0)",
    is100PercentOff: true,
  },
  BETA100: {
    code: "BETA100",
    discountType: "PERCENT",
    discountValue: 100,
    description: "100% OFF Partner Pass (₹0 Instant Activation)",
    is100PercentOff: true,
  },
  FOUNDERPASS: {
    code: "FOUNDERPASS",
    discountType: "PERCENT",
    discountValue: 100,
    description: "100% OFF Founder Pass (₹0 Instant Activation)",
    is100PercentOff: true,
  },
  LAUNCH20: {
    code: "LAUNCH20",
    discountType: "PERCENT",
    discountValue: 20,
    description: "20% Launch Discount Applied",
  },
  SAVE200: {
    code: "SAVE200",
    discountType: "FLAT",
    discountValue: 200,
    description: "₹200 Flat Welcome Discount",
  },
};

/**
 * Calculates pricing, applied discounts, and final payable amount.
 */
export function calculatePlanPricing(
  planId: SubscriptionPlanId,
  promoCode?: string
): {
  plan: PlanConfig;
  baseAmount: number;
  discountAmount: number;
  finalAmount: number;
  finalAmountPaise: number;
  isFreeActivation: boolean;
  appliedPromo: PromoCodeDefinition | null;
} {
  const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.MONTHLY;
  const baseAmount = plan.basePrice;

  let appliedPromo: PromoCodeDefinition | null = null;
  let discountAmount = 0;

  if (promoCode) {
    const cleanCode = promoCode.trim().toUpperCase();
    const promo = BUILTIN_PROMO_CODES[cleanCode];
    if (promo) {
      appliedPromo = promo;
      if (promo.discountType === "FIXED_FINAL") {
        discountAmount = Math.max(0, baseAmount - promo.discountValue);
      } else if (promo.discountType === "PERCENT") {
        discountAmount = Math.round((baseAmount * promo.discountValue) / 100);
      } else {
        discountAmount = Math.min(baseAmount, promo.discountValue);
      }
    }
  }

  const finalAmount = Math.max(0, baseAmount - discountAmount);
  const isFreeActivation = finalAmount === 0;

  return {
    plan,
    baseAmount,
    discountAmount,
    finalAmount,
    finalAmountPaise: finalAmount * 100,
    isFreeActivation,
    appliedPromo,
  };
}

/**
 * Returns initialized Razorpay instance if API keys are configured.
 */
export function getRazorpayClient(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    return null;
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}

/**
 * Verifies Razorpay HMAC SHA256 payment signature.
 */
export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_secret) {
    // If secret not configured in dev, signature cannot be validated
    console.warn("[RAZORPAY] RAZORPAY_KEY_SECRET not set in environment.");
    return false;
  }

  try {
    const body = `${params.orderId}|${params.paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(body)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf-8"),
      Buffer.from(params.signature, "utf-8")
    );
  } catch (err) {
    console.error("[RAZORPAY] Signature verification error:", err);
    return false;
  }
}


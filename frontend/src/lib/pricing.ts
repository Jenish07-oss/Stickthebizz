export type SubscriptionPlanId = "MONTHLY" | "YEARLY";

export interface PlanConfig {
  id: SubscriptionPlanId;
  name: string;
  tagline: string;
  basePrice: number; // in INR
  originalPrice?: number;
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
    basePrice: 7190,
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
    description: "20% OFF Launch Discount",
  },
  SAVE200: {
    code: "SAVE200",
    discountType: "FLAT",
    discountValue: 200,
    description: "Flat ₹200 OFF",
  },
};

export interface PricingResult {
  plan: PlanConfig;
  baseAmount: number;
  discountAmount: number;
  finalAmount: number;
  finalAmountPaise: number;
  isFreeActivation: boolean;
  appliedPromo: PromoCodeDefinition | null;
  message?: string;
}

export function calculatePlanPricing(
  planId: SubscriptionPlanId,
  promoCode?: string
): PricingResult {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) throw new Error(`Unknown plan ID: ${planId}`);

  const base = plan.basePrice;
  const cleanCode = (promoCode || "").trim().toUpperCase();

  if (!cleanCode) {
    return {
      plan,
      baseAmount: base,
      discountAmount: 0,
      finalAmount: base,
      finalAmountPaise: base * 100,
      isFreeActivation: false,
      appliedPromo: null,
    };
  }

  const promo = BUILTIN_PROMO_CODES[cleanCode];
  if (!promo) {
    return {
      plan,
      baseAmount: base,
      discountAmount: 0,
      finalAmount: base,
      finalAmountPaise: base * 100,
      isFreeActivation: false,
      appliedPromo: null,
    };
  }

  if (promo.is100PercentOff) {
    return {
      plan,
      baseAmount: base,
      discountAmount: base,
      finalAmount: 0,
      finalAmountPaise: 0,
      isFreeActivation: true,
      appliedPromo: promo,
      message: "✅ Promo applied — 100% OFF (Free Plan Activation)",
    };
  }

  if (promo.isRupeeOneTest) {
    return {
      plan,
      baseAmount: base,
      discountAmount: Math.max(0, base - 1),
      finalAmount: 1,
      finalAmountPaise: 100,
      isFreeActivation: false,
      appliedPromo: promo,
      message: "✅ Test mode — ₹1 checkout applied",
    };
  }

  let discount = 0;
  if (promo.discountType === "PERCENT") {
    discount = Math.round((base * promo.discountValue) / 100);
  } else if (promo.discountType === "FLAT") {
    discount = promo.discountValue;
  }

  const finalAmount = Math.max(1, base - discount);
  return {
    plan,
    baseAmount: base,
    discountAmount: discount,
    finalAmount,
    finalAmountPaise: finalAmount * 100,
    isFreeActivation: false,
    appliedPromo: promo,
    message: `✅ Promo applied — ₹${discount} discount`,
  };
}


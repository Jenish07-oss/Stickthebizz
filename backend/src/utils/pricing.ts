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

/**
 * Calculates pricing, applied discounts, and final payable amount.
 */
export function calculatePlanPricing(
  planId: SubscriptionPlanId,
  promoCode?: string
): PricingResult {
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

  let message = "";
  if (appliedPromo) {
    if (isFreeActivation) {
      message = "✅ Promo applied — 100% OFF (Free Plan Activation)";
    } else if (appliedPromo.isRupeeOneTest) {
      message = "✅ Test mode — ₹1 checkout applied";
    } else {
      message = `✅ Promo applied — ₹${discountAmount} discount`;
    }
  }

  return {
    plan,
    baseAmount,
    discountAmount,
    finalAmount,
    finalAmountPaise: finalAmount * 100,
    isFreeActivation,
    appliedPromo,
    message,
  };
}

export function validatePromoCode(
  code: string,
  planId: SubscriptionPlanId = "MONTHLY"
): {
  success: boolean;
  code?: string;
  totalPayable: number;
  discount: number;
  message: string;
  isFreeActivation: boolean;
  amountPaise: number;
} {
  const cleanCode = (code || "").trim().toUpperCase();
  if (!cleanCode) {
    return {
      success: false,
      totalPayable: SUBSCRIPTION_PLANS[planId].basePrice,
      discount: 0,
      message: "Please enter a promo code",
      isFreeActivation: false,
      amountPaise: SUBSCRIPTION_PLANS[planId].basePrice * 100,
    };
  }

  const promo = BUILTIN_PROMO_CODES[cleanCode];
  if (!promo) {
    return {
      success: false,
      totalPayable: SUBSCRIPTION_PLANS[planId].basePrice,
      discount: 0,
      message: "Invalid promo code",
      isFreeActivation: false,
      amountPaise: SUBSCRIPTION_PLANS[planId].basePrice * 100,
    };
  }

  const pricing = calculatePlanPricing(planId, cleanCode);
  return {
    success: true,
    code: cleanCode,
    totalPayable: pricing.finalAmount,
    discount: pricing.discountAmount,
    message: pricing.message || `Promo ${cleanCode} applied!`,
    isFreeActivation: pricing.isFreeActivation,
    amountPaise: pricing.finalAmountPaise,
  };
}


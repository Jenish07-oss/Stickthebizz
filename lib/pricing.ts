/**
 * StickTheBizz Plan & Promo Pricing Engine
 */
import {
  SubscriptionPlanId,
  SUBSCRIPTION_PLANS,
  BUILTIN_PROMO_CODES,
  calculatePlanPricing as internalCalculatePlanPricing,
  PlanConfig,
  PromoCodeDefinition,
} from "./razorpay";

export { SUBSCRIPTION_PLANS, BUILTIN_PROMO_CODES };
export type { SubscriptionPlanId, PlanConfig, PromoCodeDefinition };

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
  const cleanCode = (promoCode || "").trim().toUpperCase();
  const res = internalCalculatePlanPricing(planId, cleanCode || undefined);

  let message = "";
  if (res.appliedPromo) {
    if (res.isFreeActivation) {
      message = "✅ Promo applied — 100% OFF (Free Plan Activation)";
    } else if (res.appliedPromo.isRupeeOneTest) {
      message = "✅ Test mode — ₹1 checkout applied";
    } else {
      message = `✅ Promo applied — ₹${res.discountAmount} discount`;
    }
  }

  return {
    ...res,
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

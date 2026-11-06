import { prisma } from "../config/db.js";
import { env } from "../config/env.js";
import { getRazorpayClient, verifyRazorpaySignature } from "../config/razorpay.js";
import {
  SubscriptionPlanId,
  SUBSCRIPTION_PLANS,
  BUILTIN_PROMO_CODES,
  calculatePlanPricing,
  PricingResult,
} from "../utils/pricing.js";
import { cleanIndianPhone, sanitizeString } from "../utils/sanitize.js";
import crypto from "crypto";

export interface CreateOrderInput {
  planId: SubscriptionPlanId;
  promoCode?: string;
  shopName: string;
  email: string;
  mobile: string;
}

export interface ActivationInput {
  orderId?: string;
  paymentId?: string;
  signature?: string;
  planId: SubscriptionPlanId;
  promoCode?: string;
  shopName: string;
  ownerName: string;
  category?: string;
  mobile: string;
  email: string;
  ownerUserId: string;
}

/**
 * Validates a promo code across built-in definitions and database table.
 */
export async function validatePromoCodeService(params: {
  code: string;
  planId: SubscriptionPlanId;
}) {
  const cleanCode = (params.code || "").trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, message: "Please enter a promo code." };
  }

  // 1. Check in-memory fast codes
  const builtin = BUILTIN_PROMO_CODES[cleanCode];
  if (builtin) {
    const pricing = calculatePlanPricing(params.planId, cleanCode);
    return {
      success: true,
      code: cleanCode,
      discountType: builtin.discountType,
      discountValue: builtin.discountValue,
      description: builtin.description,
      is100PercentOff: !!builtin.is100PercentOff,
      isRupeeOneTest: !!builtin.isRupeeOneTest,
      totalPayable: pricing.finalAmount,
      discount: pricing.discountAmount,
      amountPaise: pricing.finalAmountPaise,
      message: pricing.message,
      pricing,
    };
  }

  // 2. Check Database promo_codes table
  const dbPromo = await prisma.promoCode.findUnique({
    where: { code: cleanCode },
  });

  if (dbPromo && dbPromo.isActive) {
    if (dbPromo.expiresAt && dbPromo.expiresAt < new Date()) {
      return { success: false, message: "This promo code has expired." };
    }
    if (dbPromo.timesUsed >= dbPromo.maxUses) {
      return { success: false, message: "This promo code has reached its usage limit." };
    }

    const plan = SUBSCRIPTION_PLANS[params.planId] || SUBSCRIPTION_PLANS.MONTHLY;
    const baseAmount = plan.basePrice;
    const discountAmount =
      dbPromo.discountType === "PERCENT"
        ? Math.round((baseAmount * Number(dbPromo.discountValue)) / 100)
        : Math.min(baseAmount, Number(dbPromo.discountValue));
    const finalAmount = Math.max(0, baseAmount - discountAmount);

    return {
      success: true,
      code: cleanCode,
      discountType: dbPromo.discountType,
      discountValue: Number(dbPromo.discountValue),
      description: `Promo Code ${cleanCode} Applied`,
      is100PercentOff: finalAmount === 0,
      totalPayable: finalAmount,
      discount: discountAmount,
      amountPaise: finalAmount * 100,
      pricing: {
        plan,
        baseAmount,
        discountAmount,
        finalAmount,
        finalAmountPaise: finalAmount * 100,
        isFreeActivation: finalAmount === 0,
        appliedPromo: {
          code: cleanCode,
          discountType: dbPromo.discountType,
          discountValue: Number(dbPromo.discountValue),
          description: `Promo Code ${cleanCode} Applied`,
          is100PercentOff: finalAmount === 0,
        },
      },
    };
  }

  return { success: false, message: "Invalid or unrecognized promo code." };
}

/**
 * Creates a Razorpay order or Free activation order.
 */
export async function createSubscriptionOrderService(params: CreateOrderInput) {
  const pricing = calculatePlanPricing(params.planId, params.promoCode);

  // If 100% Free Activation (e.g. BETA100, FREE100)
  if (pricing.isFreeActivation) {
    return {
      success: true,
      isFree: true,
      orderId: `free_promo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      amount: 0,
      currency: "INR",
      plan: pricing.plan,
      pricing,
    };
  }

  const razorpay = getRazorpayClient();
  if (!razorpay || !env.RAZORPAY_KEY_ID) {
    return {
      success: false,
      message: "Payment gateway is temporarily unavailable. Please contact support.",
    };
  }

  const receiptId = `stb_${params.planId.toLowerCase()}_${Date.now().toString().slice(-8)}`;
  const order = await razorpay.orders.create({
    amount: pricing.finalAmountPaise,
    currency: "INR",
    receipt: receiptId,
    notes: {
      plan: params.planId,
      shopName: sanitizeString(params.shopName),
      email: params.email.trim().toLowerCase(),
      mobile: cleanIndianPhone(params.mobile),
      promoCode: params.promoCode || "NONE",
    },
  });

  return {
    success: true,
    isFree: false,
    orderId: order.id,
    amount: pricing.finalAmount,
    amountPaise: pricing.finalAmountPaise,
    currency: "INR",
    keyId: env.RAZORPAY_KEY_ID,
    plan: pricing.plan,
    pricing,
  };
}

/**
 * Verifies payment signature (or 100% free promo) and activates merchant subscription with 1-day grace period.
 */
export async function activateSubscriptionService(params: ActivationInput) {
  const pricing = calculatePlanPricing(params.planId, params.promoCode);

  // 1. Verify Payment Authenticity
  if (pricing.isFreeActivation) {
    if (!pricing.appliedPromo?.is100PercentOff) {
      throw new Error("Invalid promo code for free plan activation.");
    }
  } else {
    if (!params.orderId || !params.paymentId || !params.signature) {
      throw new Error("Missing Razorpay payment proof (orderId, paymentId, signature).");
    }

    const isValid = verifyRazorpaySignature({
      orderId: params.orderId,
      paymentId: params.paymentId,
      signature: params.signature,
    });

    if (!isValid) {
      throw new Error("Razorpay payment signature verification failed.");
    }
  }

  // 2. Dates Calculation (Duration + strictly 1-day grace period)
  const plan = SUBSCRIPTION_PLANS[params.planId] || SUBSCRIPTION_PLANS.MONTHLY;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
  const graceEndsAt = new Date(expiresAt.getTime() + 1 * 24 * 60 * 60 * 1000);

  // 3. Upsert / update Merchant
  const baseSlug = params.shopName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const uniqueSlug = `${baseSlug || "shop"}-${Math.random().toString(36).substring(2, 6)}`;
  const randomPin = crypto.randomInt(1000, 10000).toString();

  const existingMerchant = await prisma.merchant.findFirst({
    where: { ownerId: params.ownerUserId },
  });

  let merchant;

  if (existingMerchant) {
    merchant = await prisma.merchant.update({
      where: { id: existingMerchant.id },
      data: {
        subscriptionStatus: "ACTIVE",
        subscriptionPlan: params.planId,
        subscriptionStartedAt: now,
        subscriptionExpiresAt: expiresAt,
        gracePeriodEndsAt: graceEndsAt,
        razorpayPaymentId: params.paymentId || "PROMO_ACTIVATION",
        razorpayOrderId: params.orderId || "PROMO_ORDER",
      },
    });
  } else {
    merchant = await prisma.merchant.create({
      data: {
        ownerId: params.ownerUserId,
        name: sanitizeString(params.shopName),
        slug: uniqueSlug,
        category: sanitizeString(params.category || "Cafe / Chai"),
        minSpend: 100,
        visitsRequired: 10,
        rewardName: "1 Free Special Item",
        validityDays: 30,
        redemptionPin: randomPin,
        subscriptionStatus: "ACTIVE",
        subscriptionPlan: params.planId,
        subscriptionStartedAt: now,
        subscriptionExpiresAt: expiresAt,
        gracePeriodEndsAt: graceEndsAt,
        razorpayPaymentId: params.paymentId || "PROMO_ACTIVATION",
        razorpayOrderId: params.orderId || "PROMO_ORDER",
      },
    });
  }

  // 4. Audit Log
  await prisma.auditLog.create({
    data: {
      actorType: "MERCHANT",
      actorId: params.ownerUserId,
      action: "MERCHANT_SUBSCRIPTION_ACTIVATED",
      resourceId: merchant.id,
      details: {
        plan: params.planId,
        amount: pricing.finalAmount,
        promoCode: params.promoCode || null,
        expiresAt: expiresAt.toISOString(),
        graceEndsAt: graceEndsAt.toISOString(),
      },
    },
  });

  return {
    success: true,
    message: `✓ ${plan.name} successfully activated! Valid until ${expiresAt.toLocaleDateString("en-IN")}.`,
    merchant,
    expiresAt: expiresAt.toISOString(),
    graceEndsAt: graceEndsAt.toISOString(),
    status: "ACTIVE",
  };
}

/**
 * Live check of merchant subscription status with 1-day grace period enforcement.
 */
export async function checkMerchantSubscriptionStatus(merchantId: string) {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      id: true,
      name: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      subscriptionExpiresAt: true,
      gracePeriodEndsAt: true,
    },
  });

  if (!merchant || !merchant.subscriptionExpiresAt) {
    return { status: "ACTIVE", isUsable: true, daysRemaining: 30 };
  }

  const now = new Date();
  const expiresAt = merchant.subscriptionExpiresAt;
  const graceEndsAt = merchant.gracePeriodEndsAt;

  // Case 1: Subscription is valid
  if (now <= expiresAt) {
    const diffMs = expiresAt.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return {
      status: "ACTIVE" as const,
      isUsable: true,
      daysRemaining,
      expiresAt: expiresAt.toISOString(),
    };
  }

  // Case 2: Past expiry, within 1-day grace period
  if (graceEndsAt && now <= graceEndsAt) {
    const diffMs = graceEndsAt.getTime() - now.getTime();
    const hoursRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));

    if (merchant.subscriptionStatus !== "GRACE_PERIOD") {
      await prisma.merchant.update({
        where: { id: merchantId },
        data: { subscriptionStatus: "GRACE_PERIOD" },
      });
    }

    return {
      status: "GRACE_PERIOD" as const,
      isUsable: true,
      isGracePeriod: true,
      hoursRemaining,
      expiresAt: expiresAt.toISOString(),
      graceEndsAt: graceEndsAt.toISOString(),
      warningMessage: `⚠️ Your subscription expired! You have a 1-day grace period (${hoursRemaining} hours left) to renew before counter QR is deactivated.`,
    };
  }

  // Case 3: Grace period elapsed — strictly INACTIVE
  if (merchant.subscriptionStatus !== "INACTIVE") {
    await prisma.merchant.update({
      where: { id: merchantId },
      data: { subscriptionStatus: "INACTIVE" },
    });
  }

  return {
    status: "INACTIVE" as const,
    isUsable: false,
    isExpired: true,
    expiresAt: expiresAt.toISOString(),
    errorMessage: "🚫 Counter Terminal Deactivated. Your subscription expired and the 1-day grace period has ended. Please renew to reactivate.",
  };
}


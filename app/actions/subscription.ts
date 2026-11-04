"use server";

import { createClient } from "@/lib/supabase/server";
import {
  SubscriptionPlanId,
  SUBSCRIPTION_PLANS,
  calculatePlanPricing,
  getRazorpayClient,
  verifyRazorpaySignature,
  BUILTIN_PROMO_CODES,
} from "@/lib/razorpay";
import { sanitizeHtml, sanitizeError } from "@/lib/utils/sanitize";
import { auditLog } from "@/lib/utils/audit";
import crypto from "crypto";

export interface CreateOrderParams {
  planId: SubscriptionPlanId;
  promoCode?: string;
  shopName: string;
  email: string;
  mobile: string;
}

export interface ActivationParams {
  orderId?: string;
  paymentId?: string;
  signature?: string;
  planId: SubscriptionPlanId;
  promoCode?: string;
  // Shop owner registration details (if new signup)
  shopName: string;
  ownerName: string;
  category: string;
  mobile: string;
  email: string;
  password?: string;
  ownerId?: string; // If already logged in
}

/**
 * Validates a promo / redeem code and returns calculated discount.
 */
export async function validatePromoCodeAction(params: {
  code: string;
  planId: SubscriptionPlanId;
}) {
  try {
    const cleanCode = (params.code || "").trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: "Please enter a redeem code." };
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
        pricing,
      };
    }

    // 2. Check Supabase promo_codes table
    const supabase = await createClient();
    const { data: dbPromo, error } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", cleanCode)
      .eq("is_active", true)
      .maybeSingle();

    if (!error && dbPromo) {
      // Check expiry
      if (dbPromo.expires_at && new Date(dbPromo.expires_at) < new Date()) {
        return { success: false, message: "This redeem code has expired." };
      }
      // Check max uses
      if (dbPromo.max_uses && dbPromo.times_used >= dbPromo.max_uses) {
        return { success: false, message: "This redeem code has reached its usage limit." };
      }

      const plan = SUBSCRIPTION_PLANS[params.planId] || SUBSCRIPTION_PLANS.MONTHLY;
      const baseAmount = plan.basePrice;
      const discountAmount =
        dbPromo.discount_type === "PERCENT"
          ? Math.round((baseAmount * Number(dbPromo.discount_value)) / 100)
          : Math.min(baseAmount, Number(dbPromo.discount_value));
      const finalAmount = Math.max(0, baseAmount - discountAmount);

      return {
        success: true,
        code: cleanCode,
        discountType: dbPromo.discount_type,
        discountValue: Number(dbPromo.discount_value),
        description: `Promo Code ${cleanCode} Applied`,
        is100PercentOff: finalAmount === 0,
        pricing: {
          plan,
          baseAmount,
          discountAmount,
          finalAmount,
          finalAmountPaise: finalAmount * 100,
          isFreeActivation: finalAmount === 0,
          appliedPromo: {
            code: cleanCode,
            discountType: dbPromo.discount_type,
            discountValue: Number(dbPromo.discount_value),
            description: `Promo Code ${cleanCode} Applied`,
            is100PercentOff: finalAmount === 0,
          },
        },
      };
    }

    return { success: false, message: "Invalid or unrecognized redeem code." };
  } catch (err: any) {
    return { success: false, message: sanitizeError(err) };
  }
}

/**
 * Creates a Razorpay Order for a subscription purchase.
 */
export async function createSubscriptionOrderAction(params: CreateOrderParams) {
  try {
    const pricing = calculatePlanPricing(params.planId, params.promoCode);

    // If 100% Free Activation (e.g. BETA100)
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
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;

    if (!razorpay || !keyId) {
      return {
        success: false,
        needsKeys: true,
        message:
          "Razorpay API Keys are not configured yet. You can use redeem code 'BETA100' for ₹0 instant activation while setting up your Razorpay account!",
      };
    }

    // Call Razorpay API to generate order
    const receiptId = `stb_${params.planId.toLowerCase()}_${Date.now().toString().slice(-8)}`;
    const order = await razorpay.orders.create({
      amount: pricing.finalAmountPaise,
      currency: "INR",
      receipt: receiptId,
      notes: {
        plan: params.planId,
        shopName: sanitizeHtml(params.shopName),
        email: sanitizeHtml(params.email),
        mobile: params.mobile,
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
      keyId,
      plan: pricing.plan,
      pricing,
    };
  } catch (err: any) {
    console.error("Failed to create Razorpay order:", err);
    return { success: false, message: sanitizeError(err) };
  }
}

/**
 * Verifies Razorpay payment or 100% Free Promo, creates the merchant account,
 * sets subscription active dates and 1-day grace period.
 */
export async function verifyAndActivateSubscriptionAction(params: ActivationParams) {
  try {
    const pricing = calculatePlanPricing(params.planId, params.promoCode);

    // 1. Verify Payment Authenticity
    if (pricing.isFreeActivation) {
      // Validated 100% promo
      if (!pricing.appliedPromo?.is100PercentOff) {
        return { success: false, message: "Invalid promo code for free activation." };
      }
    } else {
      // Must verify Razorpay HMAC signature
      if (!params.orderId || !params.paymentId || !params.signature) {
        return { success: false, message: "Missing Razorpay payment proof." };
      }

      const isValid = verifyRazorpaySignature({
        orderId: params.orderId,
        paymentId: params.paymentId,
        signature: params.signature,
      });

      if (!isValid) {
        return { success: false, message: "Razorpay signature verification failed. Payment tampered or unverified." };
      }
    }

    // 2. Dates Calculation (Duration + 1 Day Grace Period)
    const plan = SUBSCRIPTION_PLANS[params.planId] || SUBSCRIPTION_PLANS.MONTHLY;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    const graceEndsAt = new Date(expiresAt.getTime() + 1 * 24 * 60 * 60 * 1000); // exactly 1 day after expiry

    const supabase = await createClient();

    let effectiveOwnerId = params.ownerId;

    // 3. If new merchant signup with password, create Supabase Auth User
    if (!effectiveOwnerId && params.password) {
      const cleanEmail = params.email.trim().toLowerCase();
      const cleanPhone = params.mobile.replace(/\D/g, "");

      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password: params.password,
        options: {
          data: {
            full_name: params.ownerName.trim(),
            phone: cleanPhone,
            shop_name: params.shopName.trim(),
            role: "merchant",
          },
        },
      });

      if (authErr && !authErr.message.includes("already registered")) {
        return { success: false, message: authErr.message || "Could not register user account." };
      }

      // Sign in user to get session
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: params.password,
      });

      effectiveOwnerId = signInData?.user?.id || authData?.user?.id;
    }

    if (!effectiveOwnerId) {
      const { data: { user } } = await supabase.auth.getUser();
      effectiveOwnerId = user?.id;
    }

    if (!effectiveOwnerId) {
      return { success: false, message: "User session required to link subscription." };
    }

    // 4. Create or Update Merchant Record in DB
    const baseSlug = params.shopName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const uniqueSlug = `${baseSlug || "shop"}-${Math.random().toString(36).substring(2, 6)}`;
    const randomPin = crypto.randomInt(1000, 10000).toString();

    // Check if merchant already exists for this owner
    const { data: existingMerchants } = await supabase
      .from("merchants")
      .select("*")
      .eq("owner_id", effectiveOwnerId)
      .limit(1);

    let activeMerchant: any = null;

    if (existingMerchants && existingMerchants.length > 0) {
      const current = existingMerchants[0];
      const { data: updated, error: updateErr } = await supabase
        .from("merchants")
        .update({
          subscription_status: "ACTIVE",
          subscription_plan: params.planId,
          subscription_started_at: now.toISOString(),
          subscription_expires_at: expiresAt.toISOString(),
          grace_period_ends_at: graceEndsAt.toISOString(),
          razorpay_payment_id: params.paymentId || "PROMO_ACTIVATION",
          razorpay_order_id: params.orderId || "PROMO_ORDER",
        })
        .eq("id", current.id)
        .select()
        .single();

      if (!updateErr && updated) {
        activeMerchant = updated;
      } else {
        activeMerchant = current;
      }
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from("merchants")
        .insert({
          name: sanitizeHtml(params.shopName),
          slug: uniqueSlug,
          category: sanitizeHtml(params.category || "Cafe / Chai"),
          owner_id: effectiveOwnerId,
          min_spend: 100,
          visits_required: 10,
          reward_name: "Free Special Item",
          validity_days: 30,
          redemption_pin: randomPin,
          subscription_status: "ACTIVE",
          subscription_plan: params.planId,
          subscription_started_at: now.toISOString(),
          subscription_expires_at: expiresAt.toISOString(),
          grace_period_ends_at: graceEndsAt.toISOString(),
          razorpay_payment_id: params.paymentId || "PROMO_ACTIVATION",
          razorpay_order_id: params.orderId || "PROMO_ORDER",
        })
        .select()
        .maybeSingle();

      if (inserted) {
        activeMerchant = inserted;
      } else if (insertErr) {
        console.warn("Merchant subscription insert fallback note:", insertErr.message);
      }
    }

    // 5. Record Transaction in `merchant_subscriptions` table (if table exists)
    try {
      if (activeMerchant?.id) {
        await supabase.from("merchant_subscriptions").insert({
          merchant_id: activeMerchant.id,
          owner_id: effectiveOwnerId,
          plan: params.planId,
          amount: pricing.finalAmount,
          currency: "INR",
          status: "ACTIVE",
          razorpay_order_id: params.orderId || null,
          razorpay_payment_id: params.paymentId || null,
          razorpay_signature: params.signature || null,
          promo_code_applied: params.promoCode || null,
          discount_amount: pricing.discountAmount,
          starts_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          grace_ends_at: graceEndsAt.toISOString(),
        });
      }
    } catch (subErr) {
      console.warn("Subscription ledger note:", subErr);
    }

    // 6. Audit Log
    await auditLog({
      userId: effectiveOwnerId,
      action: "MERCHANT_SUBSCRIPTION_ACTIVATED",
      resourceType: "merchant",
      resourceId: activeMerchant?.id,
      metadata: {
        plan: params.planId,
        amount: pricing.finalAmount,
        promoCode: params.promoCode,
        expiresAt: expiresAt.toISOString(),
        graceEndsAt: graceEndsAt.toISOString(),
      },
    });

    return {
      success: true,
      message: `✓ ${plan.name} successfully activated! Valid until ${expiresAt.toLocaleDateString("en-IN")}.`,
      merchant: activeMerchant,
      expiresAt: expiresAt.toISOString(),
      graceEndsAt: graceEndsAt.toISOString(),
      status: "ACTIVE",
    };
  } catch (err: any) {
    console.error("Subscription activation error:", err);
    return { success: false, message: sanitizeError(err) };
  }
}

/**
 * Checks and enforces the live subscription & 1-day grace period state of a merchant.
 */
export async function checkMerchantSubscriptionStatusAction(merchantId: string) {
  try {
    const supabase = await createClient();
    const { data: merchant, error } = await supabase
      .from("merchants")
      .select("id, name, subscription_status, subscription_plan, subscription_expires_at, grace_period_ends_at")
      .eq("id", merchantId)
      .maybeSingle();

    if (error || !merchant) {
      return { status: "ACTIVE", isUsable: true, daysRemaining: 30 };
    }

    const now = new Date();
    const expiresAt = merchant.subscription_expires_at ? new Date(merchant.subscription_expires_at) : null;
    const graceEndsAt = merchant.grace_period_ends_at ? new Date(merchant.grace_period_ends_at) : null;

    if (!expiresAt) {
      // Legacy or unconfigured: default to active
      return { status: "ACTIVE", isUsable: true, daysRemaining: 30 };
    }

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

    // Case 2: Past expiry date, but within 1-day grace period
    if (graceEndsAt && now <= graceEndsAt) {
      const diffMs = graceEndsAt.getTime() - now.getTime();
      const hoursRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));

      // Transition to GRACE_PERIOD in database if not updated
      if (merchant.subscription_status !== "GRACE_PERIOD") {
        await supabase
          .from("merchants")
          .update({ subscription_status: "GRACE_PERIOD" })
          .eq("id", merchantId);
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

    // Case 3: Grace period elapsed — strictly INACTIVE / EXPIRED
    if (merchant.subscription_status !== "INACTIVE") {
      await supabase
        .from("merchants")
        .update({ subscription_status: "INACTIVE" })
        .eq("id", merchantId);
    }

    return {
      status: "INACTIVE" as const,
      isUsable: false,
      isExpired: true,
      expiresAt: expiresAt.toISOString(),
      errorMessage: "🚫 Counter Terminal Deactivated. Your subscription expired and the 1-day grace period has ended. Please renew to reactivate.",
    };
  } catch (err: any) {
    return { status: "ACTIVE", isUsable: true, daysRemaining: 30 };
  }
}


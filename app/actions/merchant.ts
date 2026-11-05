"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedMerchant } from "@/lib/utils/auth";
import { sanitizeHtml, decodeHtml, sanitizeError, maskPhone } from "@/lib/utils/sanitize";
import { auditLog } from "@/lib/utils/audit";
import { updateMerchantRuleSchema } from "@/lib/utils/validation";
import crypto from "crypto";

export interface UpdateMerchantRuleInput {
  merchantId: string;
  name: string;
  minSpend: number;
  visitsRequired: number;
  rewardName: string;
  validityDays?: number;
  redemptionPin?: string;
  category?: string;
  qrToken?: string;
}

/**
 * Updates merchant rule in the database with strict Zod validation.
 */
export async function updateMerchantRuleAction(input: UpdateMerchantRuleInput) {
  try {
    // 1. Zod Validation
    const validation = updateMerchantRuleSchema.safeParse({
      merchantId: input.merchantId,
      name: input.name,
      minSpend: input.minSpend,
      visitsRequired: input.visitsRequired,
      rewardName: input.rewardName,
      validityDays: input.validityDays || 30,
      redemptionPin: input.redemptionPin || undefined,
    });

    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Invalid merchant rule input." };
    }

    // 2. Ownership verification
    await getAuthenticatedMerchant(input.merchantId);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const updatePayload: Record<string, any> = {
      name: sanitizeHtml(input.name),
      min_spend: input.minSpend,
      visits_required: input.visitsRequired,
      reward_name: sanitizeHtml(input.rewardName),
      validity_days: input.validityDays || 30,
      category: sanitizeHtml(input.category || "Cafe / Chai"),
    };

    if (input.redemptionPin && /^\d{4}$/.test(input.redemptionPin)) {
      updatePayload.redemption_pin = input.redemptionPin;
    }

    if (input.qrToken) {
      updatePayload.qr_token = input.qrToken;
    }

    let { data, error } = await supabase
      .from("merchants")
      .update(updatePayload)
      .eq("id", input.merchantId)
      .select()
      .single();

    if (error && error.message && error.message.includes("qr_token")) {
      delete updatePayload.qr_token;
      const retry = await supabase
        .from("merchants")
        .update(updatePayload)
        .eq("id", input.merchantId)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      return { success: false, error: sanitizeError(error) };
    }

    // 3. Security Audit Log
    if (user) {
      await auditLog({
        userId: user.id,
        action: "merchant_rule_update",
        resourceType: "merchant",
        resourceId: input.merchantId,
        metadata: { fields: Object.keys(updatePayload) },
      });
    }

    return { success: true, merchant: data };
  } catch (err: any) {
    return { success: false, error: sanitizeError(err) };
  }
}

/**
 * Rotates merchant QR code for a fresh 30-day / 1-month cycle.
 */
export async function rotateMerchantQrAction(merchantId: string) {
  try {
    await getAuthenticatedMerchant(merchantId);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const now = new Date();
    const monthCycle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${Math.random().toString(36).substring(2, 6)}`;

    let { data, error } = await supabase
      .from("merchants")
      .update({
        qr_token: monthCycle,
        validity_days: 30,
      })
      .eq("id", merchantId)
      .select()
      .single();

    if (error && error.message && error.message.includes("qr_token")) {
      const { data: existing } = await supabase
        .from("merchants")
        .select("*")
        .eq("id", merchantId)
        .maybeSingle();
      return { success: true, merchant: { ...existing, qr_token: monthCycle } };
    }

    if (error) {
      return { success: false, error: sanitizeError(error) };
    }

    if (user) {
      await auditLog({
        userId: user.id,
        action: "merchant_qr_rotate",
        resourceType: "merchant",
        resourceId: merchantId,
      });
    }

    return { success: true, merchant: data };
  } catch (err: any) {
    return { success: false, error: sanitizeError(err) };
  }
}

/**
 * Fetches merchant details for current logged-in owner.
 * If user exists but has no merchant record, attempts to auto-provision one from user metadata.
 */
export async function getOwnerMerchant() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { user: null, merchant: null, needsSetup: false };
    }

    const { data: merchantList } = await supabase
      .from("merchants")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    let merchant = (merchantList && merchantList.length > 0) ? merchantList[0] : null;

    // Auto-provision if user signed up with shop_name metadata but merchant insert was delayed
    if (!merchant && user?.id) {
      const metadataShopName = user.user_metadata?.shop_name;
      if (metadataShopName) {
        const baseSlug = metadataShopName
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        const uniqueSlug = `${baseSlug || "counter"}-${Math.random().toString(36).substring(2, 6)}`;
        const randomPin = crypto.randomInt(1000, 10000).toString();

        const { data: newShop, error: insertError } = await supabase
          .from("merchants")
          .insert({
            name: sanitizeHtml(metadataShopName),
            slug: uniqueSlug,
            category: sanitizeHtml(user.user_metadata?.category || "Cafe / Chai"),
            owner_id: user.id,
            min_spend: 100,
            visits_required: 10,
            reward_name: "Free Special Item",
            validity_days: 30,
            redemption_pin: randomPin,
          })
          .select()
          .maybeSingle();

        if (newShop) {
          merchant = newShop;
        } else if (insertError) {
          console.warn("Auto-provision merchant note:", insertError.message);
        }
      }
    }

    if (merchant) {
      if (merchant.category) merchant.category = decodeHtml(merchant.category);
      if (merchant.name) merchant.name = decodeHtml(merchant.name);
    }

    return { user, merchant, needsSetup: !merchant && !!user };
  } catch (err: any) {
    return { user: null, merchant: null, needsSetup: false, error: sanitizeError(err) };
  }
}

/**
 * Registers a new merchant with a unique slug and links to authenticated owner.
 * Uses a cryptographically random 4-digit PIN (NO hardcoded default).
 */
export async function registerMerchantAction(params: {
  name: string;
  category: string;
  ownerId?: string;
  phone?: string;
  minSpend?: number;
  visitsRequired?: number;
  rewardName?: string;
}) {
  try {
    const supabase = await createClient();
    const cleanName = sanitizeHtml(params.name || "My Shop Counter");
    const baseSlug = cleanName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const uniqueSlug = `${baseSlug || "shop"}-${Math.random().toString(36).substring(2, 6)}`;
    const randomPin = crypto.randomInt(1000, 10000).toString();

    // Check if authenticated user is making the call if ownerId wasn't passed
    let effectiveOwnerId = params.ownerId;
    if (!effectiveOwnerId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        effectiveOwnerId = user.id;
      }
    }

    const { data: merchant, error } = await supabase
      .from("merchants")
      .insert({
        name: cleanName,
        slug: uniqueSlug,
        category: sanitizeHtml(params.category || "Cafe / Chai"),
        owner_id: effectiveOwnerId || null,
        min_spend: params.minSpend || 100,
        visits_required: params.visitsRequired || 10,
        reward_name: sanitizeHtml(params.rewardName || "Free Special Item"),
        validity_days: 30,
        redemption_pin: randomPin,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: sanitizeError(error) };
    }
    return { success: true, merchant };
  } catch (err: any) {
    return { success: false, error: sanitizeError(err) };
  }
}

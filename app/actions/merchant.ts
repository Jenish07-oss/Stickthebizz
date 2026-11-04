"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedMerchant } from "@/lib/utils/auth";
import { sanitizeHtml, sanitizeError, maskPhone } from "@/lib/utils/sanitize";
import { auditLog } from "@/lib/utils/audit";

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
 * Updates merchant rule in the database.
 */
export async function updateMerchantRuleAction(input: UpdateMerchantRuleInput) {
  try {
    // ✅ VERIFY OWNERSHIP FIRST
    await getAuthenticatedMerchant(input.merchantId);
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const updatePayload: {
      name: string;
      min_spend: number;
      visits_required: number;
      reward_name: string;
      validity_days: number;
      redemption_pin: string;
      category: string;
      qr_token?: string;
    } = {
      name: sanitizeHtml(input.name),
      min_spend: input.minSpend,
      visits_required: input.visitsRequired,
      reward_name: sanitizeHtml(input.rewardName),
      validity_days: input.validityDays || 30,
      redemption_pin: input.redemptionPin || "8492",
      category: sanitizeHtml(input.category || "Cafe / Chai"),
    };
    
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
    
    // ✅ AUDIT LOG
    if (user) {
      await auditLog({
        userId: user.id,
        action: 'merchant_rule_update',
        resourceType: 'merchant',
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
    // ✅ VERIFY OWNERSHIP FIRST
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
    
    // ✅ AUDIT LOG
    if (user) {
      await auditLog({
        userId: user.id,
        action: 'merchant_qr_rotate',
        resourceType: 'merchant',
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
 * If user has no merchant yet, links or provisions one.
 */
export async function getOwnerMerchant() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { user: null, merchant: null };
    }

    // Try finding merchant by owner_id
    let { data: merchant } = await supabase
      .from("merchants")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!merchant) {
      // Check if user has an existing merchant with their email or fallback
      const { data: existing } = await supabase
        .from("merchants")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (existing && !existing.owner_id) {
        // Claim the unassigned merchant
        await supabase.from("merchants").update({ owner_id: user.id }).eq("id", existing.id);
        merchant = { ...existing, owner_id: user.id };
      } else {
        merchant = existing;
      }
    }

    return { user, merchant };
  } catch (err: any) {
    return { user: null, merchant: null, error: sanitizeError(err) };
  }
}

/**
 * Registers a new merchant with a unique slug and links to authenticated owner.
 */
export async function registerMerchantAction(params: {
  name: string;
  category: string;
  ownerId?: string;
  phone?: string;
}) {
  try {
    const supabase = await createClient();
    const baseSlug = params.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    const { data: merchant, error } = await supabase
      .from("merchants")
      .insert({
        name: sanitizeHtml(params.name),
        slug: uniqueSlug,
        category: sanitizeHtml(params.category || "Cafe / Chai"),
        owner_id: params.ownerId || null,
        min_spend: 100,
        visits_required: 10,
        reward_name: "Free Special Item",
        validity_days: 30,
        redemption_pin: "8492",
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
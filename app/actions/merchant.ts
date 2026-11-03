"use server";

import { createClient } from "@/lib/supabase/server";

export interface UpdateMerchantRuleInput {
  merchantId: string;
  name: string;
  minSpend: number;
  visitsRequired: number;
  rewardName: string;
  validityDays?: number;
  redemptionPin?: string;
  category?: string;
}

/**
 * Updates merchant rule in the database.
 */
export async function updateMerchantRuleAction(input: UpdateMerchantRuleInput) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("merchants")
      .update({
        name: input.name,
        min_spend: input.minSpend,
        visits_required: input.visitsRequired,
        reward_name: input.rewardName,
        validity_days: input.validityDays || 45,
        redemption_pin: input.redemptionPin || "8492",
        category: input.category || "Cafe / Chai",
      })
      .eq("id", input.merchantId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, merchant: data };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Fetches merchant details for current logged-in owner.
 * If user has no merchant yet, links or provisions one.
 */
export async function getOwnerMerchant() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Fallback to primary merchant for unauthenticated demo preview
      const { data: defaultMerchant } = await supabase
        .from("merchants")
        .select("*")
        .eq("slug", "kesar-chai")
        .maybeSingle();

      return { user: null, merchant: defaultMerchant };
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
    return { user: null, merchant: null, error: err.message };
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
    const supabase = createClient();
    const baseSlug = params.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    const { data: merchant, error } = await supabase
      .from("merchants")
      .insert({
        name: params.name,
        slug: uniqueSlug,
        category: params.category || "Cafe / Chai",
        owner_id: params.ownerId || null,
        min_spend: 100,
        visits_required: 10,
        reward_name: "Free Special Item",
        validity_days: 45,
        redemption_pin: "8492",
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, merchant };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

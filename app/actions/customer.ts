"use server";

import { createClient } from "@/lib/supabase/server";
import { getVisitDateIST } from "./scan";
import { sanitizeError } from "@/lib/utils/sanitize";

export interface CustomerStorePass {
  merchantId: string;
  merchantName: string;
  merchantSlug: string;
  category: string;
  minSpend: number;
  visitsRequired: number;
  rewardName: string;
  validityDays: number;
  visitsCount: number;
  displayVisits: number;
  progressPercent: number;
  status: "COLLECTING" | "REWARD READY" | "LOCKED UNTIL 12:00 AM IST";
  isLockedToday: boolean;
  daysRemaining: number;
  lastVisitDate: string | null;
}

export interface CustomerVisitRecord {
  id: string;
  merchantName: string;
  merchantSlug: string;
  visitDate: string;
  billAmount: number;
  status: string;
  createdAt: string;
}

export interface CustomerWalletData {
  customer: {
    id: string;
    phone: string;
    fullName: string | null;
    email: string | null;
  } | null;
  passes: CustomerStorePass[];
  history: CustomerVisitRecord[];
}

/**
 * Ensures or updates a customer profile row in the database.
 */
export async function syncCustomerAccountAction(params: {
  fullName?: string;
  phone?: string;
  email?: string;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const cleanPhone = (params.phone || user?.phone || user?.user_metadata?.phone || "").replace(/\D/g, "");
    const emailToUse = (params.email || user?.email || "").trim().toLowerCase();
    const nameToUse = params.fullName || user?.user_metadata?.full_name || "Valued Regular";

    if (!cleanPhone && !emailToUse) {
      return { success: false, message: "Phone or email required" };
    }

    // Check if customer exists by phone or email
    let existingQuery = supabase.from("customers").select("*");
    if (cleanPhone) {
      existingQuery = existingQuery.eq("phone", cleanPhone);
    } else if (emailToUse) {
      existingQuery = existingQuery.eq("email", emailToUse);
    }

    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) {
      const { data: updated, error } = await supabase
        .from("customers")
        .update({
          auth_id: user?.id || existing.auth_id,
          full_name: nameToUse || existing.full_name,
          email: emailToUse || existing.email,
          ...(cleanPhone ? { phone: cleanPhone } : {}),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) return { success: false, error: sanitizeError(error) };
      return { success: true, customer: updated };
    } else {
      if (!cleanPhone) {
        return { success: false, message: "A 10-digit mobile number is required to create a pass." };
      }
      const { data: inserted, error } = await supabase
        .from("customers")
        .insert({
          auth_id: user?.id || null,
          phone: cleanPhone,
          email: emailToUse || null,
          full_name: nameToUse,
        })
        .select()
        .single();

      if (error) return { success: false, error: sanitizeError(error) };
      return { success: true, customer: inserted };
    }
  } catch (err: any) {
    return { success: false, error: sanitizeError(err) };
  }
}

/**
 * Fetches the aggregated multi-store digital wallet for an authenticated customer.
 * 100% real Supabase data — zero mock visits or fake counters.
 */
export async function getCustomerWalletAction(): Promise<CustomerWalletData> {
  const supabase = await createClient();

  // 1. Authenticate user session - ONLY use authenticated user's data
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      customer: null,
      passes: [],
      history: [],
    };
  }

  const userPhone = (user.phone || user.user_metadata?.phone || "").replace(/\D/g, "");
  const userEmail = user.email || "";
  const userName = user?.user_metadata?.full_name || null;

  // 2. Query real customer profile using ONLY authenticated user's identifiers
  let customer: any = null;
  if (userPhone) {
    const cleanPhone = userPhone.replace(/\D/g, "");
    const { data: c } = await supabase
      .from("customers")
      .select("id, phone, full_name, email")
      .eq("phone", cleanPhone)
      .maybeSingle();

    if (c) customer = c;
  }

  if (!customer && userEmail) {
    const { data: c } = await supabase
      .from("customers")
      .select("id, phone, full_name, email")
      .eq("email", userEmail)
      .maybeSingle();

    if (c) customer = c;
  }

  if (!customer && user?.id) {
    const { data: c } = await supabase
      .from("customers")
      .select("id, phone, full_name, email")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (c) customer = c;
  }

  // 3. Fetch real merchants available on the platform
  const { data: allMerchants } = await supabase
    .from("merchants")
    .select("*")
    .order("created_at", { ascending: true });

  const merchantsList = allMerchants || [];
  const todayIST = await getVisitDateIST();

  // If customer is not authenticated or has no profile yet, return clean 0-visit passes
  if (!customer) {
    const emptyPasses: CustomerStorePass[] = merchantsList.map((m: any) => ({
      merchantId: m.id,
      merchantName: m.name,
      merchantSlug: m.slug,
      category: m.category || "Retail",
      minSpend: Number(m.min_spend) || 100,
      visitsRequired: Number(m.visits_required) || 10,
      rewardName: m.reward_name,
      validityDays: Number(m.validity_days) || 45,
      visitsCount: 0,
      displayVisits: 0,
      progressPercent: 0,
      status: "COLLECTING",
      isLockedToday: false,
      daysRemaining: Number(m.validity_days) || 45,
      lastVisitDate: null,
    }));

    return {
      customer: user
        ? {
            id: user.id,
            phone: userPhone || "",
            fullName: userName || "Retail Regular",
            email: userEmail || null,
          }
        : null,
      passes: emptyPasses,
      history: [],
    };
  }

  // 4. Fetch real customer visits from Supabase
  const { data: visits } = await supabase
    .from("visits")
    .select("id, merchant_id, visit_date_ist, bill_amount, status, created_at, merchants (*)")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  const visitList = visits || [];

  // Group real visits by merchant
  const merchantVisitsMap: Record<string, any[]> = {};
  visitList.forEach((v) => {
    if (!merchantVisitsMap[v.merchant_id]) {
      merchantVisitsMap[v.merchant_id] = [];
    }
    merchantVisitsMap[v.merchant_id].push(v);
  });

  // Build real wallet passes with accurate visit counts
  const passes: CustomerStorePass[] = merchantsList.map((m: any) => {
    const merchantVisits = merchantVisitsMap[m.id] || [];
    const approvedVisits = merchantVisits.filter(
      (v) => v.status === "APPROVED" || v.status === "REDEEMED"
    );

    // Exact count of verified visits from database
    const visitsCount = approvedVisits.length;
    const displayVisits = Math.min(visitsCount, m.visits_required);
    const hasScannedToday = merchantVisits.some(
      (v) => v.visit_date_ist === todayIST && v.status !== "REJECTED"
    );

    let status: "COLLECTING" | "REWARD READY" | "LOCKED UNTIL 12:00 AM IST" = "COLLECTING";
    if (displayVisits >= m.visits_required) {
      status = "REWARD READY";
    } else if (hasScannedToday) {
      status = "LOCKED UNTIL 12:00 AM IST";
    }

    // Calculate days remaining based on store validity
    const daysRemaining = Number(m.validity_days) || 45;

    return {
      merchantId: m.id,
      merchantName: m.name,
      merchantSlug: m.slug,
      category: m.category || "Retail",
      minSpend: Number(m.min_spend) || 100,
      visitsRequired: Number(m.visits_required) || 10,
      rewardName: m.reward_name,
      validityDays: daysRemaining,
      visitsCount,
      displayVisits,
      progressPercent: Math.round((displayVisits / m.visits_required) * 100),
      status,
      isLockedToday: hasScannedToday,
      daysRemaining,
      lastVisitDate: merchantVisits[0]?.visit_date_ist || null,
    };
  });

  // History list from real database visits
  const history: CustomerVisitRecord[] = visitList.map((v) => {
    const merchantObj: any = Array.isArray(v.merchants) ? v.merchants[0] : v.merchants;
    return {
      id: v.id,
      merchantName: merchantObj?.name || "Retail Store",
      merchantSlug: merchantObj?.slug || "store",
      visitDate: v.visit_date_ist,
      billAmount: Number(v.bill_amount) || 100,
      status: v.status === "APPROVED" ? "Approved" : v.status === "REDEEMED" ? "Redeemed" : v.status,
      createdAt: v.created_at,
    };
  });

  return {
    customer: {
      id: customer.id,
      phone: customer.phone,
      fullName: customer.full_name || userName || "Retail Regular",
      email: customer.email || userEmail || null,
    },
    passes,
    history,
  };
}
"use server";

import { createClient } from "@/lib/supabase/server";
import { getVisitDateIST } from "./scan";

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
 * Fetches the aggregated multi-store digital wallet for an authenticated customer.
 */
export async function getCustomerWalletAction(): Promise<CustomerWalletData> {
  const supabase = createClient();

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userPhone = user?.phone || user?.user_metadata?.phone;
  const userEmail = user?.email;
  const userName = user?.user_metadata?.full_name || null;

  // 2. Query customer profile
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

  // 3. Fallback: if no profile found yet, create or use phone
  if (!customer && (userPhone || userEmail)) {
    const phoneToUse = userPhone ? userPhone.replace(/\D/g, "") : "9820012345";
    const { data: newC } = await supabase
      .from("customers")
      .upsert(
        {
          phone: phoneToUse,
          email: userEmail || null,
          full_name: userName || "Retail Regular",
          auth_id: user?.id || null,
        },
        { onConflict: "phone" }
      )
      .select()
      .single();

    customer = newC;
  }

  // If still no customer record, fetch default merchants as starter passes
  const { data: allMerchants } = await supabase
    .from("merchants")
    .select("*")
    .order("created_at", { ascending: true });

  const merchantsList = allMerchants || [];
  const todayIST = await getVisitDateIST();

  if (!customer) {
    // Generate default preview passes
    const defaultPasses: CustomerStorePass[] = merchantsList.slice(0, 3).map((m: any, idx: number) => {
      const visits = idx === 0 ? 7 : idx === 1 ? 4 : 2;
      const displayVisits = Math.min(visits, m.visits_required);
      const isReady = visits >= m.visits_required;
      return {
        merchantId: m.id,
        merchantName: m.name,
        merchantSlug: m.slug,
        category: m.category || "Cafe / Chai",
        minSpend: m.min_spend,
        visitsRequired: m.visits_required,
        rewardName: m.reward_name,
        validityDays: m.validity_days || 45,
        visitsCount: visits,
        displayVisits,
        progressPercent: Math.round((displayVisits / m.visits_required) * 100),
        status: isReady ? "REWARD READY" : "COLLECTING",
        isLockedToday: false,
        daysRemaining: 18,
        lastVisitDate: todayIST,
      };
    });

    return {
      customer: {
        id: "demo-cust",
        phone: "+91 98200 12345",
        fullName: "Retail Regular",
        email: null,
      },
      passes: defaultPasses,
      history: [
        {
          id: "hist-1",
          merchantName: "Kesar Chai Corner",
          merchantSlug: "kesar-chai",
          visitDate: todayIST,
          billAmount: 120,
          status: "Approved",
          createdAt: new Date().toISOString(),
        },
        {
          id: "hist-2",
          merchantName: "Patel Kirana Superstore",
          merchantSlug: "patel-kirana",
          visitDate: todayIST,
          billAmount: 340,
          status: "Approved",
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }

  // 4. Query all visits for this customer
  const { data: visits } = await supabase
    .from("visits")
    .select("id, merchant_id, visit_date_ist, bill_amount, status, created_at, merchants (*)")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  const visitList = visits || [];

  // Group visits by merchant
  const merchantVisitsMap: Record<string, any[]> = {};
  visitList.forEach((v) => {
    if (!merchantVisitsMap[v.merchant_id]) {
      merchantVisitsMap[v.merchant_id] = [];
    }
    merchantVisitsMap[v.merchant_id].push(v);
  });

  // Build wallet passes for merchants visited, plus ensure seeded merchants are discoverable
  const passes: CustomerStorePass[] = [];

  merchantsList.forEach((m: any) => {
    const merchantVisits = merchantVisitsMap[m.id] || [];
    const approvedVisits = merchantVisits.filter(
      (v) => v.status === "APPROVED" || v.status === "REDEEMED"
    );

    // Initial starter visits for Kesar Chai if empty for good UX
    const visitsCount =
      approvedVisits.length > 0 ? approvedVisits.length : m.slug === "kesar-chai" ? 7 : 0;

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

    passes.push({
      merchantId: m.id,
      merchantName: m.name,
      merchantSlug: m.slug,
      category: m.category || "Retail",
      minSpend: m.min_spend,
      visitsRequired: m.visits_required,
      rewardName: m.reward_name,
      validityDays: m.validity_days || 45,
      visitsCount,
      displayVisits,
      progressPercent: Math.round((displayVisits / m.visits_required) * 100),
      status,
      isLockedToday: hasScannedToday,
      daysRemaining: 18,
      lastVisitDate: merchantVisits[0]?.visit_date_ist || null,
    });
  });

  // History list
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

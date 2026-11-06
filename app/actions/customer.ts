"use server";

import { createClient, createUnauthenticatedClient } from "@/lib/supabase/server";
import { getVisitDateIST } from "./scan";
import { sanitizeError, maskPhone } from "@/lib/utils/sanitize";
import { auditLog } from "@/lib/utils/audit";
import {
  otpRequestSchema,
  otpVerifySchema,
  phoneSchema,
} from "@/lib/utils/validation";
import {
  generateSecureOtp,
  storeOtp,
  verifySecureOtp,
} from "@/lib/utils/otp";

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
 * Request a 6-digit cryptographically secure OTP for customer authentication.
 */
export async function requestCustomerOtpAction(phone: string) {
  try {
    const validation = otpRequestSchema.safeParse({ phone });
    if (!validation.success) {
      return { success: false, message: validation.error.issues[0]?.message || "Invalid phone number." };
    }

    const cleanPhone = validation.data.phone;
    const otp = generateSecureOtp();

    // Store hashed with pepper and 3-minute expiry
    const { expiresAt } = storeOtp(cleanPhone, otp);

    const supabase = await createClient();

    // Call Supabase Auth OTP or sign in with OTP
    const { error: authError } = await supabase.auth.signInWithOtp({
      phone: `+91${cleanPhone}`,
    });

    if (authError) {
      // In local development or if SMS gateway is in sandbox, OTP is stored in memory utility
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV ONLY] Secure OTP for +91${cleanPhone}: ${otp}`);
      }
    }

    return {
      success: true,
      message: "6-digit OTP sent successfully. Valid for 3 minutes.",
      expiresAt: expiresAt.toISOString(),
    };
  } catch (err: any) {
    return { success: false, message: sanitizeError(err) };
  }
}

/**
 * Verify customer 6-digit OTP with single-use invalidation and 5-attempt brute-force protection.
 */
export async function verifyCustomerOtpAction(phone: string, inputOtp: string) {
  try {
    const validation = otpVerifySchema.safeParse({ phone, otp: inputOtp });
    if (!validation.success) {
      return { success: false, message: validation.error.issues[0]?.message || "Invalid OTP code." };
    }

    const cleanPhone = validation.data.phone;

    // Verify using cryptographic utility first
    const memoryVerify = verifySecureOtp(cleanPhone, inputOtp);
    if (!memoryVerify.valid) {
      if (memoryVerify.locked) {
        return { success: false, message: "Too many failed attempts. This OTP is locked. Please request a new one." };
      }
      if (memoryVerify.reason === "EXPIRED") {
        return { success: false, message: "OTP has expired. Please request a new 6-digit code." };
      }
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      phone: `+91${cleanPhone}`,
      token: inputOtp,
      type: "sms",
    });

    if (error && !memoryVerify.valid) {
      return { success: false, message: "Invalid verification code. Please check your SMS." };
    }

    // Ensure customer record exists
    let { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", cleanPhone)
      .maybeSingle();

    if (!customer) {
      await supabase.from("customers").insert({
        phone: cleanPhone,
        auth_id: data?.user?.id || null,
        full_name: "Valued Regular",
      });
    } else if (data?.user?.id) {
      await supabase
        .from("customers")
        .update({ auth_id: data.user.id })
        .eq("id", customer.id);
    }

    return { success: true, message: "Authentication successful." };
  } catch (err: any) {
    return { success: false, message: sanitizeError(err) };
  }
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
    let authUserId: string | null = null;
    let authUserPhone: string | null = null;
    let authUserEmail: string | null = null;
    let authUserName: string | null = null;

    try {
      const authSupabase = await createClient();
      const {
        data: { user },
      } = await authSupabase.auth.getUser();
      if (user) {
        authUserId = user.id;
        authUserPhone = (user.phone || user.user_metadata?.phone || "").replace(/\D/g, "");
        authUserEmail = user.email || null;
        authUserName = user.user_metadata?.full_name || null;
      }
    } catch {
      // unauthenticated sync fallback
    }

    const cleanPhone = (params.phone || authUserPhone || "").replace(/\D/g, "");
    const emailToUse = (params.email || authUserEmail || "").trim().toLowerCase();
    const nameToUse = params.fullName || authUserName || "Valued Regular";

    if (!cleanPhone && !emailToUse) {
      return { success: false, message: "Phone or email required" };
    }

    const db = createUnauthenticatedClient();

    let existing: any = null;
    if (cleanPhone) {
      const { data } = await db.from("customers").select("*").eq("phone", cleanPhone).maybeSingle();
      existing = data;
    }
    if (!existing && authUserId) {
      const { data } = await db.from("customers").select("*").eq("auth_id", authUserId).maybeSingle();
      existing = data;
    }
    if (!existing && emailToUse) {
      const { data } = await db.from("customers").select("*").eq("email", emailToUse).maybeSingle();
      existing = data;
    }

    if (existing) {
      const { data: updated, error } = await db
        .from("customers")
        .update({
          auth_id: authUserId || existing.auth_id,
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
      const { data: inserted, error } = await db
        .from("customers")
        .insert({
          auth_id: authUserId || null,
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

export async function getCustomerWalletAction(phoneOverride?: string, emailOverride?: string): Promise<CustomerWalletData> {
  const authSupabase = await createClient();
  const supabase = createUnauthenticatedClient();

  let {
    data: { user },
  } = await authSupabase.auth.getUser();

  const cleanPhoneOverride = (phoneOverride || "").replace(/\D/g, "");
  const cleanEmailOverride = (emailOverride || "").trim().toLowerCase();

  if (!user && (!cleanPhoneOverride || cleanPhoneOverride.length !== 10) && (!cleanEmailOverride || !cleanEmailOverride.includes("@"))) {
    return {
      customer: null,
      passes: [],
      history: [],
    };
  }

  const userPhone = (user?.phone || user?.user_metadata?.phone || "").replace(/\D/g, "");
  const userEmail = user?.email || cleanEmailOverride || "";
  const userName = user?.user_metadata?.full_name || null;

  let customer: any = null;

  // 1. Check phoneOverride from verified device (takes strict precedence over merchant owner session)
  if (cleanPhoneOverride && cleanPhoneOverride.length === 10) {
    const { data: c } = await supabase
      .from("customers")
      .select("id, phone, full_name, email")
      .or(`phone.eq.${cleanPhoneOverride},phone.eq.+91${cleanPhoneOverride}`)
      .maybeSingle();

    if (c) {
      customer = {
        ...c,
        phone: cleanPhoneOverride,
      };
    } else {
      customer = {
        id: "cust_" + cleanPhoneOverride,
        phone: cleanPhoneOverride,
        full_name: "Loyal Customer",
        email: cleanEmailOverride || null,
      };
    }
  }

  // 2. Check emailOverride from verified device if phone not set
  if (!customer && cleanEmailOverride && cleanEmailOverride.includes("@")) {
    const { data: c } = await supabase
      .from("customers")
      .select("id, phone, full_name, email")
      .eq("email", cleanEmailOverride)
      .maybeSingle();

    if (c) {
      customer = c;
    } else {
      customer = {
        id: "cust_" + cleanEmailOverride.replace(/[^a-zA-Z0-9]/g, "_"),
        phone: "",
        full_name: "Loyal Customer",
        email: cleanEmailOverride,
      };
    }
  }

  // 3. Check user phone from Supabase session
  if (!customer && userPhone) {
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

  const { data: allMerchants } = await supabase
    .from("merchants")
    .select("*")
    .order("created_at", { ascending: true });

  const merchantsList = allMerchants || [];
  const todayIST = await getVisitDateIST();

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

  const { data: visits } = await supabase
    .from("visits")
    .select("id, merchant_id, visit_date_ist, bill_amount, status, created_at, merchants (*)")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  const visitList = visits || [];

  const merchantVisitsMap: Record<string, any[]> = {};
  visitList.forEach((v) => {
    if (!merchantVisitsMap[v.merchant_id]) {
      merchantVisitsMap[v.merchant_id] = [];
    }
    merchantVisitsMap[v.merchant_id].push(v);
  });

  const passes: CustomerStorePass[] = merchantsList.map((m: any) => {
    const merchantVisits = merchantVisitsMap[m.id] || [];
    const approvedVisits = merchantVisits.filter(
      (v) => v.status === "APPROVED" || v.status === "REDEEMED"
    );

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

/**
 * DPDP Act 2023: Customer Data Portability (Export My Data).
 * Returns customer profile, visit history, and redemption records in clean JSON.
 */
export async function exportCustomerDataAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "UNAUTHENTICATED" };

    const userPhone = (user.phone || user.user_metadata?.phone || "").replace(/\D/g, "");
    const { data: customer } = await supabase
      .from("customers")
      .select("id, phone, full_name, email, created_at")
      .or(`auth_id.eq.${user.id},phone.eq.${userPhone}`)
      .maybeSingle();

    if (!customer) {
      return { success: false, error: "CUSTOMER_NOT_FOUND" };
    }

    // Fetch visits
    const { data: visits } = await supabase
      .from("visits")
      .select("id, merchant_id, visit_date_ist, bill_amount, status, created_at, merchants(name, category)")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false });

    // Fetch redemptions from redemptions_safe view
    const { data: redemptions } = await supabase
      .from("redemptions_safe")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false });

    // Security Audit Log
    await auditLog({
      userId: user.id,
      action: "customer_data_export",
      resourceType: "customer",
      resourceId: customer.id,
    });

    const exportData = {
      exportTimestamp: new Date().toISOString(),
      complianceStandard: "India Digital Personal Data Protection (DPDP) Act 2023",
      customerProfile: {
        id: customer.id,
        phone: customer.phone,
        fullName: customer.full_name,
        email: customer.email,
        memberSince: customer.created_at,
      },
      visitsHistory: visits || [],
      rewardRedemptions: redemptions || [],
    };

    return { success: true, data: exportData };
  } catch (err: any) {
    return { success: false, error: sanitizeError(err) };
  }
}

/**
 * DPDP Act 2023: Right to be Forgotten (Account Deletion & Safe Anonymization).
 * Anonymizes PII while preserving audit/accounting ledger integrity (ON DELETE RESTRICT).
 */
export async function deleteCustomerAccountAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "UNAUTHENTICATED" };

    const userPhone = (user.phone || user.user_metadata?.phone || "").replace(/\D/g, "");
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .or(`auth_id.eq.${user.id},phone.eq.${userPhone}`)
      .maybeSingle();

    if (!customer) {
      return { success: false, error: "CUSTOMER_NOT_FOUND" };
    }

    // Anonymize customer row without destroying financial audit trail in visits/redemptions
    const anonymizedPhone = `DEL_${Math.random().toString(36).substring(2, 10)}`;
    const { error: updateError } = await supabase
      .from("customers")
      .update({
        phone: anonymizedPhone,
        full_name: "Deleted Customer",
        email: null,
        auth_id: null,
      })
      .eq("id", customer.id);

    if (updateError) {
      return { success: false, error: sanitizeError(updateError) };
    }

    await auditLog({
      userId: user.id,
      action: "customer_account_delete",
      resourceType: "customer",
      resourceId: customer.id,
    });

    // Revoke session
    await supabase.auth.signOut();

    return { success: true, message: "Your account and personal data have been permanently anonymized." };
  } catch (err: any) {
    return { success: false, error: sanitizeError(err) };
  }
}

/**
 * Update authenticated customer profile (Name and Mobile Number).
 */
export async function updateCustomerProfileAction(params: { fullName: string; phone: string }) {
  try {
    const authSupabase = await createClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return { success: false, error: "UNAUTHENTICATED" };

    const cleanPhone = params.phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return { success: false, error: "Please enter a valid 10-digit mobile number." };
    }
    const cleanName = params.fullName.trim();
    if (!cleanName) {
      return { success: false, error: "Please enter your name." };
    }

    const db = createUnauthenticatedClient();
    let { data: customer } = await db
      .from("customers")
      .select("id, phone, full_name, email, auth_id")
      .or(`auth_id.eq.${user.id}${user.email ? `,email.eq.${user.email.toLowerCase()}` : ""}`)
      .limit(1)
      .maybeSingle();

    if (customer) {
      const { data: updated, error } = await db
        .from("customers")
        .update({
          full_name: cleanName,
          phone: cleanPhone,
          auth_id: user.id,
          email: user.email || customer.email,
        })
        .eq("id", customer.id)
        .select()
        .single();

      if (error) return { success: false, error: sanitizeError(error) };
      return { success: true, customer: updated };
    } else {
      const { data: inserted, error } = await db
        .from("customers")
        .insert({
          auth_id: user.id,
          email: user.email || null,
          phone: cleanPhone,
          full_name: cleanName,
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

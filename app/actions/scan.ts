"use server";

import { createClient, createUnauthenticatedClient } from "@/lib/supabase/server";
import { getAuthenticatedMerchant } from "@/lib/utils/auth";
import { sanitizeHtml, sanitizeError, maskPhone } from "@/lib/utils/sanitize";
import { auditLog } from "@/lib/utils/audit";
import {
  submitScanSchema,
  visitActionSchema,
  verifyRedemptionSchema,
} from "@/lib/utils/validation";
import { checkIdempotency, saveIdempotency } from "@/lib/utils/idempotency";
import crypto from "crypto";

export interface SubmitScanResult {
  success: boolean;
  locked?: boolean;
  message: string;
  visit?: any;
  error?: string;
}

/**
 * In-memory sliding window for scan velocity control (prevents burst spam within 60s per phone+merchant).
 */
const RECENT_SCANS = new Map<string, number>();

/**
 * Calculates current date in Asia/Kolkata (IST, UTC+5:30) timezone in 'YYYY-MM-DD' format.
 */
export async function getVisitDateIST(): Promise<string> {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
}

/**
 * Submits a new scan for a customer at a specific merchant.
 * Checks or creates customer by phone, calculates IST date, and inserts visit with status PENDING.
 * Catches code 23505 (unique_daily_scan) to enforce strict 1-scan per calendar day.
 */
export async function submitScan(
  customerPhone: string,
  merchantId: string,
  billAmount: number = 100,
  customerName?: string,
  scannedQrToken?: string,
  idempotencyKey?: string
): Promise<SubmitScanResult> {
  try {
    // 1. Strict Zod Validation
    const validation = submitScanSchema.safeParse({
      customerPhone,
      merchantId,
      billAmount,
      customerName,
      scannedQrToken,
      idempotencyKey,
    });

    if (!validation.success) {
      return {
        success: false,
        locked: false,
        message: validation.error.issues[0]?.message || "Invalid scan input.",
      };
    }

    const validData = validation.data;
    const cleanPhone = validData.customerPhone;

    // 2. Idempotency Check
    if (validData.idempotencyKey) {
      const idemp = await checkIdempotency(validData.idempotencyKey, "submitScan", {
        cleanPhone,
        merchantId: validData.merchantId,
      });
      if (idemp.isDuplicate && idemp.cachedResponse) {
        return idemp.cachedResponse;
      }
    }

    // 3. Scan Velocity Guard (60-second limit per phone + merchant)
    const velocityKey = `${cleanPhone}:${validData.merchantId}`;
    const lastScanTime = RECENT_SCANS.get(velocityKey);
    const nowMs = Date.now();
    if (lastScanTime && nowMs - lastScanTime < 60 * 1000) {
      return {
        success: false,
        locked: false,
        message: "Please wait 60 seconds before submitting another check-in.",
      };
    }
    RECENT_SCANS.set(velocityKey, nowMs);

    // Clean old entries lazily
    if (RECENT_SCANS.size > 2000) {
      RECENT_SCANS.forEach((timestamp, k) => {
        if (nowMs - timestamp > 5 * 60 * 1000) RECENT_SCANS.delete(k);
      });
    }

    // Check optional authenticated user session
    let authUserId: string | null = null;
    let authUserEmail: string | null = null;
    try {
      const authSupabase = await createClient();
      const {
        data: { user },
      } = await authSupabase.auth.getUser();
      if (user) {
        authUserId = user.id;
        authUserEmail = user.email || null;
      }
    } catch {
      // Unauthenticated check-in is supported
    }

    // Use unauthenticated client for public counter database operations to avoid session RLS loops
    const db = createUnauthenticatedClient();

    // 4. Validate QR token matches merchant's current token (anti-replay)
    if (validData.scannedQrToken) {
      const { data: merchant } = await db
        .from("merchants")
        .select("qr_token, validity_days")
        .eq("id", validData.merchantId)
        .single();

      if (!merchant) {
        return { success: false, locked: false, message: "Merchant not found" };
      }

      if (validData.scannedQrToken !== merchant.qr_token) {
        return { success: false, locked: false, message: "QR code expired. Please scan the latest counter code." };
      }
    }

    // 5. Query or insert customer in 'customers' table
    let { data: customer } = await db
      .from("customers")
      .select("id, phone, full_name, auth_id, email")
      .eq("phone", cleanPhone)
      .maybeSingle();

    if (!customer && authUserId) {
      const { data: authCust } = await db
        .from("customers")
        .select("id, phone, full_name, auth_id, email")
        .eq("auth_id", authUserId)
        .maybeSingle();
      if (authCust) {
        customer = authCust;
      }
    }

    if (!customer && authUserEmail) {
      const { data: emailCust } = await db
        .from("customers")
        .select("id, phone, full_name, auth_id, email")
        .eq("email", authUserEmail)
        .maybeSingle();
      if (emailCust) {
        customer = emailCust;
      }
    }

    if (!customer) {
      const { data: newCustomer, error: insertCustError } = await db
        .from("customers")
        .insert({
          phone: cleanPhone,
          full_name: validData.customerName ? sanitizeHtml(validData.customerName) : null,
          auth_id: authUserId,
          email: authUserEmail,
        })
        .select("id, phone, full_name, auth_id, email")
        .maybeSingle();

      if (insertCustError || !newCustomer) {
        // Fallback retry: check by phone, then auth_id, then email
        const { data: retryPhone } = await db
          .from("customers")
          .select("id, phone, full_name, auth_id, email")
          .eq("phone", cleanPhone)
          .maybeSingle();

        if (retryPhone) {
          customer = retryPhone;
        } else if (authUserId) {
          const { data: retryAuth } = await db
            .from("customers")
            .select("id, phone, full_name, auth_id, email")
            .eq("auth_id", authUserId)
            .maybeSingle();
          if (retryAuth) customer = retryAuth;
        }

        if (!customer && authUserEmail) {
          const { data: retryEmail } = await db
            .from("customers")
            .select("id, phone, full_name, auth_id, email")
            .eq("email", authUserEmail)
            .maybeSingle();
          if (retryEmail) customer = retryEmail;
        }

        if (!customer) {
          console.error("submitScan customer insert error:", insertCustError);
          return {
            success: false,
            locked: false,
            message: "Unable to register customer record. Please check phone number and try again.",
            error: insertCustError?.message,
          };
        }
      } else {
        customer = newCustomer;
      }
    } else if (authUserId && !customer.auth_id) {
      // Link customer record to authenticated user
      await db
        .from("customers")
        .update({ auth_id: authUserId, ...(authUserEmail ? { email: authUserEmail } : {}) })
        .eq("id", customer.id);
    }

    if (!customer) {
      return {
        success: false,
        locked: false,
        message: "Failed to establish customer record. Please try again.",
      };
    }

    // 6. Calculate IST visit date (YYYY-MM-DD)
    const visitDateIst = await getVisitDateIST();

    // 7. Attempt insert into 'visits' with status 'PENDING'
    const { error: visitError } = await db
      .from("visits")
      .insert({
        customer_id: customer.id,
        merchant_id: validData.merchantId,
        visit_date_ist: visitDateIst,
        bill_amount: validData.billAmount || 100,
        status: "PENDING",
      });

    if (visitError) {
      // Postgres error code 23505 = unique_violation (unique_daily_scan)
      const isUniqueConstraint =
        visitError.code === "23505" ||
        visitError.message?.toLowerCase().includes("unique_daily_scan") ||
        visitError.message?.toLowerCase().includes("duplicate key");

      if (isUniqueConstraint) {
        const lockedResponse: SubmitScanResult = {
          success: false,
          locked: true,
          message: "Today's visit verified! Next stamp unlocks strictly at 12:00:00 AM IST.",
        };
        if (validData.idempotencyKey) {
          await saveIdempotency(validData.idempotencyKey, "submitScan", { cleanPhone, merchantId: validData.merchantId }, 200, lockedResponse);
        }
        return lockedResponse;
      }

      console.error("submitScan insert visit error:", visitError);
      return {
        success: false,
        locked: false,
        message: "Failed to record stamp visit: " + sanitizeError(visitError),
        error: visitError.message,
      };
    }

    const successResponse: SubmitScanResult = {
      success: true,
      locked: false,
      message: "✓ Today's stamp punched! Cashier counter notified.",
    };

    if (validData.idempotencyKey) {
      await saveIdempotency(validData.idempotencyKey, "submitScan", { cleanPhone, merchantId: validData.merchantId }, 200, successResponse);
    }

    return successResponse;
  } catch (err: any) {
    console.error("submitScan unexpected error:", err);
    return {
      success: false,
      locked: false,
      message: sanitizeError(err),
      error: String(err),
    };
  }
}

/**
 * Approve a pending visit from the Shop Owner Terminal.
 * Enforces atomic status check (status = 'PENDING').
 */
export async function approveVisit(visitId: string, idempotencyKey?: string) {
  try {
    const validation = visitActionSchema.safeParse({ visitId, idempotencyKey });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Invalid visit ID." };
    }

    const authSupabase = await createClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();
    if (!user) return { success: false, error: "UNAUTHENTICATED" };

    const db = createUnauthenticatedClient();

    // Verify visit belongs to user's merchant
    const { data: visit, error: visitError } = await db
      .from("visits")
      .select("id, merchant_id, status, merchants!inner(owner_id)")
      .eq("id", visitId)
      .single();

    if (visitError || !visit) return { success: false, error: "VISIT_NOT_FOUND" };
    if ((visit as any).merchants?.owner_id !== user.id) return { success: false, error: "FORBIDDEN" };

    if (visit.status !== "PENDING") {
      return { success: false, error: `Visit is already ${visit.status.toLowerCase()}.` };
    }

    // Atomic Conditional Update: try with authSupabase first, fallback to db
    let updatedVisit: any = null;
    const authUpdate = await authSupabase
      .from("visits")
      .update({ status: "APPROVED" })
      .eq("id", visitId)
      .eq("status", "PENDING")
      .select();

    if (authUpdate.data && authUpdate.data.length > 0) {
      updatedVisit = authUpdate.data[0];
    } else {
      const dbUpdate = await db
        .from("visits")
        .update({ status: "APPROVED" })
        .eq("id", visitId)
        .eq("status", "PENDING")
        .select();

      if (dbUpdate.data && dbUpdate.data.length > 0) {
        updatedVisit = dbUpdate.data[0];
      }
    }

    if (!updatedVisit) {
      console.error("approveVisit update error:", authUpdate.error);
      return { success: false, error: "Visit could not be approved or was already processed." };
    }

    await auditLog({
      userId: user.id,
      action: "visit_approve",
      resourceType: "visit",
      resourceId: visitId,
    });

    return { success: true, visit: updatedVisit };
  } catch (err: any) {
    return { success: false, error: sanitizeError(err) };
  }
}

/**
 * Reject a pending visit from the Shop Owner Terminal.
 */
export async function rejectVisit(visitId: string) {
  try {
    const validation = visitActionSchema.safeParse({ visitId });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Invalid visit ID." };
    }

    const authSupabase = await createClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();
    if (!user) return { success: false, error: "UNAUTHENTICATED" };

    const db = createUnauthenticatedClient();

    const { data: visit, error: visitError } = await db
      .from("visits")
      .select("id, merchant_id, status, merchants!inner(owner_id)")
      .eq("id", visitId)
      .single();

    if (visitError || !visit) return { success: false, error: "VISIT_NOT_FOUND" };
    if ((visit as any).merchants?.owner_id !== user.id) return { success: false, error: "FORBIDDEN" };

    let updatedVisit: any = null;
    const authUpdate = await authSupabase
      .from("visits")
      .update({ status: "REJECTED" })
      .eq("id", visitId)
      .eq("status", "PENDING")
      .select();

    if (authUpdate.data && authUpdate.data.length > 0) {
      updatedVisit = authUpdate.data[0];
    } else {
      const dbUpdate = await db
        .from("visits")
        .update({ status: "REJECTED" })
        .eq("id", visitId)
        .eq("status", "PENDING")
        .select();

      if (dbUpdate.data && dbUpdate.data.length > 0) {
        updatedVisit = dbUpdate.data[0];
      }
    }

    if (!updatedVisit) {
      console.error("rejectVisit update error:", authUpdate.error);
      return { success: false, error: "Visit already processed or not pending." };
    }

    await auditLog({
      userId: user.id,
      action: "visit_reject",
      resourceType: "visit",
      resourceId: visitId,
    });

    return { success: true, visit: updatedVisit };
  } catch (err: any) {
    return { success: false, error: sanitizeError(err) };
  }
}

/**
 * Verify 4-digit PIN for reward voucher redemption.
 */
export async function verifyRedemptionPin(
  merchantId: string,
  pin: string,
  customerPhone?: string,
  idempotencyKey?: string
) {
  try {
    const validation = verifyRedemptionSchema.safeParse({
      merchantId,
      pin,
      customerPhone,
      idempotencyKey,
    });

    if (!validation.success) {
      return { success: false, message: validation.error.issues[0]?.message || "Invalid redemption input." };
    }

    await getAuthenticatedMerchant(merchantId);

    const authSupabase = await createClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();
    const cleanPin = pin.trim();

    const db = createUnauthenticatedClient();

    const { data: merchant, error: merchError } = await db
      .from("merchants")
      .select("id, redemption_pin, reward_name, visits_required")
      .eq("id", merchantId)
      .single();

    if (merchError || !merchant) {
      return { success: false, message: "Merchant record not found." };
    }

    if (!merchant.redemption_pin) {
      return { success: false, message: "Merchant PIN not configured. Please set your 4-digit PIN in settings." };
    }

    if (cleanPin !== merchant.redemption_pin) {
      return { success: false, message: "Invalid 4-Digit Voucher PIN. Check customer phone." };
    }

    let remainingSurplus = 0;

    if (customerPhone) {
      const cleanPhone = customerPhone.replace(/\D/g, "");
      const { data: customer } = await db
        .from("customers")
        .select("id")
        .eq("phone", cleanPhone)
        .maybeSingle();

      if (!customer) {
        return { success: false, message: "Customer account not found for this phone number." };
      }

      const { data: approvedVisits, error: approvedError } = await db
        .from("visits")
        .select("id, created_at")
        .eq("merchant_id", merchantId)
        .eq("customer_id", customer.id)
        .eq("status", "APPROVED")
        .order("created_at", { ascending: true });

      if (approvedError) {
        return { success: false, message: "Error fetching customer visits: " + sanitizeError(approvedError) };
      }

      const totalApproved = (approvedVisits || []).length;
      const required = merchant.visits_required || 10;

      if (totalApproved < required) {
        return {
          success: false,
          message: `Customer has ${totalApproved} approved stamps, but ${required} are required for this reward.`,
        };
      }

      const visitsToBurn = approvedVisits.slice(0, required).map((v) => v.id);

      const { error: burnError } = await db
        .from("visits")
        .update({ status: "REDEEMED" })
        .in("id", visitsToBurn);

      if (burnError) {
        return { success: false, message: "Failed to update visit status: " + sanitizeError(burnError) };
      }

      remainingSurplus = totalApproved - required;

      const voucherHash = crypto
        .createHash("sha256")
        .update(`${merchantId}:${customer.id}:${cleanPin}`)
        .digest("hex");

      await db.from("redemptions").insert({
        merchant_id: merchantId,
        customer_id: customer.id,
        reward_name: merchant.reward_name,
        required_visits: required,
        stamps_consumed: required,
        voucher_code_hash: voucherHash,
        voucher_code_last4: cleanPin.slice(-4),
        status: "REDEEMED",
        redeemed_at: new Date().toISOString(),
        redeemed_by_user_id: user?.id || null,
      });
    }

    if (user) {
      await auditLog({
        userId: user.id,
        action: "reward_redeem",
        resourceType: "merchant",
        resourceId: merchantId,
        metadata: {
          rewardName: merchant.reward_name,
          stampsConsumed: merchant.visits_required,
          surplusStampsSaved: remainingSurplus,
        },
      });
    }

    return {
      success: true,
      message: `✓ Voucher Verified! Please give customer: ${merchant.reward_name}.${
        remainingSurplus > 0 ? ` (${remainingSurplus} surplus stamps saved for next cycle)` : ""
      }`,
    };
  } catch (err: any) {
    return { success: false, message: sanitizeError(err) };
  }
}

/**
 * Fetch pending visits for a merchant with customer phone numbers masked.
 */
export async function getPendingVisits(merchantId: string) {
  try {
    await getAuthenticatedMerchant(merchantId);

    const db = createUnauthenticatedClient();
    const { data, error } = await db
      .from("visits")
      .select("id, customer_id, merchant_id, visit_date_ist, status, created_at, bill_amount, customers (id, phone, full_name)")
      .eq("merchant_id", merchantId)
      .eq("status", "PENDING")
      .order("created_at", { ascending: false });

    if (error) {
      return { visits: [], error: sanitizeError(error) };
    }

    const maskedVisits = (data || []).map((v) => {
      const cust = Array.isArray(v.customers) ? v.customers[0] : v.customers;
      return {
        ...v,
        customers: cust ? { ...cust, phone: maskPhone(cust.phone) } : null,
      };
    });

    return { visits: maskedVisits, error: null };
  } catch (err: any) {
    return { visits: [], error: sanitizeError(err) };
  }
}

/**
 * Fetch complete audit log / ledger for a merchant.
 */
export async function getMerchantLedger(merchantId: string) {
  try {
    await getAuthenticatedMerchant(merchantId);

    const db = createUnauthenticatedClient();
    const { data, error } = await db
      .from("visits")
      .select("id, customer_id, merchant_id, visit_date_ist, status, created_at, bill_amount, customers (id, phone, full_name)")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return { visits: [], error: sanitizeError(error) };
    }

    const maskedVisits = (data || []).map((v) => {
      const cust = Array.isArray(v.customers) ? v.customers[0] : v.customers;
      return {
        ...v,
        customers: cust ? { ...cust, phone: maskPhone(cust.phone) } : null,
      };
    });

    return { visits: maskedVisits, error: null };
  } catch (err: any) {
    return { visits: [], error: sanitizeError(err) };
  }
}

/**
 * Fetches real customer status for a specific merchant (visits count, lock status, reward readiness).
 */
export async function getCustomerMerchantStatus(merchantId: string, customerPhone?: string) {
  try {
    const db = createUnauthenticatedClient();
    const cleanPhone = (customerPhone || "").replace(/\D/g, "");

    let customer: any = null;

    if (cleanPhone && cleanPhone.length === 10) {
      const { data } = await db
        .from("customers")
        .select("id, phone, full_name, email")
        .eq("phone", cleanPhone)
        .maybeSingle();
      customer = data;
    }

    if (!customer) {
      try {
        const authSupabase = await createClient();
        const {
          data: { user },
        } = await authSupabase.auth.getUser();
        if (user) {
          const uPhone = (user.phone || user.user_metadata?.phone || "").replace(/\D/g, "");
          if (uPhone && uPhone.length === 10) {
            const { data } = await db
              .from("customers")
              .select("id, phone, full_name, email")
              .eq("phone", uPhone)
              .maybeSingle();
            customer = data;
          }
          if (!customer && user.id) {
            const { data } = await db
              .from("customers")
              .select("id, phone, full_name, email")
              .eq("auth_id", user.id)
              .maybeSingle();
            customer = data;
          }
          if (!customer && user.email) {
            const { data } = await db
              .from("customers")
              .select("id, phone, full_name, email")
              .eq("email", user.email.toLowerCase())
              .maybeSingle();
            customer = data;
          }
        }
      } catch {
        // Fallback for unauthenticated
      }
    }

    if (!customer) {
      return { customer: null, visitsCount: 0, isLockedToday: false };
    }

    // 1. Check total APPROVED visits for this customer at this merchant
    const { count: visitsCount } = await db
      .from("visits")
      .select("id", { count: "exact", head: true })
      .eq("merchant_id", merchantId)
      .eq("customer_id", customer.id)
      .in("status", ["APPROVED", "PENDING"]);

    // 2. Check if a visit was recorded today in IST
    const todayIST = await getVisitDateIST();
    const { data: todayVisit } = await db
      .from("visits")
      .select("id, status")
      .eq("merchant_id", merchantId)
      .eq("customer_id", customer.id)
      .eq("visit_date_ist", todayIST)
      .maybeSingle();

    return {
      customer: {
        id: customer.id,
        phone: customer.phone,
        displayPhone: maskPhone(customer.phone),
        fullName: customer.full_name,
        email: customer.email,
      },
      visitsCount: visitsCount || 0,
      isLockedToday: Boolean(todayVisit),
      todayVisitStatus: todayVisit?.status || null,
    };
  } catch (err: any) {
    return { customer: null, visitsCount: 0, isLockedToday: false, error: sanitizeError(err) };
  }
}

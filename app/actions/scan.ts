"use server";

import { createClient } from "@/lib/supabase/server";

export interface SubmitScanResult {
  success: boolean;
  locked?: boolean;
  message: string;
  visit?: any;
  error?: string;
}

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
 * Catches code 23505 (unique_daily_scan) to enforce the 12-hour midnight lock.
 */
export async function submitScan(
  customerPhone: string,
  merchantId: string
): Promise<SubmitScanResult> {
  try {
    const supabase = createClient();
    const cleanPhone = customerPhone.replace(/\D/g, "").trim();

    if (!cleanPhone || cleanPhone.length < 10) {
      return {
        success: false,
        locked: false,
        message: "Please enter a valid 10-digit mobile number.",
      };
    }

    if (!merchantId) {
      return {
        success: false,
        locked: false,
        message: "Merchant ID is required.",
      };
    }

    // 1. Query or insert customer in 'customers' table
    let { data: customer, error: fetchCustError } = await supabase
      .from("customers")
      .select("id, phone")
      .eq("phone", cleanPhone)
      .maybeSingle();

    if (!customer) {
      const { data: newCustomer, error: insertCustError } = await supabase
        .from("customers")
        .insert({ phone: cleanPhone })
        .select("id, phone")
        .single();

      if (insertCustError) {
        // If concurrent insert occurred, retry fetch once
        const { data: retryCustomer } = await supabase
          .from("customers")
          .select("id, phone")
          .eq("phone", cleanPhone)
          .maybeSingle();

        if (retryCustomer) {
          customer = retryCustomer;
        } else {
          return {
            success: false,
            locked: false,
            message: "Unable to register customer record: " + insertCustError.message,
            error: insertCustError.message,
          };
        }
      } else {
        customer = newCustomer;
      }
    }

    // 2. Calculate IST visit date (YYYY-MM-DD)
    const visitDateIst = await getVisitDateIST();

    // 3. Attempt insert into 'visits' with status 'PENDING'
    const { data: visit, error: visitError } = await supabase
      .from("visits")
      .insert({
        customer_id: customer.id,
        merchant_id: merchantId,
        visit_date_ist: visitDateIst,
        status: "PENDING",
      })
      .select()
      .single();

    if (visitError) {
      // Postgres error code 23505 = unique_violation (unique_daily_scan)
      const isUniqueConstraint =
        visitError.code === "23505" ||
        visitError.message?.toLowerCase().includes("unique_daily_scan") ||
        visitError.message?.toLowerCase().includes("duplicate key");

      if (isUniqueConstraint) {
        return {
          success: false,
          locked: true,
          message: "Today's visit verified! Next stamp unlocks at 12:00 AM IST.",
        };
      }

      return {
        success: false,
        locked: false,
        message: "Scan verification failed: " + visitError.message,
        error: visitError.message,
      };
    }

    return {
      success: true,
      locked: false,
      visit,
      message: "QR Scanned! Sent to counter terminal for 1-tap verification.",
    };
  } catch (err: any) {
    return {
      success: false,
      locked: false,
      message: err.message || "An unexpected error occurred while processing scan.",
      error: String(err),
    };
  }
}

/**
 * Approve a pending visit from the Shop Owner Terminal.
 */
export async function approveVisit(visitId: string) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("visits")
      .update({ status: "APPROVED" })
      .eq("id", visitId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, visit: data };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Reject a pending visit from the Shop Owner Terminal.
 */
export async function rejectVisit(visitId: string) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("visits")
      .update({ status: "REJECTED" })
      .eq("id", visitId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, visit: data };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Fetch pending visits for a merchant with customer phone numbers.
 */
export async function getPendingVisits(merchantId: string) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("visits")
      .select("id, customer_id, merchant_id, visit_date_ist, status, created_at, customers (id, phone)")
      .eq("merchant_id", merchantId)
      .eq("status", "PENDING")
      .order("created_at", { ascending: false });

    if (error) {
      return { visits: [], error: error.message };
    }
    return { visits: data || [], error: null };
  } catch (err: any) {
    return { visits: [], error: err.message || String(err) };
  }
}

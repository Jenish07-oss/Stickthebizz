import { prisma } from "../config/db.js";
import { getTodayISTDateString } from "../utils/ist.js";
import { cleanIndianPhone, maskPhone, sanitizeString } from "../utils/sanitize.js";
import { broadcastToMerchant, broadcastToCustomer } from "../websocket/terminal.socket.js";
import type { Prisma } from "@prisma/client";

const RECENT_SCANS = new Map<string, number>();

export interface SubmitScanInput {
  customerPhone: string;
  merchantId: string;
  billAmount?: number;
  customerName?: string;
  scannedQrToken?: string;
  idempotencyKey?: string;
  authUserId?: string;
  authUserEmail?: string;
}

export interface SubmitScanResult {
  success: boolean;
  locked?: boolean;
  message: string;
  visit?: any;
  error?: string;
  customerId?: string;
  customer?: {
    id: string;
    phone: string | null;
    fullName: string | null;
  };
}

/**
 * Submits a new scan for a customer at a specific merchant.
 * Enforces 1-scan-per-day IST lock, velocity limits, minimum spend, and WebSocket broadcast.
 */
export async function submitScan(input: SubmitScanInput): Promise<SubmitScanResult> {
  const cleanPhone = cleanIndianPhone(input.customerPhone);
  if (cleanPhone.length !== 10) {
    return {
      success: false,
      locked: false,
      message: "Please enter a valid 10-digit Indian mobile number.",
    };
  }

  // 1. Idempotency Check
  if (input.idempotencyKey) {
    const existingKey = await prisma.idempotencyKey.findUnique({
      where: { key: input.idempotencyKey },
    });
    if (existingKey && existingKey.expiresAt > new Date()) {
      return existingKey.response as unknown as SubmitScanResult;
    }
  }

  // 2. Scan Velocity Guard (60-second limit per phone + merchant)
  const velocityKey = `${cleanPhone}:${input.merchantId}`;
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

  // Lazy cleanup of velocity cache
  if (RECENT_SCANS.size > 2000) {
    RECENT_SCANS.forEach((ts, k) => {
      if (nowMs - ts > 5 * 60 * 1000) RECENT_SCANS.delete(k);
    });
  }

  // 3. Look up merchant & validate anti-replay QR token + subscription
  const merchant = await prisma.merchant.findUnique({
    where: { id: input.merchantId },
  });

  if (!merchant) {
    return { success: false, locked: false, message: "Merchant store not found." };
  }

  if (merchant.subscriptionStatus === "INACTIVE" || merchant.subscriptionStatus === "EXPIRED") {
    return {
      success: false,
      locked: false,
      message: "Merchant subscription is inactive. Counter terminal currently disabled.",
    };
  }

  if (input.scannedQrToken && merchant.qrToken && input.scannedQrToken !== merchant.qrToken) {
    return {
      success: false,
      locked: false,
      message: "QR code has expired. Please scan the current counter QR code.",
    };
  }

  const billAmount = Math.max(Number(merchant.minSpend), Number(input.billAmount) || Number(merchant.minSpend));

  // 4. Find or create Customer record
  let customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { phone: cleanPhone },
        ...(input.authUserEmail ? [{ email: input.authUserEmail.toLowerCase() }] : []),
        ...(input.authUserId ? [{ userId: input.authUserId }] : []),
      ],
    },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        phone: cleanPhone,
        fullName: input.customerName ? sanitizeString(input.customerName) : "Loyal Customer",
        email: input.authUserEmail ? input.authUserEmail.toLowerCase() : null,
        userId: input.authUserId || null,
      },
    });
  } else {
    // Keep customer record synced
    const updates: Prisma.CustomerUpdateInput = {};
    if (!customer.phone && cleanPhone) updates.phone = cleanPhone;
    if (!customer.fullName && input.customerName) updates.fullName = sanitizeString(input.customerName);
    if (!customer.email && input.authUserEmail) updates.email = input.authUserEmail.toLowerCase();
    if (!customer.userId && input.authUserId) updates.user = { connect: { id: input.authUserId } };

    if (Object.keys(updates).length > 0) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: updates,
      });
    }
  }

  // 5. Calculate current IST date string (YYYY-MM-DD)
  const visitDateIst = getTodayISTDateString();

  // 6. Insert Visit with status PENDING, catching 1-scan-per-day unique constraint
  try {
    const visit = await prisma.visit.create({
      data: {
        merchantId: merchant.id,
        customerId: customer.id,
        visitDateIst,
        billAmount,
        status: "PENDING",
      },
    });

    // 7. Realtime WebSockets Broadcasts
    broadcastToMerchant(merchant.id, "checkin.new", {
      visitId: visit.id,
      customerId: customer.id,
      customerName: customer.fullName || "Customer Check-in",
      customerPhone: maskPhone(customer.phone || cleanPhone),
      billAmount,
      timestamp: new Date().toISOString(),
    });

    broadcastToCustomer(customer.id, "scan_submitted", {
      visitId: visit.id,
      merchantId: merchant.id,
      status: "pending",
      timestamp: new Date().toISOString(),
    });

    const successResponse: SubmitScanResult = {
      success: true,
      locked: false,
      message: "✓ Today's stamp punched! Cashier counter notified.",
      visit,
      customerId: customer.id,
      customer: {
        id: customer.id,
        phone: customer.phone,
        fullName: customer.fullName,
      },
    };

    // Save idempotency key if requested
    if (input.idempotencyKey) {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
      await prisma.idempotencyKey.upsert({
        where: { key: input.idempotencyKey },
        update: { response: successResponse as any, expiresAt },
        create: {
          key: input.idempotencyKey,
          action: "submitScan",
          response: successResponse as any,
          expiresAt,
        },
      });
    }

    return successResponse;
  } catch (err: any) {
    // Prisma unique constraint violation code is P2002
    if (err.code === "P2002") {
      const lockedResponse: SubmitScanResult = {
        success: false,
        locked: true,
        message: "Today's visit verified! Next stamp unlocks strictly at 12:00:00 AM IST.",
        customerId: customer.id,
        customer: {
          id: customer.id,
          phone: customer.phone,
          fullName: customer.fullName,
        },
      };

      if (input.idempotencyKey) {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await prisma.idempotencyKey.upsert({
          where: { key: input.idempotencyKey },
          update: { response: lockedResponse as any, expiresAt },
          create: {
            key: input.idempotencyKey,
            action: "submitScan",
            response: lockedResponse as any,
            expiresAt,
          },
        });
      }

      return lockedResponse;
    }

    throw err;
  }
}

/**
 * Approve a pending visit from the Shop Owner Terminal (1-tap approval).
 */
export async function approveVisit(visitId: string, merchantOwnerUserId?: string) {
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: {
      merchant: true,
      customer: true,
    },
  });

  if (!visit) {
    return { success: false, error: "VISIT_NOT_FOUND", message: "Visit check-in not found." };
  }

  if (merchantOwnerUserId && visit.merchant.ownerId !== merchantOwnerUserId) {
    return { success: false, error: "FORBIDDEN", message: "You do not own this counter terminal." };
  }

  if (visit.status === "APPROVED") {
    return { success: true, visit, message: "Visit already approved." };
  }

  const updatedVisit = await prisma.visit.update({
    where: { id: visitId },
    data: { status: "APPROVED" },
  });

  // Calculate updated approved stamps for customer at this merchant
  const approvedCount = await prisma.visit.count({
    where: {
      merchantId: visit.merchantId,
      customerId: visit.customerId,
      status: "APPROVED",
    },
  });

  const reqStamps = visit.merchant.visitsRequired || 10;
  const isRewardReady = approvedCount >= reqStamps;

  // Realtime Broadcasts
  broadcastToCustomer(visit.customerId, "checkin.approved", {
    visitId,
    status: "approved",
    newStampCount: approvedCount,
    rewardReady: isRewardReady,
    rewardTitle: visit.merchant.rewardName,
    timestamp: new Date().toISOString(),
  });

  broadcastToMerchant(visit.merchantId, "checkin.approved", {
    visitId,
    action: "approved",
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    visit: updatedVisit,
    approvedCount,
    rewardReady: isRewardReady,
    message: "✓ Visit approved! Customer stamp count incremented.",
  };
}

/**
 * Reject a pending visit from the Shop Owner Terminal.
 */
export async function rejectVisit(visitId: string, merchantOwnerUserId?: string) {
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: {
      merchant: true,
    },
  });

  if (!visit) {
    return { success: false, error: "VISIT_NOT_FOUND", message: "Visit check-in not found." };
  }

  if (merchantOwnerUserId && visit.merchant.ownerId !== merchantOwnerUserId) {
    return { success: false, error: "FORBIDDEN", message: "You do not own this counter terminal." };
  }

  if (visit.status === "REJECTED") {
    return { success: true, visit, message: "Visit already rejected." };
  }

  const updatedVisit = await prisma.visit.update({
    where: { id: visitId },
    data: { status: "REJECTED" },
  });

  broadcastToCustomer(visit.customerId, "checkin.rejected", {
    visitId,
    status: "rejected",
    timestamp: new Date().toISOString(),
  });

  broadcastToMerchant(visit.merchantId, "checkin.rejected", {
    visitId,
    action: "rejected",
    timestamp: new Date().toISOString(),
  });

  return { success: true, visit: updatedVisit, message: "Visit check-in rejected." };
}

/**
 * Verify 4-digit PIN for reward voucher redemption and burn stamps.
 */
export async function verifyRedemptionPin(params: {
  merchantId: string;
  pin: string;
  customerPhone?: string;
  merchantOwnerUserId?: string;
}) {
  const cleanPin = params.pin.trim();
  const merchant = await prisma.merchant.findUnique({
    where: { id: params.merchantId },
  });

  if (!merchant) {
    return { success: false, message: "Merchant record not found." };
  }

  if (params.merchantOwnerUserId && merchant.ownerId !== params.merchantOwnerUserId) {
    return { success: false, message: "Unauthorized: not the owner of this counter." };
  }

  if (!merchant.redemptionPin) {
    return { success: false, message: "Merchant PIN not configured. Please set your 4-digit PIN." };
  }

  if (cleanPin !== merchant.redemptionPin) {
    return { success: false, message: "Invalid 4-digit Voucher PIN. Check customer phone." };
  }

  let remainingSurplus = 0;

  if (params.customerPhone) {
    const cleanPhone = cleanIndianPhone(params.customerPhone);
    const customer = await prisma.customer.findFirst({
      where: { phone: cleanPhone },
    });

    if (!customer) {
      return { success: false, message: "Customer account not found for this phone number." };
    }

    const approvedVisits = await prisma.visit.findMany({
      where: {
        merchantId: merchant.id,
        customerId: customer.id,
        status: "APPROVED",
      },
      orderBy: { createdAt: "asc" },
    });

    const totalApproved = approvedVisits.length;
    const required = merchant.visitsRequired || 10;

    if (totalApproved < required) {
      return {
        success: false,
        message: `Customer has ${totalApproved} approved stamps, but ${required} are required for this reward.`,
      };
    }

    const visitsToBurn = approvedVisits.slice(0, required).map((v: any) => v.id);

    // Burn stamps by updating status to REDEEMED
    await prisma.visit.updateMany({
      where: { id: { in: visitsToBurn } },
      data: { status: "REDEEMED" },
    });

    remainingSurplus = totalApproved - required;

    // Record Redemption
    await prisma.redemption.create({
      data: {
        merchantId: merchant.id,
        customerId: customer.id,
        rewardName: merchant.rewardName,
        stampsBurned: required,
      },
    });

    // Realtime broadcast to customer
    broadcastToCustomer(customer.id, "reward_burned", {
      rewardTitle: merchant.rewardName,
      shopName: merchant.name,
      remainingSurplus,
      timestamp: new Date().toISOString(),
    });

    broadcastToMerchant(merchant.id, "ledger_updated", {
      action: "redeemed",
      timestamp: new Date().toISOString(),
    });
  }

  return {
    success: true,
    message: `✓ Voucher Verified! Please give customer: ${merchant.rewardName}.${
      remainingSurplus > 0 ? ` (${remainingSurplus} surplus stamps saved for next cycle)` : ""
    }`,
    remainingSurplus,
  };
}

/**
 * Fetch pending visits for merchant queue with masked phone numbers.
 */
export async function getPendingVisits(merchantId: string) {
  const visits = await prisma.visit.findMany({
    where: {
      merchantId,
      status: "PENDING",
    },
    include: {
      customer: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const masked = visits.map((v: any) => ({
    id: v.id,
    customerId: v.customerId,
    merchantId: v.merchantId,
    visitDateIst: v.visitDateIst,
    status: v.status,
    billAmount: Number(v.billAmount),
    createdAt: v.createdAt,
    customer: v.customer
      ? {
          id: v.customer.id,
          fullName: v.customer.fullName,
          phone: maskPhone(v.customer.phone || ""),
        }
      : null,
  }));

  return { visits: masked };
}

/**
 * Fetch audit ledger visits for a merchant with masked phone numbers.
 */
export async function getMerchantLedger(merchantId: string, limit: number = 50) {
  const visits = await prisma.visit.findMany({
    where: { merchantId },
    include: {
      customer: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const masked = visits.map((v: any) => ({
    id: v.id,
    customerId: v.customerId,
    merchantId: v.merchantId,
    visitDateIst: v.visitDateIst,
    status: v.status,
    billAmount: Number(v.billAmount),
    createdAt: v.createdAt,
    customer: v.customer
      ? {
          id: v.customer.id,
          fullName: v.customer.fullName,
          phone: maskPhone(v.customer.phone || ""),
        }
      : null,
  }));

  return { visits: masked };
}

/**
 * Fetches real customer status for a specific merchant (visits count, lock status, reward readiness).
 */
export async function getCustomerMerchantStatus(params: {
  merchantId: string;
  customerPhone?: string;
  userId?: string;
  email?: string;
}) {
  const cleanPhone = params.customerPhone ? cleanIndianPhone(params.customerPhone) : "";

  const customer = await prisma.customer.findFirst({
    where: {
      OR: [
        ...(cleanPhone.length === 10 ? [{ phone: cleanPhone }] : []),
        ...(params.userId ? [{ userId: params.userId }] : []),
        ...(params.email ? [{ email: params.email.toLowerCase() }] : []),
      ],
    },
  });

  if (!customer) {
    return {
      customer: null,
      visitsCount: 0,
      isLockedToday: false,
      todayVisitStatus: null,
    };
  }

  // Count approved and pending visits
  const visitsCount = await prisma.visit.count({
    where: {
      merchantId: params.merchantId,
      customerId: customer.id,
      status: { in: ["APPROVED", "PENDING"] },
    },
  });

  // Check if today has a visit in IST
  const todayIST = getTodayISTDateString();
  const todayVisit = await prisma.visit.findFirst({
    where: {
      merchantId: params.merchantId,
      customerId: customer.id,
      visitDateIst: todayIST,
    },
    select: { id: true, status: true },
  });

  return {
    customer: {
      id: customer.id,
      phone: customer.phone,
      displayPhone: maskPhone(customer.phone || ""),
      fullName: customer.fullName,
      email: customer.email,
    },
    visitsCount,
    isLockedToday: Boolean(todayVisit),
    todayVisitStatus: todayVisit?.status || null,
  };
}


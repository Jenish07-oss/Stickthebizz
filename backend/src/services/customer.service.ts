import { prisma } from "../config/db.js";
import { getTodayISTDateString } from "../utils/ist.js";
import { cleanIndianPhone, sanitizeString } from "../utils/sanitize.js";

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
  createdAt: Date;
}

export interface CustomerWalletData {
  customer: {
    id: string;
    phone: string | null;
    fullName: string | null;
    email: string | null;
  } | null;
  passes: CustomerStorePass[];
  history: CustomerVisitRecord[];
}

/**
 * Returns complete customer wallet (all store passes, stamp counts, daily lock state, and visit ledger).
 */
export async function getCustomerWallet(params: {
  userId?: string;
  email?: string;
  phone?: string;
}): Promise<CustomerWalletData> {
  const cleanPhone = params.phone ? cleanIndianPhone(params.phone) : "";

  // 1. Locate customer
  let customer = await prisma.customer.findFirst({
    where: {
      OR: [
        ...(cleanPhone.length === 10 ? [{ phone: cleanPhone }] : []),
        ...(params.userId ? [{ userId: params.userId }] : []),
        ...(params.email ? [{ email: params.email.toLowerCase() }] : []),
      ],
    },
  });

  // If user is authenticated but has no customer record, create one
  if (!customer && params.userId) {
    const user = await prisma.user.findUnique({ where: { id: params.userId } });
    if (user) {
      customer = await prisma.customer.create({
        data: {
          userId: user.id,
          email: user.email,
          phone: user.phone || (cleanPhone.length === 10 ? cleanPhone : null),
          fullName: user.fullName || "Loyal Customer",
        },
      });
    }
  }

  // 2. Fetch all merchants
  const merchants = await prisma.merchant.findMany({
    where: {
      subscriptionStatus: { in: ["ACTIVE", "GRACE_PERIOD"] },
    },
    orderBy: { createdAt: "asc" },
  });

  const todayIST = getTodayISTDateString();

  if (!customer) {
    const emptyPasses: CustomerStorePass[] = merchants.map((m) => ({
      merchantId: m.id,
      merchantName: m.name,
      merchantSlug: m.slug,
      category: m.category,
      minSpend: Number(m.minSpend),
      visitsRequired: m.visitsRequired,
      rewardName: m.rewardName,
      validityDays: m.validityDays,
      visitsCount: 0,
      displayVisits: 0,
      progressPercent: 0,
      status: "COLLECTING",
      isLockedToday: false,
      daysRemaining: m.validityDays,
      lastVisitDate: null,
    }));

    return {
      customer: null,
      passes: emptyPasses,
      history: [],
    };
  }

  // 3. Fetch all visits for this customer
  const visits = await prisma.visit.findMany({
    where: { customerId: customer.id },
    include: { merchant: true },
    orderBy: { createdAt: "desc" },
  });

  const merchantVisitsMap = new Map<string, typeof visits>();
  visits.forEach((v) => {
    if (!merchantVisitsMap.has(v.merchantId)) {
      merchantVisitsMap.set(v.merchantId, []);
    }
    merchantVisitsMap.get(v.merchantId)!.push(v);
  });

  const passes: CustomerStorePass[] = merchants.map((m) => {
    const mVisits = merchantVisitsMap.get(m.id) || [];
    const approvedVisits = mVisits.filter(
      (v) => v.status === "APPROVED" || v.status === "REDEEMED"
    );

    const visitsCount = approvedVisits.length;
    const displayVisits = Math.min(visitsCount, m.visitsRequired);
    const hasScannedToday = mVisits.some(
      (v) => v.visitDateIst === todayIST && v.status !== "REJECTED"
    );

    let status: "COLLECTING" | "REWARD READY" | "LOCKED UNTIL 12:00 AM IST" = "COLLECTING";
    if (displayVisits >= m.visitsRequired) {
      status = "REWARD READY";
    } else if (hasScannedToday) {
      status = "LOCKED UNTIL 12:00 AM IST";
    }

    return {
      merchantId: m.id,
      merchantName: m.name,
      merchantSlug: m.slug,
      category: m.category,
      minSpend: Number(m.minSpend),
      visitsRequired: m.visitsRequired,
      rewardName: m.rewardName,
      validityDays: m.validityDays,
      visitsCount,
      displayVisits,
      progressPercent: Math.round((displayVisits / m.visitsRequired) * 100),
      status,
      isLockedToday: hasScannedToday,
      daysRemaining: m.validityDays,
      lastVisitDate: mVisits[0]?.visitDateIst || null,
    };
  });

  const history: CustomerVisitRecord[] = visits.map((v) => ({
    id: v.id,
    merchantName: v.merchant.name,
    merchantSlug: v.merchant.slug,
    visitDate: v.visitDateIst,
    billAmount: Number(v.billAmount),
    status: v.status === "APPROVED" ? "Approved" : v.status === "REDEEMED" ? "Redeemed" : v.status,
    createdAt: v.createdAt,
  }));

  return {
    customer: {
      id: customer.id,
      phone: customer.phone,
      fullName: customer.fullName,
      email: customer.email,
    },
    passes,
    history,
  };
}

/**
 * Updates customer profile (name and phone number).
 */
export async function updateCustomerProfile(params: {
  userId: string;
  fullName: string;
  phone: string;
}) {
  const cleanPhone = cleanIndianPhone(params.phone);
  if (cleanPhone.length !== 10) {
    throw new Error("Please enter a valid 10-digit Indian mobile number.");
  }

  const cleanName = sanitizeString(params.fullName.trim());
  if (!cleanName) {
    throw new Error("Full name is required.");
  }

  const user = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!user) {
    throw new Error("User session not found.");
  }

  // Update user phone & full name
  await prisma.user.update({
    where: { id: user.id },
    data: {
      fullName: cleanName,
      phone: cleanPhone,
    },
  });

  // Upsert customer record
  const customer = await prisma.customer.upsert({
    where: { userId: user.id },
    update: {
      fullName: cleanName,
      phone: cleanPhone,
      email: user.email,
    },
    create: {
      userId: user.id,
      fullName: cleanName,
      phone: cleanPhone,
      email: user.email,
    },
  });

  return { success: true, customer };
}

/**
 * Synchronize / link sibling customer records by email/phone.
 */
export async function syncCustomerAccount(params: {
  userId: string;
  phone?: string;
  email?: string;
  fullName?: string;
}) {
  const user = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!user) throw new Error("User not found.");

  const cleanPhone = params.phone ? cleanIndianPhone(params.phone) : undefined;
  const cleanName = params.fullName ? sanitizeString(params.fullName) : undefined;
  const cleanEmail = params.email ? params.email.trim().toLowerCase() : user.email;

  const customer = await prisma.customer.upsert({
    where: { userId: user.id },
    update: {
      ...(cleanPhone && cleanPhone.length === 10 ? { phone: cleanPhone } : {}),
      ...(cleanName ? { fullName: cleanName } : {}),
      email: cleanEmail,
    },
    create: {
      userId: user.id,
      phone: cleanPhone && cleanPhone.length === 10 ? cleanPhone : null,
      email: cleanEmail,
      fullName: cleanName || user.fullName || "Loyal Customer",
    },
  });

  return { success: true, customer };
}

/**
 * DPDP Act 2023: Customer Data Portability (Export My Data).
 */
export async function exportCustomerData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      customer: {
        include: {
          visits: {
            include: { merchant: true },
            orderBy: { createdAt: "desc" },
          },
          redemptions: {
            include: { merchant: true },
            orderBy: { redeemedAt: "desc" },
          },
        },
      },
    },
  });

  if (!user || !user.customer) {
    throw new Error("Customer profile not found.");
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorType: "CUSTOMER",
      actorId: user.id,
      action: "CUSTOMER_DATA_EXPORT",
      resourceId: user.customer.id,
    },
  });

  return {
    exportTimestamp: new Date().toISOString(),
    complianceStandard: "India Digital Personal Data Protection (DPDP) Act 2023",
    customerProfile: {
      id: user.customer.id,
      phone: user.customer.phone,
      fullName: user.customer.fullName,
      email: user.customer.email,
      memberSince: user.customer.createdAt,
    },
    visitsHistory: user.customer.visits.map((v) => ({
      id: v.id,
      merchantName: v.merchant.name,
      merchantSlug: v.merchant.slug,
      visitDateIst: v.visitDateIst,
      billAmount: Number(v.billAmount),
      status: v.status,
      createdAt: v.createdAt,
    })),
    rewardRedemptions: user.customer.redemptions.map((r) => ({
      id: r.id,
      merchantName: r.merchant.name,
      rewardName: r.rewardName,
      stampsBurned: r.stampsBurned,
      redeemedAt: r.redeemedAt,
    })),
  };
}

/**
 * DPDP Act 2023: Right to be Forgotten (Account Deletion & Safe Anonymization).
 * Anonymizes PII while preserving audit/accounting ledger integrity.
 */
export async function deleteCustomerAccount(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { customer: true },
  });

  if (!user) throw new Error("User not found.");

  if (user.customer) {
    const anonPhone = `DEL_${Math.random().toString(36).substring(2, 10)}`;
    await prisma.customer.update({
      where: { id: user.customer.id },
      data: {
        phone: anonPhone,
        fullName: "Deleted Customer",
        email: null,
        userId: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorType: "CUSTOMER",
        actorId: user.id,
        action: "CUSTOMER_ACCOUNT_DELETE",
        resourceId: user.customer.id,
      },
    });
  }

  // Delete all active sessions
  await prisma.session.deleteMany({ where: { userId: user.id } });

  // Delete user record
  await prisma.user.delete({ where: { id: user.id } });

  return {
    success: true,
    message: "Your account and personal data have been permanently anonymized per DPDP Act 2023.",
  };
}


import { prisma } from "../config/db.js";
import { sanitizeString } from "../utils/sanitize.js";
import { broadcastToMerchant } from "../websocket/terminal.socket.js";
import type { Prisma } from "@prisma/client";

export interface UpdateMerchantRulesInput {
  merchantId: string;
  ownerUserId: string;
  name?: string;
  category?: string;
  minSpend?: number;
  visitsRequired?: number;
  rewardName?: string;
  validityDays?: number;
  redemptionPin?: string;
}

/**
 * Fetches merchant profile for the authenticated shop owner.
 */
export async function getMerchantProfile(ownerUserId: string) {
  const merchant = await prisma.merchant.findFirst({
    where: { ownerId: ownerUserId },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          phone: true,
          fullName: true,
        },
      },
    },
  });

  return merchant;
}

/**
 * Public lookup of merchant by unique slug (for standee QR pass scanning).
 */
export async function getMerchantBySlug(slug: string) {
  const merchant = await prisma.merchant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      minSpend: true,
      visitsRequired: true,
      rewardName: true,
      validityDays: true,
      qrToken: true,
      subscriptionStatus: true,
    },
  });

  return merchant;
}

/**
 * Updates merchant loyalty rules (min spend, visits required, reward name, PIN, etc.).
 */
export async function updateMerchantRules(input: UpdateMerchantRulesInput) {
  const merchant = await prisma.merchant.findUnique({
    where: { id: input.merchantId },
  });

  if (!merchant) throw new Error("Merchant store not found.");
  if (merchant.ownerId !== input.ownerUserId) {
    throw new Error("Unauthorized: you do not own this merchant counter.");
  }

  const data: Prisma.MerchantUpdateInput = {};
  if (input.name) data.name = sanitizeString(input.name);
  if (input.category) data.category = sanitizeString(input.category);
  if (input.minSpend !== undefined) data.minSpend = input.minSpend;
  if (input.visitsRequired !== undefined) data.visitsRequired = input.visitsRequired;
  if (input.rewardName) data.rewardName = sanitizeString(input.rewardName);
  if (input.validityDays !== undefined) data.validityDays = input.validityDays;
  if (input.redemptionPin && /^\d{4}$/.test(input.redemptionPin)) {
    data.redemptionPin = input.redemptionPin;
  }

  const updated = await prisma.merchant.update({
    where: { id: merchant.id },
    data,
  });

  await prisma.auditLog.create({
    data: {
      actorType: "MERCHANT",
      actorId: input.ownerUserId,
      action: "MERCHANT_RULES_UPDATE",
      resourceId: merchant.id,
      details: data as any,
    },
  });

  return updated;
}

/**
 * Rotates merchant QR code for a fresh 30-day / 1-month cycle.
 */
export async function rotateMerchantQrCode(merchantId: string, ownerUserId: string) {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
  });

  if (!merchant) throw new Error("Merchant store not found.");
  if (merchant.ownerId !== ownerUserId) {
    throw new Error("Unauthorized: you do not own this merchant counter.");
  }

  const now = new Date();
  const monthCycle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${Math.random().toString(36).substring(2, 6)}`;

  const updated = await prisma.merchant.update({
    where: { id: merchantId },
    data: {
      qrToken: monthCycle,
      validityDays: 30,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: "MERCHANT",
      actorId: ownerUserId,
      action: "MERCHANT_QR_ROTATE",
      resourceId: merchantId,
      details: { newCycle: monthCycle },
    },
  });

  broadcastToMerchant(merchantId, "qr_rotated", {
    newCycle: monthCycle,
    timestamp: new Date().toISOString(),
  });

  return updated;
}

/**
 * Updates merchant 4-digit cashier redemption PIN.
 */
export async function updateTerminalPin(merchantId: string, ownerUserId: string, pin: string) {
  const cleanPin = pin.trim();
  if (!/^\d{4}$/.test(cleanPin)) {
    throw new Error("Voucher redemption PIN must be exactly 4 digits.");
  }

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
  });

  if (!merchant) throw new Error("Merchant store not found.");
  if (merchant.ownerId !== ownerUserId) {
    throw new Error("Unauthorized: you do not own this merchant counter.");
  }

  const updated = await prisma.merchant.update({
    where: { id: merchantId },
    data: { redemptionPin: cleanPin },
  });

  await prisma.auditLog.create({
    data: {
      actorType: "MERCHANT",
      actorId: ownerUserId,
      action: "MERCHANT_PIN_UPDATE",
      resourceId: merchantId,
    },
  });

  return updated;
}


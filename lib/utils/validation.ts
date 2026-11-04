import { z } from "zod";

/**
 * Validates 10-digit Indian mobile number format (starts with 6, 7, 8, or 9).
 */
export const phoneSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/\D/g, ""))
  .refine((val) => /^[6-9]\d{9}$/.test(val), {
    message: "Mobile number must be a valid 10-digit Indian phone starting with 6-9.",
  });

/**
 * Validates exactly 4 numeric digits for cashier redemption PIN.
 */
export const pinSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, "PIN must be exactly 4 numeric digits.");

/**
 * Standard UUIDv4 format.
 */
export const uuidSchema = z
  .string()
  .trim()
  .uuid("Identifier must be a valid UUID.");

/**
 * Bill amount must be between ₹10 and ₹1,00,000.
 */
export const billAmountSchema = z
  .number()
  .min(10, "Minimum spend amount is ₹10.")
  .max(100000, "Maximum allowed spend amount is ₹1,00,000.");

/**
 * Schema for submitting a customer QR scan.
 */
export const submitScanSchema = z
  .object({
    customerPhone: phoneSchema,
    merchantId: uuidSchema,
    billAmount: billAmountSchema.optional().default(100),
    customerName: z.string().trim().max(100).optional(),
    scannedQrToken: z.string().trim().min(4).max(64).optional(),
    idempotencyKey: z.string().trim().uuid().optional(),
  })
  .strict();

/**
 * Schema for merchant visit approval/rejection.
 */
export const visitActionSchema = z
  .object({
    visitId: uuidSchema,
    idempotencyKey: z.string().trim().uuid().optional(),
  })
  .strict();

/**
 * Schema for voucher redemption.
 */
export const verifyRedemptionSchema = z
  .object({
    merchantId: uuidSchema,
    pin: pinSchema,
    customerPhone: phoneSchema.optional(),
    idempotencyKey: z.string().trim().uuid().optional(),
  })
  .strict();

/**
 * Schema for merchant rule updates.
 */
export const updateMerchantRuleSchema = z
  .object({
    merchantId: uuidSchema,
    name: z.string().trim().min(2, "Name must be at least 2 chars.").max(80, "Name cannot exceed 80 chars."),
    category: z.string().trim().max(60).optional(),
    minSpend: billAmountSchema,
    visitsRequired: z.number().int().min(3, "Minimum 3 visits.").max(50, "Maximum 50 visits."),
    rewardName: z.string().trim().min(2, "Reward name too short.").max(80, "Reward name cannot exceed 80 chars."),
    validityDays: z.number().int().min(7, "Minimum 7 days.").max(365, "Maximum 365 days."),
    redemptionPin: pinSchema.optional(),
  })
  .strict();

/**
 * Schema for OTP request.
 */
export const otpRequestSchema = z
  .object({
    phone: phoneSchema,
  })
  .strict();

/**
 * Schema for OTP verification.
 */
export const otpVerifySchema = z
  .object({
    phone: phoneSchema,
    otp: z.string().trim().regex(/^\d{6}$/, "OTP must be exactly 6 digits."),
  })
  .strict();

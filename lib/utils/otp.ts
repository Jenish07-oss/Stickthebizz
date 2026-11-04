import crypto from "crypto";

interface OtpRecord {
  hash: string;
  expiresAt: number;
  attempts: number;
  consumed: boolean;
}

// In-memory fallback OTP storage (per-runtime instance)
// In serverless, Supabase Auth handles OTPs, but this utility provides
// cryptographic hashing, pepper verification, rate-limiting, and brute-force lockout.
const OTP_STORE = new Map<string, OtpRecord>();

// Pepper secret for OTP hashing
const OTP_PEPPER = process.env.OTP_PEPPER || "stickthebizz_secure_otp_pepper_2026";

/**
 * Computes a secure SHA-256 hash of an OTP using a server-side pepper and normalized phone.
 */
export function hashOtp(phone: string, otp: string): string {
  const normalizedPhone = phone.replace(/\D/g, "");
  return crypto
    .createHmac("sha256", OTP_PEPPER)
    .update(`${normalizedPhone}:${otp}`)
    .digest("hex");
}

/**
 * Generates a cryptographically random 6-digit numeric OTP.
 */
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Stores an OTP with 3-minute expiry and zero attempts.
 */
export function storeOtp(phone: string, otp: string): { expiresAt: Date } {
  const normalizedPhone = phone.replace(/\D/g, "");
  const hash = hashOtp(normalizedPhone, otp);
  const expiresAt = Date.now() + 3 * 60 * 1000; // 3 minutes

  OTP_STORE.set(normalizedPhone, {
    hash,
    expiresAt,
    attempts: 0,
    consumed: false,
  });

  return { expiresAt: new Date(expiresAt) };
}

export interface VerifyOtpResult {
  valid: boolean;
  locked?: boolean;
  reason?: "EXPIRED" | "MAX_ATTEMPTS" | "INVALID" | "ALREADY_CONSUMED" | "NOT_FOUND";
}

/**
 * Verifies an OTP against its stored hash.
 * Enforces:
 * - 3-minute expiry
 * - Single-use consumption
 * - 5-attempt brute-force lockout
 */
export function verifySecureOtp(phone: string, inputOtp: string): VerifyOtpResult {
  const normalizedPhone = phone.replace(/\D/g, "");
  const record = OTP_STORE.get(normalizedPhone);

  if (!record) {
    return { valid: false, reason: "NOT_FOUND" };
  }

  if (record.consumed) {
    return { valid: false, reason: "ALREADY_CONSUMED" };
  }

  if (Date.now() > record.expiresAt) {
    OTP_STORE.delete(normalizedPhone);
    return { valid: false, reason: "EXPIRED" };
  }

  if (record.attempts >= 5) {
    OTP_STORE.delete(normalizedPhone);
    return { valid: false, locked: true, reason: "MAX_ATTEMPTS" };
  }

  const computedHash = hashOtp(normalizedPhone, inputOtp);
  const isValid = crypto.timingSafeEqual(
    Buffer.from(computedHash, "utf8"),
    Buffer.from(record.hash, "utf8")
  );

  if (!isValid) {
    record.attempts += 1;
    if (record.attempts >= 5) {
      OTP_STORE.delete(normalizedPhone);
      return { valid: false, locked: true, reason: "MAX_ATTEMPTS" };
    }
    return { valid: false, reason: "INVALID" };
  }

  // Mark consumed immediately (single-use)
  record.consumed = true;
  OTP_STORE.delete(normalizedPhone);
  return { valid: true };
}


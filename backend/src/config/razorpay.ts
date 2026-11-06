import crypto from "crypto";
import Razorpay from "razorpay";
import { env } from "./env.js";

let razorpayInstance: Razorpay | null = null;

/**
 * Returns initialized Razorpay instance if API keys are configured.
 */
export function getRazorpayClient(): Razorpay | null {
  if (razorpayInstance) return razorpayInstance;

  const keyId = process.env.RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  return razorpayInstance;
}

/**
 * Verifies Razorpay HMAC SHA256 payment signature (orderId|paymentId).
 */
export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    console.warn("[RAZORPAY] RAZORPAY_KEY_SECRET not set in environment.");
    return false;
  }

  try {
    const body = `${params.orderId}|${params.paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, "utf-8");
    const actualBuf = Buffer.from(params.signature, "utf-8");

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch (err) {
    console.error("[RAZORPAY] Signature verification error:", err);
    return false;
  }
}

/**
 * Verifies Razorpay Webhook HMAC SHA256 signature against the raw body.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string | Buffer,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[RAZORPAY] RAZORPAY_WEBHOOK_SECRET not set in environment.");
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, "utf-8");
    const actualBuf = Buffer.from(signature, "utf-8");

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch (err) {
    console.error("[RAZORPAY WEBHOOK] Signature verification error:", err);
    return false;
  }
}

import crypto from "crypto";
import { Buffer } from "buffer";
import { prisma } from "../config/db";
import { env } from "../config/env";
import { EmailService } from "./email.service";

// In-process concurrency queue per email to serialize simultaneous requests within this Node process
const inFlightEmailRequests = new Map<string, Promise<void>>();

async function acquireEmailLock(email: string): Promise<() => void> {
  while (inFlightEmailRequests.has(email)) {
    try {
      await inFlightEmailRequests.get(email);
    } catch {
      // Proceed on previous error
    }
  }
  let release: () => void = () => {};
  const lockPromise = new Promise<void>((resolve) => {
    release = () => {
      inFlightEmailRequests.delete(email);
      resolve();
    };
  });
  inFlightEmailRequests.set(email, lockPromise);
  return release;
}

function redactEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return "***@***";
  const name = parts[0];
  const domain = parts[1];
  const redactedName = name.length <= 2 ? name[0] + "*" : name[0] + "***" + name[name.length - 1];
  return `${redactedName}@${domain}`;
}

export class OtpService {
  /**
   * Explicit test configuration: only when explicitly set to true in non-production tests
   * will advisory-lock acquisition be bypassed. Defaults to false.
   */
  public static bypassAdvisoryLockForTesting: boolean = false;

  /**
   * Computes HMAC-SHA256 hash using the server OTP_SECRET
   */
  private static hashOtp(email: string, code: string): string {
    const data = `${email.trim().toLowerCase()}:${code.trim()}`;
    return crypto.createHmac("sha256", env.OTP_SECRET).update(data).digest("hex");
  }

  /**
   * Generates a cryptographically random 6-digit numeric OTP
   */
  private static generateNumericCode(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Creates, hashes, persists, and emails a 6-digit verification code with 5-min TTL
   * Enforces a 60-second database-backed cooldown per email address.
   */
  static async requestOtp(email: string): Promise<{
    success: boolean;
    message: string;
    statusCode?: number;
    isTestAccount?: boolean;
  }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, message: "Please provide a valid email address." };
    }

    const releaseLock = await acquireEmailLock(cleanEmail);

    try {
      const COOLDOWN_SECONDS = 60;
      const sixtySecondsAgo = new Date(Date.now() - COOLDOWN_SECONDS * 1000);

      // Execute concurrency-safe cooldown check and persistence inside a single transaction
      const txResult = await prisma.$transaction(async (tx) => {
        const isProduction = env.APP_ENV === "production";

        // Inter-process PostgreSQL transaction advisory lock enforcement
        if (typeof (tx as any).$queryRaw !== "function") {
          if (isProduction || !OtpService.bypassAdvisoryLockForTesting) {
            console.error(`[SECURITY] Advisory lock API ($queryRaw) is unavailable on transaction client`);
            return { isLockError: true as const };
          }
        } else if (!OtpService.bypassAdvisoryLockForTesting || isProduction) {
          try {
            const lockKey = `otp_cooldown:${cleanEmail}`;
            await (tx as any).$queryRaw`
              WITH lock_acq AS (
                SELECT pg_advisory_xact_lock(hashtext(${lockKey})) AS _lock
              )
              SELECT 1 AS locked FROM lock_acq;
            `;
          } catch (lockError: any) {
            const safeIdentifier = redactEmail(cleanEmail);
            console.error(`[SECURITY] Failed to acquire OTP advisory lock for ${safeIdentifier}:`, lockError?.message || lockError);
            if (isProduction || !OtpService.bypassAdvisoryLockForTesting) {
              return {
                isLockError: true as const,
              };
            }
          }
        }

        // 1. Check if an active/eligible OTP was created for this email within the last 60 seconds
        const recentOtp = await tx.otpCode.findFirst({
          where: {
            email: cleanEmail,
            createdAt: {
              gte: sixtySecondsAgo,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        if (recentOtp) {
          const elapsedMs = Date.now() - recentOtp.createdAt.getTime();
          const remainingSeconds = Math.max(1, Math.ceil((COOLDOWN_SECONDS * 1000 - elapsedMs) / 1000));
          return {
            isCooldown: true as const,
            remainingSeconds,
          };
        }

        // Live testing shortcut account - strictly disabled in production
        const isTestEmail = cleanEmail === "test.customer@stickthebizz.in" || cleanEmail === "demo.customer@stickthebizz.in";
        const isTestAccount = isTestEmail && !isProduction;

        const code = isTestAccount ? "123456" : OtpService.generateNumericCode();
        const codeHash = OtpService.hashOtp(cleanEmail, code);
        const fiveMinutesAhead = new Date(Date.now() + 5 * 60 * 1000);

        // Invalidate existing pending OTPs for this email to prevent replay attacks
        await tx.otpCode.updateMany({
          where: {
            email: cleanEmail,
            consumed: false,
          },
          data: {
            consumed: true,
          },
        });

        // Store new hashed OTP record
        const createdOtp = await tx.otpCode.create({
          data: {
            email: cleanEmail,
            codeHash,
            expiresAt: fiveMinutesAhead,
          },
        });

        return {
          isCooldown: false as const,
          code,
          isTestAccount,
          otpId: createdOtp.id,
        };
      });

      if ("isLockError" in txResult && txResult.isLockError) {
        return {
          success: false,
          statusCode: 503,
          message: "Authentication service is temporarily unavailable. Please try again in a few moments.",
        };
      }

      if ("isCooldown" in txResult && txResult.isCooldown) {
        return {
          success: false,
          message: `Please wait ${txResult.remainingSeconds} second${txResult.remainingSeconds === 1 ? "" : "s"} before requesting a new verification code.`,
        };
      }

      // Send email via Resend only AFTER cooldown validation and database record creation
      let emailResult: any = null;
      if (!txResult.isTestAccount && txResult.code) {
        emailResult = await EmailService.sendOtpEmail(cleanEmail, txResult.code);

        if (!emailResult.success) {
          // Invalidate newly created OTP strictly by unique record id so that an undelivered code cannot be exploited,
          // while ensuring we never inadvertently consume an OTP created by a newer concurrent request.
          try {
            await prisma.otpCode.updateMany({
              where: {
                id: txResult.otpId,
                consumed: false,
              },
              data: {
                consumed: true,
              },
            });
          } catch (dbErr) {
            console.error("Failed to invalidate unreceived OTP:", dbErr);
          }

          return {
            success: false,
            statusCode: emailResult.blockedByAllowlist ? 403 : 502,
            message: emailResult.blockedByAllowlist
              ? "Recipient email address is not authorized in this non-production environment."
              : (emailResult.message || "Failed to deliver verification code. Please try again."),
          };
        }
      }

      const isSimulated = Boolean(emailResult?.simulated);

      return {
        success: true,
        message: txResult.isTestAccount
          ? "✓ Test account recognized! Use code: 123456"
          : isSimulated
          ? `[DEV] Verification code generated for ${cleanEmail}. (Email delivery simulated: no RESEND_API_KEY configured)`
          : `Verification code sent to ${cleanEmail}! Please check your inbox and spam folder.`,
        isTestAccount: txResult.isTestAccount,
        ...(isSimulated ? { simulated: true } : {}),
      };
    } finally {
      releaseLock();
    }
  }

  /**
   * Verifies an entered OTP code against the active HMAC hash
   */
  static async verifyOtp(email: string, code: string): Promise<{ success: boolean; message?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!cleanEmail || cleanCode.length !== 6) {
      return { success: false, message: "Invalid 6-digit code format." };
    }

    const now = new Date();

    // Find the latest active unconsumed OTP
    const activeOtp = await prisma.otpCode.findFirst({
      where: {
        email: cleanEmail,
        consumed: false,
        expiresAt: {
          gt: now,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!activeOtp) {
      return {
        success: false,
        message: "Verification code expired or not found. Please request a new code.",
      };
    }

    // Brute-force protection: lock out after 5 attempts
    if (activeOtp.attempts >= 5) {
      await prisma.otpCode.update({
        where: { id: activeOtp.id },
        data: { consumed: true },
      });
      return {
        success: false,
        message: "Too many failed attempts. This code has been invalidated for security. Please request a new code.",
      };
    }

    const isProduction = env.APP_ENV === "production";
    const isTestEmail = cleanEmail === "test.customer@stickthebizz.in" || cleanEmail === "demo.customer@stickthebizz.in";

    // In production, reject static test code shortcut even if an old non-prod hash exists
    if (isProduction && isTestEmail && cleanCode === "123456") {
      const staticTestHash = this.hashOtp(cleanEmail, "123456");
      if (activeOtp.codeHash === staticTestHash) {
        await prisma.otpCode.update({
          where: { id: activeOtp.id },
          data: { consumed: true },
        });
        return {
          success: false,
          message: "Static test code cannot be used in production. Please request a new verification code.",
        };
      }
    }

    const expectedHash = this.hashOtp(cleanEmail, cleanCode);

    // Constant-time comparison to prevent timing attacks
    const bufferA = Buffer.from(activeOtp.codeHash, "hex");
    const bufferB = Buffer.from(expectedHash, "hex");

    const isMatch = bufferA.length === bufferB.length && crypto.timingSafeEqual(bufferA, bufferB);

    if (!isMatch) {
      await prisma.otpCode.update({
        where: { id: activeOtp.id },
        data: { attempts: { increment: 1 } },
      });
      return {
        success: false,
        message: "Incorrect verification code. Please check and try again.",
      };
    }

    // Success: mark as consumed so it cannot be reused
    await prisma.otpCode.update({
      where: { id: activeOtp.id },
      data: { consumed: true },
    });

    return { success: true };
  }
}


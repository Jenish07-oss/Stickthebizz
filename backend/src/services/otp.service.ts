import crypto from "crypto";
import { prisma } from "../config/db";
import { env } from "../config/env";
import { EmailService } from "./email.service";

export class OtpService {
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
   */
  static async requestOtp(email: string): Promise<{ success: boolean; message: string; isTestAccount?: boolean }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, message: "Please provide a valid email address." };
    }

    // Live testing shortcut account
    const isTestAccount = cleanEmail === "test.customer@stickthebizz.in" || cleanEmail === "demo.customer@stickthebizz.in";
    const code = isTestAccount ? "123456" : this.generateNumericCode();
    const codeHash = this.hashOtp(cleanEmail, code);

    const fiveMinutesAhead = new Date(Date.now() + 5 * 60 * 1000);

    // Invalidate existing pending OTPs for this email to prevent replay attacks
    await prisma.otpCode.updateMany({
      where: {
        email: cleanEmail,
        consumed: false,
      },
      data: {
        consumed: true,
      },
    });

    // Store new hashed OTP record
    await prisma.otpCode.create({
      data: {
        email: cleanEmail,
        codeHash,
        expiresAt: fiveMinutesAhead,
      },
    });

    // Send email via Resend
    if (!isTestAccount) {
      await EmailService.sendOtpEmail(cleanEmail, code);
    }

    return {
      success: true,
      message: isTestAccount
        ? "✓ Test account recognized! Use code: 123456"
        : `Verification code sent to ${cleanEmail}! Please check your inbox and spam folder.`,
      isTestAccount,
    };
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


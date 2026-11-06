import bcrypt from "bcryptjs";
import { prisma } from "../config/db";
import { OtpService } from "./otp.service";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { cleanPhone, isValidIndianPhone } from "../utils/sanitize";

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    phone?: string | null;
    fullName?: string | null;
    role: "MERCHANT" | "CUSTOMER" | "ADMIN";
  };
  customer?: {
    id: string;
    phone?: string | null;
    fullName?: string | null;
  } | null;
  merchant?: {
    id: string;
    name: string;
    slug: string;
    category: string;
  } | null;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Verifies Customer 6-Digit Email OTP and creates/loads customer profile
   */
  static async verifyCustomerOtp(
    email: string,
    code: string,
    phoneInput?: string,
    fullNameInput?: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ success: boolean; data?: AuthResponse; message?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const otpResult = await OtpService.verifyOtp(cleanEmail, code);

    if (!otpResult.success) {
      return { success: false, message: otpResult.message };
    }

    // 1. Find or create User
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          role: "CUSTOMER",
          fullName: fullNameInput?.trim() || undefined,
          isVerified: true,
        },
      });
    } else if (!user.isVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });
    }

    // 2. Find or create Customer record
    const validatedPhone = phoneInput && isValidIndianPhone(phoneInput) ? cleanPhone(phoneInput) : null;

    let customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { userId: user.id },
          { email: cleanEmail },
          ...(validatedPhone ? [{ phone: validatedPhone }] : []),
        ],
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          userId: user.id,
          email: cleanEmail,
          phone: validatedPhone,
          fullName: fullNameInput?.trim() || user.fullName || "Loyal Customer",
        },
      });
    } else {
      // Heal missing fields
      const updateData: any = {};
      if (!customer.userId) updateData.userId = user.id;
      if (!customer.email) updateData.email = cleanEmail;
      if (!customer.phone && validatedPhone) updateData.phone = validatedPhone;
      if ((!customer.fullName || customer.fullName === "Loyal Customer") && fullNameInput) {
        updateData.fullName = fullNameInput.trim();
      }

      if (Object.keys(updateData).length > 0) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: updateData,
        });
      }
    }

    // 3. Issue Token Pair & Store Session
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as "CUSTOMER",
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        userAgent,
        ipAddress,
        expiresAt: thirtyDaysAhead,
      },
    });

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          fullName: customer.fullName || user.fullName,
          role: user.role,
        },
        customer: {
          id: customer.id,
          phone: customer.phone,
          fullName: customer.fullName,
        },
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * Shop Owner Registration
   */
  static async registerMerchant(data: {
    email: string;
    password?: string;
    pin?: string;
    fullName?: string;
    phone: string;
    shopName: string;
    category?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<{ success: boolean; data?: AuthResponse; message?: string }> {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhoneDigits = cleanPhone(data.phone);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { phone: cleanPhoneDigits }],
      },
    });

    if (existingUser) {
      return { success: false, message: "An account with this email or mobile already exists." };
    }

    // Hash password (or fallback to PIN)
    const rawSecret = data.password || data.pin || "StoreOwner@123";
    const passwordHash = await bcrypt.hash(rawSecret, 10);

    const slug = data.shopName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 50);

    // Create user and merchant inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: cleanEmail,
          phone: cleanPhoneDigits,
          fullName: data.fullName || "Store Owner",
          passwordHash,
          role: "MERCHANT",
          isVerified: true,
        },
      });

      const merchant = await tx.merchant.create({
        data: {
          ownerId: user.id,
          name: data.shopName,
          slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
          category: data.category || "Cafe / Chai",
          redemptionPin: data.pin || "2468",
        },
      });

      return { user, merchant };
    });

    const tokenPayload = {
      userId: result.user.id,
      email: result.user.email,
      role: "MERCHANT" as const,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);
    const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        userId: result.user.id,
        refreshToken,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        expiresAt: thirtyDaysAhead,
      },
    });

    return {
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          phone: result.user.phone,
          fullName: result.user.fullName,
          role: "MERCHANT",
        },
        merchant: {
          id: result.merchant.id,
          name: result.merchant.name,
          slug: result.merchant.slug,
          category: result.merchant.category,
        },
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * Shop Owner Login with Email & Password or 4-digit PIN
   */
  static async loginMerchant(
    email: string,
    secret: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ success: boolean; data?: AuthResponse; message?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        merchants: true,
      },
    });

    if (!user || user.role !== "MERCHANT") {
      return { success: false, message: "Invalid merchant email or password." };
    }

    let isValid = false;

    // Check password
    if (user.passwordHash) {
      isValid = await bcrypt.compare(secret, user.passwordHash);
    }

    // Check merchant terminal PIN as alternative PIN login
    if (!isValid && user.merchants.length > 0 && secret.length === 4) {
      const matchingMerchant = user.merchants.find((m) => m.redemptionPin === secret);
      if (matchingMerchant) {
        isValid = true;
      }
    }

    if (!isValid) {
      return { success: false, message: "Incorrect password or cashier PIN." };
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as "MERCHANT",
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);
    const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        userAgent,
        ipAddress,
        expiresAt: thirtyDaysAhead,
      },
    });

    const primaryMerchant = user.merchants[0] || null;

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role,
        },
        merchant: primaryMerchant
          ? {
              id: primaryMerchant.id,
              name: primaryMerchant.name,
              slug: primaryMerchant.slug,
              category: primaryMerchant.category,
            }
          : null,
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * Refreshes JWT tokens using an existing active refresh token
   */
  static async refreshTokens(
    oldRefreshToken: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ success: boolean; data?: { accessToken: string; refreshToken: string }; message?: string }> {
    const payload = verifyRefreshToken(oldRefreshToken);
    if (!payload) {
      return { success: false, message: "Invalid or expired refresh token." };
    }

    const session = await prisma.session.findUnique({
      where: { refreshToken: oldRefreshToken },
    });

    if (!session || session.expiresAt < new Date()) {
      return { success: false, message: "Session expired or revoked. Please log in again." };
    }

    const newAccessToken = signAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    const newRefreshToken = signRefreshToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Rotate refresh token
    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        userAgent,
        ipAddress,
        expiresAt: thirtyDaysAhead,
      },
    });

    return {
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    };
  }

  /**
   * Logout and revoke session
   */
  static async logout(refreshToken?: string): Promise<{ success: boolean }> {
    if (!refreshToken) return { success: true };
    try {
      await prisma.session.deleteMany({
        where: { refreshToken },
      });
    } catch {
      // silent
    }
    return { success: true };
  }
}


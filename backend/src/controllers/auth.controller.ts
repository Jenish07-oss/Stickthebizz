import { FastifyRequest, FastifyReply } from "fastify";
import { OtpService } from "../services/otp.service";
import { AuthService } from "../services/auth.service";
import { prisma } from "../config/db";
import { env } from "../config/env";

export class AuthController {
  /**
   * POST /api/v1/auth/customer/otp/request
   */
  static async requestOtp(request: FastifyRequest, reply: FastifyReply) {
    const { email } = request.body as { email?: string };
    if (!email) {
      return reply.status(400).send({ success: false, message: "Email is required." });
    }

    const result = await OtpService.requestOtp(email);
    const statusCode = result.statusCode || (result.success ? 200 : 400);
    return reply.status(statusCode).send(result);
  }

  /**
   * POST /api/v1/auth/customer/otp/verify
   */
  static async verifyOtp(request: FastifyRequest, reply: FastifyReply) {
    const { email, code, phone, fullName } = request.body as {
      email?: string;
      code?: string;
      phone?: string;
      fullName?: string;
    };

    if (!email || !code) {
      return reply.status(400).send({ success: false, message: "Email and 6-digit code are required." });
    }

    const userAgent = request.headers["user-agent"];
    const ipAddress = request.ip;

    const result = await AuthService.verifyCustomerOtp(email, code, phone, fullName, userAgent, ipAddress);

    if (!result.success || !result.data) {
      return reply.status(400).send({ success: false, message: result.message || "Verification failed." });
    }

    // Set secure HTTP-only cookies for browser sessions
    const isProd = env.NODE_ENV === "production";
    reply.setCookie("access_token", result.data.accessToken, {
      path: "/",
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 15 * 60, // 15 min
    });

    reply.setCookie("refresh_token", result.data.refreshToken, {
      path: "/api/v1/auth",
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return reply.status(200).send({
      success: true,
      data: result.data,
      message: "Customer verified successfully.",
    });
  }

  /**
   * POST /api/v1/auth/owner/register
   */
  static async registerMerchant(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as any;
    if (!body?.email || !body?.phone || !body?.shopName) {
      return reply.status(400).send({
        success: false,
        message: "Email, phone, and shop name are required for registration.",
      });
    }

    const userAgent = request.headers["user-agent"];
    const ipAddress = request.ip;

    const result = await AuthService.registerMerchant({
      ...body,
      userAgent,
      ipAddress,
    });

    if (!result.success || !result.data) {
      return reply.status(400).send({ success: false, message: result.message || "Registration failed." });
    }

    const isProd = env.NODE_ENV === "production";
    reply.setCookie("access_token", result.data.accessToken, {
      path: "/",
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 15 * 60,
    });

    reply.setCookie("refresh_token", result.data.refreshToken, {
      path: "/api/v1/auth",
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60,
    });

    return reply.status(201).send({
      success: true,
      data: result.data,
      message: "Merchant account registered successfully.",
    });
  }

  /**
   * POST /api/v1/auth/owner/login
   */
  static async loginMerchant(request: FastifyRequest, reply: FastifyReply) {
    const { email, password, pin } = request.body as {
      email?: string;
      password?: string;
      pin?: string;
    };

    if (!email || (!password && !pin)) {
      return reply.status(400).send({
        success: false,
        message: "Email and password or 4-digit PIN are required.",
      });
    }

    const userAgent = request.headers["user-agent"];
    const ipAddress = request.ip;

    const result = await AuthService.loginMerchant(email, password || pin || "", userAgent, ipAddress);

    if (!result.success || !result.data) {
      return reply.status(401).send({ success: false, message: result.message || "Login failed." });
    }

    const isProd = env.NODE_ENV === "production";
    reply.setCookie("access_token", result.data.accessToken, {
      path: "/",
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 15 * 60,
    });

    reply.setCookie("refresh_token", result.data.refreshToken, {
      path: "/api/v1/auth",
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60,
    });

    return reply.status(200).send({
      success: true,
      data: result.data,
      message: "Merchant login successful.",
    });
  }

  /**
   * POST /api/v1/auth/refresh
   */
  static async refresh(request: FastifyRequest, reply: FastifyReply) {
    const bodyToken = (request.body as any)?.refreshToken;
    const cookieToken = request.cookies?.refresh_token;
    const targetToken = bodyToken || cookieToken;

    if (!targetToken) {
      return reply.status(400).send({ success: false, message: "Refresh token is required." });
    }

    const userAgent = request.headers["user-agent"];
    const ipAddress = request.ip;

    const result = await AuthService.refreshTokens(targetToken, userAgent, ipAddress);

    if (!result.success || !result.data) {
      return reply.status(401).send({ success: false, message: result.message || "Failed to refresh token." });
    }

    const isProd = env.NODE_ENV === "production";
    reply.setCookie("access_token", result.data.accessToken, {
      path: "/",
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 15 * 60,
    });

    reply.setCookie("refresh_token", result.data.refreshToken, {
      path: "/api/v1/auth",
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60,
    });

    return reply.status(200).send({
      success: true,
      data: result.data,
    });
  }

  /**
   * POST /api/v1/auth/logout
   */
  static async logout(request: FastifyRequest, reply: FastifyReply) {
    const bodyToken = (request.body as any)?.refreshToken;
    const cookieToken = request.cookies?.refresh_token;
    const targetToken = bodyToken || cookieToken;

    await AuthService.logout(targetToken);

    reply.clearCookie("access_token", { path: "/" });
    reply.clearCookie("refresh_token", { path: "/api/v1/auth" });

    return reply.status(200).send({ success: true, message: "Logged out successfully." });
  }

  /**
   * GET /api/v1/auth/me (Protected route)
   */
  static async getMe(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, message: "Unauthorized." });
    }

    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      include: {
        customer: true,
        merchants: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ success: false, message: "User not found." });
    }

    return reply.status(200).send({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        customer: user.customer
          ? {
              id: user.customer.id,
              phone: user.customer.phone,
              fullName: user.customer.fullName,
            }
          : null,
        merchant: user.merchants[0]
          ? {
              id: user.merchants[0].id,
              name: user.merchants[0].name,
              slug: user.merchants[0].slug,
              category: user.merchants[0].category,
            }
          : null,
      },
    });
  }
}


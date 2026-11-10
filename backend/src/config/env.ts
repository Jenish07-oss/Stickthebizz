import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config();

const KNOWN_PREDICTABLE_SECRETS = new Set([
  "stb-access-secret-fallback-key-32chars",
  "stb-refresh-secret-fallback-key-32chars",
  "stb-otp-hmac-secret-fallback-key-32chars",
  "stb-cron-secret-key",
  "stb-jwt-access-secret-minimum-32-characters-long",
  "stb-jwt-refresh-secret-minimum-32-characters-long",
  "stb-hmac-sha256-otp-hash-secret-minimum-32-characters-long",
  "stb-internal-cron-trigger-secret-key",
  "your_razorpay_webhook_secret",
  "your_razorpay_key_secret",
]);

export const envSchema = z
  .object({
    PORT: z.string().default("8000").transform((val) => parseInt(val, 10)),
    APP_ENV: z.enum(["development", "test", "staging", "production"], {
      required_error: "APP_ENV is required and must be one of: development, test, staging, production",
    }),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    FRONTEND_URL: z.string().default("http://localhost:3000,https://stickthebizz.in"),

    // Supabase PostgreSQL URLs
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    DIRECT_URL: z.string().optional(),

    // JWT & Crypto Secrets (No predictable defaults - mandatory strong secrets)
    JWT_ACCESS_SECRET: z
      .string({ required_error: "JWT_ACCESS_SECRET is required" })
      .min(16, "JWT_ACCESS_SECRET must be at least 16 chars"),
    JWT_REFRESH_SECRET: z
      .string({ required_error: "JWT_REFRESH_SECRET is required" })
      .min(16, "JWT_REFRESH_SECRET must be at least 16 chars"),
    OTP_SECRET: z
      .string({ required_error: "OTP_SECRET is required" })
      .min(16, "OTP_SECRET must be at least 16 chars"),

    // Resend Email Delivery
    RESEND_API_KEY: z.string().default(""),
    EMAIL_FROM: z.string().default("StickTheBizz Loyalty <noreply@stickthebizz.in>"),
    NON_PRODUCTION_EMAIL_ALLOWLIST: z.string().default(""),

    // Razorpay
    RAZORPAY_KEY_ID: z
      .string({ required_error: "RAZORPAY_KEY_ID is required" })
      .min(1, "RAZORPAY_KEY_ID is required and cannot be empty")
      .refine((val) => !/\s/.test(val), {
        message: "RAZORPAY_KEY_ID must not contain whitespace",
      }),
    RAZORPAY_KEY_SECRET: z.string().default(""),
    RAZORPAY_WEBHOOK_SECRET: z.string().default(""),

    // Cron Secret (No predictable defaults)
    CRON_SECRET: z
      .string({ required_error: "CRON_SECRET is required" })
      .min(16, "CRON_SECRET must be at least 16 chars"),
  })
  .superRefine((data, ctx) => {
    // 1. Razorpay Key Environment Separation
    const key = data.RAZORPAY_KEY_ID;
    if (key && key === key.trim()) {
      if (data.APP_ENV === "production") {
        if (!key.startsWith("rzp_live_")) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["RAZORPAY_KEY_ID"],
            message:
              "In production environment (APP_ENV=production), RAZORPAY_KEY_ID must begin with 'rzp_live_'. Test credentials ('rzp_test_') are strictly prohibited.",
          });
        }
      } else {
        // development, test, staging
        if (!key.startsWith("rzp_test_")) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["RAZORPAY_KEY_ID"],
            message: `In ${data.APP_ENV} environment (APP_ENV=${data.APP_ENV}), RAZORPAY_KEY_ID must begin with 'rzp_test_'. Live credentials ('rzp_live_') are strictly prohibited.`,
          });
        }
      }
    }

    // 2. Email & Allowlist Rules (SEC-03)
    const isProduction = data.APP_ENV === "production";
    const isStaging = data.APP_ENV === "staging";
    const resendKey = data.RESEND_API_KEY ? data.RESEND_API_KEY.trim() : "";
    const allowlistRaw = data.NON_PRODUCTION_EMAIL_ALLOWLIST ? data.NON_PRODUCTION_EMAIL_ALLOWLIST.trim() : "";

    // Staging requires RESEND_API_KEY and NON_PRODUCTION_EMAIL_ALLOWLIST
    if (isStaging) {
      if (!resendKey) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["RESEND_API_KEY"],
          message: "RESEND_API_KEY is required and cannot be empty in staging environment.",
        });
      }
      if (!allowlistRaw) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["NON_PRODUCTION_EMAIL_ALLOWLIST"],
          message: "NON_PRODUCTION_EMAIL_ALLOWLIST is required and cannot be empty in staging environment.",
        });
      }
    }

    // Development & Test: If RESEND_API_KEY is configured, NON_PRODUCTION_EMAIL_ALLOWLIST is mandatory
    if (!isProduction && !isStaging && resendKey) {
      if (!allowlistRaw) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["NON_PRODUCTION_EMAIL_ALLOWLIST"],
          message: `When RESEND_API_KEY is configured in ${data.APP_ENV} environment, NON_PRODUCTION_EMAIL_ALLOWLIST is mandatory to prevent accidental delivery to real users.`,
        });
      }
    }

    // If NON_PRODUCTION_EMAIL_ALLOWLIST is provided in non-production, validate its contents
    if (!isProduction && allowlistRaw) {
      const entries = allowlistRaw
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0);

      if (entries.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["NON_PRODUCTION_EMAIL_ALLOWLIST"],
          message: "NON_PRODUCTION_EMAIL_ALLOWLIST must contain at least one non-empty email address.",
        });
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (const entry of entries) {
          if (entry.includes("*") || entry.startsWith("@") || !emailRegex.test(entry)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["NON_PRODUCTION_EMAIL_ALLOWLIST"],
              message:
                "NON_PRODUCTION_EMAIL_ALLOWLIST contains invalid, wildcard, or domain-only entries. Only explicit individual email addresses are permitted.",
            });
            break;
          }
        }
      }
    }

    // 3. Staging and Production Secret Hardening & Fallback Rejection
    const isProdOrStaging = data.APP_ENV === "production" || data.APP_ENV === "staging";

    if (isProdOrStaging) {
      // Minimum 32 characters required in staging and production
      if (data.JWT_ACCESS_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["JWT_ACCESS_SECRET"],
          message: `In ${data.APP_ENV} environment, JWT_ACCESS_SECRET must be at least 32 characters.`,
        });
      }
      if (data.JWT_REFRESH_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["JWT_REFRESH_SECRET"],
          message: `In ${data.APP_ENV} environment, JWT_REFRESH_SECRET must be at least 32 characters.`,
        });
      }
      if (data.OTP_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["OTP_SECRET"],
          message: `In ${data.APP_ENV} environment, OTP_SECRET must be at least 32 characters.`,
        });
      }
      if (data.CRON_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["CRON_SECRET"],
          message: `In ${data.APP_ENV} environment, CRON_SECRET must be at least 32 characters.`,
        });
      }

      // Rejection of known repository / predictable fallback strings
      if (KNOWN_PREDICTABLE_SECRETS.has(data.JWT_ACCESS_SECRET)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["JWT_ACCESS_SECRET"],
          message: `Known repository placeholder or fallback secret is strictly prohibited in ${data.APP_ENV}.`,
        });
      }
      if (KNOWN_PREDICTABLE_SECRETS.has(data.JWT_REFRESH_SECRET)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["JWT_REFRESH_SECRET"],
          message: `Known repository placeholder or fallback secret is strictly prohibited in ${data.APP_ENV}.`,
        });
      }
      if (KNOWN_PREDICTABLE_SECRETS.has(data.OTP_SECRET)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["OTP_SECRET"],
          message: `Known repository placeholder or fallback secret is strictly prohibited in ${data.APP_ENV}.`,
        });
      }
      if (KNOWN_PREDICTABLE_SECRETS.has(data.CRON_SECRET)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["CRON_SECRET"],
          message: `Known repository placeholder or fallback secret is strictly prohibited in ${data.APP_ENV}.`,
        });
      }

      // Independence: Secrets must be distinct from each other
      if (data.JWT_ACCESS_SECRET === data.JWT_REFRESH_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["JWT_REFRESH_SECRET"],
          message: "JWT_REFRESH_SECRET must be distinct and independent from JWT_ACCESS_SECRET.",
        });
      }
      if (data.JWT_ACCESS_SECRET === data.OTP_SECRET || data.JWT_REFRESH_SECRET === data.OTP_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["OTP_SECRET"],
          message: "OTP_SECRET must be distinct and independent from JWT secrets.",
        });
      }
      if (
        data.CRON_SECRET === data.JWT_ACCESS_SECRET ||
        data.CRON_SECRET === data.JWT_REFRESH_SECRET ||
        data.CRON_SECRET === data.OTP_SECRET
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["CRON_SECRET"],
          message: "CRON_SECRET must be distinct and independent from authentication secrets.",
        });
      }
    }

    // 4. Razorpay Webhook Secret Validation
    const webhookSecret = data.RAZORPAY_WEBHOOK_SECRET ? data.RAZORPAY_WEBHOOK_SECRET.trim() : "";
    if (webhookSecret) {
      if (KNOWN_PREDICTABLE_SECRETS.has(webhookSecret)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["RAZORPAY_WEBHOOK_SECRET"],
          message: "Known repository placeholder for RAZORPAY_WEBHOOK_SECRET is strictly prohibited.",
        });
      }

      if (data.RAZORPAY_KEY_SECRET && webhookSecret === data.RAZORPAY_KEY_SECRET.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["RAZORPAY_WEBHOOK_SECRET"],
          message:
            "RAZORPAY_WEBHOOK_SECRET must not match RAZORPAY_KEY_SECRET. A dedicated webhook secret is required.",
        });
      }

      if (webhookSecret === data.RAZORPAY_KEY_ID.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["RAZORPAY_WEBHOOK_SECRET"],
          message: "RAZORPAY_WEBHOOK_SECRET cannot match RAZORPAY_KEY_ID.",
        });
      }

      if (isProdOrStaging && webhookSecret.length < 16) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["RAZORPAY_WEBHOOK_SECRET"],
          message: `In ${data.APP_ENV} environment, RAZORPAY_WEBHOOK_SECRET must be at least 16 characters long.`,
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errorDetails = parsed.error.issues.map((issue) => ({
    variable: issue.path.join("."),
    message: issue.message,
  }));
  console.error("❌ Invalid environment configuration:", JSON.stringify(errorDetails, null, 2));
  process.exit(1);
}

export type Env = z.infer<typeof envSchema>;
export const env: Env = parsed.data;


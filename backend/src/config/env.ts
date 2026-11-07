import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config();

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

    // JWT & Crypto Secrets
    JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 chars").default("stb-access-secret-fallback-key-32chars"),
    JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 chars").default("stb-refresh-secret-fallback-key-32chars"),
    OTP_SECRET: z.string().min(16, "OTP_SECRET must be at least 16 chars").default("stb-otp-hmac-secret-fallback-key-32chars"),

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

    // Cron Secret
    CRON_SECRET: z.string().default("stb-cron-secret-key"),
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


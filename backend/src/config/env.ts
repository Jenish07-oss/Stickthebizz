import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("8000").transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
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

  // Razorpay
  RAZORPAY_KEY_ID: z.string().default("rzp_live_TwB6i8HNWltApy"),
  RAZORPAY_KEY_SECRET: z.string().default(""),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(""),

  // Cron Secret
  CRON_SECRET: z.string().default("stb-cron-secret-key"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  // In development, proceed with fallbacks; in production, fail fast
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

export const env = parsed.success
  ? parsed.data
  : envSchema.parse({
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || "postgres://localhost:5432/postgres",
    });


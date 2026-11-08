import { z } from "zod";

export type AppEnvironment = "development" | "staging" | "preview" | "production";

export interface FrontendEnv {
  APP_ENV: AppEnvironment;
  API_BASE_URL: string;
  WS_BASE_URL: string;
  RAZORPAY_KEY_ID?: string;
}

export const PRODUCTION_BACKEND_HOSTNAME = "stickthebizz.onrender.com";
export const PRODUCTION_BACKEND_ORIGIN = "https://stickthebizz.onrender.com";

const appEnvSchema = z.enum(["development", "staging", "preview", "production"], {
  errorMap: () => ({
    message: "NEXT_PUBLIC_APP_ENV must be one of: development, staging, preview, production",
  }),
});

/**
 * Pure validation function for frontend environment variables.
 * Allows deterministic offline unit testing with custom variable fixtures.
 */
export function validateFrontendEnv(
  envInput?: Record<string, string | undefined>
): FrontendEnv {
  const envSource = envInput ?? {
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
  };

  // 1. Resolve Deployment Environment Identity
  let resolvedEnv: string | undefined = envSource.NEXT_PUBLIC_APP_ENV;

  if (!resolvedEnv || resolvedEnv.trim() === "") {
    // Vercel deployment environment fallback (VERCEL_ENV: "production" | "preview" | "development")
    if (envSource.VERCEL_ENV === "preview") {
      resolvedEnv = "preview";
    } else if (envSource.VERCEL_ENV === "production") {
      resolvedEnv = "production";
    } else if (
      envSource.VERCEL_ENV === "development" ||
      envSource.NODE_ENV === "development" ||
      envSource.NODE_ENV === "test" ||
      !envSource.NODE_ENV
    ) {
      resolvedEnv = "development";
    }
  }

  const parsedEnv = appEnvSchema.safeParse(resolvedEnv);
  if (!parsedEnv.success) {
    throw new Error(
      `❌ [FRONTEND ENV CONFIG ERROR] Invalid deployment environment: ${parsedEnv.error.issues[0]?.message || "Missing environment identity."}`
    );
  }

  const appEnv: AppEnvironment = parsedEnv.data;
  const rawApiUrl = envSource.NEXT_PUBLIC_API_URL;
  let finalApiUrl: string;

  // 2. Validate API Base URL
  if (appEnv === "development") {
    // In local development, default to explicit localhost Fastify server if omitted or empty
    if (!rawApiUrl || rawApiUrl.trim() === "") {
      finalApiUrl = "http://localhost:8000";
    } else {
      finalApiUrl = rawApiUrl.trim();
    }
  } else {
    // In staging, preview, and production, NEXT_PUBLIC_API_URL is STRICTLY MANDATORY
    if (!rawApiUrl || rawApiUrl.trim() === "") {
      throw new Error(
        `❌ [FRONTEND ENV CONFIG ERROR] NEXT_PUBLIC_API_URL is mandatory for '${appEnv}' builds. A non-production frontend must never silently connect to production.`
      );
    }
    finalApiUrl = rawApiUrl.trim();
  }

  // Reject whitespace within the URL string
  if (/\s/.test(finalApiUrl)) {
    throw new Error(
      `❌ [FRONTEND ENV CONFIG ERROR] NEXT_PUBLIC_API_URL must not contain whitespace: '${finalApiUrl}'`
    );
  }

  // Validate absolute URL structure
  let parsedApiUrl: URL;
  try {
    parsedApiUrl = new URL(finalApiUrl);
  } catch {
    throw new Error(
      `❌ [FRONTEND ENV CONFIG ERROR] NEXT_PUBLIC_API_URL='${finalApiUrl}' is not a valid absolute URL.`
    );
  }

  // Enforce protocol constraints
  if (appEnv === "development") {
    if (parsedApiUrl.protocol !== "http:" && parsedApiUrl.protocol !== "https:") {
      throw new Error(
        `❌ [FRONTEND ENV CONFIG ERROR] NEXT_PUBLIC_API_URL must use http: or https: protocol. Received: '${parsedApiUrl.protocol}'`
      );
    }
  } else {
    // staging, preview, production MUST use HTTPS
    if (parsedApiUrl.protocol !== "https:") {
      throw new Error(
        `❌ [FRONTEND ENV CONFIG ERROR] NEXT_PUBLIC_API_URL must use HTTPS protocol in '${appEnv}' environment. Received: '${parsedApiUrl.protocol}'`
      );
    }
  }

  // Embedded credentials (http://user:pass@...) are strictly prohibited
  if (parsedApiUrl.username || parsedApiUrl.password) {
    throw new Error(
      "❌ [FRONTEND ENV CONFIG ERROR] NEXT_PUBLIC_API_URL must not contain embedded user credentials."
    );
  }

  const hostname = parsedApiUrl.hostname.toLowerCase();

  // 3. Cross-Environment Backend Isolation Enforcement
  if (appEnv === "staging" || appEnv === "preview" || appEnv === "development") {
    if (hostname === PRODUCTION_BACKEND_HOSTNAME) {
      throw new Error(
        `❌ [SECURITY VIOLATION] '${appEnv}' frontend is strictly forbidden from connecting to the production backend (${PRODUCTION_BACKEND_HOSTNAME}).`
      );
    }
  }

  if (appEnv === "production") {
    if (hostname !== PRODUCTION_BACKEND_HOSTNAME) {
      throw new Error(
        `❌ [FRONTEND ENV CONFIG ERROR] Production frontend must explicitly target the production backend (${PRODUCTION_BACKEND_HOSTNAME}). Received: '${hostname}'`
      );
    }
  }

  // Strip trailing slashes for clean endpoint concatenation
  const normalizedApiBaseUrl = parsedApiUrl.origin.replace(/\/+$/, "");

  // 4. WebSocket URL Resolution
  const rawWsUrl = envSource.NEXT_PUBLIC_WS_URL;
  let finalWsUrl: string;

  if (rawWsUrl && rawWsUrl.trim() !== "") {
    const cleanWsUrl = rawWsUrl.trim();
    if (/\s/.test(cleanWsUrl)) {
      throw new Error(
        `❌ [FRONTEND ENV CONFIG ERROR] NEXT_PUBLIC_WS_URL must not contain whitespace: '${cleanWsUrl}'`
      );
    }

    let parsedWsUrl: URL;
    try {
      parsedWsUrl = new URL(cleanWsUrl);
    } catch {
      throw new Error(
        `❌ [FRONTEND ENV CONFIG ERROR] NEXT_PUBLIC_WS_URL='${cleanWsUrl}' is not a valid absolute URL.`
      );
    }

    if (parsedWsUrl.protocol !== "ws:" && parsedWsUrl.protocol !== "wss:") {
      throw new Error(
        `❌ [FRONTEND ENV CONFIG ERROR] NEXT_PUBLIC_WS_URL must use ws: or wss: protocol. Received: '${parsedWsUrl.protocol}'`
      );
    }

    // Over HTTPS in staging/preview/production, non-TLS ws: is blocked by browsers as Mixed Content
    if (appEnv !== "development" && parsedWsUrl.protocol !== "wss:") {
      throw new Error(
        `❌ [FRONTEND ENV CONFIG ERROR] NEXT_PUBLIC_WS_URL must use WSS (secure) protocol in '${appEnv}' environment.`
      );
    }

    if (parsedWsUrl.username || parsedWsUrl.password) {
      throw new Error(
        "❌ [FRONTEND ENV CONFIG ERROR] NEXT_PUBLIC_WS_URL must not contain embedded credentials."
      );
    }

    const wsHostname = parsedWsUrl.hostname.toLowerCase();
    if ((appEnv === "staging" || appEnv === "preview") && wsHostname === PRODUCTION_BACKEND_HOSTNAME) {
      throw new Error(
        `❌ [SECURITY VIOLATION] '${appEnv}' frontend cannot configure WebSocket connection to production backend (${PRODUCTION_BACKEND_HOSTNAME}).`
      );
    }

    if (appEnv !== "development" && (wsHostname === "localhost" || wsHostname === "127.0.0.1")) {
      throw new Error(
        `❌ [FRONTEND ENV CONFIG ERROR] '${appEnv}' frontend cannot configure WebSocket connection to localhost.`
      );
    }

    finalWsUrl = cleanWsUrl.replace(/\/+$/, "");
  } else {
    // Preferred: Automatically derive WebSocket URL from validated API Base URL
    const derivedProtocol = parsedApiUrl.protocol === "https:" ? "wss:" : "ws:";
    finalWsUrl = `${derivedProtocol}//${parsedApiUrl.host}/ws`;
  }

  // 5. Razorpay Key Isolation Enforcement
  const rawRazorpayKey = envSource.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
  let finalRazorpayKey: string | undefined = undefined;

  if (rawRazorpayKey && rawRazorpayKey !== "") {
    if (/\s/.test(rawRazorpayKey)) {
      throw new Error(
        `❌ [FRONTEND ENV CONFIG ERROR] NEXT_PUBLIC_RAZORPAY_KEY_ID must not contain whitespace.`
      );
    }

    if (appEnv === "staging" || appEnv === "preview" || appEnv === "development") {
      if (rawRazorpayKey.startsWith("rzp_live_")) {
        throw new Error(
          `❌ [SECURITY VIOLATION] '${appEnv}' environment cannot use live Razorpay credentials ('rzp_live_...'). Live keys in non-production builds are strictly prohibited.`
        );
      }
      if (!rawRazorpayKey.startsWith("rzp_test_")) {
        throw new Error(
          `❌ [FRONTEND ENV CONFIG ERROR] In '${appEnv}' environment, NEXT_PUBLIC_RAZORPAY_KEY_ID must begin with 'rzp_test_'. Received: '${rawRazorpayKey}'`
        );
      }
    } else if (appEnv === "production") {
      if (rawRazorpayKey.startsWith("rzp_test_")) {
        throw new Error(
          `❌ [SECURITY VIOLATION] Production frontend cannot use test Razorpay credentials ('rzp_test_...'). Production must use live credentials ('rzp_live_...').`
        );
      }
      if (!rawRazorpayKey.startsWith("rzp_live_")) {
        throw new Error(
          `❌ [FRONTEND ENV CONFIG ERROR] In production environment, NEXT_PUBLIC_RAZORPAY_KEY_ID must begin with 'rzp_live_'. Received: '${rawRazorpayKey}'`
        );
      }
    }
    finalRazorpayKey = rawRazorpayKey;
  }

  return {
    APP_ENV: appEnv,
    API_BASE_URL: normalizedApiBaseUrl,
    WS_BASE_URL: finalWsUrl,
    RAZORPAY_KEY_ID: finalRazorpayKey,
  };
}

/**
 * Singleton validated environment configuration for application runtime.
 */
export const frontendEnv: FrontendEnv = validateFrontendEnv();

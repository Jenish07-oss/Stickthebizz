/** @type {import('next').NextConfig} */

// =========================================================================
// BUILD-TIME FAIL-CLOSED ENVIRONMENT VALIDATION (FE-SEC-01 - FE-SEC-04)
// Prevents Staging/Preview builds from silently leaking to Production backend
// =========================================================================
function validateBuildEnvironment() {
  const isDev = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
  const vercelEnv = process.env.VERCEL_ENV;
  const appEnv =
    process.env.NEXT_PUBLIC_APP_ENV ||
    (vercelEnv === "preview" ? "preview" : vercelEnv === "production" ? "production" : undefined) ||
    (isDev ? "development" : undefined);

  if (!appEnv) {
    throw new Error(
      "❌ [BUILD SAFETY ERROR] NEXT_PUBLIC_APP_ENV is required for Next.js builds. " +
        "Must be one of: development, staging, preview, production."
    );
  }

  const validEnvs = ["development", "staging", "preview", "production"];
  if (!validEnvs.includes(appEnv)) {
    throw new Error(
      `❌ [BUILD SAFETY ERROR] Invalid NEXT_PUBLIC_APP_ENV='${appEnv}'. ` +
        `Must be one of: ${validEnvs.join(", ")}.`
    );
  }

  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const PROD_HOSTNAME = "stickthebizz.onrender.com";

  if (appEnv === "development") {
    // Development permits http://localhost:8000 default if unset
    if (rawApiUrl && rawApiUrl.includes(PROD_HOSTNAME)) {
      throw new Error(
        `❌ [BUILD SAFETY ERROR] Development environment cannot target the production backend (${PROD_HOSTNAME}).`
      );
    }
    return;
  }

  // Non-development (staging, preview, production) requires explicit NEXT_PUBLIC_API_URL
  if (!rawApiUrl || rawApiUrl.trim() === "") {
    throw new Error(
      `❌ [BUILD SAFETY ERROR] NEXT_PUBLIC_API_URL is mandatory for '${appEnv}' builds. ` +
        "A staging or preview frontend must never silently connect to production."
    );
  }

  if (/\s/.test(rawApiUrl)) {
    throw new Error("❌ [BUILD SAFETY ERROR] NEXT_PUBLIC_API_URL must not contain whitespace.");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(rawApiUrl);
  } catch {
    throw new Error(`❌ [BUILD SAFETY ERROR] NEXT_PUBLIC_API_URL='${rawApiUrl}' is not a valid absolute URL.`);
  }

  if (parsedUrl.protocol !== "https:") {
    throw new Error(
      `❌ [BUILD SAFETY ERROR] NEXT_PUBLIC_API_URL must use HTTPS protocol in '${appEnv}' builds. Received: '${parsedUrl.protocol}'`
    );
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new Error("❌ [BUILD SAFETY ERROR] NEXT_PUBLIC_API_URL must not contain embedded credentials.");
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  if (appEnv === "staging" || appEnv === "preview") {
    if (hostname === PROD_HOSTNAME) {
      throw new Error(
        `❌ [BUILD SAFETY ERROR] Security Violation: '${appEnv}' build is strictly forbidden from connecting to the production backend (${PROD_HOSTNAME}).`
      );
    }
  }

  if (appEnv === "production") {
    if (hostname !== PROD_HOSTNAME) {
      throw new Error(
        `❌ [BUILD SAFETY ERROR] Production build must target '${PROD_HOSTNAME}'. Received: '${hostname}'`
      );
    }
  }

  // Validate explicit WebSocket URL if provided
  const rawWsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (rawWsUrl && rawWsUrl.trim() !== "") {
    if (/\s/.test(rawWsUrl)) {
      throw new Error("❌ [BUILD SAFETY ERROR] NEXT_PUBLIC_WS_URL must not contain whitespace.");
    }
    let parsedWsUrl;
    try {
      parsedWsUrl = new URL(rawWsUrl);
    } catch {
      throw new Error(`❌ [BUILD SAFETY ERROR] NEXT_PUBLIC_WS_URL='${rawWsUrl}' is not a valid absolute URL.`);
    }
    if (parsedWsUrl.protocol !== "wss:") {
      throw new Error(
        `❌ [BUILD SAFETY ERROR] NEXT_PUBLIC_WS_URL must use secure WSS protocol in '${appEnv}' builds.`
      );
    }
    const wsHostname = parsedWsUrl.hostname.toLowerCase();
    if ((appEnv === "staging" || appEnv === "preview") && wsHostname === PROD_HOSTNAME) {
      throw new Error(
        `❌ [BUILD SAFETY ERROR] Security Violation: '${appEnv}' build cannot target production WebSocket (${PROD_HOSTNAME}).`
      );
    }
  }

  // 4. Validate Razorpay Public Key ID if provided at build time
  const rawRazorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
  if (rawRazorpayKey && rawRazorpayKey !== "") {
    if (/\s/.test(rawRazorpayKey)) {
      throw new Error("❌ [BUILD SAFETY ERROR] NEXT_PUBLIC_RAZORPAY_KEY_ID must not contain whitespace.");
    }
    if (appEnv === "staging" || appEnv === "preview" || appEnv === "development") {
      if (rawRazorpayKey.startsWith("rzp_live_")) {
        throw new Error(
          `❌ [BUILD SAFETY ERROR] Security Violation: '${appEnv}' build cannot use live Razorpay key ('rzp_live_...'). Live credentials in non-production builds are strictly prohibited.`
        );
      }
      if (!rawRazorpayKey.startsWith("rzp_test_")) {
        throw new Error(
          `❌ [BUILD SAFETY ERROR] In '${appEnv}' build, NEXT_PUBLIC_RAZORPAY_KEY_ID must begin with 'rzp_test_'. Received: '${rawRazorpayKey}'`
        );
      }
    } else if (appEnv === "production") {
      if (rawRazorpayKey.startsWith("rzp_test_")) {
        throw new Error(
          `❌ [BUILD SAFETY ERROR] Security Violation: Production build cannot use test Razorpay key ('rzp_test_...').`
        );
      }
      if (!rawRazorpayKey.startsWith("rzp_live_")) {
        throw new Error(
          `❌ [BUILD SAFETY ERROR] In production build, NEXT_PUBLIC_RAZORPAY_KEY_ID must begin with 'rzp_live_'. Received: '${rawRazorpayKey}'`
        );
      }
    }
  }
}

// Execute validation before Next.js compiles any routes or bundles
validateBuildEnvironment();

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;


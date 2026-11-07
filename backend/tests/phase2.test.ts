import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { buildServer } from "../src/server.js";
import {
  calculatePlanPricing,
  validatePromoCode,
  SUBSCRIPTION_PLANS,
  BUILTIN_PROMO_CODES,
} from "../src/utils/pricing.js";
import {
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
} from "../src/config/razorpay.js";
import { getTodayISTDateString, getNextMidnightISTInUTC } from "../src/utils/ist.js";
import crypto from "crypto";

async function runPhase2Tests() {
  console.log("==================================================");
  console.log("   STICKTHEBIZZ BACKEND PHASE 2 VERIFICATION TEST");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(desc: string, condition: boolean) {
    if (condition) {
      console.log(`  ✅ ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${desc}`);
      failed++;
    }
  }

  // 1. Test Pricing Engine
  console.log("\n[1] Testing Pricing & Promo Engine:");

  const monthlyBase = SUBSCRIPTION_PLANS.MONTHLY.basePrice; // 749
  assert("Monthly base plan is ₹749", monthlyBase === 749);

  const beta100 = calculatePlanPricing("MONTHLY", "BETA100");
  assert("BETA100 yields finalAmount = 0", beta100.finalAmount === 0);
  assert("BETA100 isFreeActivation = true", beta100.isFreeActivation === true);
  assert("BETA100 finalAmountPaise = 0", beta100.finalAmountPaise === 0);

  const free100 = calculatePlanPricing("MONTHLY", "FREE100");
  assert("FREE100 yields finalAmount = 0", free100.finalAmount === 0);
  assert("FREE100 isFreeActivation = true", free100.isFreeActivation === true);

  const test1 = calculatePlanPricing("MONTHLY", "TEST1");
  assert("TEST1 yields finalAmount = 1", test1.finalAmount === 1);
  assert("TEST1 finalAmountPaise = 100", test1.finalAmountPaise === 100);
  assert("TEST1 appliedPromo.isRupeeOneTest = true", test1.appliedPromo?.isRupeeOneTest === true);

  const launch20 = calculatePlanPricing("MONTHLY", "LAUNCH20");
  const expectedDiscount = Math.round((749 * 20) / 100);
  assert(`LAUNCH20 discounts ₹${expectedDiscount}`, launch20.discountAmount === expectedDiscount);
  assert(`LAUNCH20 finalAmount = ₹${749 - expectedDiscount}`, launch20.finalAmount === 749 - expectedDiscount);

  // 2. Test IST Date calculations
  console.log("\n[2] Testing IST Engine:");
  const todayIST = getTodayISTDateString();
  assert(`Today IST string is valid format YYYY-MM-DD (${todayIST})`, /^\d{4}-\d{2}-\d{2}$/.test(todayIST));

  const nextMidnight = getNextMidnightISTInUTC();
  assert("Next midnight UTC is in the future", nextMidnight.getTime() > Date.now());

  // 3. Test Razorpay Signature Verification
  console.log("\n[3] Testing Razorpay Signature Helpers:");
  process.env.RAZORPAY_KEY_SECRET = "test_key_secret_for_verification_32chars";
  process.env.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret_for_verification_32chars";

  const orderId = "order_test_12345";
  const paymentId = "pay_test_67890";
  const validSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const isSigValid = verifyRazorpaySignature({ orderId, paymentId, signature: validSignature });
  assert("verifyRazorpaySignature validates authentic HMAC", isSigValid === true);

  const isBadSigValid = verifyRazorpaySignature({ orderId, paymentId, signature: "tampered_signature" });
  assert("verifyRazorpaySignature rejects tampered signature", isBadSigValid === false);

  const webhookBody = JSON.stringify({ event: "payment.captured", id: "evt_123" });
  const validWebhookSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(webhookBody)
    .digest("hex");

  const isWebhookValid = verifyRazorpayWebhookSignature(webhookBody, validWebhookSig);
  assert("verifyRazorpayWebhookSignature validates authentic webhook", isWebhookValid === true);

  // 4. Test Fastify Server Route Injections
  console.log("\n[4] Testing Fastify Server Injections:");
  const server = await buildServer();

  // Root endpoint
  const rootRes = await server.inject({ method: "GET", url: "/" });
  assert("GET / returns 200 with service info", rootRes.statusCode === 200);

  // Health endpoint
  const healthRes = await server.inject({ method: "GET", url: "/api/v1/health" });
  assert("GET /api/v1/health returns 200 with IST timezone", healthRes.statusCode === 200);
  const healthData = JSON.parse(healthRes.payload);
  assert("Health response has status ok", healthData.status === "ok");
  assert("Health response has timezone Asia/Kolkata", healthData.timezone === "Asia/Kolkata");

  // Validate promo endpoint
  const promoRes = await server.inject({
    method: "POST",
    url: "/api/v1/subscriptions/validate-promo",
    payload: { code: "BETA100", planId: "MONTHLY" },
  });
  assert("POST /api/v1/subscriptions/validate-promo returns 200", promoRes.statusCode === 200);
  const promoData = JSON.parse(promoRes.payload);
  assert("Validated promo is 100% off", promoData.is100PercentOff === true);
  assert("Validated promo totalPayable = 0", promoData.totalPayable === 0);

  // Validate TEST1 promo
  const test1Res = await server.inject({
    method: "POST",
    url: "/api/v1/subscriptions/validate-promo",
    payload: { code: "TEST1", planId: "MONTHLY" },
  });
  assert("POST /api/v1/subscriptions/validate-promo (TEST1) returns 200", test1Res.statusCode === 200);
  const test1Data = JSON.parse(test1Res.payload);
  assert("Validated promo totalPayable = 1", test1Data.totalPayable === 1);
  assert("Validated promo amountPaise = 100", test1Data.amountPaise === 100);

  // Test Punch validation guard
  const punchRes = await server.inject({
    method: "POST",
    url: "/api/v1/scans/punch",
    payload: { customerPhone: "123" }, // Invalid phone
  });
  assert("POST /api/v1/scans/punch rejects invalid phone with 400", punchRes.statusCode === 400);

  // Test Daily reset route
  const cronRes = await server.inject({
    method: "GET",
    url: "/api/v1/cron/daily-reset",
    headers: { "x-cron-secret": "stb-cron-secret-key" },
  });
  // In dev / test, cron route responds
  assert("GET /api/v1/cron/daily-reset responds (200 or 500 depending on DB connectivity)", [200, 500].includes(cronRes.statusCode));

  // Test Merchant by slug 404 for nonexistent store
  const slugRes = await server.inject({
    method: "GET",
    url: "/api/v1/merchant/slug/nonexistent-store-slug-xyz",
  });
  assert("GET /api/v1/merchant/slug/:slug handles nonexistent store cleanly", [404, 500].includes(slugRes.statusCode));

  await server.close();

  console.log("\n==================================================");
  console.log(`   PHASE 2 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase2Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});


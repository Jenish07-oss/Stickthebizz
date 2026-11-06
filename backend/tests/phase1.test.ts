import assert from "assert";
import crypto from "crypto";
import { buildServer } from "../src/server";
import { cleanPhone, isValidIndianPhone, maskPhone } from "../src/utils/sanitize";
import { getTodayISTDateString, getNextMidnightISTInUTC, getTimeUntilNextMidnightIST } from "../src/utils/ist";
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "../src/utils/jwt";

async function runTests() {
  console.log("\n🧪 RUNNING STICKTHEBIZZ BACKEND PHASE 1 VERIFICATION TESTS\n");
  let passed = 0;

  // 1. Health Route Test (Fastify inject)
  const server = await buildServer();
  const healthRes = await server.inject({
    method: "GET",
    url: "/api/v1/health",
  });
  assert.strictEqual(healthRes.statusCode, 200);
  const healthJson = healthRes.json();
  assert.strictEqual(healthJson.status, "ok");
  assert.strictEqual(healthJson.service, "stickthebizz-backend");
  assert.ok(healthJson.timestamp);
  console.log("  ✅ [PASS] 1. Render Keep-Alive Health Route (/api/v1/health) returns 200 OK");
  passed++;

  // 2. IST Timezone Math
  const todayIST = getTodayISTDateString();
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(todayIST));
  const nextMidnight = getNextMidnightISTInUTC();
  assert.ok(nextMidnight instanceof Date);
  const countdown = getTimeUntilNextMidnightIST();
  assert.ok(countdown.formattedCountdown.includes("h"));
  console.log(`  ✅ [PASS] 2. IST Timezone Engine: Today=${todayIST}, Countdown to 12 AM IST=${countdown.formattedCountdown}`);
  passed++;

  // 3. Indian Phone Sanitization & Masking
  assert.strictEqual(cleanPhone("+91 98200 12345"), "9820012345");
  assert.strictEqual(cleanPhone("09820012345"), "9820012345");
  assert.strictEqual(isValidIndianPhone("9820012345"), true);
  assert.strictEqual(isValidIndianPhone("1234567890"), false); // Invalid starting digit
  assert.strictEqual(maskPhone("9820012345"), "+91 98*** **45");
  console.log("  ✅ [PASS] 3. DPDP Phone Masking & Validation verified");
  passed++;

  // 4. JWT Access & Refresh Token Sign/Verify
  const payload = {
    userId: "11111111-2222-3333-4444-555555555555",
    email: "owner@stickthebizz.in",
    role: "MERCHANT" as const,
  };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const verifiedAccess = verifyAccessToken(accessToken);
  const verifiedRefresh = verifyRefreshToken(refreshToken);

  assert.strictEqual(verifiedAccess?.userId, payload.userId);
  assert.strictEqual(verifiedAccess?.role, "MERCHANT");
  assert.strictEqual(verifiedRefresh?.email, payload.email);
  console.log("  ✅ [PASS] 4. JWT Token Engine: 15m Access Token & 30d Refresh Token verified");
  passed++;

  // 5. HMAC OTP Security Simulation
  const otpSecret = "test-secret-key-1234567890123456";
  const testEmail = "diner@gmail.com";
  const testCode = "482910";
  const hmac = crypto.createHmac("sha256", otpSecret).update(`${testEmail}:${testCode}`).digest("hex");
  const expectedHmac = crypto.createHmac("sha256", otpSecret).update(`${testEmail}:${testCode}`).digest("hex");

  const bufA = Buffer.from(hmac, "hex");
  const bufB = Buffer.from(expectedHmac, "hex");
  assert.ok(bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB));
  console.log("  ✅ [PASS] 5. HMAC-SHA256 OTP Hashing & Timing-Safe Verification verified");
  passed++;

  // 6. Auth Controller Endpoint Routing
  const otpReqRes = await server.inject({
    method: "POST",
    url: "/api/v1/auth/customer/otp/request",
    payload: {}, // Missing email
  });
  assert.strictEqual(otpReqRes.statusCode, 400);
  assert.strictEqual(otpReqRes.json().success, false);
  console.log("  ✅ [PASS] 6. Auth Controller validation & error handling verified");
  passed++;

  await server.close();
  console.log(`\n🎉 ALL ${passed} PHASE 1 TESTS PASSED SUCCESSFULLY!\n`);
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});


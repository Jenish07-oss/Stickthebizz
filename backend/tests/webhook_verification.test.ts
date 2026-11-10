import crypto from "crypto";

// Set valid baseline environment in test runner before importing configuration
process.env.APP_ENV = "test";
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgres://offline-mock-db:5432/mock_db";
process.env.RAZORPAY_KEY_ID = "rzp_test_mockKeyForTestHarnessBaseline";
process.env.RAZORPAY_KEY_SECRET = "mock_api_key_secret_24_chars";
process.env.RAZORPAY_WEBHOOK_SECRET = "mock_dedicated_webhook_secret_32_chars";
process.env.NON_PRODUCTION_EMAIL_ALLOWLIST = "test@stickthebizz.in";
process.env.JWT_ACCESS_SECRET = "mock-access-secret-32-chars-minimum-safe";
process.env.JWT_REFRESH_SECRET = "mock-refresh-secret-32-chars-minimum-safe";
process.env.OTP_SECRET = "mock-otp-hmac-secret-32-chars-minimum-safe";
process.env.CRON_SECRET = "mock-cron-secret-32-chars-minimum-safe";

async function runWebhookVerificationTests() {
  console.log("==================================================");
  console.log("   STICKTHEBIZZ VULN-01 WEBHOOK SECURITY SUITE");
  console.log("   (Phase 3G.10.2: Fail-Closed Signature Gate)");
  console.log("==================================================");

  const { razorpayWebhookHandler } = await import("../src/controllers/webhook.controller.js");
  const { verifyRazorpayWebhookSignature } = await import("../src/config/razorpay.js");
  const { prisma } = await import("../src/config/db.js");
  const { env } = await import("../src/config/env.js");

  let passed = 0;
  let failed = 0;

  function testAssert(desc: string, condition: boolean, extraInfo?: any) {
    if (condition) {
      console.log(`  ✅ ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${desc}`, extraInfo || "");
      failed++;
    }
  }

  // Spy counters for database mutations
  let merchantUpdateCalls: any[] = [];
  let auditLogCreateCalls: any[] = [];

  // Mock Prisma methods
  (prisma as any).user = {
    findUnique: async ({ where }: any) => {
      if (where.email === "merchant@stickthebizz.in") {
        return {
          id: "mock-user-uuid-1",
          email: "merchant@stickthebizz.in",
          merchants: [{ id: "mock-merchant-uuid-1", name: "Test Store" }],
        };
      }
      return null;
    },
  };

  (prisma as any).merchant = {
    update: async (args: any) => {
      merchantUpdateCalls.push(args);
      return { id: args.where.id, ...args.data };
    },
  };

  (prisma as any).auditLog = {
    create: async (args: any) => {
      auditLogCreateCalls.push(args);
      return { id: "mock-audit-uuid", ...args.data };
    },
  };

  function createMockContext(options: {
    headers?: Record<string, string>;
    rawBody?: string | Buffer;
    body?: any;
  }) {
    let statusCode = 200;
    let sentData: any = null;
    const reply: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      send(data: any) {
        sentData = data;
        return this;
      },
    };
    const req: any = {
      headers: options.headers || {},
      rawBody: options.rawBody,
      body: options.body,
      log: {
        warn: () => {},
        error: () => {},
        info: () => {},
      },
    };
    return {
      req,
      reply,
      getResponse: () => ({ statusCode, data: sentData }),
    };
  }

  function signPayload(body: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(body).digest("hex");
  }

  const validPayload = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_test_payment_12345",
          order_id: "order_test_order_67890",
          notes: {
            email: "merchant@stickthebizz.in",
            plan: "YEARLY",
          },
        },
      },
    },
  });

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  const apiKeySecret = process.env.RAZORPAY_KEY_SECRET!;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Missing signature header is rejected with HTTP 400
    // -------------------------------------------------------------------------
    console.log("\n[TEST 1] Missing signature header rejection:");
    {
      merchantUpdateCalls = [];
      const { req, reply, getResponse } = createMockContext({
        headers: {}, // No x-razorpay-signature
        rawBody: validPayload,
        body: JSON.parse(validPayload),
      });

      await razorpayWebhookHandler(req, reply);
      const res = getResponse();

      testAssert(
        "Missing signature header returns HTTP 400",
        res.statusCode === 400 && res.data?.error === "Missing or invalid webhook signature",
        res
      );
      testAssert(
        "Missing signature header causes ZERO database merchant updates",
        merchantUpdateCalls.length === 0,
        { calls: merchantUpdateCalls.length }
      );
    }

    // -------------------------------------------------------------------------
    // TEST 2: Empty or whitespace-only signature is rejected with HTTP 400
    // -------------------------------------------------------------------------
    console.log("\n[TEST 2] Empty or whitespace-only signature rejection:");
    {
      for (const badSig of ["", "   ", "\t"]) {
        merchantUpdateCalls = [];
        const { req, reply, getResponse } = createMockContext({
          headers: { "x-razorpay-signature": badSig },
          rawBody: validPayload,
          body: JSON.parse(validPayload),
        });

        await razorpayWebhookHandler(req, reply);
        const res = getResponse();

        testAssert(
          `Signature '${badSig}' returns HTTP 400`,
          res.statusCode === 400 && res.data?.error === "Missing or invalid webhook signature",
          res
        );
        testAssert(
          `Signature '${badSig}' causes ZERO database updates`,
          merchantUpdateCalls.length === 0
        );
      }
    }

    // -------------------------------------------------------------------------
    // TEST 3: Missing rawBody is rejected with HTTP 400
    // -------------------------------------------------------------------------
    console.log("\n[TEST 3] Missing rawBody rejection:");
    {
      merchantUpdateCalls = [];
      const validSig = signPayload(validPayload, webhookSecret);
      const { req, reply, getResponse } = createMockContext({
        headers: { "x-razorpay-signature": validSig },
        rawBody: undefined, // rawBody missing
        body: JSON.parse(validPayload),
      });

      await razorpayWebhookHandler(req, reply);
      const res = getResponse();

      testAssert(
        "Missing rawBody returns HTTP 400",
        res.statusCode === 400 && res.data?.error === "Missing raw request body for signature verification",
        res
      );
      testAssert(
        "Missing rawBody causes ZERO database updates",
        merchantUpdateCalls.length === 0
      );
    }

    // -------------------------------------------------------------------------
    // TEST 4: Invalid signature is rejected with HTTP 400
    // -------------------------------------------------------------------------
    console.log("\n[TEST 4] Invalid signature rejection:");
    {
      merchantUpdateCalls = [];
      const forgedSig = "0000000000000000000000000000000000000000000000000000000000000000";
      const { req, reply, getResponse } = createMockContext({
        headers: { "x-razorpay-signature": forgedSig },
        rawBody: validPayload,
        body: JSON.parse(validPayload),
      });

      await razorpayWebhookHandler(req, reply);
      const res = getResponse();

      testAssert(
        "Forged signature returns HTTP 400",
        res.statusCode === 400 && res.data?.error === "Invalid signature",
        res
      );
      testAssert(
        "Forged signature causes ZERO database updates",
        merchantUpdateCalls.length === 0
      );
    }

    // -------------------------------------------------------------------------
    // TEST 5: API Key Secret CANNOT substitute for Webhook Secret
    // -------------------------------------------------------------------------
    console.log("\n[TEST 5] API Key Secret separation check:");
    {
      merchantUpdateCalls = [];
      // Sign with RAZORPAY_KEY_SECRET instead of RAZORPAY_WEBHOOK_SECRET
      const sigWithKeySecret = signPayload(validPayload, apiKeySecret);
      const { req, reply, getResponse } = createMockContext({
        headers: { "x-razorpay-signature": sigWithKeySecret },
        rawBody: validPayload,
        body: JSON.parse(validPayload),
      });

      await razorpayWebhookHandler(req, reply);
      const res = getResponse();

      testAssert(
        "Signature signed with RAZORPAY_KEY_SECRET is strictly rejected (HTTP 400)",
        res.statusCode === 400 && res.data?.error === "Invalid signature",
        res
      );
      testAssert(
        "API key secret signature causes ZERO database updates",
        merchantUpdateCalls.length === 0
      );
    }

    // -------------------------------------------------------------------------
    // TEST 6: Missing / unconfigured Webhook Secret fails closed
    // -------------------------------------------------------------------------
    console.log("\n[TEST 6] Missing webhook secret fail-closed:");
    {
      merchantUpdateCalls = [];
      const savedSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const savedEnvSecret = (env as any).RAZORPAY_WEBHOOK_SECRET;

      try {
        process.env.RAZORPAY_WEBHOOK_SECRET = "";
        (env as any).RAZORPAY_WEBHOOK_SECRET = "";

        const validSig = signPayload(validPayload, webhookSecret);
        const { req, reply, getResponse } = createMockContext({
          headers: { "x-razorpay-signature": validSig },
          rawBody: validPayload,
          body: JSON.parse(validPayload),
        });

        await razorpayWebhookHandler(req, reply);
        const res = getResponse();

        testAssert(
          "Unconfigured webhook secret returns HTTP 400 (fail-closed)",
          res.statusCode === 400 && res.data?.error === "Invalid signature",
          res
        );
        testAssert(
          "Unconfigured webhook secret causes ZERO database updates",
          merchantUpdateCalls.length === 0
        );

        // Also test verifyRazorpayWebhookSignature directly
        const directVerify = verifyRazorpayWebhookSignature(validPayload, validSig);
        testAssert(
          "verifyRazorpayWebhookSignature returns false when secret is empty",
          directVerify === false
        );
      } finally {
        process.env.RAZORPAY_WEBHOOK_SECRET = savedSecret;
        (env as any).RAZORPAY_WEBHOOK_SECRET = savedEnvSecret;
      }
    }

    // -------------------------------------------------------------------------
    // TEST 7: Valid signature with payment.captured event activates subscription
    // -------------------------------------------------------------------------
    console.log("\n[TEST 7] Valid signature payment.captured processing:");
    {
      merchantUpdateCalls = [];
      auditLogCreateCalls = [];
      const validSig = signPayload(validPayload, webhookSecret);
      const { req, reply, getResponse } = createMockContext({
        headers: { "x-razorpay-signature": validSig },
        rawBody: validPayload,
        body: JSON.parse(validPayload),
      });

      await razorpayWebhookHandler(req, reply);
      const res = getResponse();

      testAssert(
        "Valid webhook signature returns HTTP 200 { status: 'ok' }",
        res.statusCode === 200 && res.data?.status === "ok",
        res
      );
      testAssert(
        "Valid webhook signature successfully updates merchant subscription to ACTIVE",
        merchantUpdateCalls.length === 1 &&
          merchantUpdateCalls[0].where.id === "mock-merchant-uuid-1" &&
          merchantUpdateCalls[0].data.subscriptionStatus === "ACTIVE" &&
          merchantUpdateCalls[0].data.subscriptionPlan === "YEARLY" &&
          merchantUpdateCalls[0].data.razorpayPaymentId === "pay_test_payment_12345",
        merchantUpdateCalls[0]
      );
      testAssert(
        "Valid webhook signature creates an audit log record",
        auditLogCreateCalls.length === 1 &&
          auditLogCreateCalls[0].data.actorType === "WEBHOOK_RAZORPAY" &&
          auditLogCreateCalls[0].data.action === "SUBSCRIPTION_AUTO_EXTENDED"
      );
    }

    // -------------------------------------------------------------------------
    // TEST 8: Valid signature with order.paid event activates subscription
    // -------------------------------------------------------------------------
    console.log("\n[TEST 8] Valid signature order.paid processing:");
    {
      merchantUpdateCalls = [];
      auditLogCreateCalls = [];

      const orderPaidPayload = JSON.stringify({
        event: "order.paid",
        payload: {
          payment: {
            entity: {
              id: "pay_test_order_paid_55555",
              order_id: "order_test_99999",
              notes: {
                email: "merchant@stickthebizz.in",
                plan: "MONTHLY",
              },
            },
          },
        },
      });

      const validSig = signPayload(orderPaidPayload, webhookSecret);
      const { req, reply, getResponse } = createMockContext({
        headers: { "x-razorpay-signature": validSig },
        rawBody: orderPaidPayload,
        body: JSON.parse(orderPaidPayload),
      });

      await razorpayWebhookHandler(req, reply);
      const res = getResponse();

      testAssert(
        "Valid order.paid event returns HTTP 200",
        res.statusCode === 200 && res.data?.status === "ok",
        res
      );
      testAssert(
        "Valid order.paid event updates merchant subscription plan to MONTHLY",
        merchantUpdateCalls.length === 1 &&
          merchantUpdateCalls[0].data.subscriptionPlan === "MONTHLY" &&
          merchantUpdateCalls[0].data.subscriptionStatus === "ACTIVE"
      );
    }

    // -------------------------------------------------------------------------
    // TEST 9: Raw body byte-for-byte fidelity (timing safe & malformed sigs)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 9] Raw body byte-for-byte fidelity and malformed signatures:");
    {
      // Truncated signature (wrong byte length)
      const truncatedSig = "abc";
      const directVerify = verifyRazorpayWebhookSignature(validPayload, truncatedSig);
      testAssert(
        "Truncated signature of incorrect length returns false without throwing",
        directVerify === false
      );

      // Buffer raw body support
      const bufRawBody = Buffer.from(validPayload, "utf8");
      const validSig = signPayload(validPayload, webhookSecret);
      const bufVerify = verifyRazorpayWebhookSignature(bufRawBody, validSig);
      testAssert(
        "Buffer raw body is supported and validates correctly",
        bufVerify === true
      );
    }

  } catch (err) {
    console.error("Test execution exception:", err);
    failed++;
  }

  console.log("\n==================================================");
  console.log(`   WEBHOOK SECURITY SUITE RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runWebhookVerificationTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});

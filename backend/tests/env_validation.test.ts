import { spawnSync } from "child_process";
import path from "path";
import { pathToFileURL } from "url";

// Set valid baseline environment in test runner to prevent invalid runtime import
process.env.APP_ENV = "test";
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgres://offline-mock-db:5432/mock_db";
process.env.RAZORPAY_KEY_ID = "rzp_test_mockKeyForTestHarnessBaseline";
process.env.NON_PRODUCTION_EMAIL_ALLOWLIST = "test@stickthebizz.in";

async function runEnvValidationTests() {
  console.log("==================================================");
  console.log("   STICKTHEBIZZ RAZORPAY ENVIRONMENT VALIDATION TEST");
  console.log("   (Phase 3G.3.2: Strict Fail-Safe & Explicit APP_ENV)");
  console.log("==================================================");

  // Import schema using valid baseline
  const { envSchema, env } = await import("../src/config/env.js");

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

  // Preserve initial process.env to guarantee isolation and zero leakage
  const initialProcessEnv = { ...process.env };

  function restoreProcessEnv() {
    for (const key of Object.keys(process.env)) {
      if (!(key in initialProcessEnv)) {
        delete process.env[key];
      }
    }
    for (const [key, value] of Object.entries(initialProcessEnv)) {
      process.env[key] = value;
    }
  }

  const baseValidEnv = {
    PORT: "8000",
    APP_ENV: "development" as const,
    NODE_ENV: "development" as const,
    FRONTEND_URL: "http://localhost:3000",
    DATABASE_URL: "postgres://mock-db-host:5432/mock_db",
    JWT_ACCESS_SECRET: "mock-access-secret-32-chars-minimum-safe",
    JWT_REFRESH_SECRET: "mock-refresh-secret-32-chars-minimum-safe",
    OTP_SECRET: "mock-otp-hmac-secret-32-chars-minimum-safe",
    RAZORPAY_KEY_ID: "rzp_test_mockKey12345",
    RESEND_API_KEY: "re_mock_test_key_for_baseline",
    NON_PRODUCTION_EMAIL_ALLOWLIST: "dev@stickthebizz.in",
  };

  try {
    // -------------------------------------------------------------------------
    // TEST 1: All 4 valid APP_ENV values with correct credential prefixes
    // -------------------------------------------------------------------------
    console.log("\n[TEST 1] All 4 valid APP_ENV values with correct credential prefixes:");
    {
      const validCases = [
        { env: "development" as const, key: "rzp_test_dev123" },
        { env: "test" as const, key: "rzp_test_test456" },
        { env: "staging" as const, key: "rzp_test_staging789" },
        { env: "production" as const, key: "rzp_live_prod999" },
      ];

      for (const { env, key } of validCases) {
        const fixture = {
          ...baseValidEnv,
          APP_ENV: env,
          RAZORPAY_KEY_ID: key,
        };
        const res = envSchema.safeParse(fixture);
        testAssert(
          `APP_ENV='${env}' with correct prefix key is accepted`,
          res.success === true && res.data.RAZORPAY_KEY_ID === key,
          res.success ? null : res.error.issues
        );
      }
    }

    // -------------------------------------------------------------------------
    // TEST 2: All 4 environments reject opposite credential prefix
    // -------------------------------------------------------------------------
    console.log("\n[TEST 2] All 4 environments reject opposite credential prefix:");
    {
      const invalidCases = [
        { env: "development" as const, key: "rzp_live_dev123", expectedReject: "Live credentials ('rzp_live_') are strictly prohibited" },
        { env: "test" as const, key: "rzp_live_test456", expectedReject: "Live credentials ('rzp_live_') are strictly prohibited" },
        { env: "staging" as const, key: "rzp_live_staging789", expectedReject: "Live credentials ('rzp_live_') are strictly prohibited" },
        { env: "production" as const, key: "rzp_test_prod999", expectedReject: "Test credentials ('rzp_test_') are strictly prohibited" },
      ];

      for (const { env, key, expectedReject } of invalidCases) {
        const fixture = {
          ...baseValidEnv,
          APP_ENV: env,
          RAZORPAY_KEY_ID: key,
        };
        const res = envSchema.safeParse(fixture);
        testAssert(
          `APP_ENV='${env}' strictly rejects opposite prefix key`,
          res.success === false &&
            res.error.issues.some((i) => i.path.includes("RAZORPAY_KEY_ID") && i.message.includes(expectedReject)),
          res.success ? "Unexpected success" : res.error.issues
        );
      }
    }

    // -------------------------------------------------------------------------
    // TEST 3: Missing APP_ENV is rejected
    // -------------------------------------------------------------------------
    console.log("\n[TEST 3] Missing APP_ENV is rejected:");
    {
      const fixture = {
        ...baseValidEnv,
        APP_ENV: undefined,
        RAZORPAY_KEY_ID: "rzp_test_key123",
      };
      const res = envSchema.safeParse(fixture);
      testAssert(
        "Missing APP_ENV is strictly rejected (no default allowed)",
        res.success === false && res.error.issues.some((i) => i.path.includes("APP_ENV")),
        res.success ? "Unexpected success" : res.error.issues
      );
    }

    // -------------------------------------------------------------------------
    // TEST 4: Invalid APP_ENV is rejected
    // -------------------------------------------------------------------------
    console.log("\n[TEST 4] Invalid APP_ENV values are rejected:");
    {
      for (const invalidEnv of ["qa", "prod", "uat", "", "DEVELOPMENT"]) {
        const fixture = {
          ...baseValidEnv,
          APP_ENV: invalidEnv,
          RAZORPAY_KEY_ID: "rzp_test_key123",
        };
        const res = envSchema.safeParse(fixture);
        testAssert(
          `Invalid APP_ENV='${invalidEnv}' is rejected`,
          res.success === false && res.error.issues.some((i) => i.path.includes("APP_ENV")),
          res.success ? "Unexpected success" : res.error.issues
        );
      }
    }

    // -------------------------------------------------------------------------
    // TEST 5: Production NODE_ENV with missing APP_ENV is rejected
    // -------------------------------------------------------------------------
    console.log("\n[TEST 5] Production NODE_ENV with missing APP_ENV is rejected:");
    {
      const fixture = {
        ...baseValidEnv,
        NODE_ENV: "production",
        APP_ENV: undefined, // Missing APP_ENV
        RAZORPAY_KEY_ID: "rzp_live_key123",
      };
      const res = envSchema.safeParse(fixture);
      testAssert(
        "NODE_ENV='production' with missing APP_ENV fails validation (no inference)",
        res.success === false && res.error.issues.some((i) => i.path.includes("APP_ENV")),
        res.success ? "Unexpected success" : res.error.issues
      );
    }

    // -------------------------------------------------------------------------
    // TEST 6: Staging APP_ENV with production NODE_ENV accepts only test key
    // -------------------------------------------------------------------------
    console.log("\n[TEST 6] Staging APP_ENV with production NODE_ENV:");
    {
      const fixtureTestKey = {
        ...baseValidEnv,
        NODE_ENV: "production",
        APP_ENV: "staging",
        RAZORPAY_KEY_ID: "rzp_test_stagingKey123",
      };
      const resTestKey = envSchema.safeParse(fixtureTestKey);
      testAssert(
        "Staging with NODE_ENV='production' accepts test key",
        resTestKey.success === true && resTestKey.data.RAZORPAY_KEY_ID === "rzp_test_stagingKey123",
        resTestKey.success ? null : resTestKey.error.issues
      );

      const fixtureLiveKey = {
        ...baseValidEnv,
        NODE_ENV: "production",
        APP_ENV: "staging",
        RAZORPAY_KEY_ID: "rzp_live_stagingForbiddenKey123",
      };
      const resLiveKey = envSchema.safeParse(fixtureLiveKey);
      testAssert(
        "Staging with NODE_ENV='production' strictly rejects live key",
        resLiveKey.success === false &&
          resLiveKey.error.issues.some((i) => i.path.includes("RAZORPAY_KEY_ID")),
        resLiveKey.success ? "Unexpected success" : resLiveKey.error.issues
      );
    }

    // -------------------------------------------------------------------------
    // TEST 7: Missing, empty, whitespace-only, and malformed keys rejected
    // -------------------------------------------------------------------------
    console.log("\n[TEST 7] Missing, empty, whitespace-only and malformed keys rejected:");
    {
      const malformedKeys = [
        { desc: "missing (undefined)", val: undefined },
        { desc: "empty string", val: "" },
        { desc: "spaces only", val: "   " },
        { desc: "leading space", val: " rzp_test_validPrefix" },
        { desc: "trailing space", val: "rzp_test_validPrefix " },
        { desc: "internal space", val: "rzp_test_ validPrefix" },
        { desc: "tab character only", val: "\t" },
        { desc: "invalid prefix", val: "pk_test_12345" },
      ];

      for (const { desc, val } of malformedKeys) {
        const fixture = {
          ...baseValidEnv,
          APP_ENV: "staging",
          RAZORPAY_KEY_ID: val,
        };
        const res = envSchema.safeParse(fixture);
        testAssert(
          `Malformed key (${desc}) is strictly rejected`,
          res.success === false && res.error.issues.some((i) => i.path.includes("RAZORPAY_KEY_ID")),
          res.success ? "Unexpected success" : res.error.issues
        );
      }
    }

    // -------------------------------------------------------------------------
    // TEST 8: Invalid schema configuration never produces exported runtime env
    // -------------------------------------------------------------------------
    console.log("\n[TEST 8] Invalid schema configuration produces no usable runtime env:");
    {
      testAssert(
        "Exported env is the strictly validated data matching baseline",
        env.APP_ENV === "test" && env.RAZORPAY_KEY_ID === "rzp_test_mockKeyForTestHarnessBaseline"
      );
      testAssert(
        "Exported env does not contain fabricated 'rzp_test_fallbackKey'",
        (env as any).RAZORPAY_KEY_ID !== "rzp_test_fallbackKey"
      );
    }

    // -------------------------------------------------------------------------
    // TEST 9: Credential disclosure prevention in errors
    // -------------------------------------------------------------------------
    console.log("\n[TEST 9] Credential disclosure prevention:");
    {
      const sensitiveToken = "SUPER_SECRET_PAYMENT_CREDENTIAL_VAL_99999";
      const fixtureSensitive = {
        ...baseValidEnv,
        APP_ENV: "staging",
        RAZORPAY_KEY_ID: `rzp_live_${sensitiveToken}`,
      };
      const resSensitive = envSchema.safeParse(fixtureSensitive);
      testAssert("Rejection occurs for sensitive key", resSensitive.success === false);

      if (!resSensitive.success) {
        const errorJson = JSON.stringify(resSensitive.error.issues);
        const errorFormatted = JSON.stringify(resSensitive.error.format());
        const leakedInIssues = errorJson.includes(sensitiveToken);
        const leakedInFormatted = errorFormatted.includes(sensitiveToken);

        testAssert(
          "Error message JSON issues do not contain secret value",
          !leakedInIssues,
          { leakedInIssues }
        );
        testAssert(
          "Formatted error output does not contain secret value",
          !leakedInFormatted,
          { leakedInFormatted }
        );
      }
    }

    // -------------------------------------------------------------------------
    // TEST 10: Process environment isolation & restoration
    // -------------------------------------------------------------------------
    console.log("\n[TEST 10] Process environment isolation & restoration:");
    {
      process.env.TEST_TEMP_ISOLATION_CHECK = "leak_verification";
      process.env.APP_ENV = "staging";
      process.env.RAZORPAY_KEY_ID = "rzp_test_tempIsolated";

      const parsedWithProcessEnv = envSchema.safeParse({
        ...baseValidEnv,
        ...process.env,
      });
      testAssert(
        "Can evaluate schema with environment fixture",
        parsedWithProcessEnv.success === true
      );

      restoreProcessEnv();

      testAssert(
        "process.env successfully restored without leaked temporary keys",
        process.env.TEST_TEMP_ISOLATION_CHECK === undefined &&
          process.env.APP_ENV === initialProcessEnv.APP_ENV
      );
    }

    // -------------------------------------------------------------------------
    // TEST 11: Child-Process Runtime Startup Fail-Closed Checks
    // -------------------------------------------------------------------------
    console.log("\n[TEST 11] Child-Process Runtime Startup Fail-Closed Checks:");
    {
      const envTsPath = path.resolve("backend/src/config/env.ts");
      const envFileUrl = pathToFileURL(envTsPath).href;

      const runChildProcess = (customEnv: Record<string, string>, extraArgs: string[] = []) => {
        const cmd = process.platform === "win32" ? (process.env.ComSpec || "cmd.exe") : "npx";
        const args = process.platform === "win32"
          ? ["/c", "npx", "tsx", ...extraArgs, "-e", `import('${envFileUrl}')`]
          : ["tsx", ...extraArgs, "-e", `import('${envFileUrl}')`];

        return spawnSync(cmd, args, {
          cwd: path.resolve("backend"),
          env: {
            ...process.env,
            ...customEnv,
          },
        });
      };

      // Case A: Missing APP_ENV in runtime -> MUST EXIT 1
      const childMissingAppEnv = runChildProcess({
        NODE_ENV: "production",
        RAZORPAY_KEY_ID: "rzp_live_sampleKey",
        DATABASE_URL: "postgres://mock:5432/db",
        APP_ENV: "", // Empty / missing
      });
      testAssert(
        "Child process with missing APP_ENV exits nonzero (exit code 1)",
        childMissingAppEnv.status === 1,
        { status: childMissingAppEnv.status }
      );

      // Case B: Staging with live key + NODE_ENV=production -> MUST EXIT 1
      const childStagingLive = runChildProcess({
        APP_ENV: "staging",
        NODE_ENV: "production",
        RAZORPAY_KEY_ID: "rzp_live_forbiddenInStagingKey",
        DATABASE_URL: "postgres://mock:5432/db",
      });
      testAssert(
        "Child process with staging + live key exits nonzero (exit code 1)",
        childStagingLive.status === 1,
        { status: childStagingLive.status }
      );

      // Case C: Production with test key -> MUST EXIT 1
      const childProdTest = runChildProcess({
        APP_ENV: "production",
        NODE_ENV: "production",
        RAZORPAY_KEY_ID: "rzp_test_forbiddenInProdKey",
        DATABASE_URL: "postgres://mock:5432/db",
      });
      testAssert(
        "Child process with production + test key exits nonzero (exit code 1)",
        childProdTest.status === 1,
        { status: childProdTest.status }
      );

      // Case D: Arbitrary process arguments containing 'test' do NOT bypass validation -> MUST EXIT NONZERO
      const childArgBypassAttempt = runChildProcess(
        {
          APP_ENV: "production",
          NODE_ENV: "production",
          RAZORPAY_KEY_ID: "rzp_test_shouldBeRejected",
          DATABASE_URL: "postgres://mock:5432/db",
        },
        ["--", "arbitrary-test-suite-arg"] // Spurious CLI args containing 'test'
      );
      testAssert(
        "Arbitrary arguments containing 'test' do NOT bypass validation (exits nonzero)",
        childArgBypassAttempt.status !== 0,
        { status: childArgBypassAttempt.status }
      );

      // Case E: Valid staging setup -> MUST EXIT 0
      const childStagingValid = runChildProcess({
        APP_ENV: "staging",
        NODE_ENV: "production",
        RAZORPAY_KEY_ID: "rzp_test_validStagingKey123",
        DATABASE_URL: "postgres://mock:5432/db",
        RESEND_API_KEY: "re_mock_valid_staging_key",
        NON_PRODUCTION_EMAIL_ALLOWLIST: "staging-tester@stickthebizz.in",
      });
      testAssert(
        "Child process with valid staging configuration and NODE_ENV=production exits 0",
        childStagingValid.status === 0,
        { status: childStagingValid.status }
      );

      // Case F: Valid production setup -> MUST EXIT 0
      const childProdValid = runChildProcess({
        APP_ENV: "production",
        NODE_ENV: "production",
        RAZORPAY_KEY_ID: "rzp_live_validProductionKey123",
        DATABASE_URL: "postgres://mock:5432/db",
      });
      testAssert(
        "Child process with valid production configuration and live key exits 0",
        childProdValid.status === 0,
        { status: childProdValid.status }
      );
    }
  } finally {
    restoreProcessEnv();
  }

  console.log("\n==================================================");
  console.log(`   ENVIRONMENT VALIDATION RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runEnvValidationTests().catch((err) => {
  console.error("Unexpected test harness failure:", err);
  process.exit(1);
});

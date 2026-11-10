// Set baseline test process environment
(process.env as any).NODE_ENV = "test";
process.env.NEXT_PUBLIC_APP_ENV = "development";

import { validateFrontendEnv, PRODUCTION_BACKEND_HOSTNAME } from "../src/lib/config/env";
import fs from "fs";
import path from "path";

async function runFrontendEnvConfigTests() {
  console.log("==================================================");
  console.log("   STICKTHEBIZZ FRONTEND ENVIRONMENT CONFIG TESTS");
  console.log("   (Phase 3G.6: FE-SEC-01 - FE-SEC-04 Remediation)");
  console.log("==================================================");

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

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Local development with explicit localhost API URL
    // -------------------------------------------------------------------------
    console.log("\n[TEST 1] Local development with explicit localhost API URL:");
    {
      const res = validateFrontendEnv({
        NEXT_PUBLIC_APP_ENV: "development",
        NEXT_PUBLIC_API_URL: "http://localhost:8000",
      });
      testAssert(
        "Local dev with explicit http://localhost:8000 succeeds",
        res.APP_ENV === "development" && res.API_BASE_URL === "http://localhost:8000"
      );
    }

    // -------------------------------------------------------------------------
    // TEST 2: Local development with permitted localhost default
    // -------------------------------------------------------------------------
    console.log("\n[TEST 2] Local development with permitted localhost default:");
    {
      const res = validateFrontendEnv({
        NEXT_PUBLIC_APP_ENV: "development",
        NEXT_PUBLIC_API_URL: "",
      });
      testAssert(
        "Local dev with omitted/empty API URL defaults to http://localhost:8000",
        res.APP_ENV === "development" && res.API_BASE_URL === "http://localhost:8000"
      );
    }

    // -------------------------------------------------------------------------
    // TEST 3: Staging with missing API URL fails
    // -------------------------------------------------------------------------
    console.log("\n[TEST 3] Staging with missing API URL fails:");
    {
      let caught = false;
      let errorMsg = "";
      try {
        validateFrontendEnv({
          NEXT_PUBLIC_APP_ENV: "staging",
          NEXT_PUBLIC_API_URL: "",
        });
      } catch (e: any) {
        caught = true;
        errorMsg = e.message;
      }
      testAssert(
        "Staging with empty API URL is strictly rejected (fails closed)",
        caught && errorMsg.includes("mandatory for 'staging' builds")
      );
    }

    // -------------------------------------------------------------------------
    // TEST 4: Preview with missing API URL fails
    // -------------------------------------------------------------------------
    console.log("\n[TEST 4] Preview with missing API URL fails:");
    {
      let caught = false;
      let errorMsg = "";
      try {
        validateFrontendEnv({
          NEXT_PUBLIC_APP_ENV: "preview",
          NEXT_PUBLIC_API_URL: undefined,
        });
      } catch (e: any) {
        caught = true;
        errorMsg = e.message;
      }
      testAssert(
        "Preview with missing API URL is strictly rejected (fails closed)",
        caught && errorMsg.includes("mandatory for 'preview' builds")
      );
    }

    // -------------------------------------------------------------------------
    // TEST 5: Production with missing API URL fails
    // -------------------------------------------------------------------------
    console.log("\n[TEST 5] Production with missing API URL fails:");
    {
      let caught = false;
      let errorMsg = "";
      try {
        validateFrontendEnv({
          NEXT_PUBLIC_APP_ENV: "production",
          NEXT_PUBLIC_API_URL: "",
        });
      } catch (e: any) {
        caught = true;
        errorMsg = e.message;
      }
      testAssert(
        "Production with missing API URL is strictly rejected (no silent fallback)",
        caught && errorMsg.includes("mandatory for 'production' builds")
      );
    }

    // -------------------------------------------------------------------------
    // TEST 6: Staging configured with production backend fails
    // -------------------------------------------------------------------------
    console.log("\n[TEST 6] Staging configured with production backend fails:");
    {
      let caught = false;
      let errorMsg = "";
      try {
        validateFrontendEnv({
          NEXT_PUBLIC_APP_ENV: "staging",
          NEXT_PUBLIC_API_URL: "https://stickthebizz.onrender.com",
        });
      } catch (e: any) {
        caught = true;
        errorMsg = e.message;
      }
      testAssert(
        "Staging targeting production backend is rejected with Security Violation",
        caught && errorMsg.includes("strictly forbidden from connecting to the production backend")
      );
    }

    // -------------------------------------------------------------------------
    // TEST 7: Preview configured with production backend fails
    // -------------------------------------------------------------------------
    console.log("\n[TEST 7] Preview configured with production backend fails:");
    {
      let caught = false;
      let errorMsg = "";
      try {
        validateFrontendEnv({
          NEXT_PUBLIC_APP_ENV: "preview",
          NEXT_PUBLIC_API_URL: "https://stickthebizz.onrender.com",
        });
      } catch (e: any) {
        caught = true;
        errorMsg = e.message;
      }
      testAssert(
        "Preview targeting production backend is rejected with Security Violation",
        caught && errorMsg.includes("strictly forbidden from connecting to the production backend")
      );
    }

    // -------------------------------------------------------------------------
    // TEST 8: Production configured with explicit production backend succeeds
    // -------------------------------------------------------------------------
    console.log("\n[TEST 8] Production configured with explicit production backend succeeds:");
    {
      const res = validateFrontendEnv({
        NEXT_PUBLIC_APP_ENV: "production",
        NEXT_PUBLIC_API_URL: "https://stickthebizz.onrender.com",
      });
      testAssert(
        "Production targeting explicit production backend succeeds",
        res.APP_ENV === "production" && res.API_BASE_URL === "https://stickthebizz.onrender.com"
      );
    }

    // -------------------------------------------------------------------------
    // TEST 9: Whitespace-only API URL fails
    // -------------------------------------------------------------------------
    console.log("\n[TEST 9] Whitespace-only API URL fails:");
    {
      let caught = false;
      let errorMsg = "";
      try {
        validateFrontendEnv({
          NEXT_PUBLIC_APP_ENV: "staging",
          NEXT_PUBLIC_API_URL: "    ",
        });
      } catch (e: any) {
        caught = true;
        errorMsg = e.message;
      }
      testAssert(
        "Whitespace-only API URL fails validation",
        caught && errorMsg.includes("mandatory for 'staging' builds")
      );

      // Embedded whitespace in URL
      let caughtEmbedded = false;
      try {
        validateFrontendEnv({
          NEXT_PUBLIC_APP_ENV: "staging",
          NEXT_PUBLIC_API_URL: "https://staging. stickthebizz.in",
        });
      } catch (e: any) {
        caughtEmbedded = true;
      }
      testAssert(
        "URL with internal spaces fails validation",
        caughtEmbedded
      );
    }

    // -------------------------------------------------------------------------
    // TEST 10: Malformed URL fails
    // -------------------------------------------------------------------------
    console.log("\n[TEST 10] Malformed URL fails:");
    {
      const malformedCases = [
        "not-a-valid-url",
        "stickthebizz-staging.onrender.com", // missing scheme
        "://missing-scheme",
        "ftp://invalid-protocol.com",
      ];

      let allRejected = true;
      for (const badUrl of malformedCases) {
        try {
          validateFrontendEnv({
            NEXT_PUBLIC_APP_ENV: "staging",
            NEXT_PUBLIC_API_URL: badUrl,
          });
          allRejected = false;
        } catch {
          // Expected
        }
      }
      testAssert(
        "Malformed and schemeless URLs are strictly rejected",
        allRejected
      );
    }

    // -------------------------------------------------------------------------
    // TEST 11: HTTP URL in staging fails
    // -------------------------------------------------------------------------
    console.log("\n[TEST 11] HTTP URL in staging fails:");
    {
      let caught = false;
      let errorMsg = "";
      try {
        validateFrontendEnv({
          NEXT_PUBLIC_APP_ENV: "staging",
          NEXT_PUBLIC_API_URL: "http://stickthebizz-staging.onrender.com",
        });
      } catch (e: any) {
        caught = true;
        errorMsg = e.message;
      }
      testAssert(
        "Insecure HTTP URL in staging is rejected (requires HTTPS)",
        caught && errorMsg.includes("must use HTTPS protocol")
      );
    }

    // -------------------------------------------------------------------------
    // TEST 12: HTTPS URL in staging succeeds
    // -------------------------------------------------------------------------
    console.log("\n[TEST 12] HTTPS URL in staging succeeds:");
    {
      const res = validateFrontendEnv({
        NEXT_PUBLIC_APP_ENV: "staging",
        NEXT_PUBLIC_API_URL: "https://stickthebizz-staging.onrender.com",
      });
      testAssert(
        "Valid HTTPS URL in staging succeeds",
        res.APP_ENV === "staging" && res.API_BASE_URL === "https://stickthebizz-staging.onrender.com"
      );
    }

    // -------------------------------------------------------------------------
    // TEST 13: API URL containing credentials fails
    // -------------------------------------------------------------------------
    console.log("\n[TEST 13] API URL containing embedded credentials fails:");
    {
      let caught = false;
      try {
        validateFrontendEnv({
          NEXT_PUBLIC_APP_ENV: "staging",
          NEXT_PUBLIC_API_URL: "https://admin:supersecret@stickthebizz-staging.onrender.com",
        });
      } catch (e: any) {
        caught = true;
      }
      testAssert(
        "URL with embedded username/password is rejected",
        caught
      );
    }

    // -------------------------------------------------------------------------
    // TEST 14: HTTPS API produces WSS URL
    // -------------------------------------------------------------------------
    console.log("\n[TEST 14] HTTPS API produces WSS URL:");
    {
      const res = validateFrontendEnv({
        NEXT_PUBLIC_APP_ENV: "staging",
        NEXT_PUBLIC_API_URL: "https://stickthebizz-staging.onrender.com",
      });
      testAssert(
        "HTTPS API URL derives secure WSS WebSocket endpoint (wss://.../ws)",
        res.WS_BASE_URL === "wss://stickthebizz-staging.onrender.com/ws"
      );
    }

    // -------------------------------------------------------------------------
    // TEST 15: HTTP local API produces WS URL
    // -------------------------------------------------------------------------
    console.log("\n[TEST 15] HTTP local API produces WS URL:");
    {
      const res = validateFrontendEnv({
        NEXT_PUBLIC_APP_ENV: "development",
        NEXT_PUBLIC_API_URL: "http://localhost:8000",
      });
      testAssert(
        "HTTP API URL derives WS WebSocket endpoint (ws://.../ws)",
        res.WS_BASE_URL === "ws://localhost:8000/ws"
      );
    }

    // -------------------------------------------------------------------------
    // TEST 16: WebSocket override pointing to production from staging is rejected
    // -------------------------------------------------------------------------
    console.log("\n[TEST 16] WebSocket override pointing to production from staging is rejected:");
    {
      let caught = false;
      let errorMsg = "";
      try {
        validateFrontendEnv({
          NEXT_PUBLIC_APP_ENV: "staging",
          NEXT_PUBLIC_API_URL: "https://stickthebizz-staging.onrender.com",
          NEXT_PUBLIC_WS_URL: "wss://stickthebizz.onrender.com/ws",
        });
      } catch (e: any) {
        caught = true;
        errorMsg = e.message;
      }
      testAssert(
        "Staging WebSocket override targeting production is rejected",
        caught && errorMsg.includes("cannot configure WebSocket connection to production backend")
      );
    }

    // -------------------------------------------------------------------------
    // TEST 17: SSR store page uses centralized API configuration
    // -------------------------------------------------------------------------
    console.log("\n[TEST 17] SSR store page uses centralized API configuration:");
    {
      const pageFile = path.resolve(__dirname, "../src/app/s/[slug]/page.tsx");
      const pageSource = fs.readFileSync(pageFile, "utf8");

      testAssert(
        "SSR page imports frontendEnv from '@/lib/config/env'",
        pageSource.includes('import { frontendEnv } from "@/lib/config/env"')
      );
      testAssert(
        "SSR page uses frontendEnv.API_BASE_URL in fetch call",
        pageSource.includes("${frontendEnv.API_BASE_URL}/api/v1/merchant/slug/")
      );
      testAssert(
        "SSR page does not contain 'localhost:4000' fallback",
        !pageSource.includes("localhost:4000")
      );
      testAssert(
        "SSR page does not perform bespoke process.env.NEXT_PUBLIC_API_URL resolution",
        !pageSource.includes("process.env.NEXT_PUBLIC_API_URL")
      );
    }

    // -------------------------------------------------------------------------
    // TEST 18: API client does not contain production fallback string
    // -------------------------------------------------------------------------
    console.log("\n[TEST 18] API client does not contain production fallback string:");
    {
      const clientFile = path.resolve(__dirname, "../src/lib/api/client.ts");
      const clientSource = fs.readFileSync(clientFile, "utf8");

      testAssert(
        "API client imports frontendEnv from '../config/env'",
        clientSource.includes('import { frontendEnv } from "../config/env"')
      );
      testAssert(
        "API client uses frontendEnv.API_BASE_URL",
        clientSource.includes("export const API_BASE_URL = frontendEnv.API_BASE_URL")
      );
      testAssert(
        "API client does not contain fallback '|| \"https://stickthebizz.onrender.com\"'",
        !clientSource.includes('|| "https://stickthebizz.onrender.com"')
      );
    }

    // -------------------------------------------------------------------------
    // TEST 19: WebSocket hook uses centralized configuration
    // -------------------------------------------------------------------------
    console.log("\n[TEST 19] WebSocket hook uses centralized configuration:");
    {
      const wsFile = path.resolve(__dirname, "../src/lib/ws/useTerminalSocket.ts");
      const wsSource = fs.readFileSync(wsFile, "utf8");

      testAssert(
        "useTerminalSocket imports frontendEnv from '../config/env'",
        wsSource.includes('import { frontendEnv } from "../config/env"')
      );
      testAssert(
        "useTerminalSocket uses frontendEnv.WS_BASE_URL",
        wsSource.includes("const WS_BASE_URL = frontendEnv.WS_BASE_URL")
      );
      testAssert(
        "useTerminalSocket does not contain fallback '|| \"ws://localhost:8000/ws\"'",
        !wsSource.includes('|| "ws://localhost:8000/ws"')
      );
    }

    // -------------------------------------------------------------------------
    // TEST 20: Example environment file contains no live Razorpay credentials
    // -------------------------------------------------------------------------
    console.log("\n[TEST 20] Example environment file contains no live Razorpay credentials:");
    {
      const exampleFile = path.resolve(__dirname, "../.env.example");
      const exampleSource = fs.readFileSync(exampleFile, "utf8");

      testAssert(
        ".env.example contains NEXT_PUBLIC_APP_ENV",
        exampleSource.includes("NEXT_PUBLIC_APP_ENV=development")
      );
      testAssert(
        ".env.example does not contain live Razorpay key 'rzp_live_TwB6i8HNWltApy'",
        !exampleSource.includes("rzp_live_TwB6i8HNWltApy")
      );
      testAssert(
        ".env.example uses dummy test placeholder 'rzp_test_placeholderKey'",
        exampleSource.includes("NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_placeholderKey")
      );
    }

    // -------------------------------------------------------------------------
    // TEST 21: Build-Time next.config.mjs Fail-Closed Assertion via Child Process
    // -------------------------------------------------------------------------
    console.log("\n[TEST 21] Build-Time next.config.mjs Fail-Closed Assertion via Child Process:");
    {
      const { spawnSync } = await import("child_process");
      const nextConfigPath = path.resolve(__dirname, "../next.config.mjs");
      const nextConfigFileUrl = (await import("url")).pathToFileURL(nextConfigPath).href;

      const runBuildCheck = (customEnv: Record<string, string>) => {
        const cmd = process.platform === "win32" ? (process.env.ComSpec || "cmd.exe") : "node";
        const args = process.platform === "win32"
          ? ["/c", "node", "--input-type=module", "-e", `import('${nextConfigFileUrl}')`]
          : ["--input-type=module", "-e", `import('${nextConfigFileUrl}')`];

        // Clean environment without inheriting local test overrides
        const cleanEnv: Record<string, string> = {
          PATH: process.env.PATH || "",
          SystemRoot: process.env.SystemRoot || "",
          NODE_ENV: "production", // Simulate 'next build' environment
          ...customEnv,
        };

        return spawnSync(cmd, args, {
          cwd: path.resolve(__dirname, ".."),
          env: cleanEnv as any,
          encoding: "utf8",
        });
      };

      // Case A: Staging with missing NEXT_PUBLIC_API_URL must abort build with exit code 1
      const resStagingMissing = runBuildCheck({
        NEXT_PUBLIC_APP_ENV: "staging",
        NEXT_PUBLIC_API_URL: "",
      });
      testAssert(
        "Case A: Staging with missing NEXT_PUBLIC_API_URL aborts build (status 1)",
        resStagingMissing.status === 1 && resStagingMissing.stderr.includes("NEXT_PUBLIC_API_URL is mandatory for 'staging' builds"),
        { status: resStagingMissing.status, stderr: resStagingMissing.stderr }
      );

      // Case B: Staging targeting production backend must abort build with Security Violation
      const resStagingProdTarget = runBuildCheck({
        NEXT_PUBLIC_APP_ENV: "staging",
        NEXT_PUBLIC_API_URL: "https://stickthebizz.onrender.com",
      });
      testAssert(
        "Case B: Staging targeting production backend aborts build with Security Violation (status 1)",
        resStagingProdTarget.status === 1 && resStagingProdTarget.stderr.includes("Security Violation"),
        { status: resStagingProdTarget.status, stderr: resStagingProdTarget.stderr }
      );

      // Case C: Preview with missing NEXT_PUBLIC_API_URL must abort build with exit code 1
      const resPreviewMissing = runBuildCheck({
        NEXT_PUBLIC_APP_ENV: "preview",
        NEXT_PUBLIC_API_URL: "",
      });
      testAssert(
        "Case C: Preview with missing NEXT_PUBLIC_API_URL aborts build (status 1)",
        resPreviewMissing.status === 1 && resPreviewMissing.stderr.includes("NEXT_PUBLIC_API_URL is mandatory for 'preview' builds"),
        { status: resPreviewMissing.status, stderr: resPreviewMissing.stderr }
      );

      // Case D: Staging with valid staging backend succeeds (status 0)
      const resStagingValid = runBuildCheck({
        NEXT_PUBLIC_APP_ENV: "staging",
        NEXT_PUBLIC_API_URL: "https://stickthebizz-staging.onrender.com",
      });
      testAssert(
        "Case D: Staging with valid staging backend succeeds (status 0)",
        resStagingValid.status === 0,
        { status: resStagingValid.status, stderr: resStagingValid.stderr }
      );

      // Case E: Production with explicit production backend succeeds (status 0)
      const resProdValid = runBuildCheck({
        NEXT_PUBLIC_APP_ENV: "production",
        NEXT_PUBLIC_API_URL: "https://stickthebizz.onrender.com",
      });
      testAssert(
        "Case E: Production with explicit production backend succeeds (status 0)",
        resProdValid.status === 0,
        { status: resProdValid.status, stderr: resProdValid.stderr }
      );
    }

    // -------------------------------------------------------------------------
    // TEST 22: Direct process.env inlining regression test for Staging
    // -------------------------------------------------------------------------
    console.log("\n[TEST 22] Direct process.env inlining regression test for Staging:");
    {
      const prevAppEnv = process.env.NEXT_PUBLIC_APP_ENV;
      const prevApiUrl = process.env.NEXT_PUBLIC_API_URL;
      const prevWsUrl = process.env.NEXT_PUBLIC_WS_URL;

      try {
        process.env.NEXT_PUBLIC_APP_ENV = "staging";
        process.env.NEXT_PUBLIC_API_URL = "https://stickthebizz-api-staging.onrender.com";
        delete process.env.NEXT_PUBLIC_WS_URL;

        // Call validateFrontendEnv() without arguments (the exact path executed by client bundle in browser)
        const res = validateFrontendEnv();

        testAssert(
          "Direct process.env reads staging APP_ENV correctly",
          res.APP_ENV === "staging",
          res.APP_ENV
        );
        testAssert(
          "Direct process.env resolves staging API_BASE_URL to https://stickthebizz-api-staging.onrender.com",
          res.API_BASE_URL === "https://stickthebizz-api-staging.onrender.com",
          res.API_BASE_URL
        );
        testAssert(
          "Direct process.env resolves staging WS_BASE_URL to wss://stickthebizz-api-staging.onrender.com/ws",
          res.WS_BASE_URL === "wss://stickthebizz-api-staging.onrender.com/ws",
          res.WS_BASE_URL
        );
        testAssert(
          "Direct process.env strictly NEVER resolves to http://localhost:8000 in staging",
          res.API_BASE_URL !== "http://localhost:8000" && !res.API_BASE_URL.includes("localhost"),
          res.API_BASE_URL
        );
      } finally {
        process.env.NEXT_PUBLIC_APP_ENV = prevAppEnv;
        process.env.NEXT_PUBLIC_API_URL = prevApiUrl;
        if (prevWsUrl !== undefined) {
          process.env.NEXT_PUBLIC_WS_URL = prevWsUrl;
        } else {
          delete process.env.NEXT_PUBLIC_WS_URL;
        }
      }
    }

    // -------------------------------------------------------------------------
    // TEST 23: Localhost fallback strictly prohibited in Staging
    // -------------------------------------------------------------------------
    console.log("\n[TEST 23] Localhost fallback strictly prohibited in Staging:");
    {
      let caught = false;
      let errorMsg = "";
      try {
        validateFrontendEnv({
          NEXT_PUBLIC_APP_ENV: "staging",
          NEXT_PUBLIC_API_URL: "http://localhost:8000",
        });
      } catch (e: any) {
        caught = true;
        errorMsg = e.message;
      }
      testAssert(
        "Staging with http://localhost:8000 is rejected (requires HTTPS)",
        caught && errorMsg.includes("must use HTTPS protocol in 'staging' environment"),
        errorMsg
      );
    }

    // -------------------------------------------------------------------------
    // TEST 24: Staging with live Razorpay key (rzp_live_...) is strictly rejected
    // -------------------------------------------------------------------------
    console.log("\n[TEST 24] Staging with live Razorpay key is strictly rejected:");
    {
      let caught = false;
      let errorMsg = "";
      try {
        validateFrontendEnv({
          NEXT_PUBLIC_APP_ENV: "staging",
          NEXT_PUBLIC_API_URL: "https://stickthebizz-api-staging.onrender.com",
          NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_live_TwB6i8HNWltApy",
        });
      } catch (e: any) {
        caught = true;
        errorMsg = e.message;
      }
      testAssert(
        "Staging with rzp_live_ key throws security violation",
        caught && errorMsg.includes("cannot use live Razorpay credentials ('rzp_live_...')"),
        errorMsg
      );
    }

    // -------------------------------------------------------------------------
    // TEST 25: Staging with test Razorpay key (rzp_test_...) succeeds
    // -------------------------------------------------------------------------
    console.log("\n[TEST 25] Staging with test Razorpay key succeeds:");
    {
      const res = validateFrontendEnv({
        NEXT_PUBLIC_APP_ENV: "staging",
        NEXT_PUBLIC_API_URL: "https://stickthebizz-api-staging.onrender.com",
        NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_demoKey12345",
      });
      testAssert(
        "Staging with rzp_test_ key resolves correctly",
        res.APP_ENV === "staging" && res.RAZORPAY_KEY_ID === "rzp_test_demoKey12345"
      );
    }

    // -------------------------------------------------------------------------
    // TEST 26: Staging with omitted/empty Razorpay key succeeds (dynamic backend resolution)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 26] Staging with omitted Razorpay key succeeds:");
    {
      const res = validateFrontendEnv({
        NEXT_PUBLIC_APP_ENV: "staging",
        NEXT_PUBLIC_API_URL: "https://stickthebizz-api-staging.onrender.com",
        NEXT_PUBLIC_RAZORPAY_KEY_ID: "",
      });
      testAssert(
        "Staging with empty Razorpay key sets RAZORPAY_KEY_ID to undefined",
        res.APP_ENV === "staging" && res.RAZORPAY_KEY_ID === undefined
      );
    }

    // -------------------------------------------------------------------------
    // TEST 27: Preview with live Razorpay key is strictly rejected
    // -------------------------------------------------------------------------
    console.log("\n[TEST 27] Preview with live Razorpay key is strictly rejected:");
    {
      let caught = false;
      let errorMsg = "";
      try {
        validateFrontendEnv({
          NEXT_PUBLIC_APP_ENV: "preview",
          NEXT_PUBLIC_API_URL: "https://stickthebizz-api-staging.onrender.com",
          NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_live_SomeLiveKey123",
        });
      } catch (e: any) {
        caught = true;
        errorMsg = e.message;
      }
      testAssert(
        "Preview with rzp_live_ key throws security violation",
        caught && errorMsg.includes("cannot use live Razorpay credentials ('rzp_live_...')"),
        errorMsg
      );
    }

    // -------------------------------------------------------------------------
    // TEST 28: Development with live Razorpay key is strictly rejected
    // -------------------------------------------------------------------------
    console.log("\n[TEST 28] Development with live Razorpay key is strictly rejected:");
    {
      let caught = false;
      let errorMsg = "";
      try {
        validateFrontendEnv({
          NEXT_PUBLIC_APP_ENV: "development",
          NEXT_PUBLIC_API_URL: "http://localhost:8000",
          NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_live_SomeLiveKey123",
        });
      } catch (e: any) {
        caught = true;
        errorMsg = e.message;
      }
      testAssert(
        "Development with rzp_live_ key throws security violation",
        caught && errorMsg.includes("cannot use live Razorpay credentials ('rzp_live_...')"),
        errorMsg
      );
    }

    // -------------------------------------------------------------------------
    // TEST 29: Production with test Razorpay key is strictly rejected
    // -------------------------------------------------------------------------
    console.log("\n[TEST 29] Production with test Razorpay key is strictly rejected:");
    {
      let caught = false;
      let errorMsg = "";
      try {
        validateFrontendEnv({
          NEXT_PUBLIC_APP_ENV: "production",
          NEXT_PUBLIC_API_URL: "https://stickthebizz.onrender.com",
          NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_SomeTestKey123",
        });
      } catch (e: any) {
        caught = true;
        errorMsg = e.message;
      }
      testAssert(
        "Production with rzp_test_ key throws security violation",
        caught && errorMsg.includes("cannot use test Razorpay credentials ('rzp_test_...')"),
        errorMsg
      );
    }

    // -------------------------------------------------------------------------
    // TEST 30: Production with valid live Razorpay key succeeds
    // -------------------------------------------------------------------------
    console.log("\n[TEST 30] Production with valid live Razorpay key succeeds:");
    {
      const res = validateFrontendEnv({
        NEXT_PUBLIC_APP_ENV: "production",
        NEXT_PUBLIC_API_URL: "https://stickthebizz.onrender.com",
        NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_live_ValidProductionKey123",
      });
      testAssert(
        "Production with rzp_live_ key resolves correctly",
        res.APP_ENV === "production" && res.RAZORPAY_KEY_ID === "rzp_live_ValidProductionKey123"
      );
    }

    // -------------------------------------------------------------------------
    // TEST 31: Production with omitted/empty Razorpay key succeeds (dynamic backend resolution)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 31] Production with omitted Razorpay key succeeds:");
    {
      const res = validateFrontendEnv({
        NEXT_PUBLIC_APP_ENV: "production",
        NEXT_PUBLIC_API_URL: "https://stickthebizz.onrender.com",
      });
      testAssert(
        "Production with omitted key sets RAZORPAY_KEY_ID to undefined",
        res.APP_ENV === "production" && res.RAZORPAY_KEY_ID === undefined
      );
    }

    // -------------------------------------------------------------------------
    // TEST 32: Whitespace in NEXT_PUBLIC_RAZORPAY_KEY_ID is rejected
    // -------------------------------------------------------------------------
    console.log("\n[TEST 32] Whitespace in NEXT_PUBLIC_RAZORPAY_KEY_ID is rejected:");
    {
      let caught = false;
      let errorMsg = "";
      try {
        validateFrontendEnv({
          NEXT_PUBLIC_APP_ENV: "staging",
          NEXT_PUBLIC_API_URL: "https://stickthebizz-api-staging.onrender.com",
          NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_ key_with_space",
        });
      } catch (e: any) {
        caught = true;
        errorMsg = e.message;
      }
      testAssert(
        "Whitespace in NEXT_PUBLIC_RAZORPAY_KEY_ID throws validation error",
        caught && errorMsg.includes("must not contain whitespace"),
        errorMsg
      );
    }

  } catch (err) {
    console.error("Test execution exception:", err);
    failed++;
  }

  console.log("\n==================================================");
  console.log(`   FRONTEND ENV CONFIG RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runFrontendEnvConfigTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});

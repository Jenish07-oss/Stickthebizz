/**
 * StickTheBizz — Automatic Owner Token Refresh Unit Tests
 * Phase 3H.3.10: Isolated Automated Verification
 *
 * Verifies the 7 required security & correctness scenarios:
 * 1. Refresh request contains the empty JSON body ("{}").
 * 2. Refresh request includes credentials ("include") and correct headers/method.
 * 3. Successful refresh stores the new access token.
 * 4. Original failed API request is retried using the refreshed token.
 * 5. Concurrent unauthorized requests trigger exactly ONE refresh request (queue deduplication).
 * 6. Failed refresh executes safe logout behavior (clears token, empties localStorage).
 * 7. Refresh tokens are NEVER written to localStorage.
 */

// Configure environment before imports
(process.env as any).NODE_ENV = "test";
process.env.NEXT_PUBLIC_APP_ENV = "development";
process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000";

// Mock localStorage in Node environment
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = String(val);
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  },
};

// Polyfill window & localStorage in global scope for tests
(global as any).window = global;
(global as any).localStorage = mockLocalStorage;

import { apiClient, setAccessToken, getAccessToken, clearAccessToken, API_BASE_URL } from "../src/lib/api/client";

async function runTokenRefreshTests() {
  console.log("==================================================");
  console.log("   STICKTHEBIZZ AUTOMATIC TOKEN REFRESH TESTS");
  console.log("   (Phase 3H.3.10: Fastify Empty Body Correction)");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(desc: string, condition: boolean, extraInfo?: any) {
    if (condition) {
      console.log(`  ✅ ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${desc}`, extraInfo || "");
      failed++;
    }
  }

  const originalFetch = global.fetch;

  try {
    // -------------------------------------------------------------------------
    // TEST 1 & 2: Refresh request contains empty JSON body, credentials: include, POST method
    // -------------------------------------------------------------------------
    console.log("\n[TEST 1 & 2] Refresh request payload, method, and credentials check:");
    {
      clearAccessToken();
      setAccessToken("expired-test-token");

      let refreshCapturedOptions: any = null;
      let refreshCallCount = 0;

      global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/api/v1/auth/refresh")) {
          refreshCallCount++;
          refreshCapturedOptions = init;
          return {
            ok: true,
            status: 200,
            headers: new Headers({ "content-type": "application/json" }),
            json: async () => ({
              success: true,
              data: {
                accessToken: "new-valid-access-token-123",
                refreshToken: "new-refresh-token-cookie-simulated",
              },
            }),
          } as any;
        }

        // Target API call: first call fails with 401, retry succeeds with 200
        if (url.includes("/api/v1/merchant/me")) {
          const authHeader = (init?.headers as Headers)?.get("Authorization");
          if (authHeader === "Bearer expired-test-token") {
            return {
              ok: false,
              status: 401,
              headers: new Headers({ "content-type": "application/json" }),
              json: async () => ({ error: "UNAUTHORIZED", message: "Token expired" }),
            } as any;
          }
          if (authHeader === "Bearer new-valid-access-token-123") {
            return {
              ok: true,
              status: 200,
              headers: new Headers({ "content-type": "application/json" }),
              json: async () => ({ success: true, data: { name: "Hermes Endurance Cafe" } }),
            } as any;
          }
        }

        return { ok: false, status: 404, json: async () => ({}) } as any;
      }) as any;

      const res = await apiClient("/api/v1/merchant/me");

      assert(
        "Refresh endpoint was invoked exactly once",
        refreshCallCount === 1,
        { refreshCallCount }
      );
      assert(
        "Refresh request used HTTP method POST",
        refreshCapturedOptions?.method === "POST",
        { method: refreshCapturedOptions?.method }
      );
      assert(
        "Refresh request specifies Content-Type: application/json",
        (refreshCapturedOptions?.headers as any)?.["Content-Type"] === "application/json" ||
          (refreshCapturedOptions?.headers as Headers)?.get("Content-Type") === "application/json"
      );
      assert(
        "Refresh request contains non-empty JSON body (JSON.stringify({}))",
        refreshCapturedOptions?.body === "{}" && JSON.parse(refreshCapturedOptions?.body) !== null,
        { body: refreshCapturedOptions?.body }
      );
      assert(
        "Refresh request includes credentials: include for cross-site cookie transmission",
        refreshCapturedOptions?.credentials === "include",
        { credentials: refreshCapturedOptions?.credentials }
      );
    }

    // -------------------------------------------------------------------------
    // TEST 3: Successful refresh stores new access token in memory and localStorage
    // -------------------------------------------------------------------------
    console.log("\n[TEST 3] Storage of refreshed access token:");
    {
      assert(
        "New access token is stored in memory via getAccessToken()",
        getAccessToken() === "new-valid-access-token-123",
        { currentToken: getAccessToken() }
      );
      assert(
        "New access token is stored in localStorage under stb_access_token",
        mockLocalStorage.getItem("stb_access_token") === "new-valid-access-token-123",
        { storedToken: mockLocalStorage.getItem("stb_access_token") }
      );
    }

    // -------------------------------------------------------------------------
    // TEST 4: Original failed API request is retried and resolved with new token
    // -------------------------------------------------------------------------
    console.log("\n[TEST 4] Request replay with refreshed Authorization header:");
    {
      clearAccessToken();
      setAccessToken("old-stale-token");

      let originalCallCount = 0;
      let retriedWithNewToken = false;

      global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/api/v1/auth/refresh")) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ "content-type": "application/json" }),
            json: async () => ({
              success: true,
              data: { accessToken: "retried-token-999" },
            }),
          } as any;
        }

        if (url.includes("/api/v1/protected/resource")) {
          originalCallCount++;
          const auth = (init?.headers as Headers)?.get("Authorization");
          if (auth === "Bearer old-stale-token") {
            return {
              ok: false,
              status: 401,
              headers: new Headers({ "content-type": "application/json" }),
              json: async () => ({ error: "EXPIRED" }),
            } as any;
          }
          if (auth === "Bearer retried-token-999") {
            retriedWithNewToken = true;
            return {
              ok: true,
              status: 200,
              headers: new Headers({ "content-type": "application/json" }),
              json: async () => ({ success: true, payload: "secret-data" }),
            } as any;
          }
        }
        return { ok: false, status: 500, json: async () => ({}) } as any;
      }) as any;

      const res = await apiClient("/api/v1/protected/resource");

      assert("Original call was attempted, refreshed, and retried (count = 2)", originalCallCount === 2, {
        originalCallCount,
      });
      assert("Retry header contained Bearer retried-token-999", retriedWithNewToken);
      assert("apiClient returned successful retried response data", res.payload === "secret-data");
    }

    // -------------------------------------------------------------------------
    // TEST 5: Concurrent 401 requests trigger exactly ONE refresh request (queue deduplication)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 5] Concurrent 401 request deduplication and queueing:");
    {
      clearAccessToken();
      setAccessToken("shared-expired-token");

      let refreshInvocations = 0;

      global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/api/v1/auth/refresh")) {
          refreshInvocations++;
          // Simulate network delay for refresh
          await new Promise((r) => setTimeout(r, 20));
          return {
            ok: true,
            status: 200,
            headers: new Headers({ "content-type": "application/json" }),
            json: async () => ({
              success: true,
              data: { accessToken: "deduplicated-token-456" },
            }),
          } as any;
        }

        const auth = (init?.headers as Headers)?.get("Authorization");
        if (auth === "Bearer shared-expired-token") {
          return {
            ok: false,
            status: 401,
            headers: new Headers({ "content-type": "application/json" }),
            json: async () => ({ error: "UNAUTHORIZED" }),
          } as any;
        }
        if (auth === "Bearer deduplicated-token-456") {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ "content-type": "application/json" }),
            json: async () => ({
              success: true,
              endpoint: url.split("/").pop(),
            }),
          } as any;
        }
        return { ok: false, status: 500, json: async () => ({}) } as any;
      }) as any;

      // Dispatch 3 concurrent requests that all fail with 401
      const [res1, res2, res3] = await Promise.all([
        apiClient("/api/v1/concurrent-a"),
        apiClient("/api/v1/concurrent-b"),
        apiClient("/api/v1/concurrent-c"),
      ]);

      assert(
        "Three concurrent 401 requests triggered exactly ONE refresh call",
        refreshInvocations === 1,
        { refreshInvocations }
      );
      assert("All 3 concurrent calls resolved with successful retries",
        res1?.endpoint === "concurrent-a" &&
        res2?.endpoint === "concurrent-b" &&
        res3?.endpoint === "concurrent-c"
      );
    }

    // -------------------------------------------------------------------------
    // TEST 6: Failed refresh executes safe logout (clears token, empties localStorage)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 6] Failed refresh error handling & safe logout behavior:");
    {
      clearAccessToken();
      setAccessToken("invalid-token-to-fail");

      global.fetch = (async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/v1/auth/refresh")) {
          // Backend refresh fails (e.g. refresh token expired or invalid)
          return {
            ok: false,
            status: 401,
            headers: new Headers({ "content-type": "application/json" }),
            json: async () => ({ success: false, error: "REFRESH_EXPIRED" }),
          } as any;
        }
        return {
          ok: false,
          status: 401,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ error: "TOKEN_EXPIRED" }),
        } as any;
      }) as any;

      let caughtError: any = null;
      try {
        await apiClient("/api/v1/any-endpoint");
      } catch (err) {
        caughtError = err;
      }

      assert("Request failed with an error when refresh failed", caughtError !== null);
      assert(
        "Memory token was purged after failed refresh",
        getAccessToken() === null,
        { inMemory: getAccessToken() }
      );
      assert(
        "localStorage stb_access_token was removed after failed refresh",
        mockLocalStorage.getItem("stb_access_token") === null,
        { stored: mockLocalStorage.getItem("stb_access_token") }
      );
    }

    // -------------------------------------------------------------------------
    // TEST 7: Security check — refresh tokens are NEVER written to localStorage
    // -------------------------------------------------------------------------
    console.log("\n[TEST 7] Security verification: refresh token is never stored in localStorage:");
    {
      clearAccessToken();
      setAccessToken("dummy-start-token");

      global.fetch = (async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/v1/auth/refresh")) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ "content-type": "application/json" }),
            json: async () => ({
              success: true,
              data: {
                accessToken: "sensitive-access-jwt-ok-for-storage",
                refreshToken: "super-secret-refresh-token-must-stay-in-httponly-cookie",
                token: "alternate-access-alias",
              },
            }),
          } as any;
        }

        return {
          ok: false,
          status: 401,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ error: "EXPIRED" }),
        } as any;
      }) as any;

      // Note: the second retry call should succeed
      let retryCount = 0;
      const originalHandler = global.fetch;
      global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/api/v1/auth/refresh")) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ "content-type": "application/json" }),
            json: async () => ({
              success: true,
              data: {
                accessToken: "sensitive-access-jwt-ok-for-storage",
                refreshToken: "super-secret-refresh-token-must-stay-in-httponly-cookie",
              },
            }),
          } as any;
        }
        retryCount++;
        if (retryCount === 1) {
          return {
            ok: false,
            status: 401,
            headers: new Headers({ "content-type": "application/json" }),
            json: async () => ({ error: "EXPIRED" }),
          } as any;
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ success: true }),
        } as any;
      }) as any;

      await apiClient("/api/v1/test-security");

      assert(
        "refresh_token is not stored in localStorage under 'refresh_token'",
        mockLocalStorage.getItem("refresh_token") === null
      );
      assert(
        "refresh_token is not stored in localStorage under 'stb_refresh_token'",
        mockLocalStorage.getItem("stb_refresh_token") === null
      );
      assert(
        "No storage key contains the secret refresh token string value",
        !Object.values(mockStorage).includes("super-secret-refresh-token-must-stay-in-httponly-cookie")
      );
      assert(
        "Only stb_access_token exists in localStorage",
        Object.keys(mockStorage).length === 1 && Object.keys(mockStorage)[0] === "stb_access_token",
        { keys: Object.keys(mockStorage) }
      );
    }
  } finally {
    global.fetch = originalFetch;
    clearAccessToken();
  }

  console.log("\n==================================================");
  console.log(`   TOKEN REFRESH TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTokenRefreshTests().catch((err) => {
  console.error("FATAL ERROR running token refresh tests:", err);
  process.exit(1);
});

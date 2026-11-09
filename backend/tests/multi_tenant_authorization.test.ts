// Set valid baseline environment in test runner before importing configuration
process.env.APP_ENV = "test";
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgres://offline-mock-db:5432/mock_db";
process.env.RAZORPAY_KEY_ID = "rzp_test_mockKeyForTestHarnessBaseline";
process.env.NON_PRODUCTION_EMAIL_ALLOWLIST = "test@stickthebizz.in";
process.env.RESEND_API_KEY = "re_mock_test_key_for_offline_tests";
process.env.JWT_ACCESS_SECRET = "mock-access-secret-32-chars-minimum-safe";
process.env.JWT_REFRESH_SECRET = "mock-refresh-secret-32-chars-minimum-safe";
process.env.OTP_SECRET = "mock-otp-hmac-secret-32-chars-minimum-safe";
process.env.CRON_SECRET = "mock-cron-secret-32-chars-minimum-safe";

import assert from "assert";
import { EventEmitter } from "events";

// ---------------------------------------------------------------------------
// Pure In-Memory Mock Store & Prisma Mock
// (ZERO Production Database Access, ZERO Network Sockets)
// ---------------------------------------------------------------------------

interface MockUser {
  id: string;
  email: string;
  role: "MERCHANT" | "CUSTOMER" | "ADMIN";
}

interface MockMerchant {
  id: string;
  ownerId: string;
  name: string;
  visitsRequired: number;
}

interface MockVisit {
  id: string;
  merchantId: string;
  customerId: string;
  visitDateIst: string;
  billAmount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REDEEMED";
  createdAt: Date;
  customer?: {
    id: string;
    fullName: string;
    phone: string;
  };
}

const mockStore = {
  users: new Map<string, MockUser>([
    ["user-merchant-a-id", { id: "user-merchant-a-id", email: "owner.a@store.in", role: "MERCHANT" }],
    ["user-merchant-b-id", { id: "user-merchant-b-id", email: "owner.b@store.in", role: "MERCHANT" }],
    ["user-admin-id", { id: "user-admin-id", email: "admin@platform.in", role: "ADMIN" }],
    ["user-customer-id", { id: "user-customer-id", email: "customer@gmail.com", role: "CUSTOMER" }],
  ]),

  merchants: new Map<string, MockMerchant>([
    ["merchant-a-uuid", { id: "merchant-a-uuid", ownerId: "user-merchant-a-id", name: "Merchant A Store", visitsRequired: 5 }],
    ["merchant-b-uuid", { id: "merchant-b-uuid", ownerId: "user-merchant-b-id", name: "Merchant B Store", visitsRequired: 8 }],
  ]),

  visits: [
    {
      id: "visit-a-pending-1",
      merchantId: "merchant-a-uuid",
      customerId: "cust-1",
      visitDateIst: "2026-11-10",
      billAmount: 150,
      status: "PENDING" as const,
      createdAt: new Date("2026-11-10T10:00:00Z"),
      customer: { id: "cust-1", fullName: "Customer One", phone: "+919811111111" },
    },
    {
      id: "visit-a-approved-1",
      merchantId: "merchant-a-uuid",
      customerId: "cust-1",
      visitDateIst: "2026-11-09",
      billAmount: 220,
      status: "APPROVED" as const,
      createdAt: new Date("2026-11-09T10:00:00Z"),
      customer: { id: "cust-1", fullName: "Customer One", phone: "+919811111111" },
    },
    {
      id: "visit-b-pending-1",
      merchantId: "merchant-b-uuid",
      customerId: "cust-2",
      visitDateIst: "2026-11-10",
      billAmount: 350,
      status: "PENDING" as const,
      createdAt: new Date("2026-11-10T11:00:00Z"),
      customer: { id: "cust-2", fullName: "Customer Two", phone: "+919822222222" },
    },
    {
      id: "visit-b-approved-1",
      merchantId: "merchant-b-uuid",
      customerId: "cust-2",
      visitDateIst: "2026-11-09",
      billAmount: 400,
      status: "APPROVED" as const,
      createdAt: new Date("2026-11-09T11:00:00Z"),
      customer: { id: "cust-2", fullName: "Customer Two", phone: "+919822222222" },
    },
  ] as MockVisit[],
};

const mockPrisma = {
  merchant: {
    findUnique: async ({ where, select }: any) => {
      const m = mockStore.merchants.get(where.id);
      if (!m) return null;
      if (select) {
        const out: any = {};
        for (const k of Object.keys(select)) {
          if (select[k]) out[k] = (m as any)[k];
        }
        return out;
      }
      return m;
    },
    findFirst: async ({ where }: any) => {
      for (const m of mockStore.merchants.values()) {
        if (where.ownerId && m.ownerId === where.ownerId) return m;
      }
      return null;
    },
  },

  user: {
    findUnique: async ({ where }: any) => {
      return mockStore.users.get(where.id) || null;
    },
  },

  visit: {
    findMany: async ({ where, orderBy, take }: any) => {
      let filtered = mockStore.visits.filter((v) => {
        if (where.merchantId && v.merchantId !== where.merchantId) return false;
        if (where.status && v.status !== where.status) return false;
        return true;
      });

      if (orderBy?.createdAt === "desc") {
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      if (take) {
        filtered = filtered.slice(0, take);
      }

      return filtered;
    },
  },
};

// Intercept global.prisma BEFORE importing application
(global as any).prisma = mockPrisma;

// Mock WebSocket implementation for unit and integration testing
class MockWebSocket extends EventEmitter {
  readyState = 1; // 1 = OPEN
  sentMessages: string[] = [];
  closeCode?: number;
  closeReason?: string;

  send(data: string) {
    this.sentMessages.push(data);
  }

  close(code?: number, reason?: string) {
    this.readyState = 2; // CLOSING
    this.closeCode = code;
    this.closeReason = reason;
    this.emit("close", code, reason);
    this.readyState = 3; // CLOSED
  }

  ping() {}
  terminate() {
    this.close(1006, "Terminated");
  }
}

async function runMultiTenantAuthorizationTests() {
  const { buildServer } = await import("../src/server.js");
  const { signAccessToken } = await import("../src/utils/jwt.js");
  const {
    handleTerminalSocketConnection,
    broadcastToMerchant,
    getMerchantRoomSize,
    getCustomerRoomSize,
  } = await import("../src/websocket/terminal.socket.js");

  console.log("==================================================");
  console.log("   STICKTHEBIZZ MULTI-TENANT AUTHORIZATION TESTS");
  console.log("   (Isolated In-Memory Mocks — ZERO Production DB Access)");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function testAssert(desc: string, condition: boolean, extraInfo?: any) {
    if (condition) {
      console.log(`  ✅ ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ ${desc}`);
      if (extraInfo) console.error("     Details:", extraInfo);
      failed++;
    }
  }

  // Generate verified test JWT tokens
  const tokenMerchantA = signAccessToken({
    userId: "user-merchant-a-id",
    email: "owner.a@store.in",
    role: "MERCHANT",
  });

  const tokenMerchantB = signAccessToken({
    userId: "user-merchant-b-id",
    email: "owner.b@store.in",
    role: "MERCHANT",
  });

  const tokenAdmin = signAccessToken({
    userId: "user-admin-id",
    email: "admin@platform.in",
    role: "ADMIN",
  });

  const tokenCustomer = signAccessToken({
    userId: "user-customer-id",
    email: "customer@gmail.com",
    role: "CUSTOMER",
  });

  const app = await buildServer();
  await app.ready();

  // ===========================================================================
  // [TEST GROUP 1] PENDING SCANS ENDPOINT (GET /api/v1/scans/pending)
  // ===========================================================================
  console.log("\n[TEST GROUP 1] Pending Scans Endpoint BOLA / IDOR Verification:");

  // 1. Merchant A owner accesses Merchant A pending data — PASS (200)
  const res1 = await app.inject({
    method: "GET",
    url: "/api/v1/scans/pending?merchantId=merchant-a-uuid",
    headers: { authorization: `Bearer ${tokenMerchantA}` },
  });
  const data1 = JSON.parse(res1.body);
  testAssert("1. Merchant A owner accesses Merchant A pending data — PASS (HTTP 200)", res1.statusCode === 200 && data1.visits.length === 1 && data1.visits[0].id === "visit-a-pending-1");

  // 2. Merchant B owner accesses Merchant B pending data — PASS (200)
  const res2 = await app.inject({
    method: "GET",
    url: "/api/v1/scans/pending?merchantId=merchant-b-uuid",
    headers: { authorization: `Bearer ${tokenMerchantB}` },
  });
  const data2 = JSON.parse(res2.body);
  testAssert("2. Merchant B owner accesses Merchant B pending data — PASS (HTTP 200)", res2.statusCode === 200 && data2.visits.length === 1 && data2.visits[0].id === "visit-b-pending-1");

  // 3. Merchant A owner requests Merchant B pending data — DENIED (403)
  const res3 = await app.inject({
    method: "GET",
    url: "/api/v1/scans/pending?merchantId=merchant-b-uuid",
    headers: { authorization: `Bearer ${tokenMerchantA}` },
  });
  const data3 = JSON.parse(res3.body);
  testAssert("3. Merchant A owner requests Merchant B pending data — DENIED (HTTP 403 Forbidden)", res3.statusCode === 403 && data3.error === "FORBIDDEN" && data3.visits === undefined);

  // 4. Merchant B owner requests Merchant A pending data — DENIED (403)
  const res4 = await app.inject({
    method: "GET",
    url: "/api/v1/scans/pending?merchantId=merchant-a-uuid",
    headers: { authorization: `Bearer ${tokenMerchantB}` },
  });
  const data4 = JSON.parse(res4.body);
  testAssert("4. Merchant B owner requests Merchant A pending data — DENIED (HTTP 403 Forbidden)", res4.statusCode === 403 && data4.error === "FORBIDDEN" && data4.visits === undefined);

  // 5. Unauthenticated request — DENIED (401)
  const res5 = await app.inject({
    method: "GET",
    url: "/api/v1/scans/pending?merchantId=merchant-a-uuid",
  });
  testAssert("5. Unauthenticated request to pending scans — DENIED (HTTP 401 Unauthorized)", res5.statusCode === 401);

  // 6. Invalid merchant ID — safe rejection (404)
  const res6 = await app.inject({
    method: "GET",
    url: "/api/v1/scans/pending?merchantId=00000000-0000-0000-0000-000000000000",
    headers: { authorization: `Bearer ${tokenMerchantA}` },
  });
  const data6 = JSON.parse(res6.body);
  testAssert("6. Invalid merchant ID on pending scans — safe rejection (HTTP 404 Not Found)", res6.statusCode === 404 && data6.error === "MERCHANT_NOT_FOUND");

  // 7. Missing merchant ID — behavior explicitly tested (400)
  const res7 = await app.inject({
    method: "GET",
    url: "/api/v1/scans/pending",
    headers: { authorization: `Bearer ${tokenMerchantA}` },
  });
  const data7 = JSON.parse(res7.body);
  testAssert("7. Missing merchant ID on pending scans — explicitly rejected (HTTP 400 Bad Request)", res7.statusCode === 400 && data7.error === "merchantId is required");

  // 8. Customer account attempting owner-only scan access — DENIED (403)
  const res8 = await app.inject({
    method: "GET",
    url: "/api/v1/scans/pending?merchantId=merchant-a-uuid",
    headers: { authorization: `Bearer ${tokenCustomer}` },
  });
  testAssert("8. Customer account attempting owner pending access — DENIED (HTTP 403 Forbidden)", res8.statusCode === 403);

  // 9. No cross-merchant records appear in response bodies
  const res9 = await app.inject({
    method: "GET",
    url: "/api/v1/scans/pending?merchantId=merchant-a-uuid",
    headers: { authorization: `Bearer ${tokenMerchantA}` },
  });
  const data9 = JSON.parse(res9.body);
  const hasOnlyA = data9.visits.every((v: any) => v.merchantId === "merchant-a-uuid");
  testAssert("9. Response strictly contains only the authorized merchant's pending scans", hasOnlyA && data9.visits.length > 0);

  // ===========================================================================
  // [TEST GROUP 2] LEDGER ENDPOINT (GET /api/v1/scans/ledger)
  // ===========================================================================
  console.log("\n[TEST GROUP 2] Ledger Endpoint BOLA / IDOR Verification:");

  // 10. Merchant A owner accesses Merchant A ledger data — PASS (200)
  const res10 = await app.inject({
    method: "GET",
    url: "/api/v1/scans/ledger?merchantId=merchant-a-uuid",
    headers: { authorization: `Bearer ${tokenMerchantA}` },
  });
  const data10 = JSON.parse(res10.body);
  testAssert("10. Merchant A owner accesses Merchant A ledger — PASS (HTTP 200)", res10.statusCode === 200 && data10.visits.length === 2);

  // 11. Merchant B owner accesses Merchant B ledger data — PASS (200)
  const res11 = await app.inject({
    method: "GET",
    url: "/api/v1/scans/ledger?merchantId=merchant-b-uuid",
    headers: { authorization: `Bearer ${tokenMerchantB}` },
  });
  const data11 = JSON.parse(res11.body);
  testAssert("11. Merchant B owner accesses Merchant B ledger — PASS (HTTP 200)", res11.statusCode === 200 && data11.visits.length === 2);

  // 12. Merchant A owner requests Merchant B ledger data — DENIED (403)
  const res12 = await app.inject({
    method: "GET",
    url: "/api/v1/scans/ledger?merchantId=merchant-b-uuid",
    headers: { authorization: `Bearer ${tokenMerchantA}` },
  });
  const data12 = JSON.parse(res12.body);
  testAssert("12. Merchant A owner requests Merchant B ledger — DENIED (HTTP 403 Forbidden)", res12.statusCode === 403 && data12.error === "FORBIDDEN" && data12.visits === undefined);

  // 13. Merchant B owner requests Merchant A ledger data — DENIED (403)
  const res13 = await app.inject({
    method: "GET",
    url: "/api/v1/scans/ledger?merchantId=merchant-a-uuid",
    headers: { authorization: `Bearer ${tokenMerchantB}` },
  });
  const data13 = JSON.parse(res13.body);
  testAssert("13. Merchant B owner requests Merchant A ledger — DENIED (HTTP 403 Forbidden)", res13.statusCode === 403 && data13.error === "FORBIDDEN" && data13.visits === undefined);

  // 14. Unauthenticated request to ledger — DENIED (401)
  const res14 = await app.inject({
    method: "GET",
    url: "/api/v1/scans/ledger?merchantId=merchant-a-uuid",
  });
  testAssert("14. Unauthenticated request to ledger — DENIED (HTTP 401 Unauthorized)", res14.statusCode === 401);

  // 15. Invalid merchant ID on ledger — safe rejection (404)
  const res15 = await app.inject({
    method: "GET",
    url: "/api/v1/scans/ledger?merchantId=non-existent-merchant",
    headers: { authorization: `Bearer ${tokenMerchantA}` },
  });
  const data15 = JSON.parse(res15.body);
  testAssert("15. Invalid merchant ID on ledger — safe rejection (HTTP 404 Not Found)", res15.statusCode === 404 && data15.error === "MERCHANT_NOT_FOUND");

  // 16. Missing merchant ID on ledger — explicitly rejected (400)
  const res16 = await app.inject({
    method: "GET",
    url: "/api/v1/scans/ledger",
    headers: { authorization: `Bearer ${tokenMerchantA}` },
  });
  const data16 = JSON.parse(res16.body);
  testAssert("16. Missing merchant ID on ledger — explicitly rejected (HTTP 400 Bad Request)", res16.statusCode === 400 && data16.error === "merchantId is required");

  // 17. Customer account attempting ledger access — DENIED (403)
  const res17 = await app.inject({
    method: "GET",
    url: "/api/v1/scans/ledger?merchantId=merchant-a-uuid",
    headers: { authorization: `Bearer ${tokenCustomer}` },
  });
  testAssert("17. Customer account attempting owner ledger access — DENIED (HTTP 403 Forbidden)", res17.statusCode === 403);

  // 18. Admin user accesses Merchant A ledger — ALLOWED (200)
  const res18 = await app.inject({
    method: "GET",
    url: "/api/v1/scans/ledger?merchantId=merchant-a-uuid",
    headers: { authorization: `Bearer ${tokenAdmin}` },
  });
  testAssert("18. Admin role authorized across merchant ledger data — PASS (HTTP 200)", res18.statusCode === 200);

  // ===========================================================================
  // [TEST GROUP 3] WEBSOCKET CROSS-TENANT ROOM SUBSCRIPTION TESTS
  // ===========================================================================
  console.log("\n[TEST GROUP 3] WebSocket Cross-Tenant Room Subscription Authorization:");

  // 19. Merchant A owner connects to Merchant A room — ALLOWED
  const ws19 = new MockWebSocket();
  await handleTerminalSocketConnection(ws19 as any, {
    query: { merchantId: "merchant-a-uuid", token: tokenMerchantA },
  } as any);
  testAssert("19. Merchant A owner connects to Merchant A room — ALLOWED (Joined Room)", getMerchantRoomSize("merchant-a-uuid") === 1 && ws19.sentMessages.some((m) => m.includes("connected")));

  // 20. Merchant B owner connects to Merchant B room — ALLOWED
  const ws20 = new MockWebSocket();
  await handleTerminalSocketConnection(ws20 as any, {
    query: { merchantId: "merchant-b-uuid", token: tokenMerchantB },
  } as any);
  testAssert("20. Merchant B owner connects to Merchant B room — ALLOWED (Joined Room)", getMerchantRoomSize("merchant-b-uuid") === 1 && ws20.sentMessages.some((m) => m.includes("connected")));

  // 21. Merchant A owner requests Merchant B room at connection — REJECTED
  const ws21 = new MockWebSocket();
  const roomBCountBefore = getMerchantRoomSize("merchant-b-uuid");
  await handleTerminalSocketConnection(ws21 as any, {
    query: { merchantId: "merchant-b-uuid", token: tokenMerchantA },
  } as any);
  testAssert(
    "21. Merchant A owner requests Merchant B room at connection — REJECTED (Closed with 4403)",
    ws21.closeCode === 4403 &&
      ws21.sentMessages.some((m) => m.includes("FORBIDDEN") && m.includes("Unauthorized: you do not own this merchant counter.")) &&
      getMerchantRoomSize("merchant-b-uuid") === roomBCountBefore
  );

  // 22. Merchant B owner requests Merchant A room at connection — REJECTED
  const ws22 = new MockWebSocket();
  const roomACountBefore = getMerchantRoomSize("merchant-a-uuid");
  await handleTerminalSocketConnection(ws22 as any, {
    query: { merchantId: "merchant-a-uuid", token: tokenMerchantB },
  } as any);
  testAssert(
    "22. Merchant B owner requests Merchant A room at connection — REJECTED (Closed with 4403)",
    ws22.closeCode === 4403 &&
      ws22.sentMessages.some((m) => m.includes("FORBIDDEN")) &&
      getMerchantRoomSize("merchant-a-uuid") === roomACountBefore
  );

  // 23. Unauthenticated socket requests merchant room — REJECTED
  const ws23 = new MockWebSocket();
  await handleTerminalSocketConnection(ws23 as any, {
    query: { merchantId: "merchant-a-uuid" },
  } as any);
  testAssert(
    "23. Unauthenticated socket requests merchant room — REJECTED (Closed with 4401)",
    ws23.closeCode === 4401 && ws23.sentMessages.some((m) => m.includes("UNAUTHORIZED"))
  );

  // 24. Invalid merchant ID at connection — REJECTED
  const ws24 = new MockWebSocket();
  await handleTerminalSocketConnection(ws24 as any, {
    query: { merchantId: "non-existent-merchant", token: tokenMerchantA },
  } as any);
  testAssert(
    "24. Invalid merchant ID at connection — REJECTED (Closed with 4403/4404)",
    ws24.closeCode === 4403 && ws24.sentMessages.some((m) => m.includes("MERCHANT_NOT_FOUND"))
  );

  // 25. Attempted unauthorized dynamic subscription after connection — REJECTED
  const ws25 = new MockWebSocket();
  // Connect legitimately as Merchant A
  await handleTerminalSocketConnection(ws25 as any, {
    query: { merchantId: "merchant-a-uuid", token: tokenMerchantA },
  } as any);
  const roomBCountBeforeDynamic = getMerchantRoomSize("merchant-b-uuid");

  // Attempt dynamic subscription to Merchant B
  ws25.emit("message", Buffer.from(JSON.stringify({ type: "subscribe_merchant", merchantId: "merchant-b-uuid" })));
  // Allow async handler tick
  await new Promise((r) => setTimeout(r, 50));

  testAssert(
    "25. Attempted unauthorized dynamic subscription after connection — REJECTED",
    ws25.sentMessages.some((m) => m.includes("FORBIDDEN") && m.includes("merchant:merchant-b-uuid")) &&
      getMerchantRoomSize("merchant-b-uuid") === roomBCountBeforeDynamic
  );

  // 26. Eavesdropping Isolation: Merchant A must NEVER receive Merchant B's broadcast events
  ws19.sentMessages = [];
  ws20.sentMessages = [];

  broadcastToMerchant("merchant-b-uuid", "new_scan", {
    visitId: "secret-visit-b-id",
    billAmount: 500,
    customerPhone: "+91 98*** ***22",
  });

  const bReceived = ws20.sentMessages.some((m) => m.includes("secret-visit-b-id"));
  const aReceived = ws19.sentMessages.some((m) => m.includes("secret-visit-b-id"));
  testAssert("26. Cross-Tenant Eavesdropping Protection: Merchant A receives 0 events from Merchant B", bReceived === true && aReceived === false);

  // 27. Disconnect and cleanup must still work correctly
  const roomASizeBeforeClose = getMerchantRoomSize("merchant-a-uuid");
  ws19.emit("close");
  testAssert("27. Socket disconnect correctly decrements room count and cleans up", getMerchantRoomSize("merchant-a-uuid") === roomASizeBeforeClose - 1);

  // 28. Customer socket connection connects to customer room without entering merchant room
  const ws28 = new MockWebSocket();
  await handleTerminalSocketConnection(ws28 as any, {
    query: { customerId: "customer-1-id" },
  } as any);
  testAssert("28. Customer socket connects to customer room safely (no merchant room bleed)", getCustomerRoomSize("customer-1-id") === 1 && ws28.sentMessages.some((m) => m.includes("connected")));
  ws28.emit("close");
  testAssert("29. Customer socket disconnect cleans up customer room", getCustomerRoomSize("customer-1-id") === 0);

  // Clean up remaining open test sockets
  ws20.emit("close");
  ws25.emit("close");
  await app.close();

  console.log("\n==================================================");
  console.log(`   MULTI-TENANT AUTHORIZATION RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runMultiTenantAuthorizationTests().catch((err) => {
  console.error("FATAL ERROR IN TEST HARNESS:", err);
  process.exit(1);
});

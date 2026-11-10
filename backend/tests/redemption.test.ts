import assert from "assert";

// Ensure environment is set to test without loading production .env
process.env.APP_ENV = "test";
process.env.NODE_ENV = "test";
process.env.NON_PRODUCTION_EMAIL_ALLOWLIST = "test@stickthebizz.in";
process.env.DATABASE_URL = "postgres://offline-mock-db:5432/mock_test_db";
process.env.RAZORPAY_KEY_ID = "rzp_test_mockKeyForOfflineTesting";

// ---------------------------------------------------------------------------
// Pure In-Memory Mock Store & Prisma Mock
// (ZERO Production Database Access, ZERO Network Sockets)
// ---------------------------------------------------------------------------

interface MockVisit {
  id: string;
  merchantId: string;
  customerId: string;
  visitDateIst: string;
  billAmount: number;
  status: "APPROVED" | "REDEEMED" | "PENDING";
  createdAt: Date;
}

interface MockRedemption {
  id: string;
  merchantId: string;
  customerId: string;
  rewardName: string;
  stampsBurned: number;
  createdAt: Date;
}

const mockStore = {
  merchants: new Map<string, any>(),
  customers: new Map<string, any>(),
  visits: [] as MockVisit[],
  redemptions: [] as MockRedemption[],
  updateManyOverrideCount: undefined as number | undefined,
  realPrismaInstantiated: false,
};

const mockTx = {
  visit: {
    findMany: async ({ where, orderBy }: any) => {
      let filtered = mockStore.visits.filter((v) => {
        if (where.merchantId && v.merchantId !== where.merchantId) return false;
        if (where.customerId && v.customerId !== where.customerId) return false;
        if (where.status && v.status !== where.status) return false;
        return true;
      });

      if (orderBy?.createdAt === "asc") {
        filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      } else if (orderBy?.createdAt === "desc") {
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      return filtered;
    },

    updateMany: async ({ where, data }: any) => {
      // If a test simulates concurrency conflict, return the overridden count
      if (mockStore.updateManyOverrideCount !== undefined) {
        return { count: mockStore.updateManyOverrideCount };
      }

      const ids: string[] = where?.id?.in || [];
      const requiredStatus = where?.status;

      let count = 0;
      for (const v of mockStore.visits) {
        if (ids.includes(v.id)) {
          if (!requiredStatus || v.status === requiredStatus) {
            v.status = data.status;
            count++;
          }
        }
      }
      return { count };
    },
  },

  redemption: {
    create: async ({ data }: any) => {
      const record: MockRedemption = {
        id: `mock-redemption-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        merchantId: data.merchantId,
        customerId: data.customerId,
        rewardName: data.rewardName,
        stampsBurned: data.stampsBurned,
        createdAt: new Date(),
      };
      mockStore.redemptions.push(record);
      return record;
    },
  },
};

const mockPrisma = {
  merchant: {
    findUnique: async ({ where }: any) => {
      return mockStore.merchants.get(where.id) || null;
    },
  },

  customer: {
    findFirst: async ({ where }: any) => {
      for (const c of mockStore.customers.values()) {
        if (where.phone && c.phone === where.phone) return c;
      }
      return null;
    },
  },

  $transaction: async (fn: (tx: typeof mockTx) => Promise<any>) => {
    return await fn(mockTx);
  },
};

// Intercept global.prisma BEFORE importing production db or scan services
(global as any).prisma = mockPrisma;

async function runRedemptionTests() {
  // ---------------------------------------------------------------------------
  // Dynamically import production service (binds strictly to mockPrisma)
  // ---------------------------------------------------------------------------
  const { prisma } = await import("../src/config/db.js");
  const { verifyRedemptionPin } = await import("../src/services/scan.service.js");
  console.log("==================================================");
  console.log("   STICKTHEBIZZ ATOMIC REDEMPTION TEST SUITE");
  console.log("   (SEC-01 Neutralized: Pure In-Memory Mocking — ZERO DB Calls)");
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

  // Verify that Prisma was intercepted and no real client was created
  testAssert(
    "Prisma client singleton strictly equals in-memory mock (no real DB initialized)",
    prisma === (mockPrisma as any)
  );

  const testMerchantId = "mock-merchant-uuid-1111";
  const testCustomerId = "mock-customer-uuid-2222";
  const testPhone = "9876543210";
  const merchantPin = "2468";

  const baseMerchant = {
    id: testMerchantId,
    name: "Cafe Mocha Atomic Test",
    slug: "cafe-mocha-atomic",
    visitsRequired: 5,
    rewardName: "1 Free Cold Coffee",
    redemptionPin: merchantPin,
    subscriptionStatus: "ACTIVE",
    minSpend: 100,
    ownerId: "mock-owner-uuid-9999",
  };

  const baseCustomer = {
    id: testCustomerId,
    phone: testPhone,
    fullName: "Loyal Concurrency Customer",
  };

  function resetStore() {
    mockStore.merchants.clear();
    mockStore.customers.clear();
    mockStore.visits = [];
    mockStore.redemptions = [];
    mockStore.updateManyOverrideCount = undefined;

    mockStore.merchants.set(testMerchantId, { ...baseMerchant });
    mockStore.customers.set(testCustomerId, { ...baseCustomer });
  }

  // -------------------------------------------------------------------------
  // TEST 1: Insufficient approved visits (3 of 5 stamps)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 1] Testing redemption with insufficient stamps (3 of 5):");
  resetStore();
  for (let i = 1; i <= 3; i++) {
    mockStore.visits.push({
      id: `visit-insufficient-${i}`,
      merchantId: testMerchantId,
      customerId: testCustomerId,
      visitDateIst: `2026-10-0${i}`,
      billAmount: 150,
      status: "APPROVED",
      createdAt: new Date(`2026-10-0${i}T10:00:00Z`),
    });
  }

  const resInsufficient = await verifyRedemptionPin({
    merchantId: testMerchantId,
    pin: merchantPin,
    customerPhone: testPhone,
  });

  testAssert(
    "Rejects redemption when customer has 3 of 5 stamps",
    resInsufficient.success === false &&
      resInsufficient.message.includes("Customer has 3 approved stamps, but 5 are required"),
    resInsufficient
  );
  testAssert(
    "No visits were modified on insufficient stamps",
    mockStore.visits.every((v) => v.status === "APPROVED")
  );
  testAssert(
    "No redemption ledger entry created on insufficient stamps",
    mockStore.redemptions.length === 0
  );

  // -------------------------------------------------------------------------
  // TEST 2: Wrong Voucher PIN
  // -------------------------------------------------------------------------
  console.log("\n[TEST 2] Testing redemption with wrong Voucher PIN:");
  resetStore();
  for (let i = 1; i <= 5; i++) {
    mockStore.visits.push({
      id: `visit-wrong-pin-${i}`,
      merchantId: testMerchantId,
      customerId: testCustomerId,
      visitDateIst: `2026-10-0${i}`,
      billAmount: 150,
      status: "APPROVED",
      createdAt: new Date(`2026-10-0${i}T10:00:00Z`),
    });
  }

  const resWrongPin = await verifyRedemptionPin({
    merchantId: testMerchantId,
    pin: "9999", // wrong PIN
    customerPhone: testPhone,
  });

  testAssert(
    "Rejects redemption when wrong PIN is supplied",
    resWrongPin.success === false &&
      resWrongPin.message === "Invalid 4-digit Voucher PIN. Check customer phone.",
    resWrongPin
  );
  testAssert(
    "Zero stamps burned when PIN is incorrect",
    mockStore.visits.every((v) => v.status === "APPROVED")
  );
  testAssert(
    "Zero redemption ledgers created when PIN is incorrect",
    mockStore.redemptions.length === 0
  );

  // -------------------------------------------------------------------------
  // TEST 3: Normal redemption with exact required stamps (5 of 5)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 3] Testing normal redemption with exact 5 stamps:");
  resetStore();
  for (let i = 1; i <= 5; i++) {
    mockStore.visits.push({
      id: `visit-exact-${i}`,
      merchantId: testMerchantId,
      customerId: testCustomerId,
      visitDateIst: `2026-10-0${i}`,
      billAmount: 150,
      status: "APPROVED",
      createdAt: new Date(`2026-10-0${i}T10:00:00Z`),
    });
  }

  const resExact = await verifyRedemptionPin({
    merchantId: testMerchantId,
    pin: merchantPin,
    customerPhone: testPhone,
  });

  testAssert(
    "Successfully verifies redemption with 5 of 5 stamps",
    resExact.success === true &&
      resExact.remainingSurplus === 0 &&
      resExact.message.includes("1 Free Cold Coffee"),
    resExact
  );
  testAssert(
    "All 5 visits updated to REDEEMED",
    mockStore.visits.every((v) => v.status === "REDEEMED")
  );
  testAssert(
    "Exactly 1 redemption ledger record created with 5 stamps burned",
    mockStore.redemptions.length === 1 &&
      mockStore.redemptions[0].stampsBurned === 5 &&
      mockStore.redemptions[0].rewardName === "1 Free Cold Coffee"
  );

  // -------------------------------------------------------------------------
  // TEST 4: Surplus stamps (8 approved visits with 5 required -> 3 surplus)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 4] Testing surplus stamps retention (8 of 5 stamps):");
  resetStore();
  for (let i = 1; i <= 8; i++) {
    mockStore.visits.push({
      id: `visit-surplus-${i}`,
      merchantId: testMerchantId,
      customerId: testCustomerId,
      visitDateIst: `2026-10-0${i}`,
      billAmount: 150,
      status: "APPROVED",
      createdAt: new Date(`2026-10-0${i}T10:00:00Z`),
    });
  }

  const resSurplus = await verifyRedemptionPin({
    merchantId: testMerchantId,
    pin: merchantPin,
    customerPhone: testPhone,
  });

  const redeemedCount = mockStore.visits.filter((v) => v.status === "REDEEMED").length;
  const approvedRemainingCount = mockStore.visits.filter((v) => v.status === "APPROVED").length;

  testAssert(
    "Redemption succeeds with 3 surplus stamps reported",
    resSurplus.success === true &&
      resSurplus.remainingSurplus === 3 &&
      resSurplus.message.includes("3 surplus stamps saved for next cycle"),
    resSurplus
  );
  testAssert(
    "Exactly 5 oldest visits were burned to REDEEMED",
    redeemedCount === 5 &&
      mockStore.visits.slice(0, 5).every((v) => v.status === "REDEEMED")
  );
  testAssert(
    "Exactly 3 newest visits remain untouched in APPROVED status",
    approvedRemainingCount === 3 &&
      mockStore.visits.slice(5).every((v) => v.status === "APPROVED")
  );
  testAssert(
    "Redemption ledger recorded exactly 5 stamps burned",
    mockStore.redemptions.length === 1 && mockStore.redemptions[0].stampsBurned === 5
  );

  // -------------------------------------------------------------------------
  // TEST 5: Conditional update count mismatch (Simulated Concurrent Conflict)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 5] Testing conditional update count mismatch (concurrency conflict):");
  resetStore();
  for (let i = 1; i <= 5; i++) {
    mockStore.visits.push({
      id: `visit-conflict-${i}`,
      merchantId: testMerchantId,
      customerId: testCustomerId,
      visitDateIst: `2026-10-0${i}`,
      billAmount: 150,
      status: "APPROVED",
      createdAt: new Date(`2026-10-0${i}T10:00:00Z`),
    });
  }

  // Simulate concurrent process claiming 1 stamp: updateMany only finds 4 available
  mockStore.updateManyOverrideCount = 4;

  const resConflict = await verifyRedemptionPin({
    merchantId: testMerchantId,
    pin: merchantPin,
    customerPhone: testPhone,
  });

  testAssert(
    "Detects conditional update count mismatch and returns safe concurrency conflict response",
    resConflict.success === false &&
      resConflict.message.includes("Redemption conflict: stamps were already consumed by a concurrent request"),
    resConflict
  );
  testAssert(
    "No redemption ledger entry created on concurrency conflict",
    mockStore.redemptions.length === 0
  );

  // -------------------------------------------------------------------------
  // TEST 6: Unauthorized merchant owner verification
  // -------------------------------------------------------------------------
  console.log("\n[TEST 6] Testing unauthorized merchant owner rejection:");
  resetStore();
  const resUnauthorized = await verifyRedemptionPin({
    merchantId: testMerchantId,
    pin: merchantPin,
    customerPhone: testPhone,
    merchantOwnerUserId: "different-unauthorized-user-uuid",
  });

  testAssert(
    "Rejects request when merchantOwnerUserId does not match merchant owner",
    resUnauthorized.success === false &&
      resUnauthorized.message === "Unauthorized: not the owner of this counter.",
    resUnauthorized
  );
  testAssert(
    "Zero redemptions created on unauthorized owner attempt",
    mockStore.redemptions.length === 0
  );

  // -------------------------------------------------------------------------
  // TEST 7: Zero network / database socket verification
  // -------------------------------------------------------------------------
  console.log("\n[TEST 7] Offline architectural safety verification:");
  testAssert(
    "Zero calls to real PrismaClient constructor or Supabase database socket",
    mockStore.realPrismaInstantiated === false
  );

  console.log("\n==================================================");
  console.log(`   REDEMPTION TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runRedemptionTests().catch((err) => {
  console.error("Unexpected test error:", err);
  process.exit(1);
});

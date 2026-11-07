import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import assert from "assert";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { prisma } from "../src/config/db.js";
import { verifyRedemptionPin } from "../src/services/scan.service.js";

async function runRedemptionTests() {
  console.log("==================================================");
  console.log("   STICKTHEBIZZ ATOMIC REDEMPTION TEST SUITE");
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

  const testSuffix = Date.now().toString().slice(-6);
  const testPhone = `999${testSuffix}1`;
  const merchantSlug = `atomic-test-store-${testSuffix}`;

  let merchantId = "";
  let customerId = "";

  try {
    console.log("\n[SETUP] Creating isolated test merchant and customer in real PostgreSQL...");

    // 1. Create Test Merchant (5 stamps required)
    const merchant = await prisma.merchant.create({
      data: {
        name: `Atomic Test Store ${testSuffix}`,
        slug: merchantSlug,
        visitsRequired: 5,
        rewardName: "1 Free Cold Coffee",
        redemptionPin: "2468",
        subscriptionStatus: "ACTIVE",
        minSpend: 100,
      },
    });
    merchantId = merchant.id;

    // 2. Create Test Customer
    const customer = await prisma.customer.create({
      data: {
        phone: testPhone,
        fullName: "Test Concurrency Customer",
      },
    });
    customerId = customer.id;

    console.log(`[SETUP] Seeded Merchant ID=${merchantId}, Customer ID=${customerId}`);

    // -------------------------------------------------------------------------
    // TEST 1: Insufficient approved stamps
    // -------------------------------------------------------------------------
    console.log("\n[TEST 1] Testing redemption with insufficient stamps (3 of 5):");
    for (let i = 1; i <= 3; i++) {
      await prisma.visit.create({
        data: {
          merchantId,
          customerId,
          visitDateIst: `2026-10-0${i}`,
          billAmount: 150,
          status: "APPROVED",
        },
      });
    }

    const resInsufficient = await verifyRedemptionPin({
      merchantId,
      pin: "2468",
      customerPhone: testPhone,
    });

    testAssert(
      "Rejects redemption when customer has 3 of 5 stamps",
      resInsufficient.success === false && resInsufficient.message.includes("Customer has 3 approved stamps, but 5 are required"),
      resInsufficient
    );

    // -------------------------------------------------------------------------
    // TEST 2: Normal redemption (exact 5 stamps)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 2] Testing normal redemption with exact 5 stamps:");
    for (let i = 4; i <= 5; i++) {
      await prisma.visit.create({
        data: {
          merchantId,
          customerId,
          visitDateIst: `2026-10-0${i}`,
          billAmount: 150,
          status: "APPROVED",
        },
      });
    }

    const resNormal = await verifyRedemptionPin({
      merchantId,
      pin: "2468",
      customerPhone: testPhone,
    });

    testAssert(
      "Normal redemption succeeds when 5 stamps available",
      resNormal.success === true && resNormal.remainingSurplus === 0,
      resNormal
    );

    const burnedVisits = await prisma.visit.count({
      where: { merchantId, customerId, status: "REDEEMED" },
    });
    testAssert("Exactly 5 visits marked as REDEEMED", burnedVisits === 5, { burnedVisits });

    const redemptionsCount1 = await prisma.redemption.count({
      where: { merchantId, customerId },
    });
    testAssert("Exactly 1 Redemption record created in database", redemptionsCount1 === 1);

    // -------------------------------------------------------------------------
    // TEST 3: Duplicate redemption attempt on consumed stamps
    // -------------------------------------------------------------------------
    console.log("\n[TEST 3] Testing duplicate redemption attempt on already consumed stamps:");
    const resDuplicate = await verifyRedemptionPin({
      merchantId,
      pin: "2468",
      customerPhone: testPhone,
    });

    testAssert(
      "Duplicate redemption rejected (0 approved stamps available)",
      resDuplicate.success === false && resDuplicate.message.includes("Customer has 0 approved stamps, but 5 are required"),
      resDuplicate
    );

    const redemptionsCountAfterDup = await prisma.redemption.count({
      where: { merchantId, customerId },
    });
    testAssert("No duplicate Redemption record created", redemptionsCountAfterDup === 1);

    // -------------------------------------------------------------------------
    // TEST 4: Redemption with surplus stamps
    // -------------------------------------------------------------------------
    console.log("\n[TEST 4] Testing redemption with surplus stamps (7 stamps for 5-stamp reward):");
    for (let i = 10; i <= 16; i++) {
      await prisma.visit.create({
        data: {
          merchantId,
          customerId,
          visitDateIst: `2026-10-${i}`,
          billAmount: 200,
          status: "APPROVED",
        },
      });
    }

    const resSurplus = await verifyRedemptionPin({
      merchantId,
      pin: "2468",
      customerPhone: testPhone,
    });

    testAssert(
      "Redemption with 7 stamps succeeds with remainingSurplus = 2",
      resSurplus.success === true && resSurplus.remainingSurplus === 2,
      resSurplus
    );

    const remainingApproved = await prisma.visit.count({
      where: { merchantId, customerId, status: "APPROVED" },
    });
    testAssert("Exactly 2 surplus stamps remain in APPROVED status", remainingApproved === 2, { remainingApproved });

    // -------------------------------------------------------------------------
    // TEST 5: Concurrent redemption race condition simulation
    // -------------------------------------------------------------------------
    console.log("\n[TEST 5] Testing concurrent redemption requests (two parallel requests for same 5 stamps):");
    // Add 3 more approved stamps so customer has exactly 2 + 3 = 5 approved stamps
    for (let i = 20; i <= 22; i++) {
      await prisma.visit.create({
        data: {
          merchantId,
          customerId,
          visitDateIst: `2026-10-${i}`,
          billAmount: 180,
          status: "APPROVED",
        },
      });
    }

    const countBeforeConcurrency = await prisma.visit.count({
      where: { merchantId, customerId, status: "APPROVED" },
    });
    testAssert("Customer has exactly 5 approved stamps before concurrent execution", countBeforeConcurrency === 5);

    // Fire TWO simultaneous calls using Promise.all
    const [concurrent1, concurrent2] = await Promise.all([
      verifyRedemptionPin({ merchantId, pin: "2468", customerPhone: testPhone }),
      verifyRedemptionPin({ merchantId, pin: "2468", customerPhone: testPhone }),
    ]);

    const successes = [concurrent1, concurrent2].filter((r) => r.success);
    const failures = [concurrent1, concurrent2].filter((r) => !r.success);

    testAssert("Exactly ONE concurrent request succeeds", successes.length === 1, { successes, failures });
    testAssert("Exactly ONE concurrent request fails", failures.length === 1, { successes, failures });

    testAssert(
      "Failing request returns conflict or insufficient stamps message",
      failures[0].message.includes("Redemption conflict") || failures[0].message.includes("approved stamps"),
      failures[0].message
    );

    // Verify final database state: exactly 5 stamps burned, 0 leftover approved
    const finalApprovedCount = await prisma.visit.count({
      where: { merchantId, customerId, status: "APPROVED" },
    });
    testAssert("0 stamps left in APPROVED status after concurrent execution", finalApprovedCount === 0);

    const totalRedemptions = await prisma.redemption.count({
      where: { merchantId, customerId },
    });
    // Total successful redemptions across tests 2, 4, and 5 should be exactly 3
    testAssert("Total Redemption records in database equals exactly 3", totalRedemptions === 3, { totalRedemptions });

    // -------------------------------------------------------------------------
    // TEST 6: Atomic Rollback on Error
    // -------------------------------------------------------------------------
    console.log("\n[TEST 6] Testing atomic rollback when transaction encounters failure:");
    // Add 5 approved stamps
    const rollbackVisitIds: string[] = [];
    for (let i = 25; i <= 29; i++) {
      const v = await prisma.visit.create({
        data: {
          merchantId,
          customerId,
          visitDateIst: `2026-10-${i}`,
          billAmount: 100,
          status: "APPROVED",
        },
      });
      rollbackVisitIds.push(v.id);
    }

    // Simulate an aborted transaction where update succeeds but subsequent step fails
    let rollbackErrorCaught = false;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.visit.updateMany({
          where: { id: { in: rollbackVisitIds } },
          data: { status: "REDEEMED" },
        });
        // Intentionally throw an error before completion
        throw new Error("SIMULATED_TRANSACTION_FAILURE");
      });
    } catch (err: any) {
      if (err.message === "SIMULATED_TRANSACTION_FAILURE") {
        rollbackErrorCaught = true;
      }
    }

    testAssert("Simulated transaction failure threw and was caught", rollbackErrorCaught);

    // Verify all 5 visits were rolled back and remain APPROVED
    const stillApprovedCount = await prisma.visit.count({
      where: { id: { in: rollbackVisitIds }, status: "APPROVED" },
    });
    testAssert("All 5 stamps were rolled back and remain strictly APPROVED", stillApprovedCount === 5, { stillApprovedCount });

  } catch (err) {
    console.error("Test execution uncaught error:", err);
    failed++;
  } finally {
    console.log("\n[CLEANUP] Cleaning up test records from PostgreSQL...");
    if (merchantId && customerId) {
      await prisma.visit.deleteMany({ where: { merchantId, customerId } });
      await prisma.redemption.deleteMany({ where: { merchantId, customerId } });
      await prisma.customer.deleteMany({ where: { id: customerId } });
      await prisma.merchant.deleteMany({ where: { id: merchantId } });
      console.log("[CLEANUP] Cleaned test merchant, customer, visits, and redemptions successfully.");
    }
    await prisma.$disconnect();
  }

  console.log("\n==================================================");
  console.log(`   REDEMPTION TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runRedemptionTests();


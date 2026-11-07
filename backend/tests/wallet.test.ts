import assert from "assert";
import { prisma } from "../src/config/db.js";
import { getCustomerWallet } from "../src/services/customer.service.js";

async function runWalletTests() {
  console.log("==================================================");
  console.log("   STICKTHEBIZZ CUSTOMER WALLET PROGRESS TEST");
  console.log("   (Isolated In-Memory Mocking — ZERO Production DB Access)");
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

  const mockMerchantId = "mock-merchant-1111-2222";
  const mockCustomerId = "mock-customer-3333-4444";
  const mockPhone = "9876543210";

  const mockMerchant = {
    id: mockMerchantId,
    name: "Cafe Mocha Test",
    slug: "cafe-mocha-test",
    category: "Cafe / Chai",
    minSpend: 100,
    visitsRequired: 5, // Reward threshold = 5
    rewardName: "1 Free Cold Coffee",
    validityDays: 30,
    subscriptionStatus: "ACTIVE",
    createdAt: new Date("2026-01-01"),
  };

  const mockCustomer = {
    id: mockCustomerId,
    userId: "mock-user-5555",
    phone: mockPhone,
    fullName: "John Loyal",
    email: "john@example.com",
    createdAt: new Date("2026-01-01"),
  };

  // Mock prisma.customer.findFirst
  prisma.customer.findFirst = async () => mockCustomer as any;

  // Mock prisma.merchant.findMany
  prisma.merchant.findMany = async () => [mockMerchant] as any;

  // Track any accidental write calls to guarantee read-only safety
  let writeAttempted = false;
  prisma.visit.update = (async () => { writeAttempted = true; }) as any;
  prisma.visit.updateMany = (async () => { writeAttempted = true; }) as any;
  prisma.visit.delete = (async () => { writeAttempted = true; }) as any;
  prisma.visit.deleteMany = (async () => { writeAttempted = true; }) as any;
  prisma.visit.create = (async () => { writeAttempted = true; }) as any;

  // -------------------------------------------------------------------------
  // SCENARIO 1: 3 APPROVED visits (Threshold = 5) -> Expected: 3/5, COLLECTING
  // -------------------------------------------------------------------------
  console.log("\n[SCENARIO 1] 3 APPROVED visits, threshold 5:");
  prisma.visit.findMany = async () => [
    { id: "v1", merchantId: mockMerchantId, customerId: mockCustomerId, status: "APPROVED", visitDateIst: "2026-10-01", billAmount: 150, createdAt: new Date("2026-10-01"), merchant: mockMerchant },
    { id: "v2", merchantId: mockMerchantId, customerId: mockCustomerId, status: "APPROVED", visitDateIst: "2026-10-02", billAmount: 150, createdAt: new Date("2026-10-02"), merchant: mockMerchant },
    { id: "v3", merchantId: mockMerchantId, customerId: mockCustomerId, status: "APPROVED", visitDateIst: "2026-10-03", billAmount: 150, createdAt: new Date("2026-10-03"), merchant: mockMerchant },
  ] as any;

  const wallet1 = await getCustomerWallet({ phone: mockPhone });
  const pass1 = wallet1.passes[0];

  testAssert("visitsCount is 3", pass1.visitsCount === 3, pass1);
  testAssert("displayVisits is 3", pass1.displayVisits === 3, pass1);
  testAssert("progressPercent is 60%", pass1.progressPercent === 60, pass1);
  testAssert("status is COLLECTING", pass1.status === "COLLECTING", pass1);

  // -------------------------------------------------------------------------
  // SCENARIO 2: 5 APPROVED visits (Threshold = 5) -> Expected: 5/5, REWARD READY
  // -------------------------------------------------------------------------
  console.log("\n[SCENARIO 2] 5 APPROVED visits, threshold 5:");
  prisma.visit.findMany = async () => [
    { id: "v1", merchantId: mockMerchantId, customerId: mockCustomerId, status: "APPROVED", visitDateIst: "2026-10-01", billAmount: 150, createdAt: new Date("2026-10-01"), merchant: mockMerchant },
    { id: "v2", merchantId: mockMerchantId, customerId: mockCustomerId, status: "APPROVED", visitDateIst: "2026-10-02", billAmount: 150, createdAt: new Date("2026-10-02"), merchant: mockMerchant },
    { id: "v3", merchantId: mockMerchantId, customerId: mockCustomerId, status: "APPROVED", visitDateIst: "2026-10-03", billAmount: 150, createdAt: new Date("2026-10-03"), merchant: mockMerchant },
    { id: "v4", merchantId: mockMerchantId, customerId: mockCustomerId, status: "APPROVED", visitDateIst: "2026-10-04", billAmount: 150, createdAt: new Date("2026-10-04"), merchant: mockMerchant },
    { id: "v5", merchantId: mockMerchantId, customerId: mockCustomerId, status: "APPROVED", visitDateIst: "2026-10-05", billAmount: 150, createdAt: new Date("2026-10-05"), merchant: mockMerchant },
  ] as any;

  const wallet2 = await getCustomerWallet({ phone: mockPhone });
  const pass2 = wallet2.passes[0];

  testAssert("visitsCount is 5", pass2.visitsCount === 5, pass2);
  testAssert("displayVisits is 5", pass2.displayVisits === 5, pass2);
  testAssert("progressPercent is 100%", pass2.progressPercent === 100, pass2);
  testAssert("status is REWARD READY", pass2.status === "REWARD READY", pass2);

  // -------------------------------------------------------------------------
  // SCENARIO 3: 5 REDEEMED, 0 APPROVED (Threshold = 5) -> Expected: 0/5, COLLECTING
  // -------------------------------------------------------------------------
  console.log("\n[SCENARIO 3] 5 REDEEMED, 0 APPROVED visits, threshold 5 (Post-Redemption Cycle Reset):");
  prisma.visit.findMany = async () => [
    { id: "v1", merchantId: mockMerchantId, customerId: mockCustomerId, status: "REDEEMED", visitDateIst: "2026-10-01", billAmount: 150, createdAt: new Date("2026-10-01"), merchant: mockMerchant },
    { id: "v2", merchantId: mockMerchantId, customerId: mockCustomerId, status: "REDEEMED", visitDateIst: "2026-10-02", billAmount: 150, createdAt: new Date("2026-10-02"), merchant: mockMerchant },
    { id: "v3", merchantId: mockMerchantId, customerId: mockCustomerId, status: "REDEEMED", visitDateIst: "2026-10-03", billAmount: 150, createdAt: new Date("2026-10-03"), merchant: mockMerchant },
    { id: "v4", merchantId: mockMerchantId, customerId: mockCustomerId, status: "REDEEMED", visitDateIst: "2026-10-04", billAmount: 150, createdAt: new Date("2026-10-04"), merchant: mockMerchant },
    { id: "v5", merchantId: mockMerchantId, customerId: mockCustomerId, status: "REDEEMED", visitDateIst: "2026-10-05", billAmount: 150, createdAt: new Date("2026-10-05"), merchant: mockMerchant },
  ] as any;

  const wallet3 = await getCustomerWallet({ phone: mockPhone });
  const pass3 = wallet3.passes[0];

  testAssert("visitsCount resets to 0 (redeemed stamps excluded)", pass3.visitsCount === 0, pass3);
  testAssert("displayVisits is 0", pass3.displayVisits === 0, pass3);
  testAssert("progressPercent is 0%", pass3.progressPercent === 0, pass3);
  testAssert("status is COLLECTING (not stuck on REWARD READY)", pass3.status === "COLLECTING", pass3);

  // -------------------------------------------------------------------------
  // SCENARIO 4: 5 REDEEMED, 2 APPROVED (Threshold = 5) -> Expected: 2/5, COLLECTING
  // -------------------------------------------------------------------------
  console.log("\n[SCENARIO 4] 5 REDEEMED, 2 APPROVED visits, threshold 5 (Surplus Stamp Carry-Forward):");
  prisma.visit.findMany = async () => [
    { id: "v1", merchantId: mockMerchantId, customerId: mockCustomerId, status: "REDEEMED", visitDateIst: "2026-10-01", billAmount: 150, createdAt: new Date("2026-10-01"), merchant: mockMerchant },
    { id: "v2", merchantId: mockMerchantId, customerId: mockCustomerId, status: "REDEEMED", visitDateIst: "2026-10-02", billAmount: 150, createdAt: new Date("2026-10-02"), merchant: mockMerchant },
    { id: "v3", merchantId: mockMerchantId, customerId: mockCustomerId, status: "REDEEMED", visitDateIst: "2026-10-03", billAmount: 150, createdAt: new Date("2026-10-03"), merchant: mockMerchant },
    { id: "v4", merchantId: mockMerchantId, customerId: mockCustomerId, status: "REDEEMED", visitDateIst: "2026-10-04", billAmount: 150, createdAt: new Date("2026-10-04"), merchant: mockMerchant },
    { id: "v5", merchantId: mockMerchantId, customerId: mockCustomerId, status: "REDEEMED", visitDateIst: "2026-10-05", billAmount: 150, createdAt: new Date("2026-10-05"), merchant: mockMerchant },
    { id: "v6", merchantId: mockMerchantId, customerId: mockCustomerId, status: "APPROVED", visitDateIst: "2026-10-06", billAmount: 150, createdAt: new Date("2026-10-06"), merchant: mockMerchant },
    { id: "v7", merchantId: mockMerchantId, customerId: mockCustomerId, status: "APPROVED", visitDateIst: "2026-10-07", billAmount: 150, createdAt: new Date("2026-10-07"), merchant: mockMerchant },
  ] as any;

  const wallet4 = await getCustomerWallet({ phone: mockPhone });
  const pass4 = wallet4.passes[0];

  testAssert("visitsCount reflects exactly 2 surplus stamps", pass4.visitsCount === 2, pass4);
  testAssert("displayVisits is 2", pass4.displayVisits === 2, pass4);
  testAssert("progressPercent is 40%", pass4.progressPercent === 40, pass4);
  testAssert("status is COLLECTING", pass4.status === "COLLECTING", pass4);

  // -------------------------------------------------------------------------
  // SCENARIO 5: 5 REDEEMED, 5 APPROVED (Threshold = 5) -> Expected: 5/5, REWARD READY
  // -------------------------------------------------------------------------
  console.log("\n[SCENARIO 5] 5 REDEEMED, 5 APPROVED visits, threshold 5 (Next Cycle Milestone Reached):");
  prisma.visit.findMany = async () => [
    { id: "v1", merchantId: mockMerchantId, customerId: mockCustomerId, status: "REDEEMED", visitDateIst: "2026-10-01", billAmount: 150, createdAt: new Date("2026-10-01"), merchant: mockMerchant },
    { id: "v2", merchantId: mockMerchantId, customerId: mockCustomerId, status: "REDEEMED", visitDateIst: "2026-10-02", billAmount: 150, createdAt: new Date("2026-10-02"), merchant: mockMerchant },
    { id: "v3", merchantId: mockMerchantId, customerId: mockCustomerId, status: "REDEEMED", visitDateIst: "2026-10-03", billAmount: 150, createdAt: new Date("2026-10-03"), merchant: mockMerchant },
    { id: "v4", merchantId: mockMerchantId, customerId: mockCustomerId, status: "REDEEMED", visitDateIst: "2026-10-04", billAmount: 150, createdAt: new Date("2026-10-04"), merchant: mockMerchant },
    { id: "v5", merchantId: mockMerchantId, customerId: mockCustomerId, status: "REDEEMED", visitDateIst: "2026-10-05", billAmount: 150, createdAt: new Date("2026-10-05"), merchant: mockMerchant },
    { id: "v6", merchantId: mockMerchantId, customerId: mockCustomerId, status: "APPROVED", visitDateIst: "2026-10-06", billAmount: 150, createdAt: new Date("2026-10-06"), merchant: mockMerchant },
    { id: "v7", merchantId: mockMerchantId, customerId: mockCustomerId, status: "APPROVED", visitDateIst: "2026-10-07", billAmount: 150, createdAt: new Date("2026-10-07"), merchant: mockMerchant },
    { id: "v8", merchantId: mockMerchantId, customerId: mockCustomerId, status: "APPROVED", visitDateIst: "2026-10-08", billAmount: 150, createdAt: new Date("2026-10-08"), merchant: mockMerchant },
    { id: "v9", merchantId: mockMerchantId, customerId: mockCustomerId, status: "APPROVED", visitDateIst: "2026-10-09", billAmount: 150, createdAt: new Date("2026-10-09"), merchant: mockMerchant },
    { id: "v10", merchantId: mockMerchantId, customerId: mockCustomerId, status: "APPROVED", visitDateIst: "2026-10-10", billAmount: 150, createdAt: new Date("2026-10-10"), merchant: mockMerchant },
  ] as any;

  const wallet5 = await getCustomerWallet({ phone: mockPhone });
  const pass5 = wallet5.passes[0];

  testAssert("visitsCount reflects exactly 5 new approved stamps", pass5.visitsCount === 5, pass5);
  testAssert("displayVisits is 5", pass5.displayVisits === 5, pass5);
  testAssert("progressPercent is 100%", pass5.progressPercent === 100, pass5);
  testAssert("status is REWARD READY", pass5.status === "REWARD READY", pass5);

  // -------------------------------------------------------------------------
  // VERIFICATION 6: History Ledger contains Redeemed visits
  // -------------------------------------------------------------------------
  console.log("\n[VERIFICATION 6] Historical Activity Ledger contains Redeemed visits:");
  testAssert("Wallet history contains all 10 visits", wallet5.history.length === 10, wallet5.history.length);
  const redeemedHistory = wallet5.history.filter((h) => h.status === "Redeemed");
  const approvedHistory = wallet5.history.filter((h) => h.status === "Approved");
  testAssert("Exactly 5 visits in history carry 'Redeemed' label", redeemedHistory.length === 5, redeemedHistory.length);
  testAssert("Exactly 5 visits in history carry 'Approved' label", approvedHistory.length === 5, approvedHistory.length);

  // -------------------------------------------------------------------------
  // VERIFICATION 7: Pure Read-Only Guarantee (No writes attempted)
  // -------------------------------------------------------------------------
  console.log("\n[VERIFICATION 7] Zero Database Mutations:");
  testAssert("Zero database write/update/delete calls were executed", writeAttempted === false);

  console.log("\n==================================================");
  console.log(`   WALLET TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runWalletTests().catch((err) => {
  console.error("Wallet test execution failed:", err);
  process.exit(1);
});


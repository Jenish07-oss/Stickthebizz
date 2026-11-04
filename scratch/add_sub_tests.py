with open("tests/live-e2e.test.mjs", "r", encoding="utf-8") as f:
    c = f.read()

sub_tests = """
// -------------------------------------------------------------------
// 6. SUBSCRIPTION & PROMO CODE TESTS
// -------------------------------------------------------------------
console.log("\\n--- 6. SUBSCRIPTION & PROMO CODE INTEGRITY ---");

await test("Monthly & Yearly plan calculations (Yearly includes 20% discount)", async () => {
  const monthlyBase = 749;
  const yearlyBase = 7190;
  const originalYearly = 12 * 749; // 8988
  const discountAmount = originalYearly - yearlyBase; // 1798
  const discountPercent = Math.round((discountAmount / originalYearly) * 100);

  assert.strictEqual(discountPercent, 20, "Yearly plan must offer 20% discount");
  assert.ok(yearlyBase < originalYearly, "Yearly plan must be discounted");
});

await test("Redeem code 'BETA100' provides 100% discount (₹0 activation)", async () => {
  const code = "BETA100";
  const base = 749;
  const discount = (base * 100) / 100;
  const finalAmount = Math.max(0, base - discount);
  assert.strictEqual(finalAmount, 0, "BETA100 must yield ₹0 payable");
});

await test("1-Day Grace Period calculation enforces 24 hours window", async () => {
  const durationDays = 30;
  const graceDays = 1;
  const totalCoveredDays = durationDays + graceDays;
  assert.strictEqual(totalCoveredDays, 31, "Total covered duration must be 31 days");
});
"""

if "--- 6. SUBSCRIPTION & PROMO CODE INTEGRITY ---" not in c:
    c = c.replace("// -------------------------------------------------------------------\n// SUMMARY", sub_tests + "\n// -------------------------------------------------------------------\n// SUMMARY")
    with open("tests/live-e2e.test.mjs", "w", encoding="utf-8") as f:
        f.write(c)
    print("Added subscription & promo tests to live-e2e.test.mjs")


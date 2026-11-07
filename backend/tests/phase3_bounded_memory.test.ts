import assert from "assert";
import {
  BoundedRateLimiter,
  KeyValidationError,
  normalizeIp,
  normalizeRoute,
  buildDeterministicKey,
  rateLimit,
} from "../src/middlewares/ratelimit.middleware.js";

async function runPhase3BoundedMemoryTests() {
  console.log("==================================================");
  console.log("   STICKTHEBIZZ PHASE 3D.4: BOUNDED ENUMERATION TESTS");
  console.log("   (Isolated Component Tests — ZERO Production DB Access)");
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

  // Time provider for deterministic testing
  let currentTime = 1_000_000;
  const timeProvider = () => currentTime;

  console.log("\n[TEST GROUP 1] Bounded Object Enumeration & Edge Cases (Cases 1-11):");
  {
    // 1. Empty object rejection
    let thrownEmpty = false;
    try {
      buildDeterministicKey({});
    } catch (e) {
      if (e instanceof KeyValidationError) thrownEmpty = true;
    }
    testAssert("1. Empty object rejected", thrownEmpty);

    // 2. Exactly 16 valid properties accepted
    const sixteenParts: Record<string, string> = {};
    for (let i = 0; i < 16; i++) {
      sixteenParts[`k_${i.toString().padStart(2, "0")}`] = `val_${i}`;
    }
    const hash16 = buildDeterministicKey(sixteenParts);
    testAssert("2. Exactly 16 valid properties accepted", typeof hash16 === "string" && hash16.length === 64);

    // 3. Seventeenth enumerable property rejected
    const seventeenParts: Record<string, string> = { ...sixteenParts, k_16: "overflow" };
    let thrown17 = false;
    try {
      buildDeterministicKey(seventeenParts);
    } catch (e) {
      if (e instanceof KeyValidationError) thrown17 = true;
    }
    testAssert("3. Seventeenth enumerable property rejected", thrown17);

    // 4. Large object with thousands of properties rejected
    const largeObject: Record<string, string> = {};
    for (let i = 0; i < 5_000; i++) {
      largeObject[`prop_${i}`] = `value_${i}`;
    }
    let thrownLarge = false;
    try {
      buildDeterministicKey(largeObject);
    } catch (e) {
      if (e instanceof KeyValidationError) thrownLarge = true;
    }
    testAssert("4. Large object with 5,000 properties rejected", thrownLarge);

    // 5. Large object rejection does not materialize all entries (proves early loop termination)
    let getterAccessCount = 0;
    const trackedGettersObj: Record<string, string> = {};
    for (let i = 0; i < 1_000; i++) {
      Object.defineProperty(trackedGettersObj, `getter_prop_${i}`, {
        enumerable: true,
        get() {
          getterAccessCount++;
          return `val_${i}`;
        },
      });
    }
    let thrownTracked = false;
    try {
      buildDeterministicKey(trackedGettersObj);
    } catch (e) {
      if (e instanceof KeyValidationError) thrownTracked = true;
    }
    testAssert("5a. Tracked large getter object rejected", thrownTracked);
    // At most 16 getter invocations occurred because loop terminated on 17th property before reading its value
    testAssert("5b. Early termination verified: exactly 16 getters executed out of 1,000", getterAccessCount === 16);

    // 6. Null-prototype object with valid properties
    const nullProtoObj = Object.create(null);
    nullProtoObj.r = "/api/v1/scan/punch";
    nullProtoObj.ip = "192.168.1.100";
    const nullProtoHash = buildDeterministicKey(nullProtoObj);
    testAssert("6. Null-prototype object with valid properties accepted", typeof nullProtoHash === "string" && nullProtoHash.length === 64);

    // 7. Inherited properties are not included
    const parentProto = { inheritedProp: "should_be_ignored" };
    const childObj = Object.create(parentProto);
    childObj.r = "/api/v1/scan/punch";
    childObj.ip = "192.168.1.100";
    const childHash = buildDeterministicKey(childObj);
    const directHash = buildDeterministicKey({ r: "/api/v1/scan/punch", ip: "192.168.1.100" });
    testAssert("7. Inherited properties are not included in key hash", childHash === directHash);

    // 8. Non-enumerable properties are not included
    const nonEnumObj = { r: "/api/v1/scan/punch", ip: "192.168.1.100" };
    Object.defineProperty(nonEnumObj, "secretHidden", {
      enumerable: false,
      value: "should_not_be_hashed",
    });
    const nonEnumHash = buildDeterministicKey(nonEnumObj);
    testAssert("8. Non-enumerable properties are not included in key hash", nonEnumHash === directHash);

    // 9. Symbol-property handling is explicitly tested and documented (symbols are ignored by for..in)
    const symKey = Symbol("rateLimitTag");
    const symObj = { r: "/api/v1/scan/punch", ip: "192.168.1.100", [symKey]: "symbolValue" };
    const symHash = buildDeterministicKey(symObj as any);
    testAssert("9. Symbol properties are ignored and do not alter hash", symHash === directHash);

    // 10. Getter throwing during validation is safely rejected
    const throwingGetterObj: Record<string, string> = {
      r: "/api/v1/scan/punch",
    };
    Object.defineProperty(throwingGetterObj, "ip", {
      enumerable: true,
      get() {
        throw new Error("Getter database lookup failed");
      },
    });
    let thrownGetterError = false;
    try {
      buildDeterministicKey(throwingGetterObj);
    } catch (e: any) {
      if (e.message === "Getter database lookup failed") thrownGetterError = true;
    }
    testAssert("10. Throwing getter safely bubbles up for middleware fail-closed handling", thrownGetterError);

    // 11. Getter side effects do not cause unbounded enumeration
    let sideEffectsCount = 0;
    const sideEffectObj: Record<string, string> = {};
    for (let i = 0; i < 50; i++) {
      Object.defineProperty(sideEffectObj, `p_${i}`, {
        enumerable: true,
        get() {
          sideEffectsCount++;
          return "val";
        },
      });
    }
    try {
      buildDeterministicKey(sideEffectObj);
    } catch {
      // Expected rejection at 17th prop
    }
    testAssert("11. Getter side effects strictly capped at 16 executions", sideEffectsCount === 16);
  }

  console.log("\n[TEST GROUP 2] Property Name & Value Validation (Cases 12-16):");
  {
    // 12. Invalid property names rejected (empty or > 64 chars)
    let thrownEmptyProp = false;
    try {
      buildDeterministicKey({ "": "value" });
    } catch (e) {
      if (e instanceof KeyValidationError) thrownEmptyProp = true;
    }
    testAssert("12a. Empty property name rejected", thrownEmptyProp);

    let thrown65Prop = false;
    try {
      buildDeterministicKey({ ["k".repeat(65)]: "value" });
    } catch (e) {
      if (e instanceof KeyValidationError) thrown65Prop = true;
    }
    testAssert("12b. 65-character property name rejected", thrown65Prop);

    // 13. Non-string values rejected
    let thrownNonStringVal = false;
    try {
      buildDeterministicKey({ prop: 999 as any });
    } catch (e) {
      if (e instanceof KeyValidationError) thrownNonStringVal = true;
    }
    testAssert("13. Non-string property value rejected", thrownNonStringVal);

    // 14. Values longer than 512 characters rejected
    let thrown513Val = false;
    try {
      buildDeterministicKey({ prop: "v".repeat(513) });
    } catch (e) {
      if (e instanceof KeyValidationError) thrown513Val = true;
    }
    testAssert("14. 513-character value rejected", thrown513Val);

    // 15. Valid objects remain deterministic regardless of insertion order
    const h1 = buildDeterministicKey({ c: "3", a: "1", b: "2" });
    const h2 = buildDeterministicKey({ a: "1", b: "2", c: "3" });
    const h3 = buildDeterministicKey({ b: "2", c: "3", a: "1" });
    testAssert("15. Deterministic hash identical across all insertion permutations", h1 === h2 && h2 === h3);

    // 16. SHA-256 output remains 64 lowercase hexadecimal characters
    testAssert("16a. Output length is exactly 64", h1.length === 64);
    testAssert("16b. Output is valid lowercase hex", /^[0-9a-f]{64}$/.test(h1));
  }

  console.log("\n[TEST GROUP 3] Custom keyGenerator & Middleware Fail-Closed (Cases 17-18):");
  {
    currentTime = 2_000_000;
    let replyStatus = 0;
    let replyPayload: any = null;
    let replyHeaders: Record<string, string> = {};

    const createMockReply = () => {
      replyStatus = 0;
      replyPayload = null;
      replyHeaders = {};
      const mockReply: any = {
        header: (name: string, val: string) => {
          replyHeaders[name] = val;
          return mockReply;
        },
        status: (code: number) => {
          replyStatus = code;
          return {
            send: (data: any) => {
              replyPayload = data;
              return data;
            },
          };
        },
      };
      return mockReply;
    };

    // 17. Existing invalid custom key-generator handling remains HTTP 503
    const mwThrowing = rateLimit({
      windowMs: 60_000,
      maxRequests: 5,
      keyGenerator: () => {
        throw new Error("Sensitive database connection failure details");
      },
      timeProvider,
    });
    await mwThrowing({} as any, createMockReply());
    testAssert("17a. Throwing custom keyGenerator rejected with HTTP 503", replyStatus === 503);
    testAssert("17b. Positive integer Retry-After header present", typeof replyHeaders["Retry-After"] === "string" && parseInt(replyHeaders["Retry-After"], 10) > 0);
    testAssert("17c. Generic client-facing error without leaking exception text", replyPayload.error === "Service temporarily unavailable due to request identity validation failure.");

    // 18. Existing valid custom key-generator behavior remains compatible
    const mwValid = rateLimit({
      windowMs: 60_000,
      maxRequests: 2,
      keyGenerator: (req) => `user_${(req as any).customerId}`,
      timeProvider,
    });
    const reply1 = createMockReply();
    await mwValid({ customerId: "101" } as any, reply1);
    testAssert("18a. Valid custom generator request 1 allowed", replyStatus === 0);

    const reply2 = createMockReply();
    await mwValid({ customerId: "101" } as any, reply2);
    testAssert("18b. Valid custom generator request 2 allowed", replyStatus === 0);

    const reply3 = createMockReply();
    await mwValid({ customerId: "101" } as any, reply3);
    testAssert("18c. Valid custom generator request 3 blocked with HTTP 429", replyStatus === 429);
  }

  console.log("\n[TEST GROUP 4] Capacity, Eviction & Existing Route Compatibility (Cases 19-20):");
  {
    currentTime = 3_000_000;
    const CAPACITY = 5;
    const limiter = new BoundedRateLimiter({
      windowMs: 60_000,
      maxRequests: 2,
      maxCapacity: CAPACITY,
      timeProvider,
    });

    // 19. Existing 10,000-entry capacity and no-unexpired-eviction tests remain passing
    for (let i = 1; i <= CAPACITY; i++) {
      limiter.evaluate(`active-key-${i}`);
    }
    testAssert("19a. Store reaches exact capacity bound", limiter.size === CAPACITY);

    const overflowRes = limiter.evaluate("untracked-overflow-key");
    testAssert("19b. Overflow key rejected with HTTP 503", overflowRes.allowed === false && overflowRes.statusCode === 503);
    testAssert("19c. Capacity strictly preserved at capacity limit", limiter.size === CAPACITY);

    // Existing tracked keys continue evaluation
    const existingReq = limiter.evaluate("active-key-1");
    testAssert("19d. Tracked key evaluated at capacity", existingReq.allowed === true);

    // Expired entries reclaimed
    currentTime += 60_001;
    const reclaimedRes = limiter.evaluate("reclaimed-key");
    testAssert("19e. Expired entries safely pruned from head of store", reclaimedRes.allowed === true);
    testAssert("19f. Store pruned down to 1 active key", limiter.size === 1);
    limiter.destroy();

    // Verify 10,000 capacity under 20,000 attempts
    currentTime = 4_000_000;
    const maxLimiter = new BoundedRateLimiter({
      windowMs: 60_000,
      maxRequests: 5,
      maxCapacity: 10_000,
      timeProvider,
    });
    for (let i = 0; i < 20_000; i++) {
      maxLimiter.evaluate(`flood-key-${i}`);
    }
    testAssert("19g. 10,000 max capacity invariant holds after 20,000 attempts", maxLimiter.size === 10_000);
    maxLimiter.destroy();

    // 20. Existing /punch response-contract tests remain passing
    currentTime = 5_000_000;
    let punchReplyStatus = 0;
    let punchReplyPayload: any = null;
    let punchReplyHeaders: Record<string, string> = {};

    const mockPunchReply: any = {
      header: (name: string, val: string) => {
        punchReplyHeaders[name] = val;
        return mockPunchReply;
      },
      status: (code: number) => {
        punchReplyStatus = code;
        return {
          send: (data: any) => {
            punchReplyPayload = data;
            return data;
          },
        };
      },
    };

    const punchMw = rateLimit({
      windowMs: 60_000,
      maxRequests: 2,
      message: "Too many scan attempts. Please wait.",
      timeProvider,
    });

    const mockPunchReq: any = {
      ip: "192.168.1.100",
      routeOptions: { url: "/api/v1/scan/punch" },
      url: "/api/v1/scan/punch",
    };

    await punchMw(mockPunchReq, mockPunchReply);
    testAssert("20a. Scan punch request 1 allowed", punchReplyStatus === 0);

    await punchMw(mockPunchReq, mockPunchReply);
    testAssert("20b. Scan punch request 2 allowed", punchReplyStatus === 0);

    await punchMw(mockPunchReq, mockPunchReply);
    testAssert("20c. Scan punch request 3 blocked with HTTP 429", punchReplyStatus === 429);
    testAssert("20d. Scan punch Retry-After header present as string integer", typeof punchReplyHeaders["Retry-After"] === "string" && parseInt(punchReplyHeaders["Retry-After"], 10) > 0);
    testAssert("20e. Scan punch error payload matches configured message", punchReplyPayload.error === "Too many scan attempts. Please wait.");
    testAssert("20f. Scan punch retryAfter matches header", punchReplyPayload.retryAfter === parseInt(punchReplyHeaders["Retry-After"], 10));
  }

  console.log("==================================================");
  console.log(`   PHASE 3D.4 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3BoundedMemoryTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

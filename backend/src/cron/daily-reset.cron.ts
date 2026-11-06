import cron from "node-cron";
import { prisma } from "../config/db.js";
import { getTodayISTDateString, getNextMidnightISTInUTC } from "../utils/ist.js";

export interface DailyResetResult {
  success: boolean;
  timestamp: string;
  todayIST: string;
  nextMidnightUTC: string;
  expiredToGraceCount: number;
  graceToInactiveCount: number;
  expiredOtpsDeleted: number;
  expiredIdempotencyKeysDeleted: number;
}

/**
 * Executes the 12:00 AM IST daily reset routine.
 */
export async function executeDailyReset(): Promise<DailyResetResult> {
  const now = new Date();
  const todayIST = getTodayISTDateString();
  const nextMidnightUTC = getNextMidnightISTInUTC().toISOString();

  // 1. Transition merchants whose subscription expired to GRACE_PERIOD
  const expiredToGrace = await prisma.merchant.updateMany({
    where: {
      subscriptionStatus: "ACTIVE",
      subscriptionExpiresAt: { lte: now },
      gracePeriodEndsAt: { gte: now },
    },
    data: {
      subscriptionStatus: "GRACE_PERIOD",
    },
  });

  // 2. Transition merchants whose grace period ended to INACTIVE
  const graceToInactive = await prisma.merchant.updateMany({
    where: {
      subscriptionStatus: { in: ["ACTIVE", "GRACE_PERIOD"] },
      gracePeriodEndsAt: { lt: now },
    },
    data: {
      subscriptionStatus: "INACTIVE",
    },
  });

  // 3. Purge expired OTPs
  const purgedOtps = await prisma.otpCode.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  // 4. Purge expired idempotency keys
  const purgedIdemp = await prisma.idempotencyKey.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  // 5. Purge expired sessions
  await prisma.session.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  console.log(
    `[CRON 12:00 AM IST] Reset complete. Date: ${todayIST}. Grace: ${expiredToGrace.count}, Inactive: ${graceToInactive.count}, Cleaned OTPs: ${purgedOtps.count}`
  );

  return {
    success: true,
    timestamp: now.toISOString(),
    todayIST,
    nextMidnightUTC,
    expiredToGraceCount: expiredToGrace.count,
    graceToInactiveCount: graceToInactive.count,
    expiredOtpsDeleted: purgedOtps.count,
    expiredIdempotencyKeysDeleted: purgedIdemp.count,
  };
}

/**
 * Initializes internal cron scheduler running at exactly 12:00:00 AM IST (18:30:00 UTC).
 */
export function startDailyResetCron() {
  // node-cron with Asia/Kolkata timezone: at 00:00:00 every day
  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log("⏰ Triggering scheduled 12:00 AM IST daily reset...");
      try {
        await executeDailyReset();
      } catch (err) {
        console.error("❌ Scheduled daily reset error:", err);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  console.log("⏰ 12:00 AM IST (18:30 UTC) Daily Reset Cron scheduled.");
}


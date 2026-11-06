import { NextRequest, NextResponse } from "next/server";
import { getNextMidnightISTInUTC, getTodayISTDateString } from "@/lib/time/ist";

export async function GET(req: NextRequest) {
  const todayIST = getTodayISTDateString();
  const nextMidnightUTC = getNextMidnightISTInUTC();

  return NextResponse.json({
    success: true,
    message: "Daily reset evaluated at 12:00 AM IST (18:30 UTC)",
    todayIST,
    cronScheduledTimeUTC: "18:30:00",
    equivalentTimeIST: "00:00:00",
    nextMidnightUTC: nextMidnightUTC.toISOString(),
    status: "PASSES_UNLOCKED",
  });
}

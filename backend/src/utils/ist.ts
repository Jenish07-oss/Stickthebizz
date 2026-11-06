/**
 * Indian Standard Time (IST - Asia/Kolkata, UTC+05:30) Engine
 * All database records store UTC timestamps.
 * Daily visit reset strictly evaluates at 12:00 AM IST (18:30 UTC).
 */

export const IST_TIMEZONE = "Asia/Kolkata";
export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +5h 30m in milliseconds

export function getNowUTC(): string {
  return new Date().toISOString();
}

/**
 * Returns today's calendar date in IST: "YYYY-MM-DD"
 */
export function getTodayISTDateString(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: IST_TIMEZONE });
}

/**
 * Formats timestamp to readable IST time: "hh:mm:ss A"
 */
export function formatISTTime(dateOrIso?: string | Date | null): string {
  if (!dateOrIso) return "";
  const d = typeof dateOrIso === "string" ? new Date(dateOrIso) : dateOrIso;
  return d.toLocaleTimeString("en-IN", {
    timeZone: IST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/**
 * Formats timestamp to readable IST datetime: "DD/MM/YYYY, hh:mm:ss A"
 */
export function formatISTDateTime(dateOrIso?: string | Date | null): string {
  if (!dateOrIso) return "";
  const d = typeof dateOrIso === "string" ? new Date(dateOrIso) : dateOrIso;
  return d.toLocaleString("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/**
 * Calculates next upcoming 12:00 AM IST midnight in UTC Date object.
 * Daily reset cron executes at 18:30 UTC = 00:00 IST next day.
 */
export function getNextMidnightISTInUTC(): Date {
  const now = new Date();
  const istDateStr = now.toLocaleDateString("en-CA", { timeZone: IST_TIMEZONE });
  const [year, month, day] = istDateStr.split("-").map(Number);

  // Next calendar date in IST
  const nextDayIST = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));
  // Subtract 5.5 hours to convert IST wall-clock back to UTC timestamp
  return new Date(nextDayIST.getTime() - IST_OFFSET_MS);
}

/**
 * Returns formatted countdown object until next 12:00 AM IST
 */
export function getTimeUntilNextMidnightIST(): {
  hours: number;
  minutes: number;
  seconds: number;
  formattedCountdown: string;
} {
  const now = new Date();
  const nextMidnight = getNextMidnightISTInUTC();
  const diffMs = Math.max(0, nextMidnight.getTime() - now.getTime());

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  const formattedCountdown = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;

  return {
    hours,
    minutes,
    seconds,
    formattedCountdown,
  };
}


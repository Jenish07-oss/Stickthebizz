/**
 * IST (Indian Standard Time: UTC+05:30) Timezone Utilities
 * All timestamps stored in UTC, converted and displayed in Asia/Kolkata
 */

export const IST_TIMEZONE = "Asia/Kolkata";
export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +5h 30m

/**
 * Returns current timestamp in UTC ISO string
 */
export function getNowUTC(): string {
  return new Date().toISOString();
}

/**
 * Returns formatted date string in IST: YYYY-MM-DD
 */
export function getTodayISTDateString(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: IST_TIMEZONE });
}

/**
 * Returns formatted time in IST: hh:mm:ss A
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
 * Returns formatted date & time in IST: DD/MM/YYYY, hh:mm:ss A
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
 * Computes next midnight IST (12:00 AM IST) in UTC Date object.
 * Daily reset cron runs at 18:30 UTC = 00:00 IST next day.
 */
export function getNextMidnightISTInUTC(): Date {
  const now = new Date();
  // Get current date string in IST: "YYYY-MM-DD"
  const istDateStr = now.toLocaleDateString("en-CA", { timeZone: IST_TIMEZONE });
  const [year, month, day] = istDateStr.split("-").map(Number);

  // Construct next day's 00:00:00 in IST (which is year, month-1, day + 1)
  // IST is UTC + 5.5 hours. So 00:00:00 IST = 18:30:00 UTC previous calendar date.
  const nextDayIST = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));
  // Subtract 5.5 hours to convert IST wall-clock back to UTC timestamp
  const nextMidnightUTC = new Date(nextDayIST.getTime() - IST_OFFSET_MS);

  return nextMidnightUTC;
}

/**
 * Returns formatted countdown string until next 12:00 AM IST (e.g. "07h 51m 56s")
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

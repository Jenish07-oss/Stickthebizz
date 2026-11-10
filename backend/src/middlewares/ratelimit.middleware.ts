import type { FastifyRequest, FastifyReply } from "fastify";
import { isIP } from "node:net";
import { createHash } from "node:crypto";

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  maxCapacity?: number;
  keyGenerator?: (req: FastifyRequest) => string | Promise<string>;
  timeProvider?: () => number;
}

export interface RateLimitResult {
  allowed: boolean;
  statusCode?: 429 | 503;
  retryAfterSec?: number;
  error?: string;
}

export interface TrackedEntry {
  timestamps: number[];
  expiresAt: number;
}

/**
 * Dedicated error class thrown when rate-limiter identity generation or validation fails.
 */
export class KeyValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KeyValidationError";
  }
}

/**
 * Validates and normalizes IP addresses.
 * Rejects oversized inputs before processing to prevent CPU/memory exhaustion.
 * Returns valid IPv4, lowercase IPv6, or "invalid-ip". Never truncates.
 */
export function normalizeIp(rawIp: unknown): string {
  if (typeof rawIp !== "string" || rawIp.length > 128) {
    return "invalid-ip";
  }
  const trimmed = rawIp.trim();
  if (trimmed.length === 0) {
    return "invalid-ip";
  }
  const version = isIP(trimmed);
  if (version === 4) {
    return trimmed;
  }
  if (version === 6) {
    return trimmed.toLowerCase();
  }
  return "invalid-ip";
}

/**
 * Normalizes route path to prevent arbitrary strings or parameter explosion.
 * Rejects oversized inputs (> 512 chars) before processing. Never truncates.
 */
export function normalizeRoute(rawRoute: unknown): string {
  if (typeof rawRoute !== "string" || rawRoute.length === 0 || rawRoute.length > 512) {
    return "unknown-route";
  }
  const pathOnly = rawRoute.split("?")[0].split("#")[0].trim();
  return pathOnly.length > 0 ? pathOnly : "unknown-route";
}

/**
 * Builds a collision-proof deterministic SHA-256 hash using length-prefixed framing.
 * Rejects invalid key components strictly instead of silently replacing them with shared sentinels.
 * Bounded enumeration: halts immediately on encountering the 17th component without
 * materializing all object entries into memory.
 * Returns strictly 64 lowercase hexadecimal characters for valid inputs.
 */
export function buildDeterministicKey(parts: Record<string, string>): string {
  if (!parts || typeof parts !== "object" || Array.isArray(parts)) {
    throw new KeyValidationError("Invalid key object: must be a non-null object.");
  }

  const MAX_COMPONENTS = 16;
  const validated: Array<[string, string]> = [];
  let count = 0;

  for (const k in parts) {
    if (!Object.prototype.hasOwnProperty.call(parts, k)) {
      continue;
    }

    count++;
    if (count > MAX_COMPONENTS) {
      throw new KeyValidationError(`Invalid key object: contains more than ${MAX_COMPONENTS} components.`);
    }

    if (typeof k !== "string" || k.length === 0) {
      throw new KeyValidationError("Invalid key component: property name must be a non-empty string.");
    }
    if (k.length > 64) {
      throw new KeyValidationError(`Invalid key component: property name exceeds maximum length of 64 characters (got ${k.length}).`);
    }

    const v = parts[k];
    if (typeof v !== "string") {
      throw new KeyValidationError(`Invalid key component '${k}': property value must be a string.`);
    }
    if (v.length > 512) {
      throw new KeyValidationError(`Invalid key component '${k}': property value exceeds maximum length of 512 characters (got ${v.length}).`);
    }

    validated.push([k, v]);
  }

  if (count === 0) {
    throw new KeyValidationError("Invalid key object: must contain at least one component.");
  }

  validated.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const framed = validated
    .map(([k, v]) => `${k.length}:${k}=${v.length}:${v}`)
    .join("|");
  return createHash("sha256").update(framed).digest("hex");
}

/**
 * Bounded in-memory sliding window rate limiter.
 *
 * Availability & Security Trade-Off:
 * When all `maxCapacity` slots (default 10,000) are occupied by unexpired active entries,
 * new untracked keys are rejected with HTTP 503 (Capacity Exhausted) rather than silently
 * evicting active rate-limit history.
 *
 * This strict fail-closed capacity bound guarantees that the Node.js process heap cannot
 * be exhausted by an IP flooding attack, while preserving active security throttling state.
 */
export class BoundedRateLimiter {
  private readonly maxCapacity: number;
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly message: string;
  private readonly timeProvider: () => number;
  private readonly store = new Map<string, TrackedEntry>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: RateLimitOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.maxCapacity = options.maxCapacity ?? 10_000;
    this.message = options.message || "Too many requests. Please slow down.";
    this.timeProvider = options.timeProvider ?? (() => Date.now());

    // Background interval for idle cleanup every 5 minutes (does not hold event loop)
    this.cleanupTimer = setInterval(() => {
      this.pruneExpired(this.timeProvider());
    }, 5 * 60 * 1000);
    if (this.cleanupTimer?.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Prunes expired entries from the head of the Map.
   * Because entries are re-inserted into the Map upon update, Map key iteration
   * maintains monotonically non-decreasing `expiresAt` order.
   * This yields O(k) cleanup where k is the number of expired entries, stopping
   * on the first unexpired entry in O(1).
   */
  public pruneExpired(now: number): void {
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
      } else {
        break; // All subsequent entries have expiresAt >= entry.expiresAt > now
      }
    }
  }

  public get size(): number {
    return this.store.size;
  }

  public has(key: string): boolean {
    return this.store.has(key);
  }

  public getEntry(key: string): TrackedEntry | undefined {
    return this.store.get(key);
  }

  public clear(): void {
    this.store.clear();
  }

  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.store.clear();
  }

  /**
   * Evaluates the rate limit for a given key.
   * Strictly enforces maxCapacity without evicting active security restrictions.
   */
  public evaluate(key: string): RateLimitResult {
    const now = this.timeProvider();
    const existing = this.store.get(key);

    if (existing) {
      // 1. Existing tracked entry: retain and evaluate sliding window
      const recent = existing.timestamps.filter((t) => now - t < this.windowMs);

      if (recent.length >= this.maxRequests) {
        const oldest = recent[0];
        const resetSec = Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000));
        return {
          allowed: false,
          statusCode: 429,
          retryAfterSec: resetSec,
          error: this.message,
        };
      }

      recent.push(now);
      const updatedEntry: TrackedEntry = {
        timestamps: recent,
        expiresAt: now + this.windowMs,
      };

      // Re-insert at the end to maintain chronological expiresAt order
      this.store.delete(key);
      this.store.set(key, updatedEntry);

      return { allowed: true };
    }

    // 2. New untracked key: check capacity
    if (this.store.size >= this.maxCapacity) {
      // Fast head-pruning of expired entries
      this.pruneExpired(now);

      // If still at capacity, all entries are unexpired.
      // INVARIANT: Never silently evict unexpired rate-limit history to make room.
      if (this.store.size >= this.maxCapacity) {
        const retryAfterSec = Math.max(1, Math.ceil(Math.min(this.windowMs, 30_000) / 1000));
        return {
          allowed: false,
          statusCode: 503,
          retryAfterSec,
          error: "Service temporarily unavailable due to capacity limits. Please retry shortly.",
        };
      }
    }

    // Insert new tracked entry
    const newEntry: TrackedEntry = {
      timestamps: [now],
      expiresAt: now + this.windowMs,
    };
    this.store.set(key, newEntry);

    return { allowed: true };
  }
}

/**
 * Fastify preHandler middleware factory for bounded in-memory sliding window rate limiting.
 */
export function rateLimit(options: RateLimitOptions) {
  const limiter = new BoundedRateLimiter(options);

  return async (req: FastifyRequest, reply: FastifyReply) => {
    let key: string;

    try {
      if (options.keyGenerator) {
        const generated = await options.keyGenerator(req);
        if (typeof generated !== "string" || generated.length === 0 || generated.length > 512) {
          throw new KeyValidationError("Custom keyGenerator produced invalid key");
        }
        key = buildDeterministicKey({ k: generated });
      } else {
        // Do not perform manual X-Forwarded-For parsing.
        // Use req.ip or socket.remoteAddress as provided by Fastify.
        const ip = normalizeIp(req.ip || req.socket?.remoteAddress);
        if (ip === "invalid-ip") {
          throw new KeyValidationError("Invalid client IP address");
        }
        const route = normalizeRoute(req.routeOptions?.url || req.url);
        if (route === "unknown-route") {
          throw new KeyValidationError("Invalid route identifier");
        }
        key = buildDeterministicKey({ r: route, ip });
      }
    } catch {
      // Safe fail-closed response without exposing internal error or sensitive data
      const retryAfter = Math.max(1, Math.ceil(Math.min(options.windowMs, 30_000) / 1000));
      reply.header("Retry-After", retryAfter.toString());
      return reply.status(503).send({
        success: false,
        error: "Service temporarily unavailable due to request identity validation failure.",
        retryAfter,
      });
    }

    const result = limiter.evaluate(key);

    if (!result.allowed) {
      reply.header("Retry-After", result.retryAfterSec!.toString());
      return reply.status(result.statusCode!).send({
        success: false,
        error: result.error,
        retryAfter: result.retryAfterSec,
      });
    }
  };
}

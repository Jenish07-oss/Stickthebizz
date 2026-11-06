import type { FastifyRequest, FastifyReply } from "fastify";

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

/**
 * In-memory sliding window rate limiter.
 */
export function rateLimit(options: RateLimitOptions) {
  const hits = new Map<string, number[]>();

  // Cleanup interval every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of hits.entries()) {
      const recent = timestamps.filter((t) => now - t < options.windowMs);
      if (recent.length === 0) {
        hits.delete(key);
      } else {
        hits.set(key, recent);
      }
    }
  }, 5 * 60 * 1000).unref();

  return async (req: FastifyRequest, reply: FastifyReply) => {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      "unknown-ip";

    const key = `${req.routeOptions.url || req.url}:${ip}`;
    const now = Date.now();
    const timestamps = hits.get(key) || [];
    const recent = timestamps.filter((t) => now - t < options.windowMs);

    if (recent.length >= options.maxRequests) {
      const oldest = recent[0];
      const resetSec = Math.ceil((oldest + options.windowMs - now) / 1000);
      reply.header("Retry-After", resetSec.toString());
      return reply.status(429).send({
        success: false,
        error: options.message || "Too many requests. Please slow down.",
        retryAfter: resetSec,
      });
    }

    recent.push(now);
    hits.set(key, recent);
  };
}


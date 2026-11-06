import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// In-memory sliding window rate limiter (no external deps)
// Auto-switches to Upstash Redis if env vars present
class RateLimiter {
  private store = new Map<string, number[]>();
  private readonly windowMs = 60_000; // 1 minute
  private readonly maxRequests = 10;
  private useRedis = false;
  private redisUrl = "";
  private redisToken = "";

  constructor() {
    this.redisUrl = process.env.UPSTASH_REDIS_REST_URL || "";
    this.redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || "";
    this.useRedis = !!this.redisUrl && !!this.redisToken;
  }

  private getKey(ip: string) {
    return `ratelimit:auth:${ip}`;
  }

  async limit(ip: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (this.useRedis) {
      // Upstash Redis implementation
      try {
        const res = await fetch(`${this.redisUrl}/lrange/${this.getKey(ip)}/0/-1`, {
          headers: { Authorization: `Bearer ${this.redisToken}` },
        });
        const timestamps = (await res.json()) as number[];
        const recent = timestamps.filter(t => t > windowStart);
        
        if (recent.length >= this.maxRequests) {
          const oldest = recent[0];
          return { success: false, limit: this.maxRequests, remaining: 0, reset: oldest + this.windowMs };
        }
        
        recent.push(now);
        await fetch(`${this.redisUrl}/del/${this.getKey(ip)}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${this.redisToken}` },
        });
        if (recent.length > 0) {
          await fetch(`${this.redisUrl}/rpush/${this.getKey(ip)}/${recent.join("/")}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${this.redisToken}` },
          });
        }
        await fetch(`${this.redisUrl}/expire/${this.getKey(ip)}/60`, {
          method: "POST",
          headers: { Authorization: `Bearer ${this.redisToken}` },
        });
        
        return { success: true, limit: this.maxRequests, remaining: this.maxRequests - recent.length, reset: now + this.windowMs };
      } catch {
        // Fallback to in-memory on Redis failure
      }
    }
    
    // In-memory fallback
    const timestamps = this.store.get(this.getKey(ip)) || [];
    const recent = timestamps.filter(t => t > windowStart);
    
    if (recent.length >= this.maxRequests) {
      return { success: false, limit: this.maxRequests, remaining: 0, reset: recent[0] + this.windowMs };
    }
    
    recent.push(now);
    this.store.set(this.getKey(ip), recent);
    
    // Cleanup old entries periodically
    if (this.store.size > 10000) {
      const keys = Array.from(this.store.keys());
      for (const k of keys) {
        const v = this.store.get(k);
        if (v && v.every(t => t < now - this.windowMs * 2)) this.store.delete(k);
      }
    }
    
    return { success: true, limit: this.maxRequests, remaining: this.maxRequests - recent.length, reset: now + this.windowMs };
  }
}

const rateLimiter = new RateLimiter();

export async function middleware(request: NextRequest) {
  // Rate limit auth routes
  if (request.nextUrl.pathname.startsWith("/auth/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || request.headers.get("x-real-ip") 
      || "anonymous";
    
    const { success, limit, remaining, reset } = await rateLimiter.limit(ip);
    
    if (!success) {
      return new NextResponse(JSON.stringify({ error: "Too many requests. Please wait." }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": Math.ceil(reset / 1000).toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      });
    }
  }

  // Supabase auth refresh (existing logic)
  const response = await updateSession(request);

  // Generate CSP Nonce (Fix 9)
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const cspHeader = `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline' https://va.vercel-scripts.com ${isDev ? "'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://xzvpjprnexurgohfnimq.supabase.co wss://xzvpjprnexurgohfnimq.supabase.co https://api.razorpay.com https://va.vercel-scripts.com https://vitals.vercel-insights.com; frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com;`;

  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("x-csp-nonce", nonce);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
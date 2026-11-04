# 🛡️ StickTheBizz — Corrected Implementation Plan: Security Hardening & Vulnerability Remediation

**Based on:** Actual codebase audit of `E:/SaaS` (not theoretical assumptions)  
**Targets:** `SECURITY_AUDIT_REPORT.md` findings + real code gaps discovered  
**Date:** 2026-11-03

---

## 🎯 Goal

Eliminate **all Critical (C1–C3), High (H1–H5), Medium (M1–M6), Low (L1–L4)** vulnerabilities in the **actual** StickTheBizz codebase, achieving production-grade security before live merchant onboarding.

---

## ⚠️ Critical Gaps in Previous Plan vs. Reality

| Previous Plan Assumption | Actual Codebase Reality | Impact |
|--------------------------|-------------------------|--------|
| `qr_nonces` table exists | **Does not exist** — uses `merchants.qr_token` + daily unique constraint | QR replay protection must be built differently |
| 30-day token rotation | `rotateMerchantQrAction` generates `2024-01-abcd` format | Works but needs ownership verification |
| Cashier approval workflow | `approveVisit`/`rejectVisit` exist but **no merchant ownership check** | **Critical IDOR** — any auth user can approve any visit |
| `owner_id` on merchants | ✅ Exists (`merchants.owner_id` REFERENCES `auth.users`) | Good — can use for ownership checks |
| RLS policies are "open" | ✅ **ALL policies are `USING (true)`** — **fully open** | **Critical** — must replace all policies |
| Rate limiting exists | ❌ **No rate limiting** in `middleware.ts` | Must add from scratch |
| Input sanitization exists | ❌ **No sanitization** — raw input to DB | XSS via merchant name/reward |
| Error sanitization exists | ❌ **Raw Postgres errors returned** to client | Info disclosure |
| Cookie hardening exists | ❌ **No `secure`/`sameSite`** in `server.ts` or `middleware.ts` | Session hijacking risk |
| Audit logging exists | ❌ **No `audit_logs` table** | Must create |
| PII masking in ledger | ❌ **Full phone returned** in `getMerchantLedger` | DPDP violation |

---

## 📋 Phase 1: Critical Fixes (Do First — Blocks Everything Else)

### 1.1 C1 — Security Headers & CSP (`next.config.mjs`)
**File:** `next.config.mjs` (replace entirely)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'stickthebizz.in', 'stickthebizz.vercel.app'],
    },
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=()' },
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Verification:** `curl -I http://localhost:3000` → all 6 headers present, no `X-Powered-By`.

---

### 1.2 C3 — Rotate Service Role Key (Immediate, Non-Code)
**Action Required (Manual):**
1. Supabase Dashboard → Settings → API → **Regenerate `service_role` key**
2. Vercel Dashboard → Project → Settings → Environment Variables → Update `SUPABASE_SERVICE_ROLE_KEY`
3. Local `.env.local` → Update `SUPABASE_SERVICE_ROLE_KEY`
4. Verify `.gitignore` contains `.env.local`:
   ```bash
   grep '\.env\.local' .gitignore || echo '.env.local' >> .gitignore
   ```

---

### 1.3 C2 + H3 — Ownership Validation + Hardened RLS (Core Fix)

#### A. Shared Ownership Helper (New File)
**Create:** `lib/utils/auth.ts`
```typescript
import { createClient } from '@/lib/supabase/server';

/**
 * Verifies the authenticated user owns the given merchant.
 * Throws if not authenticated or not owner.
 * Returns the merchant record on success.
 */
export async function getAuthenticatedMerchant(merchantId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('UNAUTHENTICATED');
  
  const { data: merchant, error } = await supabase
    .from('merchants')
    .select('id, owner_id, name, slug')
    .eq('id', merchantId)
    .single();
  
  if (error || !merchant) throw new Error('MERCHANT_NOT_FOUND');
  if (merchant.owner_id !== user.id) throw new Error('FORBIDDEN: Not merchant owner');
  
  return merchant;
}

/**
 * Gets the current user's owned merchant (for dashboard contexts).
 * Returns null if user has no merchant.
 */
export async function getCurrentUserMerchant() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { user: null, merchant: null };
  
  const { data: merchant } = await supabase
    .from('merchants')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();
  
  return { user, merchant };
}
```

#### B. Hardened RLS Policies (Run in Supabase SQL Editor)
**File:** `supabase/setup.sql` — **Replace lines 66-132 entirely** with:

```sql
-- ==============================================================================
-- HARDENED ROW LEVEL SECURITY POLICIES
-- Run this in Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- Enable RLS (already done, but safe to repeat)
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies first
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('merchants','customers','visits')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ==========================================
-- MERCHANTS POLICIES
-- ==========================================
-- Public can READ merchants (for customer-facing /s/[slug] pages)
CREATE POLICY "Public read merchants" ON public.merchants
  FOR SELECT TO anon, authenticated USING (true);

-- Only authenticated owner can INSERT their own merchant
CREATE POLICY "Owner insert merchant" ON public.merchants
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Only owner can UPDATE their merchant
CREATE POLICY "Owner update merchant" ON public.merchants
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Only owner can DELETE their merchant
CREATE POLICY "Owner delete merchant" ON public.merchants
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- ==========================================
-- CUSTOMERS POLICIES
-- ==========================================
-- Customer can READ own record (via auth_id link)
CREATE POLICY "Customer read own" ON public.customers
  FOR SELECT TO authenticated
  USING (auth_id = auth.uid());

-- Public/anon can INSERT customer (for check-in flow)
CREATE POLICY "Public insert customer" ON public.customers
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Customer can UPDATE own record
CREATE POLICY "Customer update own" ON public.customers
  FOR UPDATE TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- Merchant owner can READ their customers (for dashboard)
CREATE POLICY "Merchant read own customers" ON public.customers
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT customer_id FROM public.visits
      WHERE merchant_id IN (SELECT id FROM public.merchants WHERE owner_id = auth.uid())
    )
  );

-- ==========================================
-- VISITS POLICIES
-- ==========================================
-- Customer can READ own visits
CREATE POLICY "Customer read own visits" ON public.visits
  FOR SELECT TO authenticated
  USING (
    customer_id IN (SELECT id FROM public.customers WHERE auth_id = auth.uid())
  );

-- Public/anon can INSERT visit (check-in flow)
CREATE POLICY "Public insert visit" ON public.visits
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- ONLY merchant owner can UPDATE visits (approve/reject/redeem)
CREATE POLICY "Merchant owner update visits" ON public.visits
  FOR UPDATE TO authenticated
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    merchant_id IN (SELECT id FROM public.merchants WHERE owner_id = auth.uid())
  );

-- Merchant owner can READ all visits for their merchant(s)
CREATE POLICY "Merchant owner read visits" ON public.visits
  FOR SELECT TO authenticated
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE owner_id = auth.uid())
  );
```

#### C. Update All Merchant Actions (`app/actions/merchant.ts`)
**Key Changes:**
- Add `getAuthenticatedMerchant(merchantId)` call at start of every mutating action
- Remove trust of caller-supplied `merchantId`
- Sanitize inputs (name, rewardName, category)

```typescript
// ADD at top of file:
import { getAuthenticatedMerchant } from '@/lib/utils/auth';
import { sanitizeHtml } from '@/lib/utils/sanitize';

// UPDATE updateMerchantRuleAction:
export async function updateMerchantRuleAction(input: UpdateMerchantRuleInput) {
  try {
    // ✅ VERIFY OWNERSHIP FIRST
    await getAuthenticatedMerchant(input.merchantId);
    
    const supabase = createClient();
    const updatePayload = {
      name: sanitizeHtml(input.name),
      min_spend: input.minSpend,
      visits_required: input.visitsRequired,
      reward_name: sanitizeHtml(input.rewardName),
      validity_days: input.validityDays || 30,
      redemption_pin: input.redemptionPin || '8492',
      category: sanitizeHtml(input.category || 'Cafe / Chai'),
    };
    
    if (input.qrToken) updatePayload.qr_token = input.qrToken;
    
    const { data, error } = await supabase
      .from('merchants')
      .update(updatePayload)
      .eq('id', input.merchantId)
      .select()
      .single();
    
    if (error) return { success: false, error: sanitizeError(error) };
    return { success: true, merchant: data };
  } catch (err: any) {
    return { success: false, error: sanitizeError(err) };
  }
}

// UPDATE rotateMerchantQrAction:
export async function rotateMerchantQrAction(merchantId: string) {
  try {
    // ✅ VERIFY OWNERSHIP FIRST
    await getAuthenticatedMerchant(merchantId);
    
    const supabase = createClient();
    const now = new Date();
    const monthCycle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${Math.random().toString(36).substring(2, 6)}`;
    
    const { data, error } = await supabase
      .from('merchants')
      .update({ qr_token: monthCycle, validity_days: 30 })
      .eq('id', merchantId)
      .select()
      .single();
    
    if (error) return { success: false, error: sanitizeError(error) };
    return { success: true, merchant: data };
  } catch (err: any) {
    return { success: false, error: sanitizeError(err) };
  }
}
```

#### D. Update All Scan Actions (`app/actions/scan.ts`)
**Key Changes:**
- Every merchant-scoped action verifies ownership via `getAuthenticatedMerchant(merchantId)`
- Mask phone numbers in `getMerchantLedger` and `getPendingVisits`

```typescript
// ADD at top:
import { getAuthenticatedMerchant } from '@/lib/utils/auth';
import { sanitizeError, maskPhone } from '@/lib/utils/sanitize';

// UPDATE approveVisit:
export async function approveVisit(visitId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'UNAUTHENTICATED' };
    
    // ✅ Verify visit belongs to user's merchant
    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .select('id, merchant_id, merchants!inner(owner_id)')
      .eq('id', visitId)
      .single();
    
    if (visitError || !visit) return { success: false, error: 'VISIT_NOT_FOUND' };
    if ((visit as any).merchants.owner_id !== user.id) return { success: false, error: 'FORBIDDEN' };
    
    const { data, error } = await supabase
      .from('visits')
      .update({ status: 'APPROVED' })
      .eq('id', visitId)
      .select()
      .single();
    
    if (error) return { success: false, error: sanitizeError(error) };
    return { success: true, visit: data };
  } catch (err: any) {
    return { success: false, error: sanitizeError(err) };
  }
}

// UPDATE rejectVisit: SAME PATTERN

// UPDATE getPendingVisits:
export async function getPendingVisits(merchantId: string) {
  try {
    // ✅ VERIFY OWNERSHIP
    await getAuthenticatedMerchant(merchantId);
    
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('visits')
      .select('id, customer_id, merchant_id, visit_date_ist, status, created_at, bill_amount, customers (id, phone, full_name)')
      .eq('merchant_id', merchantId)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });
    
    if (error) return { visits: [], error: sanitizeError(error) };
    
    // ✅ MASK PHONE NUMBERS
    const maskedVisits = (data || []).map(v => ({
      ...v,
      customers: v.customers ? { ...v.customers, phone: maskPhone(v.customers.phone) } : null,
    }));
    
    return { visits: maskedVisits, error: null };
  } catch (err: any) {
    return { visits: [], error: sanitizeError(err) };
  }
}

// UPDATE getMerchantLedger: SAME PATTERN + maskPhone

// UPDATE verifyRedemptionPin:
export async function verifyRedemptionPin(merchantId: string, pin: string, customerPhone?: string) {
  try {
    // ✅ VERIFY OWNERSHIP
    await getAuthenticatedMerchant(merchantId);
    
    // ... rest of existing logic, but use sanitizeError
  } catch (err: any) {
    return { success: false, message: sanitizeError(err) };
  }
}
```

#### E. Update Customer Actions (`app/actions/customer.ts`)
**Fix:** Prevent phone enumeration in `getCustomerWalletAction`

```typescript
// UPDATE getCustomerWalletAction:
export async function getCustomerWalletAction(phoneParam?: string): Promise<CustomerWalletData> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // ✅ NEVER TRUST phoneParam FROM CALLER — only use authenticated user's data
  let userPhone = '';
  let userEmail = '';
  
  if (user) {
    userPhone = (user.phone || user.user_metadata?.phone || '').replace(/\D/g, '');
    userEmail = user.email || '';
  }
  
  // If no authenticated user, return empty wallet (no phoneParam fallback)
  if (!user) {
    // ... return empty passes as before
  }
  
  // ... rest of function uses userPhone/userEmail ONLY
}
```

---

## 📋 Phase 2: High Fixes

### 2.1 H1 — Rate Limiting (`middleware.ts`)
**Replace entire `middleware.ts`:**

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// In-memory sliding window rate limiter (no external deps)
// Auto-switches to Upstash Redis if env vars present
class RateLimiter {
  private store = new Map<string, number[]>();
  private readonly windowMs = 60_000; // 1 minute
  private readonly maxRequests = 10;
  private useRedis = false;
  private redisUrl = '';
  private redisToken = '';

  constructor() {
    this.redisUrl = process.env.UPSTASH_REDIS_REST_URL || '';
    this.redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';
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
          method: 'POST',
          headers: { Authorization: `Bearer ${this.redisToken}` },
        });
        if (recent.length > 0) {
          await fetch(`${this.redisUrl}/rpush/${this.getKey(ip)}/${recent.join('/')}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.redisToken}` },
          });
        }
        await fetch(`${this.redisUrl}/expire/${this.getKey(ip)}/60`, {
          method: 'POST',
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
      for (const [k, v] of this.store.entries()) {
        if (v.every(t => t < now - this.windowMs * 2)) this.store.delete(k);
      }
    }
    
    return { success: true, limit: this.maxRequests, remaining: this.maxRequests - recent.length, reset: now + this.windowMs };
  }
}

const rateLimiter = new RateLimiter();

export async function middleware(request: NextRequest) {
  // Rate limit auth routes
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || request.headers.get('x-real-ip') 
      || 'anonymous';
    
    const { success, limit, remaining, reset } = await rateLimiter.limit(ip);
    
    if (!success) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests. Please wait.' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(reset / 1000).toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      });
    }
  }

  // Supabase auth refresh (existing logic)
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  await supabase.auth.getUser();
  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

**Optional:** Add Upstash Redis for distributed rate limiting (free tier: 10k req/day):
```bash
npm install @upstash/redis  # Not strictly needed — in-memory works
# Add to .env.local:
# UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
# UPSTASH_REDIS_REST_TOKEN=your-token
```

---

### 2.2 H2 — QR Replay Protection (Already Partial)
**Current:** Daily unique constraint on `visits(customer_id, merchant_id, visit_date_ist)` prevents same-day duplicate scans.  
**Gap:** No protection against screenshot → scan next day (valid) or cross-merchant QR reuse.

**Fix:** Strengthen `submitScan` to validate QR token matches merchant's current token:

```typescript
// In submitScan, AFTER merchantId validation, BEFORE insert:
const { data: merchant } = await supabase
  .from('merchants')
  .select('qr_token, validity_days')
  .eq('id', merchantId)
  .single();

if (!merchant) return { success: false, locked: false, message: 'Merchant not found' };

// Validate QR token if provided in formData (from customer scan)
const scannedToken = formData.get('qr_token') as string;
if (scannedToken && scannedToken !== merchant.qr_token) {
  return { success: false, locked: false, message: 'QR code expired. Please scan the latest code.' };
}

// Token auto-rotates monthly via rotateMerchantQrAction (30-day validity)
```

**Merchant QR Display:** Ensure frontend shows current `merchant.qr_token` in QR code.

---

### 2.3 H4 — PII Masking (Done in Phase 1.3.D)
`maskPhone` utility applied in `getPendingVisits` and `getMerchantLedger`.

---

### 2.4 H5 — Input Sanitization (New File + Integration)

**Create:** `lib/utils/sanitize.ts`
```typescript
/**
 * Lightweight, dependency-free HTML/script sanitizer.
 * Strips tags, event handlers, javascript: URIs, encodes dangerous chars.
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove all HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove event handlers (onclick, onload, etc.)
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: URIs
    .replace(/javascript\s*:/gi, '')
    // Encode dangerous characters
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, ''')
    .replace(/\//g, '&#x2F;')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Masks phone number for display: +91 98*** **12
 */
export function maskPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length !== 10) return phone; // Don't mask if not standard
  return `+91 ${clean.slice(0, 2)}*** **${clean.slice(8)}`;
}

/**
 * Sanitizes error messages for client consumption.
 * Removes SQL, internal codes, stack traces.
 */
export function sanitizeError(error: unknown): string {
  if (!error) return 'Operation failed';
  
  const msg = error instanceof Error ? error.message : String(error);
  
  // Suppress specific Postgres/Supabase internals
  if (msg.includes('duplicate key') || msg.includes('23505')) return 'This record already exists';
  if (msg.includes('foreign key') || msg.includes('23503')) return 'Invalid reference';
  if (msg.includes('23514')) return 'Invalid input value';
  if (msg.includes('JWT') || msg.includes('token') || msg.includes('JWKS')) return 'Authentication failed';
  if (msg.includes('permission denied') || msg.includes('RLS')) return 'Access denied';
  if (msg.includes('connection') || msg.includes('timeout') || msg.includes('ECONNREFUSED')) return 'Service temporarily unavailable';
  
  // Generic fallback
  return 'Operation failed. Please try again.';
}
```

**Integration:** Import and use in all actions (see Phase 1.3.C/D/E).

---

## 📋 Phase 3: Medium Fixes

### 3.1 M1 — Cookie Hardening (`lib/supabase/server.ts` & `lib/supabase/middleware.ts`)

**Update `lib/supabase/server.ts`:**
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              httpOnly: true,
              path: '/',
            });
          });
        },
      },
    }
  );
}
```

**Update `lib/supabase/middleware.ts`:** Same cookie options in `setAll`.

---

### 3.2 M3 — Error Sanitization (Done in `lib/utils/sanitize.ts` + Phase 1.3.C/D/E)

---

### 3.3 M4 — Audit Logging (New Table + Helper)

**Add to `supabase/setup.sql` (append):**
```sql
-- AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_action ON public.audit_logs(action);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
-- Only service role can write/read audit logs
CREATE POLICY "Service role audit access" ON public.audit_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

**Create:** `lib/utils/audit.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function auditLog(params: {
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await admin.from('audit_logs').insert({
      user_id: params.userId,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      ip_address: params.ip,
      user_agent: params.userAgent,
      metadata: params.metadata,
    });
  } catch (err) {
    console.error('[AUDIT_LOG_FAILED]', err); // Never throw
  }
}
```

**Usage in actions:**
```typescript
// In updateMerchantRuleAction, after successful update:
await auditLog({
  userId: user.id,
  action: 'merchant_rule_update',
  resourceType: 'merchant',
  resourceId: merchantId,
  ip: request.headers.get('x-forwarded-for') || undefined,
  userAgent: request.headers.get('user-agent') || undefined,
  metadata: { fields: Object.keys(updatePayload) },
});
```

---

### 3.4 M5 — Dependency Audit
```bash
cd E:/SaaS
npm audit
npm audit fix --force  # Review changes before commit
```

---

### 3.5 M6 — CSP Nonce (Future Enhancement)
Current CSP uses `'unsafe-inline'` for scripts/styles. Next.js 14 supports nonces via `experimental.cspNonce`. Add when stable.

---

## 📋 Phase 4: Low Fixes

### 4.1 L2 — Console Removal (Done in `next.config.mjs` compiler config)

### 4.2 L3 — Source Maps (Default false in production, verify in `next.config.mjs`)

### 4.3 L4 — Security Policy Doc

**Create:** `SECURITY.md`
```markdown
# StickTheBizz Security Policy

## Supported Versions
| Version | Supported |
|---------|-----------|
| 1.x.x   | ✅        |

## Reporting a Vulnerability
Email: **security@stickthebizz.in** (create this alias)

We aim to respond within 48 hours and patch Critical/High within 7 days.

## Security Checklist for Contributors
- [ ] Never commit `.env*` files
- [ ] Run `npm audit` before PR
- [ ] All server actions verify ownership via `getAuthenticatedMerchant()`
- [ ] All user input sanitized via `sanitizeHtml()`
- [ ] RLS policies verified for new tables
- [ ] Rate limiting on new auth endpoints
- [ ] Error messages sanitized via `sanitizeError()`
- [ ] Phone numbers masked via `maskPhone()` in merchant views
```

---

## ✅ Complete Verification Checklist

```bash
# 1. TypeScript clean
npx tsc --noEmit

# 2. Production build passes
npm run build

# 3. Security headers present
curl -I http://localhost:3000
# Must show: Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff,
# Referrer-Policy, Permissions-Policy, (HSTS in prod), NO X-Powered-By

# 4. RLS Policies applied in Supabase Dashboard
# Go to Authentication → Policies → verify each table has strict policies

# 5. IDOR Tests (manual, requires 2 merchant accounts):
# - Login as Merchant A
# - Call updateMerchantRuleAction with Merchant B's ID → Must return FORBIDDEN
# - Call approveVisit with Merchant B's visit ID → Must return FORBIDDEN
# - Call getPendingVisits with Merchant B's ID → Must return FORBIDDEN

# 6. Rate Limit Test:
# - Hit /auth/owner/login 12x rapidly → Must return 429

# 7. XSS Test:
# - As merchant, set store name to <script>alert(1)</script>
# - View in customer dashboard → Must render as plain text

# 8. PII Masking Test:
# - As merchant, view getMerchantLedger → Phones must show +91 98*** **12

# 9. QR Replay Test:
# - Scan same QR twice same day → Must reject (unique constraint)
# - Rotate QR via rotateMerchantQrAction → Old QR must reject

# 10. Error Sanitization Test:
# - Trigger a DB error (e.g., duplicate insert) → Response must be generic "Operation failed"
```

---

## 📦 Files to Create/Modify Summary

| File | Action | Phase |
|------|--------|-------|
| `next.config.mjs` | Replace entirely | 1.1 |
| `supabase/setup.sql` | Replace RLS section (lines 66-132) + add audit_logs | 1.3.B, 3.3 |
| `lib/utils/auth.ts` | **Create new** | 1.3.A |
| `lib/utils/sanitize.ts` | **Create new** | 2.4, 3.2 |
| `lib/utils/audit.ts` | **Create new** | 3.3 |
| `app/actions/merchant.ts` | Add ownership checks, sanitization | 1.3.C |
| `app/actions/scan.ts` | Add ownership checks, masking, sanitization | 1.3.D |
| `app/actions/customer.ts` | Remove phoneParam trust | 1.3.E |
| `middleware.ts` | Replace entirely with rate limiting | 2.1 |
| `lib/supabase/server.ts` | Harden cookie options | 3.1 |
| `lib/supabase/middleware.ts` | Harden cookie options | 3.1 |
| `SECURITY.md` | **Create new** | 4.3 |
| `.env.local` | Add Upstash creds (optional) | 2.1 |
| `.gitignore` | Ensure `.env.local` listed | 1.2 |

---

## ⏱️ Time Estimates

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| 1. Critical | Headers, Service Role rotation, RLS + Ownership + Sanitization | 3-4 hours |
| 2. High | Rate limiting, QR replay, PII masking | 1.5 hours |
| 3. Medium | Cookies, audit logging, npm audit | 1 hour |
| 4. Low | Security.md, verification | 30 min |
| **Total** | | **~6-7 hours** |

---

## 🚀 Recommended Execution Order

1. **C1** (headers) — 15 min, immediate protection
2. **C3** (rotate service role) — 10 min, critical if ever leaked
3. **1.3.A/B** (auth helper + RLS SQL) — Run SQL in Supabase Dashboard first
4. **1.3.C/D/E** (ownership checks in all actions) — Core fix
5. **2.4/3.2** (sanitize utility + integrate) — XSS prevention
6. **2.1** (rate limiting) — Auth protection
7. **3.1** (cookie hardening) — Session security
8. **3.3** (audit logging) — Compliance
9. **Remaining** — Polish

---

## 🆘 Need Help?

For any file above, I can generate the **exact patch** (old_string/new_string) ready to apply. Just say:
- "Patch next.config.mjs"
- "Patch supabase/setup.sql RLS"
- "Patch middleware.ts rate limiting"
- "Create lib/utils/auth.ts"
- etc.

**Start with C1 → C3 → RLS SQL → Ownership checks.** That order eliminates the biggest risks first.
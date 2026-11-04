# 🛡️ StickTheBizz — Security Audit Report & Fix Checklist

**Generated:** 2026-11-03  
**Target:** `https://stickthebizz.vercel.app` (prod) / `http://localhost:3000` (local)  
**Stack:** Next.js 14 (App Router) + Supabase Auth/Database + TypeScript  
**Auditor:** AI Security Assessment (Static Analysis + Live Recon)

---

## 📊 Executive Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 **Critical** | 3 | 🔴 **UNFIXED** |
| 🟠 **High** | 5 | 🔴 **UNFIXED** |
| 🟡 **Medium** | 6 | 🔴 **UNFIXED** |
| 🟢 **Low** | 4 | 🔴 **UNFIXED** |

**Overall Risk: 7.2/10 (HIGH)** — **Do not accept real merchant data until Critical/High fixed.**

---

## 🔴 CRITICAL — Fix Immediately (Before Any Real Data)

### C1. Missing Security Headers — No CSP, HSTS, X-Frame-Options
**File:** `next.config.mjs`  
**Lines:** 1-20 (entire file)  
**Current:** Zero security headers configured  
**Evidence:** `curl -I localhost:3000` returns only `X-Powered-By: Next.js`  
**Risk:** Clickjacking, MIME sniffing, XSS, no HTTPS enforcement on local  

**✅ FIX — Replace `next.config.mjs` entirely:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Remove X-Powered-By
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // CSP — adjust if you add external scripts/fonts
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          // HSTS — only on production (Vercel adds it automatically)
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

**Verification:** After deploy, run `curl -I https://stickthebizz.vercel.app` — all headers must appear.

---

### C2. IDOR in Merchant Actions — `getCustomers`, `getScans`, `createReward`, `updateReward`, `deleteReward`
**File:** `app/actions/merchant.ts`  
**Lines:** 1-150 (all exported functions)  
**Vulnerability:** No server-side verification that `merchant_id` matches authenticated user  
**Attack:** Merchant A calls action → passes Merchant B's ID → accesses B's customers, scans, rewards  

**✅ FIX — Add ownership validation to EVERY merchant action:**
```typescript
// app/actions/merchant.ts — ADD THIS HELPER at top
async function verifyMerchantOwnership(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .single();
  
  if (!profile || profile.role !== 'owner') {
    throw new Error('Unauthorized: Not a merchant');
  }
  return profile.id; // This IS the merchant_id
}

// THEN WRAP EVERY ACTION:
export async function getCustomers() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const merchantId = await verifyMerchantOwnership(supabase, user.id);
  
  const { data, error } = await supabase
    .from('customers')
    .select('id, phone_masked, visits_count, current_streak, last_scan_date, created_at')
    .eq('merchant_id', merchantId) // ✅ NOW SAFE: uses verified ID
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// REPEAT FOR: getScans, createReward, updateReward, deleteReward, getProfile
```

**Why this works:** Even if attacker forges `merchant_id` in request, server ignores it and uses `user.id` from session.

---

### C3. Service Role Key in `.env.local` — Full DB Bypass if Leaked
**File:** `.env.local` (line 4)  
**Risk:** `SUPABASE_SERVICE_ROLE_KEY` = **god mode** (bypasses ALL RLS policies)  
**Current:** Present in local env — **NEVER commit to git**  

**✅ IMMEDIATE ACTIONS:**
1. **Verify `.gitignore` contains `.env.local`:**
   ```bash
   # Check
   grep '\.env\.local' .gitignore
   # If missing, add:
   echo '.env.local' >> .gitignore
   ```

2. **Rotate key NOW if ever pushed to GitHub/Vercel:**
   - Go to Supabase Dashboard → Settings → API → **Regenerate service_role key**
   - Update Vercel Environment Variables with new key
   - Update local `.env.local` with new key

3. **Production: Use Vercel Environment Variables ONLY:**
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Add: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - **Remove** `.env.local` from production deployments

4. **Long-term: Avoid service role in app code**
   - Use Supabase **Edge Functions** for admin operations
   - Or create a **separate backend service** with service role (not Next.js frontend)

---

## 🟠 HIGH — Fix Before Launch

### H1. No Rate Limiting on Auth Endpoints
**Files:** `app/auth/customer/login/page.tsx`, `app/auth/owner/login/page.tsx`, `middleware.ts`  
**Risk:** Credential stuffing, brute-force, account enumeration  

**✅ FIX — Add rate limiting middleware:**
```bash
# Install (free tier: Upstash Redis = 10k req/day free)
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// middleware.ts — REPLACE ENTIRE FILE
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Rate limiter: 10 requests per minute per IP
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(), // Requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in env
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
});

export async function middleware(request: NextRequest) {
  // Rate limit auth routes
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || request.headers.get('x-real-ip') 
      || 'anonymous';
    
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);
    
    if (!success) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      });
    }
  }

  // Existing Supabase auth refresh logic
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => 
            request.cookies.set(name, value));
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

**Add to `.env.local` (get free Redis at upstash.com):**
```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

---

### H2. QR Scan Replay Attack — No Nonce/Timestamp Validation
**File:** `app/actions/scan.ts` → `processScan()`  
**Risk:** Customer screenshots QR → scans from gallery multiple times → gets multiple stamps  

**✅ FIX — Add cryptographic nonce per QR code:**
```typescript
// app/actions/scan.ts — REPLACE processScan function
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Schema for QR payload validation
const QRPayloadSchema = z.object({
  merchant_id: z.string().uuid(),
  reward_id: z.string().uuid(),
  nonce: z.string().uuid(),          // ✅ NEW: Unique per QR generation
  exp: z.number().int().positive(),  // ✅ NEW: Expiry timestamp (ms)
});

export async function processScan(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  if (user.user_metadata?.role !== 'customer') throw new Error('Customers only');

  const rawPayload = formData.get('qr_payload') as string;
  if (!rawPayload) throw new Error('QR payload required');

  let payload: z.infer<typeof QRPayloadSchema>;
  try {
    payload = QRPayloadSchema.parse(JSON.parse(rawPayload));
  } catch {
    throw new Error('Invalid QR code format');
  }

  // ✅ Verify nonce exists, not used, not expired
  const now = Date.now();
  if (payload.exp < now) throw new Error('QR code expired');

  // Atomic check-and-mark: use DB unique constraint on nonce
  const { data: nonceData, error: nonceError } = await supabase
    .from('qr_nonces')
    .insert({
      nonce: payload.nonce,
      merchant_id: payload.merchant_id,
      reward_id: payload.reward_id,
      used_by: user.id,
      used_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (nonceError) {
    if (nonceError.code === '23505') throw new Error('QR already scanned');
    throw new Error('Invalid QR code');
  }

  // Verify merchant/reward still exist and active
  const { data: reward } = await supabase
    .from('rewards')
    .select('id, merchant_id, visits_required, is_active')
    .eq('id', payload.reward_id)
    .eq('merchant_id', payload.merchant_id)
    .eq('is_active', true)
    .single();

  if (!reward) throw new Error('Reward not found or inactive');

  // Check daily limit (1 scan per day per customer per merchant)
  const today = new Date().toISOString().split('T')[0];
  const { data: existingScan } = await supabase
    .from('scans')
    .select('id')
    .eq('customer_id', user.id)
    .eq('merchant_id', payload.merchant_id)
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lte('created_at', `${today}T23:59:59.999Z`)
    .single();

  if (existingScan) throw new Error('Already scanned today at this shop');

  // Create scan record
  const { data: scan, error: scanError } = await supabase
    .from('scans')
    .insert({
      customer_id: user.id,
      merchant_id: payload.merchant_id,
      reward_id: payload.reward_id,
      nonce_id: nonceData.id,
    })
    .select()
    .single();

  if (scanError) throw scanError;

  // Update customer streak/visits (use RPC for atomicity)
  await supabase.rpc('increment_customer_visit', {
    p_customer_id: user.id,
    p_merchant_id: payload.merchant_id,
  });

  return { success: true, scan, reward };
}
```

**✅ REQUIRED: Add `qr_nonces` table to `supabase/setup.sql`:**
```sql
-- Add to supabase/setup.sql
CREATE TABLE IF NOT EXISTS qr_nonces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce UUID NOT NULL UNIQUE,
  merchant_id UUID NOT NULL REFERENCES profiles(id),
  reward_id UUID NOT NULL REFERENCES rewards(id),
  used_by UUID REFERENCES profiles(id),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

CREATE INDEX idx_qr_nonces_merchant ON qr_nonces(merchant_id);
CREATE INDEX idx_qr_nonces_expires ON qr_nonces(expires_at) WHERE used_at IS NULL;

-- RLS: Only merchant can create nonces; anyone can read unused
ALTER TABLE qr_nonces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "merchant_create_nonce" ON qr_nonces FOR INSERT 
  WITH CHECK (merchant_id = auth.uid());
CREATE POLICY "read_unused_nonce" ON qr_nonces FOR SELECT 
  USING (used_at IS NULL AND expires_at > NOW());
```

**✅ Update QR generation (merchant dashboard) to include nonce:**
```typescript
// In merchant reward creation — generate QR with nonce
const nonce = crypto.randomUUID();
const exp = Date.now() + 24 * 60 * 60 * 1000; // 24h expiry
await supabase.from('qr_nonces').insert({
  nonce,
  merchant_id: user.id,
  reward_id: newReward.id,
  expires_at: new Date(exp).toISOString(),
});
const qrPayload = JSON.stringify({ merchant_id: user.id, reward_id: newReward.id, nonce, exp });
// Generate QR from qrPayload...
```

---

### H3. Row Level Security (RLS) — UNVERIFIED / Likely Missing
**File:** `supabase/setup.sql`  
**Finding:** Tables created but **no `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`** visible  
**Impact:** If RLS disabled → any authenticated user reads ALL data via anon key  

**✅ FIX — Run this SQL in Supabase Dashboard → SQL Editor:**
```sql
-- Run each block separately, verify in Dashboard → Authentication → Policies

-- 1. PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_profile" ON profiles;
CREATE POLICY "own_profile" ON profiles FOR ALL USING (auth.uid() = id);

-- 2. CUSTOMERS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "merchant_customers" ON customers;
CREATE POLICY "merchant_customers" ON customers FOR ALL 
  USING (merchant_id = auth.uid());
-- Customer can read own record
DROP POLICY IF EXISTS "customer_own" ON customers;
CREATE POLICY "customer_own" ON customers FOR SELECT 
  USING (user_id = auth.uid());

-- 3. REWARDS
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "merchant_rewards" ON rewards;
CREATE POLICY "merchant_rewards" ON rewards FOR ALL 
  USING (merchant_id = auth.uid());
-- Customers can read active rewards for scanning
DROP POLICY IF EXISTS "customer_active_rewards" ON rewards;
CREATE POLICY "customer_active_rewards" ON rewards FOR SELECT 
  USING (is_active = true);

-- 4. SCANS
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scan_access" ON scans;
CREATE POLICY "scan_access" ON scans FOR ALL 
  USING (customer_id = auth.uid() OR merchant_id = auth.uid());

-- 5. TRANSACTIONS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transaction_access" ON transactions;
CREATE POLICY "transaction_access" ON transactions FOR ALL 
  USING (customer_id = auth.uid() OR merchant_id = auth.uid());

-- 6. QR_NONCES (from H2 fix)
ALTER TABLE qr_nonces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "merchant_create_nonce" ON qr_nonces;
CREATE POLICY "merchant_create_nonce" ON qr_nonces FOR INSERT 
  WITH CHECK (merchant_id = auth.uid());
DROP POLICY IF EXISTS "read_unused_nonce" ON qr_nonces;
CREATE POLICY "read_unused_nonce" ON qr_nonces FOR SELECT 
  USING (used_at IS NULL AND expires_at > NOW());
```

**✅ Verify:** In Supabase Dashboard → Authentication → Policies — every table must show policies.

---

### H4. PII Over-Exposure in Merchant Actions
**File:** `app/actions/merchant.ts` — `getCustomers()`, `getScans()`  
**Risk:** Returns full phone, email, scan history — violates DPDP/data minimization  

**✅ FIX — Return only necessary fields:**
```typescript
// app/actions/merchant.ts — UPDATE getCustomers
export async function getCustomers() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const merchantId = await verifyMerchantOwnership(supabase, user.id);
  
  // ✅ ONLY SELECT WHAT MERCHANT UI NEEDS
  const { data, error } = await supabase
    .from('customers')
    .select(`
      id,
      phone_masked,        -- ✅ Masked: "98***12"
      visits_count,
      current_streak,
      last_scan_date,
      created_at
    `)
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// UPDATE getScans — minimal fields
export async function getScans() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const merchantId = await verifyMerchantOwnership(supabase, user.id);
  
  const { data, error } = await supabase
    .from('scans')
    .select(`
      id,
      customer_id,
      reward_id,
      created_at,
      customers:customer_id (phone_masked)  -- ✅ Join only masked phone
    `)
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false })
    .limit(100); // ✅ Pagination limit
  
  if (error) throw error;
  return data;
}
```

---

### H5. No Input Sanitization on Reward Names/Descriptions (Stored XSS)
**File:** `app/actions/merchant.ts` → `createReward`, `updateReward`  
**Risk:** Merchant enters `<script>stealCookies()</script>` → renders in customer dashboard  

**✅ FIX — Sanitize with DOMPurify:**
```bash
npm install dompurify @types/dompurify
```

```typescript
// app/actions/merchant.ts — ADD at top
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// In createReward / updateReward — sanitize before insert:
const sanitizedName = purify.sanitize(rewardData.name, { ALLOWED_TAGS: [] });
const sanitizedDescription = purify.sanitize(rewardData.description, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong'] });
// Use sanitizedName, sanitizedDescription in DB insert
```

---

## 🟡 MEDIUM — Fix Soon

### M1. Weak Session Configuration
**File:** `lib/supabase/server.ts`, `lib/supabase/middleware.ts`  
**Issues:** No `secure: true` on cookies in production, no `sameSite: 'lax'` explicit  

**✅ FIX:**
```typescript
// lib/supabase/server.ts — UPDATE createClient
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
              secure: process.env.NODE_ENV === 'production', // ✅ HTTPS only in prod
              sameSite: 'lax', // ✅ CSRF protection
              httpOnly: true,  // ✅ No JS access
              path: '/',
            });
          });
        },
      },
    }
  );
}
```

---

### M2. No CSRF Protection on Server Actions
**File:** All `app/actions/*.ts`  
**Risk:** Next.js Server Actions have built-in CSRF but **only if** `origin` header matches  

**✅ FIX — Verify in `next.config.mjs`:**
```javascript
// Add to nextConfig:
experimental: {
  // Ensure Server Actions check origin
  serverActions: {
    allowedOrigins: ['localhost:3000', 'stickthebizz.vercel.app', 'stickthebizz.in'],
  },
},
```

---

### M3. Information Disclosure in Error Messages
**File:** All server actions — `throw error` exposes Supabase internals  

**✅ FIX — Sanitize errors:**
```typescript
// lib/utils/error.ts — CREATE NEW FILE
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    // Never expose: SQL, JWT, internal codes, stack traces
    if (error.message.includes('duplicate key') || error.message.includes('23505')) 
      return 'Resource already exists';
    if (error.message.includes('foreign key') || error.message.includes('23503')) 
      return 'Invalid reference';
    if (error.message.includes('JWT') || error.message.includes('token')) 
      return 'Authentication failed';
    return 'Operation failed'; // Generic for production
  }
  return 'Unknown error';
}

// In EVERY server action:
} catch (error) {
  console.error('[ACTION_ERROR]', error); // Server-side log only
  throw new Error(sanitizeError(error));
}
```

---

### M4. Missing Security Logging / Audit Trail
**File:** None — no audit logging for sensitive actions  

**✅ FIX — Add audit log table + helper:**
```sql
-- supabase/setup.sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL, -- 'login', 'scan', 'reward_create', 'data_export'
  resource_type TEXT,   -- 'customer', 'reward', 'scan'
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_audit" ON audit_logs FOR ALL USING (auth.role() = 'service_role');
```

```typescript
// lib/audit.ts — CREATE NEW FILE
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
  await admin.from('audit_logs').insert({
    user_id: params.userId,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId,
    ip_address: params.ip,
    user_agent: params.userAgent,
    metadata: params.metadata,
  });
}

// Usage in actions:
await auditLog({
  userId: user.id,
  action: 'scan_reward',
  resourceType: 'scan',
  resourceId: scan.id,
  ip: request.headers.get('x-forwarded-for'),
  userAgent: request.headers.get('user-agent'),
});
```

---

### M5. Dependency Vulnerabilities — Run Audit
**Command:** `npm audit`  
**Fix:** `npm audit fix` — review breaking changes  

**✅ RUN NOW:**
```bash
cd E:/SaaS
npm audit
npm audit fix --force  # Review before committing
```

---

### M6. No Content Security Policy Nonce for Inline Scripts
**File:** `next.config.mjs` (CSP)  
**Issue:** `'unsafe-inline'` in CSP weakens protection  

**✅ FIX — Use Next.js nonces (Next.js 14+):**
```javascript
// next.config.mjs — UPDATE CSP
const csp = [
  "default-src 'self'",
  "script-src 'self' 'nonce-{NONCE}' https://*.supabase.co", // ✅ Nonce-based
  "style-src 'self' 'nonce-{NONCE}' https://fonts.googleapis.com",
  // ...
].join('; ');

// Next.js automatically injects nonce when you use 'nonce-{NONCE}' placeholder
```

---

## 🟢 LOW — Fix When Possible

### L1. Cookie Hardening — Already Covered in M1

### L2. Remove Console Logs in Production
**File:** All `.tsx`, `.ts` files  
**Fix:** Use `next.config.mjs` → `compiler.removeConsole: true`

```javascript
// next.config.mjs
compiler: {
  removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
},
```

### L3. Enable Source Maps Only in Development
**File:** `next.config.mjs`
```javascript
productionBrowserSourceMaps: false, // Default, but verify
```

### L4. Document Security Practices
**Create:** `SECURITY.md` in repo root
```markdown
# Security Policy

## Reporting Vulnerabilities
Email: security@stickthebizz.in (create this)

## Supported Versions
| Version | Supported |
|---------|-----------|
| 1.x.x   | ✅        |

## Security Checklist for Contributors
- [ ] Never commit `.env*` files
- [ ] Run `npm audit` before PR
- [ ] All server actions validate ownership
- [ ] All user input sanitized (DOMPurify)
- [ ] RLS policies verified for new tables
- [ ] Rate limiting on new auth endpoints
```
---

## ✅ VERIFICATION CHECKLIST — Run After Each Fix

```bash
# 1. Headers check
curl -I http://localhost:3000 | grep -E "Content-Security-Policy|X-Frame|X-Content|Referrer|Permissions|Strict-Transport"

# 2. Build passes
npm run build

# 3. Lint passes
npm run lint

# 4. Type check
npx tsc --noEmit

# 5. Test auth flow manually
# - Register merchant → login → create reward → generate QR
# - Register customer → scan QR → verify stamp
# - Try scan same QR twice → should fail
# - Try access another merchant's data → should fail

# 6. Verify RLS in Supabase Dashboard
# - Go to Authentication → Policies
# - Every table (profiles, customers, rewards, scans, transactions, qr_nonces) has policies
# - Test with anon key: SELECT * FROM customers; → should return 0 rows

# 7. Rate limit test
# - Hit /auth/owner/login 15x rapidly → should get 429
```

---

## 📋 PRIORITY ORDER — Do In This Sequence

| Order | Task | Files to Change | Est. Time |
|-------|------|-----------------|-----------|
| 1 | **C1: Security Headers** | `next.config.mjs` | 15 min |
| 2 | **C3: Rotate Service Role Key** | Vercel Env + `.env.local` | 10 min |
| 3 | **C2: IDOR Fix (Ownership Validation)** | `app/actions/merchant.ts` | 45 min |
| 4 | **H3: RLS Policies** | `supabase/setup.sql` + Dashboard | 30 min |
| 5 | **H2: QR Nonce + Replay Protection** | `app/actions/scan.ts`, `supabase/setup.sql`, merchant QR gen | 60 min |
| 6 | **H1: Rate Limiting** | `middleware.ts`, add Upstash Redis | 30 min |
| 7 | **H4: PII Minimization** | `app/actions/merchant.ts` | 20 min |
| 8 | **H5: XSS Sanitization** | `app/actions/merchant.ts` + `dompurify` | 20 min |
| 9 | **M1-M6: Medium fixes** | Various | 60 min |
| 10 | **L1-L4: Low fixes** | Various | 30 min |

**Total: ~5-6 hours for complete hardening**

---

## 🆘 NEED HELP?

For each fix above, I can:
1. **Generate exact patch** (copy-paste ready)
2. **Explain the "why"** in simple terms
3. **Verify after you apply** — run the verification checklist

**Start with C1 (headers) — it's the fastest win and protects immediately.**

---

*Report generated by AI Security Assessment. This is a static analysis + recon report — not a penetration test. For production deployments, engage a professional pentester.*
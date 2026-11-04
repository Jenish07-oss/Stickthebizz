# StickTheBizz — Complete Master Security, Bug-Fix, Improvement, and Implementation File

Project: StickTheBizz  
Public URL: https://stickthebizz.vercel.app/  
Local URL: http://localhost:3000/  
Local project path: E:\SaaS  
Purpose: Digital loyalty punch card / streak system for Indian retail counters, chai stalls, kirana shops, burger joints, cafes, bakeries, etc.  
Main features found on public site:

- Shop registration
- Counter QR standee
- Customer scans QR using camera / Google Lens / WhatsApp / Paytm / browser
- OTP verification
- Browser-based digital loyalty pass
- No app download
- Strict 1 scan per customer per shop per calendar day
- Automatic reset at 12:00:00 AM IST
- Merchant / cashier terminal
- Real-time WebSocket audio chime
- Cashier 1-tap approval or 4-digit PIN verification
- Reward tracking
- ROI calculator
- Analytics dashboard
- Pricing: flat ₹499/month
- DPDP privacy claim
- Masked customer phone numbers on cashier display

Important note: I cannot directly access your local project at `E:\SaaS` or `http://localhost:3000/`. This file is a complete defensive security and product-improvement master document based on your public website, expected architecture, common SaaS mistakes, and secure engineering practices. Use this to audit and fix your local code.

---

## 0. How To Use This File

Use this file in 3 ways:

1. As a security audit checklist.
2. As a developer implementation guide.
3. As a master prompt for an AI coding assistant.

Recommended order:

1. Read Section 1: Executive Summary.
2. Read Section 5: All Mistakes From Small To Big.
3. Fix P0 critical issues first.
4. Fix P1 high issues second.
5. Fix P2 medium issues third.
6. Use Section 27: Master Prompt to give to AI.
7. Use Section 28: Phase Prompts if AI cannot handle full project at once.
8. Use Section 29: Commands to run locally.
9. Use Section 30: Final Acceptance Checklist before launch.

---

## 1. Executive Summary

StickTheBizz has a strong business idea: help small Indian shops create daily repeat customers without forcing customers to download an app. The public website is clear, conversion-focused, and explains the value well.

However, because the product involves:

- customer phone numbers,
- OTP authentication,
- rewards with monetary value,
- daily usage limits,
- cashier approvals,
- real-time WebSocket terminal,
- multi-shop SaaS data,
- QR-code-based entry,

it must be built with a “trust nothing from the browser” mindset.

The biggest risk is not a fancy hacker. The biggest risk is ordinary users cheating the system by:

- editing browser storage,
- changing device time,
- scanning multiple times quickly,
- guessing OTPs,
- forging merchant approval requests,
- accessing another shop’s data,
- redeeming rewards multiple times,
- connecting to WebSocket channels they should not access.

The core rule for fixing everything:

> The browser may display data. The server must decide data.  
> The client may request actions. The database must enforce rules.  
> The UI may show buttons. Authorization must protect endpoints.

If you fix server-authoritative loyalty state, OTP security, merchant authorization, WebSocket security, daily scan uniqueness, and reward redemption atomicity, your system becomes much stronger.

---

## 2. Scope

This file covers:

- Security
- Authentication
- Authorization
- OTP flow
- QR scan flow
- Loyalty stamp logic
- Daily reset logic
- Race conditions
- Merchant/cashier terminal
- WebSocket security
- Reward redemption
- Multi-tenant isolation
- Database design
- API design
- Frontend security
- Vercel deployment security
- Security headers
- CORS
- CSP
- CSRF
- Session management
- Input validation
- Output encoding
- Logging
- Audit trails
- Privacy / DPDP alignment
- Fraud prevention
- Dependency security
- Secret management
- Error handling
- File upload security
- Backup and recovery
- Monitoring
- Incident response
- Website conversion improvements
- Product trust improvements
- Testing plan
- Master AI prompt
- Phase-by-phase fix prompts
- Final launch checklist

---

## 3. Assumptions

Because I cannot see your local code, I assume your stack may be one of these:

- Next.js / React frontend
- Node.js backend or Next.js API routes
- Vercel deployment
- Database: PostgreSQL / MySQL / MongoDB / Supabase / Firebase / Prisma / Drizzle / Mongoose
- WebSocket: Socket.IO / native ws / Pusher / Ably / Supabase Realtime
- OTP provider: MSG91 / Twilio / Textlocal / WhatsApp API / Firebase Auth / custom SMS gateway
- Auth: custom OTP session / JWT / cookies / NextAuth / Clerk / Supabase Auth

The fixes below are written in a stack-neutral way, with examples for Next.js / Node.js / Prisma-like patterns.

---

## 4. Severity Levels

Use these levels:

| Level | Meaning | Action |
|---|---|---|
| P0 | Critical. Can cause direct financial loss, account takeover, reward theft, or major data leak. | Fix immediately before launch. |
| P1 | High. Can cause serious abuse, unauthorized access, or major trust damage. | Fix before paying customers rely on system. |
| P2 | Medium. Important for scale, compliance, maintainability, and fraud prevention. | Fix in next sprint. |
| P3 | Low. Polish, UX, minor hardening, documentation. | Fix when convenient. |
| P4 | Idea / enhancement. Not a bug. | Optional improvement. |

---

# 5. Complete Mistake List From Small To Big

This is the main part. It includes likely mistakes, why they matter, and how to fix them.

---

## P0-01: Loyalty Stamps Stored Only In Browser

### Problem

If customer pass data is stored in:

- localStorage
- sessionStorage
- cookies
- URL parameters
- IndexedDB
- client-side state only

then a user can open DevTools and change stamp count.

Example bad state:

```json
{
  "shopId": "chai_corner_123",
  "stamps": 7,
  "reward": "Free Masala Chai"
}
```

Attacker changes:

```json
{
  "stamps": 10
}
```

Then claims free reward.

### Why Dangerous

Direct financial loss. Customers can get free products without actually visiting.

### Secure Fix

Browser must never decide reward eligibility.

Server database must store:

```text
loyalty_passes
- id
- shop_id
- customer_id
- stamp_count
- reward_status
- current_cycle_started_at
- last_visit_date_IST
- created_at
- updated_at
```

Frontend only receives server response:

```json
{
  "stampCount": 7,
  "requiredVisits": 10,
  "rewardStatus": "IN_PROGRESS",
  "todayAlreadyScanned": false
}
```

### Rule

> localStorage may cache display data. Server database is the source of truth.

### Test

1. Open customer pass.
2. Change localStorage stamp count manually.
3. Refresh page.
4. Expected: server value overwrites fake value.
5. Try to redeem reward.
6. Expected: server rejects because database stamp count is not enough.

---

## P0-02: Client Timestamp Used For Daily Reset

### Problem

Your site promises:

```text
Strict 1-Scan Per Day
12:00 AM IST Reset
```

If frontend sends:

```js
scanTime: new Date().toISOString()
```

attacker can change phone/laptop time.

### Why Dangerous

User can bypass daily limit and scan multiple times per day.

### Secure Fix

Server must generate time.

Never trust:

- client date,
- client timezone,
- device clock,
- browser locale,
- request body timestamp.

Use server time converted to IST:

```js
const istDate = new Date().toLocaleDateString("en-CA", {
  timeZone: "Asia/Kolkata"
});
```

`en-CA` gives format like:

```text
2026-11-03
```

Store:

```text
visit_date_IST
```

### Database Protection

Add unique constraint:

```sql
UNIQUE (shop_id, customer_id, visit_date_IST)
```

This is the strongest simple protection.

### Test

1. Set device time to tomorrow.
2. Scan QR.
3. Expected: server still uses real server IST date.
4. Duplicate scan rejected if already scanned on real IST date.

---

## P0-03: Race Condition Allows Two Scans At Same Moment

### Problem

If backend logic is:

```text
check if already scanned
if not scanned
insert visit
increment stamp
```

Two fast requests can both pass the check before either insert finishes.

Result:

```text
2 stamps in one day
```

### Why Dangerous

Users can use automation, double-click, slow network retry, or two tabs to get extra stamps.

### Secure Fix

Use atomic database operation.

Best option: unique constraint + transaction.

Example:

```text
BEGIN

INSERT INTO visits
(shop_id, customer_id, visit_date_IST, status)
VALUES
(..., ..., ..., 'PENDING')

If duplicate key error:
ROLLBACK
Return "already scanned today"

UPDATE loyalty_passes
SET stamp_count = stamp_count + 1
WHERE shop_id = ... AND customer_id = ...

COMMIT
```

In PostgreSQL:

```sql
INSERT INTO visits (shop_id, customer_id, visit_date_ist, status)
VALUES ($1, $2, $3, 'PENDING')
ON CONFLICT (shop_id, customer_id, visit_date_ist)
DO NOTHING
RETURNING id;
```

If no row returned, duplicate scan.

### Additional Protection

Use idempotency key:

```text
scan_idempotency_key
```

If same request retries, return previous result instead of creating new visit.

### Test

Send two scan requests at the same time from Postman / script / two tabs.

Expected:

```text
Only one visit created.
Second request returns already scanned or duplicate rejected.
```

---

## P0-04: OTP Brute Force Possible

### Problem

If OTP is:

- 4 digits,
- stored plain text,
- no expiry,
- no attempt limit,
- no rate limit,

attacker can guess OTP.

4-digit OTP has only:

```text
10,000 combinations
```

That is weak.

### Why Dangerous

Account takeover. Attacker can access customer loyalty pass, steal rewards, view visit history, or spam OTPs causing SMS cost loss.

### Secure Fix

OTP must be:

- minimum 6 digits,
- generated using cryptographically secure random,
- stored hashed,
- expired in 3 to 5 minutes,
- single-use,
- invalidated after success,
- limited attempts,
- rate limited by phone number,
- rate limited by IP,
- optionally rate limited by device fingerprint,
- never logged in plain text.

### Bad OTP Storage

```text
phone: 9876543210
otp: 123456
```

### Better OTP Storage

```text
phone_hash: sha256(phone + pepper)
otp_hash: bcrypt/hash(123456)
purpose: LOGIN or SCAN_VERIFY
expires_at: now + 3 minutes
attempts: 0
max_attempts: 5
consumed_at: null
created_at: now
ip_hash: sha256(ip)
```

### Rate Limit Rules

Example:

```text
OTP request:
- max 1 per phone per 60 seconds
- max 3 per phone per 10 minutes
- max 5 per phone per day
- max 20 per IP per hour

OTP verify:
- max 5 attempts per OTP
- after 5 failed attempts, invalidate OTP
- block phone for 15 minutes
- block IP if abusive
```

### Development Mock OTP

During local development, do not send real SMS unless necessary.

Example:

```text
If NODE_ENV=development:
  accept test OTP: 123456
  print OTP in server console
```

But disable in production:

```text
If NODE_ENV=production:
  mock OTP must throw error or be disabled
```

### Test

1. Request OTP.
2. Enter wrong OTP 5 times.
3. Expected: OTP locked / invalidated.
4. Try old OTP after success.
5. Expected: rejected.
6. Try expired OTP.
7. Expected: rejected.

---

## P0-05: Customer Can Forge Merchant Approval

### Problem

Your site says rewards are approved by cashier.

If approval endpoint accepts:

```json
{
  "action": "approve",
  "shopId": "shop_123",
  "visitId": "visit_456"
}
```

without proving the caller is an authenticated cashier, attacker can approve their own visit.

### Why Dangerous

Free rewards without shopkeeper approval.

### Secure Fix

Merchant approval must require:

1. authenticated merchant/cashier session,
2. role permission,
3. shop membership,
4. visit belongs to that shop,
5. visit status is pending,
6. approval is atomic,
7. audit log records who approved.

### Roles

Use roles:

```text
OWNER
MANAGER
CASHIER
CUSTOMER
SYSTEM
```

Approval endpoint:

```text
POST /api/merchant/approve-visit
```

Backend checks:

```text
Is user logged in?
Does user have CASHIER/MANAGER/OWNER role?
Does user belong to visit.shop_id?
Is visit status PENDING?
Has visit already been approved?
```

Then:

```text
UPDATE visits
SET status = 'APPROVED',
    approved_by_user_id = ...,
    approved_at = ...
WHERE id = ...
  AND shop_id = ...
  AND status = 'PENDING'
```

If zero rows updated, reject.

### Test

1. Login as customer.
2. Try calling merchant approve API.
3. Expected: 401/403.
4. Login as Shop A cashier.
5. Try approving Shop B visit.
6. Expected: 403.

---

## P0-06: WebSocket Terminal Not Authenticated Or Not Authorized

### Problem

You advertise:

```text
Real-time cashier terminal with WebSockets audio chime
```

If WebSocket allows anyone to connect or listen to shop channels, attackers can:

- eavesdrop customer scans,
- see masked phone metadata,
- spam fake events,
- approve visits if approve event is accepted from socket,
- disrupt shop operations.

### Why Dangerous

Privacy leak, fraud, operational disruption.

### Secure WebSocket Rules

WebSocket connection must:

1. require authentication token,
2. verify token during handshake,
3. extract allowed shop IDs,
4. subscribe only to authorized channels,
5. validate every incoming message schema,
6. reject unauthorized events,
7. rate limit messages,
8. disconnect abusive clients,
9. use WSS in production,
10. never trust client-provided shopId alone.

### Bad Design

```text
Channel: shop_123
Anyone can join shop_123
Anyone can send approve event
```

### Good Design

```text
Client connects with access token
Server verifies token
Server knows user belongs to shop_123
Server subscribes socket to shop_123_terminal
Only authenticated cashier sockets can emit approve
Approve event still validated against database
```

### Event Example

Server emits:

```json
{
  "type": "VISIT_CREATED",
  "visitId": "visit_789",
  "shopId": "shop_123",
  "customerMaskedPhone": "98****12",
  "rule": "Min ₹100",
  "createdAt": "2026-11-03T10:15:00+05:30"
}
```

Do not emit:

```text
full phone number
OTP
tokens
internal secrets
```

### Test

1. Connect to WebSocket without token.
2. Expected: rejected.
3. Connect as Shop A.
4. Try subscribing to Shop B channel.
5. Expected: rejected.
6. Try sending approve event as customer socket.
7. Expected: rejected.

---

## P0-07: Reward Can Be Redeemed Multiple Times

### Problem

If system only checks:

```text
stamp_count >= required_visits
```

then after reward is claimed, stamp count may remain same. User can claim again.

### Why Dangerous

Repeated free items.

### Secure Fix

Reward must have lifecycle:

```text
IN_PROGRESS
ELIGIBLE
REDEMPTION_TOKEN_ISSUED
REDEEMED
EXPIRED
CANCELLED
```

When customer reaches required visits:

```text
Create one redemption record
Generate one-time redemption code/token
Mark pass reward status as REDEMPTION_TOKEN_ISSUED
```

Cashier redeems code once:

```text
UPDATE redemptions
SET status = 'REDEEMED',
    redeemed_at = ...,
    redeemed_by_user_id = ...
WHERE code_hash = ...
  AND status = 'ISSUED'
```

If zero rows updated, reject.

### Redemption Table

```text
redemptions
- id
- shop_id
- customer_id
- loyalty_pass_id
- reward_title
- code_hash
- status
- created_at
- expires_at
- redeemed_at
- redeemed_by_user_id
```

### After Redemption

Start new cycle or mark completed depending business rule:

Option A: reset stamps to 0.

Option B: keep history and start new cycle.

Recommended:

```text
Keep old cycle history.
Create new loyalty cycle.
```

### Test

1. Earn reward.
2. Redeem once.
3. Try redeem same code again.
4. Expected: rejected.
5. Try old code after new cycle.
6. Expected: rejected.

---

## P0-08: Broken Tenant Isolation / IDOR Between Shops

### Problem

Multi-shop SaaS risk: Shop A can access Shop B data by changing IDs.

Example bad endpoint:

```text
GET /api/customers?shopId=shop_B
```

If backend trusts `shopId` from request, attacker can read another shop’s customers.

### Why Dangerous

Major privacy breach and business data leak.

### Secure Fix

Never trust shopId from request alone.

Use authenticated session:

```text
logged-in merchant can access only their shop
logged-in customer can access only their own pass
```

Every query must be scoped:

```sql
SELECT * FROM visits
WHERE shop_id = authenticated_shop_id
```

or:

```sql
SELECT * FROM loyalty_passes
WHERE customer_id = authenticated_customer_id
```

### Test

1. Login as Shop A.
2. Try accessing Shop B dashboard, customers, visits, analytics, terminal.
3. Expected: 403 Forbidden.

---

## P0-09: QR URL Parameters Can Be Manipulated

### Problem

If QR URL contains editable business rules:

```text
/scan?shopId=123&minAmount=0&reward=FreeBurger&visits=1
```

attacker can change values.

### Why Dangerous

User can create fake rules or scan for wrong shop/reward.

### Secure Fix

QR URL should contain only opaque signed token:

```text
/scan?t=eyJzaG9wSWQiOi...
```

Backend verifies signature and extracts:

```text
shop_id
qr_version
issued_at
```

Business rules must come from database:

```text
min_bill_amount
required_visits
reward_title
valid_days
shop_name
```

Never allow frontend URL to define reward rules.

### Test

1. Copy QR URL.
2. Change token or parameters.
3. Expected: invalid signature / 400 / 403.

---

# P1 High-Risk Mistakes

---

## P1-01: Missing Security Headers

### Problem

Vercel apps often miss strict headers.

Missing headers can allow:

- clickjacking,
- MIME sniffing,
- referrer leakage,
- weaker XSS protection,
- unwanted permissions.

### Required Headers

Add:

```text
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Permissions-Policy: camera=(self), microphone=(), geolocation=()
Content-Security-Policy or Content-Security-Policy-Report-Only
```

### Next.js Example

```js
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
```

### CSP Strategy

Start with report-only:

```text
Content-Security-Policy-Report-Only: default-src 'self'; ...
```

Then enforce after testing.

CSP is powerful but can break maps, fonts, analytics, WebSocket, images, inline styles. Use report-only first.

---

## P1-02: CORS Too Open

### Problem

Bad:

```js
app.use(cors({ origin: "*" }));
```

If credentials are allowed, this is dangerous.

### Secure Fix

Allow only known origins.

Production:

```text
https://stickthebizz.vercel.app
https://yourdomain.com
```

Development:

```text
http://localhost:3000
```

Example:

```js
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [
        "https://stickthebizz.vercel.app",
        "https://yourdomain.com",
      ]
    : ["http://localhost:3000"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
```

---

## P1-03: Secrets Exposed In Frontend

### Problem

Anything in frontend bundle can be read by users.

Never put in frontend:

```text
DATABASE_URL
JWT_SECRET
OTP_SECRET
SMS_API_KEY
WHATSAPP_API_KEY
RESEND_API_KEY
TWILIO_AUTH_TOKEN
ADMIN_PASSWORD
FIREBASE_SERVICE_ACCOUNT
STRIPE_SECRET_KEY
RAZORPAY_KEY_SECRET
```

### Safe Frontend Values

Only public values:

```text
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_WS_URL
NEXT_PUBLIC_RAZORPAY_KEY_ID if payment public key
NON_SENSITIVE_FEATURE_FLAGS
```

### Check `.gitignore`

Ensure:

```gitignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### Create `.env.example`

Example:

```env
DATABASE_URL=
JWT_SECRET=
OTP_PEPPER=
SMS_PROVIDER_KEY=
SMS_PROVIDER_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NODE_ENV=development
```

No real secrets.

---

## P1-04: Weak Session Management

### Problem

If session token is stored in localStorage, XSS can steal it.

If JWT never expires, stolen token works forever.

### Recommended

Use:

```text
httpOnly cookie
Secure cookie
SameSite=Lax or Strict
short-lived access token
refresh token rotation
server-side revocation
logout invalidates token
```

### Cookie Settings

```text
HttpOnly: true
Secure: true in production
SameSite: Lax or Strict
Path: /
Max-Age: short
```

### If Using JWT

- Use strong secret.
- Use `HS256` or better `RS256`.
- Set expiry.
- Include `shop_id` / `user_id` / `role`.
- Validate signature on every request.
- Support revocation list or token version.

### Token Version Pattern

User table:

```text
token_version
```

JWT includes:

```text
token_version
```

If user logs out everywhere or password/PIN changes:

```text
increment token_version
```

Old tokens fail.

---

## P1-05: No CSRF Protection

### Problem

If using cookies, attacker may trick logged-in cashier into submitting state-changing request.

Dangerous actions:

```text
approve visit
redeem reward
change shop settings
delete customer
invite cashier
change PIN
```

### Fix

Use:

```text
SameSite=Lax or Strict
CSRF token for state-changing requests
Origin/Referer validation
```

If using `Authorization: Bearer` header only, CSRF risk is lower, but still validate Origin/CORS.

---

## P1-06: No Input Validation

### Problem

If backend accepts any JSON field, attackers can inject:

- SQL,
- NoSQL operators,
- XSS payloads,
- prototype pollution,
- overly large payloads,
- unexpected types.

### Fix

Validate every request:

- body,
- query,
- params,
- headers,
- WebSocket messages.

Use Zod / Joi / Yup / class-validator.

Example Zod:

```ts
import { z } from "zod";

export const scanSchema = z.object({
  qrToken: z.string().min(10).max(1000),
  idempotencyKey: z.string().min(8).max(100).optional(),
});
```

Reject unknown fields:

```ts
const parsed = scanSchema.safeParse(req.body);
if (!parsed.success) {
  return res.status(400).json({ error: "Invalid request" });
}
```

---

## P1-07: XSS In Dynamic Text

### Problem

Users may control:

```text
shop name
reward name
customer name
note
message
analytics label
```

If rendered unsafely, script can execute.

### Fix

React usually escapes by default:

```jsx
<h1>{shopName}</h1>
```

Avoid:

```jsx
dangerouslySetInnerHTML
```

If rich text is needed, sanitize with DOMPurify.

Add CSP.

---

## P1-08: Open Redirect

### Problem

Login or scan flow may support:

```text
/redirect?url=https://evil.com
/login?redirect=https://evil.com
```

Attacker sends phishing link.

### Fix

Allow only internal paths:

```text
/pass
/dashboard
/merchant
/thanks
```

Reject:

```text
https://
//
javascript:
data:
```

Example:

```ts
function isSafeRedirect(path: string) {
  return path.startsWith("/") && !path.startsWith("//");
}
```

---

## P1-09: No Rate Limiting On Public Endpoints

### Problem

Public endpoints can be abused:

```text
/register
/login
/otp/request
/otp/verify
/scan
/merchant/approve
/redeem
/contact
/analytics/export
```

### Fix

Rate limit by:

```text
IP
phone hash
user ID
shop ID
endpoint
```

Options:

- Vercel Edge Middleware + Upstash Redis
- express-rate-limit
- custom Redis limiter
- database counter for MVP

Example rule:

```text
/otp/request:
5 per IP per hour
3 per phone per 10 minutes

/scan:
10 per customer per minute
100 per shop per hour
```

---

## P1-10: Error Messages Leak Internals

### Problem

Bad error response:

```text
MongoServerError: E11000 duplicate key error collection: saas.visits index: shop_1_customer_2_date_3
```

or:

```text
JWT_SECRET missing
```

This helps attackers.

### Fix

Return generic errors:

```json
{
  "error": "Something went wrong"
}
```

Log detailed error server-side.

Create central error handler:

```ts
res.status(500).json({ error: "Internal server error" });
```

Never expose:

```text
stack trace
DB query
SQL error
secret names
internal file paths
vendor raw response
```

---

## P1-11: Dependency Vulnerabilities

### Problem

Old packages can have known CVEs.

### Fix

Run:

```bash
npm audit
npm audit --production
npm outdated
```

Update critical/high issues.

Use Dependabot or Renovate.

Lockfile must be committed:

```text
package-lock.json
or pnpm-lock.yaml
or yarn.lock
```

---

## P1-12: No Audit Logs

### Problem

If dispute happens:

```text
Customer says: I scanned.
Shop says: No stamp.
Cashier says: I approved.
System says: unknown.
```

You need evidence.

### Fix

Log events:

```text
OTP_REQUESTED
OTP_VERIFIED
OTP_FAILED
OTP_EXPIRED
QR_SCANNED
VISIT_CREATED
VISIT_DUPLICATE_REJECTED
VISIT_APPROVED
VISIT_REJECTED
REWARD_EARNED
REDEMPTION_ISSUED
REDEMPTION_USED
MERCHANT_LOGIN
MERCHANT_LOGIN_FAILED
CASHIER_PIN_FAILED
SETTINGS_CHANGED
UNAUTHORIZED_ACCESS_ATTEMPT
```

Do not log:

```text
plain OTP
password
full token
full phone if avoidable
```

Log masked phone:

```text
98****12
```

---

## P1-13: No Idempotency Keys

### Problem

Network retry can duplicate actions:

```text
customer taps scan twice
cashier taps approve twice
mobile network retries request
```

### Fix

Use idempotency keys for:

```text
scan
approve
redeem
OTP request
reward issue
```

Table:

```text
idempotency_keys
- key
- user_id
- endpoint
- request_hash
- response_status
- response_body_json
- created_at
- expires_at
```

If same key arrives again:

```text
return stored response
```

---

# P2 Medium / Important Issues

---

## P2-01: Cashier PIN Is Weak Identity

### Problem

You mention 4-digit PIN.

Issues:

- 4 digits = only 10,000 combinations,
- shared PIN = no accountability,
- shoulder surfing,
- brute force if no rate limit,
- no way to know which cashier approved.

### Better Design

Cashier terminal should have login:

```text
email/phone + password
or
OTP login
or
owner-invited cashier account
```

PIN can be secondary confirmation, not sole identity.

If PIN used:

- store hashed,
- rate limit attempts,
- lock after failures,
- log approvals with cashier user ID,
- allow owner to reset PIN,
- avoid default PIN in production.

---

## P2-02: DPDP Claim Must Be Backed By Real Controls

Your site says:

```text
DPDP Safe Customer Privacy
```

Be careful. Absolute legal compliance requires legal review.

Better public wording:

```text
Designed to support India DPDP Act compliance.
```

### Minimum DPDP-Oriented Controls

- clear consent before collecting phone number,
- purpose limitation: loyalty only,
- data minimization,
- masked phone display,
- access control for staff,
- retention policy,
- deletion/export mechanism,
- privacy policy,
- terms of service,
- grievance officer / support contact,
- vendor list,
- breach notification process,
- audit logs for data access,
- no selling/sharing without consent.

### Consent Example

Before OTP:

```text
By continuing, you agree that your mobile number will be used only for StickTheBizz loyalty visits at this shop. We will not sell your number. You can request deletion anytime.
```

Store:

```text
consent_at
consent_version
```

---

## P2-03: No Customer Data Deletion / Export Flow

If customer asks:

```text
Delete my number
```

you need process.

### Fix

Support:

```text
soft delete
anonymization
retention schedule
```

Example:

```text
Delete customer profile
Keep anonymized visit count for shop analytics
Keep redemption audit record without PII
```

Anonymized customer:

```text
phone_hash = deleted
name = null
status = DELETED_ANONYMIZED
```

---

## P2-04: Analytics Endpoint May Leak PII

Dashboards may show:

```text
customer phone
customer name
visit history
reward status
```

Ensure only authorized shop owner/manager can view.

Mask where possible.

Do not expose full phone number unless absolutely necessary and justified.

---

## P2-05: File Upload Risks

You mention printable QR standee artwork. If users upload logos/images:

Risks:

- malicious SVG,
- huge files,
- XSS through SVG,
- storage abuse,
- malware hosting.

### Fix

Allow only:

```text
png
jpg
jpeg
webp
```

Block:

```text
svg unless sanitized
html
htm
xhtml
exe
zip
js
```

Validate:

```text
file size <= 2MB or 5MB
mime type
image dimensions
```

Store with random filename:

```text
uploads/shop_123/abc123def456.webp
```

Serve with:

```text
X-Content-Type-Options: nosniff
Content-Disposition: attachment for unsafe types
```

Prefer separate subdomain for user uploads:

```text
media.yourdomain.com
```

---

## P2-06: No Staging Environment

Testing attacks directly on production can hurt real users.

Create:

```text
development
staging
production
```

Staging URL:

```text
staging.stickthebizz.com
```

or Vercel preview deployment.

Use separate database.

Never test destructive flows on production.

---

## P2-07: No Fraud Detection / Anomaly Alerts

Even correct logic can be abused.

Watch for:

```text
same customer scanning many shops
same IP creating many accounts
many OTP requests from one IP
cashier approving unusually many visits
reward redemption spikes
customer changing device frequently
impossible travel-like patterns
multiple accounts from same device
```

MVP alerts:

```text
Alert if one phone scans > 10 shops/day
Alert if one IP requests > 20 OTPs/hour
Alert if one cashier approves > 200 visits/hour
Alert if one shop redeems > abnormal count/day
```

---

## P2-08: No Backup / Recovery Plan

If database corrupts or accidental deletion happens, you need recovery.

Required:

```text
daily automated backup
retention period
restore test
point-in-time recovery if possible
environment variable backup
deployment rollback
```

For Vercel:

- keep deployment history,
- use Git branches,
- tag releases,
- test rollback.

For database:

- enable backups,
- export schema,
- document restore steps.

---

## P2-09: No Monitoring / Alerting

You need to know when system is failing or being abused.

Monitor:

```text
API error rate
OTP failure rate
scan duplicate rate
WebSocket disconnects
DB latency
SMS provider failures
payment failures if added
5xx errors
login failures
unauthorized access attempts
```

Tools:

```text
Sentry
Logtail
Axiom
Datadog
Grafana
UptimeRobot
Better Stack
Vercel Analytics
Vercel Logs
```

---

## P2-10: No Incident Response Plan

If breach happens, you need process.

Plan:

1. Detect.
2. Contain.
3. Investigate.
4. Notify affected users if required.
5. Rotate secrets.
6. Revoke sessions.
7. Patch.
8. Postmortem.

Prepare templates:

```text
customer notification
shop owner notification
internal incident log
postmortem document
```

---

## P2-11: No Secret Rotation Process

If secret leaks:

```text
SMS_API_KEY
JWT_SECRET
DATABASE_URL
```

you need rotate quickly.

Process:

1. revoke old secret,
2. create new secret,
3. update Vercel env,
4. redeploy,
5. invalidate sessions if JWT secret changed,
6. monitor errors.

---

## P2-12: No Webhook Security

If you use payment webhook, SMS webhook, WhatsApp webhook:

Validate:

```text
signature
timestamp
replay protection
source IP allowlist if provider supports
```

Example:

```text
Razorpay webhook secret
Stripe signing secret
MSG91 webhook token
```

Reject unsigned webhooks.

---

## P2-13: SSRF Risk If Fetching External URLs

If backend fetches user-provided URL:

```text
image URL
webhook URL
import URL
```

Attacker may force server to access internal services.

### Fix

Allowlist domains.

Block:

```text
localhost
127.0.0.1
0.0.0.0
169.254.169.254
10.x.x.x
192.168.x.x
172.16-31.x.x
metadata endpoints
```

Better: do not allow user-provided URLs unless necessary.

---

## P2-14: No Admin Panel Security

If you have admin panel:

Protect:

```text
strong auth
MFA
IP allowlist
audit log
separate role
no public indexing
```

Admin actions:

```text
view shops
delete shops
refund
override stamps
view logs
impersonate
```

All must be logged.

---

## P2-15: No Trial / Billing Abuse Protection

You mention first 50 scans free and ₹499/month.

If billing added, protect:

```text
coupon abuse
trial abuse
multiple accounts
payment replay
refund abuse
webhook spoofing
price manipulation from client
```

Rules:

- price from server,
- currency from server,
- discount from server,
- payment status from provider webhook,
- never trust client-paid boolean.

---

# P3 Low / Polish Issues

---

## P3-01: Missing Privacy Policy Link

Add footer link:

```text
Privacy Policy
Terms
Refund Policy
Contact
Grievance Officer
```

---

## P3-02: Missing Terms Of Service

Add clear terms:

```text
loyalty rules
reward expiry
minimum bill rule
daily limit
merchant approval requirement
fraud consequences
data use
termination
```

---

## P3-03: Missing Refund Policy

If charging ₹499/month:

```text
refund within X days?
monthly cancellation?
annual refund?
failed service credits?
```

---

## P3-04: Missing Support Contact

Indian shopkeepers trust support.

Add:

```text
WhatsApp support
phone support
email support
Hindi help
regional language help
```

---

## P3-05: Missing FAQ About Fraud

Add FAQ:

```text
Can customer scan twice?
Can customer change phone time?
Can employee approve fake visits?
How are rewards protected?
What if QR standee is tampered?
```

---

## P3-06: Missing Visual Anti-Tamper Guidance

Tell merchants:

```text
Check your QR standee daily.
Do not allow stickers over QR.
Verify shop name on customer pass.
```

---

## P3-07: Missing Accessibility

Ensure:

```text
color contrast
keyboard navigation
screen reader labels
large tap targets
alt text
focus states
```

Important for real users.

---

## P3-08: Missing Mobile Performance Optimization

Retail users may use cheap Android phones.

Optimize:

```text
image size
JavaScript bundle
camera startup
OTP input
WebSocket reconnect
offline fallback
low-network timeout
```

---

## P3-09: Missing Localization

Consider:

```text
English
Hindi
Marathi
Gujarati
Tamil
Telugu
Kannada
Bengali
```

At least Hindi + English for MVP.

---

## P3-10: Missing SEO Basics

Add:

```text
title
meta description
Open Graph image
canonical URL
robots.txt
sitemap.xml
structured data if appropriate
```

---

# 6. Threat Model

Use simple threat model.

## Actors

| Actor | Motivation | Possible Abuse |
|---|---|---|
| Curious customer | free reward | edit storage, change time, duplicate scan |
| Fraudulent customer | steal rewards | OTP brute force, fake accounts, multi-scan |
| Dishonest employee | kickbacks / theft | approve fake visits, share PIN |
| Competitor | damage trust | spam OTP, fake registrations, phishing QR |
| Hacker | data breach | IDOR, SQLi, XSS, WebSocket abuse |
| Insider | misuse access | view customer data, override stamps |
| Automated bot | scale abuse | mass OTP, mass registration, scraping |

## Assets

| Asset | Value | Risk |
|---|---:|---|
| Customer phone number | high | privacy breach |
| Loyalty stamps | medium | financial loss |
| Reward redemption codes | high | free goods theft |
| Shop analytics | medium | business data leak |
| Merchant sessions | high | unauthorized approvals |
| OTP secrets | high | account takeover |
| Database | critical | full compromise |

## Trust Boundaries

Crossed at:

```text
browser -> API
QR URL -> backend
customer device -> OTP provider
cashier terminal -> WebSocket
payment provider -> webhook
admin -> system
```

Every boundary needs validation.

---

# 7. Attack Surface Map

Public attack surface:

```text
Homepage
Register shop page
Merchant login
Customer scan page
OTP request endpoint
OTP verify endpoint
Pass page
WebSocket endpoint
Merchant dashboard
Cashier terminal
Analytics endpoints
Reward redemption endpoints
File upload endpoints
Payment endpoints if added
Admin endpoints if added
Webhook endpoints
Error pages
API docs if exposed
Source maps if exposed
```

Each endpoint needs:

```text
authentication
authorization
rate limiting
input validation
logging
safe errors
```

---

# 8. OWASP Mapping

| OWASP Category | StickTheBizz Risk | Main Fix |
|---|---|---|
| A01 Broken Access Control | cross-shop data, customer approving visit | session-scoped queries, roles |
| A02 Cryptographic Failures | phone/OTP exposure | hash OTP, mask phone, TLS |
| A03 Injection | SQL/NoSSQL/XSS | schema validation, parameterized queries |
| A04 Insecure Design | client trust, reward loops | server-authoritative state |
| A05 Security Misconfiguration | headers, CORS, env | Vercel config, secrets |
| A06 Vulnerable Components | old npm packages | npm audit, updates |
| A07 Authentication Failures | OTP brute force | rate limit, expiry, attempts |
| A08 Software/Data Integrity | fake QR, tampered tokens | signed tokens, DB validation |
| A09 Logging Failures | no dispute evidence | audit logs |
| A10 SSRF | external URL fetch | allowlist domains |

---

# 9. Secure Architecture Blueprint

## Core Principle

```text
Client = display and request
Server = decide and enforce
Database = truth and constraints
Logs = evidence
```

## High-Level Flow

```text
Customer scans QR
   ↓
Frontend opens /scan?t=signed_token
   ↓
Backend verifies token and returns shop info from DB
   ↓
Customer enters phone
   ↓
Backend requests OTP with rate limit
   ↓
Customer verifies OTP
   ↓
Backend creates customer session
   ↓
Customer requests scan
   ↓
Backend checks daily uniqueness atomically
   ↓
Backend creates visit as PENDING
   ↓
Backend emits WebSocket event to authorized cashier terminal
   ↓
Cashier approves visit
   ↓
Backend verifies cashier permission
   ↓
Backend increments stamp atomically
   ↓
Backend checks reward eligibility
   ↓
If eligible, backend issues one-time redemption code
   ↓
Customer shows redemption code
   ↓
Cashier redeems once
   ↓
Backend marks redeemed and starts new cycle if needed
```

---

# 10. Recommended Database Schema

Adjust names to your ORM/database.

## users

```text
id
role: OWNER | MANAGER | CASHIER | CUSTOMER | ADMIN
shop_id nullable
email nullable
phone_hash nullable
phone_last4 nullable
password_hash nullable
status: ACTIVE | SUSPENDED | DELETED
token_version integer default 0
consent_at timestamp nullable
created_at
updated_at
last_login_at
```

## shops

```text
id
owner_user_id
name
city
state
phone_hash
phone_last4
status: TRIAL | ACTIVE | SUSPENDED | DELETED
min_bill_amount
reward_title
required_visits
valid_days
qr_token_secret_version
settings_json
created_at
updated_at
```

## loyalty_passes

```text
id
shop_id
customer_id
stamp_count integer default 0
required_visits integer
reward_status: IN_PROGRESS | ELIGIBLE | REDEMPTION_ISSUED | REDEEMED | EXPIRED
current_cycle_started_at
last_visit_date_IST date nullable
created_at
updated_at
```

Unique:

```text
UNIQUE(shop_id, customer_id)
```

## visits

```text
id
shop_id
customer_id
loyalty_pass_id
visit_date_IST date
status: PENDING | APPROVED | REJECTED | EXPIRED
approved_by_user_id nullable
approved_at timestamp nullable
rejected_reason nullable
idempotency_key nullable
created_at
updated_at
```

Critical unique:

```text
UNIQUE(shop_id, customer_id, visit_date_IST)
```

Indexes:

```text
INDEX(shop_id, created_at)
INDEX(customer_id, created_at)
INDEX(status, created_at)
```

## redemptions

```text
id
shop_id
customer_id
loyalty_pass_id
reward_title
code_hash
status: ISSUED | REDEEMED | EXPIRED | CANCELLED
created_at
expires_at
redeemed_at
redeemed_by_user_id
```

Unique:

```text
UNIQUE(loyalty_pass_id, status) partial where status = ISSUED
```

or enforce in application transaction.

## otp_codes

```text
id
phone_hash
code_hash
purpose: LOGIN | SCAN | RESET
expires_at
attempts integer default 0
max_attempts integer default 5
consumed_at nullable
created_at
ip_hash
user_agent_hash
```

Index:

```text
INDEX(phone_hash, purpose, consumed_at, expires_at)
```

## audit_logs

```text
id
actor_type: CUSTOMER | MERCHANT | ADMIN | SYSTEM
actor_id nullable
shop_id nullable
event_type
entity_type
entity_id
metadata_json
ip_hash
user_agent_hash
created_at
```

## idempotency_keys

```text
key
user_id
endpoint
request_hash
response_status
response_body_json
created_at
expires_at
```

Unique:

```text
UNIQUE(key, user_id, endpoint)
```

## rate_limits

Optional if not using Redis.

```text
bucket_key
window_start
count
expires_at
```

Unique:

```text
UNIQUE(bucket_key, window_start)
```

---

# 11. API Contract

Use consistent responses.

Success:

```json
{
  "ok": true,
  "data": {}
}
```

Error:

```json
{
  "ok": false,
  "error": {
    "code": "DUPLICATE_SCAN",
    "message": "You have already scanned today."
  }
}
```

Common error codes:

```text
VALIDATION_ERROR
UNAUTHENTICATED
FORBIDDEN
NOT_FOUND
RATE_LIMITED
OTP_EXPIRED
OTP_INVALID
OTP_MAX_ATTEMPTS
DUPLICATE_SCAN
INVALID_QR_TOKEN
SHOP_INACTIVE
VISIT_NOT_PENDING
REDEMPTION_INVALID
REDEMPTION_USED
INTERNAL_ERROR
```

Do not expose internal details.

---

# 12. Secure OTP Flow

## Request OTP

Endpoint:

```text
POST /api/otp/request
```

Input:

```json
{
  "phone": "9876543210",
  "purpose": "LOGIN"
}
```

Backend steps:

```text
1. Validate phone format.
2. Hash phone with pepper.
3. Check rate limit by phone and IP.
4. Generate 6-digit cryptographically random OTP.
5. Hash OTP.
6. Store OTP with expiry 3-5 minutes.
7. Send via SMS/WhatsApp.
8. Log OTP_REQUESTED without OTP.
9. Return generic success.
```

Response:

```json
{
  "ok": true,
  "message": "OTP sent"
}
```

## Verify OTP

Endpoint:

```text
POST /api/otp/verify
```

Input:

```json
{
  "phone": "9876543210",
  "otp": "123456",
  "purpose": "LOGIN"
}
```

Backend steps:

```text
1. Rate limit by phone/IP.
2. Hash phone.
3. Find active OTP.
4. Check expiry.
5. Check attempts < max.
6. Compare OTP hash using timing-safe method.
7. If fail: increment attempts, log OTP_FAILED.
8. If 5 fails: invalidate OTP, block temporarily.
9. If success: mark consumed_at.
10. Create/login user.
11. Issue secure session.
12. Log OTP_VERIFIED.
```

Response:

```json
{
  "ok": true,
  "session": {},
  "redirect": "/pass"
}
```

---

# 13. Secure QR Scan Flow

Endpoint:

```text
POST /api/scan
```

Input:

```json
{
  "qrToken": "signed_token",
  "idempotencyKey": "optional_uuid"
}
```

Backend steps:

```text
1. Require customer authentication/session.
2. Verify QR signature.
3. Extract shop_id from signed token.
4. Load shop from DB.
5. Check shop active.
6. Calculate server IST date.
7. Check idempotency key.
8. Begin transaction.
9. Insert visit with unique constraint.
10. If duplicate: return already scanned.
11. Create loyalty pass if missing.
12. Emit WebSocket VISIT_CREATED to authorized shop terminal.
13. Log VISIT_CREATED.
14. Return pending status.
```

Response:

```json
{
  "ok": true,
  "visitId": "visit_123",
  "status": "PENDING_MERCHANT_APPROVAL",
  "shopName": "Kesar Chai Corner",
  "stampCount": 7,
  "requiredVisits": 10,
  "todayAlreadyScanned": false
}
```

Duplicate:

```json
{
  "ok": false,
  "error": {
    "code": "DUPLICATE_SCAN",
    "message": "You have already scanned today."
  },
  "stampCount": 7
}
```

---

# 14. Secure Merchant Approval Flow

Endpoint:

```text
POST /api/merchant/approve-visit
```

Input:

```json
{
  "visitId": "visit_123",
  "idempotencyKey": "cashier_uuid"
}
```

Backend steps:

```text
1. Require authenticated merchant/cashier.
2. Verify role.
3. Load visit.
4. Verify visit.shop_id equals authenticated shop_id.
5. Verify visit status is PENDING.
6. Begin transaction.
7. Update visit to APPROVED only if still PENDING.
8. Increment loyalty pass stamp_count.
9. Check reward eligibility.
10. If eligible, issue redemption token.
11. Emit WebSocket VISIT_APPROVED.
12. Log VISIT_APPROVED.
13. Return updated pass.
```

Important SQL pattern:

```sql
UPDATE visits
SET status = 'APPROVED',
    approved_by_user_id = $1,
    approved_at = NOW()
WHERE id = $2
  AND shop_id = $3
  AND status = 'PENDING'
RETURNING *;
```

If no row returned:

```text
already approved / invalid / not yours
```

---

# 15. Secure Reward Redemption Flow

Endpoint:

```text
POST /api/merchant/redeem-reward
```

Input:

```json
{
  "redemptionCode": "ABCDE12345"
}
```

Backend steps:

```text
1. Require authenticated merchant/cashier.
2. Hash code.
3. Find redemption by code_hash and shop_id.
4. Verify status ISSUED.
5. Verify not expired.
6. Atomically update to REDEEMED.
7. Start new loyalty cycle if business rule requires.
8. Log REDEMPTION_USED.
9. Return success.
```

SQL pattern:

```sql
UPDATE redemptions
SET status = 'REDEEMED',
    redeemed_at = NOW(),
    redeemed_by_user_id = $1
WHERE code_hash = $2
  AND shop_id = $3
  AND status = 'ISSUED'
RETURNING *;
```

If zero rows:

```text
invalid / used / expired / wrong shop
```

---

# 16. WebSocket Security Implementation

## Handshake

Client:

```js
const socket = io("/", {
  auth: {
    token: accessToken,
  },
  transports: ["websocket"],
});
```

Server:

```js
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const user = await verifyToken(token);
  if (!user) return next(new Error("unauthorized"));
  socket.data.user = user;
  next();
});
```

## Channel Authorization

```js
socket.on("join_shop_terminal", async (payload, ack) => {
  const user = socket.data.user;
  if (!user.shopIds.includes(payload.shopId)) {
    return ack({ ok: false, error: "forbidden" });
  }
  socket.join(`shop:${payload.shopId}:terminal`);
  ack({ ok: true });
});
```

## Message Validation

Use schema:

```js
const approveSchema = z.object({
  visitId: z.string().uuid(),
});
```

Reject unknown events.

## Rate Limit Socket Messages

Example:

```text
max 30 messages per minute per socket
max 5 approve attempts per minute per user
```

## Events Server Can Emit

```text
VISIT_CREATED
VISIT_APPROVED
VISIT_REJECTED
REWARD_REDEEMED
TERMINAL_ERROR
```

## Events Client Should Not Be Allowed To Emit Directly For State Changes

Do not allow:

```text
approve_visit
redeem_reward
increment_stamp
```

from customer sockets.

Use HTTP API for state changes, WebSocket only for notifications.

---

# 17. Security Headers Configuration

## Next.js

Use Section P1-01 example.

## Vercel JSON Alternative

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "Permissions-Policy", "value": "camera=(self), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

## CSP Starter Report-Only

```text
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'
```

Adjust for:

```text
Google Fonts
analytics
maps
payment scripts
WebSocket URL
image CDN
```

---

# 18. Rate Limiting Implementation

## Options

- Upstash Redis + Vercel Edge Config
- Redis
- PostgreSQL counter
- express-rate-limit
- custom middleware

## Bucket Keys

```text
otp_request_ip:{ip}
otp_request_phone:{phone_hash}
otp_verify_ip:{ip}
otp_verify_phone:{phone_hash}
scan_customer:{customer_id}
scan_shop:{shop_id}
merchant_approve_user:{user_id}
register_ip:{ip}
login_ip:{ip}
websocket_message_socket:{socket_id}
```

## Example Limits

```text
OTP request:
- 1 per phone per 60 sec
- 3 per phone per 10 min
- 5 per phone per day
- 20 per IP per hour

OTP verify:
- 5 attempts per OTP
- 10 per phone per hour
- 50 per IP per hour

Scan:
- 1 per customer per shop per day enforced by DB
- 10 per customer per minute
- 200 per shop per hour

Merchant approve:
- 60 per cashier per minute
- 1000 per shop per hour

Register:
- 3 per IP per hour
- captcha required
```

---

# 19. Authentication And Session Design

## Recommended

Use secure cookies.

Cookie:

```text
name: sb_session
httpOnly: true
secure: true
sameSite: lax
path: /
maxAge: short
```

## Access Token + Refresh Token

Access token:

```text
15 minutes
```

Refresh token:

```text
7 or 30 days
rotating
stored hashed in DB
revocable
```

## Session Record

```text
sessions
- id
- user_id
- refresh_token_hash
- ip_hash
- user_agent_hash
- created_at
- expires_at
- revoked_at
```

Logout:

```text
revoke session
clear cookie
increment token_version if needed
```

---

# 20. Input Validation Examples

## Zod Schema For OTP Request

```ts
import { z } from "zod";

export const otpRequestSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
  purpose: z.enum(["LOGIN", "SCAN", "RESET"]),
}).strict();
```

## Zod Schema For Scan

```ts
export const scanSchema = z.object({
  qrToken: z.string().min(10).max(2000),
  idempotencyKey: z.string().uuid().optional(),
}).strict();
```

## Zod Schema For Approve Visit

```ts
export const approveVisitSchema = z.object({
  visitId: z.string().uuid(),
  idempotencyKey: z.string().uuid().optional(),
}).strict();
```

## Zod Schema For Redeem Reward

```ts
export const redeemSchema = z.object({
  redemptionCode: z.string().min(6).max(32),
}).strict();
```

Always use `.strict()` to reject unexpected fields.

---

# 21. Output Encoding And XSS Prevention

Rules:

- React JSX text interpolation is usually safe.
- Avoid `dangerouslySetInnerHTML`.
- Sanitize user HTML if required.
- Encode URL parameters.
- Do not reflect user input into `<script>`.
- Use CSP.
- Validate file uploads.
- Serve user uploads from separate domain if possible.

Bad:

```jsx
<div dangerouslySetInnerHTML={{ __html: shopDescription }} />
```

Better:

```jsx
<div>{shopDescription}</div>
```

If rich text:

```js
import DOMPurify from "dompurify";
const clean = DOMPurify.sanitize(userHtml);
```

---

# 22. Logging And Audit Design

## Log Structure

```json
{
  "event": "VISIT_APPROVED",
  "actorType": "MERCHANT",
  "actorId": "user_123",
  "shopId": "shop_456",
  "entityType": "visit",
  "entityId": "visit_789",
  "ipHash": "sha256...",
  "userAgentHash": "sha256...",
  "metadata": {
    "stampCountAfter": 8
  },
  "createdAt": "2026-11-03T10:20:00+05:30"
}
```

## Events To Log

```text
SHOP_REGISTERED
MERCHANT_LOGIN_SUCCESS
MERCHANT_LOGIN_FAILED
OTP_REQUESTED
OTP_VERIFIED
OTP_FAILED
OTP_EXPIRED
QR_SCANNED
VISIT_CREATED
VISIT_DUPLICATE_REJECTED
VISIT_APPROVED
VISIT_REJECTED
REWARD_ELIGIBLE
REDEMPTION_ISSUED
REDEMPTION_USED
REDEMPTION_INVALID
SETTINGS_CHANGED
CASHIER_PIN_FAILED
UNAUTHORIZED_ACCESS_ATTEMPT
WEBSOCKET_AUTH_FAILED
RATE_LIMIT_TRIGGERED
ERROR_INTERNAL
```

## Do Not Log

```text
plain OTP
password
full token
full phone number if avoidable
payment secret
SMS API key
database password
```

---

# 23. Privacy / DPDP Alignment Checklist

Public wording recommendation:

```text
Designed to support India DPDP Act compliance.
```

Not:

```text
100% DPDP safe
```

unless legally reviewed.

## Checklist

- [ ] Consent text before phone collection.
- [ ] Purpose stated clearly.
- [ ] Data minimization.
- [ ] Phone masked on cashier UI.
- [ ] Full phone not exposed unnecessarily.
- [ ] OTP not logged.
- [ ] Access control for staff.
- [ ] Audit logs for data access.
- [ ] Retention policy defined.
- [ ] Deletion request process.
- [ ] Export process if feasible.
- [ ] Privacy policy published.
- [ ] Terms published.
- [ ] Grievance/contact page.
- [ ] Vendor list.
- [ ] Breach response plan.
- [ ] No sale/share without consent.
- [ ] Consent version stored.

---

# 24. DevOps And Vercel Deployment Checklist

## Environment Variables

Production Vercel env vars:

```text
DATABASE_URL
JWT_SECRET
OTP_PEPPER
SESSION_SECRET
SMS_PROVIDER_KEY
SMS_PROVIDER_SECRET
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_WS_URL
SENTRY_DSN optional
UPSTASH_REDIS_REST_URL optional
UPSTASH_REDIS_REST_TOKEN optional
RAZORPAY_KEY_ID if payments
RAZORPAY_KEY_SECRET if payments
STRIPE_WEBHOOK_SECRET if payments
```

Never commit `.env`.

## Vercel Settings

- Enable deployment protection if needed.
- Use HTTPS.
- Use custom domain.
- Keep Node.js version updated.
- Use production branch only.
- Review environment variables.
- Enable logs retention.
- Use preview deployments for staging.
- Disable source maps in production if not needed.
- Use Vercel Firewall / WAF if available.
- Set proper domain DNS.
- Use `www` or apex consistently.

## CI/CD

Add GitHub Actions:

```yaml
name: CI
on:
  pull_request:
  push:
    branches:
      - main
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm audit --production
      - run: npm test
```

---

# 25. Testing Plan

## Unit Tests

Test:

```text
phone validation
OTP generation
OTP hashing
IST date calculation
schema validation
mask phone function
redirect safety
token verification
```

## Integration Tests

Test:

```text
duplicate scan prevention
OTP expiry
OTP attempt limit
merchant approval authorization
cross-shop access rejection
reward one-time redemption
WebSocket auth
rate limiting
```

## Manual QA Checklist

- [ ] Change localStorage stamp count. Expected: no effect.
- [ ] Change device time. Expected: no effect.
- [ ] Double-click scan. Expected: one visit.
- [ ] Two tabs scan simultaneously. Expected: one visit.
- [ ] Wrong OTP 5 times. Expected: lock.
- [ ] Expired OTP. Expected: reject.
- [ ] Reuse OTP. Expected: reject.
- [ ] Customer calls approve API. Expected: 403.
- [ ] Shop A accesses Shop B. Expected: 403.
- [ ] WebSocket no token. Expected: reject.
- [ ] WebSocket wrong channel. Expected: reject.
- [ ] Redeem reward twice. Expected: second reject.
- [ ] QR token tampered. Expected: reject.
- [ ] Security headers present.
- [ ] CORS blocks unknown origin.
- [ ] No secrets in frontend bundle.
- [ ] Error page does not leak stack trace.

---

# 26. Website / Product Improvements

Security is important, but conversion and trust also matter.

## Homepage Improvements

### Add Real Screenshots

Show:

```text
customer pass
cashier terminal
merchant dashboard
QR standee
reward redemption screen
```

### Add Demo Video

15 to 30 seconds:

```text
Customer scans QR
OTP verified
Pass opens
Cashier terminal rings
Cashier approves
Stamp added
Reward redeemed
```

### Add Live Demo Mode

Let visitors test:

```text
demo shop
demo customer
demo cashier
```

No real SMS.

### Add Anti-Fraud Trust Section

Example:

```text
Server-verified stamps
Cashier-approved visits
Daily reset controlled by server
OTP rate limited
One-time reward codes
Masked customer numbers
```

### Add Pricing Details

Clarify:

```text
GST included/excluded?
Setup fee?
Payment methods?
Refund policy?
Free trial length?
What happens after trial?
Can shop pause account?
```

### Add Onboarding Steps

```text
1. Register shop
2. Set reward rule
3. Download QR standee
4. Open cashier terminal
5. Test first scan
```

### Add Merchant Login Prominently

Current:

```text
Open Merchant Desk
```

Make it visible in header and hero.

### Add Regional Language Support

At least:

```text
English
Hindi
```

Later:

```text
Marathi
Gujarati
Tamil
Telugu
Kannada
Bengali
```

### Add Support Section

```text
WhatsApp support
Call support
Email support
Help center
Video tutorials
```

### Improve Testimonials

Add:

```text
real photo
shop board
city
before/after numbers
video testimonial
```

### Add Legal Footer

```text
Privacy Policy
Terms
Refund Policy
Grievance Officer
Contact
```

### Add QR Tamper Warning

For merchants:

```text
Check your QR standee daily.
Do not allow anyone to paste stickers over it.
Customers should verify shop name on pass.
```

### Add Minimum Bill Clarity

Explain:

```text
Customer must spend minimum amount to qualify.
Cashier verifies bill before approval.
```

### Add Reward Expiry Rule

Example:

```text
Complete 10 visits within 40 days.
```

Make this visible on customer pass.

### Add Offline / Low Network State

Retail shops may have poor internet.

Show:

```text
Connecting...
Retry
Terminal offline alert
Cached last stamp count read-only
```

But never allow offline stamp increment.

---

# 27. Master Prompt For AI To Fix Entire Project

Copy this prompt and give it to your AI coding assistant with your project files.

```text
You are a senior application security engineer, backend architect, and full-stack Node.js/Next.js developer.

I own this project and want a defensive security review and complete remediation. Do not provide offensive exploit instructions. Focus on finding mistakes and fixing them securely.

Project name: StickTheBizz
Public site: https://stickthebizz.vercel.app/
Local dev site: http://localhost:3000/
Project path: E:\SaaS
Project type: SaaS digital loyalty punch card system for Indian retail shops.

Core features:
- Shop registration
- Counter QR standee
- Customer scans QR
- Customer OTP verification
- Browser-based digital loyalty pass
- Strict 1 scan per customer per shop per calendar day
- Automatic reset at 12:00:00 AM IST
- Merchant/cashier terminal
- Real-time WebSocket audio chime
- Cashier 1-tap approval or PIN verification
- Reward tracking and redemption
- Analytics dashboard
- Claims of DPDP-aligned privacy and masked phone numbers

Your job:
1. Deeply analyze the attached codebase.
2. Identify all security, privacy, business-logic, authentication, authorization, rate-limiting, data-integrity, WebSocket, frontend, backend, database, deployment, and compliance mistakes.
3. Prioritize findings as P0 critical, P1 high, P2 medium, P3 low.
4. For each finding, provide:
   - Vulnerability name
   - CWE category if applicable
   - Affected files/functions
   - Evidence from code
   - Business impact
   - Exact secure fix
   - Code patch or diff
   - Test case to verify fix
5. After audit, implement fixes in a safe, production-ready way.
6. Preserve existing UX and business features unless they are insecure.
7. If required files are missing, tell me exactly which files/logs/schema/environment variables I must provide.

Assumed stack if not obvious from files:
- Next.js or Node.js frontend/backend
- API routes/serverless functions
- Database such as PostgreSQL/MongoDB/Prisma/Supabase/Firebase
- WebSocket using Socket.IO/native ws/Pusher/Ably
- OTP via SMS/WhatsApp/email provider
- Deployment on Vercel

Important security requirements to enforce:

A. Server-authoritative loyalty state
- Never trust localStorage, sessionStorage, cookies, URL params, or client timestamps for stamp count or reward eligibility.
- Store pass state, visit count, last visit date, reward status in database.
- Frontend only displays server-returned state.

B. Strict daily scan limit
- Calculate current date using server time in Asia/Kolkata IST.
- Ignore client-provided time.
- Prevent duplicate scan per shop/customer/calendar day.
- Use database unique constraint:
  UNIQUE(shop_id, customer_id, visit_date_IST)
- Use atomic transaction or upsert to prevent race conditions.
- Handle concurrent duplicate requests safely.

C. OTP security
- OTP must be 6 digits or more.
- Generate using cryptographically secure random.
- Store OTP hashed, not plaintext.
- Set short expiry, ideally 3-5 minutes.
- Make OTP single-use.
- Invalidate after successful verification.
- Rate limit OTP request and verification by phone, IP, and account.
- Lock after repeated failed attempts.
- Never log plaintext OTP.
- Provide development mock OTP only when NODE_ENV !== production.

D. Authentication and sessions
- Use secure session management.
- Prefer httpOnly, Secure, SameSite cookies.
- If JWT is used, sign securely, keep short expiry, support revocation.
- Do not store sensitive tokens in localStorage if avoidable.
- Protect against session fixation and replay.
- Implement logout and token invalidation.

E. Authorization and multi-tenant isolation
- Every shop data query must be scoped to authenticated shop/user.
- Do not trust shopId/customerId from request body alone.
- Prevent IDOR across shops, customers, visits, analytics, terminals.
- Implement roles: owner, manager, cashier, customer.
- Cashier approval endpoint must verify user is authorized for that shop.

F. Merchant approval security
- Approval must be authenticated.
- Approval must reference server-created visit/request ID.
- Prevent customer self-approval.
- Prevent replay of approval.
- Log who approved what and when.
- If PIN is used, hash it, rate-limit it, and prefer cashier login/session.

G. Reward redemption security
- Reward eligibility must be server-calculated.
- Once reward is earned, issue one-time redemption token/code.
- Redemption must be atomic and irreversible.
- Prevent repeated redemption of same reward cycle.
- Track redemption status: eligible, issued, redeemed, expired, cancelled.

H. WebSocket security
- Authenticate WebSocket handshake.
- Authorize channels by shop/user.
- Validate every incoming event with schema.
- Reject unauthorized events.
- Rate-limit WebSocket messages.
- Do not expose full phone numbers or secrets.
- Disconnect abusive clients.
- Use WSS in production.

I. Input validation
- Validate all request bodies, query params, headers, route params.
- Use schema validation such as Zod.
- Reject unexpected fields.
- Sanitize/escape output.
- Prevent XSS, SQL injection, NoSQL operator injection, command injection, prototype pollution.

J. QR and URL safety
- QR URL must use signed/opaque token.
- Do not allow client-controlled shop rules from URL.
- Prevent open redirect.
- Validate redirect destinations with allowlist.

K. Web security headers
- Add strict headers:
  X-Frame-Options
  X-Content-Type-Options
  Referrer-Policy
  Strict-Transport-Security
  Permissions-Policy
  Content-Security-Policy or CSP Report-Only first
- Configure CORS with explicit allowlist.
- Do not use origin:* with credentials.

L. Secrets and environment
- Detect secrets in frontend code, repo, logs, env files.
- Ensure .env files are gitignored.
- Move secrets to backend/Vercel environment variables.
- Provide safe .env.example.
- Never expose SMS/OTP/database/admin secrets to client.

M. Logging, monitoring, audit
- Add audit logs for:
  OTP request
  OTP verify success/failure
  scan created
  scan duplicate rejected
  visit approved/rejected
  reward redeemed
  merchant login
  settings changed
  unauthorized access attempts
- Mask phone numbers.
- Do not log OTPs, passwords, full tokens.
- Add basic anomaly alerts if feasible.

N. Privacy / DPDP alignment
- Review consent flow for customer phone number.
- Ensure data minimization.
- Provide privacy policy suggestions.
- Support customer data deletion/anonymization.
- Support shop data export/deletion.
- Ensure cashier displays mask phone numbers.
- Avoid claiming absolute legal compliance unless reviewed by lawyer. Use “designed to support DPDP compliance”.

O. Reliability and data integrity
- Add database indexes for common queries.
- Use transactions where multiple writes occur.
- Add idempotency keys for scan/approve/redeem.
- Handle network retries safely.
- Return clear but non-sensitive error messages.
- Add loading, success, duplicate, expired, rate-limited, unauthorized states.

P. Testing
- Create unit/integration tests for:
  duplicate scan prevention
  timezone reset
  OTP expiry
  OTP attempt limit
  unauthorized approval
  cross-shop access
  reward one-time redemption
  websocket auth
  input validation
  rate limiting
- Create manual QA checklist.

Deliverables:

1. Executive security summary.
2. Full vulnerability report table.
3. File-by-file code review.
4. Patch/diff for each fix.
5. Updated database schema/migrations if needed.
6. Updated API contracts.
7. Updated environment variable list.
8. Updated frontend components if needed.
9. Backend middleware for auth/rate-limit/validation.
10. WebSocket auth/authz implementation.
11. Security headers configuration.
12. Test cases and commands.
13. Deployment checklist for Vercel.
14. Local development checklist.
15. Final acceptance criteria.

Acceptance criteria:
- Changing localStorage cannot alter stamp count.
- Changing device clock cannot bypass daily limit.
- Two simultaneous scans create only one visit.
- Expired/wrong OTP cannot be reused.
- Repeated OTP attempts are blocked.
- Customer cannot call merchant approval API successfully.
- Shop A cannot access Shop B data.
- Unauthorized WebSocket connection is rejected.
- Unauthorized WebSocket channel subscription is rejected.
- Reward can be redeemed only once.
- No secrets appear in frontend bundle.
- Security headers are present.
- CORS is restrictive.
- Errors do not leak internal details.
- Logs mask phone numbers and omit OTPs.

First, inspect the attached files and tell me what is missing. Then produce the audit. Then produce the fixes. If the codebase is too large, break work into phases and start with P0 critical fixes.
```

---

# 28. Phase Prompts If Master Prompt Is Too Large

Use these one by one.

## Phase Prompt 1: P0 Critical Loyalty Logic

```text
You are a secure backend engineer. Analyze my StickTheBizz loyalty system code and database schema.

Goal: make loyalty stamps and daily scan limit server-authoritative and cheat-proof.

Requirements:
- Remove trust in localStorage/sessionStorage/client timestamps.
- Store customer pass state in database.
- Enforce one scan per customer per shop per calendar day using Asia/Kolkata IST.
- Prevent race conditions with unique constraint and atomic transaction/upsert.
- Add reward eligibility and one-time redemption token.
- Add audit logs for scan, duplicate rejection, approval, redemption.
- Provide SQL/Prisma/Drizzle/Mongoose schema changes depending on my stack.
- Provide API endpoint code for scan, get pass, approve visit, redeem reward.
- Provide test cases.

Files to inspect:
- database schema
- API routes for scan/pass/reward
- frontend pass component
- auth/session middleware

Output:
1. Found mistakes
2. Secure schema
3. Backend code patch
4. Tests
```

## Phase Prompt 2: OTP Security

```text
You are an authentication security engineer. Review and fix my OTP login/verification flow for StickTheBizz.

Requirements:
- OTP must be 6 digits, cryptographically random.
- Store OTP hashed, not plaintext.
- Expiry 3-5 minutes.
- Single-use.
- Invalidate after success.
- Rate limit by phone number, IP, and account.
- Limit verification attempts.
- Lockout/backoff after failures.
- Never log plaintext OTP.
- Development mock OTP only outside production.
- Return secure generic errors.
- Add tests for expiry, reuse, brute force protection, rate limit.

Provide:
- OTP table/schema
- request OTP endpoint
- verify OTP endpoint
- rate limiter config
- test cases
```

## Phase Prompt 3: Merchant Authorization

```text
You are a multi-tenant SaaS security engineer. Fix merchant/cashier authorization in StickTheBizz.

Requirements:
- Roles: owner, manager, cashier, customer.
- Cashier terminal must authenticate.
- Approval endpoint must verify user belongs to shop and has permission.
- Do not trust shopId from request body alone.
- Prevent cross-shop IDOR.
- Prevent customer self-approval.
- Log approval with cashier ID, visit ID, timestamp.
- If PIN is used, hash it and rate-limit attempts.
- Provide middleware and API patch.
- Provide tests for unauthorized approval and cross-shop access.
```

## Phase Prompt 4: WebSocket Security

```text
You are a realtime systems security engineer. Secure my WebSocket cashier terminal for StickTheBizz.

Requirements:
- Authenticate WebSocket handshake.
- Authorize channels by shop/user.
- Validate all incoming events using schema.
- Reject unauthorized approve/reject events.
- Rate-limit messages.
- Mask phone data.
- Do not expose OTPs or secrets.
- Disconnect abusive clients.
- Use WSS in production.
- Provide server code, client code, and tests.
```

## Phase Prompt 5: Frontend And Vercel Hardening

```text
You are a frontend security engineer. Harden my StickTheBizz Next.js/Vercel app.

Requirements:
- Add security headers:
  X-Frame-Options
  X-Content-Type-Options
  Referrer-Policy
  Strict-Transport-Security
  Permissions-Policy
  CSP or CSP Report-Only
- Configure strict CORS.
- Remove secrets from frontend.
- Avoid localStorage for sensitive state.
- Validate API responses.
- Prevent XSS in shop name, reward name, customer name, messages.
- Prevent open redirect.
- Provide next.config.js or vercel.json changes.
- Provide checklist to verify headers.
```

## Phase Prompt 6: DPDP Privacy Review

```text
You are a privacy engineer familiar with India DPDP Act concepts. Review StickTheBizz for customer data privacy.

Requirements:
- Identify where phone numbers are collected, stored, displayed, logged, exported.
- Ensure consent language is clear.
- Ensure data minimization.
- Mask phone numbers on cashier UI.
- Avoid logging full phone numbers.
- Provide deletion/anonymization flow.
- Provide privacy policy outline.
- Provide grievance/support contact suggestion.
- Do not claim absolute legal compliance; suggest wording like “designed to support DPDP compliance”.
```

---

# 29. Local Commands To Run

From:

```text
E:\SaaS
```

Run:

## Install Dependencies Safely

```bash
npm ci
```

or if no lockfile:

```bash
npm install
```

## Audit Dependencies

```bash
npm audit
npm audit --production
npm outdated
```

## Lint

If ESLint configured:

```bash
npx eslint . --ext .js,.jsx,.ts,.tsx
```

If Next.js:

```bash
npx next lint
```

## TypeScript Check

```bash
npx tsc --noEmit
```

## Search Secrets

```bash
npx secretlint "**/*"
```

If secretlint not available, manually search for:

```text
SECRET
KEY
TOKEN
PASSWORD
DATABASE_URL
OTP
SMS
WHATSAPP
RESEND
TWILIO
FIREBASE
MONGO
POSTGRES
RAZORPAY
STRIPE
```

## Check Public Headers

```bash
curl -I https://stickthebizz.vercel.app/
```

Also use:

```text
https://securityheaders.com
```

## Run Tests

```bash
npm test
```

## Build Production

```bash
npm run build
```

## Start Local

```bash
npm run dev
```

---

# 30. File/Folder Review Checklist

Ask AI or reviewer to inspect these files:

```text
package.json
next.config.js / next.config.mjs
vercel.json if exists
.env.example
.gitignore
README.md

/app
/pages
/components
/lib
/server
/api
/db
/prisma
/drizzle
/src
/middleware.ts
/middleware.js

auth files
otp files
scan files
merchant files
cashier terminal files
websocket files
reward files
analytics files
upload files
payment files if any
admin files if any
error handler files
logger files
schema validation files
test files
```

---

# 31. Final Acceptance Checklist

Before saying “fixed”, verify all:

## Loyalty Logic

- [ ] Stamp count comes from server database.
- [ ] localStorage cannot change stamp count.
- [ ] Server uses IST date from server clock.
- [ ] Client timestamp ignored.
- [ ] Unique DB constraint prevents duplicate daily scan.
- [ ] Concurrent scans create only one visit.
- [ ] Duplicate scan returns clear message.
- [ ] Reward eligibility calculated by server.
- [ ] Reward redemption code is one-time.
- [ ] Redeemed reward cannot be reused.

## OTP

- [ ] OTP is 6 digits minimum.
- [ ] OTP is cryptographically random.
- [ ] OTP is hashed in DB.
- [ ] OTP expires in 3-5 minutes.
- [ ] OTP is single-use.
- [ ] OTP attempts limited.
- [ ] OTP request rate limited.
- [ ] OTP verify rate limited.
- [ ] OTP not logged.
- [ ] Development mock disabled in production.

## Auth / Merchant

- [ ] Merchant login required for terminal.
- [ ] Cashier role exists.
- [ ] Approval endpoint verifies shop membership.
- [ ] Customer cannot approve visits.
- [ ] Shop A cannot access Shop B data.
- [ ] PIN hashed if used.
- [ ] PIN attempts rate limited.
- [ ] Approvals logged with cashier ID.

## WebSocket

- [ ] WebSocket handshake authenticated.
- [ ] Channels authorized by shop/user.
- [ ] Incoming events validated.
- [ ] Unauthorized events rejected.
- [ ] Messages rate limited.
- [ ] Full phone numbers not emitted.
- [ ] WSS used in production.

## Web Security

- [ ] Security headers present.
- [ ] CSP or CSP report-only configured.
- [ ] CORS strict allowlist.
- [ ] CSRF protected if cookies used.
- [ ] httpOnly secure cookies used.
- [ ] No secrets in frontend.
- [ ] Input validation on all endpoints.
- [ ] XSS prevented.
- [ ] Open redirect prevented.
- [ ] Errors generic.
- [ ] Dependencies audited.

## Privacy / DPDP

- [ ] Consent captured.
- [ ] Privacy policy linked.
- [ ] Phone masked on cashier UI.
- [ ] Deletion request process exists.
- [ ] Audit logs for data access.
- [ ] Public wording not overclaiming legal compliance.

## Operations

- [ ] Staging environment exists.
- [ ] Backups enabled.
- [ ] Monitoring enabled.
- [ ] Error tracking enabled.
- [ ] Uptime monitoring enabled.
- [ ] Incident response plan drafted.

---

# 32. Risk Register Table

| ID | Risk | Severity | Likely Impact | Fix |
|---|---|---:|---|---|
| R1 | Browser stamp manipulation | P0 | Free rewards | Server DB state |
| R2 | Client time bypass | P0 | Extra scans | Server IST date |
| R3 | Duplicate scan race | P0 | Extra stamps | Unique constraint + transaction |
| R4 | OTP brute force | P0 | Account takeover | Rate limit + hash + expiry |
| R5 | Fake merchant approval | P0 | Reward theft | Auth + role + shop scope |
| R6 | WebSocket abuse | P0 | Privacy/fraud | Auth + channel authz |
| R7 | Reward repeated redemption | P0 | Financial loss | One-time redemption token |
| R8 | Cross-shop IDOR | P0/P1 | Data breach | Scoped queries |
| R9 | QR param tampering | P1 | Fraud | Signed opaque token |
| R10 | Missing headers | P1 | XSS/clickjacking | Vercel/Next headers |
| R11 | Open CORS | P1 | Data abuse | Allowlist |
| R12 | Secrets in frontend | P1 | Key leakage | Backend env only |
| R13 | No input validation | P1 | Injection/XSS | Zod/schema |
| R14 | No audit logs | P2 | Disputes unresolved | Event logging |
| R15 | DPDP overclaim | P2 | Legal/trust risk | Compliance controls + wording |
| R16 | No monitoring | P2 | Late breach detection | Sentry/logs/alerts |
| R17 | No backup | P2 | Data loss | DB backups/restore test |
| R18 | Poor UX trust | P3 | Lower conversion | Demo/screenshots/support |

---

# 33. 30-Day Fix Roadmap

## Day 1-3: P0 Critical Backend

- Move stamp count to server DB.
- Add visits table unique constraint.
- Implement server IST date.
- Fix duplicate scan race condition.
- Add merchant approval authorization.
- Add reward redemption one-time token.

## Day 4-6: OTP Security

- Convert OTP to 6-digit secure.
- Hash OTP.
- Add expiry.
- Add attempts limit.
- Add rate limiting.
- Add development mock safely.

## Day 7-9: WebSocket Security

- Authenticate handshake.
- Authorize channels.
- Validate events.
- Rate limit messages.
- Mask phone data.
- Test unauthorized connections.

## Day 10-12: Tenant Isolation

- Add roles.
- Scope all queries by authenticated shop/customer.
- Test Shop A vs Shop B.
- Fix IDOR endpoints.
- Add audit logs for unauthorized attempts.

## Day 13-15: Web Hardening

- Add security headers.
- Configure CORS.
- Add CSP report-only.
- Add input validation.
- Fix error leakage.
- Remove frontend secrets.

## Day 16-18: Privacy / DPDP

- Add consent flow.
- Add privacy policy.
- Mask phone numbers.
- Add deletion request process.
- Review public wording.
- Add grievance/contact page.

## Day 19-21: Reliability

- Add idempotency keys.
- Add monitoring.
- Add error tracking.
- Add backups.
- Add staging environment.
- Add uptime alerts.

## Day 22-24: Testing

- Write unit tests.
- Write integration tests.
- Manual QA checklist.
- Load test scan endpoint.
- Test concurrent approvals.
- Test OTP brute force protection.

## Day 25-27: Website Trust Improvements

- Add screenshots.
- Add demo video.
- Add live demo mode.
- Add anti-fraud trust section.
- Add support/WhatsApp.
- Add regional language support.

## Day 28-30: Launch Prep

- Dependency audit.
- Secret scan.
- Vercel env review.
- Production build.
- Final acceptance checklist.
- Deploy to staging.
- Deploy to production.
- Monitor logs for 48 hours.

---

# 34. Minimum Viable Secure Feature Set

If you need to launch fast, do not skip these:

Must-have:

```text
server-side stamp count
server-side IST daily reset
unique DB constraint for daily visit
OTP rate limiting
OTP expiry
merchant authenticated approval
reward one-time redemption
WebSocket authentication
basic security headers
input validation
no secrets in frontend
audit logs for scan/approve/redeem
```

Can delay:

```text
advanced fraud detection
full CSP enforcement
multi-language
advanced analytics
admin panel
automated anomaly alerts
penetration test by external firm
```

But do not delay the must-have list.

---

# 35. What A Real Attacker Would Try First

For your own defensive testing, simulate these safely on localhost/staging:

1. Edit localStorage stamp count.
2. Change device time.
3. Scan twice rapidly.
4. Open two tabs and scan simultaneously.
5. Request OTP many times.
6. Enter wrong OTP many times.
7. Reuse old OTP.
8. Call merchant approve API as customer.
9. Change shopId in request.
10. Access Shop B URL while logged into Shop A.
11. Connect WebSocket without token.
12. Subscribe to another shop channel.
13. Redeem reward twice.
14. Tamper QR token.
15. Check security headers.
16. Search frontend JS bundle for secrets.

If all these fail safely, your system is much stronger.

---

# 36. Secure Coding Rules For Your Team

Add these rules to your project README or contributor guide:

```text
1. Never trust client input.
2. Never store reward state only in browser.
3. Never use client time for business rules.
4. Always validate request schemas.
5. Always scope DB queries by authenticated user/shop.
6. Always use transactions for multi-step writes.
7. Always rate limit auth and reward endpoints.
8. Always hash OTPs and secrets.
9. Always log security-relevant events.
10. Never log plain OTP/password/token.
11. Never expose internal errors to users.
12. Never put private keys in frontend.
13. Always test duplicate/retry/concurrent requests.
14. Always use HTTPS/WSS in production.
15. Always review dependencies for vulnerabilities.
```

---

# 37. Suggested README Security Section

Add to your project README:

```md
## Security Principles

StickTheBizz follows a server-authoritative security model:

- Loyalty stamps are stored in the database, not browser storage.
- Daily scan limits are enforced using server-generated IST dates.
- Duplicate scans are prevented with database unique constraints and transactions.
- OTPs are hashed, short-lived, single-use, and rate-limited.
- Merchant approvals require authenticated cashier sessions and shop authorization.
- Reward redemption uses one-time codes and atomic status updates.
- WebSocket connections are authenticated and channel-authorized.
- Customer phone numbers are masked in cashier UI and logs where possible.
- Security headers and strict CORS are enforced in production.
```

---

# 38. Suggested Public Trust Section For Website

Add this to homepage:

```text
How We Prevent Loyalty Fraud

- Stamps are verified on our server, not stored only on your phone.
- Customers cannot edit browser data to get free rewards.
- Daily reset uses secure server time in IST.
- Each customer can scan only once per shop per day.
- Cashier approval is required and logged.
- Rewards use one-time redemption codes.
- Customer phone numbers are masked on cashier screens.
- OTPs are rate-limited and expire quickly.
```

This increases shopkeeper trust.

---

# 39. Suggested Privacy Policy Outline

```text
1. Who we are
2. What data we collect
   - mobile number
   - shop visit data
   - device/browser metadata
   - consent records
3. Why we collect it
   - loyalty visits
   - reward tracking
   - fraud prevention
   - support
4. Legal basis / consent
5. How data is stored
6. How data is masked
7. Who can access data
   - shop owner
   - authorized cashier
   - internal support with controls
8. Data sharing
   - SMS provider
   - hosting provider
   - payment provider if applicable
   - no sale of data
9. Retention period
10. Customer rights
   - access
   - correction
   - deletion
   - grievance
11. Security measures
12. Policy changes
13. Contact / grievance officer
```

---

# 40. Suggested Terms Outline

```text
1. Service description
2. Shop responsibilities
3. Customer responsibilities
4. Loyalty rules
   - minimum bill
   - daily limit
   - cashier approval
   - reward expiry
5. Fraud prohibition
6. Account suspension
7. Data privacy reference
8. Payment and subscription
9. Refund policy
10. Limitation of liability
11. Governing law
12. Contact
```

---

# 41. Final One-Paragraph Summary

StickTheBizz should be built as a server-authoritative loyalty system. The browser can show the pass, but the database must own stamp counts, daily limits, reward eligibility, and redemption status. OTPs must be hashed, short-lived, single-use, and rate-limited. Merchant approvals must require authenticated cashier sessions and shop-scoped authorization. WebSocket terminals must authenticate connections and authorize channels. Daily reset must use server IST time and database unique constraints to prevent race conditions. Rewards must use one-time redemption codes. Add security headers, strict CORS, input validation, audit logs, masked phone numbers, DPDP-aligned consent and deletion flows, monitoring, backups, and staging tests. On the website side, add real screenshots, demo video, anti-fraud trust section, support contact, privacy/terms links, clearer pricing, onboarding steps, and regional language support.

---

# 42. Absolute Priority Order

Fix in this exact order:

1. Server-side stamp count.
2. Server-side IST daily reset.
3. Unique DB constraint for daily visit.
4. Atomic transaction for scan.
5. Merchant approval authentication/authorization.
6. OTP hashing/expiry/attempts/rate limit.
7. Reward one-time redemption.
8. WebSocket auth/channel authz.
9. Tenant isolation / IDOR fixes.
10. Security headers / CORS / input validation.
11. Audit logs.
12. Privacy / DPDP consent / deletion.
13. Monitoring / backups / staging.
14. Website trust improvements.

---

# 43. Final Checklist Before You Say “Done”

Print this and tick:

```text
[ ] localStorage cannot change stamps
[ ] device time cannot bypass daily limit
[ ] double scan creates only one visit
[ ] concurrent scan creates only one visit
[ ] OTP expires
[ ] OTP single-use
[ ] OTP attempts limited
[ ] OTP request rate limited
[ ] customer cannot approve visit
[ ] cashier can approve only own shop visit
[ ] Shop A cannot see Shop B data
[ ] WebSocket requires auth
[ ] WebSocket channel authorization works
[ ] reward code works once only
[ ] QR token tamper rejected
[ ] security headers present
[ ] CORS strict
[ ] no secrets in frontend
[ ] input validation present
[ ] errors generic
[ ] audit logs present
[ ] phone masked in UI/logs
[ ] privacy policy linked
[ ] consent stored
[ ] deletion request possible
[ ] backups enabled
[ ] monitoring enabled
[ ] staging tested
[ ] production deploy reviewed
```

---

End of master file.


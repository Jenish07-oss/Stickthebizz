# PROJECT CONTEXT & ARCHITECTURE HANDOVER
**Project Name:** StickTheBizz (SaaS 2.0 Decoupled Architecture)  
**Handover Date:** November 7, 2026  
**Target Audience:** AI Engineering Assistants (ChatGPT / Claude / Copilot) & Full-Stack Developers  
**Repository Working Directory:** `E:/SaaS` (Git Branch: `main`)

---

## 1. Project Overview

### 1.1 Purpose & Vision
StickTheBizz is a multi-tenant B2B2C digital retail loyalty and stamp-pass SaaS built for Indian retail counters (cafes, chai points, bakeries, dairy parlors, and local stores). 

In traditional Indian retail, physical paper stamp cards or complex native apps suffer from near-zero adoption. StickTheBizz eliminates friction:
- **Zero App Installation:** Customers scan a physical acrylic QR standee placed on the counter via their mobile camera.
- **Instant Web Stamp Card:** Unlocks a digital stamp grid in mobile Safari/Chrome with 1 scan per calendar day lock.
- **Fastify Real-Time Terminal:** Shop owners run a live counter dashboard on any tablet or phone that chimes on every scan and lets cashiers approve/reject check-ins with 1 tap.
- **B2B Subscription Monetization:** Store owners subscribe to monthly (₹749) or yearly (₹6,999) recurring plans managed via Razorpay with promotional discounts and a 24-hour grace period engine.

### 1.2 Target Users & Platforms
1. **Retail Customers (B2C):** Mobile web users scanning counter QR codes. Authenticate via transactional 6-digit Email OTP (Resend) and punch daily visits.
2. **Shop Owners / Cashiers (B2B):** Desktop/tablet/mobile counter operators managing live queues, approving visits, and burning 4-digit PIN reward vouchers.
3. **Platforms:** Desktop & mobile browsers (Chrome, Safari, Edge, Brave). PWA-ready standee counter display with strictly isolated 1-page printing.

### 1.3 Current Development Stage
- **Stage:** Production-Ready Decoupled Monorepo (Version 2.0.0).
- **Frontend Deployment:** Vercel Production ([https://stickthebizz.in](https://stickthebizz.in)).
- **Backend Deployment:** Render Production Web Service (`https://stickthebizz.onrender.com`).
- **Database:** Supabase Managed PostgreSQL (`aws-1-eu-central-1.pooler.supabase.com:6543`).

---

## 2. Complete Architecture

The application is architected as an **independent two-service monorepo** with zero shared runtime dependencies between frontend and backend:

```mermaid
flowchart TB
    subgraph Client ["Client Layer (Browsers & Standees)"]
        CustomerUI["Customer Mobile Pass (/s/:slug)"]
        OwnerUI["Merchant Cashier Dashboard (/owner/dashboard)"]
    end

    subgraph FrontendService ["Frontend Service (Vercel)"]
        NextApp["Next.js 14 App Router (SSR & Client UI)"]
        AuthCtx["React AuthContext (Atomic State Sync)"]
        ApiClient["Typed ApiClient (credentials: include)"]
        WSHook["useTerminalSocket Hook (Heartbeat & Audio)"]
    end

    subgraph BackendService ["Backend Service (Render)"]
        FastifyServer["Fastify 4 REST API Server (:10000)"]
        WSServer["@fastify/websocket (/ws)"]
        AuthEngine["HMAC OTP & JWT Session Engine"]
        ISTEngine["IST Date Engine (Asia/Kolkata)"]
        CronEngine["Midnight IST Daily Reset Cron"]
    end

    subgraph DatabaseLayer ["Cloud Database & Third Parties"]
        PrismaORM["Prisma ORM (5.16.0)"]
        SupabasePG["Supabase PostgreSQL (Transaction Pooler :6543)"]
        RazorpayGateway["Razorpay Payments & Webhooks"]
        ResendMail["Resend Email API (Transaction OTPs)"]
    end

    CustomerUI --> NextApp
    OwnerUI --> NextApp
    NextApp --> AuthCtx
    AuthCtx --> ApiClient
    OwnerUI --> WSHook

    ApiClient -- "HTTPS (Bearer + Cookies)" --> FastifyServer
    WSHook -- "WSS (Live Terminal Feed)" --> WSServer

    FastifyServer --> AuthEngine
    FastifyServer --> ISTEngine
    FastifyServer --> CronEngine
    FastifyServer --> PrismaORM
    WSServer --> PrismaORM

    PrismaORM --> SupabasePG
    FastifyServer --> RazorpayGateway
    AuthEngine --> ResendMail
```

### 2.1 Architectural Pillars
1. **Decoupled Service Isolation:** The frontend (`frontend/`) contains zero `@supabase/*` SDKs, zero database credentials, and zero Server Actions. It communicates with the backend exclusively via REST APIs and WebSockets.
2. **Supabase As PostgreSQL Only:** Supabase GoTrue Auth and client-side Row-Level Security (RLS) were completely removed. Prisma ORM connects directly to PostgreSQL via the Supavisor connection pooler (`port 6543`).
3. **State Synchronization & Cross-Origin Cookies:**
   - Fastify sets `SameSite=None; Secure; HttpOnly` cookies (`access_token`, `refresh_token`).
   - Frontend fetch client uses `credentials: "include"` and caches in-memory Bearer tokens with `localStorage` (`stb_access_token`) fallback.
   - Login dispatches are atomic: state and memory update *before* Next.js triggers `router.refresh()` and `router.replace()`.
4. **Strict IST Governance:** All daily scan calculations, midnight resets, and unique scan constraints evaluate against Indian Standard Time (`Asia/Kolkata` / UTC+05:30), preventing timezone drift.
5. **Real-time Terminal WebSockets:** Fastify exposes `/ws` for live cashier queue updates (`checkin.new`, `checkin.approved`, `checkin.rejected`, `reward_burned`, `qr_rotated`) with HTML5 audio chime triggers.

---

## 3. Complete Folder & File Structure

```
E:/SaaS/
├── backend/                       # Fastify 4 + TypeScript + Prisma Backend
│   ├── prisma/
│   │   └── schema.prisma          # PostgreSQL schema (users, merchants, visits, etc.)
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts              # Global PrismaClient singleton
│   │   │   ├── env.ts             # Zod environment variable validation
│   │   │   ├── razorpay.ts        # Razorpay SDK client & HMAC helpers
│   │   │   └── resend.ts          # Resend transactional email client
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts         # Customer OTP & Owner login/register
│   │   │   ├── customer.controller.ts     # Multi-store wallet & DPDP export
│   │   │   ├── merchant.controller.ts     # Counter rules, PIN, & QR rotation
│   │   │   ├── scan.controller.ts         # Punch, Approve, Reject, & Redeem
│   │   │   ├── subscription.controller.ts # Plans, Promos, & Razorpay orders
│   │   │   └── webhook.controller.ts      # Raw body Razorpay webhook verification
│   │   ├── cron/
│   │   │   └── daily-reset.cron.ts        # 12:00 AM IST daily reset scheduler
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts         # JWT access token & session verification
│   │   │   ├── error.middleware.ts        # Prisma, Zod & HTTP global error handler
│   │   │   ├── ratelimit.middleware.ts    # In-memory IP rate limiter
│   │   │   └── validate.middleware.ts     # Request body Zod validator
│   │   ├── routes/
│   │   │   ├── auth.routes.ts             # /api/v1/auth/*
│   │   │   ├── customer.routes.ts         # /api/v1/customers/*
│   │   │   ├── merchant.routes.ts         # /api/v1/merchant/*
│   │   │   ├── scan.routes.ts             # /api/v1/scans/*
│   │   │   ├── subscription.routes.ts     # /api/v1/subscriptions/*
│   │   │   ├── webhook.routes.ts          # /api/v1/webhooks/razorpay
│   │   │   ├── health.routes.ts           # /api/v1/health
│   │   │   ├── cron.routes.ts             # /api/v1/cron/daily-reset
│   │   │   └── index.ts                   # Central route registrar
│   │   ├── services/
│   │   │   ├── auth.service.ts            # Password/PIN validation & JWT sessions
│   │   │   ├── customer.service.ts        # Multi-shop stamp aggregation
│   │   │   ├── email.service.ts           # HTML OTP delivery template
│   │   │   ├── merchant.service.ts        # Business rule persistence
│   │   │   ├── otp.service.ts             # HMAC-SHA256 OTP generator & verifier
│   │   │   ├── scan.service.ts            # Daily lock, queue, & stamp burning
│   │   │   └── subscription.service.ts    # Razorpay orders & 24h grace engine
│   │   ├── utils/
│   │   │   ├── ist.ts                     # Asia/Kolkata date calculations
│   │   │   ├── jwt.ts                     # Access & Refresh token signing
│   │   │   ├── pricing.ts                 # Plan rates, discounts & promo logic
│   │   │   └── sanitize.ts                # Phone cleaner & input sanitizers
│   │   ├── websocket/
│   │   │   ├── server.ts                  # @fastify/websocket mount (/ws)
│   │   │   └── terminal.socket.ts         # Terminal connection manager & dispatchers
│   │   └── server.ts                      # Fastify buildServer & listen entrypoint
│   ├── tests/
│   │   └── phase2.test.ts                 # 29-step automated regression test suite
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                      # Next.js 14 App Router Standalone Frontend
│   ├── public/                    # Audio chimes, manifest, icons
│   │   ├── sounds/chime.mp3       # Counter cashier audio alert
│   │   ├── icon.svg
│   │   └── manifest.json
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                   # Landing page with interactive demo
│   │   │   ├── layout.tsx                 # Root layout with Toast & AuthProvider
│   │   │   ├── globals.css                # Tailwind base styles
│   │   │   ├── auth/
│   │   │   │   ├── customer/login/page.tsx# 6-Digit Email OTP verification
│   │   │   │   ├── owner/login/page.tsx   # Owner password & PIN login
│   │   │   │   └── owner/register/page.tsx# 2-minute counter onboarding
│   │   │   ├── customer/
│   │   │   │   └── dashboard/page.tsx     # Multi-store digital loyalty wallet
│   │   │   ├── owner/
│   │   │   │   ├── dashboard/page.tsx     # Cashier live terminal & incoming queue
│   │   │   │   └── profile/page.tsx       # Billing, standee print & store settings
│   │   │   ├── s/[slug]/page.tsx          # Standee mobile QR scan landing pass
│   │   │   ├── pricing/page.tsx           # B2B pricing comparison table
│   │   │   ├── how-it-works/page.tsx      # Retail workflow explainer
│   │   │   ├── privacy/page.tsx           # DPDP 2023 compliance policy
│   │   │   ├── terms/page.tsx             # Merchant subscription terms
│   │   │   ├── grievance/page.tsx         # Customer grievance redressal
│   │   │   ├── contact/page.tsx           # Support contact information
│   │   │   └── about/page.tsx             # Brand story & company background
│   │   ├── components/
│   │   │   ├── landing/                   # InteractiveStampPass, ROICalculator
│   │   │   ├── merchant/                  # CheckInQueue, VoucherRedemption, PrintStandee
│   │   │   ├── ui/                        # Toast, OfflineBanner
│   │   │   ├── CounterQR.tsx              # Standee renderer with 1-page iframe printing
│   │   │   ├── CustomerView.tsx           # Mobile stamp card UI & confetti celebrations
│   │   │   ├── StampGrid.tsx              # Dynamic visual stamp punch grid
│   │   │   ├── RewardTicket.tsx           # 4-Digit voucher redemption card
│   │   │   ├── Navbar.tsx                 # Brand header & navigation
│   │   │   └── Footer.tsx                 # Site footer & policy links
│   │   ├── context/
│   │   │   └── AuthContext.tsx            # Global auth state, session check & refresh
│   │   ├── lib/
│   │   │   ├── api/client.ts              # Typed fetch API client with auto 401 retry
│   │   │   ├── ws/useTerminalSocket.ts    # WebSocket client hook with heartbeat ping
│   │   │   └── audio.ts                   # Synthesized Web Audio API sound fallbacks
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.ts
│
├── .gitignore                     # Monorepo build artifact & secret filters
├── package.json                   # Root convenience scripts (dev:*, build:*)
└── README.md                      # Architecture summary & setup guide
```

---

## 4. Technology Stack & Verifiable Versions

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Monorepo Runtime** | Node.js | `>=20.14.0` | Execution engine (Windows local, Linux cloud) |
| **Backend Framework** | Fastify | `^4.28.1` | High-performance HTTP server (`<1.5ms` response) |
| **Backend WebSocket** | `@fastify/websocket` | `^10.0.1` | Low-latency duplex terminal queue feed |
| **Backend Cookies** | `@fastify/cookie` | `^9.3.1` | HTTP-only session and refresh token management |
| **Backend CORS** | `@fastify/cors` | `^9.0.1` | Cross-origin access control with credentials |
| **Backend Raw Body** | `fastify-raw-body` | `^4.3.0` | Raw byte buffering for Razorpay HMAC verification |
| **Database ORM** | Prisma | `^5.16.0` | PostgreSQL type-safe schema & query builder |
| **Database Engine** | PostgreSQL (Supabase) | `15.x` | Managed database in Frankfurt (`eu-central-1`) |
| **Frontend Framework** | Next.js | `^14.2.24` | React 18 App Router with static + dynamic SSR |
| **Frontend Styling** | Tailwind CSS | `^3.4.4` | Dark/sand retail aesthetic styling |
| **UI Components** | Lucide React | `^1.16.0` | Consistent iconography |
| **Visual Effects** | `canvas-confetti` | `^1.9.4` | Milestone celebration burst animations |
| **QR Generation** | `qrcode.react` | `^4.2.0` | Counter standee acrylic QR generation |
| **Authentication** | `jsonwebtoken` & `bcryptjs`| `9.0.2 / 2.4.3` | Dual access/refresh JWTs & password hashing |
| **Validation** | `zod` | `^3.23.8` | Cross-service runtime payload validation |
| **Payments** | `razorpay` | `^2.9.8` | Order creation & webhook validation |
| **Email Delivery** | `resend` | `^3.4.0` | Transactional customer 6-digit OTP delivery |
| **Task Scheduling** | `node-cron` | `^4.6.0` | Midnight IST subscription & scan resets |

---

## 5. Feature-by-Feature Implementation Analysis

### 5.1 Counter Standee QR Check-in (`1-Scan-Per-Day IST Lock`)
- **Status:** Implemented & Verified in Production.
- **Files:** `backend/src/services/scan.service.ts`, `backend/src/controllers/scan.controller.ts`, `frontend/src/app/s/[slug]/page.tsx`, `frontend/src/components/CustomerView.tsx`.
- **How It Works:**
  1. Customer visits `/s/[slug]`. If mobile is remembered in `localStorage`, the pass loads immediately.
  2. Submitting a stamp request calls `POST /api/v1/scans/punch`.
  3. The backend calculates `todayIst` (`YYYY-MM-DD` in `Asia/Kolkata`).
  4. Prisma checks the composite unique constraint: `@@unique([merchantId, customerId, visitDateIst], name: "unique_daily_scan")`.
  5. If already scanned today, returns `409 Conflict` (`locked: true`).
  6. If new, creates a `PENDING` visit record and broadcasts a WebSocket event (`checkin.new`) to the store owner's counter terminal.

### 5.2 Real-time Merchant Counter Terminal
- **Status:** Implemented & Verified in Production.
- **Files:** `backend/src/websocket/server.ts`, `backend/src/websocket/terminal.socket.ts`, `frontend/src/app/owner/dashboard/page.tsx`, `frontend/src/components/merchant/CheckInQueue.tsx`.
- **How It Works:**
  1. Store cashier logs in at `/auth/owner/login` and opens `/owner/dashboard`.
  2. `useTerminalSocket` connects to `wss://stickthebizz.onrender.com/ws?merchantId=...&token=...`.
  3. When a customer scans at the counter, the terminal plays `/sounds/chime.mp3` and animates the new pending ticket.
  4. Cashier reviews minimum spend and taps **Approve** (`POST /api/v1/scans/:id/approve`) or **Reject** (`POST /api/v1/scans/:id/reject`).
  5. Customer mobile UI automatically updates with confetti and advances their stamp count.

### 5.3 4-Digit Voucher Redemption PIN Burning
- **Status:** Implemented & Verified in Production.
- **Files:** `backend/src/services/scan.service.ts` (`redeemRewardVoucher`), `frontend/src/components/merchant/VoucherRedemption.tsx`.
- **How It Works:**
  1. Once customer earns required stamps (e.g., 10 visits), a golden reward ticket appears.
  2. Customer presents ticket at counter. Cashier inputs their private 4-digit terminal PIN.
  3. Backend verifies PIN against `merchant.redemptionPin`.
  4. Finds required approved visits, updates status to `REDEEMED`, creates a `Redemption` record, and preserves surplus visits for the next reward cycle.

### 5.4 6-Digit Email OTP Customer Authentication
- **Status:** Implemented & Verified in Production.
- **Files:** `backend/src/services/otp.service.ts`, `backend/src/services/email.service.ts`, `frontend/src/app/auth/customer/login/page.tsx`.
- **How It Works:**
  1. Customer enters email. `POST /api/v1/auth/customer/otp/request` generates cryptographically random 6 digits.
  2. Hash stored in DB: `crypto.createHmac("sha256", env.OTP_SECRET).update(email:code).digest("hex")` with 5-minute expiry.
  3. Resend delivers transactional email from `StickTheBizz Loyalty <otp@stickthebizz.in>`.
  4. Customer enters OTP. Backend verifies HMAC hash in constant time (`crypto.timingSafeEqual`) to eliminate timing attacks.

### 5.5 B2B Subscriptions & 24-Hour Grace Period Engine
- **Status:** Implemented & Verified in Production.
- **Files:** `backend/src/services/subscription.service.ts`, `backend/src/controllers/webhook.controller.ts`, `backend/src/cron/daily-reset.cron.ts`.
- **Pricing Plans:**
  - `MONTHLY`: ₹749/month.
  - `YEARLY`: ₹6,999/year.
  - Promo Codes: `BETA100` / `FREE100` (100% off), `TEST1` (₹1 test order), `SAVE200` (₹200 flat discount), `LAUNCH20` (20% off).
- **Grace Period Logic:** If plan expires, status changes to `GRACE_PERIOD` for strictly 24 hours. Counter terminal remains functional. If unpaid after 24 hours, status transitions to `INACTIVE`.

### 5.6 Strict 1-Page Acrylic Standee Printing
- **Status:** Implemented & Verified in Production.
- **Files:** `frontend/src/components/CounterQR.tsx`, `frontend/src/components/merchant/PrintStandee.tsx`.
- **How It Works:**
  - Standee print uses an isolated document frame (`iframe`) containing only the standee card.
  - Browser print media CSS enforces `@page { size: A4 portrait; margin: 0; }` with `max-height: 297mm`, guaranteeing 100% single-page printing on all desktop browsers.

---

## 6. Database Schema & Data Models (Prisma)

The database runs on Supabase PostgreSQL (Frankfurt cluster). Managed exclusively via `backend/prisma/schema.prisma`:

```mermaid
erDiagram
    User ||--o{ Session : "has many"
    User ||--o{ Merchant : "owns"
    User ||--o| Customer : "links to"
    Merchant ||--o{ Visit : "receives"
    Merchant ||--o{ Redemption : "records"
    Customer ||--o{ Visit : "logs"
    Customer ||--o{ Redemption : "claims"

    User {
        uuid id PK
        varchar email UK
        varchar phone UK
        varchar full_name
        enum role
        varchar password_hash
        boolean is_verified
        timestamptz created_at
        timestamptz updated_at
    }

    Merchant {
        uuid id PK
        uuid owner_id FK
        varchar slug UK
        varchar name
        varchar category
        decimal min_spend
        int visits_required
        varchar reward_name
        int validity_days
        varchar redemption_pin
        varchar qr_token
        enum subscription_status
        enum subscription_plan
        timestamptz subscription_expires_at
        timestamptz grace_period_ends_at
    }

    Customer {
        uuid id PK
        uuid user_id FK
        varchar phone UK
        varchar email UK
        varchar full_name
        timestamptz created_at
    }

    Visit {
        uuid id PK
        uuid merchant_id FK
        uuid customer_id FK
        decimal bill_amount
        enum status
        varchar visit_date_ist
        timestamptz created_at
    }

    Redemption {
        uuid id PK
        uuid merchant_id FK
        uuid customer_id FK
        varchar reward_name
        int stamps_burned
        timestamptz redeemed_at
    }

    OtpCode {
        uuid id PK
        varchar email
        varchar code_hash
        int attempts
        boolean consumed
        timestamptz expires_at
    }

    PromoCode {
        uuid id PK
        varchar code UK
        enum discount_type
        decimal discount_value
        varchar applicable_plan
        int max_uses
        int times_used
        boolean is_active
        timestamptz expires_at
    }

    IdempotencyKey {
        uuid id PK
        varchar key UK
        varchar action
        json response
        timestamptz expires_at
    }

    AuditLog {
        uuid id PK
        varchar actor_type
        varchar actor_id
        varchar action
        varchar resource_id
        varchar ip_address
        json details
        timestamptz created_at
    }
```

---

## 7. API Specification & Endpoints

Base URL: `https://stickthebizz.onrender.com`

### 7.1 Authentication (`/api/v1/auth`)
| Method | Path | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/customer/otp/request` | Public | Generate & dispatch 6-digit email OTP |
| `POST` | `/api/v1/auth/customer/otp/verify` | Public | Verify OTP hash; returns tokens & session |
| `POST` | `/api/v1/auth/owner/register` | Public | Register merchant owner and create store |
| `POST` | `/api/v1/auth/owner/login` | Public | Owner login via email + password or 4-digit PIN |
| `GET` | `/api/v1/auth/me` | Bearer/Cookie | Return authenticated user & merchant profile |
| `POST` | `/api/v1/auth/refresh` | Cookie | Exchange `refresh_token` for new `access_token` |
| `POST` | `/api/v1/auth/logout` | Bearer/Cookie | Invalidate session & clear HTTP cookies |

### 7.2 Counter Scans & Redemption (`/api/v1/scans`)
| Method | Path | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/scans/punch` | Public | Punch visit stamp (enforces 1-per-day IST lock) |
| `POST` | `/api/v1/scans/:id/approve` | Merchant | Approve pending counter check-in |
| `POST` | `/api/v1/scans/:id/reject` | Merchant | Reject pending counter check-in |
| `POST` | `/api/v1/scans/redeem` | Public/Merchant | Burn earned stamps via 4-digit counter PIN |
| `GET` | `/api/v1/scans/pending` | Merchant | Fetch active pending check-in queue |
| `GET` | `/api/v1/scans/ledger` | Merchant | Query paginated store visit audit history |
| `GET` | `/api/v1/scans/status` | Public | Get customer visit count & lock status |

### 7.3 Merchant Administration (`/api/v1/merchant`)
| Method | Path | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/merchant/me` | Merchant | Fetch current owner store settings |
| `GET` | `/api/v1/merchant/slug/:slug` | Public | Public store metadata for standee pass |
| `PATCH`| `/api/v1/merchant/rules` | Merchant | Update minSpend, rewardName, validityDays |
| `POST` | `/api/v1/merchant/rotate-qr` | Merchant | Generate new dynamic anti-fraud QR token |
| `PATCH`| `/api/v1/merchant/terminal-pin`| Merchant | Update 4-digit cashier redemption PIN |

### 7.4 Subscriptions & Webhooks (`/api/v1/subscriptions`, `/api/v1/webhooks`)
| Method | Path | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/subscriptions/validate-promo` | Public | Validate coupon code & return discounted rate |
| `POST` | `/api/v1/subscriptions/create-order` | Merchant | Create Razorpay subscription order |
| `POST` | `/api/v1/subscriptions/activate` | Merchant | Verify payment signature & activate store |
| `GET` | `/api/v1/subscriptions/status/:id` | Public | Check active, grace period, or expired status |
| `POST` | `/api/v1/webhooks/razorpay` | Public (HMAC) | Handle Razorpay automated recurring events |

### 7.5 System & Cron (`/api/v1/health`, `/api/v1/cron`)
| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service uptime, IST time, and keep-alive ping |
| `GET` | `/api/v1/cron/daily-reset` | Trigger midnight IST subscription & scan resets |

---

## 8. Important Workflows (Sequence Diagrams)

### 8.1 Counter Check-In & Live Approval Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer (Mobile)
    participant Vercel as Next.js Frontend
    participant Fastify as Fastify Backend
    participant WS as WebSocket Hub (/ws)
    participant DB as PostgreSQL (Supabase)
    actor Owner as Merchant Counter Terminal

    Customer->>Vercel: Scans Acrylic QR (/s/demo-cafe)
    Vercel->>Fastify: POST /api/v1/scans/punch (phone, amount)
    Fastify->>DB: Check unique_daily_scan (merchantId, customerId, todayIst)
    alt Already Scanned Today
        DB-->>Fastify: Unique constraint violation
        Fastify-->>Vercel: 409 Conflict (locked: true)
        Vercel-->>Customer: Shows "Come Back Tomorrow" Lock Badge
    else Valid First Scan of Day
        Fastify->>DB: INSERT INTO visits (status: 'PENDING')
        Fastify->>WS: Broadcast event: checkin.new
        WS-->>Owner: Audio Chime & Live Ticket Appears
        Fastify-->>Vercel: 201 Created (status: 'PENDING')
        Vercel-->>Customer: Shows "Waiting for Counter Cashier"
        Owner->>Fastify: POST /api/v1/scans/:id/approve
        Fastify->>DB: UPDATE visits SET status = 'APPROVED'
        Fastify->>WS: Broadcast event: checkin.approved
        WS-->>Customer: Confetti Burst & Stamp Grid +1
        WS-->>Owner: Queue count decrements
    end
```

---

## 9. Current Project Status

### 9.1 Verified Working Features
- **Decoupled Cross-Domain Auth:** Login, refresh, and session recovery working seamlessly across `stickthebizz.in` (Vercel) and `stickthebizz.onrender.com` (Render).
- **1-Scan-per-Day IST Lock:** Tested and verified against database unique constraints.
- **WebSocket Counter Terminal:** Bidirectional terminal feed working at `/ws` with automatic reconnection and heartbeat pinging.
- **Standee 1-Page Printing:** Fully isolated iframe printing verified across Chrome, Edge, Safari, and Brave.
- **Automated Regression Suite:** 29 of 29 tests passing (`backend/tests/phase2.test.ts`).

### 9.2 Known Nuances & Platform Constraints
1. **Render Free-Tier Cold Starts:**
   Render spins down free containers after 15 minutes of inactivity. First request can take ~50 seconds unless kept warm using an external pinger (`GET /api/v1/health` every 10 minutes).
2. **Supabase IPv6 vs. IPv4:**
   Direct Supabase host (`db.*.supabase.co`) is IPv6-only. Render requires connection via the Supavisor Pooler (`aws-1-eu-central-1.pooler.supabase.com:6543`) with `?pgbouncer=true`.
3. **Resend Sender Domain:**
   Transactional emails originate from `StickTheBizz Loyalty <otp@stickthebizz.in>`. The domain must have active DKIM/SPF DNS records.

---

## 10. Testing & Quality Verification

### Run Automated Backend Verification:
```bash
cd E:/SaaS
npm run test:backend
```

**Output Verified:**
```text
==================================================
   STICKTHEBIZZ BACKEND PHASE 2 VERIFICATION TEST
==================================================
[1] Testing Pricing & Promo Engine:      11 PASSED
[2] Testing IST Engine:                   2 PASSED
[3] Testing Razorpay Signature Helpers:   3 PASSED
[4] Testing Fastify Server Injections:   13 PASSED
==================================================
   PHASE 2 RESULTS: 29 PASSED, 0 FAILED
==================================================
```

### Run Frontend Production Build:
```bash
cd E:/SaaS
npm run build:frontend
```
**Output Verified:** All 19 routes compile cleanly to static and dynamic pages with 0 TypeScript errors.

---

## 11. Environment Variables Reference

### Backend (`backend/.env`)
```ini
PORT=8000
NODE_ENV=production
FRONTEND_URL=https://stickthebizz.in

# Supabase Connection Pooler (Port 6543 with ?pgbouncer=true)
DATABASE_URL=postgresql://postgres.xzvpjprnexurgohfnimq:[PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Supabase Direct Connection (Port 5432 session mode)
DIRECT_URL=postgresql://postgres.xzvpjprnexurgohfnimq:[PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:5432/postgres

# Cryptographic Secrets (256-bit Hex)
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
OTP_SECRET=...
CRON_SECRET=...

# Razorpay Live Credentials
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Resend Transactional Mail
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=StickTheBizz Loyalty <otp@stickthebizz.in>
```

### Frontend (`frontend/.env.local`)
```ini
NEXT_PUBLIC_API_URL=https://stickthebizz.onrender.com
NEXT_PUBLIC_WS_URL=wss://stickthebizz.onrender.com/ws
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
```

---

## 12. AI DEVELOPMENT GUIDELINES

When working on this repository, all future AI assistants MUST follow these strict rules:

1. **Targeted Code Reading & Token Efficiency (Strict User Rule):**
   - Read only the specific files directly related to the issue. Never scan or grep through unrelated directories.
2. **Strict Single-Page Standee Printing (Strict User Rule):**
   - The acrylic counter QR standee printout (`frontend/src/components/CounterQR.tsx`) must print as strictly 1 page in all browsers. Maintain isolated iframe document printing.
3. **Preserve Service Decoupling:**
   - **NEVER** import backend modules or Prisma into `frontend/`.
   - **NEVER** re-introduce `@supabase/*` SDKs to `frontend/`. All database actions must flow through `backend/src/services/` via typed endpoints in `frontend/src/lib/api/client.ts`.
4. **Timezone Rule:**
   - All dates that govern daily scan locks or resets must use `getTodayIstDateString()` from `backend/src/utils/ist.ts`. Never use UTC `toISOString().slice(0, 10)` for daily visit locks.
5. **Cookie Security:**
   - All authentication cookies must specify `sameSite: "none"`, `secure: true`, and `httpOnly: true` in production to allow cross-domain requests between Vercel and Render.
6. **Commands Cheatsheet:**
   - Backend Dev: `npm run dev:backend`
   - Frontend Dev: `npm run dev:frontend`
   - Backend Build: `npm run build:backend`
   - Frontend Build: `npm run build:frontend`
   - Regression Tests: `npm run test:backend`

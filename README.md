# StickTheBizz (SaaS 2.0) — Decoupled Architecture

StickTheBizz is a B2B2C retail loyalty and digital stamp-card SaaS engineered for Indian retail counters (cafes, chai points, dairy parlors, local shops). Shop owners place acrylic counter QR standees for customers to scan daily, punch digital stamps, and unlock loyalty rewards.

The project is decoupled into two production services within this monorepo:

```
StickTheBizz/
├── backend/            # Fastify + TypeScript + Prisma ORM (Deployed on Render)
│   ├── prisma/         # PostgreSQL schema & migrations (Supabase DB)
│   ├── src/
│   │   ├── controllers/# REST API controllers
│   │   ├── routes/     # Fastify route declarations (/api/v1/*)
│   │   ├── services/   # Business logic (Scans, Subscriptions, OTP, Customers, Merchants)
│   │   ├── websocket/  # Real-time cashier terminal WebSocket server
│   │   ├── cron/       # Midnight IST daily reset cron job
│   │   └── server.ts   # Fastify server entrypoint
│   ├── tests/          # Automated test suite
│   └── package.json
│
├── frontend/           # Next.js 14 App Router (Deployed on Vercel)
│   ├── src/
│   │   ├── app/        # Pages & Layouts (Landing, Passes, Customer & Owner Dashboards)
│   │   ├── components/ # Reusable UI components & 1-page standee printing
│   │   ├── context/    # Auth & State Contexts (Customer & Merchant)
│   │   └── lib/        # API Client & Terminal WebSocket hook
│   ├── public/         # Icons, manifest, audio chimes
│   └── package.json
│
└── package.json        # Workspace scripts
```

---

## 🛠️ Tech Stack & Deployment

| Service | Framework / Runtime | Cloud Host | Primary URL |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router) + Tailwind CSS | **Vercel** | [https://stickthebizz.in](https://stickthebizz.in) |
| **Backend** | Fastify 4 + TypeScript + WebSockets | **Render** | `https://stickthebizz.onrender.com` |
| **Database** | PostgreSQL via Prisma ORM | **Supabase** | `db.xzvpjprnexurgohfnimq.supabase.co:5432` |
| **Payments** | Razorpay Node SDK & Webhooks | Razorpay | Live Gateway |
| **Emails** | Resend API (Transactional OTPs) | Resend | `otp@stickthebizz.in` |

---

## 🚀 Workspace Convenience Commands

Run from the root directory:

```bash
# Start backend dev server (port 8000)
npm run dev:backend

# Start frontend dev server (port 3000)
npm run dev:frontend

# Build backend (Prisma client + TypeScript compiler)
npm run build:backend

# Build frontend (Next.js production build)
npm run build:frontend

# Run backend automated test suite
npm run test:backend
```

---

## 🔒 Security & Core Rules

1. **1-Scan-Per-Day IST Lock:** Strictly enforced using Indian Standard Time (`Asia/Kolkata`) with a daily midnight (12:00 AM IST) reset cron.
2. **Strict 1-Page Standee Printing:** Acrylic counter QR standee uses isolated print styling to guarantee single-page output across Chrome, Edge, Safari, and Brave.
3. **Decoupled Auth:** HMAC-SHA256 hashed 6-digit OTP verification for customers and JWT session cookies for merchant owners.

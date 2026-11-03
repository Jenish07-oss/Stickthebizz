# 📄 StickTheBizz — Complete Project, Changes & Architecture Report
**Author:** Jenish Patel / StickTheBizz Team  
**Date:** November 03, 2026  
**Repository:** [github.com/Jenish07-oss/Stickthebizz](https://github.com/Jenish07-oss/Stickthebizz) (Public)  
**Hosting / Deploy:** Vercel (Auto-deployed via Git on `main` branch)  
**Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase (PostgreSQL, RLS, Auth, Realtime)  
**Pricing Model:** Flat ₹499 / Month Flat Subscription  

---

## 🎯 Executive Summary & Mission
**StickTheBizz** is an offline customer loyalty and retention platform engineered specifically for local retail merchants in India (Chai points, cafes, kirana stores, bakeries, quick-service food joints, and salons). 

Unlike traditional loyalty software requiring customers to download a mobile app or enter complex SMS OTP passwords, StickTheBizz replaces physical loyalty cards with an **official 5x7 Acrylic Counter QR Standee** and an instant, browser-based **Digital Loyalty Stamp Card** accessible via any smartphone camera.

---

## 🛠️ Complete Summary of What Was Changed & Upgraded

### 1. Eradication of All Fake / Mock Data & Credentials
- **Customer Phone & Visits:** Removed hardcoded simulation variables (e.g. `phone: "9820012345"` and `visits: 7`). All customer visits are now queried live from Supabase.
- **Removed Fake OTP Dialog:** Removed the simulation modal that showed `"Auto-filled: 8492 (Demo Simulator)"`.
- **Removed Fake Activity Toasts:** Deleted `<LiveActivityToast />` notifications that were popping up simulated customer actions on the landing page.
- **Removed Fake Background Effects:** Cleaned the hero section canvas on `app/page.tsx` to a pure, responsive `#F5EBDD` (Warm Sand) background.

---

### 2. Real Customer Auth & Multi-Store Digital Wallet
- **Dual-Tab Authentication (`/auth/customer/login`):**
  - **Tab 1: "Returning Customer"**: Passwordless login using official Supabase Email OTP with 6 individual digit inputs.
  - **Tab 2: "New Customer Pass Sign Up"**: Instant 1-tap pass creation with mobile number, name, and DPDP 2023 compliance consent.
- **Auto-Login & Session Persistence:** If a customer opens the app after previous visits, their session is automatically remembered via Supabase Auth and `localStorage` (`stb_customer_phone`).
- **In-App Camera QR Scanner (`components/CameraQRScanner.tsx`):**
  - Built an interactive camera viewfinder using native browser `BarcodeDetector` and HTML5 `getUserMedia` video streams.
  - Customers can tap **"📷 Scan Counter QR"** inside `/customer/dashboard` to scan any physical counter standee directly.

---

### 3. Dynamic QR Standee System & 30-Day Monthly Expiry
- **Dynamic Origin Resolution (`components/CounterQR.tsx`):**
  - Replaced hardcoded `stickthebizz.in` with dynamic browser host resolution (`window.location.origin`), ensuring QR codes automatically work across `localhost`, Vercel previews, and production domains.
- **3D Acrylic Standee Artwork:**
  - Photorealistic acrylic tabletop standee rendering with realistic perspective shadows, gloss reflection highlights, and DPDP anti-fraud badges.
  - Formatted with `@media print` CSS for immediate 5x7 inch printing from any browser.
- **Standee Customization Studio (`/owner/dashboard`):**
  - Shop owners can edit:
    1. Store Display Name
    2. Minimum Bill Amount per Scan (e.g. ₹100+)
    3. Total Visits Needed for Reward (e.g. 10 visits)
    4. Reward Description (e.g. "Free Special Masala Chai")
    5. Validity Cycle Days (default: 30 days)
- **Monthly QR Rotation & Expiration:**
  - Added a dedicated **"Rotate / Refresh Monthly QR"** button in the Cashier Terminal.
  - Clicking this rotates the cryptographic token in the database (`qr_token`), immediately expiring older QR standees after 30 days to prevent link hoarding or fraudulent remote check-ins.

---

### 4. Anti-Fraud 12:00:00 AM IST Daily Check-In Engine
- **Server Action Validation (`app/actions/scan.ts`):**
  - Every scan runs through `submitScan()`, calculating the current date in **Asia/Kolkata (IST, UTC+5:30)** timezone in `YYYY-MM-DD` format.
  - Checks Supabase `visits` table using the unique constraint:  
    `CONSTRAINT unique_daily_scan UNIQUE (customer_id, merchant_id, visit_date_ist)`.
- **Instant Anti-Fraud Locking:**
  - If a customer attempts a second scan on the same calendar day, the Server Action rejects it with code `23505`.
  - The client pass displays a live ticking countdown:  
    `"Today's visit verified! Next stamp unlocks strictly at 12:00:00 AM IST"` + live countdown ticker.

---

### 5. Shop Owner Cashier Terminal (`/owner/dashboard`)
- **Auto-Login & Route Protection:**
  - Unauthenticated visitors are automatically redirected to `/auth/owner/login`.
  - Returning shop owners automatically bypass the login screen and land directly on their terminal.
- **Realtime WebSocket Subscription:**
  - Subscribes directly to Supabase `postgres_changes` on the `visits` table.
  - When a customer punches their stamp, the cashier terminal sounds a **two-tone counter approval chime (523Hz + 659Hz)** and adds the customer into the live pending queue.
- **1-Tap Verification & 4-Digit PIN Voucher Redemption:**
  - Cashiers can approve or reject visits with 1 tap.
  - When a customer completes their stamp card, a 4-digit PIN is verified by the cashier terminal to securely hand over the physical treat.

---

## 🗄️ Supabase Database Architecture & DDL Script

```sql
-- 1. MERCHANTS TABLE
CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT DEFAULT 'Cafe / Chai',
  min_spend NUMERIC DEFAULT 100,
  visits_required INT DEFAULT 10,
  reward_name TEXT NOT NULL,
  validity_days INT DEFAULT 30,
  redemption_pin TEXT DEFAULT '8492',
  qr_token TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. VISITS TABLE (WITH STRICT DAILY SCAN CONSTRAINT)
CREATE TABLE IF NOT EXISTS public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  visit_date_ist TEXT NOT NULL, -- Format: 'YYYY-MM-DD' (Asia/Kolkata)
  bill_amount NUMERIC DEFAULT 100,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'REDEEMED')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_daily_scan UNIQUE (customer_id, merchant_id, visit_date_ist)
);

-- 4. REALTIME REPLICATION (SAFE IDEMPOTENT PUBLICATION)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.visits;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
```

---

## 📁 Key File Manifest

| File | Purpose |
| :--- | :--- |
| `components/CustomerView.tsx` | Customer loyalty pass interface with real stamp grid, audio chime, and IST daily lock ticker. |
| `components/CounterQR.tsx` | 3D Acrylic counter standee with dynamic host resolution, 30-day validity, and QR rotation. |
| `components/CameraQRScanner.tsx` | In-app Camera QR scanner using HTML5 video stream and native BarcodeDetector. |
| `app/owner/dashboard/page.tsx` | Cashier terminal with live WebSocket scan queue, rule studio, and PIN redemption. |
| `app/customer/dashboard/page.tsx` | Multi-store customer digital wallet with session persistence and camera scanner trigger. |
| `app/auth/customer/login/page.tsx` | Dual-tab customer portal: Returning customer OTP login vs. New pass sign up. |
| `app/auth/owner/login/page.tsx` | Cashier login with auto-redirect for returning owners. |
| `app/actions/scan.ts` | Server Actions for scan submission, daily IST locks, approval/rejection, and PIN checks. |
| `app/actions/merchant.ts` | Server Actions for rule updates and monthly QR standee rotation. |
| `app/actions/customer.ts` | Server Actions for multi-store wallet aggregation and account synchronization. |
| `supabase/setup.sql` | Production PostgreSQL migration script with RLS policies and seed merchants. |

---

## 🚢 Production & Deployment Status
- **TypeScript Typecheck:** `npx tsc --noEmit` passed with **0 errors**.
- **Next.js Production Build:** `npm run build` compiled all 16 static and dynamic routes with **exit code 0**.
- **Git Sync:** Both `main` and `dev` branches pushed and tracked on GitHub ([`Jenish07-oss/Stickthebizz`](https://github.com/Jenish07-oss/Stickthebizz)).
- **Vercel Deployments:** Live auto-deployment enabled across all pushes on the public repository.
- **Generated PDF Report:** [`StickTheBizz_Project_Report.pdf`](file:///E:/SaaS/StickTheBizz_Project_Report.pdf) (676 KB) with embedded visual screenshots.

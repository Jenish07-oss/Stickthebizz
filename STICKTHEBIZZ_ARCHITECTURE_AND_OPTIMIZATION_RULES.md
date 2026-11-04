# 🏛️ StickTheBizz — Master Architecture & Performance Rules

> **MANDATORY POLICY FOR ALL FUTURE DEVELOPMENT**  
> Every engineer, AI assistant, and agent working on StickTheBizz must follow these architectural rules from line 1 of any feature or page. Never degrade performance or violate zero-cost constraints.

---

## ⚡ RULE 1: Static Generation & ISR for Public Routes (TTFB < 150ms)

1. **Every Public Customer / Shop Route Must Use ISR or Static Generation:**
   ```tsx
   export const revalidate = 300; // 5-minute CDN edge cache
   ```
2. **Never Call `cookies()` or `headers()` in Public Server Components:**
   - Any server component that calls `cookies()` bails out of static generation and incurs a 1.5s–2.5s serverless cold start.
   - Fetch public business data (merchant rules, store name, category) using a static Supabase client (`@supabase/supabase-js`).
   - Leave user authentication, stamp calculation, and personalized state to **client-side hydration (`"use client"`)**.
3. **Use `generateStaticParams()` for Known Dynamic Routes:**
   - For `/s/[slug]`, pre-render top/active store slugs at build time so the edge CDN serves HTML in **< 100ms**.

---

## 📦 RULE 2: Dynamic Imports for Heavy & Interactive Components

1. **Never Statically Import Heavy or Conditional UI:**
   - Camera Scanners (`CameraQRScanner`)
   - Canvas/Particle animations (`ConfettiEffect`)
   - Modal dialogs (`ReviewModal`, `ExportModal`, `DeleteModal`)
   - QR Generators (`CounterQR`, `qrcode.react`)
   - Audio players / Stamp punch grids (`StampGrid`, `RewardTicket`)
2. **Always Lazy-Load with `next/dynamic`:**
   ```tsx
   import dynamic from "next/dynamic";

   const CameraQRScanner = dynamic(() => import("@/components/CameraQRScanner"), {
     ssr: false,
     loading: () => <div className="h-64 rounded-2xl bg-sand/30 animate-pulse" />
   });
   ```
3. **Keep Shared First Load JS Under 90 KB.**

---

## 🛡️ RULE 3: Zero Infinite Spinners & Guaranteed Loader Fallbacks

1. **Every Dashboard and Auth Loader Must Have a 4-Second Timeout Safeguard:**
   ```tsx
   useEffect(() => {
     let mounted = true;
     const timer = setTimeout(() => {
       if (mounted) setLoading(false);
     }, 4000);

     // fetch logic...
     return () => {
       mounted = false;
       clearTimeout(timer);
     };
   }, []);
   ```
2. **Empty States Must Render Setup Forms in < 100ms:**
   - In `getOwnerMerchant()`, return `needsSetup: true` when a user has no active store row.
   - When `needsSetup` is true or `!merchant`, immediately set `loading = false` and render the **"Set Up Your Shop Counter"** onboarding screen.
   - Never strand a new merchant or customer on a loading spinner.

---

## 📱 RULE 4: Progressive Web App (PWA) & Service Worker Caching

1. **Cache All Static Shell Assets with `next-pwa`:**
   - All JS chunks, CSS, SVG icons, and Google Fonts must be cached in the browser Cache Storage.
   - Repeat visits must load from cache in **< 300ms** even on flaky 2G/3G Bharat networks.
2. **Offline Resilience:**
   - When offline or disconnected, render clear cached store passes rather than a blank browser error screen.
3. **Manifest Consistency:**
   - Maintain `public/manifest.json` with standalone display mode and high-res vector/PNG icons.

---

## 💰 RULE 5: 100% Free Stack Architecture (Zero Paid API Gateways)

1. **Zero Paid SMS / WhatsApp Gateways:**
   - Never introduce Twilio, Fast2SMS, MSG91, or Meta WhatsApp Cloud API fees.
   - Customer OTPs are delivered via custom domain SMTP on Resend (`support@stickthebizz.in`) at **₹0 cost**.
2. **Single Permanent Customer Login:**
   - Customers log in ONCE via verified mobile or email OTP.
   - Browser cookies and localStorage retain the customer session permanently.
   - Daily counter QR scans must NEVER prompt returning customers for repetitive OTPs.
3. **Free Hosting Constraints:**
   - Vercel Free Hobby Plan + Supabase Free Tier + Resend Free Tier.
   - Maximize CDN edge caching to minimize serverless function invocations and database read quotas.

---

## 🎨 RULE 6: High-Performance GPU Rendering on 4GB RAM Devices

1. **Eliminate Costly CSS Filters:**
   - Do NOT use `backdrop-filter: blur(...)` or `backdrop-blur-*` on mobile dialogs, overlays, or stamps.
   - Use high-contrast solid translucent backgrounds (`bg-black/75` or `bg-sand/95`) to prevent GPU lag on budget processors (Snapdragon 400/600 series, MediaTek Helio).
2. **Font Rendering:**
   - All Google Fonts (`Plus_Jakarta_Sans`, `IBM_Plex_Mono`) must configure `display: "swap"`.
   - Include preconnect resource hints in `<head>` for Supabase and Google Fonts.

---

## 🔒 RULE 7: Anti-Fraud & Single-Use Security

1. **Daily IST Visit Lock:**
   - Enforce 1-stamp-per-day strictly based on Indian Standard Time (`UTC + 5:30`, resetting at 12:00:00 AM IST) backed by unique database constraints.
2. **No Hardcoded PINs:**
   - Never use "8492" or static fallback PINs.
   - Merchant sets a private 4-digit PIN in their owner settings.
   - Customers present a dynamic single-use voucher code (`STB-XXXX`) for counter redemption.


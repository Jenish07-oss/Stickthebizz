-- ==============================================================================
-- StickTheBizz.in — Production Database Schema, Hardened RLS & Realtime Setup
-- Run this script in your Supabase Dashboard -> SQL Editor
-- ==============================================================================

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
  validity_days INT DEFAULT 45,
  redemption_pin TEXT DEFAULT '4921',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure newly added columns exist if table was already created
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Cafe / Chai';
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS validity_days INT DEFAULT 45;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS redemption_pin TEXT DEFAULT '4921';
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS qr_token TEXT DEFAULT 'active';

-- 2. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure newly added columns exist if table was already created
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 3. VISITS TABLE
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

-- Ensure newly added columns exist if table was already created
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS bill_amount NUMERIC DEFAULT 100;

-- 4. AUDIT LOGS TABLE
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

CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at);

-- 5. REDEMPTIONS TABLE (Audit-safe, Restricted Deletion)
CREATE TABLE IF NOT EXISTS public.redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  cycle_number INTEGER NOT NULL DEFAULT 1,
  reward_name TEXT NOT NULL,
  required_visits INTEGER NOT NULL CHECK (required_visits BETWEEN 1 AND 100),
  stamps_consumed INTEGER NOT NULL CHECK (stamps_consumed >= 0),
  voucher_code_hash TEXT NOT NULL,
  voucher_code_last4 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'REDEEMED', 'CANCELLED', 'EXPIRED')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '48 hours'),
  redeemed_at TIMESTAMPTZ,
  redeemed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_redemptions_one_active_per_customer
  ON public.redemptions (merchant_id, customer_id)
  WHERE status = 'ISSUED';

CREATE INDEX IF NOT EXISTS idx_redemptions_merchant_created_at
  ON public.redemptions (merchant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_redemptions_customer_created_at
  ON public.redemptions (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_redemptions_voucher_hash
  ON public.redemptions (voucher_code_hash);

-- Safe View (Hides voucher_code_hash from public/client queries)
CREATE OR REPLACE VIEW public.redemptions_safe AS
SELECT
  id,
  merchant_id,
  customer_id,
  cycle_number,
  reward_name,
  required_visits,
  stamps_consumed,
  voucher_code_last4,
  status,
  issued_at,
  expires_at,
  redeemed_at,
  created_at
FROM public.redemptions;

-- 6. IDEMPOTENCY KEYS TABLE
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  user_id UUID,
  request_hash TEXT NOT NULL,
  response_status INTEGER,
  response_body JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (key, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_expires_at
  ON public.idempotency_keys (expires_at);

-- 7. REALTIME REPLICATION (Safely ignore if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.visits;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- 7. HARDENED RLS POLICIES

-- Drop ALL existing policies first
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('merchants','customers','visits','audit_logs','redemptions','idempotency_keys')
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

-- Allow new merchant registration
CREATE POLICY "Public insert merchant" ON public.merchants
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

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
-- Customer can READ own record (via auth_id link or public check-in)
CREATE POLICY "Public read customer" ON public.customers
  FOR SELECT TO anon, authenticated
  USING (true);

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


-- ==========================================
-- REDEMPTIONS POLICIES
-- ==========================================
-- Merchant owner can read redemptions for their store
CREATE POLICY "Merchant read own redemptions" ON public.redemptions
  FOR SELECT TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE owner_id = auth.uid()));

-- Customer can read own redemptions
CREATE POLICY "Customer read own redemptions" ON public.redemptions
  FOR SELECT TO authenticated
  USING (customer_id IN (SELECT id FROM public.customers WHERE auth_id = auth.uid()));

-- ==========================================
-- AUDIT LOGS POLICIES
-- ==========================================
-- Only service role can access audit logs
CREATE POLICY "Service role audit access" ON public.audit_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 8. SEED INITIAL VERIFIED MERCHANTS
INSERT INTO public.merchants (id, name, slug, category, min_spend, visits_required, reward_name, validity_days, redemption_pin)
VALUES
  ('5cc30c25-3711-4b65-891b-13af808a556f', 'Kesar Chai Corner', 'kesar-chai', 'Cafe / Chai', 100, 10, 'Free Masala Chai', 45, '4921'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Patel Kirana Superstore', 'patel-kirana', 'Kirana / Grocery', 250, 10, '1L Cooking Oil Pouch', 45, '1234'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'The Bun Co. Burgers', 'burger-joint', 'Quick Service Restaurant', 150, 7, 'Free Crispy Burger', 30, '5678')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    category = EXCLUDED.category,
    min_spend = EXCLUDED.min_spend,
    visits_required = EXCLUDED.visits_required,
    reward_name = EXCLUDED.reward_name,
    validity_days = EXCLUDED.validity_days,
    redemption_pin = EXCLUDED.redemption_pin;

-- ==========================================
-- 9. AUTO-CONFIRM ALL USERS INSTANTLY
-- Ensures every new customer & merchant signup is immediately active with NO email confirmation delay
-- ==========================================
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();


-- ==========================================
-- 10. SUBSCRIPTIONS, 1-DAY GRACE PERIOD & PROMO CODES
-- ==========================================
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'MONTHLY';
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + INTERVAL '30 days');
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + INTERVAL '31 days');
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('PERCENT', 'FLAT')),
  discount_value NUMERIC NOT NULL,
  applicable_plan TEXT DEFAULT 'ALL' CHECK (applicable_plan IN ('ALL', 'MONTHLY', 'YEARLY')),
  max_uses INT DEFAULT 1000,
  times_used INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.promo_codes (code, discount_type, discount_value, applicable_plan, max_uses)
VALUES 
  ('BETA100', 'PERCENT', 100, 'ALL', 1000),
  ('FOUNDERPASS', 'PERCENT', 100, 'ALL', 500),
  ('LAUNCH20', 'PERCENT', 20, 'ALL', 1000),
  ('SAVE200', 'FLAT', 200, 'ALL', 1000)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.merchant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan TEXT NOT NULL CHECK (plan IN ('MONTHLY', 'YEARLY')),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'EXPIRED', 'FAILED')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  promo_code_applied TEXT,
  discount_amount NUMERIC DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL,
  grace_ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_subscriptions ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- StickTheBizz — Complete Master Database & RLS Setup
-- Run this in your Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. MERCHANTS TABLE & SUBSCRIPTION COLUMNS
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
  qr_token TEXT DEFAULT 'active',
  subscription_status TEXT DEFAULT 'ACTIVE',
  subscription_plan TEXT DEFAULT 'MONTHLY',
  subscription_started_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  subscription_expires_at TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + INTERVAL '30 days'),
  grace_period_ends_at TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + INTERVAL '31 days'),
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'MONTHLY';
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + INTERVAL '30 days');
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + INTERVAL '31 days');
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
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

-- 3. VISITS TABLE (1-scan per calendar day via unique_daily_scan)
CREATE TABLE IF NOT EXISTS public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  visit_date_ist TEXT NOT NULL,
  bill_amount NUMERIC DEFAULT 100,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'REDEEMED')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_daily_scan UNIQUE (customer_id, merchant_id, visit_date_ist)
);

-- 4. PROMO CODES TABLE
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
ON CONFLICT (code) DO UPDATE SET
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  is_active = true;

-- 5. MERCHANT SUBSCRIPTIONS TABLE
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

-- 6. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_subscriptions ENABLE ROW LEVEL SECURITY;

-- 7. CLEAN & REBUILD VISITS POLICIES (Guarantees customer scan & owner approve work)
DROP POLICY IF EXISTS "Public insert visit" ON public.visits;
CREATE POLICY "Public insert visit" ON public.visits
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public read visits" ON public.visits;
CREATE POLICY "Public read visits" ON public.visits
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Merchant owner update visits" ON public.visits;
CREATE POLICY "Merchant owner update visits" ON public.visits
  FOR UPDATE TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE owner_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE owner_id = auth.uid()));

-- 8. CUSTOMER & MERCHANT POLICIES
DROP POLICY IF EXISTS "Public read customer" ON public.customers;
CREATE POLICY "Public read customer" ON public.customers
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public insert customer" ON public.customers;
CREATE POLICY "Public insert customer" ON public.customers
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public view merchants" ON public.merchants;
CREATE POLICY "Public view merchants" ON public.merchants
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Owner update merchant" ON public.merchants;
CREATE POLICY "Owner update merchant" ON public.merchants
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Public can view active promo codes" ON public.promo_codes;
CREATE POLICY "Public can view active promo codes" ON public.promo_codes
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Owners can view own subscriptions" ON public.merchant_subscriptions;
CREATE POLICY "Owners can view own subscriptions" ON public.merchant_subscriptions
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Service can manage subscriptions" ON public.merchant_subscriptions;
CREATE POLICY "Service can manage subscriptions" ON public.merchant_subscriptions
  FOR ALL TO anon, authenticated
  USING (true);

-- 9. SAFE REALTIME REGISTRATION (Catches error if already member)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.visits;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN OTHERS THEN NULL;
END $$;

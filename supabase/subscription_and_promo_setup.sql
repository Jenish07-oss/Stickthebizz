-- ==============================================================================
-- StickTheBizz — Subscription, 1-Day Grace Period & Promo Code System Setup
-- Run this in your Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. ADD SUBSCRIPTION & GRACE PERIOD COLUMNS TO MERCHANTS TABLE
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'MONTHLY';
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + INTERVAL '30 days');
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + INTERVAL '31 days');
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;

-- 2. CREATE PROMO CODES / REDEEM CODES TABLE
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

-- Seed production promo codes (100% OFF for testing & onboarding, 20% launch, flat 200)
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

-- 3. CREATE MERCHANT SUBSCRIPTIONS TABLE (Historical payment audit log)
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

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow reading active promo codes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'promo_codes' AND policyname = 'Public can view active promo codes'
  ) THEN
    CREATE POLICY "Public can view active promo codes" ON public.promo_codes
      FOR SELECT TO anon, authenticated
      USING (is_active = true);
  END IF;
END $$;

-- Allow owners to view their own subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'merchant_subscriptions' AND policyname = 'Owners can view own subscriptions'
  ) THEN
    CREATE POLICY "Owners can view own subscriptions" ON public.merchant_subscriptions
      FOR SELECT TO authenticated
      USING (owner_id = auth.uid());
  END IF;
END $$;

-- Allow service role / authenticated backend actions to insert & update subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'merchant_subscriptions' AND policyname = 'Service can manage subscriptions'
  ) THEN
    CREATE POLICY "Service can manage subscriptions" ON public.merchant_subscriptions
      FOR ALL TO anon, authenticated
      USING (true);
  END IF;
END $$;


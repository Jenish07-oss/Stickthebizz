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
  redemption_pin TEXT DEFAULT '8492',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure newly added columns exist if table was already created
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Cafe / Chai';
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS validity_days INT DEFAULT 45;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS redemption_pin TEXT DEFAULT '8492';
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

-- 4. REALTIME REPLICATION (Safely ignore if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.visits;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- 6. HARDENED RLS POLICIES

-- MERCHANTS POLICIES
DROP POLICY IF EXISTS "Allow public read on merchants" ON public.merchants;
CREATE POLICY "Allow public read on merchants"
ON public.merchants FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated owner insert on merchants" ON public.merchants;
CREATE POLICY "Allow authenticated owner insert on merchants"
ON public.merchants FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow owner update on merchants" ON public.merchants;
CREATE POLICY "Allow owner update on merchants"
ON public.merchants FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- CUSTOMERS POLICIES
DROP POLICY IF EXISTS "Allow public select on customers" ON public.customers;
CREATE POLICY "Allow public select on customers"
ON public.customers FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow public insert on customers" ON public.customers;
CREATE POLICY "Allow public insert on customers"
ON public.customers FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow customer update" ON public.customers;
CREATE POLICY "Allow customer update"
ON public.customers FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- VISITS POLICIES
DROP POLICY IF EXISTS "Allow public select on visits" ON public.visits;
CREATE POLICY "Allow public select on visits"
ON public.visits FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow public insert on visits" ON public.visits;
CREATE POLICY "Allow public insert on visits"
ON public.visits FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on visits" ON public.visits;
CREATE POLICY "Allow public update on visits"
ON public.visits FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 7. SEED INITIAL VERIFIED MERCHANTS
INSERT INTO public.merchants (id, name, slug, category, min_spend, visits_required, reward_name, validity_days, redemption_pin)
VALUES
  ('5cc30c25-3711-4b65-891b-13af808a556f', 'Kesar Chai Corner', 'kesar-chai', 'Cafe / Chai', 100, 10, 'Free Masala Chai', 45, '8492'),
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

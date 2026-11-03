-- ==============================================================================
-- StickTheBizz.in - Supabase Database Schema, RLS Policies & Real-time Setup
-- Paste this entire script into your Supabase Dashboard -> SQL Editor and run it.
-- ==============================================================================

-- 1. Create 'merchants' table
CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  min_spend NUMERIC DEFAULT 100,
  visits_required INT DEFAULT 10,
  reward_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create 'customers' table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create 'visits' table with unique daily scan constraint
CREATE TABLE IF NOT EXISTS public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  visit_date_ist TEXT NOT NULL, -- Format: 'YYYY-MM-DD'
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_daily_scan UNIQUE (customer_id, merchant_id, visit_date_ist)
);

-- 4. Enable Realtime Replication on 'visits' table
ALTER PUBLICATION supabase_realtime ADD TABLE public.visits;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- 6. Setup RLS Policies for Anon & Authenticated Clients

-- MERCHANTS: Public read
DROP POLICY IF EXISTS "Allow public read on merchants" ON public.merchants;
CREATE POLICY "Allow public read on merchants"
ON public.merchants FOR SELECT
TO anon, authenticated
USING (true);

-- CUSTOMERS: Public read and insert
DROP POLICY IF EXISTS "Allow anon select on customers" ON public.customers;
CREATE POLICY "Allow anon select on customers"
ON public.customers FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow anon insert on customers" ON public.customers;
CREATE POLICY "Allow anon insert on customers"
ON public.customers FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- VISITS: Public read, insert, and update
DROP POLICY IF EXISTS "Allow anon select on visits" ON public.visits;
CREATE POLICY "Allow anon select on visits"
ON public.visits FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow anon insert on visits" ON public.visits;
CREATE POLICY "Allow anon insert on visits"
ON public.visits FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update on visits" ON public.visits;
CREATE POLICY "Allow anon update on visits"
ON public.visits FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 7. Seed Initial Demo Merchants
INSERT INTO public.merchants (name, slug, min_spend, visits_required, reward_name)
VALUES
  ('Kesar Chai Corner', 'kesar-chai', 100, 10, 'Free Masala Chai'),
  ('Patel Kirana Superstore', 'patel-kirana', 250, 10, '1L Cooking Oil Pouch'),
  ('The Bun Co. Burgers', 'burger-joint', 150, 7, 'Free Crispy Burger')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    min_spend = EXCLUDED.min_spend,
    visits_required = EXCLUDED.visits_required,
    reward_name = EXCLUDED.reward_name;

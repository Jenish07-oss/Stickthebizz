-- =========================================================================
-- FIX RLS FOR CUSTOMERS AND VISITS (ZERO RECURSION + FULL APPROVE/REJECT PERMISSION)
-- Run this in Supabase Dashboard -> SQL Editor
-- Resolves PostgreSQL error 42P17 and enables 1-Tap Approve & Reject
-- =========================================================================

-- 1. DROP old restrictive/recursive policies
DROP POLICY IF EXISTS "Merchant read own customers" ON public.customers;
DROP POLICY IF EXISTS "Customer read own visits" ON public.visits;
DROP POLICY IF EXISTS "Merchant owner read visits" ON public.visits;
DROP POLICY IF EXISTS "Merchant owner update visits" ON public.visits;
DROP POLICY IF EXISTS "Public update visit" ON public.visits;

-- 2. CLEAN POLICIES ON CUSTOMERS
DROP POLICY IF EXISTS "Public read customer" ON public.customers;
CREATE POLICY "Public read customer" ON public.customers
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public insert customer" ON public.customers;
CREATE POLICY "Public insert customer" ON public.customers
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Customer update own" ON public.customers;
CREATE POLICY "Customer update own" ON public.customers
  FOR UPDATE TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- 3. CLEAN POLICIES ON VISITS
DROP POLICY IF EXISTS "Public read visits" ON public.visits;
CREATE POLICY "Public read visits" ON public.visits
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public insert visit" ON public.visits;
CREATE POLICY "Public insert visit" ON public.visits
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow UPDATE on visits (for 1-Tap Approve and Reject)
CREATE POLICY "Public update visit" ON public.visits
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 4. CLEAN UP ENCODED HTML IN MERCHANT CATEGORIES (e.g. 'Cafe &#x2F; Chai' -> 'Cafe / Chai')
UPDATE public.merchants
SET category = REPLACE(category, '&#x2F;', '/')
WHERE category LIKE '%&#x2F;%';

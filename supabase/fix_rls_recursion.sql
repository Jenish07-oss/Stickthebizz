-- =========================================================================
-- FIX RLS INFINITE RECURSION FOR CUSTOMERS AND VISITS
-- Run this in Supabase Dashboard -> SQL Editor
-- Resolves PostgreSQL error 42P17 (infinite recursion detected in policy for relation "customers")
-- =========================================================================

-- 1. DROP the recursive policies that caused mutual loops
DROP POLICY IF EXISTS "Merchant read own customers" ON public.customers;
DROP POLICY IF EXISTS "Customer read own visits" ON public.visits;
DROP POLICY IF EXISTS "Merchant owner read visits" ON public.visits;

-- 2. RECREATE clean, non-recursive policies on CUSTOMERS
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
  FOR UPDATE TO authenticated
  USING (auth_id = auth.uid() OR auth_id IS NULL)
  WITH CHECK (true);

-- 3. RECREATE clean, non-recursive policies on VISITS
DROP POLICY IF EXISTS "Public read visits" ON public.visits;
CREATE POLICY "Public read visits" ON public.visits
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public insert visit" ON public.visits;
CREATE POLICY "Public insert visit" ON public.visits
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Merchant owner update visits" ON public.visits;
CREATE POLICY "Merchant owner update visits" ON public.visits
  FOR UPDATE TO authenticated
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    merchant_id IN (SELECT id FROM public.merchants WHERE owner_id = auth.uid())
  );

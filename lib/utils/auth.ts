import { createClient } from '@/lib/supabase/server';

/**
 * Verifies the authenticated user owns the given merchant.
 * Throws if not authenticated or not owner.
 * Returns the merchant record on success.
 */
export async function getAuthenticatedMerchant(merchantId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('UNAUTHENTICATED');
  
  const { data: merchant, error } = await supabase
    .from('merchants')
    .select('id, owner_id, name, slug')
    .eq('id', merchantId)
    .single();
  
  if (error || !merchant) throw new Error('MERCHANT_NOT_FOUND');
  if (merchant.owner_id !== user.id) throw new Error('FORBIDDEN: Not merchant owner');
  
  return merchant;
}

/**
 * Gets the current user's owned merchant (for dashboard contexts).
 * Returns null if user has no merchant.
 */
export async function getCurrentUserMerchant() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { user: null, merchant: null };
  
  const { data: merchant } = await supabase
    .from('merchants')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();
  
  return { user, merchant };
}
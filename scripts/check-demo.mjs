import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envRaw = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envRaw.split('\n')) {
  const clean = line.trim();
  if (!clean || clean.startsWith('#')) continue;
  const idx = clean.indexOf('=');
  if (idx !== -1) {
    const k = clean.slice(0, idx).trim();
    const v = clean.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    env[k] = v;
  }
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const { data: custs, error: custErr } = await sb
    .from('customers')
    .select('*')
    .or('phone.eq.9820012345,email.eq.demo.customer@stickthebizz.in');
  console.log('Customers found:', custs);

  const { data: demoCafe } = await sb.from('merchants').select('id, name, slug').eq('slug', 'demo-cafe').maybeSingle();
  console.log('Demo Cafe:', demoCafe);

  if (demoCafe && custs && custs.length > 0) {
    const { data: visits } = await sb.from('visits').select('*').eq('customer_id', custs[0].id).eq('merchant_id', demoCafe.id);
    console.log('Visits found:', visits ? visits.length : 0);
  }
}

main().catch(console.error);

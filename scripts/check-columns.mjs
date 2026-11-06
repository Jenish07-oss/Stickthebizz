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
  const tables = ['merchants', 'customers', 'visits', 'redemptions', 'promo_codes', 'idempotency_keys', 'audit_logs'];
  for (const t of tables) {
    const { data, error } = await sb.from(t).select('*').limit(1);
    if (data && data.length > 0) {
      console.log(`\nTable ${t}:`);
      console.log(Object.keys(data[0]));
    } else if (error) {
      console.log(`Table ${t} error:`, error.message);
    } else {
      console.log(`Table ${t}: (0 rows)`);
    }
  }
}

main().catch(console.error);


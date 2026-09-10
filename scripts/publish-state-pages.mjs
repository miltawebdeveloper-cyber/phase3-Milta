// Publish all extracted state pages in Supabase
//
// Usage:
//   node scripts/publish-state-pages.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function loadEnv() {
  const out = { ...process.env };
  for (const name of ['.env.local', '.env', 'server/.env']) {
    const file = path.join(ROOT, name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) continue;
      const k = t.slice(0, eq).trim();
      if (out[k] !== undefined) continue;
      out[k] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    }
  }
  return out;
}

async function main() {
  const env = loadEnv();
  const url = env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    console.error('Needs VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server/.env).');
    process.exitCode = 1;
    return;
  }

  const { createClient } = await import('@supabase/supabase-js');
  const db = createClient(url, key, { auth: { persistSession: false } });

  console.log('Publishing all state service pages...\n');

  // Update all pages with kind='service_state' and state is not null to status='published'
  // (service_city pages need state, city, and service all non-null)
  const { error, count } = await db
    .from('pages')
    .update({ status: 'published' })
    .eq('kind', 'service_state')
    .eq('status', 'draft')
    .not('state', 'is', null);

  if (error) {
    console.error(`Failed to publish pages: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  console.log(`✓ Published ${count || 0} service_state pages`);
  console.log('\nNote: 8 Salem pages remain as drafts (missing state), and 1 California Bookkeeping');
  console.log('page needs manual editor attention. Resolve these in the admin panel before publishing.\n');
}

main();

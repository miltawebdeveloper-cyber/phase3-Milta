// Check status of pages in Supabase
import { createClient } from '@supabase/supabase-js';
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
    console.error('Needs VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exitCode = 1;
    return;
  }

  const db = createClient(url, key, { auth: { persistSession: false } });

  // Count by status and kind
  const { data: stats } = await db
    .from('pages')
    .select('status,kind', { count: 'exact' })
    .in('kind', ['service_state', 'service_city', 'state', 'city']);

  if (stats) {
    const bystatus = {};
    stats.forEach(row => {
      const key = `${row.status}-${row.kind}`;
      bystatus[key] = (bystatus[key] || 0) + 1;
    });
    console.log('Pages by status and kind:');
    Object.entries(bystatus).forEach(([key, count]) => {
      console.log(`  ${key}: ${count}`);
    });
  }

  // Sample some draft pages
  const { data: drafts } = await db
    .from('pages')
    .select('url, status, kind, state')
    .eq('status', 'draft')
    .limit(5);

  if (drafts && drafts.length > 0) {
    console.log('\nSample draft pages:');
    drafts.forEach(p => {
      console.log(`  ${p.url} (kind=${p.kind}, state=${p.state})`);
    });
  }
}

main();

// Confirms db/001_pages.sql left the existing blog tables alone.
//
//   node scripts/verify-blogs-unchanged.mjs            # compare against baseline
//   node scripts/verify-blogs-unchanged.mjs --capture  # rewrite the baseline
//
// db/blogs-baseline.json was captured BEFORE the migration was applied. Run this
// after applying it: row counts and column sets must be identical. This is a
// check, not a promise — the migration names no existing table, but a check you
// can run beats an assurance you have to take on trust.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BASELINE = path.join(ROOT, 'db', 'blogs-baseline.json');
const CAPTURE = process.argv.includes('--capture');
const TABLES = ['blogs', 'blogs_uk'];

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

async function snapshot(url, key) {
  const tables = {};
  for (const t of TABLES) {
    const res = await fetch(`${url}/rest/v1/${t}?select=*&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact', Range: '0-0' },
    });
    if (!res.ok) throw new Error(`${t}: HTTP ${res.status}`);
    const body = await res.json();
    tables[t] = {
      rows: Number((res.headers.get('content-range') || '/0').split('/')[1]),
      columns: body[0] ? Object.keys(body[0]).sort() : [],
    };
  }
  return { captured: new Date().toISOString(), tables };
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Needs VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server/.env).');
  process.exit(1);
}

const now = await snapshot(url, key);

if (CAPTURE) {
  fs.writeFileSync(BASELINE, JSON.stringify(now, null, 2));
  console.log(`baseline written to db/blogs-baseline.json`);
  process.exit(0);
}

if (!fs.existsSync(BASELINE)) {
  console.error('No baseline. Run with --capture before applying the migration.');
  process.exit(1);
}

const before = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
console.log(`baseline captured ${before.captured}\n`);

let failed = false;
for (const t of TABLES) {
  const b = before.tables[t];
  const a = now.tables[t];
  const rowsSame = b.rows === a.rows;
  const colsSame = JSON.stringify(b.columns) === JSON.stringify(a.columns);

  console.log(`${t}`);
  console.log(`  rows    ${b.rows} -> ${a.rows}  ${rowsSame ? 'unchanged' : 'CHANGED'}`);
  console.log(`  columns ${b.columns.length} -> ${a.columns.length}  ${colsSame ? 'unchanged' : 'CHANGED'}`);
  if (!colsSame) {
    const added = a.columns.filter((c) => !b.columns.includes(c));
    const removed = b.columns.filter((c) => !a.columns.includes(c));
    if (added.length) console.log(`    added:   ${added.join(', ')}`);
    if (removed.length) console.log(`    removed: ${removed.join(', ')}`);
  }
  if (!rowsSame || !colsSame) failed = true;
}

console.log(failed ? '\nFAIL — the blog tables changed.' : '\nPASS — blog tables identical to the baseline.');
process.exitCode = failed ? 1 : 0;

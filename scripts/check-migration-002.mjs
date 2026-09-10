// Did db/002 land, and is State Data populated?
//
//   node scripts/check-migration-002.mjs          check only, writes nothing
//   node scripts/check-migration-002.mjs --seed   also fill `states` from
//                                                 statesData.js
//
// The seed exists because the descriptions already exist: statesData.js carries
// a paragraph for each of 28 states, hand-written. Starting the State Data panel
// with 28 blank rows would mean retyping copy that is already in the repo, so
// this lifts them across. It only ever fills a description that is EMPTY —
// re-running it cannot overwrite something edited in the CMS.
import fs from 'node:fs';
import { statesData } from '../src/components/Location/statesData.js';

const ROOT = 'd:/milta-web-v3/milta-web';
const SEED = process.argv.includes('--seed');

const env = {};
for (const line of fs.readFileSync(`${ROOT}/server/.env`, 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i < 0) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const REST = `${env.VITE_SUPABASE_URL}/rest/v1`;
const H = {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
  if (!ok) failures++;
};

const status = async (path) => (await fetch(`${REST}/${path}`, { headers: H })).status;

/* ── 1. Is the migration applied? ─────────────────────────────────────────── */

const statesOk = (await status('states?select=id&limit=1')) === 200;
check('`states` table exists', statesOk);

const cols = ['import_text', 'import_source', 'imported_at', 'verified_at', 'verified_by', 'verified_hash', 'verification_note'];
const missing = [];
for (const c of cols) {
  if ((await status(`pages?select=${c}&limit=1`)) !== 200) missing.push(c);
}
check('pages has the verification columns', missing.length === 0, missing.join(', '));

if (!statesOk || missing.length) {
  console.log('\nRun db/002_states_and_verification.sql in the Supabase SQL editor:');
  console.log(`  https://supabase.com/dashboard/project/${new URL(env.VITE_SUPABASE_URL).hostname.split('.')[0]}/sql/new`);
  process.exit(1);
}

// The unique index the upsert depends on. A conflict target that does not match
// an index fails on every save, so prove it by doing one.
const probe = { name: '__migration_probe__', slug: '__migration_probe__', country: 'us', description: null };
const up = await fetch(`${REST}/states?on_conflict=slug,country`, {
  method: 'POST',
  headers: { ...H, Prefer: 'resolution=merge-duplicates,return=representation' },
  body: JSON.stringify(probe),
});
check('upsert on (slug, country) works', up.status === 201 || up.status === 200,
  up.ok ? '' : (await up.text()).slice(0, 120));
await fetch(`${REST}/states?slug=eq.__migration_probe__`, { method: 'DELETE', headers: H });

/* ── 2. What is in State Data now? ────────────────────────────────────────── */

const rows = await fetch(`${REST}/states?select=slug,name,description`, { headers: H }).then((r) => r.json());
const bySlug = new Map(rows.map((r) => [r.slug, r]));
console.log(`\nstates rows: ${rows.length}`);

const fromFile = Object.entries(statesData).map(([key, v]) => ({
  slug: key.toLowerCase(),
  name: key.replace(/([A-Z])/g, ' $1').trim(),
  description: v.description || null,
}));

const needed = fromFile.filter((s) => !bySlug.get(s.slug)?.description);
console.log(`statesData.js has ${fromFile.length} states; ${needed.length} still without a description in the database.`);

if (!SEED) {
  if (needed.length) console.log('\nRun with --seed to copy those descriptions across.');
} else if (needed.length) {
  const res = await fetch(`${REST}/states?on_conflict=slug,country`, {
    method: 'POST',
    headers: { ...H, Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(needed.map((s) => ({ ...s, country: 'us', status: 'active' }))),
  });
  const body = await res.json();
  check('seeded state descriptions', res.ok, res.ok ? `${body.length} row(s)` : JSON.stringify(body).slice(0, 160));
  const after = await fetch(`${REST}/states?select=slug&limit=1000`, { headers: H }).then((r) => r.json());
  console.log(`states rows now: ${after.length}`);
}

console.log(`\n${failures ? `${failures} CHECK(S) FAILED` : 'migration 002 is applied'}`);
process.exit(failures ? 1 : 0);

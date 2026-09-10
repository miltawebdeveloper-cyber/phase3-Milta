// Recompose hero.breadcrumb on every state service page from its service's
// template and its own state — "<Service> Services in <State>", the same
// sentence createPage has always composed for a brand-new page.
//
//   node scripts/fix-breadcrumbs.mjs           dry run (default)
//   node scripts/fix-breadcrumbs.mjs --write   apply to the database
//   node scripts/fix-breadcrumbs.mjs --service Tax
//
// WHY THIS EXISTS
//   Uploading a document to an EXISTING page went through the preview endpoint,
//   which built the page's structure without knowing the page's own state —
//   server/services/contentService.js's previewDocument had no state/city
//   parameter, so server/services/layoutMerge.js's breadcrumb composer
//   (`template.breadcrumb + " " + state`) always had an empty state and fell
//   back to the raw extraction's guess: the banner title cut at 60 characters.
//   Because the dashboard saves the preview's content unchanged on Save, that
//   wrong breadcrumb is exactly what ended up stored. Creating a brand-new page
//   never had this bug — pageService.createPage passes state through — so only
//   pages that were UPDATED by document, at least once, are affected.
//
//   The code path is fixed (previewDocument now takes state/city, and every
//   caller passes them). This script is the one-time backfill for rows saved
//   before that fix.
//
// SAFETY
//   Only hero.breadcrumb changes — no other field is touched, so nothing about
//   a page's copy or structure is at risk here.
//   Every write goes through the local API's PUT /pages/:id, which snapshots
//   the row into page_revisions first — so any page can be reverted from the
//   CMS's Update history.
//   The dry run prints exactly what would change and writes nothing.
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = 'd:/milta-web-v3/milta-web';
const { templateFor } = require(`${ROOT}/server/services/serviceTemplates.js`);

const WRITE = process.argv.includes('--write');
const ONLY = (() => {
  const i = process.argv.indexOf('--service');
  return i === -1 ? null : process.argv[i + 1];
})();

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

/* ── Read every state service page ────────────────────────────────────────── */

const pages = [];
for (let from = 0; ; from += 500) {
  const batch = await fetch(
    `${REST}/pages?select=id,url,state,service,status,content&kind=eq.service_state&order=service,state`,
    { headers: { ...H, Range: `${from}-${from + 499}` } },
  ).then((r) => r.json());
  pages.push(...batch);
  if (batch.length < 500) break;
}

console.log(`${pages.length} state service pages\n`);

const changes = [];
const problems = [];
const byService = {};

for (const page of pages) {
  if (ONLY && page.service !== ONLY) continue;

  const template = templateFor(page.service);
  if (!template?.breadcrumb) { problems.push(`${page.url} — no breadcrumb on the "${page.service}" template`); continue; }
  if (!page.state) { problems.push(`${page.url} — no state on this row`); continue; }

  const correct = `${template.breadcrumb} ${page.state}`.replace(/\s+/g, ' ').trim();
  const current = page.content?.hero?.breadcrumb || '';

  const s = (byService[page.service] = byService[page.service] || { same: 0, changed: 0 });
  if (current === correct) { s.same += 1; continue; }

  s.changed += 1;
  changes.push({ page, current, correct });
}

/* ── Report ───────────────────────────────────────────────────────────────── */

console.log('service                already correct   would change');
for (const [service, s] of Object.entries(byService).sort()) {
  console.log(`  ${service.padEnd(22)}${String(s.same).padStart(8)}${String(s.changed).padStart(16)}`);
}

console.log(`\n${changes.length} page(s) would change, ${pages.length - changes.length - problems.length} already correct.`);

if (problems.length) {
  console.log(`\n${problems.length} PROBLEM(S) — nothing will be written for these:`);
  problems.slice(0, 12).forEach((p) => console.log(`  ${p}`));
}

if (changes.length) {
  console.log('\nExamples:');
  for (const c of changes.slice(0, 8)) {
    console.log(`  ${c.page.url}`);
    console.log(`    before: ${JSON.stringify(c.current)}`);
    console.log(`    after : ${JSON.stringify(c.correct)}`);
  }
}

if (!WRITE) {
  console.log('\nDry run — nothing written. Re-run with --write to apply.');
  process.exit(0);
}

/* ── Write, through the API so every page gets a revision ─────────────────── */

const token = (() => {
  const crypto = require('node:crypto');
  const b64 = (b) => Buffer.from(b).toString('base64url');
  const payload = b64(JSON.stringify({ sub: 'breadcrumb-fix', iat: Date.now(), exp: Date.now() + 36e5 }));
  const mac = crypto.createHmac('sha256', env.ADMIN_SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${mac}`;
})();

const API = process.env.API_BASE || 'http://127.0.0.1:5199/api/content';
let ok = 0;
let failed = 0;

for (const c of changes) {
  const content = { ...c.page.content, hero: { ...(c.page.content?.hero || {}), breadcrumb: c.correct } };
  const res = await fetch(`${API}/pages/${c.page.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, note: 'breadcrumb fix' }),
  });
  if (res.ok) ok += 1;
  else { failed += 1; console.log(`  FAILED ${c.page.url} — ${res.status} ${(await res.text()).slice(0, 100)}`); }
}

console.log(`\napplied to ${ok} page(s), ${failed} failed.`);
process.exit(failed ? 1 : 0);

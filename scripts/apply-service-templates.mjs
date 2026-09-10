// Bring every state service page onto its service's frozen template.
//
//   node scripts/apply-service-templates.mjs           dry run (default)
//   node scripts/apply-service-templates.mjs --write   apply to the database
//   node scripts/apply-service-templates.mjs --service Bookkeeping
//
// Each service's structure is frozen in db/service-templates.json. Roughly half
// the pages of any service already match it; the rest have drifted — a missing
// whyEssential here, a lost "INDUSTRIES WE SERVE" eyebrow there. This brings them
// into line so a Bookkeeping page in one state is the same page in another.
//
// SAFETY, because this rewrites published content:
//
//   Nothing is deleted. applyTemplate reuses a page's own sections for the
//   template's slots and carries anything left over through to the end.
//
//   Nothing is invented. Sections a page does not have are added EMPTY, and
//   ServiceLayout skips a section with no content, so an added-but-unfilled
//   section changes nothing a visitor sees until someone types into it.
//
//   Every write goes through updatePage, which snapshots the row into
//   page_revisions first — so any page can be reverted from the CMS.
//
// The dry run prints exactly what would change and writes nothing.
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = 'd:/milta-web-v3/milta-web';
const { applyTemplate, templateFor } = require(`${ROOT}/server/services/serviceTemplates.js`);

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

const RENDER_ORDER = ['hero', 'intro', 'prose', 'whyEssential', 'solutions', 'cardGroups',
  'checklists', 'comparisonTable', 'advantages', 'industries', 'closing', 'faqs'];

const rendererOf = (g) => {
  if (!g || typeof g !== 'object') return null;
  if (g.rows) return 'table';
  if (g.paragraphs) return 'prose';
  if (Array.isArray(g.items)) return typeof g.items[0] === 'string' ? 'checklist' : 'cards';
  return null;
};

const shapeOf = (c) => {
  const out = [];
  for (const key of RENDER_ORDER) {
    if (!(key in (c || {}))) continue;
    if (key === 'hero' || key === 'faqs') { out.push(key); continue; }
    const nodes = Array.isArray(c[key]) ? c[key] : [c[key]];
    nodes.forEach((n) => { const k = rendererOf(n); if (k) out.push(`${key}:${k}`); });
  }
  return out.join(' > ');
};

// Every word of COPY on the page, so the pass can prove it did not lose any.
//
// Stringifying the object and splitting it counts the key names too, which made
// this report "lost: advantages" whenever an `advantages` section was folded into
// cardGroups — the copy had moved, only the key was gone. Walking the values is
// the difference between a real loss and a rename.
const wordsOf = (node, out = []) => {
  if (typeof node === 'string') {
    node.replace(/[^A-Za-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean).forEach((w) => out.push(w));
  } else if (Array.isArray(node)) {
    node.forEach((v) => wordsOf(v, out));
  } else if (node && typeof node === 'object') {
    Object.values(node).forEach((v) => wordsOf(v, out));
  }
  return out;
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
  if (!templateFor(page.service)) { problems.push(`${page.url} — no template for "${page.service}"`); continue; }

  const before = page.content;
  const { content: after, report } = applyTemplate(before, page.service);

  const beforeShape = shapeOf(before);
  const afterShape = shapeOf(after);

  // The guarantee that makes this safe to run over published pages.
  const lost = (() => {
    const b = wordsOf(before);
    const a = new Set(wordsOf(after));
    return b.filter((w) => !a.has(w));
  })();
  if (lost.length) problems.push(`${page.url} — would lose ${lost.length} word(s): ${lost.slice(0, 6).join(', ')}`);

  const s = (byService[page.service] = byService[page.service] || { same: 0, changed: 0, added: 0 });
  if (beforeShape === afterShape) { s.same += 1; continue; }

  s.changed += 1;
  s.added += report.added;
  changes.push({ page, beforeShape, afterShape, report, after, lost: lost.length });
}

/* ── Report ───────────────────────────────────────────────────────────────── */

console.log('service                already matching   would change   sections added');
for (const [service, s] of Object.entries(byService).sort()) {
  console.log(`  ${service.padEnd(22)}${String(s.same).padStart(8)}${String(s.changed).padStart(15)}${String(s.added).padStart(16)}`);
}

console.log(`\n${changes.length} page(s) would change, ${pages.length - changes.length} already match.`);

if (problems.length) {
  console.log(`\n${problems.length} PROBLEM(S) — nothing will be written for these:`);
  problems.slice(0, 12).forEach((p) => console.log(`  ${p}`));
}

if (changes.length) {
  console.log('\nExamples:');
  for (const c of changes.slice(0, 3)) {
    console.log(`\n  ${c.page.url}  [${c.page.status}]`);
    console.log(`    before: ${c.beforeShape}`);
    console.log(`    after : ${c.afterShape}`);
    console.log(`    reused ${c.report.matched} section(s), added ${c.report.added} empty, kept ${c.report.extra} extra`);
  }
}

if (!WRITE) {
  console.log('\nDry run — nothing written. Re-run with --write to apply.');
  process.exit(problems.length ? 1 : 0);
}

if (problems.length) {
  console.log('\nRefusing to write while there are problems above.');
  process.exit(1);
}

/* ── Write, through the API so every page gets a revision ─────────────────── */

const token = (() => {
  const crypto = require('node:crypto');
  const b64 = (b) => Buffer.from(b).toString('base64url');
  const payload = b64(JSON.stringify({ sub: 'template-pass', iat: Date.now(), exp: Date.now() + 36e5 }));
  const mac = crypto.createHmac('sha256', env.ADMIN_SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${mac}`;
})();

const API = process.env.API_BASE || 'http://127.0.0.1:5199/api/content';
let ok = 0;
let failed = 0;

for (const c of changes) {
  const res = await fetch(`${API}/pages/${c.page.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: c.after, note: `service template: ${c.page.service}` }),
  });
  if (res.ok) ok += 1;
  else { failed += 1; console.log(`  FAILED ${c.page.url} — ${res.status} ${(await res.text()).slice(0, 100)}`); }
}

console.log(`\napplied to ${ok} page(s), ${failed} failed.`);
process.exit(failed ? 1 : 0);

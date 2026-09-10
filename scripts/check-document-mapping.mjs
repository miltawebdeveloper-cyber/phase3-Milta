// Prove a document is read accurately and lands in the right sections.
//
//   node scripts/check-document-mapping.mjs [--explain]
//
// The test is a ROUND TRIP. A real Bookkeeping page is written out as a document
// the way an author would write one — a heading, its paragraphs, its points —
// and that document is read back through the real pipeline against the real
// Bookkeeping template. If the read and the mapping are accurate, the page that
// comes out is the page that went in: same headings, same copy, same points, in
// the same sections, in the same order.
//
// Round-tripping is what makes this worth running. Asserting against a fixture I
// wrote by hand would only prove the parser agrees with my expectations of it;
// asserting against a page that already exists proves it agrees with the pages
// the CMS has to reproduce.
//
// --explain prints the whole mapping, block by block, for reading by eye.
import fs from 'node:fs';
import { createRequire } from 'node:module';

const ROOT = 'd:/milta-web-v3/milta-web';
const require = createRequire(import.meta.url);
const EXPLAIN = process.argv.includes('--explain');

const documentService = require(`${ROOT}/server/services/documentService.js`);
const { applyDocumentStructure } = require(`${ROOT}/server/services/layoutMerge.js`);
const { templateFor } = require(`${ROOT}/server/services/serviceTemplates.js`);

const SOURCE_URL = '/us/services/best-bookkeeping-services-in-delaware/';
const page = JSON.parse(fs.readFileSync(`${ROOT}/db/extracted-pages.json`, 'utf8'))
  .find((r) => r.url === SOURCE_URL);

const checks = [];
const check = (name, ok, detail = '') => checks.push([name, ok, detail]);

/* ── 1. Write the page out as a document ──────────────────────────────────── */

// How an author actually writes these: an <h1> for the page, an <h2> per
// section, paragraphs as paragraphs, points as a list, and cards as
// "Title — description" bullets, which is the shape layoutService recognises.
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const sectionToHtml = (node) => {
  const out = [];
  const heading = [node.titleLead, node.highlight].filter(Boolean).join(' ').trim();
  if (heading) out.push(`<h2>${esc(heading)}</h2>`);
  if (node.subtitle) out.push(`<p>${esc(node.subtitle)}</p>`);
  for (const p of node.paragraphs || []) if (String(p).trim()) out.push(`<p>${esc(p)}</p>`);

  const items = node.items || [];
  if (items.length) {
    const li = items.map((it) => (typeof it === 'string'
      ? `<li>${esc(it)}</li>`
      : `<li>${esc(it.title)} — ${esc(it.desc || (it.bullets || []).join('; '))}</li>`));
    out.push(`<ul>${li.join('')}</ul>`);
  }
  if (node.footnote) out.push(`<p>${esc(node.footnote)}</p>`);
  return out.join('\n');
};

const c = page.content;
const ORDER = ['intro', 'prose', 'whyEssential', 'solutions', 'cardGroups', 'industries'];

const html = [
  `<h1>${esc([c.hero.titleLead, c.hero.highlight].filter(Boolean).join(' '))}</h1>`,
  `<p>${esc(c.hero.subtitle)}</p>`,
  ...ORDER.flatMap((key) => {
    const v = c[key];
    if (!v) return [];
    return Array.isArray(v) ? v.map(sectionToHtml) : [sectionToHtml(v)];
  }),
  '<h2>Frequently Asked Questions</h2>',
  ...(c.faqs || []).flatMap((f) => [`<h3>${esc(f.q)}</h3>`, `<p>${esc(f.a)}</p>`]),
].join('\n\n');

/* ── 2. Read it back through the real pipeline ────────────────────────────── */

const extracted = await documentService.extract(
  Buffer.from(html, 'utf8'), 'text/html', 'bookkeeping-roundtrip.html',
);

const incoming = extracted.fields.content;
const template = templateFor('Bookkeeping');
const { content: rebuilt, report } = applyDocumentStructure({}, incoming, { template });

/* ── 3. Was the document READ accurately? ─────────────────────────────────── */

const headingsIn = [...html.matchAll(/<h2>([\s\S]*?)<\/h2>/g)].map((m) => m[1]);
const paragraphsIn = [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].length;
const pointsIn = [...html.matchAll(/<li>([\s\S]*?)<\/li>/g)].length;

check('every heading in the document was found',
  extracted.stats.headings >= headingsIn.length,
  `${extracted.stats.headings} found, ${headingsIn.length} written`);

check('every paragraph was found',
  extracted.stats.paragraphs >= paragraphsIn - (c.faqs || []).length,
  `${extracted.stats.paragraphs} found, ${paragraphsIn} written`);

check('every point was found',
  extracted.stats.bullets === pointsIn,
  `${extracted.stats.bullets} found, ${pointsIn} written`);

check('the questions were recognised as FAQs',
  (incoming.faqs || []).length === (c.faqs || []).length,
  `${(incoming.faqs || []).length} of ${(c.faqs || []).length}`);

/* ── 4. Did every word survive? ───────────────────────────────────────────── */

const words = (s) => String(s).toLowerCase().replace(/<[^>]+>/g, ' ').split(/[^a-z0-9]+/).filter(Boolean);
const bag = (list) => list.reduce((m, w) => m.set(w, (m.get(w) || 0) + 1), new Map());

const wanted = bag(words(html));
const got = bag(words(JSON.stringify(rebuilt)));
const missing = [...wanted].filter(([w, n]) => (got.get(w) || 0) < n).map(([w]) => w);

check('no word of the document is missing from the page',
  missing.length === 0,
  missing.slice(0, 12).join(', '));

/* ── 5. Did each section land where it came from? ─────────────────────────── */

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const headingOf = (n) => norm([n?.titleLead, n?.highlight].filter(Boolean).join(' '));

// Where each section of the ORIGINAL page ended up in the REBUILT one. A section
// that came from `whyEssential` must go back into `whyEssential`, or the mapping
// has put an author's copy under the wrong design.
const landedIn = new Map();
for (const [key, value] of Object.entries(rebuilt)) {
  if (key === 'order' || key === 'hero' || key === 'faqs' || key === 'faqsHeading') continue;
  for (const node of Array.isArray(value) ? value : [value]) {
    const h = headingOf(node);
    if (h) landedIn.set(h, key);
  }
}

for (const key of ORDER) {
  const v = c[key];
  if (!v) continue;
  for (const node of Array.isArray(v) ? v : [v]) {
    const h = headingOf(node);
    if (!h) continue;
    check(`"${h.slice(0, 44)}" goes back into ${key}`,
      landedIn.get(h) === key, `landed in ${landedIn.get(h) || '(nowhere)'}`);
  }
}

/* ── 6. Is the ORDER the document's order? ────────────────────────────────── */

const idOf = new Map();
for (const [key, value] of Object.entries(rebuilt)) {
  if (key === 'order') continue;
  if (Array.isArray(value) && key !== 'faqs') {
    value.forEach((n, i) => { const h = headingOf(n); if (h) idOf.set(h, `${key}.${i}`); });
  } else {
    const h = headingOf(value);
    if (h) idOf.set(h, key);
  }
}

const documentSequence = ORDER.flatMap((key) => {
  const v = c[key];
  if (!v) return [];
  return (Array.isArray(v) ? v : [v]).map(headingOf).filter(Boolean);
});

const renderedSequence = (rebuilt.order || [])
  // The banner is not one of the document's body sections — it is the <h1> —
  // and `documentSequence` below lists only the body. Including it here made
  // the two lists differ by one entry and reported a correct order as wrong.
  .filter((id) => id !== 'hero' && id !== 'faqs')
  .map((id) => [...idOf].find(([, v]) => v === id)?.[0])
  .filter(Boolean);

check('the page renders its sections in the document order',
  JSON.stringify(renderedSequence) === JSON.stringify(documentSequence),
  `\n      got:      ${JSON.stringify(renderedSequence.map((s) => s.slice(0, 20)))}\n      document: ${JSON.stringify(documentSequence.map((s) => s.slice(0, 20)))}`);

/* ── 7. Are the POINTS still points, and the cards still cards? ───────────── */

const kindOf = (n) => (n?.rows ? 'table' : n?.paragraphs && !n?.items ? 'prose'
  : Array.isArray(n?.items) ? (typeof n.items[0] === 'string' ? 'checklist' : 'cards') : 'prose');

for (const key of ORDER) {
  const v = c[key];
  if (!v) continue;
  const before = Array.isArray(v) ? v : [v];
  before.forEach((node) => {
    const h = headingOf(node);
    if (!h) return;
    const after = Object.values(rebuilt).flatMap((x) => (Array.isArray(x) ? x : [x]))
      .find((n) => n && typeof n === 'object' && headingOf(n) === h);
    if (!after) return;
    check(`"${h.slice(0, 36)}" keeps its ${kindOf(node)} design`,
      kindOf(after) === kindOf(node), `became ${kindOf(after)}`);
  });
}

/* ── explain ──────────────────────────────────────────────────────────────── */

if (EXPLAIN) {
  console.log('\n── what the document said, and where it went ──\n');
  for (const id of rebuilt.order || []) {
    const [key, i] = id.split('.');
    const node = i === undefined ? rebuilt[key] : rebuilt[key][Number(i)];
    if (key === 'hero') { console.log(`  ${id.padEnd(16)} banner    "${[node.titleLead, node.highlight].filter(Boolean).join(' ').slice(0, 56)}"`); continue; }
    if (key === 'faqs') { console.log(`  ${id.padEnd(16)} faqs      ${(node || []).length} pairs`); continue; }
    const h = [node?.titleLead, node?.highlight].filter(Boolean).join(' ');
    const n = (node?.items || node?.paragraphs || []).filter((x) => (typeof x === 'string' ? x.trim() : true)).length;
    console.log(`  ${id.padEnd(16)} ${kindOf(node).padEnd(9)} ${n} entr${n === 1 ? 'y' : 'ies'}  "${h.slice(0, 50)}"`);
  }
  const blanks = (report.blankedNames || []);
  if (blanks.length) console.log(`\n  left blank (not in the document): ${blanks.join(', ')}`);
  console.log();
}

let failed = 0;
for (const [name, ok, detail] of checks) {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${ok || !detail ? '' : `: ${detail}`}`);
  if (!ok) failed += 1;
}
console.log(`\nread: ${extracted.stats.headings} headings, ${extracted.stats.paragraphs} paragraphs, ${extracted.stats.bullets} points, ${extracted.stats.faqs} faqs`);
console.log(`mapped: ${report.sections} section(s), ${report.dressed + report.fromTemplate} styled, ${report.blanked} left blank, ${report.appended} appended`);
console.log(`${checks.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

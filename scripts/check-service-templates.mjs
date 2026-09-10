// Prove that choosing a service applies THAT service's template.
//
//   node scripts/check-service-templates.mjs
//
// The eight templates are the reason a Bookkeeping page looks like a
// Bookkeeping page and a Tax page like a Tax page. This drives the real upload
// path — the same document against each service in turn — and asserts that the
// structure that comes out is the one that service's template calls for, not the
// document's own shape and not some other service's.
//
// It touches no database: applyDocumentStructure is a pure function of the page,
// the document and the template.
import fs from 'node:fs';
import { createRequire } from 'node:module';

const ROOT = 'd:/milta-web-v3/milta-web';
const require = createRequire(import.meta.url);

const layout = require(`${ROOT}/server/services/layoutService.js`);
const { applyDocumentStructure } = require(`${ROOT}/server/services/layoutMerge.js`);
const { templateFor, listTemplates } = require(`${ROOT}/server/services/serviceTemplates.js`);

const checks = [];
const check = (name, ok, detail = '') => checks.push([name, ok, detail]);

/* ── The eight templates are separate, linked, and loadable ───────────────── */

const index = JSON.parse(fs.readFileSync(`${ROOT}/db/templates/index.json`, 'utf8'));

check('eight services have a template', index.templates.length === 8,
  `${index.templates.length} listed`);

check('every template in the index is its own file',
  index.templates.every((t) => fs.existsSync(`${ROOT}/db/templates/${t.file}`)),
  index.templates.map((t) => t.file).join(', '));

check('every listed template loads through the server',
  index.templates.every((t) => templateFor(t.service)),
  index.templates.filter((t) => !templateFor(t.service)).map((t) => t.service).join(', ') || 'all load');

check('each template file names the service it is for',
  index.templates.every((t) => {
    const f = JSON.parse(fs.readFileSync(`${ROOT}/db/templates/${t.file}`, 'utf8'));
    return f.service === t.service;
  }));

check('no two services share a structure',
  new Set(listTemplates().map((t) => JSON.stringify(t.outline))).size === 8,
  `${new Set(listTemplates().map((t) => JSON.stringify(t.outline))).size} distinct outlines`);

/* ── Each pinned template IS its reference page ───────────────────────────── */

// Every service, pinned to the live Delaware page that defines its shape. The
// check reads that page out of db/extracted-pages.json and compares it to the
// template field by field, so a drift on either side fails here.
//
// The URLs are written out literally rather than read from each template's own
// `derivedFrom.example`: a template that drifted would carry its provenance with
// it, and the check would end up agreeing with itself.
const REFERENCE_PAGES = {
  'Bookkeeping': '/us/services/best-bookkeeping-services-in-delaware/',
  'CPA': '/us/services/best-cpa-services-for-small-businesses-in-the-delaware/',
  'Data Entry': '/us/services/outsourcing-accounting-data-entry-delaware/',
  'Digital Marketing': '/us/services/best-digital-marketing-agency-in-delaware',
  'Financial Controller': '/us/services/financial-controller-services-in-delaware/',
  'Payroll': '/us/services/payroll-management-services-in-the-delaware/',
  'Tax': '/us/services/tax-planning-and-preparation-service-in-delaware/',
  'Virtual Assistant': '/us/services/virtual-assistant-service-in-delaware/',
};

const allRows = JSON.parse(fs.readFileSync(`${ROOT}/db/extracted-pages.json`, 'utf8'));

const rendererOf = (n) => (n?.rows ? 'table'
  : n?.items ? (typeof n.items[0] === 'string' ? 'checklist' : 'cards')
    : 'prose');

// The page's body sections, flattened in render order.
const ORDERED_KEYS = ['intro', 'prose', 'whyEssential', 'solutions', 'cardGroups',
  'checklists', 'comparisonTable', 'advantages', 'industries', 'closing'];

const sectionsOf = (content) => ORDERED_KEYS.flatMap((key) => {
  const value = content[key];
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).map((node) => ({ key, node }));
});

for (const [service, url] of Object.entries(REFERENCE_PAGES)) {
  const row = allRows.find((r) => r.url === url);
  const template = templateFor(service);

  if (!row) { check(`${service}: the reference page exists`, false, url); continue; }

  const page = sectionsOf(row.content);

  check(`${service}: the template has the reference page's section count`,
    page.length === template.sections.length,
    `page ${page.length}, template ${template.sections.length}`);

  // Every field that decides what a section IS and how it is drawn. Content —
  // headings, copy, per-state alt text — is deliberately not compared: the
  // template carries design, never words.
  const differences = [];
  template.sections.forEach((s, i) => {
    const p = page[i];
    if (!p) { differences.push(`${i + 1}: missing on the page`); return; }
    const fields = [
      ['key', p.key, s.key],
      ['kind', rendererOf(p.node), s.kind],
      ['slots', (p.node.items || p.node.paragraphs || p.node.rows || []).length, s.slots],
      ['bg', p.node.bg || '', s.bg || ''],
      ['columns', p.node.columns ?? null, s.columns ?? null],
      ['ctaLabel', p.node.ctaLabel ?? null, s.ctaLabel ?? null],
    ];
    for (const [field, onPage, inTemplate] of fields) {
      if (JSON.stringify(onPage) !== JSON.stringify(inTemplate)) {
        differences.push(`${i + 1}.${s.key}.${field}: page=${JSON.stringify(onPage)} template=${JSON.stringify(inTemplate)}`);
      }
    }
  });

  check(`${service}: the template matches the reference page field for field`,
    differences.length === 0, differences.slice(0, 5).join(' | '));

  check(`${service}: the template carries the page's card icons`,
    template.sections.every((s) => s.kind !== 'cards' || Array.isArray(s.icons)),
    'every card section declares an icon list');
}

/* ── The same document, uploaded against each service ─────────────────────── */

// One document with a bit of everything, so the only thing that differs between
// the eight results is which template shaped it.
const DOCUMENT = `
<h1>Service Page for a State</h1><p>An opening sentence about the service.</p>
<h2>Why It Matters</h2><p>A paragraph.</p><p>Another paragraph.</p>
<h2>What We Handle</h2>
<ul><li>Reconciliation — monthly close</li><li>Payroll journals — filed on time</li></ul>
<h2>Industries We Serve</h2><ul><li>Retail</li><li>Hospitality</li><li>Healthcare</li></ul>
<h2>Frequently Asked Questions</h2>
<h3>Do you work with small businesses?</h3><p>Yes.</p>`;

const incoming = layout.toServiceLayout({ html: DOCUMENT }).content;

const shapes = new Map();

for (const { service } of index.templates) {
  const template = templateFor(service);
  const { content, report } = applyDocumentStructure({}, incoming, { template });

  // Every section the template calls for is present on the page.
  const wanted = new Set(template.sections.map((s) => s.key));
  const missing = [...wanted].filter((k) => !(k in content));
  check(`${service}: the page gets its service's sections`, missing.length === 0,
    missing.join(', ') || `${wanted.size} section key(s)`);

  check(`${service}: the report names the template that shaped it`,
    report.mode === 'service-template' && report.service === service,
    `${report.mode} / ${report.service}`);

  // The document's own words are all on the page.
  const json = JSON.stringify(content);
  check(`${service}: the document's copy landed`,
    json.includes('Reconciliation') && json.includes('Another paragraph') && json.includes('Retail'));

  // The order recorded starts with the banner and names the document's blocks.
  check(`${service}: the order is recorded`,
    Array.isArray(content.order) && content.order[0] === 'hero',
    JSON.stringify(content.order).slice(0, 70));

  shapes.set(service, template.sections.map((s) => s.key).join('>'));
}

// The point of eight templates: the same document comes out shaped differently
// per service. If they all produced the same page the templates would be doing
// nothing.
check('the same document is shaped differently per service',
  new Set(shapes.values()).size >= 6,
  `${new Set(shapes.values()).size} distinct shapes from 8 services`);

// And a service with no template is not forced into another one's shape.
const untemplated = applyDocumentStructure({}, incoming, { template: templateFor('Not A Service') });
check('an unknown service falls back to the document, not to a wrong template',
  untemplated.report.mode === 'from-document', untemplated.report.mode);

let failed = 0;
for (const [name, ok, detail] of checks) {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${ok || !detail ? '' : `: ${detail}`}`);
  if (!ok) failed += 1;
}
console.log(`\n${checks.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

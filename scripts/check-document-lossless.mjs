// Prove a document upload loses nothing.
//
// The converter turns markup into ServiceLayout sections, and the risk with any
// such mapping is that copy which does not fit a heuristic is quietly dropped —
// a paragraph before the first heading, a one-row table, a heading whose section
// came out empty. A page that renders but is missing two sentences is worse than
// one that fails loudly, because nobody notices.
//
// Method: take every word in the source document, take every word in the
// produced content object, and assert the first is a subset of the second.
// Word-level rather than block-level, so a dropped clause is caught, not just a
// dropped section.
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = 'd:/milta-web-v3/milta-web';
const layout = require(`${ROOT}/server/services/layoutService.js`);
const documentService = require(`${ROOT}/server/services/documentService.js`);
const iconNames = require(`${ROOT}/db/icon-names.json`);
const { applyDocumentStructure } = require(`${ROOT}/server/services/layoutMerge.js`);
const { blankOf, rendererOf } = require(`${ROOT}/server/services/sectionLibrary.js`);
const { applyTemplate, templateFor } = require(`${ROOT}/server/services/serviceTemplates.js`);

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
  if (!ok) failures++;
};

// Words a reader would see. Markup, punctuation and case are not content.
const words = (s) =>
  String(s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

const bag = (list) => list.reduce((m, w) => m.set(w, (m.get(w) || 0) + 1), new Map());

// A comparison table's cells are the one thing deliberately NOT carried across
// as words: "Yes" becomes marks:[true], which ServiceLayout draws as a tick icon.
// The information survives, the word does not, so these are excluded here — and
// asserted separately below, so the exemption cannot hide a real loss.
const TICK_WORD = /^(yes|no|y|n|x|true|false|na)$/;

// Every source word must appear in the output at least as often as in the input.
const missingFrom = (sourceText, content) => {
  const src = bag(words(sourceText));
  const out = bag(words(JSON.stringify(content)));
  const gone = [];
  for (const [w, n] of src) {
    if (TICK_WORD.test(w)) continue;
    const have = out.get(w) || 0;
    if (have < n) gone.push(`${w} (${n} -> ${have})`);
  }
  return gone;
};

const report = (label, source, content) => {
  const gone = missingFrom(source, content);
  check(label, gone.length === 0, gone.slice(0, 8).join(', '));
  return gone;
};

/* ── 1. A document with every shape at once ───────────────────────────────── */

const FULL = `
<p>Opening line that arrives before any heading at all.</p>
<p>A second lead paragraph, also before the first heading.</p>
<h1>Bookkeeping Services in Oregon</h1>
<p>Accurate books for small businesses across Oregon.</p>
<h2>Why It Matters</h2>
<p>Clean books make tax season predictable.</p>
<p>They also make financing conversations easier.</p>
<ul><li>Monthly reconciliation</li><li>Payroll journals</li></ul>
<h2>Controller versus CFO</h2>
<table>
  <tr><th>Capability</th><th>Controller</th><th>CFO</th></tr>
  <tr><td>Bookkeeping oversight</td><td>Yes</td><td>Yes</td></tr>
</table>
<h2>Single Row Notice</h2>
<table><tr><td>One lonely cell of genuine copy</td></tr></table>
<h3>A heading with nothing beneath it</h3>
<blockquote>A quoted sentence worth keeping.</blockquote>
<h2>Frequently Asked Questions</h2>
<p>Q: How fast is onboarding?</p>
<p>A: Usually five business days.</p>
`;

const full = layout.toServiceLayout({ html: FULL, text: '' });
report('nothing dropped from a document using every shape', FULL, full.content);
console.log(`      sections: ${(full.content.cardGroups || []).length}, faqs: ${(full.content.faqs || []).length}`);

// The tick words excluded above must actually be present as marks, or the
// exemption would be hiding a dropped table.
const table = (full.content.cardGroups || []).find((g) => g.rows);
check('the tick table kept its rows', !!table && table.rows.length === 1, `${table?.rows?.length ?? 0} row(s)`);
check('"Yes" cells became ticks, not nothing',
  !!table && table.rows[0].marks.filter(Boolean).length === 2,
  JSON.stringify(table?.rows?.[0]?.marks));
check('the tick table kept its headers',
  !!table && table.headers.join(' ') === 'Capability Controller CFO', (table?.headers || []).join(' '));

/* ── 2. The specific traps, each on its own ───────────────────────────────── */

const LEAD = '<p>This paragraph comes first.</p><h2>Then A Heading</h2><p>Then body copy.</p>';
report('copy before the first heading survives', LEAD, layout.toServiceLayout({ html: LEAD, text: '' }).content);

const ONE_ROW = '<h2>Notice</h2><table><tr><td>Only one row here</td></tr></table>';
report('a one-row table survives', ONE_ROW, layout.toServiceLayout({ html: ONE_ROW, text: '' }).content);

const FAQ_ONLY = '<h2>Payroll FAQs</h2><p>Some copy that is not a question.</p>';
report('an FAQ heading with no pairs survives', FAQ_ONLY, layout.toServiceLayout({ html: FAQ_ONLY, text: '' }).content);

const EMPTY_HEADING = '<h2>Lonely Heading</h2><h2>Another Heading</h2><p>Body.</p>';
report('a heading with no body survives', EMPTY_HEADING, layout.toServiceLayout({ html: EMPTY_HEADING, text: '' }).content);

const QUOTE = '<h2>Testimonial</h2><blockquote>Quoted words matter too.</blockquote>';
report('a blockquote survives', QUOTE, layout.toServiceLayout({ html: QUOTE, text: '' }).content);

const NO_HEADING = '<p>Just one paragraph and nothing else at all.</p>';
report('a document with no heading survives', NO_HEADING, layout.toServiceLayout({ html: NO_HEADING, text: '' }).content);

const NESTED = '<ul><li>Outer item<ul><li>Inner item</li></ul></li></ul>';
report('a nested list survives', NESTED, layout.toServiceLayout({ html: NESTED, text: '' }).content);

/* ── 3. Plain text, the PDF path ──────────────────────────────────────────── */

const TEXT = [
  'Payroll in Salem',
  'We run payroll for local firms of every size.',
  'What We Do',
  '- Filings and remittances',
  '- Direct deposit setup',
  'Closing thought that ends the document.',
].join('\n');
report('plain text loses nothing', TEXT, layout.toServiceLayout({ html: null, text: TEXT }).content);

/* ── 4. Through the real upload path, end to end ──────────────────────────── */

const html = `<h1>Tax Services in Ohio</h1><p>Intro copy.</p><h2>What We Handle</h2>
<ul><li>Returns</li><li>Planning</li></ul><p>A closing paragraph.</p>`;
const extracted = await documentService.extract(Buffer.from(html, 'utf8'), 'text/html', 'page.html');
check('upload path produces servicelayout/v1',
  extracted.contentFormat === 'servicelayout/v1', extracted.contentFormat);
report('nothing dropped through the real upload path', html, extracted.content);

/* ── 5. Presentation: does it LOOK like a ServiceLayout page? ─────────────── */
//
// A document produced valid sections that rendered flat: no accent-coloured
// heading tail, no alternating section bands, and — in one real upload — a
// scaffolding line ("Banner Section:") promoted to the page's <h1>. The content
// was right and the page still looked nothing like a hand-built one.

const STYLED = `
<h2>Banner Section:</h2>
<h1>Bookkeeping Services in Colorado</h1>
<p>We keep books accurate for Colorado firms.</p>
<h2>Why It Matters</h2>
<p>Clean books make tax season predictable.</p>
<h2>What You Get</h2>
<ul><li>Monthly reconciliation</li><li>Payroll journals</li></ul>
<h2>How We Help</h2>
<p>We reconcile monthly and file on time.</p>
`;

const styled = layout.toServiceLayout({ html: STYLED, text: '' }).content;
const groups = styled.cardGroups || [];

check('hero heading is split for the accent colour',
  !!styled.hero.titleLead && !!styled.hero.highlight,
  `"${styled.hero.titleLead}" + "${styled.hero.highlight}"`);

check('the split falls after the preposition',
  styled.hero.highlight === 'Colorado', styled.hero.highlight);

check('scaffolding never becomes the heading',
  !JSON.stringify(styled).includes('Banner Section'));

check('every section heading carries a highlight',
  groups.every((g) => !g.titleLead || g.highlight),
  groups.map((g) => `${g.titleLead}|${g.highlight}`).join(' · '));

check('section backgrounds alternate',
  groups.every((g, i) => g.bg === (i % 2 === 0 ? 'default' : 'paper')),
  groups.map((g) => g.bg).join(', '));

/* ── 6. The section contract: does each block reach the right renderer? ───── */
//
// CardGroup is the design this site is built from — 552 hand-built sections use
// it against 110 checklists — and an upload could not produce one, because
// CardGroup needs {icon, title, desc} and a document's bullets arrive as plain
// strings. Every imported page therefore came out as flat prose and checklists:
// right content, wrong design. These assert the routing, not the words.


const CONTRACT = `
<h1>Bookkeeping Services in Colorado</h1><p>We keep books accurate for Colorado firms.</p>
<h2>Why Choose Us</h2>
<ul>
  <li>Expert Oversight — we handle month-end close end to end</li>
  <li>Regulatory Compliance — filings prepared and submitted on time</li>
  <li>Accurate Reporting — dashboards refreshed every week</li>
</ul>
<h2>What We Deliver</h2>
<h3>Payroll Processing</h3><p>We run payroll and handle remittances.</p>
<h3>Tax Preparation</h3><p>Returns prepared and filed on schedule.</p>
<h2>Our Coverage</h2>
<ul><li>Denver</li><li>Boulder</li><li>Aurora</li></ul>
`;

const c = layout.toServiceLayout({ html: CONTRACT, text: '' }).content;
const kinds = (c.cardGroups || []).map(rendererOf);

report('the contract sample loses no words', CONTRACT, c);
check('bullets with a lead-in become cards', kinds[0] === 'cards', kinds.join(', '));
check('sub-heading + paragraph becomes cards', kinds[1] === 'cards', kinds.join(', '));
check('plain bullets stay a checklist', kinds[2] === 'checklist', kinds.join(', '));

const cards = (c.cardGroups?.[0]?.items) || [];
check('cards carry title and description',
  cards.every((i) => i.title && i.desc), JSON.stringify(cards[0] || {}));
check('cards are given an icon from the registry',
  cards.every((i) => !i.icon || iconNames.includes(i.icon)),
  cards.map((i) => i.icon || '(badge)').join(', '));
check('domain words map to a sensible icon',
  (c.cardGroups?.[1]?.items || []).map((i) => i.icon).join(',') === 'PaymentsIcon,ReceiptLongIcon',
  (c.cardGroups?.[1]?.items || []).map((i) => i.icon).join(','));
check('no empty duplicate section is emitted',
  !(c.cardGroups || []).some((g) => g.paragraphs && g.paragraphs.length === 0),
  kinds.join(', '));

/* ── 7. Updating a page keeps the layout it already has ───────────────────── */
//
// applyDocument used to replace `content` outright, which is right for a new page
// and wrong for an update: the Texas page carries whyEssential, an
// "INDUSTRIES WE SERVE" block and four overlines that no document knows about, so
// the copy updated and the design quietly degraded. These run against the REAL
// Texas structure, not a fixture, so a change to that page's shape is exercised
// rather than assumed.

const texas = JSON.parse(fs.readFileSync(`${ROOT}/db/extracted-pages.json`, 'utf8'))
  .find((r) => r.url === '/us/services/best-bookkeeping-services-in-texas/')?.content;

if (!texas) {
  check('found the Texas page to merge against', false);
} else {
  const UPDATE = `
  <h1>Bookkeeping Services in Texas</h1><p>Updated intro copy for Texas.</p>
  <h2>Why It Still Matters</h2><p>Fresh paragraph one.</p><p>Fresh paragraph two.</p>
  <h2>What We Now Offer</h2>
  <ul>
    <li>Payroll Processing — we run payroll end to end</li>
    <li>Tax Preparation — returns filed on schedule</li>
  </ul>
  <h2>Extra New Block</h2><p>This has no slot on the page.</p>`;

  const fresh = layout.toServiceLayout({ html: UPDATE, text: '' }).content;
  const { content: updated, report: rebuilt } = applyDocumentStructure(texas, fresh, {
    template: templateFor('Bookkeeping'),
  });

  // Structure from the service, content from the document, order from the
  // document. These assertions are the inverse of the ones they replace twice
  // over — the rule has been through two revisions and this is where it landed.
  check('the page keeps its service structure',
    ['intro', 'prose', 'whyEssential', 'solutions', 'industries'].every((k) => k in updated),
    Object.keys(updated).join(','));

  check('sections the document covers carry its words',
    JSON.stringify(updated).includes('Fresh paragraph one')
    && JSON.stringify(updated).includes('Payroll Processing'));

  // Every section the document did not cover must hold no words — not the words
  // it held before the upload, and not the words of any other section.
  // Walk the VALUES, and skip presentation while doing it — the same rule the
  // renderer uses to decide a section is empty. Serialising and stripping
  // punctuation leaves the field names behind, and counting `bg: "paper"` as
  // copy reports every styled blank as full.
  const PRESENTATION = new Set(['bg', 'icon', 'columns', 'overline', 'placement', 'image', 'imageAlt']);
  const hasWords = (node) => {
    if (typeof node === 'string') return node.trim() !== '';
    if (Array.isArray(node)) return node.some(hasWords);
    if (node && typeof node === 'object') {
      return Object.entries(node).some(([k, v]) => !PRESENTATION.has(k) && hasWords(v));
    }
    return false;
  };

  // An array key holds several sections, and only the blanked ones must be
  // empty — the appended block below is in `cardGroups` too and legitimately has
  // copy. So for those, count empty entries rather than testing the whole array.
  const blankedPerKey = rebuilt.blankedNames.reduce((m, n) => m.set(n, (m.get(n) || 0) + 1), new Map());
  const stale = [...blankedPerKey].filter(([name, n]) => {
    const node = updated[name];
    if (Array.isArray(node)) return node.filter((entry) => !hasWords(entry)).length < n;
    return hasWords(node);
  }).map(([name]) => name);

  check('sections the document leaves out are blank, not stale',
    rebuilt.blanked > 0 && stale.length === 0,
    `blanked ${rebuilt.blanked}: ${rebuilt.blankedNames.join(' | ')}${stale.length ? ` — still holding copy: ${stale.join(', ')}` : ''}`);

  check('no copy from before the upload survives in a blanked section',
    !JSON.stringify(updated.industries || {}).includes('Healthcare'),
    JSON.stringify(updated.industries || {}).slice(0, 80));

  check('a block the template has no room for is appended, not dropped',
    JSON.stringify(updated).includes('This has no slot on the page'));

  check('presentation is inherited, from the page or from the template',
    rebuilt.dressed + rebuilt.fromTemplate > 0,
    `${rebuilt.dressed} from the page, ${rebuilt.fromTemplate} from the template`);

  check('the recorded order puts the document first',
    Array.isArray(updated.order) && updated.order[0] === 'hero',
    JSON.stringify(updated.order));

  report('the update loses none of the document', UPDATE, updated);

  // A page with no structure has nothing to inherit from, so it is a plain write
  // of the document.
  const blank = applyDocumentStructure({}, fresh, { template: templateFor('Bookkeeping') });
  check('a page with no layout still gets its service shape',
    blank.report.mode === 'service-template' && 'whyEssential' in blank.content,
    Object.keys(blank.content).join(','));

  // A service with no template falls back to the document alone, which is the
  // path a page takes before db/service-templates.json has been generated.
  const untemplated = applyDocumentStructure({}, fresh);
  check('a service with no template uses the document as the structure',
    untemplated.report.mode === 'from-document' && untemplated.report.sections > 0,
    JSON.stringify(untemplated.report));
}

/* ── 8. Reusing a section copies the design, never the words ──────────────── */
//
// "Reuse a section" lifts a design already used on the site. It must hand over
// the SHAPE only: copying Texas's paragraphs into Colorado would put identical
// copy on two indexed URLs, which on a per-state SEO site is the one outcome
// worth engineering against. This asserts the blank is genuinely blank.

const sourceSection = {
  overline: 'WHY MILTA', bg: 'paper', columns: 3,
  titleLead: 'Why Choose Milta for', highlight: 'Bookkeeping',
  subtitle: 'A sentence that must not travel.',
  items: [
    { icon: 'VerifiedIcon', title: 'Accurate Records', desc: 'We reconcile monthly.', bullets: ['One', 'Two'] },
    { icon: 'TimerIcon', title: 'On Time', desc: 'Filed before the deadline.' },
  ],
};

const blanked = blankOf(sourceSection, 'cards');

check('reuse keeps the eyebrow, background and columns',
  blanked.overline === 'WHY MILTA' && blanked.bg === 'paper' && blanked.columns === 3);
check('reuse keeps the icons', blanked.items.map((i) => i.icon).join(',') === 'VerifiedIcon,TimerIcon',
  blanked.items.map((i) => i.icon).join(','));
check('reuse keeps the slot count', blanked.items.length === sourceSection.items.length);

// The important one: no sentence from the source may survive.
const leaked = ['Why Choose Milta', 'Bookkeeping', 'must not travel', 'Accurate Records',
  'reconcile monthly', 'On Time', 'before the deadline', 'One', 'Two']
  .filter((phrase) => JSON.stringify(blanked).includes(phrase));
check('reuse copies NO text from the source page', leaked.length === 0, leaked.join(' | '));

check('reuse blanks nested bullets too',
  (blanked.items[0].bullets || []).every((b) => b === ''),
  JSON.stringify(blanked.items[0].bullets));

// A table's headers name its columns and ARE the design; its rows are data.
const blankTable = blankOf(
  { headers: ['Capability', 'Controller', 'CFO'], rows: [{ label: 'Oversight', marks: [true, true] }] },
  'table',
);
check('a reused table keeps its column headers',
  blankTable.headers.join(',') === 'Capability,Controller,CFO', blankTable.headers.join(','));
check('a reused table drops its row data',
  blankTable.rows.every((r) => r.label === '' && r.marks.every((m) => m === false)),
  JSON.stringify(blankTable.rows));

/* ── 9. Each service has a frozen template, and uploads land inside it ────── */
//
// Bookkeeping, Tax, Virtual Assistant and the rest each have a structure of their
// own, and that structure is what makes a page look like the rest of its service
// rather than like whatever its last document happened to contain. A thin
// document must not be able to flatten a page down to its own three sections.
//
// These run against the REAL Delaware pages and the generated templates, so a
// regenerated template or an edited page exercises the path rather than a
// fixture standing in for it.

const TEMPLATES = require(`${ROOT}/db/service-templates.json`);
const allRows = JSON.parse(fs.readFileSync(`${ROOT}/db/extracted-pages.json`, 'utf8'));

const renderOrder = ['hero', 'intro', 'prose', 'whyEssential', 'solutions', 'cardGroups',
  'checklists', 'comparisonTable', 'advantages', 'industries', 'closing', 'faqs'];
const shapeOf = (c) => {
  const out = [];
  for (const key of renderOrder) {
    if (!(key in (c || {}))) continue;
    if (key === 'hero' || key === 'faqs') { out.push(key); continue; }
    const nodes = Array.isArray(c[key]) ? c[key] : [c[key]];
    nodes.forEach((n) => out.push(`${key}:${rendererOf(n)}`));
  }
  return out.join(' > ');
};

check('a template exists for every service',
  ['Bookkeeping', 'Tax', 'Virtual Assistant', 'Digital Marketing', 'CPA',
    'Data Entry', 'Financial Controller', 'Payroll'].every((s) => TEMPLATES[s]),
  Object.keys(TEMPLATES).join(', '));

check('each service template is distinct',
  new Set(Object.values(TEMPLATES).map((t) => t.sections.map((s) => `${s.key}:${s.kind}`).join('>'))).size
    === Object.keys(TEMPLATES).length,
  `${Object.keys(TEMPLATES).length} services`);

const delawareBookkeeping = allRows.find((r) => (r.source_file || '').includes('/Delaware/Bookkeeping'));

if (!delawareBookkeeping) {
  check('found the Delaware Bookkeeping page', false);
} else {
  // A deliberately thin document: three sections against the template's eight.
  const THIN = `<h1>Bookkeeping Services in Delaware</h1><p>Fresh intro sentence.</p>
    <h2>Why It Matters</h2><p>New paragraph about accuracy.</p>
    <h2>What We Handle</h2>
    <ul><li>Reconciliation — monthly close</li><li>Payroll journals — filed on time</li></ul>`;

  const incoming = layout.toServiceLayout({ html: THIN, text: '' }).content;
  const rebuilt = applyDocumentStructure(delawareBookkeeping.content, incoming, {
    template: templateFor('Bookkeeping'),
  });
  const result = rebuilt.content;

  check('a thin document still produces a full Bookkeeping page',
    shapeOf(result).split(' > ').length >= shapeOf(delawareBookkeeping.content).split(' > ').length - 1,
    `${shapeOf(incoming).split(' > ').length} document blocks -> ${shapeOf(result).split(' > ').length} sections`);

  check('the document copy landed',
    JSON.stringify(result).includes('Fresh intro sentence')
    && JSON.stringify(result).includes('Reconciliation'));

  check('the sections it did not cover are blank',
    rebuilt.report.blanked > 0,
    `blanked ${rebuilt.report.blanked}: ${rebuilt.report.blankedNames.join(' | ')}`);

  check('a blanked section holds no words at all',
    (result.industries?.items || []).every((i) => !String(i || '').trim()),
    JSON.stringify(result.industries?.items || []).slice(0, 80));

  check('curated icons survive on the sections the document filled',
    (result.solutions?.items || []).some((i) => i.icon),
    (result.solutions?.items || []).map((i) => i.icon).filter(Boolean).join(','));

  report('the rebuilt page loses none of the document', THIN, result);

  // A page with NO structure gets the full template rather than the document's
  // three sections — this is the case a brand-new service page starts from.
  const fromEmpty = applyTemplate({}, 'Bookkeeping');
  check('a blank page is given the whole service template',
    fromEmpty.report.added === fromEmpty.report.sections && fromEmpty.report.matched === 0,
    JSON.stringify(fromEmpty.report));
  check('a blank template carries its service icons',
    (fromEmpty.content.solutions?.items || []).some((i) => i.icon),
    (fromEmpty.content.solutions?.items || []).map((i) => i.icon).filter(Boolean).join(','));
}

// A two-word heading reads worse split than left whole.
const short = layout.toServiceLayout({ html: '<h1>Why Us</h1><p>Because.</p>', text: '' }).content;
check('a short heading is left whole', short.hero.highlight === '', `"${short.hero.highlight}"`);

console.log(`\n${failures ? `${failures} CHECK(S) FAILED` : 'all checks passed'}`);
process.exit(failures ? 1 : 0);

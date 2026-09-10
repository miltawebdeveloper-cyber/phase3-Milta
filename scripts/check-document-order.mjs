// Prove that a document uploaded through the CMS comes out on the page in the
// order it was written.
//
// This is the requirement the layout exists for, and it spans two modules that
// live on opposite sides of the app — the server's layoutService (document ->
// content) and the browser's planSections (content -> render order). Testing
// either alone proves nothing about the journey, so this runs the real pair,
// end to end, with no mocks.
//
//   node scripts/check-document-order.mjs
//
// It asserts against the DOCUMENT, not against the parser's output: the expected
// order below is read off the fixture's own headings, so the check cannot drift
// into agreeing with whatever the code happens to do.
import { createRequire } from 'node:module';
import planSections from '../src/states/_templates/sections/planSections.js';

const require = createRequire(import.meta.url);
const layoutService = require('../server/services/layoutService');

// A document whose sections are deliberately NOT in the template's canonical
// order: the industries list comes before the reasons, and the comparison table
// sits in the middle rather than near the end. Under the old fixed-slot template
// every one of those would be pulled back into template order.
const DOCUMENT = `
<h1>Bookkeeping Services for Small Businesses in Delaware</h1>
<p>Milta keeps Delaware businesses' books accurate, current and audit-ready.</p>

<h2>Industries We Serve</h2>
<ul><li>Healthcare</li><li>Hospitality</li><li>Ecommerce</li><li>Construction</li></ul>

<h2>What You Get Every Month</h2>
<table>
  <tr><th>Capability</th><th>Starter</th><th>Full</th></tr>
  <tr><td>Bank reconciliation</td><td>yes</td><td>yes</td></tr>
  <tr><td>Payroll filing</td><td></td><td>yes</td></tr>
</table>

<h2>Why Delaware Businesses Choose Milta</h2>
<ul>
  <li>Fixed monthly fee — no hourly billing and no surprise invoices.</li>
  <li>Named bookkeeper — the same person every month, who knows your accounts.</li>
  <li>Five-day close — your figures land before the month is a week old.</li>
</ul>

<h2>How We Start</h2>
<p>We review twelve months of history, agree a chart of accounts, and take over the ledger from the following month.</p>

<h2>Frequently Asked Questions</h2>
<h3>Do you file Delaware franchise tax?</h3>
<p>Yes — the annual report and franchise tax are included in the full plan.</p>
<h3>Can you clean up an existing ledger?</h3>
<p>Yes. Catch-up work is quoted separately from the monthly fee.</p>
`;

// The order the AUTHOR wrote, taken from the fixture's own <h2>s.
//
// Three things are not sections and so are not listed: the <h1> is the banner, the
// paragraph under it becomes the banner's subtitle (checked separately below, so
// it is accounted for rather than quietly excused), and the FAQ heading titles
// the questions rather than standing as a section of its own.
const EXPECTED = [
  'banner',
  'Industries We Serve',
  'What You Get Every Month',
  'Why Delaware Businesses Choose Milta',
  'How We Start',
  'faqs',
];

const LEAD_PARAGRAPH = "Milta keeps Delaware businesses' books accurate, current and audit-ready.";

const headingOf = (section) => {
  if (section.type === 'banner') return 'banner';
  if (section.type === 'faqs') return 'faqs';
  const d = section.data || {};
  return [d.titleLead, d.highlight].filter(Boolean).join(' ').trim();
};

const { content, stats } = layoutService.toServiceLayout({ html: DOCUMENT });
const plan = planSections(content);
const actual = plan.map(headingOf);

const checks = [];
const check = (name, ok, detail = '') => checks.push([name, ok, detail]);

check('every document section reached the page', actual.length === EXPECTED.length,
  `${actual.length} rendered, ${EXPECTED.length} expected`);

check('the lead paragraph became the banner subtitle, not a dropped block',
  (content.hero?.subtitle || '').trim() === LEAD_PARAGRAPH,
  `${(content.hero?.subtitle || '').slice(0, 80)}`);

check('sections render in the order the document wrote them',
  JSON.stringify(actual) === JSON.stringify(EXPECTED),
  `\n      got:      ${JSON.stringify(actual, null, 0)}\n      expected: ${JSON.stringify(EXPECTED, null, 0)}`);

// The reason the order can differ from the template's own: two of these sections
// are ones the canonical order would have moved.
const industriesAt = actual.indexOf('Industries We Serve');
const reasonsAt = actual.indexOf('Why Delaware Businesses Choose Milta');
check('a list written before the reasons stays before them',
  industriesAt !== -1 && reasonsAt !== -1 && industriesAt < reasonsAt,
  `industries at ${industriesAt}, reasons at ${reasonsAt}`);

const tableAt = actual.indexOf('What You Get Every Month');
check('a table written mid-document stays mid-document',
  tableAt > 1 && tableAt < actual.length - 2, `table at ${tableAt} of ${actual.length}`);

// The renderer each section lands on, so a reordered page is still drawn with
// the right design rather than everything falling back to prose.
const byHeading = Object.fromEntries(plan.map((s) => [headingOf(s), s.type]));
check('the bullet list renders as a checklist', byHeading['Industries We Serve'] === 'checklist',
  byHeading['Industries We Serve']);
check('the tick table renders as a table', byHeading['What You Get Every Month'] === 'table',
  byHeading['What You Get Every Month']);
check('the lead-in bullets render as cards',
  byHeading['Why Delaware Businesses Choose Milta'] === 'cards',
  byHeading['Why Delaware Businesses Choose Milta']);
check('the closing paragraph renders as prose', byHeading['How We Start'] === 'prose',
  byHeading['How We Start']);

check('the questions were recognised as FAQs', (content.faqs || []).length === 2,
  `${(content.faqs || []).length} found`);

// Bands must alternate down the page whatever the order — the whole point of
// deciding them by position rather than reading a stored bg.
const bands = plan.filter((s) => s.type !== 'banner').map((s) => s.band);
check('bands alternate, so no two neighbours share a ground',
  bands.every((b, i) => i === 0 || b !== bands[i - 1]), bands.join(' '));

/* ── The order survives the round trip, and a merge keeps it honest ──────── */

check('the document order was recorded on the content', Array.isArray(content.order),
  JSON.stringify(content.order));

// The case the recorded order exists for: a page that also carries sections an
// editor added by hand. Canonical order would sort `whyEssential` and
// `industries` ahead of everything the document wrote, because those keys rank
// earlier — the recorded order is what keeps the author's sequence.
const withHandAdded = {
  ...content,
  whyEssential: { titleLead: 'Added by hand', items: ['One', 'Two'] },
  industries: { titleLead: 'Also added by hand', items: ['Retail'] },
};
const merged = planSections(withHandAdded).map(headingOf);
check('hand-added sections land after the document, not in front of it',
  merged.indexOf('Industries We Serve') < merged.indexOf('Added by hand'),
  merged.join(' | '));

// And with the recorded order stripped — what a row saved before this field
// existed looks like — the same content falls back to canonical order rather
// than failing.
const { order, ...withoutOrder } = withHandAdded;
const fallback = planSections(withoutOrder).map(headingOf);
check('a row with no recorded order still renders every section',
  fallback.length === merged.length, `${fallback.length} vs ${merged.length}`);

// An upload rebuilds the page with its SERVICE's structure, the DOCUMENT's
// content, and the DOCUMENT's order. This is the requirement stated as a round
// trip: parse a document, rebuild a page from it, and the sections the document
// wrote must render in the sequence it wrote them.
const { applyDocumentStructure } = require('../server/services/layoutMerge');
const { templateFor } = require('../server/services/serviceTemplates');

const existingPage = {
  hero: { titleLead: 'An older title', highlight: '' },
  whyEssential: { overline: 'WHY IT MATTERS', titleLead: 'Kept From Before', items: ['old'] },
  industries: { overline: 'WHO WE SERVE', titleLead: 'Industries We Serve', items: ['Retail'] },
  faqs: [{ q: 'old?', a: 'old' }],
};

const rebuilt = applyDocumentStructure(existingPage, content, { template: templateFor('Bookkeeping') });
const rebuiltPlan = planSections(rebuilt.content).map(headingOf);

check('the rebuilt page renders the document sections in document order',
  JSON.stringify(rebuiltPlan) === JSON.stringify(EXPECTED),
  `
      got:      ${JSON.stringify(rebuiltPlan)}
      expected: ${JSON.stringify(EXPECTED)}`);

check('the page keeps its service structure even where the document is silent',
  ['intro', 'prose', 'whyEssential', 'solutions', 'industries'].every((k) => k in rebuilt.content),
  Object.keys(rebuilt.content).join(','));

check('a section the document does not cover is blanked, not left stale',
  !JSON.stringify(rebuilt.content.whyEssential || {}).includes('Kept From Before'),
  JSON.stringify(rebuilt.content.whyEssential));

check('a blank section draws nothing, so the page shows no empty headings',
  !rebuiltPlan.includes(''), rebuiltPlan.join(' | '));

check('the eyebrow of a section the document filled is inherited',
  rebuilt.report.dressed + rebuilt.report.fromTemplate > 0,
  `${rebuilt.report.dressed} from the page, ${rebuilt.report.fromTemplate} from the template`);

check('the rebuilt page records the document order',
  Array.isArray(rebuilt.content.order) && rebuilt.content.order[0] === 'hero',
  JSON.stringify(rebuilt.content.order));

/* ── The manifest is the one definition; nothing may drift from it ────────── */

// The browser reads the manifest directly. The server cannot — it is CommonJS
// and the manifest is ESM — so its two copies of the order are kept in step by
// this check instead of by an import. If it fails, the fix is to edit the
// server list to match the manifest, never the other way round.
const { SECTION_KEYS } = await import('../src/states/_templates/sections/manifest.js');
const verificationService = require('../server/services/verificationService');

check('layoutMerge orders sections the way the manifest does',
  JSON.stringify(require('../server/services/layoutMerge').SECTION_ORDER) === JSON.stringify(SECTION_KEYS),
  `\n      server:   ${JSON.stringify(require('../server/services/layoutMerge').SECTION_ORDER)}\n      manifest: ${JSON.stringify(SECTION_KEYS)}`);

check('verificationService orders sections the way the manifest does',
  JSON.stringify(verificationService.SECTION_ORDER) === JSON.stringify(SECTION_KEYS),
  `\n      server:   ${JSON.stringify(verificationService.SECTION_ORDER)}\n      manifest: ${JSON.stringify(SECTION_KEYS)}`);

let failed = 0;
for (const [name, ok, detail] of checks) {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${ok || !detail ? '' : `: ${detail}`}`);
  if (!ok) failed += 1;
}

console.log(`\nparsed: ${stats.headings} headings, ${stats.bullets} bullets, ${stats.tables} table(s), ${stats.faqs} faqs`);
console.log(`${checks.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

// Freeze one section template per service, derived from the pages that exist.
//
//   node scripts/gen-service-templates.mjs        write db/service-templates.json
//   node scripts/gen-service-templates.mjs --dry  print what it would write
//
// Each service has a shape of its own — Bookkeeping is hero · intro · prose ·
// whyEssential · solutions · cards · industries · faqs, while Tax runs to
// nineteen sections. Those shapes are consistent enough to freeze: for every
// service the single most common structure covers roughly half its 27 pages, and
// Delaware happens to match the dominant shape for all eight, which is why it
// reads as the canonical state.
//
// The template is FROZEN on purpose. Deriving it live would mean the structure
// of a page quietly changing as other pages are edited; generating it into a
// committed file means it only moves when someone re-runs this and reviews the
// diff — the same arrangement as _iconRegistry.js.
//
// What is captured is the DESIGN, never the words: the section order, what each
// section renders as, its eyebrow, its background, and the icons and slot counts
// it usually carries.
import fs from 'node:fs';

const ROOT = 'd:/milta-web-v3/milta-web';
const OUT = `${ROOT}/db/service-templates.json`;
const DRY = process.argv.includes('--dry');

const rows = JSON.parse(fs.readFileSync(`${ROOT}/db/extracted-pages.json`, 'utf8'))
  .filter((r) => r.kind === 'service_state' && r.service && r.content && typeof r.content === 'object');

const rendererOf = (g) => {
  if (!g || typeof g !== 'object') return null;
  if (g.rows) return 'table';
  if (g.paragraphs) return 'prose';
  if (Array.isArray(g.items)) return typeof g.items[0] === 'string' ? 'checklist' : 'cards';
  return null;
};

// A page's structure as an ordered list of slots. `hero` and `faqs` are fixed
// points every page has, so they bracket the body rather than varying with it.
const slotsOf = (content) => {
  const out = [];
  for (const [key, value] of Object.entries(content)) {
    if (key === 'hero' || key === 'faqs' || key === 'faqsHeading' || key === 'order') continue;
    const nodes = Array.isArray(value) ? value : [value];
    nodes.forEach((node) => {
      const kind = rendererOf(node);
      if (kind) out.push({ key, kind, node });
    });
  }
  return out;
};

const signature = (content) => slotsOf(content).map((s) => `${s.key}:${s.kind}`).join(' > ');

const mode = (values) => {
  const f = new Map();
  for (const v of values) f.set(v, (f.get(v) || 0) + 1);
  return [...f.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
};

const median = (nums) => {
  const s = nums.slice().sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

const sizeOf = (node, kind) => {
  if (kind === 'prose') return (node.paragraphs || []).length;
  if (kind === 'table') return (node.rows || []).length;
  return (node.items || []).length;
};

const byService = new Map();
for (const r of rows) {
  if (!byService.has(r.service)) byService.set(r.service, []);
  byService.get(r.service).push(r);
}

const templates = {};
const summary = [];

for (const [service, pages] of [...byService.entries()].sort()) {
  // The dominant structure for this service.
  const sigs = pages.map((p) => signature(p.content));
  const canonical = mode(sigs);
  const matching = pages.filter((p, i) => sigs[i] === canonical);

  // Every matching page has the same slots in the same order, so they can be
  // compared position by position.
  const perPage = matching.map((p) => slotsOf(p.content));
  const width = perPage[0].length;

  const sections = [];
  for (let i = 0; i < width; i++) {
    const nodes = perPage.map((slots) => slots[i]).filter(Boolean);
    if (!nodes.length) continue;
    const { key, kind } = nodes[0];

    const slots = Math.max(1, median(nodes.map((n) => sizeOf(n.node, kind))));
    // Icons are chosen by a person and repeat across states, so the modal icon
    // per position is the designed one rather than an accident.
    const icons = kind === 'cards'
      ? Array.from({ length: slots }, (_, j) =>
        mode(nodes.map((n) => n.node.items?.[j]?.icon).filter(Boolean)) || '')
      : [];

    // Presentation the service's pages agree on but that is neither an eyebrow
    // nor a background.
    //
    // `columns` is how wide the card grid runs — 2 across 14 of the 28
    // Bookkeeping pages, and the reference page is one of them. `ctaLabel` is
    // the intro's button, identical on 25 of 28. `placement` is whether a
    // closing block sits before or after the FAQs. All three are furniture the
    // template was silently dropping, so a page built from a document came out
    // three-up with no button where every other page of its service is two-up
    // with one.
    //
    // Majority only, and only when a clear majority exists: a field that varies
    // page to page is the author's, not the template's.
    const dominant = (get) => {
      const values = nodes.map((n) => get(n.node)).filter((v) => v !== undefined && v !== null && v !== '');
      if (values.length <= nodes.length / 2) return undefined;
      const winner = mode(values.map((v) => JSON.stringify(v)));
      return winner === undefined ? undefined : JSON.parse(winner);
    };

    const section = {
      key,
      kind,
      overline: mode(nodes.map((n) => n.node.overline || '')) || '',
      bg: mode(nodes.map((n) => n.node.bg || '')) || '',
      slots,
      icons,
      // Kept for a human reading the file; never written to a page.
      exampleHeading: nodes[0].node.titleLead || '',
    };

    const columns = dominant((n) => n.columns);
    if (columns) section.columns = columns;
    const ctaLabel = dominant((n) => n.ctaLabel);
    if (ctaLabel) section.ctaLabel = ctaLabel;
    const placement = dominant((n) => n.placement);
    if (placement) section.placement = placement;

    sections.push(section);
  }

  // The label the service's pages use for the current-page breadcrumb, with the
  // state removed: "Bookkeeping Services in", "Tax Services in". Every page then
  // reads "<label> <State>", which is what the authored pages say — 26 of 26
  // Bookkeeping pages agree, and the least consistent service still has a clear
  // majority.
  //
  // Worth freezing because a document cannot supply it: the parser was falling
  // back to the page title cut at 60 characters, which is how a breadcrumb came
  // to read "Optimize Your Tax Filing with Trusted Tax Preparation Servic".
  const breadcrumb = mode(matching.map((p) => {
    const b = String(p.content.hero?.breadcrumb || '').trim();
    const state = String(p.state || '');
    if (!b || !state || !b.toLowerCase().endsWith(state.toLowerCase())) return null;
    return b.slice(0, b.length - state.length).trim();
  }).filter(Boolean)) || null;

  templates[service] = {
    service,
    breadcrumb,
    sections,
    faqs: Math.max(1, median(matching.map((p) => (p.content.faqs || []).length))),
    derivedFrom: { pages: pages.length, matching: matching.length, example: matching[0]?.url || null },
  };

  summary.push(
    `${service.padEnd(22)}${String(sections.length + 2).padStart(2)} sections  `
    + `from ${matching.length}/${pages.length} pages  e.g. ${matching[0]?.state}`,
  );
}

console.log('Frozen service templates\n');
summary.forEach((s) => console.log('  ' + s));

console.log('\nBookkeeping, section by section:');
templates.Bookkeeping?.sections.forEach((s, i) => {
  console.log(`  ${String(i + 1).padStart(2)}. ${s.key.padEnd(14)}${s.kind.padEnd(10)}`
    + `${String(s.slots).padStart(2)} slots  ${s.overline ? `“${s.overline}” ` : ''}`
    + `${s.icons.filter(Boolean).length ? `${s.icons.filter(Boolean).length} icons` : ''}`);
});

if (DRY) {
  console.log('\n--dry: nothing written.');
} else {
  fs.writeFileSync(OUT, `${JSON.stringify(templates, null, 2)}\n`);
  console.log(`\nwrote ${OUT}`);

  // Then split it, because db/templates/<service>.json is what the server
  // actually reads. Regenerating without splitting would leave the eight files
  // stale and the change would appear to have done nothing.
  const { execFileSync } = await import('node:child_process');
  execFileSync(process.execPath, [`${ROOT}/scripts/split-service-templates.mjs`], { stdio: 'inherit' });
}

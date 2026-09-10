// Rebuild a page when a document is uploaded to it.
//
// Three things decide the result, and keeping them apart is the whole design:
//
//   STRUCTURE comes from the SERVICE. A Bookkeeping document rebuilds a
//             Bookkeeping page, so the page ends up with the sections every
//             other Bookkeeping page has, in the shape they have them. That is
//             db/service-templates.json, frozen and committed so one page cannot
//             silently restructure another.
//
//   CONTENT   comes from the DOCUMENT, and only from the document. Nothing is
//             carried over, invented, or padded out with the copy that was
//             there before.
//
//   ORDER     comes from the DOCUMENT. Sections the document wrote render in the
//             sequence it wrote them; sections it left untouched are stored
//             blank, in template position, and draw nothing until someone fills
//             them in.
//
// So a short document does not shrink the page's structure and does not leave
// stale copy behind: the sections it does not cover are emptied, not deleted and
// not kept. They stay visible and editable in the CMS.
//
// STYLING is inherited rather than taken from the document, in this order:
//
//   1. the page's own matching section, because that is this page's considered
//      styling — its eyebrow, band, column count and curated card icons;
//   2. the service template, for a block the page has no counterpart for, so it
//      still looks like the rest of its service rather than like nothing.
//
// The fields that travel that way are `overline`, `bg`, `columns`, `placement`,
// `image`/`imageAlt`, and each card's `icon`. None of them is copy.
//
// Blanking is still a change an editor should see before it happens, and two
// guards stand in front of it — neither may be removed. A revision is written
// before the row changes (pageService), and the save-preview dialog shows the
// whole diff before anything is written at all.

// The order sections are declared in. Kept in step with the browser's section
// manifest (src/states/_templates/sections/manifest.js) by
// scripts/check-document-order.mjs, because this module is CommonJS and the
// manifest is ESM.
const SECTION_ORDER = [
  "hero", "intro", "prose", "whyEssential", "solutions", "cardGroups",
  "checklists", "comparisonTable", "advantages", "industries", "closing",
  "faqsHeading", "faqs",
];

const rank = (k) => {
  const i = SECTION_ORDER.indexOf(k);
  return i === -1 ? SECTION_ORDER.length : i;
};

// What a node renders as. Mirrors the template's dispatch so a document block is
// only ever matched against a section its renderer can actually draw.
const kindOf = (node) => {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) return typeof node[0] === "object" && node[0]?.q ? "faqs" : "list";
  if (node.rows) return "table";
  if (node.paragraphs) return "prose";
  if (Array.isArray(node.items)) return typeof node.items[0] === "string" ? "list" : "cards";
  return null;
};

// Every section the page currently has, flattened, so a document block can be
// matched against it. Order is the render order.
function slotsOf(content) {
  const slots = [];
  for (const [key, value] of Object.entries(content || {}).sort((a, b) => rank(a[0]) - rank(b[0]))) {
    if (key === "hero" || key === "faqs" || key === "faqsHeading" || key === "order") continue;
    if ((key === "cardGroups" || key === "checklists") && Array.isArray(value)) {
      value.forEach((g, i) => {
        const kind = key === "checklists" ? "list" : kindOf(g);
        if (kind) slots.push({ key, index: i, kind, node: g });
      });
      continue;
    }
    const kind = kindOf(value);
    if (kind) slots.push({ key, index: null, kind, node: value });
  }
  return slots;
}

// The document's blocks, in the order it wrote them. layoutService emits `intro`
// for the first prose block and `cardGroups` for the rest, both already in
// document order, so this flattening preserves the author's sequence exactly.
function blocksOf(incoming) {
  const out = [];
  const push = (key, node) => {
    const kind = kindOf(node);
    if (kind) out.push({ key, kind, node });
  };

  // Content that has ALREADY been shaped names its own order, and shaping it
  // again must be a no-op.
  //
  // It is not a hypothetical: the new-page dialog previews the document with the
  // service (which shapes it), and createPage shapes what comes back. Reading
  // only `intro` and `cardGroups` made every already-placed section — prose,
  // whyEssential, solutions, industries — invisible here, so they were treated
  // as absent and written back as the template's blanks. The page was created
  // having silently lost four sections of copy.
  if (Array.isArray(incoming?.order) && incoming.order.length) {
    for (const id of incoming.order) {
      const [key, index] = String(id).split(".");
      if (key === "hero" || key === "faqs" || key === "faqsHeading") continue;
      const value = incoming[key];
      const node = index === undefined ? value : value?.[Number(index)];
      if (node) push(key, node);
    }
    if (out.length) return out;
  }

  // Raw parser output: the opening prose block and then the body, both already
  // in the order the document wrote them.
  if (incoming?.intro) out.push({ key: "intro", kind: kindOf(incoming.intro) || "prose", node: incoming.intro });
  for (const g of incoming?.cardGroups || []) push("cardGroups", g);
  return out;
}

/* ── Matching a document block to the section it replaces ─────────────────── */

const normalise = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const headingOf = (node) => normalise([node?.titleLead, node?.highlight].filter(Boolean).join(" "));

// Heading first, then renderer. A document that keeps its headings between
// revisions — which is the normal case — carries each section's presentation
// across even when blocks have been added above it and everything has shifted
// down. Position alone would hand the wrong eyebrow to the wrong section.
function matchFor(block, slots, used) {
  const wanted = headingOf(block.node);

  if (wanted) {
    const byHeading = slots.findIndex(
      (s, i) => !used.has(i) && s.kind === block.kind && headingOf(s.node) === wanted,
    );
    if (byHeading !== -1) return byHeading;
  }

  return slots.findIndex((s, i) => !used.has(i) && s.kind === block.kind);
}

// The service's own template, as a second source of presentation.
//
// A document block that matches a section the page already has inherits from
// that section. A block with no counterpart — a new section, or the first upload
// against a thin page — would otherwise have no styling at all, and the page
// would stop looking like the rest of its service. So the service template is
// asked next: it carries the eyebrow, band colour and card icons that every
// other Bookkeeping (or Tax, or Payroll) page uses in that position.
//
// Template `kind` names the renderer the way serviceTemplates does; kindOf names
// it the way this module does. The one that differs is the checklist.
const TEMPLATE_KIND = { prose: "prose", checklist: "list", cards: "cards", table: "table" };

function templateSlotsOf(template) {
  if (!template?.sections?.length) return [];
  // Required lazily: serviceTemplates requires nothing from this module, but
  // keeping the import here makes the dependency obvious at the point of use.
  // eslint-disable-next-line global-require
  const { blankSection } = require("./serviceTemplates");
  return template.sections
    .map((section) => {
      const kind = TEMPLATE_KIND[section.kind];
      if (!kind) return null;
      return {
        key: section.key,
        index: null,
        kind,
        // What the service's existing pages call this section. It is how a
        // document block finds the RIGHT slot rather than merely a free one of
        // the right shape.
        example: normalise(section.exampleHeading),
        node: blankSection(section),
      };
    })
    .filter(Boolean);
}

const STOP = new Set(["the", "a", "an", "and", "of", "to", "in", "for", "on", "with", "our", "your", "we", "us", "is", "are"]);

const words = (s) => normalise(s).split(" ").filter((w) => w && !STOP.has(w));

// Does this document block belong in this template slot?
//
// Not string equality: a Bookkeeping document writes "Industries We Serve in
// Delaware" where the template's example says "Industries We Serve for
// Bookkeeping Services". Both name the same section, and no exact comparison
// will ever say so. Two thirds of the shorter heading's meaningful words in
// common is enough to be confident, and a wrong guess only costs an eyebrow —
// the renderer is chosen by shape, which is checked separately.
function sameHeading(target, block) {
  if (!target.example) return false;
  const a = words(target.example);
  const b = words(headingOf(block.node));
  if (!a.length || !b.length) return false;

  const setA = new Set(a);
  const shared = b.filter((w) => setA.has(w)).length;
  return shared / Math.min(a.length, b.length) >= 0.66;
}

const PRESENTATION = ["overline", "bg", "columns", "placement", "image", "imageAlt", "ctaLabel"];

// Copy presentation across, never copy.
function dress(block, slot) {
  const next = { ...block.node };
  if (!slot) return next;

  for (const field of PRESENTATION) {
    if (next[field] === undefined && slot.node[field] !== undefined) next[field] = slot.node[field];
  }

  // Icons are per card and matched by position within the section, which is the
  // best available guess once the copy itself has changed.
  if (Array.isArray(next.items) && Array.isArray(slot.node.items)) {
    next.items = next.items.map((item, i) => {
      if (typeof item === "string" || !item) return item;
      const kept = slot.node.items[i];
      const icon = item.icon || (kept && typeof kept === "object" ? kept.icon : "") || "";
      return icon ? { ...item, icon } : item;
    });
  }

  return next;
}

/**
 * Rebuild `content` from an uploaded document.
 *
 * @param {object} existing the page's current `content`, for presentation only
 * @param {object} incoming what the document converted to
 * @returns {{ content: object, report: object }}
 */
function applyDocumentStructure(existing, incoming, { template = null, state = "" } = {}) {
  if (!incoming || typeof incoming !== "object") {
    return {
      content: existing,
      report: { mode: "unchanged", sections: 0, dressed: 0, fromTemplate: 0, blanked: 0, blankedNames: [] },
    };
  }

  const pageSlots = slotsOf(existing);
  const targets = templateSlotsOf(template);

  // A line that only repeats a button label is not a section.
  //
  // The Arkansas bookkeeping document writes "To Arrange Your Free Initial
  // Consultation, Contact Us Right Now!" as its own bold line, and the service
  // template already carries that exact sentence as the intro's ctaLabel. Read
  // as a section it became a heading with nothing underneath it, and the page
  // showed the sentence twice — once as a stray heading, once on the button.
  //
  // Only a block with NO content of its own is dropped, so a real section that
  // happens to be titled like a call to action keeps its copy.
  const ctaLabels = new Set(
    (template?.sections || []).map((s) => normalise(s.ctaLabel)).filter(Boolean),
  );
  const isContentless = (n) => !n?.rows
    && !(n?.items || []).length
    && !(n?.paragraphs || []).length
    && !String(n?.subtitle || "").trim();

  const blocks = blocksOf(incoming).filter(
    (b) => !(isContentless(b.node) && ctaLabels.has(headingOf(b.node))),
  );

  // The banner takes the document's words and the page's furniture. A CTA label
  // and a breadcrumb are chrome the document has no way to express, so losing
  // them on every upload would be a bug, not fidelity.
  // Written only when there is something to write.
  //
  // Storing `ctaLabel: ""` is not the same as storing nothing: the button takes
  // its label as a default parameter, and a default only applies to `undefined`.
  // An empty string reached the component as a real value and rendered a green
  // button with an icon and no words on it — which is exactly what the first
  // Arkansas page did.
  const hero = incoming.hero
    ? { ...incoming.hero }
    : existing?.hero;

  if (hero) {
    const ctaLabel = incoming.hero?.ctaLabel || existing?.hero?.ctaLabel || "";
    if (ctaLabel) hero.ctaLabel = ctaLabel; else delete hero.ctaLabel;

    // The breadcrumb names the PAGE, not the banner headline.
    //
    // A document has no way to say "Bookkeeping Services in Arkansas", so the
    // parser fell back to the banner title cut at 60 characters — which is how a
    // breadcrumb came to read "…Trusted Tax Preparation Servic". The service
    // template carries the label its pages use and the state completes it, which
    // is exactly what the authored pages say.
    const composed = template?.breadcrumb && state
      ? `${template.breadcrumb} ${state}`.replace(/\s+/g, " ").trim()
      : "";
    const breadcrumb = composed || existing?.hero?.breadcrumb || incoming.hero?.breadcrumb || "";
    if (breadcrumb) hero.breadcrumb = breadcrumb; else delete hero.breadcrumb;
  }

  // No template for this service — nothing to shape the page into, so the
  // document is the structure on its own. This is also the path a page takes
  // before db/service-templates.json has been generated.
  if (!targets.length) return documentOnly(hero, blocks, pageSlots, incoming, existing);

  /* 1. Assign each document block to a section — heading first, in TWO
   *    passes, then renderer as a last resort.
   *
   *    A single pass that tries heading-then-fallback block by block has a
   *    cascade failure: a block the template never anticipated — an extra
   *    lead-in paragraph, say — matches no heading, falls back to "the first
   *    free slot of this shape", and claims a slot a LATER block actually
   *    named by heading. That later block then finds its own slot taken and
   *    falls back too, bumping a third block, and so on down every slot of
   *    that shape — on the Tax template, which alone has five separate prose
   *    slots (`prose`, three numbered sub-sections, `closing`), one stray
   *    paragraph ahead of "1. Tax Preparation Service in" pushed every prose
   *    slot after it down by one, and the page's actual closing paragraph
   *    ended up appended as an extra while "3. Tax E-Filing" sat in `closing`.
   *
   *    So every block gets its chance to match BY HEADING before any block
   *    is allowed to fall back to "any slot of this shape" — a named slot a
   *    later block will actually claim by name is never eaten by an earlier
   *    block that has no name for it at all.
   */
  const targetFor = new Array(blocks.length).fill(-1);
  const claimed = new Set();

  blocks.forEach((block, bi) => {
    const at = targets.findIndex((t, i) => !claimed.has(i) && t.kind === block.kind && sameHeading(t, block));
    if (at !== -1) { targetFor[bi] = at; claimed.add(at); }
  });
  blocks.forEach((block, bi) => {
    if (targetFor[bi] !== -1) return;
    const at = targets.findIndex((t, i) => !claimed.has(i) && t.kind === block.kind);
    if (at !== -1) { targetFor[bi] = at; claimed.add(at); }
  });

  const filled = new Map();      // target index -> node
  const extras = [];             // blocks the template has no room for
  const assigned = [];           // { target } | { extra } in DOCUMENT order
  const usedPage = new Set();
  let dressed = 0;
  let fromTemplate = 0;

  blocks.forEach((block, bi) => {
    const at = targetFor[bi];

    // Presentation: this page's own matching section first, because it is this
    // page's considered styling; the service template second, so a block with no
    // counterpart still looks like the rest of its service.
    const pageAt = matchFor(block, pageSlots, usedPage);
    let donor = null;
    if (pageAt !== -1) {
      usedPage.add(pageAt);
      dressed += 1;
      donor = pageSlots[pageAt];
    }

    let node = dress(block, donor);
    if (at !== -1) {
      // Fills only what is still undefined, so the page's own styling wins and
      // the template supplies the rest.
      node = dress({ node }, targets[at]);
      if (!donor) fromTemplate += 1;
      filled.set(at, node);
      assigned.push({ target: at });
    } else {
      extras.push(node);
      assigned.push({ extra: extras.length - 1 });
    }
  });

  /* 2. Assemble the page in DOCUMENT order.
   *
   *    The page's SHAPE is the service's — which sections exist, and how each is
   *    drawn. Their SEQUENCE is the document's.
   *
   *    Both were true before, but only the render order carried the sequence:
   *    the stored `cardGroups` array was built in template order, so the CMS
   *    editor — which lists what is stored — showed a Colorado tax page as
   *    "1. Tax Preparation", "3. Tax E-Filing", "2. Tax Review". The page
   *    rendered correctly and the editor looked broken, which is the worse of
   *    the two failures because it is the one a person sees.
   *
   *    Filling the arrays in the order the document filled them makes the stored
   *    order and the rendered order the same order.
   *
   *    Sections the document did not cover follow, as the template's blanks —
   *    present and editable in the CMS, drawn by nothing until someone fills
   *    them (planSections.isEmptySection).
   */
  const out = {};
  if (hero) out.hero = hero;

  const idOf = new Map();        // target index -> the id planSections will use
  const blankedNames = [];

  const place = (i, node) => {
    const target = targets[i];
    if (target.key === "cardGroups" || target.key === "checklists") {
      if (!Array.isArray(out[target.key])) out[target.key] = [];
      out[target.key].push(node);
      idOf.set(i, `${target.key}.${out[target.key].length - 1}`);
      return;
    }
    // A single-value key the template lists twice would otherwise overwrite
    // itself; the second one becomes a card group instead, which is where an
    // extra block of that shape belongs.
    if (out[target.key] !== undefined) {
      out.cardGroups = out.cardGroups || [];
      out.cardGroups.push(node);
      idOf.set(i, `cardGroups.${out.cardGroups.length - 1}`);
      return;
    }
    out[target.key] = node;
    idOf.set(i, target.key);
  };

  // The document's own sections, in the order it wrote them.
  for (const a of assigned) {
    if (a.target === undefined) continue;
    place(a.target, filled.get(a.target));
  }

  // Then the ones it left blank.
  targets.forEach((target, i) => {
    if (filled.has(i)) return;
    blankedNames.push(headingOf(target.node) || target.key);
    place(i, target.node);
  });

  // Blocks the template had no room for are appended rather than dropped.
  const extraIds = extras.map((node) => {
    out.cardGroups = out.cardGroups || [];
    out.cardGroups.push(node);
    return `cardGroups.${out.cardGroups.length - 1}`;
  });

  // FAQs are the one section a document that does not mention them does not
  // blank. They are maintained on their own — most service documents are about
  // the service and say nothing about the questions — and emptying twenty
  // question-and-answer pairs because a document was silent would be a surprise,
  // not fidelity. A document that DOES carry FAQs replaces them outright.
  if (incoming.faqs?.length) out.faqs = incoming.faqs;
  else if (existing?.faqs?.length) out.faqs = existing.faqs;
  if (incoming.faqsHeading) out.faqsHeading = incoming.faqsHeading;
  else if (out.faqs && existing?.faqsHeading) out.faqsHeading = existing.faqsHeading;

  /* 3. The order the page renders in.
   *
   *    Everything the document actually wrote comes first, in the document's own
   *    sequence — that is the requirement. The sections it left blank follow in
   *    template order; none of them draws anything until someone fills it, so
   *    their position only matters once they have content.
   */
  const order = [
    ...(hero ? ["hero"] : []),
    ...assigned.map((a) => (a.target !== undefined ? idOf.get(a.target) : extraIds[a.extra])),
    ...targets.map((_, i) => (filled.has(i) ? null : idOf.get(i))).filter(Boolean),
    ...(out.faqs ? ["faqs"] : []),
  ].filter(Boolean);


  out.order = order;

  return {
    content: out,
    report: {
      mode: "service-template",
      service: template.service || null,
      sections: blocks.length,
      dressed,
      fromTemplate,
      blanked: blankedNames.length,
      blankedNames,
      appended: extras.length,
    },
  };
}

// A service with no template: the document is the whole structure. Kept as its
// own path rather than folded in, because "shape the page like its service" and
// "the page is exactly the document" are genuinely different rules and reading
// one function that does both is harder than reading two that each do one.
function documentOnly(hero, blocks, pageSlots, incoming, existing) {
  const used = new Set();
  const out = {};
  let dressed = 0;

  if (hero) out.hero = hero;

  const cardGroups = [];
  for (const block of blocks) {
    const at = matchFor(block, pageSlots, used);
    if (at !== -1) {
      used.add(at);
      dressed += 1;
    }
    const node = dress(block, at === -1 ? null : pageSlots[at]);
    if (block.key === "intro" && !out.intro) out.intro = node;
    else cardGroups.push(node);
  }
  if (cardGroups.length) out.cardGroups = cardGroups;

  if (incoming.faqs?.length) out.faqs = incoming.faqs;
  if (incoming.faqsHeading) out.faqsHeading = incoming.faqsHeading;
  else if (out.faqs && existing?.faqsHeading) out.faqsHeading = existing.faqsHeading;

  out.order = [
    ...(out.hero ? ["hero"] : []),
    ...(out.intro ? ["intro"] : []),
    ...cardGroups.map((_, i) => `cardGroups.${i}`),
    ...(out.faqs ? ["faqs"] : []),
  ];

  const blankedNames = pageSlots
    .filter((_, i) => !used.has(i))
    .map((s) => headingOf(s.node) || s.key)
    .filter(Boolean);

  return {
    content: out,
    report: {
      mode: "from-document",
      service: null,
      sections: blocks.length,
      dressed,
      fromTemplate: 0,
      blanked: blankedNames.length,
      blankedNames,
      appended: 0,
    },
  };
}

module.exports = {
  applyDocumentStructure,
  slotsOf,
  blocksOf,
  kindOf,
  // SECTION_ORDER is exported so scripts/check-document-order.mjs can assert it
  // still matches the section manifest the browser reads. This module is
  // CommonJS and the manifest is ESM, so they are kept in step by a check rather
  // than by an import.
  SECTION_ORDER,
};

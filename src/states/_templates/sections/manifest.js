// The one definition of what a page section IS.
//
// Before this file the same knowledge was written out six times — the admin
// editor's order, its blank templates and its help text; the save-preview
// dialog's order; the render planner's order; the label map; and two more copies
// on the server. Adding a section meant finding all of them, and they had
// already drifted: the editor knew `solutions` items can carry `bullets`, the
// renderer did not, and the copy in those bullets was dropped on the page.
//
// So each section is declared once, here, and everything that needs to know
// reads it:
//
//   ContentEditor      order, labels, help text, and the blank "Add section"
//                      inserts
//   SavePreviewDialog  order, labels
//   planSections       order, and the default renderer for a key
//   registry           maps `type` to the component that draws it
//
// This file is DATA ONLY — no imports, no React. Two things depend on that: the
// render planner has to stay loadable by a plain node script (see
// scripts/check-document-order.mjs), and the server would have to be able to
// read it if its own two ordering lists are ever folded in.
//
// KEY vs LABEL vs TYPE, because all three differ for the first entry:
//
//   key    what the database stores, and what every existing row, the extractor
//          and _ServiceLayout already use. Changing one is a migration.
//   label  what an editor reads. Milta's source documents call the opening
//          block "Banner Section:", so `hero` is shown as "Banner".
//   type   which component draws it. Several keys share one — `prose` and
//          `closing` are both drawn by Prose.
//
// Order is the order of this array.

export const SECTIONS = [
  {
    key: "hero",
    type: "banner",
    label: "Banner",
    help: "Page title, subtitle and breadcrumb",
    blank: { titleLead: "", highlight: "", subtitle: "", breadcrumb: "", ctaLabel: "" },
  },
  {
    key: "intro",
    type: "intro",
    label: "Intro",
    help: "Opening copy, optional image and stat figures",
    blank: {
      overline: "", titleLead: "", highlight: "", paragraphs: [""],
      stats: [{ num: "", label: "" }], image: "", imageAlt: "", ctaLabel: "",
    },
  },
  {
    key: "prose",
    type: "prose",
    label: "Prose",
    help: "A block of paragraphs with its own heading",
    blank: { overline: "", titleLead: "", highlight: "", subtitle: "", paragraphs: [""], footnote: "" },
  },
  {
    key: "whyEssential",
    type: "checklist",
    label: "Why Essential",
    help: "Short labelled points, rendered as a checklist",
    blank: { overline: "", titleLead: "", highlight: "", subtitle: "", items: [""] },
  },
  {
    key: "solutions",
    type: "featureCards",
    label: "Solutions",
    help: "Cards with an icon, title, description and bullets",
    blank: {
      overline: "", titleLead: "", highlight: "", subtitle: "",
      items: [{ icon: "", title: "", desc: "", bullets: [""] }],
    },
  },
  {
    // The one key whose renderer is not fixed: cardGroups is an ordered list
    // holding four different kinds of block, and the SHAPE of each entry picks
    // the component. `type` here is only the fallback for an entry whose shape
    // says nothing.
    key: "cardGroups",
    type: "cards",
    label: "Card Groups",
    help: "Ordered body sections — add prose, lists, cards or a table below",
    list: true,
    blank: [],
  },
  {
    key: "checklists",
    type: "checklist",
    label: "Checklists",
    help: "One or more checklist blocks",
    list: true,
    blank: [{ titleLead: "", highlight: "", items: [""] }],
  },
  {
    key: "comparisonTable",
    type: "table",
    label: "Comparison Table",
    help: "Tick table: headers plus a row per capability",
    blank: {
      overline: "", titleLead: "", highlight: "", subtitle: "",
      headers: ["", "", ""], rows: [{ label: "", marks: [false, false] }],
    },
  },
  {
    key: "advantages",
    type: "advantages",
    label: "Advantages",
    help: "Cards with an icon, plus optional stat panel",
    blank: {
      overline: "", titleLead: "", highlight: "", subtitle: "",
      items: [{ icon: "", title: "", desc: "" }],
      panelStats: [{ num: "", label: "" }],
    },
  },
  {
    key: "industries",
    type: "industries",
    label: "Industries",
    help: "A list of industry names",
    blank: { overline: "", titleLead: "", highlight: "", subtitle: "", items: [""] },
  },
  {
    key: "closing",
    type: "prose",
    label: "Closing",
    help: "Sign-off copy, before or after the FAQs",
    blank: { titleLead: "", highlight: "", paragraphs: [""], placement: "" },
  },
  {
    // Not a section of its own: it titles the FAQ block and is passed into it.
    // Listed so the editor can offer it and so its position is defined, but the
    // planner treats it as furniture rather than a block to render.
    key: "faqsHeading",
    type: null,
    label: "Faqs Heading",
    help: "Overrides the default “Frequently Asked Questions” heading",
    blank: { overline: "", titleLead: "", highlight: "" },
  },
  {
    key: "faqs",
    type: "faqs",
    label: "Faqs",
    help: "Question and answer pairs",
    list: true,
    blank: [{ q: "", a: "" }],
  },
];

/* ── Views onto the list, so no consumer has to walk it ────────────────────── */

export const SECTION_KEYS = SECTIONS.map((s) => s.key);

const index = new Map(SECTIONS.map((s) => [s.key, s]));

export const sectionFor = (key) => index.get(key) || null;

// The default renderer for a key. Null for `faqsHeading`, which draws nothing of
// its own, and only a fallback for `cardGroups`, whose entries are dispatched by
// shape.
export const typeForKey = (key) => index.get(key)?.type ?? null;

export const labelForKey = (key) => index.get(key)?.label ?? null;

export const helpForKey = (key) => index.get(key)?.help ?? "";

// A fresh blank, deep-copied. Handing out the manifest's own object would let an
// editor type into the template and have the next "Add section" arrive
// pre-filled with someone else's words.
export const blankFor = (key) => {
  const blank = index.get(key)?.blank;
  return blank === undefined ? null : JSON.parse(JSON.stringify(blank));
};

// Position in the render order. Anything unknown sorts to the end rather than to
// the front, so a key this build has never heard of cannot displace real
// sections.
export const rankOf = (key) => {
  const i = SECTION_KEYS.indexOf(String(key).split(/[.[]/)[0]);
  return i === -1 ? SECTION_KEYS.length : i;
};

export default SECTIONS;

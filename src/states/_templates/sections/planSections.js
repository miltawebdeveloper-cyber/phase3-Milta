// Turn a CMS `content` object into an ordered list of sections to render.
//
// This is the file that answers the requirement the old template could not: a
// page must come out in the order its DOCUMENT was written, not in the order the
// template happens to declare its props.
//
// _ServiceLayout renders a fixed sequence — hero, intro, prose, whyEssential,
// solutions, cardGroups, checklists, comparisonTable, advantages, industries,
// closing, faqs. Every page is forced through that sequence whatever its source
// document said, and any section an editor adds jumps ahead of the uploaded copy
// because its key sorts earlier. Here the order is DATA, resolved once, and the
// layout just walks it.
//
// Order is resolved from three sources, in descending priority:
//
//   1. `content.order` — an explicit list, if the row carries one. Entries name
//      a key ("intro") or an element of an array key ("cardGroups.2").
//      layoutService writes it when a document is parsed, so it is the uploaded
//      document's own sequence; a row saved before it existed has none and is
//      not disadvantaged.
//   2. Array order within `cardGroups` / `checklists`. layoutService emits an
//      uploaded document's blocks into `cardGroups` IN DOCUMENT ORDER, so for a
//      page built from an upload this already is the document's own sequence.
//   3. The manifest's order, for named sections an editor added by hand. They
//      are placed relative to the document's flow rather than ahead of it.
//
// One naming note. The content KEY for the opening block is `hero` — that is
// what 227 published rows, the extractor and _ServiceLayout all store — but the
// section TYPE it maps to is `banner`, which is what the people writing these
// pages call it and what their source documents label it. The key is data; the
// type is what an editor sees.
//
// Pure on purpose — the only import is the manifest, which is data. The render
// planner has to stay loadable by a plain node script (scripts/check-document-
// order.mjs runs it against the server's document parser), so nothing here may
// reach for React.
import { SECTION_KEYS, typeForKey, rankOf } from "./manifest.js";

// Where a hand-added named section sits when nothing else decides. This IS the
// manifest's order, so what an editor sees while typing is the order they get —
// the two cannot drift, because there is only one list.
export const CANONICAL_ORDER = SECTION_KEYS;

// Keys that are not sections. `faqsHeading` titles the FAQ block and is passed
// into it; `order` is the plan itself; the rest are row-level, not content.
const NOT_A_SECTION = new Set(["faqsHeading", "order", "layout"]);

// Fields that describe how a section looks rather than what it says. A section
// carrying only these is empty — a template card that arrives with its icon
// chosen and every word still blank must not render as an icon above three empty
// lines.
const PRESENTATION = new Set(["icon", "bg", "placement", "columns", "image", "imageAlt"]);

const hasText = (v) => typeof v === "string" && v.trim() !== "";

const entryHasText = (entry) => {
  if (typeof entry === "string") return hasText(entry);
  if (!entry || typeof entry !== "object") return false;
  return Object.entries(entry).some(([key, v]) => {
    if (PRESENTATION.has(key)) return false;
    if (Array.isArray(v)) return v.some(entryHasText);
    return hasText(v);
  });
};

// Has this section anything at all to show? A page can be given its service's
// full section structure before the copy exists, and an unfilled section must
// not render as a heading above a blank band.
export const isEmptySection = (data) => {
  if (Array.isArray(data)) return !data.some(entryHasText);
  if (!data || typeof data !== "object") return true;
  if ([data.titleLead, data.highlight, data.overline, data.subtitle, data.titleTail, data.intro]
    .some(hasText)) return false;
  // `stats` and `panelStats` are figures, and a section can legitimately carry
  // nothing else — the California intro is exactly that. Leaving them out of
  // this list dropped the whole block.
  return ![data.items, data.paragraphs, data.rows, data.stats, data.panelStats].some(
    (list) => Array.isArray(list) && list.some(entryHasText),
  );
};

// The four keys whose stored SHAPE decides their renderer, so the manifest's
// declared type is only their fallback:
//
//   cardGroups      one ordered list holding four kinds of block; the shape of
//                   each entry picks the component.
//   checklists      same, for a list of checklist blocks.
//   whyEssential    usually a checklist, but a row may hold paragraphs there.
//   comparisonTable normally a tick table, but layoutService falls back to
//                   `{ paragraphs }` for a table of real values (prices, dates)
//                   that would be meaningless as ticks.
//
// Every other key is decided by the manifest, because its design is an editorial
// decision the shape cannot express: `industries` and `solutions` both hold a
// list, but one is a run of tags and the other a grid of icon cards.
const SHAPE_DECIDES = new Set(["cardGroups", "checklists", "whyEssential", "comparisonTable"]);

/**
 * Which renderer draws this block.
 *
 * @param {string} key   the content key the block is stored under
 * @param {object} data  the block itself
 * @returns {string} a type name the registry can resolve to a component
 */
export function typeOf(key, data) {
  const d = data && typeof data === "object" ? data : {};

  if (!SHAPE_DECIDES.has(key)) {
    const declared = typeForKey(key);
    if (declared) return declared;
  }

  // A comparisonTable without rows is not a table. It is layoutService's
  // fallback for a table of real values, and ComparisonTable renders null when
  // there are no rows — so sending it there would drop the copy entirely.
  if (key === "comparisonTable") return Array.isArray(d.rows) ? "table" : "prose";

  if (Array.isArray(d.rows)) return "table";
  if (Array.isArray(d.paragraphs)) return "prose";
  if (Array.isArray(d.items)) {
    return typeof d.items[0] === "string" ? "checklist" : "cards";
  }
  // Nothing under the heading yet, so fall back to what the key is FOR —
  // whyEssential and checklists are checklists even while empty.
  return typeForKey(key) || "prose";
}

// Every addressable slot in a content object, flattened. Array keys become one
// entry per element so `cardGroups.2` can be named individually.
function slotsOf(content) {
  const slots = new Map();
  for (const [key, value] of Object.entries(content || {})) {
    if (NOT_A_SECTION.has(key)) continue;
    if (key !== "faqs" && Array.isArray(value)) {
      value.forEach((entry, i) => slots.set(`${key}.${i}`, { key, index: i, data: entry }));
      continue;
    }
    slots.set(key, { key, index: null, data: value });
  }
  return slots;
}

const rank = rankOf;

/**
 * @param {object} content a row's `content` (the servicelayout/v1 object)
 * @returns {Array<{id, key, type, data, band, index}>} sections in render order
 */
export default function planSections(content) {
  if (!content || typeof content !== "object" || Array.isArray(content)) return [];

  const slots = slotsOf(content);

  // 1. Anything the row names explicitly, in the order it names it. Unknown ids
  //    are skipped rather than treated as an error — a section deleted in the
  //    editor leaves its name behind in `order`, and that must not blank a page.
  const named = Array.isArray(content.order) ? content.order.map(String) : [];
  const ordered = [];
  const seen = new Set();
  for (const id of named) {
    if (slots.has(id) && !seen.has(id)) {
      ordered.push(id);
      seen.add(id);
    }
  }

  // 2. Everything else, in canonical order — and, crucially, stable within an
  //    array key, so cardGroups keeps the document's own sequence.
  const rest = [...slots.keys()].filter((id) => !seen.has(id));
  rest.sort((a, b) => {
    const byKey = rank(a) - rank(b);
    if (byKey !== 0) return byKey;
    const ai = slots.get(a).index;
    const bi = slots.get(b).index;
    return (ai ?? 0) - (bi ?? 0);
  });

  let ids = [...ordered, ...rest];

  // 3. The banner always opens the page, wherever it was listed (its key is
  //    `hero`). Nothing else about the order is overridden — this one is
  //    structural, not editorial.
  if (ids.includes("hero")) ids = ["hero", ...ids.filter((id) => id !== "hero")];

  // 4. A closing block that says it belongs after the questions goes there.
  const closingAfter = ids.filter(
    (id) => slots.get(id).key === "closing" && slots.get(id).data?.placement === "afterFaqs",
  );
  if (closingAfter.length) {
    ids = [...ids.filter((id) => !closingAfter.includes(id))];
    const faqAt = ids.indexOf("faqs");
    if (faqAt === -1) ids.push(...closingAfter);
    else ids.splice(faqAt + 1, 0, ...closingAfter);
  }

  // 5. Drop what has nothing to show, then band and number what survives.
  //
  //    Bands are assigned by POSITION, not from the stored `bg`. Every row's
  //    `bg` was computed against the old fixed order; honouring it after a
  //    reorder is how two identical bands end up adjacent and the page stops
  //    reading as alternating sections. Position is the only thing that can be
  //    right for every order.
  let body = 0;
  return ids
    .map((id) => {
      const slot = slots.get(id);
      const type = typeOf(slot.key, slot.data);
      return { id, key: slot.key, type, data: slot.data };
    })
    .filter((s) => s.type === "banner" || !isEmptySection(s.data))
    .map((s) => {
      if (s.type === "banner") return { ...s, band: "deep", index: null };
      body += 1;
      return { ...s, band: body % 2 === 1 ? "default" : "paper", index: body };
    });
}

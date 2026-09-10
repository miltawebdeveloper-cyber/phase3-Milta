// Did the content update actually land, and is any of it missing?
//
// The baseline is `pages.import_text` — the plain text of the last document
// applied to the page. Comparing against that answers the question the panel
// exists for, because the document is the thing the page was supposed to become.
//
// What is checked automatically, and what is not:
//
//   AUTOMATIC  completeness. Every word in the source must appear in the page's
//              content at least as often. This is word-level, not section-level,
//              so a dropped clause is caught and not just a dropped block.
//
//   AUTOMATIC  structure. The sections, their headings and their ORDER are read
//              back off the stored content, so what is on the page can be
//              compared with what the document said.
//
//   HUMAN      the judgement. Whether the copy reads correctly is not something
//              a word count can answer, so the panel ends in a person pressing
//              "Mark as completed" — and that mark is tied to a hash of the
//              content, so a later edit drops the page back to "Updated" rather
//              than leaving a stale tick.
//
// Status is DERIVED here, never stored. A stored status goes stale the moment
// someone edits the page, which is precisely the case this is meant to catch.

const crypto = require("crypto");

const SECTION_ORDER = [
  "hero", "intro", "prose", "whyEssential", "solutions", "cardGroups",
  "checklists", "comparisonTable", "advantages", "industries", "closing",
  "faqsHeading", "faqs",
];

// Tick-table cells are stored as booleans and drawn as icons, so the words
// "Yes"/"No" legitimately do not survive into the content. Excluding them keeps
// the completeness check from reporting a table as missing copy.
const TICK_WORD = /^(yes|no|y|n|x|true|false|na)$/;

// Words too common to be evidence of anything, and noisy when listed as missing.
const STOP = new Set(["a", "an", "and", "the", "of", "to", "in", "for", "on", "or", "is", "are", "with", "at", "by", "it"]);

// List numbering, which is structure rather than copy.
//
// A document that writes its FAQs as "1: What is bookkeeping? …" through
// "10: How do I get started? …" has those numbers stripped when the pairs are
// recognised, because the accordion numbers itself. Counting them as missing
// copy reported ten losses on a page that had lost nothing — and buried the
// words that would matter if any ever were.
//
// Only bare numbers. A number inside a sentence is still checked, because
// "Form 1040" losing its 1040 is real.
const NUMBERING = /^\d{1,3}$/;

const words = (s) =>
  String(s ?? "")
    .replace(/<[^>]+>/g, " ")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

const bag = (list) => list.reduce((m, w) => m.set(w, (m.get(w) || 0) + 1), new Map());

const hashOf = (content) =>
  crypto.createHash("sha256").update(JSON.stringify(content ?? "")).digest("hex").slice(0, 32);

const rank = (k) => {
  const i = SECTION_ORDER.indexOf(k);
  return i === -1 ? SECTION_ORDER.length : i;
};

const headingOf = (d) => [d?.titleLead, d?.highlight].filter(Boolean).join(" ").trim();

// What kind of block ServiceLayout will render this as. Same rule as the
// template, so the outline shown to a reviewer matches the page they will get.
const rendererOf = (g) => {
  if (!g || typeof g !== "object") return "unknown";
  if (g.rows) return "table";
  if (g.paragraphs) return "prose";
  if (Array.isArray(g.items)) return typeof g.items[0] === "string" ? "checklist" : "cards";
  return "cards";
};

const countPoints = (g) => {
  if (!g || typeof g !== "object") return 0;
  if (Array.isArray(g.rows)) return g.rows.length;
  if (Array.isArray(g.paragraphs)) return g.paragraphs.length;
  if (Array.isArray(g.items)) return g.items.length;
  return 0;
};

/**
 * The page's structure, in the order ServiceLayout will render it.
 * This is the "sections, points, headings and their order" a reviewer reads.
 */
function outlineOf(content) {
  if (!content || typeof content !== "object") {
    return [{ section: "content", kind: typeof content === "string" ? "raw text" : "empty", heading: "", points: 0 }];
  }

  const out = [];
  for (const [key, value] of Object.entries(content).sort((a, b) => rank(a[0]) - rank(b[0]))) {
    if (key === "faqs") {
      out.push({ section: "faqs", kind: "faqs", heading: "Frequently Asked Questions", points: (value || []).length });
      continue;
    }
    if (key === "faqsHeading") continue;             // titles the FAQ block above
    if (key === "order") continue;                   // the render plan, not a section
    if (key === "hero") {
      out.push({
        section: "hero",
        kind: "hero",
        heading: headingOf(value),
        points: value?.subtitle ? 1 : 0,
      });
      continue;
    }
    if (Array.isArray(value)) {
      value.forEach((g, i) => out.push({
        section: `${key}[${i}]`,
        kind: rendererOf(g),
        heading: headingOf(g),
        points: countPoints(g),
      }));
      continue;
    }
    out.push({ section: key, kind: rendererOf(value), heading: headingOf(value), points: countPoints(value) });
  }
  return out;
}

/**
 * Cross-check one page against the document it was built from.
 *
 * @param {object} page a row from `pages`
 */
function verify(page) {
  const content = page?.content;
  const source = page?.import_text || "";
  const outline = outlineOf(content);
  const contentWords = bag(words(JSON.stringify(content ?? "")));

  const totals = {
    sections: outline.length,
    points: outline.reduce((n, s) => n + s.points, 0),
    contentWords: [...contentWords.values()].reduce((a, b) => a + b, 0),
    sourceWords: 0,
  };

  const missing = [];
  if (source) {
    const src = bag(words(source));
    totals.sourceWords = [...src.values()].reduce((a, b) => a + b, 0);
    for (const [w, n] of src) {
      if (TICK_WORD.test(w) || STOP.has(w) || NUMBERING.test(w)) continue;
      const have = contentWords.get(w) || 0;
      if (have < n) missing.push({ word: w, inSource: n, onPage: have });
    }
  }

  // Sorted so the most-repeated missing word — usually the most significant
  // omission — is the first thing a reviewer sees.
  missing.sort((a, b) => (b.inSource - b.onPage) - (a.inSource - a.onPage));

  const coverage = totals.sourceWords
    ? Math.max(0, Math.round(((totals.sourceWords - missing.reduce((n, m) => n + (m.inSource - m.onPage), 0)) / totals.sourceWords) * 100))
    : null;

  const hash = hashOf(content);
  const emptySections = outline.filter((s) => !s.points && s.kind !== "faqs" && s.section !== "hero");

  return {
    hasSource: !!source,
    source: page?.import_source || null,
    importedAt: page?.imported_at || null,
    verifiedAt: page?.verified_at || null,
    verifiedBy: page?.verified_by || null,
    note: page?.verification_note || null,
    hash,
    matchesVerified: !!page?.verified_hash && page.verified_hash === hash,
    coverage,
    totals,
    outline,
    emptySections,
    missing: missing.slice(0, 60),
    missingCount: missing.length,
    status: statusOf({ page, missingCount: missing.length, hash, hasSource: !!source }),
  };
}

/**
 * Pending      — never imported and never checked. Nothing to compare.
 * Needs review — the source has copy the page does not, or a section is empty.
 * Verified     — signed off, and unchanged since.
 * Updated      — content has moved on since the last sign-off (or was never
 *                signed off), and is waiting to be checked.
 */
function statusOf({ page, missingCount, hash, hasSource }) {
  if (missingCount > 0) return "needs_review";
  if (page?.verified_at && page.verified_hash === hash) return "verified";
  if (!hasSource && !page?.verified_at) return "pending";
  return "updated";
}

const STATUS_LABELS = {
  pending: "Pending",
  updated: "Updated",
  needs_review: "Needs review",
  verified: "Completed",
};

module.exports = { verify, outlineOf, statusOf, hashOf, STATUS_LABELS, SECTION_ORDER };

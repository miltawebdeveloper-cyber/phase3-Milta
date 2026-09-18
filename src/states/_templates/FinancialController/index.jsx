// ─────────────────────────────────────────────────────────────────────────────
// THE FINANCIAL CONTROLLER SERVICE TEMPLATE
//
// Reference page (the image this reproduces):
//   https://www.miltafs.com/us/services/financial-controller-services-in-arizona/
//
//    1. Banner                 hero          dark band, one <h1>
//    2. Intro + image           intro         copy left · photo right · stat figures
//    3–N. Every other block, IN THE ORDER THE DOCUMENT WROTE THEM
//         (including the "Capabilities" Controller-vs-CFO comparison table)
//    +  FAQ                     faqs          accordion
//    +  The Next Step / Footer                shared site chrome
//
// WHY THIS DRIVES OFF content.order, NOT FIXED KEYS
//   Same reasoning as ../Tax, ../CPA, ../DataEntry and ../DigitalMarketing
//   (read their file headers for the full case): reading `content.order` —
//   layoutMerge's own record of the document's real sequence — means a block
//   keeps its true position even when the document supplies a slightly
//   different shape than db/templates/financial-controller.json expected.
//
// A KNOWN LIMITATION ON THIS SERVICE
//   The real Arizona document writes five short, independent sections back to
//   back, each as one bold heading + a single paragraph — "Controller vs.
//   CFO", "What are Financial Controller Services?", "When to Choose a
//   Controller", "When to Choose a CFO", "Miltafs Financial Controller
//   Services". That is the exact shape server/services/layoutService.js's
//   inferHeadingsFromBold uses to recognise "one section followed by its own
//   feature cards" elsewhere (Bookkeeping's "Why Choose Milta" + 4 cards is
//   the case it was built for), so it folds some of these five independent
//   headings into one another as cards instead of keeping them as five peer
//   sections. Nothing is lost — every heading and paragraph still renders,
//   just occasionally nested under a neighbour instead of standing alone —
//   but the section BOUNDARIES for this specific document are not exact. That
//   heuristic is tuned against several other real documents and was not
//   changed blind for this one; fixing it precisely is a separate, deliberate
//   piece of work.
//
// Financial Controller has no numbered TOP-LEVEL sub-sections of its own — the
// "1. Reporting from Management" … "11. Audit Assistance" run is eleven CARDS
// inside the single "Our Financial Controller Services in {state}" block, not
// eleven sections — so like CPA, Data Entry and Digital Marketing this file's
// body walk has no grouping step.
//
// THE PIXELS come from ../../_ServiceLayout, imported not re-drawn. What THIS
// file owns is the order and the Financial Controller photograph.
// ─────────────────────────────────────────────────────────────────────────────
import React, { lazy, Suspense } from "react";
import { Box } from "@mui/material";
import useFullSEO from "../../../utils/useFullSEO";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import ScrollToTop from "../../../components/ScrollToTop";
import {
  Hero,
  Prose,
  Checklist,
  CardGroup,
  ComparisonTable,
  FAQSection,
} from "../../_ServiceLayout";
import IntroWithImage from "../sections/IntroWithImage";
import financialControllerImage from "../../../assets/services/finance.jpg";
import STRUCTURE from "./structure";

const CTASection = lazy(() => import("../../../components/homeComp/CTASection"));

// The database service string this template is registered under (see ../index.js).
export const SERVICE = "Financial Controller";

// The section contract the CMS fills on upload, co-located with the layout.
export { STRUCTURE };

const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

// One <h1>, emitted only by <Hero>. Fall back to the row's meta / state if a
// row is ever saved with no hero copy.
function resolveHero(content, { fallbackTitle, fallbackDescription, state }) {
  const hero = asObject(content.hero);
  const hasText = [hero.titleLead, hero.highlight].some((t) => String(t || "").trim());
  if (hasText) return hero;
  return {
    ...hero,
    titleLead: fallbackTitle || "Financial Controller Services in",
    highlight: state || "",
    subtitle: hero.subtitle || fallbackDescription || "",
    breadcrumb: hero.breadcrumb || (state ? `Financial Controller Services in ${state}` : "Financial Controller Services"),
    ctaLabel: hero.ctaLabel || "Schedule Your Free Consultation Today",
  };
}

/* ── Reading the body in document order ──────────────────────────────────── */

// "cardGroups.7" -> content.cardGroups[7]; "prose" -> content.prose.
function resolveNode(content, id) {
  const m = /^([A-Za-z]+)\.(\d+)$/.exec(id);
  if (m) return content[m[1]]?.[Number(m[2])];
  return content[id];
}

// A row saved before content.order existed (or built by hand) has none. This
// reconstructs the old fixed sequence so such a row still renders in full.
function fallbackOrder(content) {
  const order = ["prose"];
  toArray(content.cardGroups).forEach((_, i) => order.push(`cardGroups.${i}`));
  return order;
}

// `hero`, `intro`, `faqs` and `faqsHeading` are rendered by dedicated steps
// below and never re-enter the generic body walk.
const SPECIAL_IDS = new Set(["hero", "intro", "faqs", "faqsHeading"]);

function bodyOrder(content) {
  const order = Array.isArray(content.order) && content.order.length
    ? content.order
    : fallbackOrder(content);
  return order.filter((id) => !SPECIAL_IDS.has(id));
}

/* ── Recovering a section the parser folded into a neighbour's card ───────── */
//
// See the file header's "KNOWN LIMITATION" note for the full mechanism. This
// recovers the one piece of it that is safe to reconstruct with confidence: a
// CARD whose own title is, word for word, one of this service's known section
// headings (from structure.json's own exampleHeading list) was never meant to
// be a card at all — it is pulled back out here as its own standalone prose
// section, using the card's `desc` as its paragraph.
//
// What this does NOT attempt: a heading that the parser ran together with a
// neighbour's trailing text (no card, no boundary marker at all — the two
// sentences are joined by a plain space with nothing left to split on). Doing
// that reliably needs fuzzy text matching this file cannot verify is always
// correct, so that text stays exactly where the parser put it rather than
// risk silently misplacing real copy. Nothing here ever removes a word — a
// card that does not match a known heading is left exactly as parsed.
const normalizeWords = (text) =>
  String(text || "").trim().toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);

const KNOWN_HEADING_WORDS = (STRUCTURE.sections || [])
  .map((s) => normalizeWords(s.exampleHeading))
  .filter((words) => words.length >= 2);

// db/templates/*.json's exampleHeading values are deliberately truncated
// prefixes ("What are Financial Controller", not the full "...Services?"), so
// this has to accept either side beginning the other — an exact word-count
// match would never fire.
const isKnownHeading = (text) => {
  const words = normalizeWords(text);
  if (!words.length) return false;
  return KNOWN_HEADING_WORDS.some((hw) => {
    const shorter = Math.min(hw.length, words.length);
    if (shorter < 2) return false;
    for (let i = 0; i < shorter; i++) if (hw[i] !== words[i]) return false;
    return true;
  });
};

// Split one cardGroups node into: its OWN heading and lead-in text first (if
// it had any — carried on a plain prose node, never lost), then its items in
// order, with any item whose title is a known heading pulled out as its own
// section and everything else kept together in the card grid it came from.
//
// A host with NO heading of its own (titleLead and highlight both empty) is
// the one case that text is NOT emitted as its own section: unlabelled lead-in
// prose ahead of a heading it never had is a stray paragraph sitting in front
// of whatever it actually introduces, not a section in its own right — the
// Michigan document's "Understanding the Right Leadership for Your Business…"
// is exactly this, sitting orphaned ahead of "What are Financial Controller
// Services?" instead of serving as that section's own opening paragraph.
// Prepended instead to the first recovered heading's own paragraph, so the
// words render where they read as belonging, never dropped and never split
// off into their own headless block.
function recoverSections(node) {
  const g = asObject(node);
  const items = Array.isArray(g.items) ? g.items : null;
  if (!items || !items.some((it) => it && typeof it === "object" && isKnownHeading(it.title))) {
    return [g];
  }

  const out = [];
  const hasOwnHeading = !!(g.titleLead || g.highlight);
  const leadParagraphs = [g.subtitle, g.footnote].filter(Boolean);

  if (hasOwnHeading) {
    out.push({ titleLead: g.titleLead, highlight: g.highlight, paragraphs: leadParagraphs, bg: g.bg });
  }

  let pending = [];
  const flushPending = () => {
    if (pending.length) out.push({ bg: g.bg, columns: g.columns, items: pending });
    pending = [];
  };
  let unclaimedLead = hasOwnHeading ? [] : leadParagraphs;
  for (const item of items) {
    if (item && typeof item === "object" && isKnownHeading(item.title)) {
      flushPending();
      // `trailingParagraph` — see recoverIntro — is a second paragraph the
      // parser split away from this item's own `desc` (both belong to THIS
      // heading, in that order), never a lead-in, so it is appended, not
      // prepended like unclaimedLead.
      out.push({
        titleLead: item.title,
        paragraphs: [...unclaimedLead, item.desc, item.trailingParagraph].filter(Boolean),
        bg: g.bg,
      });
      unclaimedLead = [];
    } else {
      pending.push(item);
    }
  }
  flushPending();

  return out;
}

// A known heading found at the very START of a `subtitle` or `footnote`
// field — not searched for anywhere inside it, only at position zero, which
// is the one place safe to split without guessing where the document's own
// paragraph boundaries were. "Who Can Benefit from Our Services?
// Strengthening Businesses…" sits as the SUBTITLE of the section before it
// this way, because the source document wrote that heading and its own
// subtitle as one paragraph joined by a manual line break, directly under a
// still-open heading — the same shape as the FAQ-label problem
// server/services/layoutService.js already guards, just one level up.
//
// structure.json's exampleHeading is a deliberately truncated prefix ("Who
// Can Benefit from", not "…Our Services?"), so once the prefix matches this
// extends up to the next "?" / ":" within a few more words — the document's
// own punctuation, not a guess — to recover the heading's real full text.
function splitLeadingHeading(text) {
  const raw = String(text || "").trim().split(/\s+/).filter(Boolean);
  const norm = normalizeWords(text);
  if (!raw.length || norm.length !== raw.length) return null;
  for (const hw of KNOWN_HEADING_WORDS) {
    if (hw.length > norm.length) continue;
    let match = true;
    for (let i = 0; i < hw.length; i++) if (norm[i] !== hw[i]) { match = false; break; }
    if (!match) continue;

    let end = hw.length;
    const lookahead = Math.min(raw.length, hw.length + 6);
    for (let i = hw.length; i < lookahead; i++) {
      if (/[?:]$/.test(raw[i])) { end = i + 1; break; }
    }
    return { heading: raw.slice(0, end).join(" "), rest: raw.slice(end).join(" ") };
  }
  return null;
}

// The whole-list pass: pull a leading known heading off whichever field
// carries it, and give it to the node that actually needs it — the very next
// node, when that one has cards of its own but no heading (that is where
// "Who Can Benefit from Our Services?" belongs, directly over the three cards
// it introduces); otherwise a new standalone paragraph, so the words are
// never dropped even with nothing obvious to attach them to.
//
// A plain node still carries the text in `subtitle`/`footnote`, but a host
// node recoverSections() just emitted has already folded those two fields
// into `paragraphs: [subtitle, footnote].filter(Boolean)` — the footnote is
// always appended last, so it is always the FINAL entry of that array, never
// a middle one. "Miltafs Financial Controller Services…" only surfaces this
// way, so `paragraphs` gets checked too, not just the two string fields.
function attachLeadingHeadings(nodes) {
  const out = nodes.map((n) => ({ ...asObject(n) }));
  for (let i = 0; i < out.length; i++) {
    const node = out[i];
    let field = null;
    let text = null;
    if (node.subtitle) {
      field = "subtitle";
      text = node.subtitle;
    } else if (node.footnote) {
      field = "footnote";
      text = node.footnote;
    } else if (Array.isArray(node.paragraphs) && node.paragraphs.length) {
      field = "paragraphs";
      text = node.paragraphs[node.paragraphs.length - 1];
    }
    if (!field) continue;
    const split = splitLeadingHeading(text);
    if (!split) continue;

    if (field === "paragraphs") {
      node.paragraphs = node.paragraphs.slice(0, -1);
    } else {
      node[field] = "";
    }

    const next = out[i + 1];
    const nextIsHeadless =
      next && !next.titleLead && !next.highlight && Array.isArray(next.items) && next.items.length;
    if (nextIsHeadless) {
      out[i + 1] = { ...next, titleLead: split.heading, highlight: "", subtitle: split.rest };
    } else {
      out.splice(i + 1, 0, { titleLead: split.heading, paragraphs: [split.rest].filter(Boolean), bg: node.bg });
      i += 1;
    }
  }
  return out;
}

/* ── Recovering an intro the parser folded into the NEXT section's card ───── *
 *
 * The same fold the file header's "KNOWN LIMITATION" describes for five
 * short back-to-back sections also happens to the very first one: the
 * document's opening heading + its two lead paragraphs, plus the *next*
 * section's heading and description, sometimes land together as ONE
 * "cards"-shaped block (one item, that item's own title a known section
 * heading). A "cards"-shaped block can never match the `intro` target —
 * `intro` is prose-kind, and the merge engine gates matching on kind before
 * it ever looks at the heading — so `content.intro` is left blank and the
 * page's photo/stats banner renders with no words at all, while the exact
 * text that belongs there sits, unlabelled as a banner but otherwise
 * correct, as a plain paragraph further down the page. Confirmed on the live
 * Michigan row before this fix, not a hypothetical — Connecticut's own blank
 * intro turned out to be a different thing entirely (its source document
 * never wrote that section at all, so there is nothing to recover), which is
 * exactly why this only acts when a real, shaped match is found rather than
 * inventing intro copy for a page that genuinely has none.
 *
 * Recovered by heading, matched against the intro section's own
 * exampleHeading, and ONLY when `content.intro` is actually blank — a page
 * that already has real intro copy is never touched.
 *
 * `subtitle` and `footnote` on this folded block are NOT both the intro's —
 * checked directly against the Michigan source document (the admin pasted
 * the original alongside the rendered page): `subtitle` is genuinely the
 * intro's own paragraph, but `footnote` is the embedded item's SECOND
 * paragraph, the one after its own `desc` — the parser lost the paragraph
 * break between them and left both as one trailing field on the host instead
 * of on the item they actually continue. Taking `footnote` for the intro (an
 * earlier version of this fix did exactly that) moved a whole paragraph into
 * the wrong section — present, but under the wrong heading, which is the
 * same "unordered" failure as losing it outright. `subtitle` alone becomes
 * the intro's paragraph; `footnote` travels with the embedded item as its
 * `trailingParagraph`, for recoverSections to append after that item's own
 * `desc` exactly as the source document orders them.
 */
const INTRO_EXAMPLE_WORDS = normalizeWords(
  (STRUCTURE.sections || []).find((s) => s.key === "intro")?.exampleHeading || "",
);

const hasRealIntro = (intro) => {
  const g = asObject(intro);
  return !!(String(g.titleLead || "").trim() || String(g.highlight || "").trim()
    || (g.paragraphs || []).some((t) => String(t || "").trim()));
};

function looksLikeFoldedIntro(node) {
  const g = asObject(node);
  const items = Array.isArray(g.items) ? g.items : [];
  if (items.length !== 1 || !items[0] || typeof items[0] !== "object") return false;
  if (!INTRO_EXAMPLE_WORDS.length) return false;
  const headingWords = normalizeWords([g.titleLead, g.highlight].filter(Boolean).join(" "));
  const shorter = Math.min(INTRO_EXAMPLE_WORDS.length, headingWords.length);
  if (shorter < 3) return false;
  for (let i = 0; i < shorter; i += 1) if (INTRO_EXAMPLE_WORDS[i] !== headingWords[i]) return false;
  return true;
}

function recoverIntro(rawC) {
  if (hasRealIntro(rawC.intro)) return rawC;
  for (const id of bodyOrder(rawC)) {
    const node = resolveNode(rawC, id);
    if (!looksLikeFoldedIntro(node)) continue;

    const out = { ...rawC };
    out.intro = {
      titleLead: node.titleLead,
      highlight: node.highlight,
      paragraphs: [node.subtitle].filter((t) => String(t || "").trim()),
      ctaLabel: node.ctaLabel,
    };
    // The footnote belongs to the embedded item, as its second paragraph —
    // see the comment above — carried across only when there is exactly one
    // item to attach it to (the shape this recovery only ever matches).
    const footnote = String(node.footnote || "").trim();
    const items = footnote && Array.isArray(node.items) && node.items.length === 1
      ? [{ ...node.items[0], trailingParagraph: footnote }]
      : node.items;
    const stripped = { items, bg: node.bg, columns: node.columns };
    const m = /^([A-Za-z]+)\.(\d+)$/.exec(id);
    if (m) {
      out[m[1]] = out[m[1]].slice();
      out[m[1]][Number(m[2])] = stripped;
    } else {
      out[id] = stripped;
    }
    return out;
  }
  return rawC;
}

/* ── Rendering one node by its shape ─────────────────────────────────────── */
// The SHAPE of a node picks its renderer — paragraphs is prose, string items a
// checklist, object items a card grid, rows a table (the "Capabilities"
// Controller-vs-CFO comparison lands here) — the same dispatch
// ../../_ServiceLayout.ServiceLayout uses for its own ordered lists. Each node
// keeps its own authored band and column count.
function renderNode(node, key) {
  const g = asObject(node);
  if (Array.isArray(g.rows)) return <ComparisonTable key={key} data={g} />;
  if (Array.isArray(g.paragraphs)) return <Prose key={key} data={{ ...g, bg: g.bg || "paper" }} />;
  if (typeof g.items?.[0] === "string") return <Checklist key={key} data={g} />;
  return <CardGroup key={key} data={g} />;
}

/**
 * @param {object}  content   servicelayout/v1 object from the page row
 * @param {object}  seo       row SEO, applied unless `preview`
 * @param {string}  state     the page's state, for the hero fallback only
 * @param {boolean} preview   drop site chrome + SEO (CMS save-preview)
 */
export default function FinancialControllerTemplate({
  content,
  seo,
  // eslint-disable-next-line no-unused-vars -- read by ../index.js callers, kept off content
  service = SERVICE,
  state = "",
  preview = false,
  fallbackTitle = "",
  fallbackDescription = "",
  ...rest
}) {
  useFullSEO(preview ? null : seo);

  const rawC =
    content && typeof content === "object" && !Array.isArray(content) ? content : rest;
  const c = recoverIntro(rawC);

  const hero = resolveHero(c, { fallbackTitle, fallbackDescription, state });

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", position: "relative" }}>
      {!preview && <Navbar />}

      {/* 1 — Banner. Dark band, the page's single <h1>. */}
      <Hero hero={hero} />

      {/* 2 — Intro. Copy left, Financial Controller photograph right, 3 stat figures. */}
      <IntroWithImage
        data={asObject(c.intro)}
        fallbackImage={financialControllerImage}
        fallbackAlt="Financial controller services"
      />

      {/* 3+ — Everything else, in the order the document wrote it. See the file
          header for why this reads content.order rather than trusting which
          key each block landed under. recoverSections pulls a mis-nested card
          back out into its own section; attachLeadingHeadings then pulls a
          heading found leading a subtitle/footnote out to wherever it
          actually belongs. */}
      {attachLeadingHeadings(
        bodyOrder(c).map((id) => resolveNode(c, id)).flatMap(recoverSections),
      ).map((node, i) => renderNode(node, i))}

      {/* FAQ. Accordion. */}
      <FAQSection faqs={toArray(c.faqs)} heading={c.faqsHeading} />

      {!preview && (
        <Suspense fallback={null}>
          <CTASection />
          <Footer />
        </Suspense>
      )}
      {!preview && <ScrollToTop />}
    </Box>
  );
}

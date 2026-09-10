// ─────────────────────────────────────────────────────────────────────────────
// THE CPA SERVICE TEMPLATE
//
// Reference page (the image this reproduces):
//   https://www.miltafs.com/us/services/best-cpa-services-for-small-businesses-in-the-arizona/
//
//    1. Banner                 hero          dark band, one <h1>
//    2. Intro + image           intro         copy left · photo right · stat figures
//    3–N. Every other block, IN THE ORDER THE DOCUMENT WROTE THEM
//    +  FAQ                     faqs          accordion
//    +  The Next Step / Footer                shared site chrome
//
// WHY THIS DRIVES OFF content.order, NOT FIXED KEYS
//   db/templates/cpa.json shapes an upload into fixed KEYS — hero, intro,
//   prose, cardGroups[], faqs — matching each document block to a template
//   slot by heading, falling back to slot POSITION when no heading matches
//   (server/services/layoutMerge.js). That fallback is reliable for a document
//   whose sections line up with the reference page one-for-one; it is NOT
//   reliable for a document that adds a section the template never
//   anticipated. A CPA document that opens with an extra heading before "How
//   Can We Support Your Business?" — this one does, "Transform Your Business
//   Finances with the Best CPA Services in {state}" — pushes the array
//   position every block after it would have claimed down by one, so reading
//   `cardGroups` by raw array index renders that extra heading LAST instead of
//   where it actually sits, second in the document.
//
//   `content.order` sidesteps this entirely. It is layoutMerge's own record of
//   the document's real sequence — built by walking the document's blocks in
//   the order they were written and noting where EACH ONE landed, whichever
//   key it ended up under. Reading it back, instead of trusting `cardGroups[0]`
//   to always mean "the first service block", means a block keeps its true
//   position even when an unanticipated section shifted everything after it.
//
// CPA has no numbered sub-sections of its own — every block here is a peer,
// top-level section, unlike Tax's "1." / "2." / "3." / "4." nesting. So this
// file's body walk has no grouping step: it renders each resolved node, in
// document order, as its own standalone section.
//
// THE PIXELS come from ../../_ServiceLayout, imported not re-drawn. What THIS
// file owns is the order and the CPA photograph.
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
import cpaImage from "../../../assets/services/CPA.jpg";
import STRUCTURE from "./structure";

const CTASection = lazy(() => import("../../../components/homeComp/CTASection"));

// The database service string this template is registered under (see ../index.js).
export const SERVICE = "CPA";

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
    titleLead: fallbackTitle || "Trusted CPA Services in",
    highlight: state || "",
    subtitle: hero.subtitle || fallbackDescription || "",
    breadcrumb: hero.breadcrumb || (state ? `CPA Services in ${state}` : "CPA Services"),
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

// CPA's cards show one short description each, matching the reference image —
// never a nested bullet list. A numbered sub-heading whose points got folded
// into its own card ("Accounting and Bookkeeping Services" under "Our Core CPA
// Services") keeps those points in the STORED content (server/services/
// layoutService.js's `flush` puts them on `item.bullets` so nothing is lost to
// the parse); this is the one place they are deliberately not drawn, so the
// card stays the image's short, one-line shape on the live page while the
// words themselves are still sitting in the row for the CMS editor to show.
const stripBullets = (item) => {
  if (!item || typeof item !== "object") return item;
  const { bullets, ...rest } = item;
  return rest;
};

/* ── Rendering one node by its shape ─────────────────────────────────────── */
// The SHAPE of a node picks its renderer — paragraphs is prose, string items a
// checklist, object items a card grid, rows a table — the same dispatch
// ../../_ServiceLayout.ServiceLayout uses for its own ordered lists. Each node
// keeps its own authored band and column count.
function renderNode(node, key) {
  const g = asObject(node);
  if (Array.isArray(g.rows)) return <ComparisonTable key={key} data={g} />;
  if (Array.isArray(g.paragraphs)) return <Prose key={key} data={{ ...g, bg: g.bg || "paper" }} />;
  if (typeof g.items?.[0] === "string") return <Checklist key={key} data={g} />;
  const items = Array.isArray(g.items) ? g.items.map(stripBullets) : g.items;
  return <CardGroup key={key} data={{ ...g, items }} />;
}

/**
 * @param {object}  content   servicelayout/v1 object from the page row
 * @param {object}  seo       row SEO, applied unless `preview`
 * @param {string}  state     the page's state, for the hero fallback only
 * @param {boolean} preview   drop site chrome + SEO (CMS save-preview)
 */
export default function CPATemplate({
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

  const c =
    content && typeof content === "object" && !Array.isArray(content) ? content : rest;

  const hero = resolveHero(c, { fallbackTitle, fallbackDescription, state });

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", position: "relative" }}>
      {!preview && <Navbar />}

      {/* 1 — Banner. Dark band, the page's single <h1>. */}
      <Hero hero={hero} />

      {/* 2 — Intro. Copy left, CPA photograph right, 3 stat figures. */}
      <IntroWithImage
        data={asObject(c.intro)}
        fallbackImage={cpaImage}
        fallbackAlt="CPA services"
      />

      {/* 3+ — Everything else, in the order the document wrote it. See the file
          header for why this reads content.order rather than trusting which
          key each block landed under. */}
      {bodyOrder(c).map((id, i) => renderNode(resolveNode(c, id), i))}

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

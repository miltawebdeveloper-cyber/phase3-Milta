// ─────────────────────────────────────────────────────────────────────────────
// THE DATA ENTRY SERVICE TEMPLATE
//
// Reference page (the image this reproduces):
//   https://www.miltafs.com/us/services/outsourcing-accounting-data-entry-delaware/
//
//    1. Banner                 hero          dark band, one <h1>
//    2. Intro + image           intro         copy left · photo right · stat figures
//    3–N. Every other block, IN THE ORDER THE DOCUMENT WROTE THEM
//    +  FAQ                     faqs          accordion
//    +  Closing                 closing       "Ready to transform…" + CTA button,
//                                              AFTER the FAQ — the one section here
//                                              with a fixed position regardless of
//                                              where content.order places it, because
//                                              db/templates/data-entry.json declares
//                                              it `placement: "afterFaqs"`
//    +  The Next Step / Footer                shared site chrome
//
// WHY THIS DRIVES OFF content.order, NOT FIXED KEYS
//   Same reasoning as ../Tax, ../CPA and ../DigitalMarketing (read their file
//   headers for the full case): db/templates/data-entry.json shapes an upload
//   into fixed KEYS by matching each document block to a template slot by
//   heading, falling back to slot KIND when no heading matches. Reading
//   `content.order` back — layoutMerge's own record of the document's real
//   sequence — means a block keeps its true position even when the document
//   supplies a slightly different shape than the template expected.
//
// Data Entry has no numbered sub-sections of its own — every block here is a
// peer, top-level section, so like CPA and Digital Marketing this file's body
// walk has no grouping step. `closing` is the one exception: it always renders
// after the FAQ, per the template's own `placement` field, not wherever
// content.order happens to put it — see the note above resolveClosing.
//
// THE PIXELS come from ../../_ServiceLayout, imported not re-drawn. What THIS
// file owns is the order and the Data Entry photograph.
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
import dataEntryImage from "../../../assets/services/DataEntry.jpg";
import STRUCTURE from "./structure";

const CTASection = lazy(() => import("../../../components/homeComp/CTASection"));

// The database service string this template is registered under (see ../index.js).
export const SERVICE = "Data Entry";

// The section contract the CMS fills on upload, co-located with the layout.
export { STRUCTURE };

const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

// A closing block with neither heading nor paragraph text is a template blank.
const isFilled = (d) => {
  if (!d || typeof d !== "object") return false;
  if ([d.titleLead, d.highlight].some((t) => String(t || "").trim())) return true;
  return Array.isArray(d.paragraphs) && d.paragraphs.some((p) => String(p || "").trim());
};

// One <h1>, emitted only by <Hero>. Fall back to the row's meta / state if a
// row is ever saved with no hero copy.
function resolveHero(content, { fallbackTitle, fallbackDescription, state }) {
  const hero = asObject(content.hero);
  const hasText = [hero.titleLead, hero.highlight].some((t) => String(t || "").trim());
  if (hasText) return hero;
  return {
    ...hero,
    titleLead: fallbackTitle || "Data Entry Services in",
    highlight: state || "",
    subtitle: hero.subtitle || fallbackDescription || "",
    breadcrumb: hero.breadcrumb || (state ? `Data Entry Services in ${state}` : "Data Entry Services"),
    ctaLabel: hero.ctaLabel || "Book a free 30-minute Zoom consultation today",
  };
}

/* ── Reading the body in document order ──────────────────────────────────── */

// "cardGroups.7" -> content.cardGroups[7]; "closing" -> content.closing.
function resolveNode(content, id) {
  const m = /^([A-Za-z]+)\.(\d+)$/.exec(id);
  if (m) return content[m[1]]?.[Number(m[2])];
  return content[id];
}

// A row saved before content.order existed (or built by hand) has none. This
// reconstructs the old fixed sequence so such a row still renders in full.
function fallbackOrder(content) {
  const order = [];
  toArray(content.cardGroups).forEach((_, i) => order.push(`cardGroups.${i}`));
  return order;
}

// `hero`, `intro`, `faqs`, `faqsHeading` and `closing` are rendered by
// dedicated steps — closing always AFTER the FAQ, never at its content.order
// position — and never re-enter the generic body walk.
const SPECIAL_IDS = new Set(["hero", "intro", "faqs", "faqsHeading", "closing"]);

function bodyOrder(content) {
  const order = Array.isArray(content.order) && content.order.length
    ? content.order
    : fallbackOrder(content);
  return order.filter((id) => !SPECIAL_IDS.has(id));
}

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
  return <CardGroup key={key} data={g} />;
}

/**
 * @param {object}  content   servicelayout/v1 object from the page row
 * @param {object}  seo       row SEO, applied unless `preview`
 * @param {string}  state     the page's state, for the hero fallback only
 * @param {boolean} preview   drop site chrome + SEO (CMS save-preview)
 */
export default function DataEntryTemplate({
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
  const closing = asObject(c.closing);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", position: "relative" }}>
      {!preview && <Navbar />}

      {/* 1 — Banner. Dark band, the page's single <h1>. */}
      <Hero hero={hero} />

      {/* 2 — Intro. Copy left, Data Entry photograph right, 3 stat figures. */}
      <IntroWithImage
        data={asObject(c.intro)}
        fallbackImage={dataEntryImage}
        fallbackAlt="Data entry services"
      />

      {/* 3+ — Everything else, in the order the document wrote it. See the file
          header for why this reads content.order rather than trusting which
          key each block landed under. */}
      {bodyOrder(c).map((id, i) => renderNode(resolveNode(c, id), i))}

      {/* FAQ. Accordion. */}
      <FAQSection faqs={toArray(c.faqs)} heading={c.faqsHeading} />

      {/* "Ready to transform your financial data management services?" + CTA
          button. Always here, after the FAQ — data-entry.json's own
          `placement: "afterFaqs"` for this section, not content.order. */}
      {isFilled(closing) && <Prose data={{ ...closing, bg: closing.bg || "paper" }} />}

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

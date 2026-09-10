// ─────────────────────────────────────────────────────────────────────────────
// THE DIGITAL MARKETING SERVICE TEMPLATE
//
// Reference page (the image this reproduces):
//   https://www.miltafs.com/us/services/best-digital-marketing-agency-in-arizona/
//
//    1. Banner                 hero          dark band, one <h1>
//    2. Intro + image           intro         copy left · photo right · stat figures
//    3–N. Every other block, IN THE ORDER THE DOCUMENT WROTE THEM
//    +  The Next Step / Footer                shared site chrome
//
// NO FAQ SECTION — deliberately, for this service only. Digital Marketing
// documents have not been carrying real FAQ content (the Arizona reference
// document names an FAQ heading and supplies zero questions under it), so the
// accordion rendered as an empty "Frequently Asked Questions" band with
// nothing in it, and the heading itself has no body to show. Both are dropped
// here; `content.faqs` is still read and stored exactly as before if a
// document or an editor ever does supply real questions — reinstating the
// <FAQSection> line below is the whole of undoing this.
//
// WHY THIS DRIVES OFF content.order, NOT FIXED KEYS
//   Same reasoning as ../Tax and ../CPA (read their file headers for the full
//   case): db/templates/digital-marketing.json shapes an upload into fixed
//   KEYS by matching each document block to a template slot by heading,
//   falling back to slot KIND when no heading matches. Reading `content.order`
//   back — layoutMerge's own record of the document's real sequence — means a
//   block keeps its true position even when the document supplies a slightly
//   different shape than the template expected (this service's real Arizona
//   document, for instance, writes "Why Partner with Milta?" as icon cards
//   rather than the plain checklist `whyEssential` calls for).
//
// Digital Marketing has no numbered sub-sections of its own — every block here
// is a peer, top-level section, so like CPA this file's body walk has no
// grouping step.
//
// THE PIXELS come from ../../_ServiceLayout, imported not re-drawn. What THIS
// file owns is the order and the Digital Marketing photograph.
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
} from "../../_ServiceLayout";
import IntroWithImage from "../sections/IntroWithImage";
import digitalMarketingImage from "../../../assets/services/Digital-marketing.jpg";
import STRUCTURE from "./structure";

const CTASection = lazy(() => import("../../../components/homeComp/CTASection"));

// The database service string this template is registered under (see ../index.js).
export const SERVICE = "Digital Marketing";

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
    titleLead: fallbackTitle || "Digital Marketing Agency in",
    highlight: state || "",
    subtitle: hero.subtitle || fallbackDescription || "",
    breadcrumb: hero.breadcrumb || (state ? `Digital Marketing Agency in ${state}` : "Digital Marketing"),
    ctaLabel: hero.ctaLabel || "Request a Proposal Today",
  };
}

/* ── Reading the body in document order ──────────────────────────────────── */

// "cardGroups.7" -> content.cardGroups[7]; "whyEssential" -> content.whyEssential.
function resolveNode(content, id) {
  const m = /^([A-Za-z]+)\.(\d+)$/.exec(id);
  if (m) return content[m[1]]?.[Number(m[2])];
  return content[id];
}

// A row saved before content.order existed (or built by hand) has none. This
// reconstructs the old fixed sequence so such a row still renders in full.
function fallbackOrder(content) {
  const order = ["prose", "whyEssential"];
  toArray(content.cardGroups).forEach((_, i) => order.push(`cardGroups.${i}`));
  return order;
}

// `hero` and `intro` are rendered by dedicated steps above; `faqs` and
// `faqsHeading` are never rendered at all here (see the file header) — all
// four are excluded from the generic body walk.
const SPECIAL_IDS = new Set(["hero", "intro", "faqs", "faqsHeading"]);

// A heading that names the FAQ block itself — "Same FAQ's section", "FAQs
// About…" — with the FAQ feature removed there is nothing left for a label
// like this to introduce, so it is dropped along with the accordion rather
// than left on the page as a heading over nothing.
const isFaqLabel = (node) =>
  /\bfaq/i.test([node?.titleLead, node?.highlight].filter(Boolean).join(" "));

function bodyOrder(content) {
  const order = Array.isArray(content.order) && content.order.length
    ? content.order
    : fallbackOrder(content);
  return order.filter((id) => !SPECIAL_IDS.has(id) && !isFaqLabel(resolveNode(content, id)));
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
export default function DigitalMarketingTemplate({
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

      {/* 2 — Intro. Copy left, Digital Marketing photograph right, 3 stat figures. */}
      <IntroWithImage
        data={asObject(c.intro)}
        fallbackImage={digitalMarketingImage}
        fallbackAlt="Digital marketing agency"
      />

      {/* 3+ — Everything else, in the order the document wrote it. See the file
          header for why this reads content.order rather than trusting which
          key each block landed under. */}
      {bodyOrder(c).map((id, i) => renderNode(resolveNode(c, id), i))}

      {/* No FAQ section for this service — see the file header. */}

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

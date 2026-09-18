// ─────────────────────────────────────────────────────────────────────────────
// THE CPA SERVICE TEMPLATE
//
// Reference page (the image this reproduces, pixel for pixel):
//   https://www.miltafs.com/us/services/best-cpa-services-for-small-businesses-in-the-arizona/
//
// This is a FIXED layout, the same way ../Bookkeeping is: the section list
// below never changes — not when a different state's document is uploaded,
// not when the document is short. Every CPA page in every state is drawn by
// this one file; only the words inside each section change.
//
//    1. Banner              hero                    dark band, one <h1>
//    2. Intro + image        intro                  copy left · photo right · stat figures
//    3. Support prose        prose                  "How Can We Support Your Business?"
//    4. Why outsource        whyOutsource            prose, "Why Outsource Your CPA Services?"
//    5. Small-business svcs  smallBusinessServices   5 cards, 3 cols
//    6. Core services        coreServices            6 cards, 2 cols
//    7. Why choose Milta     whyChooseMilta          6 cards, 3 cols
//    8. Specialized services specializedServices     3 cards, 3 cols
//    9. How Milta supports   howMiltaSupports        5 cards, 3 cols
//    +  FAQ                  faqs                    accordion
//    +  The Next Step / Footer                       shared site chrome
//
// HOW CONTENT LANDS HERE
//   A document uploaded through Milta CMS is shaped by db/templates/cpa.json
//   (server/services/serviceTemplates.js + layoutMerge.js) into a `content`
//   object with exactly these keys — one per section above, same as
//   Bookkeeping's whyEssential/solutions/industries. This file reads each key
//   straight into its section, in this fixed order — no content.order, no
//   per-render sequencing. Nothing to wire per upload.
//
// UNTIL THIS FILE'S PREVIOUS REVISION, CPA's 6 middle sections shared ONE
// template key ("cardGroups"), read back here via content.order the same way
// ../Payroll used to (see that file's own header for the full case for why
// that was necessary there). CPA's actual stored pages — checked across all
// 5 live rows before this rewrite — show none of the shape mismatches
// Payroll's reference document produces: no collapsed cards, no heading that
// lands under the wrong key. So this file stays as plain as Bookkeeping's:
// fixed keys, no recovery machinery. If a future upload ever does land
// something in the wrong place, reuniteEmptySections below (a lighter
// version of what Payroll needed) catches a stray heading-only or
// items-only block left in the `cardGroups` overflow; anything else is the
// normal CMS section-editor fix, same as any other service.
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

/* ── A lighter safety net than Payroll's ─────────────────────────────────────
 *
 * CPA's real, live rows show no shape mismatches, so there is no collapsed-
 * card recovery here. What CAN still happen — the general "a document adds a
 * block the template never anticipated" case every service already handles
 * by keeping it, unlabelled, in the `cardGroups` overflow (see Bookkeeping's
 * own header) — is a heading-only or items-only stray that plainly belongs to
 * one of the 6 named sections below but missed being matched to it. Caught by
 * heading here, the same way, just without the shape-detection Payroll's
 * document specifically requires.
 */
const SECTION_EXAMPLE = {
  whyOutsource: "why outsource your", smallBusinessServices: "our cpa services for small",
  coreServices: "our core cpa services in", whyChooseMilta: "why choose milta for cpa services in",
  specializedServices: "specialized cpa services for", howMiltaSupports: "how milta supports",
};

const STOP = new Set(["the", "a", "an", "and", "of", "to", "in", "for", "on", "with", "our", "your", "we", "us", "is", "are"]);
const normaliseText = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const words = (s) => normaliseText(s).split(" ").filter((w) => w && !STOP.has(w));
const headingOf = (n) => normaliseText([n?.titleLead, n?.highlight].filter(Boolean).join(" "));
function sameHeading(example, node) {
  const a = words(example);
  const b = words(headingOf(node));
  if (!a.length || !b.length) return false;
  const setA = new Set(a);
  return b.filter((w) => setA.has(w)).length / Math.min(a.length, b.length) >= 0.66;
}

const hasRealItem = (item) => (typeof item === "string" ? item.trim().length > 0
  : !!item && (String(item.title || "").trim() || String(item.desc || "").trim() || (item.bullets || []).length));
const hasRealContent = (node) => !!node && (headingOf(node)
  || (node.items || []).some(hasRealItem) || (node.paragraphs || []).some((t) => String(t || "").trim()));

function reuniteEmptySections(rawC) {
  const out = { ...rawC };
  const overflow = toArray(out.cardGroups);
  const used = new Set();
  const emptyTargets = Object.keys(SECTION_EXAMPLE).filter((key) => !hasRealContent(out[key]));

  for (const key of emptyTargets) {
    const headingSource = overflow.findIndex((node, i) => !used.has(i) && !(node.items || []).some(hasRealItem)
      && headingOf(node) && sameHeading(SECTION_EXAMPLE[key], node));
    const itemsSource = overflow.findIndex((node, i) => !used.has(i) && i !== headingSource
      && (node.items || []).some(hasRealItem) && sameHeading(SECTION_EXAMPLE[key], node));
    if (headingSource === -1 && itemsSource === -1) continue;

    const h = headingSource !== -1 ? overflow[headingSource] : null;
    const it = itemsSource !== -1 ? overflow[itemsSource] : null;
    out[key] = {
      titleLead: h?.titleLead ?? it?.titleLead, highlight: h?.highlight ?? it?.highlight,
      subtitle: (h?.paragraphs || []).filter((t) => String(t || "").trim()).join(" ") || it?.subtitle,
      bg: it?.bg ?? h?.bg, columns: it?.columns, items: it?.items, paragraphs: it ? undefined : h?.paragraphs,
    };
    if (headingSource !== -1) used.add(headingSource);
    if (itemsSource !== -1) used.add(itemsSource);
  }

  if (used.size) out.cardGroups = overflow.filter((_, i) => !used.has(i));
  return out;
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

// Dispatch a node to the renderer its own shape calls for — the same
// shape-first dispatch Bookkeeping uses for its own `cardGroups` array,
// reused here for the small overflow list (content a document wrote that
// matched no named section — kept, never dropped).
function renderNode(node, key) {
  const g = asObject(node);
  if (Array.isArray(g.rows)) return <ComparisonTable key={key} data={g} />;
  if (Array.isArray(g.paragraphs)) return <Prose key={key} data={{ ...g, bg: g.bg || "paper" }} />;
  if (typeof g.items?.[0] === "string") return <Checklist key={key} data={g} />;
  const items = Array.isArray(g.items) ? g.items.map(stripBullets) : g.items;
  return <CardGroup key={key} data={{ ...g, items }} />;
}

function Cards({ data }) {
  const g = asObject(data);
  const items = Array.isArray(g.items) ? g.items.map(stripBullets) : g.items;
  return <CardGroup data={{ ...g, items }} />;
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

  const rawC =
    content && typeof content === "object" && !Array.isArray(content) ? content : rest;
  const c = reuniteEmptySections(rawC);

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

      {/* Content a document wrote that matched no named section below — kept,
          never dropped, the same way Bookkeeping keeps anything extra in its
          own `cardGroups` array. Empty on every page today. */}
      {toArray(c.cardGroups).map((raw, i) => renderNode(raw, `extra-${i}`))}

      {/* 3 — "How Can We Support Your Business?". */}
      <Prose data={{ ...asObject(c.prose), bg: asObject(c.prose).bg || "paper" }} />

      {/* 4 — "Why Outsource Your CPA Services?". */}
      <Prose data={{ ...asObject(c.whyOutsource), bg: asObject(c.whyOutsource).bg || "" }} />

      {/* 5 — "Our CPA Services for Small Business Include:". 5 cards, 3 cols. */}
      <Cards data={{ ...asObject(c.smallBusinessServices), columns: asObject(c.smallBusinessServices).columns || 3 }} />

      {/* 6 — "Our Core CPA Services in {state}". 6 cards, 2 cols. */}
      <Cards data={{ ...asObject(c.coreServices), columns: asObject(c.coreServices).columns || 2 }} />

      {/* 7 — "Why Choose Milta for CPA Services in {state}?". 6 cards, 3 cols. */}
      <Cards data={{ ...asObject(c.whyChooseMilta), columns: asObject(c.whyChooseMilta).columns || 3 }} />

      {/* 8 — "Specialized CPA Services for Small Businesses". 3 cards, 3 cols. */}
      <Cards data={{ ...asObject(c.specializedServices), columns: asObject(c.specializedServices).columns || 3 }} />

      {/* 9 — "How Milta Supports CPA Firms near me". 5 cards, 3 cols. */}
      <Cards data={{ ...asObject(c.howMiltaSupports), columns: asObject(c.howMiltaSupports).columns || 3 }} />

      {/* + — FAQ. */}
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

// ─────────────────────────────────────────────────────────────────────────────
// THE BOOKKEEPING SERVICE TEMPLATE
//
// Reference page (the image this reproduces, pixel for pixel):
//   https://www.miltafs.com/us/services/best-bookkeeping-services-in-delaware/
//
// This is a FIXED layout. The section list below never changes — not when a
// different state's document is uploaded, not when the document is short, not
// when its sections come in a different order. Every Bookkeeping page in every
// state is drawn by this one file; only the words inside each section change.
//
// That is the one way it differs from ../ServiceTemplateLayout, which re-orders
// sections to follow the uploaded document. Here the order is the image's order,
// full stop:
//
//    1. Banner            hero            dark band, one <h1>
//    2. Intro + image      intro          copy left · photo right · 3 stat figures
//    3. Top-Notch prose    prose          paper band, centred paragraphs
//    4. Why Every Business  whyEssential   default band, 4 check cards
//    5. Why Choose Milta    solutions      4 icon cards + closing note
//    6. Comprehensive       cardGroups     paper band, 8 cards, 2 columns
//    7. Industries We Serve industries     tag pills
//    8. FAQ                 faqs           accordion
//    +  The Next Step       CTASection     shared site chrome
//    +  Footer              Footer         shared site chrome
//
// HOW CONTENT LANDS HERE
//   A document uploaded through Milta CMS is shaped by db/templates/bookkeeping.json
//   (server/services/serviceTemplates.js + layoutMerge.js) into a `content`
//   object with exactly these keys — hero, intro, prose, whyEssential,
//   solutions, cardGroups, industries, faqs. This file reads each key straight
//   into its section. Heading → heading, intro → intro, each point → its card,
//   FAQ → FAQ. Nothing to wire per upload.
//
// THE PIXELS
//   Each section is the real design from ../../_ServiceLayout, imported not
//   re-drawn, so this page renders with the exact fonts, spacing, cards and
//   bands the live site uses. What THIS file owns is the order, the fixed band
//   under each section, and the Bookkeeping photograph.
//
// STATE NAME
//   Comes from the uploaded content (the Kentucky document says "Kentucky").
//   `state` is also accepted as a prop and used only to fill the <h1> if a row
//   is ever saved with no hero copy at all.
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
  Solutions,
  CardGroup,
  ComparisonTable,
  Industries,
  FAQSection,
} from "../../_ServiceLayout";
import IntroWithImage from "../sections/IntroWithImage";
import bookkeepingImage from "../../../assets/services/bookkeeping.jpg";
import STRUCTURE from "./structure";

const CTASection = lazy(() => import("../../../components/homeComp/CTASection"));

// The database service string this template is registered under (see ../index.js).
export const SERVICE = "Bookkeeping";

// The section contract the CMS fills on upload. Re-exported so the whole
// template — layout and structure — can be reached from this one folder.
export { STRUCTURE };

const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

// The page must emit exactly one <h1>, and <Hero> is the only thing that does.
// If a row carries no hero copy, fall back to the row's meta / state so the
// prerenderer's h1 check still passes rather than shipping an empty heading.
function resolveHero(content, { fallbackTitle, fallbackDescription, state }) {
  const hero = asObject(content.hero);
  const hasText = [hero.titleLead, hero.highlight].some((t) => String(t || "").trim());
  if (hasText) return hero;
  return {
    ...hero,
    titleLead: fallbackTitle || "Bookkeeping Services for Small Businesses in",
    highlight: state || "",
    subtitle: hero.subtitle || fallbackDescription || "",
    breadcrumb:
      hero.breadcrumb || (state ? `Bookkeeping Services in ${state}` : "Bookkeeping Services"),
    ctaLabel: hero.ctaLabel || "Contact us Today!",
  };
}

/**
 * @param {object}  content   servicelayout/v1 object from the page row
 * @param {object}  seo       row SEO, applied unless `preview`
 * @param {string}  state     the page's state, for the hero fallback only
 * @param {boolean} preview   drop site chrome + SEO (CMS save-preview)
 * @param {string}  fallbackTitle / fallbackDescription  used only for the <h1>
 */
export default function BookkeepingTemplate({
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

  // Accept `content={obj}` and the legacy `<Template hero={} intro={} />` spread.
  const c =
    content && typeof content === "object" && !Array.isArray(content) ? content : rest;

  const hero = resolveHero(c, { fallbackTitle, fallbackDescription, state });

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", position: "relative" }}>
      {!preview && <Navbar />}

      {/* 1 — Banner. Dark band, the page's single <h1>. */}
      <Hero hero={hero} />

      {/* 2 — Intro. Copy left, Bookkeeping photograph right, 3 stat figures. */}
      <IntroWithImage
        data={asObject(c.intro)}
        fallbackImage={bookkeepingImage}
        fallbackAlt="Bookkeeping services"
      />

      {/* 3 — "Top-Notch Bookkeeping Services…". Paper band, centred prose. */}
      <Prose data={{ ...asObject(c.prose), bg: "paper" }} />

      {/* 4 — "Bookkeeping Service Why Does Every Business Need It?". 4 check cards. */}
      <Checklist data={{ ...asObject(c.whyEssential), bg: "default" }} />

      {/* 5 — "Why Choose Milta for Bookkeeping Services?". 4 icon cards + note. */}
      <Solutions data={asObject(c.solutions)} />

      {/* 6 — "Comprehensive Bookkeeping and Financial Solutions". 8 cards, 2 cols,
          paper band. cardGroups is an ordered list — render every block so an
          upload can never drop copy, but the main card block is pinned to the
          image's 2-column paper design. */}
      {toArray(c.cardGroups).map((raw, i) => {
        const g = asObject(raw);
        if (Array.isArray(g.rows)) return <ComparisonTable key={i} data={g} />;
        if (Array.isArray(g.paragraphs)) return <Prose key={i} data={g} />;
        if (typeof g.items?.[0] === "string") return <Checklist key={i} data={g} />;
        return <CardGroup key={i} data={{ ...g, bg: "paper", columns: 2 }} />;
      })}

      {/* 7 — "Industries We Serve for Bookkeeping Services". Tag pills. */}
      <Industries data={asObject(c.industries)} />

      {/* 8 — "Frequently Asked Questions". Accordion. */}
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

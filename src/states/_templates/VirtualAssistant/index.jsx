// ─────────────────────────────────────────────────────────────────────────────
// THE VIRTUAL ASSISTANT SERVICE TEMPLATE
//
// Reference page (the image this reproduces):
//   https://www.miltafs.com/us/services/virtual-assistant-service-in-arizona
//
// A FIXED layout, like the other folder templates. The section list never
// re-orders with the uploaded document — every Virtual Assistant page in every
// state is drawn in this order, only the words change:
//
//    1. Banner                         hero        dark band, one <h1>
//    2. Intro + image                   intro       copy left · photo right · stat figures
//    3. The service blocks               cardGroups   the ordered run of 6:
//         • "Benefits of Virtual Assistant Services in {state}"  4 cards, 2 cols, paper
//         • "Focus on Growth, Leave the Rest to Us!"             prose + CTA, white
//         • "Our Virtual Assistant Services in {state}"          12 cards, 3 cols, paper
//         • "Why Choose Milta for Virtual Assistant Services?"   5 cards, 3 cols, white
//         • "How to Get Started"                                 4 cards, 2 cols, paper
//         • "Transform Your Business with Milta…"                prose + CTA, white
//    4. FAQ                             faqs         accordion
//    +  The Next Step / Footer           shared site chrome
//
// Virtual Assistant has no standalone `prose` section — it goes straight from
// the intro into the cardGroups run. Each cardGroups block keeps the band and
// column count db/templates/virtual-assistant.json gives it.
//
// HOW CONTENT LANDS HERE
//   An upload is shaped by db/templates/virtual-assistant.json
//   (server/services/serviceTemplates.js + layoutMerge.js) into `content` with
//   keys hero, intro, cardGroups (array), faqs. This file reads each straight
//   into its section.
//
// THE PIXELS come from ../../_ServiceLayout, imported not re-drawn. What THIS
// file owns is the order and the Virtual Assistant photograph.
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
import vaImage from "../../../assets/services/Virtual-assistance.jpg";
import STRUCTURE from "./structure";

const CTASection = lazy(() => import("../../../components/homeComp/CTASection"));

// The database service string this template is registered under (see ../index.js).
export const SERVICE = "Virtual Assistant";

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
    titleLead: fallbackTitle || "Virtual Assistant Services in",
    highlight: state || "",
    subtitle: hero.subtitle || fallbackDescription || "",
    breadcrumb:
      hero.breadcrumb || (state ? `Virtual Assistant Services in ${state}` : "Virtual Assistant Services"),
    ctaLabel: hero.ctaLabel || "Book a Free Consultation Today",
  };
}

// The ordered cardGroups list → components. Mirrors the dispatch in
// ../../_ServiceLayout: the SHAPE of a block picks its renderer, and each block
// keeps its own authored band and column count.
function renderGroup(group, i) {
  const g = asObject(group);
  if (Array.isArray(g.rows)) return <ComparisonTable key={i} data={g} />;
  if (Array.isArray(g.paragraphs)) return <Prose key={i} data={g} />;
  if (typeof g.items?.[0] === "string") return <Checklist key={i} data={g} />;
  return <CardGroup key={i} data={g} />;
}

/**
 * @param {object}  content   servicelayout/v1 object from the page row
 * @param {object}  seo       row SEO, applied unless `preview`
 * @param {string}  state     the page's state, for the hero fallback only
 * @param {boolean} preview   drop site chrome + SEO (CMS save-preview)
 */
export default function VirtualAssistantTemplate({
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

      {/* 2 — Intro. Copy left, VA photograph right, 3 stat figures. */}
      <IntroWithImage
        data={asObject(c.intro)}
        fallbackImage={vaImage}
        fallbackAlt="Virtual assistant services"
      />

      {/* 3 — The service blocks, in document order. Each keeps the band and
          column count virtual-assistant.json gave it. */}
      {toArray(c.cardGroups).map(renderGroup)}

      {/* 4 — "Frequently Asked Questions". Accordion. */}
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

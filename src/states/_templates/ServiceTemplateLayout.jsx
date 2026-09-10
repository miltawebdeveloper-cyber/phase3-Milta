// The state service-page layout. One layout, every state, every service.
//
// It renders no section itself. It resolves the row's `content` into an ordered
// plan (sections/planSections.js), looks each entry up in the registry, and walks
// the list. That is the whole difference from _ServiceLayout: there the order is
// hard-coded in JSX and every page is forced through it; here the order is data,
// so a page comes out in the sequence its source document was written in.
//
// It used to live in src/states/Delaware/ because that is where the work was
// commissioned, which read as though the layout belonged to one state. Nothing
// in it ever did. It now sits beside the eight per-service templates that use
// it — see ./index.js for the service registry, and ./<Service>.jsx for the file
// each service owns.
//
// `preview` renders the body without site chrome and without SEO, which is what
// the CMS save-preview dialog needs: useFullSEO rewrites document.title and the
// meta tags of whatever page it runs on, and inside the admin screen that is a
// side effect, not a preview.
import React, { lazy, Suspense } from "react";
import { Box, Container } from "@mui/material";
import useFullSEO from "../../utils/useFullSEO";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ScrollToTop from "../../components/ScrollToTop";
import planSections from "./sections/planSections";
import { componentFor } from "./sections/registry";

const CTASection = lazy(() => import("../../components/homeComp/CTASection"));

// Props the layout consumes itself. Anything else spread in is treated as a
// content key, so this is drop-in for call sites written against ServiceLayout's
// `<Layout hero={...} intro={...} />` shape as well as for `content={row.content}`.
const OWN_PROPS = new Set(["content", "seo", "preview", "numbered", "service", "html", "fallbackTitle", "fallbackDescription", "sections"]);

// `numbered` draws each section's position in the plan beside its eyebrow rule.
// Off by default, and the reason is content rather than taste: several pages
// number their own headings ("1. Tax Preparation Service in Delaware"), and a
// template numeral in front of that reads "01 1. Tax Preparation…". Turn it on
// for a page whose copy does not already number itself.
export default function ServiceTemplateLayout({
  content,
  seo,
  preview = false,
  numbered = false,
  // Read by the per-service templates that wrap this one; consumed here so it
  // is never mistaken for a content section.
  // eslint-disable-next-line no-unused-vars
  service,
  // Per-service section overrides: { <section type>: Component }. This is the
  // seam ./index.js promises — "a section override applied to one service
  // changes that service's pages and no others" — and Tax.jsx is the first
  // caller, because its intro is a two-column block with a photograph while
  // every other service's is the shared single-column one.
  //
  // An override receives exactly what the registry component would: `data`,
  // `band` and `index`. Omit the prop and the registry decides, which is what
  // the other seven templates do.
  sections,
  html,
  fallbackTitle = "",
  fallbackDescription = "",
  ...rest
}) {
  useFullSEO(preview ? null : seo);

  const source =
    content && typeof content === "object"
      ? content
      : Object.fromEntries(Object.entries(rest).filter(([k]) => !OWN_PROPS.has(k)));

  // Every page must emit exactly one <h1>. The prerenderer treats a page without
  // one as a build failure, and a published row can be saved with no hero at
  // all, so the title falls back to the row's meta rather than rendering
  // headless.
  const heroText = [source?.hero?.titleLead, source?.hero?.highlight].some((t) =>
    String(t || "").trim(),
  );
  const resolved = heroText
    ? source
    : {
      ...source,
      hero: {
        ...(source?.hero || {}),
        titleLead: fallbackTitle || seo?.title || "",
        highlight: "",
        subtitle: source?.hero?.subtitle || fallbackDescription || seo?.description || "",
        breadcrumb: source?.hero?.breadcrumb || (fallbackTitle || seo?.title || "").slice(0, 60),
      },
    };

  const plan = planSections(resolved);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", position: "relative" }}>
      {!preview && <Navbar />}

      {plan.map((section) => {
        const Component = sections?.[section.type] || componentFor(section.type);
        // A section type this build does not know about is skipped. Losing one
        // block is recoverable; throwing here would replace the entire route
        // with the error boundary.
        if (!Component) return null;

        return (
          <Component
            key={section.id}
            data={section.data}
            band={section.band}
            index={numbered ? section.index : null}
            // Only the FAQ renderer reads this, and it is a sibling key rather
            // than part of the section's own data.
            {...(section.type === "faqs" ? { heading: resolved.faqsHeading } : null)}
          />
        );
      })}

      {html && (
        <Box sx={{ py: { xs: 6, md: 8 } }}>
          <Container maxWidth="lg">
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </Container>
        </Box>
      )}

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

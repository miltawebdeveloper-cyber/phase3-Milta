// ─────────────────────────────────────────────────────────────────────────────
// THE TAX SERVICE TEMPLATE
//
// Reference page (the image this reproduces):
//   https://www.miltafs.com/us/services/tax-planning-and-preparation-service-in-delaware/
//
//    1. Banner                 hero          dark band, one <h1>
//    2. Intro + image           intro         copy left · photo right · stat figures
//    3–N. Every other block, IN THE ORDER THE DOCUMENT WROTE THEM
//    +  FAQ                     faqs          accordion
//    +  The Next Step / Footer                shared site chrome
//
// WHY THIS DRIVES OFF content.order, NOT FIXED KEYS
//   db/templates/tax.json shapes an upload into fixed KEYS — hero, intro,
//   prose, solutions, cardGroups[], checklists, closing, faqs — matching each
//   document block to a template slot by heading, falling back to slot KIND
//   when no heading matches (server/services/layoutMerge.js). That fallback is
//   reliable for a document whose sections line up with the reference Delaware
//   page one-for-one; it is NOT reliable for a document that structures the
//   same content differently — e.g. one whose "Miltafs Comprehensive Tax
//   Services" intro has no cards of its own (the cards sit under a separate
//   "Our Services Include:" line instead), so it can never fill the CARDS-kind
//   `solutions` slot no matter how well its heading matches. When that happens,
//   `solutions` falls back to the first available cards-kind block anywhere in
//   the document instead — visually correct copy, wrong container.
//
//   `content.order` sidesteps this entirely. It is layoutMerge's own record of
//   the document's real sequence — built by walking the document's blocks in
//   the order they were written and noting where EACH ONE landed, whichever
//   key it ended up under. Reading it back, instead of trusting `prose` to
//   always mean "the second thing" and `solutions` to always mean "the
//   fourth", means a block keeps its true position even when it was mis-keyed:
//   in the case above, `solutions` still renders right where its heading
//   appears in the document, nested under whichever numbered section it
//   actually sits inside — because that is where content.order puts it.
//
// HOW A ROW BECOMES SECTIONS HERE
//   1. Walk content.order (falling back to a fixed key sequence for a row
//      saved before `order` existed, or built by hand).
//   2. Resolve each id to its node ("cardGroups.7" -> content.cardGroups[7]).
//   3. A node whose heading opens with "1." / "2." / "3." / "4." starts a new
//      section; every node after it, of any key, nests under it as a
//      sub-block — until the next numbered node. A node before the first
//      numbered one stands on its own.
//   4. Render each sub-block by its SHAPE (paragraphs -> prose, string items ->
//      checklist, object items -> cards, rows -> table) — the same dispatch
//      ../../_ServiceLayout.ServiceLayout uses for its own ordered lists.
//
// THE PIXELS come from ../../_ServiceLayout, imported not re-drawn. What THIS
// file owns is the order, the numbered-section nesting, and the tax photo.
// ─────────────────────────────────────────────────────────────────────────────
import React, { lazy, Suspense } from "react";
import { Box, Container, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
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
import taxImage from "../../../assets/services/tax.jpg";
import STRUCTURE from "./structure";

const CTASection = lazy(() => import("../../../components/homeComp/CTASection"));

// The database service string this template is registered under (see ../index.js).
export const SERVICE = "Tax";

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
    titleLead: fallbackTitle || "Trusted Tax Preparation Services in",
    highlight: state || "",
    subtitle: hero.subtitle || fallbackDescription || "",
    breadcrumb: hero.breadcrumb || (state ? `Tax Services in ${state}` : "Tax Services"),
    ctaLabel: hero.ctaLabel || "Get Started Today with a Free Consultation",
  };
}

/* ── Reading the body in document order ──────────────────────────────────── */

// "cardGroups.7" -> content.cardGroups[7]; "prose" -> content.prose. Anything
// content.order can name resolves the same way, regardless of key shape.
function resolveNode(content, id) {
  const m = /^([A-Za-z]+)\.(\d+)$/.exec(id);
  if (m) return content[m[1]]?.[Number(m[2])];
  return content[id];
}

// A row saved before content.order existed (or built by hand) has none. This
// reconstructs the old fixed sequence so such a row still renders in full,
// rather than assuming every upload already carries a real order.
function fallbackOrder(content) {
  const order = ["prose", "solutions"];
  toArray(content.cardGroups).forEach((_, i) => order.push(`cardGroups.${i}`));
  toArray(content.checklists).forEach((_, i) => order.push(`checklists.${i}`));
  order.push("closing");
  return order;
}

// `intro`, `hero`, `faqs` and `faqsHeading` are rendered by dedicated steps
// below and never re-enter the generic body walk; `closing` keeps its own
// before/after-FAQ placement logic, so it is read separately too.
const SPECIAL_IDS = new Set(["hero", "intro", "faqs", "faqsHeading", "closing"]);

function bodyOrder(content) {
  const order = Array.isArray(content.order) && content.order.length
    ? content.order
    : fallbackOrder(content);
  return order.filter((id) => !SPECIAL_IDS.has(id));
}

// A node whose heading opens with "1." / "2)" is the numbered PARENT of a
// section; everything after it, of any key, is one of its sub-blocks — until
// the next numbered node. A node before the first numbered one stands alone.
const isNumberedParent = (node) =>
  /^\s*\d+\s*[.)]/.test(String(asObject(node).titleLead || ""));

// How many sub-blocks each numbered heading owns, per db/templates/tax.json's
// own structure: Federal/State/Local = 3 under "1.", Review/Finalization = 2
// under "2.", and so on — derived here, not hard-coded, so editing the
// template's structure keeps this in step automatically.
//
// A numbered heading always closes the group before it, however many children
// that group actually got; this cap closes a group EARLY once it has taken
// its known share. Without it, a section the document wrote as its OWN
// top-level heading — "Why Partner With Us?", landing right after "4."'s one
// expected child because content.order (correctly) does not re-key it — would
// be swept in as "4."'s sub-block just because it is not itself numbered.
const CARDGROUP_TEMPLATE = (STRUCTURE.sections || []).filter((s) => s.key === "cardGroups");
const PARENT_CHILD_COUNTS = (() => {
  const counts = [];
  let open = -1;
  for (const s of CARDGROUP_TEMPLATE) {
    if (/^\s*\d+\s*[.)]/.test(s.exampleHeading || "")) { counts.push(0); open = counts.length - 1; }
    else if (open >= 0) counts[open] += 1;
  }
  return counts;
})();

// Walk the body in document order, folding it into { parent, children } groups
// and bare { standalone } nodes — the image's visual grouping, built from
// whatever order the document actually used rather than from fixed keys.
function buildSections(content) {
  const sections = [];
  let open = null;
  let parentIndex = -1;
  for (const id of bodyOrder(content)) {
    const node = resolveNode(content, id);
    if (!node || (Array.isArray(node) ? !node.length : false)) continue;
    if (isNumberedParent(node)) {
      parentIndex += 1;
      open = { parent: node, children: [] };
      sections.push(open);
      continue;
    }
    const cap = PARENT_CHILD_COUNTS[parentIndex];
    if (open && (cap === undefined || open.children.length < cap)) {
      open.children.push(node);
    } else {
      open = null; // this group has taken its share; nothing later re-opens it
      sections.push({ standalone: node });
    }
  }
  return sections;
}

/* ── Rendering one node by its shape ─────────────────────────────────────── */
// The SHAPE of a node picks its renderer — paragraphs is prose, string items a
// checklist, object items a card grid, rows a table — the same dispatch
// ../../_ServiceLayout.ServiceLayout uses for its own ordered lists.
// `embedded` draws it nested (no band, smaller heading) inside a numbered
// section; a standalone top-level node draws with its own band and full
// section padding.
function renderNode(node, key, { embedded = false, band } = {}) {
  const g = { ...asObject(node) };
  if (band !== undefined) g.bg = band;
  if (Array.isArray(g.rows)) return <ComparisonTable key={key} data={g} />;
  if (Array.isArray(g.paragraphs)) {
    if (!embedded && !g.bg) g.bg = "paper";
    return <Prose key={key} data={g} />;
  }
  if (typeof g.items?.[0] === "string") return <Checklist key={key} data={g} embedded={embedded} />;
  return <CardGroup key={key} data={g} embedded={embedded} />;
}

// One numbered section: the large centred heading + its intro copy, then the
// parent's own cards (a numbered heading can carry cards directly, with no
// sub-title of its own), then the sub-blocks stacked tight underneath.
function NestedTaxSection({ parent, subBlocks }) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const p = asObject(parent);
  const band = p.bg === "paper" ? "background.paper" : "background.default";
  const paras = (Array.isArray(p.paragraphs) ? p.paragraphs : []).filter(
    (t) => String(t || "").trim(),
  );
  const parentCards =
    Array.isArray(p.items) && p.items.some((it) => it && typeof it === "object");
  const parentPoints =
    Array.isArray(p.items) && p.items.length > 0 && !parentCards;

  return (
    <Box component="section" sx={{ py: { xs: 8, md: 12 }, bgcolor: band }}>
      <Container maxWidth={false} sx={{ maxWidth: "1200px", mx: "auto", px: { xs: 3, md: 4 } }}>
        <Box sx={{ textAlign: "center", mb: { xs: 5, md: 7 } }}>
          {(p.titleLead || p.highlight) && (
            <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.6rem" }, lineHeight: 1.2 }}>
              {p.titleLead}{" "}
              <Box component="span" sx={{ color: primary }}>{p.highlight}</Box>
            </Typography>
          )}
          {[...paras, p.subtitle].filter(Boolean).map((text, i) => (
            <Typography
              key={i}
              sx={{
                color: "text.secondary", fontSize: "1rem", lineHeight: 1.8,
                maxWidth: 780, mx: "auto", mt: 2, fontFamily: '"Outfit", sans-serif',
              }}
            >
              {text}
            </Typography>
          ))}
        </Box>

        {(parentCards || parentPoints) && (
          <Box sx={{ mb: subBlocks.length ? { xs: 5, md: 7 } : 0 }}>
            {renderNode(
              { ...p, titleLead: "", highlight: "", subtitle: "", overline: "" },
              "parent-body",
              { embedded: true, band: p.bg },
            )}
          </Box>
        )}

        {subBlocks.length > 0 && (
          <Stack spacing={{ xs: 5, md: 7 }}>
            {subBlocks.map((child, i) => renderNode(child, i, { embedded: true, band: p.bg }))}
          </Stack>
        )}
      </Container>
    </Box>
  );
}

/**
 * @param {object}  content   servicelayout/v1 object from the page row
 * @param {object}  seo       row SEO, applied unless `preview`
 * @param {string}  state     the page's state, for the hero fallback only
 * @param {boolean} preview   drop site chrome + SEO (CMS save-preview)
 */
export default function TaxTemplate({
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
  const closingBlank = !isFilled(closing);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", position: "relative" }}>
      {!preview && <Navbar />}

      {/* 1 — Banner. Dark band, the page's single <h1>. */}
      <Hero hero={hero} />

      {/* 2 — Intro. Copy left, tax photograph right, 3 stat figures. */}
      <IntroWithImage
        data={asObject(c.intro)}
        fallbackImage={taxImage}
        fallbackAlt="Tax preparation services"
      />

      {/* 3+ — Everything else, in the order the document wrote it, folded into
          numbered sections. See the file header for why this reads
          content.order rather than trusting which key each block landed
          under. */}
      {buildSections(c).map((s, i) =>
        s.parent
          ? <NestedTaxSection key={i} parent={s.parent} subBlocks={s.children} />
          : renderNode(s.standalone, i),
      )}

      {/* "Ready to Simplify Your Taxes?" + CTA button. A closing block can ask
          to sit after the questions instead of before them. */}
      {!closingBlank && closing.placement !== "afterFaqs" && (
        <Prose data={{ ...closing, bg: closing.bg || "paper" }} />
      )}

      {/* FAQ. Accordion. */}
      <FAQSection faqs={toArray(c.faqs)} heading={c.faqsHeading} />

      {!closingBlank && closing.placement === "afterFaqs" && (
        <Prose data={{ ...closing, bg: closing.bg || "paper" }} />
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

// A closing block with neither heading nor paragraph text is a template
// blank — Prose already guards this, but checking here keeps the two
// placement branches from each independently re-deriving it.
function isFilled(d) {
  if (!d || typeof d !== "object") return false;
  if ([d.titleLead, d.highlight].some((t) => String(t || "").trim())) return true;
  return Array.isArray(d.paragraphs) && d.paragraphs.some((p) => String(p || "").trim());
}

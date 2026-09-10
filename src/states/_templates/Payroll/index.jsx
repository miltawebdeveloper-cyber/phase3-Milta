// ─────────────────────────────────────────────────────────────────────────────
// THE PAYROLL SERVICE TEMPLATE
//
// Reference page (the image this reproduces):
//   https://www.miltafs.com/us/services/payroll-management-services-in-the-arizona/
//
//    1. Banner                 hero          dark band, one <h1>
//    2. Intro + image           intro         copy left · photo right · stat figures
//    3–N. Every other block, IN THE ORDER THE DOCUMENT WROTE THEM
//    +  FAQ                     faqs          accordion
//    +  The Next Step / Footer                shared site chrome
//
// WHY THIS DRIVES OFF content.order, NOT FIXED KEYS
//   Same reasoning as ../Tax, ../CPA, ../DataEntry, ../DigitalMarketing and
//   ../FinancialController (read their file headers for the full case):
//   reading `content.order` — layoutMerge's own record of the document's real
//   sequence — means a block keeps its true position even when it lands under
//   a different KEY than its heading would suggest. That happens more than
//   once in this service's own reference document: "Payroll Management
//   Services by Milta Accounting" (no cards of its own) is the only
//   prose-shaped block left once "End-to-End Payroll Management" has already
//   claimed the template's one `prose` slot, so it wins that slot by KIND
//   instead — landing under `content.prose` despite sitting two-thirds of the
//   way down the page. `order` still records it exactly where the document
//   wrote it, which is all this file ever reads.
//
// TWO SHAPES THIS DOCUMENT NEEDS RECOVERING
//   1. A section heading followed by ONE more sub-heading and ITS OWN bullet
//      list — "What We Handle for Your Business", "Key Benefits of
//      Professional Payroll Management", "Key Benefits of Outsourcing
//      Payroll" — reads, by layoutService's general "sub-heading + list"
//      rule, as a single card whose `.bullets` holds the whole list. Right
//      for a heading illustrating one point with supporting facts; wrong
//      here, where db/templates/payroll.json expects each bullet as its own
//      checklist item or its own card (the slot counts — 5, 5, 4 — match the
//      bullet counts exactly, and the reference page draws each bullet in
//      its own box). `splitCollapsedCard` below turns that one card back
//      into the section's own intro text plus a second, embedded block
//      holding the real items — the same "big heading, then a nested
//      sub-block" shape ../Tax's NestedTaxSection already draws for its
//      numbered sections, reused here as `SplitSection`.
//   2. A heading with no cards of its own directly followed by a SECOND
//      heading that is really just a connecting label — "Payroll Management
//      Services by Milta Accounting" (a paragraph, no items) into "Our
//      Payroll Solutions Include:" (the 8 cards). The reference page draws
//      these as ONE section: the first heading and its paragraph, then the
//      eight cards directly beneath — the second heading never appears.
//      `mergeHollowWithItems` folds the pair into one node before rendering.
//
// Payroll has no numbered TOP-LEVEL sub-sections of its own — unlike Tax's
// "1. / 2. / 3. / 4." sections, every heading here is its own section — so
// this file's body walk has no numbered-parent grouping step.
//
// THE PIXELS come from ../../_ServiceLayout, imported not re-drawn. What THIS
// file owns is the order, the two shapes recovered above, and the Payroll
// photograph.
// ─────────────────────────────────────────────────────────────────────────────
import React, { lazy, Suspense } from "react";
import { Box, Container, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { resolveIcon } from "../../_iconRegistry";
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
import { isEmptySection } from "../sections/planSections";
import payrollImage from "../../../assets/services/payroll.jpg";
import STRUCTURE from "./structure";

const CTASection = lazy(() => import("../../../components/homeComp/CTASection"));

// The database service string this template is registered under (see ../index.js).
export const SERVICE = "Payroll";

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
    titleLead: fallbackTitle || "Simplify Payroll Operations with Reliable Payroll Services in",
    highlight: state || "",
    subtitle: hero.subtitle || fallbackDescription || "",
    breadcrumb: hero.breadcrumb || (state ? `Payroll Services in ${state}` : "Payroll Services"),
    ctaLabel: hero.ctaLabel || "Get Started with a Free Payroll Consultation.",
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
  order.push("closing");
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

/* ── Recovering a heading + its own list the parser folded into one card ─── */
//
// See the file header's item 1. The tell this reads for: a lone item, no
// sibling cards, and no `desc` text of its own beyond the sub-heading and its
// bullets — a genuine single card almost always carries descriptive prose
// along with (or instead of) a bullet list, so a bare title-plus-bullets item
// is the parser's placeholder for what was really a list of independent
// points, not a card in its own right.
const CARD_BULLET = /^(.{2,70}?)(?:\s+[—–]\s*|\s*[—–]\s+|\s+-\s+|:\s+)(.{8,})$/;

// "Employee Satisfaction — Timely and error-free salary payments" -> a card;
// "Employee timesheet management" (no separator) stays a plain checklist
// line. Either way nothing here invents words — a bullet that does not split
// renders exactly as written.
function splitBullet(text) {
  const m = CARD_BULLET.exec(String(text || "").trim());
  if (!m) return null;
  return { title: m[1].trim().replace(/[:\-—–]\s*$/, ""), desc: m[2].trim() };
}

function splitCollapsedCard(node) {
  const g = asObject(node);
  const items = Array.isArray(g.items) ? g.items : null;
  const only = items && items.length === 1 && items[0] && typeof items[0] === "object"
    ? items[0]
    : null;
  const bullets = only && Array.isArray(only.bullets)
    ? only.bullets.filter((b) => String(b || "").trim())
    : null;
  if (!bullets || !bullets.length || String(only.desc || "").trim()) return [g];

  const parent = {
    titleLead: g.titleLead,
    highlight: g.highlight,
    paragraphs: [g.subtitle, g.footnote].filter((t) => String(t || "").trim()),
    bg: g.bg,
  };
  const asCards = bullets.every((b) => splitBullet(b));
  const sub = {
    titleLead: only.title,
    bg: g.bg,
    columns: g.columns,
    items: asCards
      ? bullets.map((b) => ({ ...splitBullet(b), icon: only.icon || "" }))
      : bullets,
  };
  return [{ __split: true, parent, sub }];
}

/* ── Recovering two headings the document meant as one section ───────────── */
//
// See the file header's item 2. Narrow on purpose: only a heading with a
// paragraph and NO cards of its own, immediately followed by one that has
// cards and nothing of its own to say, folds — a heading that already has
// content of its own is left exactly as parsed.
function mergeHollowWithItems(nodes) {
  const out = [];
  for (let i = 0; i < nodes.length; i += 1) {
    const g = asObject(nodes[i]);
    const hasOwnItems = Array.isArray(g.items) && g.items.length > 0;
    const hasHeading = String(g.titleLead || g.highlight || "").trim();
    const hasParagraphs = Array.isArray(g.paragraphs) && g.paragraphs.some((t) => String(t || "").trim());
    const next = asObject(nodes[i + 1]);
    const nextHasItems = Array.isArray(next.items) && next.items.length > 0;

    if (hasHeading && hasParagraphs && !hasOwnItems && nextHasItems) {
      // CardGroup — the renderer the merged node is headed for, since it now
      // carries `items` — reads its intro line from `subtitle`, a single
      // string, not from `paragraphs` (that is Prose's field, and Prose
      // never looks at `items` at all: leaving `paragraphs` set here made
      // renderNode's dispatch pick Prose over CardGroup, drawing the
      // heading and intro and silently discarding all eight cards).
      out.push({
        titleLead: g.titleLead,
        highlight: g.highlight,
        subtitle: g.paragraphs.filter((t) => String(t || "").trim()).join(" "),
        bg: g.bg,
        columns: next.columns,
        items: next.items,
      });
      i += 1; // the next node's heading was only a label — never rendered
      continue;
    }
    out.push(g);
  }
  return out;
}

/* ── Rendering one node by its shape ─────────────────────────────────────── */
// The SHAPE of a node picks its renderer — paragraphs is prose, string items
// a checklist, object items a card grid, rows a table — the same dispatch
// ../../_ServiceLayout.ServiceLayout uses for its own ordered lists. A
// `__split` node (see splitCollapsedCard) draws through SplitSection instead,
// and "How Our Payroll Management System Works" draws through
// HighlightedCardGroup instead of the plain CardGroup — see its own comment.
const isHowItWorks = (g) =>
  /^how our payroll management/i.test(String(g.titleLead || "").trim());

function renderNode(node, key) {
  const g = asObject(node);
  if (g.__split) return <SplitSection key={key} parent={g.parent} sub={g.sub} />;
  if (Array.isArray(g.rows)) return <ComparisonTable key={key} data={g} />;
  if (Array.isArray(g.paragraphs)) return <Prose key={key} data={{ ...g, bg: g.bg || "paper" }} />;
  if (typeof g.items?.[0] === "string") return <Checklist key={key} data={g} />;
  if (isHowItWorks(g)) return <HighlightedCardGroup key={key} data={g} />;
  return <CardGroup key={key} data={g} />;
}

// CardGroup draws every card the same way; the reference page's "How Our
// Payroll Management System Works" does not — its last card ("Payroll Tax
// Processing & Deductions") is a deliberate callout, filled solid in the
// service's own primary colour with white text, sitting among three plain
// white cards in a 2×2 grid. Scoped to this one section only: CardGroup
// itself, and every other card group in this template or any other
// service's, is unchanged.
//
// Columns are fixed at 2, not read from `data.columns`: db/templates/
// payroll.json stores 4 for this slot (a generic column count derived for
// CardGroup's own uniform grid), but this section was never a uniform
// four-across row — it is four cards at roughly card-sized width apiece,
// two per row, which only reads correctly as 2 columns. Trusting the
// template's value here put all four cards in one row, each a quarter the
// width the reference page actually gives them.
function HighlightedCardGroup({ data }) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const items = Array.isArray(data.items) ? data.items : [];
  const cols = 2;
  const band = data.bg === "paper" ? "background.paper" : "background.default";

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: band }}>
      <Container maxWidth={false} sx={{ maxWidth: "1200px", mx: "auto", px: { xs: 3, md: 4 } }}>
        <Box sx={{ mb: { xs: 5, md: 7 }, textAlign: "center" }}>
          {(data.titleLead || data.highlight) && (
            <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.6rem" }, lineHeight: 1.2 }}>
              {data.titleLead}{" "}
              <Box component="span" sx={{ color: primary }}>{data.highlight}</Box>
            </Typography>
          )}
          {data.subtitle && (
            <Typography sx={{ color: "text.secondary", fontSize: "1rem", lineHeight: 1.8, maxWidth: 760, mx: "auto", mt: 2, fontFamily: '"Outfit", sans-serif' }}>
              {data.subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: `repeat(${cols}, 1fr)` }, gap: 3 }}>
          {items.map((item, i) => {
            const featured = i === items.length - 1;
            const Icon = resolveIcon(item.icon);
            return (
              <Box
                key={item.title || i}
                sx={{
                  p: 4,
                  borderRadius: "20px",
                  height: "100%",
                  bgcolor: featured ? primary : "background.paper",
                  border: featured
                    ? "none"
                    : (t) => `1px solid ${t.palette.mode === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
                  boxShadow: featured ? `0 20px 48px ${alpha(primary, 0.28)}` : "0 2px 10px rgba(0,0,0,0.04)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                  {Icon && (
                    <Box
                      sx={{
                        width: 44, height: 44, borderRadius: "12px",
                        bgcolor: featured ? "rgba(255,255,255,0.16)" : alpha(primary, 0.08),
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}
                    >
                      <Icon sx={{ fontSize: 22, color: featured ? "#fff" : primary }} />
                    </Box>
                  )}
                  <Typography
                    sx={{
                      fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: "1rem",
                      color: featured ? "#fff" : "text.primary", lineHeight: 1.3,
                    }}
                  >
                    {item.title}
                  </Typography>
                </Box>
                {item.desc && (
                  <Typography
                    sx={{
                      fontFamily: '"Outfit", sans-serif', fontSize: "0.9rem", lineHeight: 1.75,
                      color: featured ? "rgba(255,255,255,0.85)" : "text.secondary",
                    }}
                  >
                    {item.desc}
                  </Typography>
                )}
                {item.bullets?.length > 0 && (
                  <Box component="ul" sx={{ listStyle: "none", m: 0, mt: item.desc ? 1.25 : 0, p: 0, display: "flex", flexDirection: "column", gap: 0.75 }}>
                    {item.bullets.map((b) => (
                      <Box
                        component="li"
                        key={b}
                        sx={{
                          position: "relative", pl: 2, fontFamily: '"Outfit", sans-serif', fontSize: "0.9rem", lineHeight: 1.75,
                          color: featured ? "rgba(255,255,255,0.85)" : "text.secondary",
                          "&::before": {
                            content: '""', position: "absolute", left: 0, top: "0.62em", width: 6, height: 6, borderRadius: "50%",
                            bgcolor: featured ? "#fff" : primary,
                          },
                        }}
                      >
                        {b}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}

// One band: the recovered section's own heading and intro copy, centred, then
// the sub-heading's real items directly beneath — embedded, so it draws with
// no band or padding of its own and an h3 in place of the section's h2. The
// same shape ../Tax's NestedTaxSection draws for a numbered parent and its
// sub-blocks, simplified to the single embedded child this service needs.
function SplitSection({ parent, sub }) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const band = parent.bg === "paper" ? "background.paper" : "background.default";
  return (
    <Box component="section" sx={{ py: { xs: 8, md: 12 }, bgcolor: band }}>
      <Container maxWidth={false} sx={{ maxWidth: "1200px", mx: "auto", px: { xs: 3, md: 4 } }}>
        <Box sx={{ textAlign: "center", mb: { xs: 5, md: 7 } }}>
          {(parent.titleLead || parent.highlight) && (
            <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.6rem" }, lineHeight: 1.2 }}>
              {parent.titleLead}{" "}
              <Box component="span" sx={{ color: primary }}>{parent.highlight}</Box>
            </Typography>
          )}
          {parent.paragraphs.map((text, i) => (
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
        {typeof sub.items?.[0] === "string"
          ? <Checklist data={sub} embedded />
          : <CardGroup data={sub} embedded />}
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
export default function PayrollTemplate({
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

  const bodyNodes = mergeHollowWithItems(
    bodyOrder(c)
      .map((id) => resolveNode(c, id))
      .filter((n) => !isEmptySection(n)),
  ).flatMap(splitCollapsedCard);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", position: "relative" }}>
      {!preview && <Navbar />}

      {/* 1 — Banner. Dark band, the page's single <h1>. */}
      <Hero hero={hero} />

      {/* 2 — Intro. Copy left, Payroll photograph right, stat figures. */}
      <IntroWithImage
        data={asObject(c.intro)}
        fallbackImage={payrollImage}
        fallbackAlt="Payroll management services"
      />

      {/* 3+ — Everything else, in the order the document wrote it. See the
          file header for why this reads content.order rather than trusting
          which key each block landed under, and for what the two recovery
          passes below fix. */}
      {bodyNodes.map((node, i) => renderNode(node, i))}

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

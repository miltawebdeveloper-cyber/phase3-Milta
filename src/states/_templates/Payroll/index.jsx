// ─────────────────────────────────────────────────────────────────────────────
// THE PAYROLL SERVICE TEMPLATE
//
// Reference page (the image this reproduces, pixel for pixel):
//   https://www.miltafs.com/us/services/payroll-management-services-in-the-arizona/
//
// This is a FIXED layout, the same way ../Bookkeeping is: the section list
// below never changes — not when a different state's document is uploaded,
// not when the document is short. Every Payroll page in every state is drawn
// by this one file; only the words inside each section change.
//
//    1. Banner              hero            dark band, one <h1>
//    2. Intro + image        intro          copy left · photo right · stat figures
//    3. End-to-End prose     prose          intro paragraph for the section below
//    4. What We Handle       whatWeHandle   checklist, 5 items
//    5. How It Works         howItWorks     4 cards, one highlighted (see below)
//    6. Why Essential        whyEssential   5 cards
//    7. Why Choose           whyChoose      4 cards, 2 columns
//    8. Right Fit            rightFit       checklist, 5 items
//    9. Key Advantages       keyAdvantages  4 cards, 2 columns
//   10. Best Practices       bestPractices  checklist, 8 items, 4 columns
//   11. Data Security        dataSecurity   checklist, 5 items
//   12. Services by Milta    servicesByMilta 8 cards, 4 columns
//   13. Closing              closing        paper band, CTA
//   +   FAQ                  faqs           accordion
//   +   The Next Step / Footer               shared site chrome
//
// HOW CONTENT LANDS HERE
//   A document uploaded through Milta CMS is shaped by
//   db/templates/payroll.json (server/services/serviceTemplates.js +
//   layoutMerge.js) into a `content` object with exactly these keys — one per
//   section above, same as Bookkeeping's whyEssential/solutions/industries.
//   This file reads each key straight into its section. Nothing to wire per
//   upload.
//
// WHY THIS USED TO BE DIFFERENT (AND ISN'T ANYMORE)
//   Until this file's previous revision, Payroll's 9 middle sections all
//   shared ONE template key ("cardGroups"), and this component read
//   content.order to know which array element was which section. That was
//   needed because the reference document's own structure creates real shape
//   mismatches during the generic merge — a heading+bullets that parses as
//   one card instead of a checklist, and a heading that parses separately
//   from the cards it introduces and can end up under a different section's
//   key entirely. Every existing Payroll row was migrated once, out of band,
//   onto this fixed-key shape. normalizePayrollContent below (tested against
//   a live re-upload of the real reference document, not just the migrated
//   rows) catches and repairs the same two patterns on every render, so a
//   FUTURE re-upload that hits them is not left broken until someone opens
//   the CMS section editor by hand.
//
// THE PIXELS come from ../../_ServiceLayout, imported not re-drawn, except
// for the one section the reference image draws differently from a plain
// card grid — see HighlightedCardGroup below.
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

/* ── Normalising what a document-merge can still get wrong ──────────────────
 *
 * The one-time migration fixed every existing Payroll row, but a FUTURE
 * upload runs through the same generic merge engine (layoutMerge.js, shared
 * by every service) that produced the two quirks this file used to work
 * around with content.order. Both are recognisable from shape and heading
 * alone, so they are caught and repaired here, once, before anything renders
 * — the fixed fallback layer under the one-time fix, not a replacement for
 * it, and touching nothing outside this file.
 *
 * 1. A section can arrive as ONE card whose `.bullets` holds every real
 *    point instead of N cards/checklist items — "Why Payroll Management Is
 *    Essential" as a single narrow box instead of five aligned cards.
 * 2. A section's real heading can land in the WRONG place — typically under
 *    `prose`, or as a headless entry in the `cardGroups` overflow — while its
 *    actual N cards sit correctly under its own key but keep the wrong
 *    heading ("Our Payroll Solutions Include:" instead of "Payroll
 *    Management Services by Milta Accounting"). See this file's own history
 *    for exactly how the generic engine's heading-then-kind matching
 *    produces this. Recognised by heading, wherever it ends up, and reunited
 *    with the section it belongs to.
 */
const SECTION_KIND = {
  whatWeHandle: "checklist", howItWorks: "cards", whyEssential: "cards", whyChoose: "cards",
  rightFit: "checklist", keyAdvantages: "cards", bestPractices: "checklist", dataSecurity: "checklist",
  servicesByMilta: "cards",
};
const SECTION_EXAMPLE = {
  whatWeHandle: "what we handle for", howItWorks: "how our payroll management",
  whyEssential: "why payroll management is essential for", whyChoose: "why choose outsourced payroll",
  rightFit: "is payroll outsourcing the right fit", keyAdvantages: "key advantages of outsourced",
  bestPractices: "best practices for accurate", dataSecurity: "trusted payroll data security",
  servicesByMilta: "payroll management services by",
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

const CARD_BULLET = /^(.{2,70}?)(?:\s+[—–]\s*|\s*[—–]\s+|\s+-\s+|:\s+)(.{8,})$/;
function splitBullet(text) {
  const m = CARD_BULLET.exec(String(text || "").trim());
  if (!m) return null;
  return { title: m[1].trim().replace(/[:\-—–]\s*$/, ""), desc: m[2].trim() };
}

// Is this node the collapsed-card shape — one item whose own `.bullets`
// holds every real point — regardless of which section it landed under?
// Unlike a heading, a shape is unambiguous: no threshold, no false positive.
function collapsedBullets(node) {
  const items = Array.isArray(node?.items) ? node.items : [];
  const only = items.length === 1 && items[0] && typeof items[0] === "object" ? items[0] : null;
  const bullets = only && Array.isArray(only.bullets) ? only.bullets.filter((b) => String(b || "").trim()) : null;
  return bullets && bullets.length ? { only, bullets } : null;
}

// One collapsed card -> N real items, cards or checklist strings depending
// on what this section actually is. A no-op when the node isn't collapsed.
function expandCollapsed(node, kind) {
  const g = asObject(node);
  const c = collapsedBullets(g);
  if (!c) return g;
  if (kind === "checklist") return { ...g, items: c.bullets };
  if (!c.bullets.every((b) => splitBullet(b))) return g;
  return { ...g, items: c.bullets.map((b) => ({ ...splitBullet(b), icon: c.only.icon || g.icon || "" })) };
}

// A real item: a non-empty string, or an object with a title/desc/bullets of
// its own — not `blankSection`'s placeholder (an array of empty strings, or
// of `{icon:"",title:"",desc:""}` objects) that a target the engine never
// filled gets by default.
const hasRealItem = (item) => (typeof item === "string" ? item.trim().length > 0
  : !!item && (String(item.title || "").trim() || String(item.desc || "").trim() || (item.bullets || []).length));
const hasRealContent = (node) => !!node && (headingOf(node)
  || (node.items || []).some(hasRealItem) || (node.paragraphs || []).some((t) => String(t || "").trim()));

// The card that collapsed a heading + its own bullet list into one item is
// "cards"-shaped by then, which means the generic merge engine's kind-gated
// matching can never route its OUTER heading to the prose-shaped `prose`
// slot it actually belongs to — that slot instead gets whatever unrelated
// prose-shaped block scores best by elimination. Found by shape (wherever it
// landed: any of the 9 sections, or loose in the `cardGroups` overflow) and
// split in two: the outer heading becomes `prose`'s real content, the inner
// bullets become `whatWeHandle`'s. Whatever `prose` held before — the wrong
// block that won it by elimination — is not discarded; it is queued as its
// own stray so the next step can find where IT actually belongs.
//
// Scoped to a collapse whose OUTER heading does not already belong to the
// section it is sitting in — "Why Payroll Management Is Essential…" and "Why
// Choose Outsourced Payroll…" collapse the exact same way but are already
// correctly keyed; those are left for expandCollapsed's plain in-place fix
// below, not routed through this split.
function recoverCollapsedCard(rawC) {
  const out = { ...rawC };

  let at;
  for (const key of Object.keys(SECTION_KIND)) {
    const c = collapsedBullets(out[key]);
    if (c && !sameHeading(SECTION_EXAMPLE[key], out[key])) { at = key; break; }
  }
  let overflowIndex = -1;
  if (at === undefined) {
    overflowIndex = toArray(out.cardGroups).findIndex((n) => collapsedBullets(n));
  }
  if (at === undefined && overflowIndex === -1) return out;

  const node = at !== undefined ? out[at] : out.cardGroups[overflowIndex];
  const { only, bullets } = collapsedBullets(node);

  if (at !== undefined) delete out[at];
  else out.cardGroups = out.cardGroups.filter((_, i) => i !== overflowIndex);

  if (!hasRealContent(out.whatWeHandle)) out.whatWeHandle = { items: bullets, titleLead: only.title };

  const displaced = hasRealContent(out.prose) ? out.prose : null;
  out.prose = { titleLead: node.titleLead, highlight: node.highlight, bg: node.bg, paragraphs: [] };
  if (displaced) out.cardGroups = [...toArray(out.cardGroups), displaced];
  return out;
}

// Any named section left with no real content of its own gets whatever
// belongs to it out of the `cardGroups` overflow — its heading and its items
// looked for independently, since the engine can split what belongs together
// (a stray heading with no items, elsewhere a block of real items under a
// generic or borrowed heading) across two different overflow entries rather
// than losing either.
function reuniteStrayHeadings(rawC) {
  const out = { ...rawC };
  const overflow = toArray(out.cardGroups);
  const used = new Set();
  const emptyTargets = Object.keys(SECTION_EXAMPLE).filter((key) => !hasRealContent(out[key]));

  // Pass 1: match by heading, heading-only strays and items-bearing entries
  // scored independently against each empty target.
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
      bg: it?.bg ?? h?.bg, columns: it?.columns, items: it?.items,
    };
    if (headingSource !== -1) used.add(headingSource);
    if (itemsSource !== -1) used.add(itemsSource);
  }

  // Pass 2: elimination. A target still without real items, and an
  // items-bearing overflow entry no target claimed by heading — with only
  // one of each left, the remaining content and the remaining home are each
  // other's, whatever the overflow entry's own heading says.
  const stillEmpty = emptyTargets.filter((key) => !(out[key]?.items || []).some(hasRealItem));
  const leftoverItems = overflow.map((n, i) => ({ n, i })).filter(({ n, i }) => !used.has(i) && (n.items || []).some(hasRealItem));
  if (stillEmpty.length === 1 && leftoverItems.length === 1) {
    const key = stillEmpty[0];
    const { n, i } = leftoverItems[0];
    const existing = asObject(out[key]);
    out[key] = { ...n, titleLead: existing.titleLead ?? n.titleLead, highlight: existing.highlight ?? n.highlight };
    used.add(i);
  }

  if (used.size) out.cardGroups = overflow.filter((_, i) => !used.has(i));
  return out;
}

function normalizePayrollContent(rawC) {
  let c = recoverCollapsedCard(rawC);
  c = reuniteStrayHeadings(c);
  for (const [key, kind] of Object.entries(SECTION_KIND)) {
    if (c[key]) c[key] = expandCollapsed(c[key], kind);
  }
  return c;
}

// Dispatch a node to the renderer its own shape calls for — the same
// shape-first dispatch Bookkeeping uses for its own `cardGroups` array,
// reused here for the small overflow list below.
function renderNode(node, key) {
  const g = asObject(node);
  if (Array.isArray(g.rows)) return <ComparisonTable key={key} data={g} />;
  if (Array.isArray(g.paragraphs)) return <Prose key={key} data={{ ...g, bg: g.bg || "paper" }} />;
  if (typeof g.items?.[0] === "string") return <Checklist key={key} data={g} />;
  return <CardGroup key={key} data={g} />;
}

// "End-to-End Payroll Management You Can Rely On" and "What We Handle for
// Your Business" are one band on the reference page, not two: a centred h2 +
// intro paragraph, then a smaller h3 and the checklist directly beneath it,
// no seam between them. `prose` and `whatWeHandle` are still two separate
// template sections — a document can write to either independently — but
// they draw together here, the checklist embedded (smaller heading, no band
// of its own) the same way ../Tax nests a sub-block under a numbered parent.
function EndToEndSection({ prose, checklist }) {
  const p = asObject(prose);
  const hasHeading = p.titleLead || p.highlight;
  const hasParagraphs = (p.paragraphs || []).some((t) => String(t || "").trim());
  if (!hasHeading && !hasParagraphs && isEmptySection(checklist)) return null;

  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const bg = p.bg === "default" ? "background.default" : "background.paper";

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: bg }}>
      <Container maxWidth={false} sx={{ maxWidth: "1200px", mx: "auto", px: { xs: 3, md: 4 } }}>
        {(hasHeading || hasParagraphs) && (
          <Box sx={{ mb: { xs: 5, md: 7 }, textAlign: "center" }}>
            {hasHeading && (
              <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.6rem" }, lineHeight: 1.2 }}>
                {p.titleLead}{" "}
                <Box component="span" sx={{ color: primary }}>{p.highlight}</Box>
              </Typography>
            )}
            {(p.paragraphs || []).map((text, i) => (
              <Typography
                key={i}
                sx={{ color: "text.secondary", fontSize: "1rem", lineHeight: 1.85, maxWidth: 760, mx: "auto", mt: 2, fontFamily: '"Outfit", sans-serif' }}
              >
                {text}
              </Typography>
            ))}
          </Box>
        )}
        <Checklist data={checklist} embedded />
      </Container>
    </Box>
  );
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
// four-across row — it is four cards at roughly card-sized width apiece, two
// per row, which only reads correctly as 2 columns.
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

  const rawC =
    content && typeof content === "object" && !Array.isArray(content) ? content : rest;
  const c = normalizePayrollContent(rawC);

  const hero = resolveHero(c, { fallbackTitle, fallbackDescription, state });

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

      {/* Content a document wrote that matched no named section below — kept,
          never dropped, the same way Bookkeeping keeps anything extra in its
          own `cardGroups` array. Empty on every page today. */}
      {toArray(c.cardGroups).map((raw, i) => renderNode(raw, `extra-${i}`))}

      {/* 3+4 — "End-to-End Payroll Management You Can Rely On" and "What We
          Handle for Your Business", one band. See EndToEndSection above. */}
      <EndToEndSection prose={c.prose} checklist={c.whatWeHandle} />

      {/* 5 — "How Our Payroll Management System Works". 4 cards, one highlighted. */}
      <HighlightedCardGroup data={asObject(c.howItWorks)} />

      {/* 6 — "Why Payroll Management Is Essential for US Businesses". 5 cards. */}
      <CardGroup data={asObject(c.whyEssential)} />

      {/* 7 — "Why Choose Outsourced Payroll Management Services?". 4 cards, 2 cols. */}
      <CardGroup data={{ ...asObject(c.whyChoose), columns: asObject(c.whyChoose).columns || 2 }} />

      {/* 8 — "Is Payroll Outsourcing the Right Fit for Your Business?". Checklist. */}
      <Checklist data={asObject(c.rightFit)} />

      {/* 9 — "Key Advantages of Outsourced Payroll Management". 4 cards, 2 cols. */}
      <CardGroup data={{ ...asObject(c.keyAdvantages), columns: asObject(c.keyAdvantages).columns || 2 }} />

      {/* 10 — "Best Practices for Accurate Payroll Management". Checklist, 4 cols. */}
      <Checklist data={asObject(c.bestPractices)} />

      {/* 11 — "Trusted Payroll Data Security & Compliance". Checklist. */}
      <Checklist data={asObject(c.dataSecurity)} />

      {/* 12 — "Payroll Management Services by Milta Accounting". 8 cards, 4 cols. */}
      <CardGroup data={asObject(c.servicesByMilta)} />

      {/* 13 — "Partner with a Trusted Payroll Management Company". Closing + CTA. */}
      <Prose data={{ ...asObject(c.closing), bg: asObject(c.closing).bg || "paper" }} />

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

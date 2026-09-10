import React, { useState, lazy, Suspense } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Breadcrumbs,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { motion } from "framer-motion";
import { useTheme, alpha } from "@mui/material/styles";
import {
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
} from "@mui/icons-material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { resolveIcon } from "./_iconRegistry";
import useFullSEO from "../utils/useFullSEO";
import Navbar from "../components/Navbar";
import ScrollToTop from "../components/ScrollToTop";
import ConsultationButton from "../components/ConsultationButton";
import { useConsultation } from "../components/ConsultationModal";

import Footer from "../components/Footer";
import CurrentCrumb from '../components/CurrentCrumb';
const CTASection = lazy(() => import("../components/homeComp/CTASection"));

/* ================= MOTION ================= */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px 0px 900px 0px' },
  transition: { duration: 0.25, delay: Math.min(delay, 0.05), ease: [0.22, 1, 0.36, 1] },
});

const DARK_GRADIENT = "linear-gradient(145deg, #0d1f0e 0%, #163018 50%, #1a3d1c 100%)";

// Has this section anything to show?
//
// A page can now be given its service's full section structure before the copy
// exists — a Bookkeeping page gets whyEssential, solutions and industries whether
// or not its last document mentioned them. Without this guard those unfilled
// sections would render as empty headings and blank cards on a live page, which
// is worse than not having the section at all.
//
// A section counts as having content if it carries any heading text or a single
// non-empty entry. Once a word is typed into it, it appears.
const hasText = (v) => typeof v === "string" && v.trim() !== "";

// Presentation, not content. A template card arrives with its icon already
// chosen and everything else blank; counting the icon as content made an
// otherwise empty `solutions` section render four icons above three empty lines.
const PRESENTATION = new Set(["icon", "bg", "placement", "columns", "image", "imageAlt"]);

const entryHasText = (entry) => {
  if (typeof entry === "string") return hasText(entry);
  if (!entry || typeof entry !== "object") return false;
  return Object.entries(entry).some(([key, v]) => {
    if (PRESENTATION.has(key)) return false;
    return Array.isArray(v) ? v.some(entryHasText) : hasText(v);
  });
};

const isEmptySection = (data, ...lists) => {
  if (!data || typeof data !== "object") return true;
  const titled = [data.titleLead, data.highlight, data.overline, data.subtitle].some(hasText);
  if (titled) return false;
  return !lists.some((list) => (list || []).some(entryHasText));
};

/* ================= HERO ================= */
// `hero` is read field by field below, so an absent one threw and took the WHOLE
// route down with it — the error boundary replaced the page, not just this
// section. That is how /us/services/best-bookkeeping-services-in-california/
// came to fail the build: a published row whose content has intro, cardGroups
// and faqs but no hero.
//
// Now that every /us/services/* URL is served from the database, any row saved
// without a hero could do this, so it is guarded here rather than relied upon.
// Same reasoning as ComparisonTable: content is editable, so the template must
// survive content it did not expect.
export const Hero = ({ hero: heroProp }) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const hero = heroProp || {};

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: { xs: "auto", md: "60vh" },
        background: DARK_GRADIENT,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        pt: { xs: 14, md: 16 },
        pb: { xs: 10, md: 12 },
      }}
    >
      <Box sx={{ position: "absolute", top: "-15%", left: "-8%", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${alpha(primary, 0.35)} 0%, transparent 65%)`, pointerEvents: "none" }} />
      <Box sx={{ position: "absolute", bottom: "-20%", right: "-8%", width: 650, height: 650, borderRadius: "50%", background: `radial-gradient(circle, ${alpha(primary, 0.2)} 0%, transparent 65%)`, pointerEvents: "none" }} />
      <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: { xs: 500, md: 920 }, height: { xs: 500, md: 920 }, borderRadius: "50%", border: `1px solid ${alpha("#ffffff", 0.05)}`, pointerEvents: "none" }} />
      <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: { xs: 300, md: 580 }, height: { xs: 300, md: 580 }, borderRadius: "50%", border: `1px solid ${alpha("#ffffff", 0.04)}`, pointerEvents: "none" }} />

      <Container maxWidth={false} sx={{ maxWidth: "1300px", mx: "auto", position: "relative", zIndex: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", py: { xs: 4, md: 0 } }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <Typography
              variant="h1"
              sx={{ letterSpacing: "0.25px",
                fontSize: { xs: "2.4rem", sm: "3.5rem", md: "4rem", lg: "3.5rem" },
                color: theme.palette.primary.contrastText,
                maxWidth: { xs: "100%", md: "880px" },
                mx: "auto",
                mb: 4,
              }}
            >
              {hero.titleLead}{" "}
              <Box component="span" sx={{ color: alpha(primary, 0.95) }}>{hero.highlight}</Box>
            </Typography>
          </motion.div>

          {hero.subtitle && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
              <Typography sx={{ color: alpha("#ffffff", 0.7), fontSize: "1.05rem", lineHeight: 1.8, maxWidth: 660, mx: "auto", mb: 4, fontFamily: '"Outfit", sans-serif' }}>
                {hero.subtitle}
              </Typography>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <Breadcrumbs
              separator={<NavigateNextIcon sx={{ fontSize: 18, color: alpha("#ffffff", 0.5) }} />}
              sx={{ mb: 3, "& .MuiBreadcrumbs-ol": { justifyContent: "center" } }}
            >
              <Link href="/" sx={{ display: "flex", alignItems: "center", gap: 0.5, color: alpha("#ffffff", 0.7), textDecoration: "none", transition: "all 0.3s ease", "&:hover": { color: primary, transform: "translateY(-2px)" } }}>
                <HomeIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>Home</Typography>
              </Link>
              <CurrentCrumb variant="body2" sx={{ color: alpha("#ffffff", 0.9), fontWeight: 600, letterSpacing: "0.02em" }}>
                {hero.breadcrumb}
              </CurrentCrumb>
            </Breadcrumbs>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
            <ConsultationButton label={hero.ctaLabel} />
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
};

/* ================= INTRO ================= */
export const Intro = ({ intro }) => {
  // Intro is its own component, not one of the shared renderers, so it needed its own guard —
  // a blank template intro drew an empty <h2>. `stats` counts as content: the
  // California page carries stats and no prose, and those figures are real copy.
  if (isEmptySection(intro, intro?.paragraphs, intro?.stats)) return null;
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const { open } = useConsultation();
  const stats = intro.stats || [
    { num: "100+", label: "Clients" },
    { num: "50", label: "States" },
    { num: "10y+", label: "Experience" },
  ];

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: "background.default" }}>
      <Container maxWidth={false} sx={{ maxWidth: "900px", mx: "auto", px: { xs: 3, md: 4 } }}>
        {/* One column, not two.
         *
         * The second column held a photograph with the stat figures floating
         * over it. With the photograph gone there was nothing to fill it, and a
         * 360px card sat alone beside a tall block of prose. The copy takes the
         * full measure now and the figures sit beneath it.
         *
         * Centred, and to the same 900px measure as Prose directly below it.
         * Left-aligned it was the only section on the page that was, which read
         * as an accident rather than as emphasis. */}
        <Stack spacing={{ xs: 6, md: 6 }}>
          <Box sx={{ textAlign: "center" }}>
            <motion.div {...fadeUp(0)}>
              <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 6, color: primary, fontSize: "0.75rem", mb: 2, display: "block" }}>
                {intro.overline}
              </Typography>
            </motion.div>
            {/* Same reasoning as the section headings: the California page has an
                intro carrying only stat figures and no heading, which rendered an
                empty <h2>. */}
            {(intro.titleLead || intro.highlight) && (
              <motion.div {...fadeUp(0.1)}>
                <Typography variant="h2" sx={{ fontSize: { xs: "1.9rem", md: "2.8rem" }, lineHeight: 1.2, mb: 2.5 }}>
                  {intro.titleLead}{" "}
                  <Box component="span" sx={{ color: primary }}>{intro.highlight}</Box>
                </Typography>
              </motion.div>
            )}
            <motion.div {...fadeUp(0.18)}>
              <Box sx={{ width: 48, height: 3, borderRadius: 4, bgcolor: alpha(primary, 0.35), mb: 3, mx: "auto" }} />
              {(intro.paragraphs || []).map((p, i) => (
                <Typography key={i} sx={{ color: "text.secondary", fontSize: "1rem", lineHeight: 1.85, fontFamily: '"Outfit", sans-serif', maxWidth: 760, mx: "auto", mb: i === (intro.paragraphs || []).length - 1 ? 3 : 2 }}>
                  {p}
                </Typography>
              ))}
            </motion.div>
            <motion.div {...fadeUp(0.26)}>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={open}
                sx={{ bgcolor: primary, color: "#fff", px: 4, py: 1.4, fontWeight: 700, "&:hover": { bgcolor: "#1a4d1d" } }}
              >
                {intro.ctaLabel || "Schedule Your Free Consultation"}
              </Button>
            </motion.div>
          </Box>

          {/* The stat figures, on their own.
           *
           * They used to sit as a glass card floating over a photograph in a
           * second column. The photograph is gone: it was a stock image
           * hotlinked from unsplash.com on every page that did not name one of
           * its own, which was all of them. The figures come out of the overlay
           * and stand as a plain card, so nothing that was readable on the page
           * has been removed along with it. */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '0px 0px 900px 0px' }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: "100%", maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}
          >
            <Box
              sx={{
                borderRadius: "16px",
                border: `1px solid ${alpha(primary, 0.15)}`,
                bgcolor: "background.paper",
                p: 3,
                boxShadow: `0 16px 48px ${alpha(primary, 0.08)}`,
              }}
            >
              <Stack direction="row" spacing={3} sx={{ justifyContent: "space-around" }}>
                {stats.map(({ num, label }) => (
                  <Box key={label} textAlign="center">
                    <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 900, fontSize: "1.4rem", color: primary, lineHeight: 1 }}>{num}</Typography>
                    <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: "0.7rem", color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", mt: 0.4 }}>{label}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </motion.div>
        </Stack>
      </Container>
    </Box>
  );
};

/* ================= PROSE (titled body copy, no cards) ================= */
// For a section that is genuinely prose: a heading and a few paragraphs, with
// nothing to enumerate. Without this the only way to keep such copy was to fold
// it into <Intro>, which cost it its heading, or to force it into cards it was
// never written for.
export const Prose = ({ data }) => {
  if (isEmptySection(data, data.paragraphs)) return null;
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const bg = data.bg === "paper" ? "background.paper" : "background.default";

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: bg }}>
      <Container maxWidth={false} sx={{ maxWidth: "900px", mx: "auto", px: { xs: 3, md: 4 } }}>
        <Box sx={{ mb: { xs: 4, md: 5 }, textAlign: "center" }}>
          {data.overline && (
            <motion.div {...fadeUp(0)}>
              <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 6, color: primary, fontSize: "0.75rem", mb: 2, display: "block" }}>
                {data.overline}
              </Typography>
            </motion.div>
          )}
          <motion.div {...fadeUp(0.1)}>
            {/* A section can carry content but no heading — several extracted
                pages do — and rendering this unconditionally left an empty <h2>
                in the DOM. */}
            {(data.titleLead || data.highlight) && (
              <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.6rem" }, lineHeight: 1.2 }}>
                {data.titleLead}{" "}
                <Box component="span" sx={{ color: primary }}>{data.highlight}</Box>
              </Typography>
            )}
          </motion.div>
        </Box>
        <motion.div {...fadeUp(0.18)}>
          {(data.paragraphs || []).map((p, i) => (
            <Typography
              key={i}
              // Centred to match the heading above it. The measure is held at
              // 760px rather than the container's 900 because centred text gets
              // hard to track back to the next line much past that - the same
              // width every other centred block in this file uses.
              sx={{
                color: "text.secondary",
                fontSize: "1rem",
                lineHeight: 1.85,
                fontFamily: '"Outfit", sans-serif',
                textAlign: "center",
                maxWidth: 760,
                mx: "auto",
                mb: i === (data.paragraphs || []).length - 1 ? 0 : 2.5,
              }}
            >
              {p}
            </Typography>
          ))}
        </motion.div>
        {/* A section that asks the reader to act needs something to act on.
            Without this a "Contact Us Today" or "Book Your Free Consultation"
            block rendered as nothing but centred text — the instruction was
            there, the button was not. */}
        {data.ctaLabel && (
          <Box sx={{ mt: { xs: 4, md: 5 }, textAlign: "center" }}>
            <motion.div {...fadeUp(0.26)}>
              <ConsultationButton label={data.ctaLabel} />
            </motion.div>
          </Box>
        )}
      </Container>
    </Box>
  );
};

/* Closing paragraph a section can sign off with, under its cards. */
export const SectionNote = ({ text }) =>
  !text ? null : (
    <motion.div {...fadeUp(0.1)}>
      <Typography
        sx={{ color: "text.secondary", fontSize: "1rem", lineHeight: 1.85, maxWidth: 860, mx: "auto", mt: { xs: 4, md: 6 }, textAlign: "center", fontFamily: '"Outfit", sans-serif' }}
      >
        {text}
      </Typography>
    </motion.div>
  );

/* ================= CHECKLIST (short-label cards) ================= */
// `embedded` renders the block WITHOUT its own band or section padding and with
// a smaller (h3) heading, so a page can nest it under a larger section header —
// the Tax page groups "Local Tax Expertise" and friends under "1. Tax
// Preparation Service in {state}" that way. Off by default: every other caller
// gets the full standalone section exactly as before.
export const Checklist = ({ data, embedded = false }) => {
  if (isEmptySection(data, data.items)) return null;
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const bg = data.bg === "default" ? "background.default" : "background.paper";
  const cardBg = data.bg === "default" ? "background.paper" : "background.default";
  const cols = data.columns || Math.min((data.items || []).length, 4);

  const inner = (
    <>
      <Box sx={{ mb: embedded ? { xs: 3, md: 3.5 } : { xs: 6, md: 8 }, textAlign: "center" }}>
        {/* An omitted overline still gets the stock label, which several
            Bookkeeping pages rely on. `overline: ""` is the way to say the
            section wants its heading alone, with no label above it — so the
            two cases have to stay distinguishable (?? not ||). A nested block
            never gets the stock label. */}
        {!embedded && (data.overline ?? "WHY IT MATTERS") !== "" && (
          <motion.div {...fadeUp(0)}>
            <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 6, color: primary, fontSize: "0.75rem", mb: 2, display: "block" }}>
              {data.overline ?? "WHY IT MATTERS"}
            </Typography>
          </motion.div>
        )}
        <motion.div {...fadeUp(0.1)}>
          {/* A section can carry content but no heading — several extracted
              pages do — and rendering this unconditionally left an empty <h2>
              in the DOM. */}
          {(data.titleLead || data.highlight) && (
            <Typography
              variant={embedded ? "h3" : "h2"}
              sx={embedded
                ? { fontSize: { xs: "1.35rem", md: "1.7rem" }, fontWeight: 800, lineHeight: 1.25 }
                : { fontSize: { xs: "2rem", md: "2.8rem" }, lineHeight: 1.2 }}
            >
              {data.titleLead}{" "}
              <Box component="span" sx={{ color: primary }}>{data.highlight}</Box>
            </Typography>
          )}
        </motion.div>
        {data.subtitle && (
          <motion.div {...fadeUp(0.18)}>
            <Typography sx={{ color: "text.secondary", fontSize: "1rem", lineHeight: 1.8, maxWidth: 760, mx: "auto", mt: 2, fontFamily: '"Outfit", sans-serif' }}>
              {data.subtitle}
            </Typography>
          </motion.div>
        )}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: `repeat(${cols}, 1fr)` }, gap: 2.5 }}>
        {(data.items || []).map((text, i) => (
          <Box
            key={text}
            component={motion.div}
            {...fadeUp(i * 0.08)}
            sx={{
              p: 3.5,
              borderRadius: "20px",
              height: "100%",
              bgcolor: cardBg,
              borderLeft: `4px solid ${primary}`,
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
              "&:hover": { transform: "translateY(-8px)", boxShadow: `0 20px 48px ${alpha(primary, 0.12)}` },
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 26, color: primary, mb: 1.5 }} />
            <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: "0.98rem", lineHeight: 1.5, color: "text.primary" }}>
              {text}
            </Typography>
          </Box>
        ))}
      </Box>

      <SectionNote text={data.footnote} />
    </>
  );

  if (embedded) return <Box>{inner}</Box>;

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: bg }}>
      <Container maxWidth={false} sx={{ maxWidth: "1200px", mx: "auto", px: { xs: 3, md: 4 } }}>
        {inner}
      </Container>
    </Box>
  );
};

/* ================= SOLUTIONS ================= */
export const Solutions = ({ data }) => {
  if (isEmptySection(data, data.items)) return null;
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: "background.default", overflow: "hidden", position: "relative" }}>
      <Box sx={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: `radial-gradient(circle, ${alpha(primary, 0.05)} 1.5px, transparent 1.5px)`, backgroundSize: "28px 28px" }} />

      <Container maxWidth={false} sx={{ maxWidth: "1200px", mx: "auto", px: { xs: 3, md: 4 }, position: "relative", zIndex: 1 }}>
        <Box sx={{ mb: { xs: 6, md: 8 }, textAlign: "center" }}>
          <motion.div {...fadeUp(0)}>
            <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 6, color: primary, fontSize: "0.75rem", mb: 2, display: "block" }}>
              {data.overline || "END-TO-END SOLUTIONS"}
            </Typography>
          </motion.div>
          <motion.div {...fadeUp(0.1)}>
            {/* A section can carry content but no heading — several extracted
                pages do — and rendering this unconditionally left an empty <h2>
                in the DOM. */}
            {(data.titleLead || data.highlight) && (
              <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "3rem" }, lineHeight: 1.2 }}>
                {data.titleLead}{" "}
                <Box component="span" sx={{ color: primary }}>{data.highlight}</Box>
              </Typography>
            )}
          </motion.div>
          {data.subtitle && (
            <motion.div {...fadeUp(0.18)}>
              <Typography sx={{ color: "text.secondary", fontSize: "1rem", lineHeight: 1.8, maxWidth: 620, mx: "auto", mt: 2, fontFamily: '"Outfit", sans-serif' }}>
                {data.subtitle}
              </Typography>
            </motion.div>
          )}
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2.5 }}>
          {(data.items || []).map((svc, i) => {
            // resolveIcon, not the raw value. The hand-written pages passed an icon
            // COMPONENT; every CMS row stores its NAME. Using the value directly
            // rendered <businessicon> — an unknown element that draws nothing —
            // so every card on every database-backed page had an empty icon box.
            const Icon = resolveIcon(svc.icon);
            return (
              <Box
                key={svc.title}
                component={motion.div}
                {...fadeUp(i * 0.07)}
                sx={{
                  p: 3.5,
                  borderRadius: "20px",
                  height: "100%",
                  bgcolor: "background.paper",
                  border: (t) => `1px solid ${t.palette.mode === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "default",
                  transition: "all 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    bgcolor: alpha(primary, 0.03),
                    border: `1px solid ${alpha(primary, 0.3)}`,
                    boxShadow: `0 24px 56px ${alpha(primary, 0.13)}, 0 4px 16px rgba(0,0,0,0.06)`,
                    "& .sweep-bar": { width: "100%" },
                    "& .icon-wrap": { bgcolor: primary, border: `1px solid ${primary}`, boxShadow: `0 8px 20px ${alpha(primary, 0.35)}`, transform: "scale(1.08)" },
                    "& .icon-svg": { color: "#ffffff" },
                    "& .card-title": { color: primary },
                    "& .card-num": { opacity: 1 },
                  },
                }}
              >
                <Box className="sweep-bar" sx={{ position: "absolute", top: 0, left: 0, height: "3px", width: 0, background: `linear-gradient(90deg, ${primary}, ${alpha(primary, 0.5)})`, borderRadius: "0 0 3px 0", transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                <Typography className="card-num" sx={{ position: "absolute", bottom: 10, right: 14, fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 900, fontSize: "3.8rem", lineHeight: 1, color: alpha(primary, 0.07), userSelect: "none", pointerEvents: "none", opacity: 0, transition: "opacity 0.32s ease" }}>
                  {String(i + 1).padStart(2, "0")}
                </Typography>
                {Icon && (
                  <Box className="icon-wrap" sx={{ width: 52, height: 52, borderRadius: "14px", bgcolor: alpha(primary, 0.08), border: `1px solid ${alpha(primary, 0.15)}`, display: "flex", alignItems: "center", justifyContent: "center", mb: 2.5, flexShrink: 0, transition: "all 0.32s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                    <Icon className="icon-svg" sx={{ fontSize: 24, color: primary, transition: "color 0.32s ease" }} />
                  </Box>
                )}
                <Typography className="card-title" sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: "0.95rem", color: "text.primary", mb: 1, lineHeight: 1.35, transition: "color 0.28s ease" }}>
                  {svc.title}
                </Typography>
                {svc.desc && (
                  <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: "0.84rem", lineHeight: 1.72, color: "text.secondary", pr: 2 }}>
                    {svc.desc}
                  </Typography>
                )}
                {/* Same contract as CardGroup: a source document that gives a
                    card several separate points keeps them as a list instead of
                    running them into one sentence. */}
                {svc.bullets?.length > 0 && (
                  <Box
                    component="ul"
                    sx={{
                      listStyle: "none",
                      m: 0,
                      mt: svc.desc ? 1.25 : 0,
                      p: 0,
                      pr: 2,
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.7,
                    }}
                  >
                    {(svc.bullets || []).map((b) => (
                      <Box
                        component="li"
                        key={b}
                        sx={{
                          position: "relative",
                          pl: 1.9,
                          fontFamily: '"Outfit", sans-serif',
                          fontSize: "0.84rem",
                          lineHeight: 1.72,
                          color: "text.secondary",
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            left: 0,
                            top: "0.6em",
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            bgcolor: primary,
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

        <SectionNote text={data.footnote} />
      </Container>
    </Box>
  );
};

/* ================= ADVANTAGES ================= */
export const Advantages = ({ data }) => {
  if (isEmptySection(data, data.items, data.panelStats)) return null;
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const { open } = useConsultation();

  return (
    <Box sx={{ py: { xs: 8, md: 14 }, bgcolor: "background.paper", overflow: "hidden", position: "relative" }}>
      <Container maxWidth={false} sx={{ maxWidth: "1300px", mx: "auto", px: { xs: 3, md: 4 } }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: { xs: 6, lg: 5 }, alignItems: "stretch" }}>
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '0px 0px 900px 0px' }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ flex: "0 0 360px", display: "flex" }}
          >
            <Box sx={{ width: "100%", minHeight: { xs: "auto", lg: 500 }, background: DARK_GRADIENT, borderRadius: "24px", p: { xs: 4, md: 5 }, display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden", position: "relative" }}>
              <Box sx={{ position: "absolute", top: "-20%", right: "-15%", width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle, ${alpha(primary, 0.35)} 0%, transparent 65%)`, pointerEvents: "none" }} />
              <Box sx={{ position: "absolute", bottom: "-25%", left: "-15%", width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle, ${alpha(primary, 0.2)} 0%, transparent 65%)`, pointerEvents: "none" }} />
              <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 460, height: 460, borderRadius: "50%", border: `1px solid ${alpha("#ffffff", 0.05)}`, pointerEvents: "none" }} />

              <Box sx={{ position: "relative", zIndex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                  <Box sx={{ width: 24, height: 3, borderRadius: 2, bgcolor: primary }} />
                  <Typography variant="overline" sx={{ color: primary, fontWeight: 800, letterSpacing: "0.16em", fontSize: "0.72rem" }}>
                    THE ADVANTAGES
                  </Typography>
                </Box>
                {/* A section can carry content but no heading — several extracted
                    pages do — and rendering this unconditionally left an empty <h2>
                    in the DOM. */}
                {(data.titleLead || data.highlight) && (
                  <Typography variant="h2" sx={{ color: "#ffffff", fontSize: { xs: "1.75rem", md: "2.1rem" }, fontWeight: 900, lineHeight: 1.2, letterSpacing: "-0.02em", mb: 2.5 }}>
                    {data.titleLead}{" "}
                    <Box component="span" sx={{ color: alpha(primary, 0.9) }}>{data.highlight}</Box>{data.titleTail ? ` ${data.titleTail}` : ""}
                  </Typography>
                )}
                <Typography sx={{ color: alpha("#ffffff", 0.68), fontSize: "0.9rem", lineHeight: 1.8, mb: 4, fontFamily: '"Outfit", sans-serif' }}>
                  {data.intro}
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 4 }}>
                  {(data.panelStats || []).map((stat) => (
                    <Box key={stat.label} sx={{ px: 2, py: 1.5, borderRadius: "12px", bgcolor: alpha("#ffffff", 0.07), border: `1px solid ${alpha("#ffffff", 0.1)}` }}>
                      <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "1.3rem", fontFamily: '"Plus Jakarta Sans", sans-serif', lineHeight: 1 }}>{stat.num}</Typography>
                      <Typography sx={{ color: alpha("#fff", 0.55), fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", mt: 0.5 }}>{stat.label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box sx={{ position: "relative", zIndex: 1 }}>
                <Button
                  variant="contained"
                  onClick={open}
                  endIcon={<ArrowForwardIcon sx={{ fontSize: "1rem !important" }} />}
                  sx={{ px: 3.5, py: 1.4, borderRadius: "50px", bgcolor: primary, color: "#fff", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.06em", boxShadow: `0 10px 28px ${alpha(primary, 0.4)}`, "&:hover": { bgcolor: "#1a4d1d", boxShadow: `0 16px 38px ${alpha(primary, 0.5)}` } }}
                >
                  GET STARTED
                </Button>
              </Box>
            </Box>
          </motion.div>

          <Stack sx={{ flex: 1 }} spacing={2.5}>
            {(data.items || []).map((adv, i) => {
              const Icon = resolveIcon(adv.icon);
              return (
                <motion.div key={adv.title} {...fadeUp(i * 0.09)}>
                  <Box sx={{ p: { xs: 3, md: 3.5 }, borderRadius: "20px", bgcolor: "background.default", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 3, position: "relative", overflow: "hidden", transition: "all 0.28s cubic-bezier(0.4,0,0.2,1)", "&:hover": { transform: "translateX(8px)", boxShadow: `0 12px 40px ${alpha(primary, 0.12)}`, border: `1px solid ${alpha(primary, 0.25)}`, "& .adv-accent": { opacity: 1, height: "65%" } } }}>
                    <Box className="adv-accent" sx={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 4, height: "35%", borderRadius: "0 4px 4px 0", bgcolor: primary, opacity: 0, transition: "0.28s ease" }} />
                    {Icon && (
                      <Box sx={{ width: 54, height: 54, flexShrink: 0, borderRadius: "16px", bgcolor: alpha(primary, 0.08), border: `1px solid ${alpha(primary, 0.15)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon sx={{ fontSize: 26, color: primary }} />
                      </Box>
                    )}
                    <Box sx={{ flex: 1, pr: { xs: 1, md: 4 } }}>
                      <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: "1.05rem", color: "text.primary", mb: 0.5, lineHeight: 1.3 }}>
                        {adv.title}
                      </Typography>
                      <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: "0.88rem", lineHeight: 1.75, color: "text.secondary" }}>
                        {adv.desc}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              );
            })}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

/* ================= CARD GROUP (generic title/desc grid) ================= */
// `embedded` — see the note on <Checklist>. Renders with no band or section
// padding and an h3 heading, so the Tax page can nest a card block under a
// larger numbered section header. Off by default; every other caller is
// unchanged.
export const CardGroup = ({ data, embedded = false }) => {
  if (isEmptySection(data, data.items)) return null;
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const cols = data.columns || ((data.items || []).length % 3 === 0 ? 3 : 2);
  const bg = data.bg === "paper" ? "background.paper" : "background.default";
  const cardBg = data.bg === "paper" ? "background.default" : "background.paper";

  const inner = (
    <>
        <Box sx={{ mb: embedded ? { xs: 3, md: 3.5 } : { xs: 5, md: 7 }, textAlign: "center" }}>
          {!embedded && data.overline && (
            <motion.div {...fadeUp(0)}>
              <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 6, color: primary, fontSize: "0.75rem", mb: 2, display: "block" }}>
                {data.overline}
              </Typography>
            </motion.div>
          )}
          <motion.div {...fadeUp(0.1)}>
            {/* A section can carry content but no heading — several extracted
                pages do — and rendering this unconditionally left an empty <h2>
                in the DOM. */}
            {(data.titleLead || data.highlight) && (
              <Typography
                variant={embedded ? "h3" : "h2"}
                sx={embedded
                  ? { fontSize: { xs: "1.35rem", md: "1.7rem" }, fontWeight: 800, lineHeight: 1.25 }
                  : { fontSize: { xs: "2rem", md: "2.6rem" }, lineHeight: 1.2 }}
              >
                {data.titleLead}{" "}
                <Box component="span" sx={{ color: primary }}>{data.highlight}</Box>
              </Typography>
            )}
          </motion.div>
          {data.subtitle && (
            <motion.div {...fadeUp(0.18)}>
              <Typography sx={{ color: "text.secondary", fontSize: "1rem", lineHeight: 1.8, maxWidth: 760, mx: "auto", mt: 2, fontFamily: '"Outfit", sans-serif' }}>
                {data.subtitle}
              </Typography>
            </motion.div>
          )}
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: `repeat(${cols}, 1fr)` }, gap: 3 }}>
          {(data.items || []).map((item, i) => {
            const Icon = resolveIcon(item.icon);
            return (
              <Box
                key={item.title}
                component={motion.div}
                {...fadeUp(i * 0.07)}
                sx={{
                  p: 4,
                  borderRadius: "20px",
                  height: "100%",
                  bgcolor: cardBg,
                  border: (t) => `1px solid ${t.palette.mode === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    bgcolor: alpha(primary, 0.03),
                    border: `1px solid ${alpha(primary, 0.3)}`,
                    boxShadow: `0 20px 48px ${alpha(primary, 0.12)}`,
                    "& .cg-title": { color: primary },
                    "& .cg-icon-wrap": { bgcolor: primary },
                    "& .cg-icon": { color: "#fff" },
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                  {Icon ? (
                    <Box className="cg-icon-wrap" sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: alpha(primary, 0.08), border: `1px solid ${alpha(primary, 0.15)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s ease" }}>
                      <Icon className="cg-icon" sx={{ fontSize: 22, color: primary, transition: "color 0.3s ease" }} />
                    </Box>
                  ) : (
                    <Box sx={{ width: 30, height: 30, borderRadius: "9px", bgcolor: alpha(primary, 0.1), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 900, fontSize: "0.85rem", color: primary }}>{i + 1}</Typography>
                    </Box>
                  )}
                  <Typography className="cg-title" sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: "1rem", color: "text.primary", lineHeight: 1.3, transition: "color 0.28s ease" }}>
                    {item.title}
                  </Typography>
                </Box>
                {item.desc && (
                  <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: "0.9rem", lineHeight: 1.75, color: "text.secondary" }}>
                    {item.desc}
                  </Typography>
                )}
                {/* Source documents often give a card several separate points
                    rather than one sentence. Running them together loses the
                    list, so `bullets` renders them as one. A card may use
                    `desc`, `bullets`, or a lead-in `desc` followed by both. */}
                {item.bullets?.length > 0 && (
                  <Box
                    component="ul"
                    sx={{
                      listStyle: "none",
                      m: 0,
                      mt: item.desc ? 1.25 : 0,
                      p: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.75,
                    }}
                  >
                    {(item.bullets || []).map((b) => (
                      <Box
                        component="li"
                        key={b}
                        sx={{
                          position: "relative",
                          pl: 2,
                          fontFamily: '"Outfit", sans-serif',
                          fontSize: "0.9rem",
                          lineHeight: 1.75,
                          color: "text.secondary",
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            left: 0,
                            top: "0.62em",
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            bgcolor: primary,
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

        <SectionNote text={data.footnote} />
    </>
  );

  if (embedded) return <Box>{inner}</Box>;

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: bg }}>
      <Container maxWidth={false} sx={{ maxWidth: "1200px", mx: "auto", px: { xs: 3, md: 4 } }}>
        {inner}
      </Container>
    </Box>
  );
};

/* ================= COMPARISON TABLE ================= */
export const ComparisonTable = ({ data }) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  // Two shapes reach here. The refactored state pages pass the contract
  // directly - headers: [...] and rows: [{ label, marks: [...] }]. A row
  // extracted from a StatePageKit page carries the kit prop names instead:
  // head, and rows as flat arrays whose first cell is the label.
  //
  // Normalising here rather than at each caller means no stored row can white-
  // screen a page. An unguarded data.headers.map() did exactly that to the
  // California financial controller page: the whole route rendered as the
  // error boundary, not just a missing table.
  const headers = data.headers || data.head || [];
  const rows = (data.rows || []).map((row) =>
    Array.isArray(row)
      ? { label: row[0], marks: row.slice(1) }
      : { label: row?.label, marks: row?.marks || [] },
  );

  // A tick is any non-empty cell; the kit writes an emoji, the contract writes
  // true, and both are truthy. An empty cell is the absence of the capability.
  const ticked = (mark) => (typeof mark === "string" ? mark.trim() !== "" : !!mark);

  // Nothing renderable. Drop the section rather than emit an empty table.
  if (!headers.length || !rows.length) return null;

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: "background.default" }}>
      <Container maxWidth={false} sx={{ maxWidth: "1000px", mx: "auto", px: { xs: 3, md: 4 } }}>
        <Box sx={{ mb: { xs: 5, md: 7 }, textAlign: "center" }}>
          {data.overline && (
            <motion.div {...fadeUp(0)}>
              <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 6, color: primary, fontSize: "0.75rem", mb: 2, display: "block" }}>
                {data.overline}
              </Typography>
            </motion.div>
          )}
          <motion.div {...fadeUp(0.1)}>
            {/* A section can carry content but no heading — several extracted
                pages do — and rendering this unconditionally left an empty <h2>
                in the DOM. */}
            {(data.titleLead || data.highlight) && (
              <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.6rem" }, lineHeight: 1.2 }}>
                {data.titleLead}{" "}
                <Box component="span" sx={{ color: primary }}>{data.highlight}</Box>
              </Typography>
            )}
          </motion.div>
          {/* Every other section renders its subtitle; this one did not, so a
              table's lead-in sentence was the one piece of section copy the
              template silently dropped. */}
          {data.subtitle && (
            <motion.div {...fadeUp(0.18)}>
              <Typography sx={{ color: "text.secondary", fontSize: "1rem", lineHeight: 1.8, maxWidth: 760, mx: "auto", mt: 2, fontFamily: '"Outfit", sans-serif' }}>
                {data.subtitle}
              </Typography>
            </motion.div>
          )}
        </Box>

        <motion.div {...fadeUp(0.16)}>
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "20px", overflow: "hidden", border: (t) => `1px solid ${t.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`, boxShadow: "0 8px 30px rgba(0,0,0,0.05)" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: DARK_GRADIENT }}>
                  {headers.map((h, i) => (
                    <TableCell key={h} align={i === 0 ? "left" : "center"} sx={{ color: "#fff", fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: { xs: "0.85rem", md: "0.95rem" }, borderBottom: "none" }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, ri) => (
                  <TableRow key={row.label} sx={{ bgcolor: ri % 2 ? alpha(primary, 0.03) : "transparent", "&:hover": { bgcolor: alpha(primary, 0.06) } }}>
                    <TableCell sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 600, color: "text.primary", fontSize: { xs: "0.85rem", md: "0.92rem" }, borderColor: (t) => (t.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)") }}>
                      {row.label}
                    </TableCell>
                    {(row.marks || []).map((mark, mi) => (
                      <TableCell key={mi} align="center" sx={{ borderColor: (t) => (t.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)") }}>
                        {ticked(mark) ? (
                          <CheckCircleIcon sx={{ fontSize: 22, color: primary }} />
                        ) : (
                          <Box component="span" sx={{ color: "text.secondary", opacity: 0.4 }}>—</Box>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </motion.div>
      </Container>
    </Box>
  );
};

/* ================= INDUSTRIES ================= */
export const Industries = ({ data }) => {
  if (isEmptySection(data, data.items)) return null;
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: "background.default" }}>
      <Container maxWidth={false} sx={{ maxWidth: "1200px", mx: "auto", px: { xs: 3, md: 4 } }}>
        <Box sx={{ mb: { xs: 6, md: 8 }, textAlign: "center" }}>
          <motion.div {...fadeUp(0)}>
            <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 6, color: primary, fontSize: "0.75rem", mb: 2, display: "block" }}>
              {data.overline || "WHO WE SERVE"}
            </Typography>
          </motion.div>
          <motion.div {...fadeUp(0.1)}>
            {/* A section can carry content but no heading — several extracted
                pages do — and rendering this unconditionally left an empty <h2>
                in the DOM. */}
            {(data.titleLead || data.highlight) && (
              <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.8rem" }, lineHeight: 1.2 }}>
                {data.titleLead}{" "}
                <Box component="span" sx={{ color: primary }}>{data.highlight}</Box>
              </Typography>
            )}
          </motion.div>
          {data.subtitle && (
            <motion.div {...fadeUp(0.18)}>
              <Typography sx={{ color: "text.secondary", fontSize: "1rem", lineHeight: 1.8, maxWidth: 760, mx: "auto", mt: 2, fontFamily: '"Outfit", sans-serif' }}>
                {data.subtitle}
              </Typography>
            </motion.div>
          )}
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1.5 }}>
          {(data.items || []).map((industry, i) => (
            <Box
              key={industry}
              component={motion.div}
              {...fadeUp(i * 0.04)}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: "50px",
                bgcolor: "background.paper",
                border: `1px solid ${alpha(primary, 0.15)}`,
                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                "&:hover": { bgcolor: alpha(primary, 0.06), border: `1px solid ${alpha(primary, 0.35)}`, transform: "translateY(-4px)" },
              }}
            >
              <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: "0.9rem", color: "text.primary" }}>
                {industry}
              </Typography>
            </Box>
          ))}
        </Box>

        <SectionNote text={data.footnote} />
      </Container>
    </Box>
  );
};

/* ================= FAQ ================= */

// One FAQ answer, rendered EXACTLY as the document structured it.
//
// `faq.a` is a string that carries the document's own line breaks. The rule the
// user asked for: a paragraph stays a paragraph, a list of points stays a list
// of points, and nothing is reformatted into a shape the document did not use.
//
//   "- x" / "* x" / "• x" line   →  a bullet in a <ul>
//   "1. x" / "2) x" line         →  an item in a numbered list
//   a short line ending ":"      →  a label above the list it introduces
//   blank line                    →  a paragraph break
//   anything with none of these   →  ONE paragraph, byte for byte what it was
//
// The last case is the common one and is deliberately identical to the old
// single <Typography> render, so no existing page moves.
const FAQ_ANSWER_SX = {
  fontFamily: '"Outfit", sans-serif',
  fontSize: "0.92rem",
  lineHeight: 1.8,
  color: "text.secondary",
  whiteSpace: "pre-line",
};

const FAQ_BULLET_RE = /^[-*•·]\s+(.*\S)\s*$/;
const FAQ_NUM_RE = /^(\d{1,2})[.)]\s+(.*\S)\s*$/;

export const FaqAnswer = ({ text }) => {
  const raw = String(text ?? "");
  if (!raw.trim()) return null;

  const lines = raw.split("\n");
  const structured = lines.some(
    (l) => l.trim() === "" || FAQ_BULLET_RE.test(l.trim()) || FAQ_NUM_RE.test(l.trim()),
  );

  // No markers → the document wrote one paragraph. Render exactly that.
  if (!structured) return <Typography sx={FAQ_ANSWER_SX}>{raw}</Typography>;

  const blocks = [];
  let para = [];
  const flushPara = () => {
    if (para.length) {
      blocks.push({ t: "p", text: para.join("\n") });
      para = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === "") { flushPara(); continue; }

    const bullet = FAQ_BULLET_RE.exec(line);
    const numbered = !bullet && FAQ_NUM_RE.exec(line);

    if (bullet) {
      // Flush FIRST — a pending label line ("Income Information:") has to land
      // as its own block before this bullet, or it is orphaned after the list
      // and the bullet joins the wrong group.
      flushPara();
      const last = blocks[blocks.length - 1];
      if (last?.t === "ul") last.items.push(bullet[1]);
      else blocks.push({ t: "ul", items: [bullet[1]] });
      continue;
    }
    if (numbered) {
      flushPara();
      const last = blocks[blocks.length - 1];
      if (last?.t === "ol") last.items.push(numbered[2]);
      else blocks.push({ t: "ol", items: [numbered[2]] });
      continue;
    }
    para.push(rawLine);
  }
  flushPara();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      {blocks.map((blk, i) => {
        if (blk.t === "p") {
          // A lone short line that ends with a colon is a label the document put
          // above a list ("Personal Information:"). Keep it on its own line, a
          // little heavier — it is the document's structure, not decoration.
          const isLabel =
            !blk.text.includes("\n") && /:\s*$/.test(blk.text) && blk.text.length < 60;
          return (
            <Typography
              key={i}
              sx={{ ...FAQ_ANSWER_SX, ...(isLabel ? { fontWeight: 700, color: "text.primary" } : null) }}
            >
              {blk.text}
            </Typography>
          );
        }
        return (
          <Box
            key={i}
            component={blk.t === "ol" ? "ol" : "ul"}
            sx={{ m: 0, pl: 3, display: "flex", flexDirection: "column", gap: 0.5 }}
          >
            {blk.items.map((it, k) => (
              <Typography key={k} component="li" sx={FAQ_ANSWER_SX}>{it}</Typography>
            ))}
          </Box>
        );
      })}
    </Box>
  );
};

// `heading` is optional. Three of the StatePageKit pages give their FAQ block
// its own H2 ("Payroll Management FAQs"), which is keyword-bearing copy, not
// chrome. Without somewhere to put it those headings are replaced by the
// generic default; pages that pass nothing keep that default.
export const FAQSection = ({ faqs, heading }) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (_, isExpanded) =>
    setExpanded(isExpanded ? panel : false);

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: "background.paper" }}>
      <Container maxWidth={false} sx={{ maxWidth: "900px", mx: "auto", px: { xs: 3, md: 4 } }}>
        <Box sx={{ mb: { xs: 6, md: 8 }, textAlign: "center" }}>
          <motion.div {...fadeUp(0)}>
            <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 6, color: primary, fontSize: "0.75rem", mb: 2, display: "block" }}>
              {heading?.overline || "FAQ"}
            </Typography>
          </motion.div>
          <motion.div {...fadeUp(0.1)}>
            <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.8rem" }, lineHeight: 1.2 }}>
              {heading?.titleLead || "Frequently Asked"}{" "}
              <Box component="span" sx={{ color: primary }}>{heading?.highlight ?? "Questions"}</Box>
            </Typography>
          </motion.div>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {(faqs || []).map((faq, i) => (
            <motion.div key={faq.q} {...fadeUp(i * 0.06)}>
              <Accordion
                expanded={expanded === `faq-${i}`}
                onChange={handleChange(`faq-${i}`)}
                elevation={0}
                sx={{
                  borderRadius: "14px !important",
                  border: `1px solid ${expanded === `faq-${i}` ? alpha(primary, 0.3) : "rgba(0,0,0,0.07)"}`,
                  bgcolor: expanded === `faq-${i}` ? alpha(primary, 0.06) : "background.default",
                  transition: "all 0.25s ease",
                  "&:before": { display: "none" },
                  overflow: "hidden",
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: primary }} />} sx={{ px: 3, py: 0.5, "& .MuiAccordionSummary-content": { my: 1.5 } }}>
                  <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: { xs: "0.95rem", md: "1rem" }, color: "text.primary", lineHeight: 1.4 }}>
                    {faq.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                  <FaqAnswer text={faq.a} />
                </AccordionDetails>
              </Accordion>
            </motion.div>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

/* ================= LAYOUT ================= */
// `preview` renders the page body WITHOUT the site chrome, so the CMS can show
// an editor what a change will actually look like. The sections are the real
// ones, so the preview IS the styling rather than an imitation of it.
//
// SEO is suppressed deliberately: useFullSEO rewrites document.title and the
// meta tags of whatever page it runs on, and inside the admin screen that is a
// side effect, not a preview. Passing null is a no-op by its own contract.
export default function ServiceLayout({ seo, hero, intro, prose, whyEssential, solutions, cardGroups, checklists, comparisonTable, advantages, industries, closing, faqs, faqsHeading, preview = false }) {
  useFullSEO(preview ? null : seo);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", position: "relative" }}>
      {!preview && <Navbar />}
      <Hero hero={hero} />
      {intro && <Intro intro={intro} />}
      {prose && <Prose data={prose} />}
      {whyEssential && <Checklist data={whyEssential} />}
      {solutions && <Solutions data={solutions} />}
      {/* One ordered list, three kinds of section. A page whose copy alternates
          between card blocks, plain prose (a mid-page call to action, a closing
          pitch) and a comparison table can express that order here directly.
          The shape of the entry picks the renderer: `rows` is a table,
          `paragraphs` is prose, anything else is cards. The dedicated `prose`,
          `comparisonTable` and `closing` props stay for the common case of one
          of each in the default position. */}
      {cardGroups &&
        cardGroups.map((group, i) =>
          group.rows ? (
            <ComparisonTable key={i} data={group} />
          ) : group.paragraphs ? (
            <Prose key={i} data={group} />
          ) : typeof group.items?.[0] === "string" ? (
            // Plain bullets, the kind a document writes as a list of phrases
            // rather than label-and-description pairs. Checklist renders those
            // as short labelled cards; CardGroup would want a {title, desc}.
            <Checklist key={i} data={group} />
          ) : (
            <CardGroup key={i} data={group} />
          ),
        )}
      {checklists && checklists.map((group, i) => <Checklist key={i} data={{ bg: i % 2 === 0 ? "default" : "paper", ...group }} />)}
      {comparisonTable && <ComparisonTable data={comparisonTable} />}
      {advantages && <Advantages data={advantages} />}
      {industries && <Industries data={industries} />}
      {/* A page that signs off in its own words before the FAQs. The shared
          <CTASection /> below still runs; this is the page's copy, not a
          replacement for it. */}
      {closing && closing.placement !== "afterFaqs" && <Prose data={closing} />}
      {faqs && faqs.length > 0 && <FAQSection faqs={faqs} heading={faqsHeading} />}
      {/* Some pages sign off before the questions, some after them; the copy
          decides, so `placement: "afterFaqs"` moves it down here. */}
      {closing && closing.placement === "afterFaqs" && <Prose data={closing} />}
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

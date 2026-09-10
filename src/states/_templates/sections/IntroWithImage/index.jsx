// The two-column intro: copy left, photograph right, stat figures over it.
//
// This is the intro the live service pages have always shown, and the one the
// reference screenshots are of. The shared Intro (../Intro) was collapsed to a
// single centred column when the hotlinked unsplash.com photograph was pulled
// out of it, so it no longer matches those pages.
//
// It lives here rather than inside one service's template because more than one
// service needs it and a second copy of a 200-line sx block is a copy that
// drifts — the same reasoning every other folder in ./sections is built on. What
// a SERVICE owns is its photograph, which it passes to `introWithImage()`; what
// this file owns is the layout, once.
//
// Sizing is not invented: every value here was read off the live stylesheet, so
// the block is the same one those pages render — 1200px container, 48/80px
// column gap, a 420px image column, a 480px-tall cover crop, 24px radius, the
// 45° green wash, and the figures card inset 24px from the photograph's edges.
import React from "react";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useConsultation } from "../../../../components/ConsultationModal";

// The figures shown when a row carries none of its own. The same three the
// shared Intro falls back to, so the one-column and two-column introes cannot
// drift apart in what they claim.
const DEFAULT_STATS = [
  { num: "100+", label: "Clients" },
  { num: "50", label: "States" },
  { num: "10y+", label: "Experience" },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "0px 0px 900px 0px" },
  transition: { duration: 0.25, delay, ease: [0.22, 1, 0.36, 1] },
});

const hasText = (v) => typeof v === "string" && v.trim() !== "";

/**
 * The section component itself.
 *
 * `data` is the row's `content.intro`, exactly as the registry would hand it to
 * ../Intro. `band` and `index` are ignored: the intro is always the first body
 * section, so it is always the default ground and never numbered.
 *
 * @param {string} fallbackImage  the service's photograph, used when the row
 *                                names none of its own. Rows store `imageAlt`
 *                                but not `image` — the picture is the service's,
 *                                not the state's — so this is what renders.
 */
export default function IntroWithImage({ data, fallbackImage, fallbackAlt = "" }) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const { open } = useConsultation();

  const intro = data && typeof data === "object" ? data : {};
  const paragraphs = (Array.isArray(intro.paragraphs) ? intro.paragraphs : []).filter(hasText);
  const stats = Array.isArray(intro.stats) && intro.stats.length ? intro.stats : DEFAULT_STATS;
  const image = hasText(intro.image) ? intro.image : fallbackImage;

  // Same guard ../Intro carries: a template intro whose slots are still blank
  // must not draw an empty <h2> beside a photograph.
  const hasCopy =
    [intro.titleLead, intro.highlight, intro.overline].some(hasText) || paragraphs.length > 0;
  if (!hasCopy) return null;

  return (
    <Box component="section" sx={{ py: { xs: 8, md: 12 }, bgcolor: "background.default" }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 6, md: 10 }}
          alignItems="center"
        >
          {/* ── The copy ─────────────────────────────────────────────────── */}
          <Box sx={{ flex: 1 }}>
            {hasText(intro.overline) && (
              <motion.div {...fadeUp(0)}>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 900,
                    letterSpacing: 6,
                    color: primary,
                    fontSize: "0.75rem",
                    mb: 2,
                    display: "block",
                  }}
                >
                  {intro.overline}
                </Typography>
              </motion.div>
            )}

            {(hasText(intro.titleLead) || hasText(intro.highlight)) && (
              <motion.div {...fadeUp(0.1)}>
                <Typography
                  variant="h2"
                  sx={{ fontSize: { xs: "1.9rem", md: "2.8rem" }, lineHeight: 1.2, mb: 2.5 }}
                >
                  {intro.titleLead}{" "}
                  <Box component="span" sx={{ color: primary }}>{intro.highlight}</Box>
                </Typography>
              </motion.div>
            )}

            <motion.div {...fadeUp(0.18)}>
              <Box
                sx={{ width: 48, height: 3, borderRadius: 4, bgcolor: alpha(primary, 0.35), mb: 3 }}
              />
              {paragraphs.map((p, i) => (
                <Typography
                  key={i}
                  sx={{
                    color: "text.secondary",
                    fontSize: "1rem",
                    lineHeight: 1.85,
                    fontFamily: '"Outfit", sans-serif',
                    mb: i === paragraphs.length - 1 ? 3 : 2,
                  }}
                >
                  {p}
                </Typography>
              ))}
            </motion.div>

            <motion.div {...fadeUp(0.26)}>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={open}
                sx={{
                  bgcolor: primary,
                  color: "#fff",
                  px: 4,
                  py: 1.4,
                  fontWeight: 700,
                  "&:hover": { bgcolor: "#1a4d1d" },
                }}
              >
                {intro.ctaLabel || "Schedule Your Free Consultation"}
              </Button>
            </motion.div>
          </Box>

          {/* ── The photograph, with the figures over it ──────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "0px 0px 900px 0px" }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ flex: "0 0 auto", width: "100%", maxWidth: 420 }}
          >
            <Box
              sx={{
                position: "relative",
                borderRadius: "24px",
                overflow: "hidden",
                boxShadow: `0 32px 80px ${alpha(primary, 0.12)}`,
              }}
            >
              <Box
                component="img"
                src={image}
                alt={intro.imageAlt || fallbackAlt || intro.titleLead || ""}
                loading="lazy"
                decoding="async"
                sx={{
                  width: "100%",
                  height: 480,
                  objectFit: "cover",
                  display: "block",
                  transition: "transform .6s",
                  "&:hover": { transform: "scale(1.04)" },
                }}
              />
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(45deg, ${alpha(primary, 0.15)} 0%, transparent 60%)`,
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: 24,
                  left: 24,
                  right: 24,
                  borderRadius: "16px",
                  bgcolor: alpha("#fff", 0.95),
                  backdropFilter: "blur(12px)",
                  p: 2.5,
                  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
                }}
              >
                <Stack direction="row" spacing={3} sx={{ justifyContent: "space-around" }}>
                  {stats.map(({ num, label }) => (
                    <Box key={label} textAlign="center">
                      <Typography
                        sx={{
                          fontFamily: '"Plus Jakarta Sans", sans-serif',
                          fontWeight: 900,
                          fontSize: "1.4rem",
                          color: primary,
                          lineHeight: 1,
                        }}
                      >
                        {num}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: '"Outfit", sans-serif',
                          fontSize: "0.7rem",
                          color: "text.secondary",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          mt: 0.4,
                        }}
                      >
                        {label}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Box>
          </motion.div>
        </Stack>
      </Container>
    </Box>
  );
}

/**
 * A service template's whole use of this file:
 *
 *   sections={introWithImage(vaPhoto, "Virtual assistant services")}
 *
 * Returns the `sections` override map ServiceTemplateLayout takes, with the
 * service's photograph already bound in. Built once at module scope by each
 * template, never inside render, so the component identity is stable and the
 * section is not remounted on every pass.
 */
export const introWithImage = (image, alt = "") => {
  const Bound = (props) => <IntroWithImage {...props} fallbackImage={image} fallbackAlt={alt} />;
  Bound.displayName = "IntroWithImage(bound)";
  return { intro: Bound };
};

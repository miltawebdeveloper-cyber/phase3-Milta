// src/components/FeatureHighlightSection.jsx
import React from "react";
import { Box, Container, Grid, Typography } from "@mui/material";

const features = [
  {
    title: "All-in-One Services",
    desc: "A complete range of digital marketing services in the UK, from SEO and PPC to content and email marketing.",
  },
  {
    title: "Experienced Team",
    desc: "Skilled professionals who stay ahead of industry trends to ensure your campaigns succeed.",
  },
  {
    title: "Tailored Strategies",
    desc: "Custom plans aligned with your business goals and audience to maximize ROI and growth potential.",
  },
  {
    title: "Data-Led Decisions",
    desc: "Clear insights, measurable performance, and ongoing optimisation for smarter marketing decisions.",
  },
  {
    title: "Proven Results",
    desc: "A strong track record across industries and business sizes, delivering measurable growth.",
  },
  {
    title: "Results-Focused Approach",
    desc: "Your growth, leads, and revenue are our priority with strategies that scale with your business.",
  },
];

const FeatureHighlightSection = () => {
  return (
    <Box
      component="section"
      sx={{
        width: "100%",
        position: "relative",
        backgroundColor: "#fff",
        pt: { xs: 10, md: 8 },
        pb: { xs: 10, md: 0 },
      }}
    >
      <Container maxWidth="lg">
        {/* ================= HEADER ================= */}
        <Box sx={{ textAlign: "center", maxWidth: 850, mx: "auto", mb: 10 }}>
          {/* Label Row */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 1.5,
              mb: 2,
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#97ba3a",
              }}
            />

            <Typography
              sx={{
                fontWeight: 600,
                fontSize: 14,
                color: "#2b6d2a",
              }}
            >
              Why Choose Us
            </Typography>
          </Box>

          {/* Main Heading */}
          <Typography
            sx={{
              fontSize: { xs: 26, md: 44 },
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#2b6d2a",
              fontFamily: "var(--uk-font-primary)",
              mb: 3,
            }}
          >
            Accelerate Growth with a Partner <br />
            You Can Trust
          </Typography>

          {/* Subtitle */}
          <Typography
            sx={{
              color: "#666",
              fontSize: 16,
              lineHeight: 1.8,
            }}
          >
            Choosing the right digital marketing agency can define your success
            online. Miltafs combines strategy, experience, and transparency to
            deliver real results.
          </Typography>
        </Box>

        {/* ================= FEATURE CARDS ================= */}
        <Grid container spacing={4} sx={{ justifyContent: "center" }}>
          {features.map((item, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index} sx={{ display: "flex", justifyContent: "center" }}>
              <Box
                sx={{
                  backgroundColor: "#2b6d2a",
                  borderRadius: "18px",
                  p: 4,
                  width: "100%",
                  maxWidth: 320,
                  textAlign: "left",
                  minHeight: 170,

                  transition: "all 0.35s ease",
                  boxShadow: "0px 10px 25px rgba(0,0,0,0.10)",

                  "&:hover": {
                    transform: "translateY(-8px)",
                    backgroundColor: "#97ba3a",
                    boxShadow: "0px 20px 45px rgba(0,0,0,0.18)",
                  },
                }}
              >
                {/* Title */}
                <Typography
                  sx={{
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 16.5,
                    mb: 1,
                    fontFamily: "var(--uk-font-primary)",
                  }}
                >
                  {item.title}
                </Typography>

                {/* Description */}
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.82)",
                    fontSize: 14,
                    lineHeight: 1.65,
                    fontFamily: "var(--uk-font-secondary)",
                  }}
                >
                  {item.desc}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* ================= BOTTOM NOTE ================= */}
        <Box sx={{ textAlign: "center", mt: 7 }}>
          <Typography
            sx={{
              color: "#666",
              fontSize: 16,
              lineHeight: 1.8,
              maxWidth: 750,
              mx: "auto",
            }}
          >
            When you choose Miltafs, you’re partnering with a digital marketing
            agency in the UK that’s genuinely invested in your success —
            delivering strategies that work today and scale for tomorrow.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default FeatureHighlightSection;

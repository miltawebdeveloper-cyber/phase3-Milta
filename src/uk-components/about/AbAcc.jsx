// src/components/AboutAccountingSection.jsx
import React from "react";
import { Box, Typography, Container, Grid } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

const features = [
  {
    title: "Who We Are",
    description:
      "Our team brings years of hands-on accounting experience, paired with a practical mindset focused on making financial management easier.",
  },
  {
    title: "Our Purpose",
    description:
      "To deliver reliable and affordable outsourced accounting and bookkeeping support that removes financial stress and helps businesses grow with confidence.",
  },
  {
    title: "Our Vision",
    description:
      "To become a trusted global accounting partner, known for accuracy, flexibility, and scalable solutions that businesses can rely on as they grow.",
  }
];

const iconMap = {
  "Who We Are": PeopleRoundedIcon,
  "Our Purpose": FlagRoundedIcon,
  "Our Vision": VisibilityRoundedIcon,
};

const AboutAccountingSection = () => {
  return (
    <Box
      sx={{
        pt: { xs: 10, md: 10 }, pb: { xs: 10, md: 14 },
        px: 2,
        background: "radial-gradient(circle at top, #f9fff3, #ffffff)",
        fontFamily: "'Poppins', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Soft Background Glow */}
      <Box
        sx={{
          position: "absolute",
          top: "-120px",
          left: "-120px",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "rgba(151,186,58,0.18)",
          filter: "blur(90px)",
        }}
      />

      <Container
        maxWidth="lg"
        sx={{
          maxWidth: "1300px",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Section Header */}
        <Typography
          sx={{
            color: "#97ba3a",
            mb: 1,
            fontWeight: 700,
            fontSize: "14px",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          ● Know Milta
        </Typography>

        <Typography
          sx={{
            fontWeight: 700,
            mb: { xs: 5, md: 9 }, // 📱 Reduced gap on mobile
            fontSize: { xs: "28px", md: "42px" },
            color: "#2b6d2a",
            lineHeight: 1.2,
          }}
        >
          Know Our Milta
        </Typography>

        {/* Cards Grid */}
        <Grid container spacing={{ xs: 3, md: 5 }} sx={{ justifyContent: "center" }}>
          {features.map((feature, index) => {
            const Icon = iconMap[feature.title] || CheckCircleRoundedIcon;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <Box
                sx={{
                  maxWidth: { xs: "100%", sm: 340 }, // 📱 No fixed width on mobile
                  height: "100%",
                  p: { xs: 3, md: 5 }, // 📱 Smaller padding on mobile
                  borderRadius: "26px",

                  /* Premium Glass Card */
                  background: "rgba(255,255,255,0.75)",
                  backdropFilter: "blur(12px)",

                  border: "1px solid rgba(151,186,58,0.25)",

                  boxShadow: "0px 18px 45px rgba(0,0,0,0.08)",

                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",

                  position: "relative",
                  overflow: "hidden",

                  transition: "all 0.45s ease",
                  cursor: "pointer",

                  /* Gradient Hover Border */
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    padding: "2px",
                    borderRadius: "26px",
                    background:
                      "linear-gradient(135deg, #97ba3a, #2b6d2a)",
                    WebkitMask:
                      "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    opacity: 0,
                    transition: "0.45s ease",
                  },

                  "&:hover": {
                    transform: "translateY(-14px) scale(1.02)",
                    boxShadow: "0px 35px 80px rgba(0,0,0,0.15)",
                  },

                  "&:hover::before": {
                    opacity: 1,
                  },
                }}
              >
                {/* Icon Badge */}
                <Box
                  sx={{
                    width: 68,
                    height: 68,
                    borderRadius: "18px",
                    background:
                      "linear-gradient(135deg, rgba(151,186,58,0.25), rgba(43,109,42,0.15))",

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 3,

                    transition: "0.4s ease",

                    "&:hover": {
                      transform: "rotate(6deg) scale(1.08)",
                    },
                  }}
                >
                  <Icon
                    sx={{
                      fontSize: 34,
                      color: "#2b6d2a",
                    }}
                  />
                </Box>

                {/* Title */}
                <Typography
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    fontSize: "20px",
                    color: "#2b6d2a",
                  }}
                >
                  {feature.title}
                </Typography>

                {/* Description */}
                <Typography
                  sx={{
                    lineHeight: 1.9,
                    fontSize: "15px",
                    color: "rgba(0,0,0,0.70)",
                    maxWidth: 280,
                  }}
                >
                  {feature.description}
                </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
};

export default AboutAccountingSection;

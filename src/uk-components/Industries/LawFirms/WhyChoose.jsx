// src/components/WhatWeDoSection.jsx
import React from "react";
import { Box, Container, Grid, Typography } from "@mui/material";

/* ✅ Outline Icons (Line Style) */
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import HeadsetMicOutlinedIcon from "@mui/icons-material/HeadsetMicOutlined";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";

const services = [
  {
    icon: <TrendingUpOutlinedIcon />,
    title: "Value-Driven Legal Accounting",
    desc: "We go beyond standard law firm bookkeeping by delivering actionable financial insights that support informed, strategic decisions.",
  },
  {
    icon: <AutoAwesomeOutlinedIcon />,
    title: "Accounting Automation",
    desc: "Our AI-powered systems enhance the accuracy of your legal accounting processes while improving efficiency and cash flow control.",
  },
  {
    icon: <VerifiedOutlinedIcon />,
    title: "Extensive Outsourcing Expertise",
    desc: "With more than a decade of experience in bookkeeping services for law firms, we provide a reliable, secure, and seamless outsourcing partnership.",
  },
  {
    icon: <SupportAgentOutlinedIcon />,
    title: "Dedicated Legal Accounting Team",
    desc: "You’ll work with a specialist team experienced in law firm accounting, ensuring personalised support tailored to your practice.",
  },
  {
    icon: <HeadsetMicOutlinedIcon />,
    title: "Reliable, Real-Time Support",
    desc: "We offer prompt, UK-focused assistance whether you're looking for trustworthy local bookkeeping services or a completely distant accounting partner.",
  },
  {
    icon: <SavingsOutlinedIcon />,
    title: "Economical Remedies",
    desc: "You may reinvest in expansion and customer service by using our outsourced law firm accounting services, which can cut operating expenses by up to 60%.",
  },
];

const WhatWeDoSection = () => {
  return (
    <Box
      component="section"
      sx={{
        pt: { xs: 10, md: 10 },
        pb: { xs: 10, md: 10 },
        backgroundColor: "#fff",
      }}
    >
      <Container maxWidth="lg">
        {/* ================= HEADER ================= */}
        <Box sx={{ textAlign: "center", maxWidth: 800, mx: "auto", mb: 10 }}>
          {/* Label */}
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

          {/* Heading */}
          <Typography
            sx={{
              fontSize: { xs: 28, md: 44 },
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#2b6d2a",
              fontFamily: "'Poppins', sans-serif",
              mb: 3,
            }}
          >
            Why Choose Our Law Firm
            <br />
            Bookkeeping Services?
          </Typography>

          {/* Subtitle */}
          <Typography
            sx={{
              color: "#666",
              fontSize: 16,
              lineHeight: 1.8,
            }}
          >
            We provide specialised bookkeeping and outsourced accounting support
            designed to help law firms stay compliant, reduce costs, and gain
            complete financial clarity.
          </Typography>
        </Box>

        {/* ================= SERVICES GRID ================= */}
        <Grid container spacing={4} sx={{ justifyContent: "center" }}>
          {services.map((item, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index} sx={{ display: "flex", justifyContent: "center" }}>
              <Box
                sx={{
                  backgroundColor: "#2b6d2a",
                  borderRadius: "18px",
                  p: 4,
                  width: "100%",
                  maxWidth: 290,
                  textAlign: "left",
                  minHeight: 230,

                  transition: "all 0.35s ease",
                  boxShadow: "0px 10px 25px rgba(0,0,0,0.10)",

                  "&:hover": {
                    transform: "translateY(-8px)",
                    backgroundColor: "#97ba3a",
                    boxShadow: "0px 20px 45px rgba(0,0,0,0.18)",
                  },
                }}
              >
                {/* Icon */}
                <Box
                  sx={{
                    mb: 3,
                    width: 55,
                    height: 55,
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    backgroundColor: "rgba(255,255,255,0.12)",
                    color: "#fff",
                    fontSize: 34,
                  }}
                >
                  {item.icon}
                </Box>

                {/* Title */}
                <Typography
                  sx={{
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 16.5,
                    mb: 1,
                    fontFamily: "'Poppins', sans-serif",
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
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {item.desc}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default WhatWeDoSection;

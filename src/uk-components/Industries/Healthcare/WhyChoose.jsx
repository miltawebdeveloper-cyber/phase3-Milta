// src/components/WhatWeDoSection.jsx
import React from "react";
import { Box, Container, Grid, Typography } from "@mui/material";

/* ✅ Outline Icons (Line Style) */
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import HeadsetMicOutlinedIcon from "@mui/icons-material/HeadsetMicOutlined";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";

const services = [
  {
    icon: <TrendingUpOutlinedIcon />,
    title: "Value-Driven Healthcare Accounting",
    desc: "Our accounting services for healthcare are aligned with your business goals, providing insights that strengthen cash flow and long-term financial health.",
  },
  {
    icon: <AutoAwesomeOutlinedIcon />,
    title: "Accounting Automation",
    desc: "We use trusted cloud platforms such as Xero, QuickBooks, MS Dynamics, and other digital tools to streamline healthcare accounting, reduce errors, and improve efficiency.",
  },
  {
    icon: <VerifiedOutlinedIcon />,
    title: "UK Compliance Expertise",
    desc: "Our team understands UK compliance requirements, including HMRC, PAYE, VAT, and Companies House, ensuring complete peace of mind.",
  },
  {
    icon: <SupportAgentOutlinedIcon />,
    title: "Dedicated Accountant",
    desc: "You’ll work with a dedicated accountant for medical practice who provides personalised support, clear communication, and solutions customized to your healthcare business.",
  },
  {
    icon: <HeadsetMicOutlinedIcon />,
    title: "Real-Time Support",
    desc: "Receive responsive, real-time assistance from experienced healthcare accountants who understand the UK healthcare environment.",
  },
  {
    icon: <SavingsOutlinedIcon />,
    title: "Cost-Effective Outsourcing",
    desc: "Our outsourcing model significantly reduces overheads while delivering high-quality, compliant healthcare accounting services.",
  },
];

const WhatWeDoSection = () => {
  return (
    <Box
      component="section"
      sx={{
        pt: { xs: 10, md: 3 },
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
              Why Choose Us?
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
            Why Healthcare Businesses
            <br />
            Choose Milta
          </Typography>

          {/* Subtitle */}
          <Typography
            sx={{
              color: "#666",
              fontSize: 16,
              lineHeight: 1.8,
            }}
          >
            We provide specialised healthcare accounting support designed to help
            medical practices stay compliant, improve cash flow, and achieve full
            financial clarity.
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
                  maxWidth: 320,
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

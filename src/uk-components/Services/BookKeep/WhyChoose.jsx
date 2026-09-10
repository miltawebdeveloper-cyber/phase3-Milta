// src/components/WhatWeDoSection.jsx
import React from "react";
import { Box, Container, Grid, Typography } from "@mui/material";

/* ✅ Outline Icons (Modern Line Style) */
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";

const services = [
  {
    icon: <BusinessCenterOutlinedIcon />,
    title: "Tailored for Small Businesses",
    desc: "We specialise in bookkeeping services for small businesses, ensuring accurate records, cash-flow management, VAT compliance, payroll accuracy, and audit-ready statements.",
  },
  {
    icon: <AttachMoneyOutlinedIcon />,
    title: "Affordable and Professional",
    desc: "Cost-effective UK bookkeeping services without compromising quality. Transparent pricing ensures you only pay for what you need.",
  },
  {
    icon: <ChecklistOutlinedIcon />,
    title: "All-in-One Bookkeeping Support",
    desc: "From daily transaction recording to payroll, VAT, and financial reporting, we provide complete end-to-end bookkeeping solutions.",
  },
  {
    icon: <GavelOutlinedIcon />,
    title: "Compliance Without Stress",
    desc: "Our UK bookkeeping services help you stay compliant with HMRC regulations, avoiding errors, penalties, and missed deadlines.",
  },
  {
    icon: <PeopleAltOutlinedIcon />,
    title: "Reliable and Scalable Solutions",
    desc: "Miltafs stands out by offering business-focused solutions tailored for small businesses in the UK, scalable as your business grows.",
  },
];

const WhatWeDoSection = () => {
  return (
    <Box
      component="section"
      sx={{
        pt: { xs: 10, md: 3 },
        pb: { xs: 10, md: 3 },
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
            Why Choose Miltafs’s
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
            With many bookkeeping services available, Miltafs stands out by
            offering reliable, scalable, and business-focused solutions tailored
            to UK small businesses.
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

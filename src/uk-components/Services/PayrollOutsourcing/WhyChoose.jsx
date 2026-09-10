// src/components/WhatWeDoSection.jsx
import React from "react";
import { Box, Container, Grid, Typography } from "@mui/material";

/* ✅ Modern Outline Icons */
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";

const services = [
  {
    icon: <PeopleAltOutlinedIcon />,
    title: "Improved Employee Confidence",
    desc: "Reliable, accurate payroll processing ensures employees are paid correctly and on time, strengthening trust and morale across your workforce.",
  },
  {
    icon: <ChecklistOutlinedIcon />,
    title: "Time Efficiency",
    desc: "Professional payroll management eliminates manual calculations and administration, freeing up valuable time for core business activities.",
  },
  {
    icon: <GavelOutlinedIcon />,
    title: "Reduced Compliance Risk",
    desc: "Our payroll services ensure full compliance with HMRC regulations and UK employment laws, reducing the risk of errors and penalties.",
  },
  {
    icon: <BusinessCenterOutlinedIcon />,
    title: "Scalable Payroll Solutions",
    desc: "From small teams to growing organisations, our payroll solutions scale seamlessly as your workforce expands.",
  },
  {
    icon: <AttachMoneyOutlinedIcon />,
    title: "Cost-Effective Payroll Management",
    desc: "Affordable payroll services for small businesses help control costs without the overheads of maintaining in-house payroll expertise.",
  },
];

const WhatWeDoSection = () => {
  return (
    <Box
      component="section"
      sx={{
        pt: { xs: 10, md: 8 },
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
              fontFamily: "var(--uk-font-primary)",
              mb: 3,
            }}
          >
            Why Payroll Management Is
            <br />
            Critical for UK Businesses
          </Typography>

          {/* Subtitle */}
          <Typography
            sx={{
              color: "#666",
              fontSize: 16,
              lineHeight: 1.8,
            }}
          >
            Payroll directly impacts employee trust, legal compliance, and
            business stability. Choosing the right payroll service ensures your
            payroll remains accurate, compliant, and scalable as your business
            grows.
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
                {/* Icon Badge */}
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
      </Container>
    </Box>
  );
};

export default WhatWeDoSection;

// src/components/WhatWeDoSection.jsx
import React from "react";
import { Box, Container, Grid, Typography } from "@mui/material";

/* ✅ Modern Outline Icons */
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";

const services = [
  {
    icon: <BusinessCenterOutlinedIcon />,
    title: "Predictable Cash Flow",
    desc: "Our accounts receivable services help businesses turn outstanding invoices into steady, predictable cash flow through structured and timely collections.",
  },
  {
    icon: <AttachMoneyOutlinedIcon />,
    title: "Faster Collections",
    desc: "We ensure invoices are followed up consistently, reducing payment delays and improving days sales outstanding (DSO).",
  },
  {
    icon: <ChecklistOutlinedIcon />,
    title: "Clear Invoice Visibility",
    desc: "Gain full visibility into outstanding invoices, payment status, and customer balances with accurate and up-to-date reporting.",
  },
  {
    icon: <GavelOutlinedIcon />,
    title: "Reduced Disputes & Write-Offs",
    desc: "Professional receivables management helps minimise disputes, prevent write-offs, and maintain accurate customer account records.",
  },
  {
    icon: <PeopleAltOutlinedIcon />,
    title: "Professional Customer Communication",
    desc: "We manage customer follow-ups professionally and respectfully, protecting relationships while ensuring payments are collected on time.",
  },
];

const WhatWeDoSection = () => {
  return (
    <Box
      component="section"
      sx={{
        pt: { xs: "70px", md: "80px" },
        pb: { xs: "70px", md: "80px" },
        backgroundColor: "#ffffff",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          width: "100%",
          maxWidth: "1600px",
          margin: "0 auto",
          px: { xs: "12px", sm: "16px", md: "24px" },
        }}
      >
        {/* ================= HEADER ================= */}
        <Box sx={{ textAlign: "center", maxWidth: 850, mx: "auto", mb: 10 }}>
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
            {/* Dot */}
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
                fontFamily: "Poppins, sans-serif",
              }}
            >
              Why Businesses Trust Us
            </Typography>
          </Box>

          {/* Heading */}
          <Typography
            sx={{
              fontSize: { xs: "30px", md: "52px" },
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#2b6d2a",
              fontFamily: "Poppins, sans-serif",
              mb: 3,
            }}
          >
            Why Businesses Trust
            <br />
            Accounts Receivable Services
          </Typography>

          {/* Subtitle */}
          <Typography
            sx={{
              color: "rgba(0,0,0,0.75)",
              fontSize: { xs: "14px", md: "16px" },
              lineHeight: 1.8,
              fontFamily: "Poppins, sans-serif",
            }}
          >
            Managing accounts receivable today requires accuracy, consistency,
            and insight. Professional receivables management turns unpaid invoices
            into actionable financial data and reliable cash flow—allowing
            businesses to focus on growth without worrying about late payments.
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
                  padding: "32px",
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
                {/* Icon Box */}
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
                    color: "#ffffff",
                    fontSize: 34,
                  }}
                >
                  {item.icon}
                </Box>

                {/* Title */}
                <Typography
                  sx={{
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "16.5px",
                    mb: 1,
                    fontFamily: "Poppins, sans-serif",
                  }}
                >
                  {item.title}
                </Typography>

                {/* Description */}
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.82)",
                    fontSize: "14px",
                    lineHeight: 1.65,
                    fontFamily: "Poppins, sans-serif",
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

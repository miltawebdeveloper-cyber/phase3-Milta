// src/components/WhatWeDoSection.jsx
import React from "react";
import { Box, Container, Grid, Typography } from "@mui/material";

/* ✅ Modern Outline Icons */
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";

/* ✅ Services Data */
const services = [
  {
    icon: <BusinessCenterOutlinedIcon />,
    title: "Customized Virtual Assistant Solutions",
    desc: "Every virtual assistant service is tailored to your business goals, processes, and workload to deliver practical, measurable results.",
  },
  {
    icon: <PeopleAltOutlinedIcon />,
    title: "Skilled UK-Focused Professionals",
    desc: "Our experienced virtual assistants provide reliable support across administration, customer service, and accounting-related tasks.",
  },
  {
    icon: <ChecklistOutlinedIcon />,
    title: "Modern Tools & Technology",
    desc: "We use advanced project management tools, bookkeeping platforms, and communication systems to ensure efficient service delivery.",
  },
  {
    icon: <GavelOutlinedIcon />,
    title: "Confidentiality & Data Security",
    desc: "Your business data is protected through strict confidentiality policies and compliance with UK data protection standards.",
  },
  {
    icon: <AttachMoneyOutlinedIcon />,
    title: "Scalable & Cost-Effective Support",
    desc: "As your business grows, our virtual assistant services in the UK scale with you—without the cost of hiring in-house staff.",
  },
];

const WhatWeDoSection = () => {
  return (
    <Box
      component="section"
      sx={{
        /* ✅ Section Padding (from variables.css) */
        pt: { xs: "70px", md: "0px" } ,pb: { xs: 8, md: 12 },

        /* ✅ Background */
        backgroundColor: "#ffffff",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          px: { xs: "12px", sm: "16px", md: "24px" },
        }}
      >
        {/* ================= HEADER ================= */}
        <Box
          sx={{
            textAlign: "center",
            maxWidth: "800px",
            mx: "auto",
            mb: "80px",
          }}
        >
          {/* Label */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
              mb: "16px",
            }}
          >
            {/* Dot */}
            <Box
              sx={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#97ba3a", // uk-secondary
              }}
            />

            {/* Label Text */}
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: "14px",
                color: "#2b6d2a", // uk-primary
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Why Choose Miltafs
            </Typography>
          </Box>

          {/* Heading */}
          <Typography
            sx={{
              fontSize: { xs: "28px", md: "44px" },
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#2b6d2a",
              fontFamily: "'Poppins', sans-serif",
              mb: "24px",
            }}
          >
            Why Choose Miltafs for
            <br />
            Virtual Assistant Services?
          </Typography>

          {/* Subtitle */}
          <Typography
            sx={{
              color: "#666",
              fontSize: "16px",
              lineHeight: 1.8,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            When it comes to virtual assistant services for small businesses in
            the United Kingdom, Miltafs is a dependable partner offering secure,
            flexible, and business-focused support.
          </Typography>
        </Box>

        {/* ================= SERVICES GRID ================= */}
        <Grid container spacing={4} sx={{ justifyContent: "center" }}>
          {services.map((item, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index} sx={{ display: "flex", justifyContent: "center" }}>
              {/* Card */}
              <Box
                sx={{
                  backgroundColor: "#2b6d2a", // uk-primary
                  borderRadius: "18px",
                  padding: "32px",

                  width: "100%",
                  maxWidth: "320px",
                  minHeight: "230px",

                  textAlign: "left",

                  transition: "all 0.35s ease",
                  boxShadow: "0px 10px 25px rgba(0,0,0,0.10)",

                  "&:hover": {
                    transform: "translateY(-8px)",
                    backgroundColor: "#97ba3a", // uk-secondary
                    boxShadow: "0px 20px 45px rgba(0,0,0,0.18)",
                  },
                }}
              >
                {/* Icon Box */}
                <Box
                  sx={{
                    mb: "24px",
                    width: "55px",
                    height: "55px",
                    borderRadius: "14px",

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    backgroundColor: "rgba(255,255,255,0.12)",
                    color: "#fff",
                    fontSize: "34px",
                  }}
                >
                  {item.icon}
                </Box>

                {/* Title */}
                <Typography
                  sx={{
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "16.5px",
                    mb: "10px",
                    fontFamily: "'Poppins', sans-serif",
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

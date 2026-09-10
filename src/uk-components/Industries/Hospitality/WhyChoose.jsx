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
import RestaurantMenuOutlinedIcon from "@mui/icons-material/RestaurantMenuOutlined";
import CloudQueueOutlinedIcon from "@mui/icons-material/CloudQueueOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";

const services = [
  {
    icon: <RestaurantMenuOutlinedIcon />,
    title: "Deep understanding of the UK hospitality sector",
    desc: "We specialise in hospitality accounting with extensive knowledge of the unique challenges and regulations facing UK restaurants, hotels, and catering businesses.",
  },
  {
    icon: <SavingsOutlinedIcon />,
    title: "Flexible and cost-effective outsourcing model",
    desc: "Our scalable pricing ensures you only pay for what you need, helping you reduce overhead costs while maintaining high-quality financial management.",
  },
  {
    icon: <SupportAgentOutlinedIcon />,
    title: "Dedicated accounting professionals",
    desc: "You'll work with a dedicated accountant who understands your business model and provides personalised support tailored to your hospitality operations.",
  },
  {
    icon: <TrendingUpOutlinedIcon />,
    title: "Scalable solutions for expanding businesses",
    desc: "Whether you're opening a new location or expanding your services, our solutions grow with you to meet increasing financial complexity.",
  },
  {
    icon: <CloudQueueOutlinedIcon />,
    title: "Cloud-based systems for real-time access",
    desc: "Access your financial data anytime, anywhere with our cloud-based accounting platforms, giving you complete visibility of your business performance.",
  },
  {
    icon: <ForumOutlinedIcon />,
    title: "Clear communication and regular performance reviews",
    desc: "We provide transparent reporting and scheduled reviews to keep you informed about your financial position and help guide strategic decisions.",
  },
];

const WhatWeDoSection = () => {
  return (
    <Box
      component="section"
      sx={{
        pt: { xs: 10, md: 0 },
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
              Why Partner With Us
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
            Why Hospitality Businesses
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
            Choosing the right accounting partner can directly impact your 
            profitability and operational efficiency. We focus on delivering 
            practical financial support that helps you stay competitive in a 
            demanding industry.
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
                  minHeight: 250,

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
import React from "react";
import { Box, Typography, Container, Grid, Button } from "@mui/material";

/* ✅ Icons */
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";

/* ✅ Framer Motion */
import { motion } from "framer-motion";

/* ✅ Features */
const features = [
  {
    title: "Cost-Effective & Scalable",
    description:
      "High-quality accounting support that grows with your business.",
    icon: <MonetizationOnOutlinedIcon />,
    animation: { x: 80, opacity: 0 },
  },
  {
    title: "Specialist Expertise",
    description:
      "Direct access to experienced and reliable professionals.",
    icon: <WorkspacePremiumOutlinedIcon />,
    animation: { y: -80, opacity: 0 },
  },
  {
    title: "Time-Saving Solutions",
    description:
      "Reduced financial workload so you can focus on growth.",
    icon: <AccessTimeOutlinedIcon />,
    animation: { y: 80, opacity: 0 },
  },
  {
    title: "Secure & Compliant",
    description:
      "Accurate records, full compliance, and strong data protection.",
    icon: <SecurityOutlinedIcon />,
    animation: { x: 80, opacity: 0 },
  },
];

const WhyChooseMilta = () => {
  return (
    <Box
      sx={{
        backgroundColor: "#f5f7f8",
        py: { xs: 6, md: 12 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          maxWidth: "1300px",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 6, md: 8 },
          alignItems: { xs: "center", md: "flex-start" },
        }}
      >
        {/* ================= LEFT COLUMN ================= */}
        <Box
          component={motion.div}
          initial={{ x: -100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          viewport={{ once: true, margin: '0px 0px 900px 0px' }}
          sx={{
            flex: 1,
            maxWidth: { xs: "100%", md: "600px" },
            textAlign: { xs: "center", md: "left" },
            width: "100%", // Added for mobile
          }}
        >
          {/* Title */}
          <Typography
            sx={{
              color: "#97ba3a",
              fontWeight: 600,
              fontSize: "14px",
              letterSpacing: "1px",
              mb: 2,
            }}
          >
            ● WHY CHOOSE MILTA
          </Typography>

          {/* Heading */}
          <Typography
            component="h2"
            sx={{
              fontSize: { xs: "28px", sm: "30px", md: "42px" }, // Slightly increased for mobile
              fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              color: "#2b6d2a",
              mb: 3,
              lineHeight: 1.25,
              px: { xs: 1, sm: 0 }, // Added padding for mobile
            }}
          >
            The Benefits of Partnering With Us
          </Typography>

          {/* Description */}
          <Typography
            sx={{
              fontSize: { xs: "16px", md: "16px" }, // Increased for mobile
              lineHeight: 1.8,
              color: "#2b6d2a",
              mb: 4,
              fontFamily: "'Poppins', sans-serif",
              maxWidth: { xs: "100%", md: "unset" },
              px: { xs: 2, sm: 0 }, // Added horizontal padding for mobile
            }}
          >
            Expert, secure, and cost-effective accounting support designed to
            help your business grow with confidence.
          </Typography>

          {/* Button */}
          <Button
            variant="contained"
            component="a"
            href="/uk/contact"
            fullWidth={true}
            sx={{
              backgroundColor: "#97ba3a",
              color: "#fff",
              fontWeight: 600,
              padding: "12px 32px",
              borderRadius: "8px",
              textTransform: "none",
              fontSize: "16px",
              width: { xs: "100%", sm: "auto" },
              maxWidth: { xs: "320px", sm: "none" }, // Increased max width for mobile
              mx: { xs: "auto", md: 0 },
              "&:hover": {
                backgroundColor: "#97ba3a",
                opacity: 0.9,
              },
            }}
          >
            Contact our UK team
          </Button>
        </Box>

        {/* ================= RIGHT COLUMN ================= */}
        <Box
          sx={{
            flex: 1,
            maxWidth: { xs: "100%", md: "800px" },
            width: "100%",
          }}
        >
          <Grid 
            container 
            spacing={{ xs: 2, md: 3 }} // Reduced spacing on mobile
            sx={{
              justifyContent: { xs: "center", md: "flex-start" },
            }}
          >
            {features.map((f, index) => (
              <Grid size={{ xs: 12, sm: 6 }} key={index} sx={{ display: "flex",
                  justifyContent: { xs: "center", md: "flex-start" } }}>
                <Box
                  component={motion.div}
                  initial={f.animation}
                  whileInView={{ x: 0, y: 0, opacity: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: Math.min(index * 0.15, 0.15),
                    ease: "easeOut",
                  }}
                  viewport={{ once: true, margin: '0px 0px 900px 0px' }}
                  sx={{
                    width: "100%",
                    maxWidth: { xs: "100%", sm: "280px", md: "260px" }, // Adjusted for mobile
                    minHeight: { xs: "160px", md: "170px" }, // Slightly smaller on mobile
                    borderRadius: "16px",
                    padding: { xs: "20px", md: "24px" },
                    backgroundColor:
                      index === 0 ? "#97ba3a" : "#ffffff",
                    color: index === 0 ? "#fff" : "#2b6d2a",
                    boxShadow:
                      index === 0
                        ? "0px 8px 30px rgba(0,0,0,0.18)"
                        : "0px 4px 15px rgba(0,0,0,0.08)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                    },
                    // Ensure text doesn't overflow
                    wordBreak: "break-word",
                  }}
                >
                  {/* Icon */}
                  <Box
                    sx={{
                      width: { xs: 42, md: 46 }, // Slightly smaller on mobile
                      height: { xs: 42, md: 46 },
                      borderRadius: "12px",
                      backgroundColor:
                        index === 0
                          ? "rgba(255,255,255,0.2)"
                          : "#98ba3a2a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        fontSize: { xs: 24, md: 26 }, // Slightly smaller on mobile
                        color: index === 0 ? "#fff" : "#97ba3a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {f.icon}
                    </Box>
                  </Box>

                  {/* Title */}
                  <Typography
                    sx={{
                      fontSize: { xs: "17px", md: "18px" }, // Slightly adjusted for mobile
                      fontWeight: 700,
                      mb: 1.5,
                      fontFamily: "'Poppins', sans-serif",
                      lineHeight: 1.3,
                    }}
                  >
                    {f.title}
                  </Typography>

                  {/* Description */}
                  <Typography
                    sx={{
                      fontSize: { xs: "14px", md: "14px" }, // Slightly increased for mobile
                      lineHeight: 1.6,
                      opacity: index === 0 ? 0.95 : 0.8,
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    {f.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default WhyChooseMilta;
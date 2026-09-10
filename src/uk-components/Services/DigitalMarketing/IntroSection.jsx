// src/components/DigitalMarketingIntroSection.jsx
import React from "react";
import { Box, Typography, Container, Button, Grid } from "@mui/material";
import DigitalMarketing from "../../../assets/DigitalMarketing.jpg"; // 🔁 You can change image later
import { Link as RouterLink } from "react-router-dom";

const DigitalMarketingIntroSection = () => {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: "60px", md: "90px" },
        backgroundColor: "#ffffff",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          px: { xs: "16px", md: "24px" },
        }}
      >
        <Grid container spacing={8} sx={{ alignItems: "center" }}>
          
          {/* ================= LEFT SIDE (TEXT) ================= */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ maxWidth: 620 }}>
              
              {/* Section Label */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 3,
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
                    fontSize: "15px",
                    fontWeight: 600,
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  Digital Marketing Services
                </Typography>
              </Box>

              {/* Heading */}
              <Typography
                sx={{
                  fontSize: { xs: 30, sm: 36, md: 46 },
                  fontWeight: 700,
                  lineHeight: 1.2,
                  mb: 4,
                  fontFamily: "'Poppins', sans-serif",
                  color: "#2b6d2a",
                }}
              >
               Your Reliable Digital Marketing
                Partner in the UK
              </Typography>

              {/* Description */}
              <Typography
                sx={{
                  fontSize: { xs: "14px", md: "15.5px" },
                  fontFamily: "'Poppins', sans-serif",
                  color: "rgba(0,0,0,0.75)",
                  lineHeight: 1.8,
                  mb: 4,
                }}
              >
                Miltafs is a full-service digital marketing company that relies on
                genuine strategy rather than tricks or shortcuts. We combine
                creativity, data, and proven expertise to help businesses attract,
                engage, and convert the right customers.
                <br /><br />
                Our flexible approach supports startups, growing businesses, and
                established brands across a wide range of sectors. From bespoke
                websites to high-impact digital marketing services in the UK, we
                tailor every solution to your business goals.
                Explore our complete range of digital marketing services UK
                businesses trust, and speak to our team today to see how we can
                help your business grow with confidence.
              </Typography>

              {/* CTA Buttons */}
              <Box
                sx={{
                  display: "flex",
                  gap: 3,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  component={RouterLink}
                  to="/uk/services"
                  variant="contained"
                  sx={{
                    px: 4,
                    py: 1.6,
                    fontWeight: 600,
                    borderRadius: 2,
                    backgroundColor: "#2b6d2a",
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "#2b6d2a",
                      opacity: 0.9,
                    },
                  }}
                >
                  Get Started
                </Button>

                <Button
                  component={RouterLink}
                  to="/uk/contact"
                  variant="outlined"
                  sx={{
                    px: 4,
                    py: 1.6,
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: "none",
                    borderColor: "#2b6d2a",
                    color: "#2b6d2a",
                    "&:hover": {
                      borderColor: "#2b6d2a",
                      backgroundColor: "rgba(0,0,0,0.03)",
                    },
                  }}
                >
                  Book a Call
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* ================= RIGHT SIDE (IMAGE) ================= */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              component="img"
              src={DigitalMarketing}
              alt="Digital Marketing Services"
              sx={{
                width: "100%",
                maxWidth: 460,
                borderRadius: "22px",
                boxShadow: "0 30px 70px rgba(0,0,0,0.15)",
                objectFit: "cover",
              }}
            />
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
};

export default DigitalMarketingIntroSection;
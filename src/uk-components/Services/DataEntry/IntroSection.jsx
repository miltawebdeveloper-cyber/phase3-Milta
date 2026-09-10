// src/components/BookkeepingIntroSection.jsx
import React from "react";
import { Box, Typography, Container, Button, Grid } from "@mui/material";
import bookkeepingImage from "../../../assets/dataentry.jpg"; // 🔁 Change image path if needed
import { Link as RouterLink } from "react-router-dom";

const BookkeepingIntroSection = () => {
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
                    color: "#2b6d2a",
                  }}
                >
                  Accounting Data Entry Services
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
                Accurate Accounting Data Entry
                Services for UK Businesses
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
                Welcome to Milta, a trusted provider of reliable and accurate
                accounting data entry services for small and medium-sized
                businesses across the UK. We understand how limited time and
                resources can be for business owners, which is why our services
                are designed to be efficient, affordable, and stress-free.
             
                As one of the UK’s experienced accounting data entry companies,
                we specialise in bookkeeping data entry and financial data
                management. Our team brings hands-on expertise in handling complex
                financial records, ensuring your data remains accurate,
                compliant, and always up to date.
                
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

               
              </Box>

            </Box>
          </Grid>

          {/* ================= RIGHT SIDE (IMAGE) ================= */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              component="img"
              src={bookkeepingImage}
              alt="Accounting Data Entry Services"
              sx={{
                width: "100%",
                maxWidth: 460,
                minHeight:450,
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

export default BookkeepingIntroSection;
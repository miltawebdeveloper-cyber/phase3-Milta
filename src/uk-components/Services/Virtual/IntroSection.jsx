// src/components/BookkeepingIntroSection.jsx
import React from "react";
import { Box, Typography, Container, Button, Grid } from "@mui/material";
import virtualAssistantImage from "../../../assets/virtualAssistant.jpg"; // 🔁 Change image if needed
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
                  }}
                >
                  Virtual Assistant Services
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
                Virtual Assistant Services
                <br />
                for Small Businesses in UK
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
                At Miltafs, we understand the everyday pressures faced by small
                business owners across the UK. From managing administrative workloads
                to keeping on top of finances, these responsibilities can quickly
                pull your focus away from business growth. That’s where our virtual
                assistant services for small businesses make a real difference.
                <br /><br />
                Our professional virtual assistant services are designed to
                streamline operations, improve efficiency, and reduce your workload.
                Whether you need administrative support, a reliable virtual
                bookkeeping service, or a dedicated accounting virtual service, we
                provide flexible and dependable assistance tailored to your business
                needs.
                From start-ups to growing enterprises, our virtual assistant services
                in the UK act as a trusted extension of your team—helping you work
                smarter, stay organised, and scale faster.
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
              src={virtualAssistantImage}
              alt="Virtual Assistant Services"
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

export default BookkeepingIntroSection;
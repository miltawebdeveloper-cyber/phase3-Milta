// src/components/PayrollIntroSection.jsx
import React from "react";
import { Box, Typography, Container, Button, Grid } from "@mui/material";
import payrollImage from "../../../assets/payroll.jpg"; // 🔁 Change to your payroll image
import { Link as RouterLink } from "react-router-dom";

const PayrollIntroSection = () => {
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
                  Payroll Management Services
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
                Payroll Management Services
                in the UK
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
                Accurate payroll management is the backbone of every successful UK
                business. From ensuring employees are paid correctly and on time to
                meeting strict HMRC, PAYE, RTI, and pension auto-enrolment
                requirements, payroll is one of the most compliance-sensitive
                business functions. Even minor payroll errors can lead to penalties,
                employee dissatisfaction, and reputational damage.
                <br /><br />
                At Milta Accounting, we provide fully managed payroll services for
                small businesses, SMEs, and growing organisations across the UK.
                Our solutions simplify payroll operations, eliminate compliance
                risks, and deliver reliable, cost-effective results. Whether you
                need payroll outsourcing, the best payroll service for small
                businesses, or secure international payroll support, our expert
                payroll team is with you at every stage.
                
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
              src={payrollImage}
              alt="Payroll Management Services"
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

export default PayrollIntroSection;
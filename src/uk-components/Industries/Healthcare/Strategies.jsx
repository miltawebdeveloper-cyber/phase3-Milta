// src/components/BenefitsSection.jsx
import React from "react";
import { Box, Typography, Container, Grid } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const serveList = [
  {
    title: "Budgeting & Forecasting",
    desc: "We help healthcare organisations plan with confidence by analysing historical data and future trends to build realistic, goal-aligned financial strategies.",
  },
  {
    title: "Cash Flow Management",
    desc: "Effective cash flow is essential in healthcare. Our experienced healthcare accountants optimise cash movement, ensuring smooth operations and financial stability.",
  },
  {
    title: "Payroll Management",
    desc: "Our payroll services deliver accurate, compliant, and timely payments for healthcare staff, meeting all UK regulatory requirements while supporting workforce satisfaction.",
  },
];

const BenefitsSection = () => {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 10, md: 6 },
        backgroundColor: "#2b6d2a",
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            maxWidth: 1200,
            mx: "auto",
            textAlign: "center",
            color: "#fff",
          }}
        >
          {/* Heading */}
          <Typography
            sx={{
              fontSize: { xs: 30, md: 44 },
              fontWeight: 700,
              lineHeight: 1.2,
              mb: 3,
              fontFamily: "'Poppins', sans-serif",
             color: "#fff",
            }}
          >
            Your Trusted Partner for<br></br> Medical Accounting Services
          </Typography>

          {/* Serve List */}
          <Grid container spacing={3} sx={{ justifyContent: "center" }}>
            {serveList.map((item, index) => (
              <Grid size={{ xs: 12, sm: 6 }} key={index}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    p: 2.5,
                    maxWidth: "450px",
                    height: "200px",
                    borderRadius: 2,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.15)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <CheckCircleIcon
                    sx={{
                      fontSize: 24,
                      color: "#97ba3a",
                      mt: 0.25,
                    }}
                  />

                  <Box sx={{ textAlign: "left" }}>
                    <Typography
                      sx={{
                        fontSize: 18,
                        fontWeight: 700,
                        mb: 0.8,
                        color: "#fff",
                      }}
                    >
                      {item.title}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: 15,
                        lineHeight: 1.6,
                        color: "#f0f0f0",
                      }}
                    >
                      {item.desc}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default BenefitsSection;

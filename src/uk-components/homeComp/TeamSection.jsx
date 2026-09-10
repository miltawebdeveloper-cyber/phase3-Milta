// src/components/TeamSection.jsx
import React from "react";
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
} from "@mui/material";
import { motion } from "framer-motion";

/* Steps Data */
const workSteps = [
  {
    step: "01",
    title: "Schedule a Consultation",
    description:
      "Arrange a call with our team to discuss your accounting requirements. Our remote delivery model ensures flexibility and ease of communication.",
  },
  {
    step: "02",
    title: "Discovery Discussion",
    description:
      "During a focused 30-minute session, we assess your business structure, challenges, and objectives to determine the most suitable level of support.",
  },
  {
    step: "03",
    title: "Diagnostic Assessment",
    description:
      "We provide a structured diagnostic overview outlining areas for improvement, efficiency opportunities, and recommended next steps.",
  },
];

const TeamSection = () => {
  return (
    <Box
      component="section"
      sx={{
        width: "100%",
        bgcolor: "#f5f7f8",
        py: { xs: 6, md: 12 },
      }}
    >
      <Container maxWidth="lg">
        {/* ================= HEADER ================= */}
        <motion.div
          initial={{ opacity: 0, y: -60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          viewport={{ once: true, margin: '0px 0px 900px 0px' }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "flex-start", md: "center" },
              justifyContent: "space-between",
              gap: { xs: 4, md: 0 },
              mb: { xs: 5, md: 8 },
            }}
          >
            <Box sx={{ maxWidth: { xs: "100%", md: 560 } }}>
              <Typography
                sx={{
                  color: "#97ba3a",
                  fontWeight: 700,
                  mb: 1.5,
                  fontSize: "14px",
                  letterSpacing: 1,
                }}
              >
                ● HOW WE WORK
              </Typography>

              <Typography
                component="h2"
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: { xs: "24px", sm: "28px", md: "40px" },
                  lineHeight: 1.3,
                  mb: 2,
                  color: "#2b6d2a",
                }}
              >
                A Clear and Efficient Process
              </Typography>

              <Typography
                sx={{
                  color: "rgba(0,0,0,0.7)",
                  fontSize: { xs: "14px", md: "15px" },
                  lineHeight: 1.7,
                }}
              >
                We deliver cost-effective outsourced accounting and bookkeeping
                services tailored to the needs of small and medium-sized businesses.
              </Typography>
            </Box>

            <Box
              sx={{
                width: { xs: "100%", md: "auto" },
                display: "flex",
                justifyContent: { xs: "flex-start", md: "flex-end" },
              }}
            >
              <Button
                component="a"
                href="/uk/services"
                variant="contained"
                fullWidth
                sx={{
                  bgcolor: "#2b6d2a",
                  borderRadius: "30px",
                  px: 4,
                  py: 1.4,
                  fontWeight: 600,
                  textTransform: "none",
                  maxWidth: { sm: "250px", md: "none" },
                  "&:hover": {
                    bgcolor: "#97ba3a",
                  },
                }}
              >
                Get Started →
              </Button>
            </Box>
          </Box>
        </motion.div>

        {/* ================= CARDS ================= */}
        <Grid container spacing={{ xs: 3, md: 4 }}>
          {workSteps.map((step, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index} sx={{ display: "flex",
                justifyContent: { xs: "stretch", md: "center" } }}>
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.2, 0.15) }}
                viewport={{ once: true, margin: '0px 0px 900px 0px' }}
                style={{ width: "100%" }}
              >
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: { md: 340 }, // desktop fixed width
                    minHeight: { md: 280 }, // fixed only on desktop
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",

                    bgcolor: "#fff",
                    borderRadius: "18px",
                    border: "1px solid rgba(0,0,0,0.08)",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",

                    p: { xs: 3, md: 4 },
                    transition: "all 0.35s ease",

                    "&:hover": {
                      transform: { md: "translateY(-10px)" },
                      borderColor: "#97ba3a",
                      boxShadow: "0 12px 25px rgba(0,0,0,0.12)",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: "28px", md: "36px" },
                      fontWeight: 800,
                      color: "#97ba3a",
                      mb: 2,
                    }}
                  >
                    {step.step}
                  </Typography>

                  <Typography
                    sx={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 700,
                      fontSize: { xs: "16px", md: "18px" },
                      mb: 1.5,
                      color: "#2b6d2a",
                    }}
                  >
                    {step.title}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: { xs: "14px", md: "14.5px" },
                      color: "rgba(0,0,0,0.68)",
                      lineHeight: 1.7,
                      flexGrow: 1,
                    }}
                  >
                    {step.description}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default TeamSection;
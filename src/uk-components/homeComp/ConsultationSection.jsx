import React from "react";
import { Box, Typography, Button, Container, Grid } from "@mui/material";
import { motion } from "framer-motion";

const features = [
  {
    title: "Business Understanding",
    description:
      "We begin by gaining a thorough understanding of your operations, financial structure, and current challenges.",
  },
  {
    title: "Bespoke Solutions",
    description:
      "Our team designs customised accounting and bookkeeping frameworks aligned with your specific business needs.",
  },
  {
    title: "Continuous Support",
    description:
      "We manage day-to-day financial activities, provide actionable insights, and support planning—allowing you to focus on long-term performance and growth.",
  },
];

const leftFade = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7 } },
};

const rightFade = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7 } },
};

const cardFadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: Math.min(i * 0.15, 0.15) },
  }),
};

const ConsultationSection = () => {
  return (
    <Box
      component="section"
      sx={{
        // Hide on mobile (xs), show on sm and up
        display: { xs: "none", sm: "block" },
        py: { xs: 7, sm: 8, md: 12, lg: 14 },
        backgroundColor: "#ffffff",
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ maxWidth: 1200, mx: "auto" }}>
          <Grid container spacing={{ xs: 6, sm: 6, md: 8 }} direction={{ xs: "column-reverse", md: "row" }} sx={{ alignItems: "center" }}>
            {/* LEFT COLUMN */}
            <Grid size={{ xs: 12, md: 5 }}>
              <motion.div
                variants={leftFade}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '0px 0px 900px 0px' }}
              >
                <Box
                  sx={{
                    maxWidth: { xs: "100%", sm: 500, md: 480 },
                    textAlign: { xs: "center", md: "left" },
                    mx: { xs: "auto", md: 0 },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: { xs: "center", md: "flex-start" },
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
                        color: "#97ba3a",
                        fontSize: 13,
                        letterSpacing: 0.5,
                      }}
                    >
                      OUR APPROACH
                    </Typography>
                  </Box>

                  <Typography
                    component="h2"
                    sx={{
                      fontSize: {
                        xs: 24,
                        sm: 28,
                        md: 36,
                        lg: 44,
                      },
                      fontWeight: 600,
                      lineHeight: 1.3,
                      mb: 3,
                      fontFamily: "'Poppins', sans-serif",
                      color: "#2b6d2a",
                    }}
                  >
                    A Strategic & Practical Way to Support Your Business
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: { xs: 14, sm: 15 },
                      color: "rgba(0,0,0,0.7)",
                      lineHeight: 1.8,
                      mb: 4,
                    }}
                  >
                    We deliver cost-effective outsourced accounting and
                    bookkeeping services tailored to small and medium-sized
                    businesses—focused on clarity, efficiency, and sustainable
                    growth.
                  </Typography>

                  <Button
                    variant="outlined"
                    sx={{
                      borderRadius: 30,
                      px: 4,
                      py: 1.3,
                      textTransform: "none",
                      fontWeight: 600,
                      borderColor: "#97ba3a",
                      color: "#2b6d2a",
                      "&:hover": {
                        backgroundColor: "#97ba3a",
                        borderColor: "#97ba3a",
                        color: "#fff",
                      },
                    }}
                  >
                    Learn More →
                  </Button>
                </Box>
              </motion.div>
            </Grid>

            {/* RIGHT COLUMN */}
            <Grid size={{ xs: 12, md: 7 }}>
              <motion.div
                variants={rightFade}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '0px 0px 900px 0px' }}
              >
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: { xs: 2.5, sm: 3 },
                    alignItems: { xs: "stretch", md: "flex-end" },
                  }}
                >
                  {features.map((item, index) => (
                    <motion.div
                      key={index}
                      custom={index}
                      variants={cardFadeUp}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: '0px 0px 900px 0px' }}
                      style={{ width: "100%" }}
                    >
                      <Box
                        sx={{
                          width: "100%",
                          maxWidth: { md: 540 },
                          p: { xs: 2.5, sm: 3, md: 4 },
                          borderRadius: 1,
                          backgroundColor: "#fff",
                          border: "1px solid rgba(0,0,0,0.08)",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.5,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            backgroundColor: "#97ba3a",
                            transform: "translateY(-6px)",
                            boxShadow:
                              "0px 20px 40px rgba(0,0,0,0.15)",
                          },
                          "&:hover h4, &:hover p": {
                            color: "#fff",
                          },
                        }}
                      >
                        <Typography
                          component="h4"
                          sx={{
                            fontSize: { xs: 16, sm: 17, md: 18 },
                            fontWeight: 700,
                            color: "#2b6d2a",
                            fontFamily: "'Poppins', sans-serif",
                          }}
                        >
                          {item.title}
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: { xs: 14, sm: 15 },
                            color: "rgba(0,0,0,0.65)",
                            lineHeight: 1.7,
                          }}
                        >
                          {item.description}
                        </Typography>
                      </Box>
                    </motion.div>
                  ))}
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default ConsultationSection;
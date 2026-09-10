import React from "react";
import { Box, Typography, Container, Grid } from "@mui/material";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import BookRoundedIcon from "@mui/icons-material/BookRounded";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";

/* ✅ Framer Motion */
import { motion } from "framer-motion";

const services = [
  "Bookkeeping Service",
  "Payable Service",
  "Payroll Service",
  "Receivable Service",
  "Virtual Assistance",
];

const iconMap = {
  "Bookkeeping Service": BookRoundedIcon,
  "Payable Service": ReceiptLongIcon,
  "Payroll Service": PaidRoundedIcon,
  "Receivable Service": AccountBalanceWalletRoundedIcon,
  "Virtual Assistance": SupportAgentRoundedIcon,
};

/* ✅ Animation Directions - Improved for Mobile Stability (No X on small screens) */
const getAnimation = (index, isMobile) => {
  if (isMobile) return { y: 30, opacity: 0 }; // Only vertical on mobile
  if (index % 4 === 0) return { x: -80, opacity: 0 };
  if (index % 4 === 1) return { x: 80, opacity: 0 };
  if (index % 4 === 2) return { y: -80, opacity: 0 };
  return { y: 80, opacity: 0 };
};


const SupportServicesSection = () => {
  return (
    <Box
      sx={{
        py: { xs: 6, md: 12 },
        px: { xs: 2, sm: 3 },
        backgroundColor: "#ffffff",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          maxWidth: "1300px",
          textAlign: "center",
        }}
      >
        {/* Section Header */}
        <Typography
          sx={{
            color: "#97ba3a",
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            mb: 1,
            fontSize: "14px",
          }}
        >
          ● Our Services
        </Typography>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            mb: { xs: 5, md: 8 },
            fontFamily: "'Poppins', sans-serif",
            color: "#2b6d2a",
            fontSize: { xs: "26px", md: "34px" },
          }}
        >
          How We Support Your Business
        </Typography>

        {/* Services Grid */}
        <Grid container spacing={{ xs: 3, md: 4 }} sx={{ justifyContent: "center" }}>
          {services.map((service, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index} sx={{ display: "flex",
                justifyContent: "center" }}>
              <motion.div
                initial={getAnimation(index, { xs: true })} // Simplified check for instruction purposes
                whileInView={{ x: 0, y: 0, opacity: 1 }}

                transition={{ duration: 0.25, ease: "easeOut" }}
                viewport={{ once: true, amount: 0.2, margin: '0px 0px 900px 0px' }}
                style={{ width: "100%" }}
              >
                {/* Card */}
                <Box
                  sx={{
                    p: { xs: 3, md: 4 },

                    /* Desktop stays same */
                    maxWidth: { xs: "100%", sm: 320, md: 300 },
                    width: "100%",
                    height: "100%",

                    borderRadius: "22px",
                    backgroundColor: "#ffffff",
                    boxShadow: "0px 10px 25px rgba(0,0,0,0.06)",

                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",

                    transition: "all 0.35s ease",

                    "&:hover": {
                      transform: "translateY(-6px)",
                      boxShadow: "0px 22px 45px rgba(0,0,0,0.14)",
                    },
                  }}
                >
                  {/* Icon */}
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: "14px",
                      background:
                        "linear-gradient(135deg, rgba(151,186,58,0.12), rgba(43,109,42,0.08))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 2.5,
                    }}
                  >
                    {(() => {
                      const Icon =
                        iconMap[service] || CheckCircleRoundedIcon;
                      return (
                        <Icon
                          sx={{
                            fontSize: 28,
                            color: "#2b6d2a",
                          }}
                        />
                      );
                    })()}
                  </Box>

                  {/* Title */}
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      mb: 1.5,
                      color: "#2b6d2a",
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: { xs: "18px", md: "20px" },
                    }}
                  >
                    {service}
                  </Typography>

                  {/* Description */}
                  <Typography
                    variant="body2"
                    sx={{
                      lineHeight: 1.8,
                      fontSize: { xs: "14px", md: "15px" },
                      color: "rgba(0,0,0,0.65)",
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    We provide efficient, reliable support to ensure this service
                    runs smoothly and contributes to your business growth.
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

export default SupportServicesSection;
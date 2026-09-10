// src/components/ContactInfoSection.jsx
import React from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Divider,
  IconButton,
} from "@mui/material";

import { motion } from "framer-motion";

import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";

const contactItems = [
  {
    icon: <LocationOnOutlinedIcon sx={{ color: "#2b6d2a" }} />,
    label: "Office Address",
    details: (
      <>
        No. 175, Sri Sai Tower, 3rd Floor,
        <br />
        Bharathi Colony Rd, Peelamedu,
        <br />
        Coimbatore, Tamil Nadu 641004, India
      </>
    ),
  },
  {
    icon: <EmailOutlinedIcon sx={{ color: "#2b6d2a" }} />,
    label: "Email Address",
    details: (
      <Box
        component="a"
        href="mailto:info@miltafs.com"
        sx={{
          color: "inherit",
          textDecoration: "none",
          "&:hover": { color: "#2b6d2a" },
        }}
      >
        info@miltafs.com
      </Box>
    ),
  },
  {
    icon: <CallOutlinedIcon sx={{ color: "#2b6d2a" }} />,
    label: "Contact Number",
    details: (
      <Box
        component="a"
        href="tel:+919600103723"
        sx={{
          color: "inherit",
          textDecoration: "none",
          "&:hover": { color: "#2b6d2a" },
        }}
      >
        India : +91 96001 03723
      </Box>
    ),
  },
];

const socialLinks = [
  {
    icon: <LinkedInIcon fontSize="small" />,
    url: "https://www.linkedin.com/company/milta-accounding-services-pvt-ltd/",
  },
  {
    icon: <FacebookIcon fontSize="small" />,
    url: "https://www.facebook.com/miltaaccountingservices/",
  },
  {
    icon: <InstagramIcon fontSize="small" />,
    url: "https://www.instagram.com/milta_accountings/",
  },
  {
    icon: <YouTubeIcon fontSize="small" />,
    url: "https://www.youtube.com/@milta-accounting-service",
  },
];

const ContactInfoSection = () => {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: "#ffffff",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 6, md: 8 }} sx={{ alignItems: "flex-start" }}>
          {/* ================= LEFT CONTENT ================= */}
          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              viewport={{ once: true, margin: '0px 0px 900px 0px' }}
            >
              <Typography
                sx={{
                  color: "#97ba3a",
                  fontWeight: 600,
                  mb: 1,
                  textAlign: { xs: "center", md: "left" },
                }}
              >
                ● Contact Info
              </Typography>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  lineHeight: 1.25,
                  mb: 3,
                  color: "#2b6d2a",
                  textAlign: { xs: "center", md: "left" },
                  maxWidth: { xs: "100%", md: 460 },
                  mx: { xs: "auto", md: 0 },
                  fontSize: {
                    xs: "28px",
                    md: "42px",
                  },
                }}
              >
                Looking for Reliable UK Accounting &amp; Financial Support?
              </Typography>

              <Typography
                sx={{
                  color: "#6b7280",
                  maxWidth: { xs: "100%", md: 420 },
                  lineHeight: 1.8,
                  textAlign: { xs: "center", md: "left" },
                  fontSize: {
                    xs: "15px",
                    md: "16px",
                  },
                  mb: { xs: 5, md: 0 },
                }}
              >
                Our professional team supports UK businesses with accounting,
                bookkeeping, tax compliance, and financial advisory services,
                ensuring accuracy, transparency, and growth.
              </Typography>
            </motion.div>
          </Grid>

          {/* ================= RIGHT CONTACT INFO ================= */}
          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              viewport={{ once: true, margin: '0px 0px 900px 0px' }}
            >
              {/* Grid `spacing` already provides the gutter — no extra left pad,
                  which previously pushed this column out of alignment. */}
              <Box>
                <Box>
                  {contactItems.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 60 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.25,
                        delay: Math.min(idx * 0.2, 0.15),
                        ease: "easeOut",
                      }}
                      viewport={{ once: true, margin: '0px 0px 900px 0px' }}
                    >
                      <Box
                        display="flex"
                        alignItems="flex-start"
                        mb={4}
                        gap={3}
                        sx={{
                          flexDirection: { xs: "row", sm: "row" },
                          justifyContent: { xs: "flex-start", md: "flex-start" },
                        }}
                      >
                        <Box
                          sx={{
                            width: { xs: 48, md: 56 },
                            height: { xs: 48, md: 56 },
                            color: "#fff",
                            borderRadius: "50%",
                            backgroundColor: "#97ba3a",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </Box>

                        <Box>
                          <Typography fontSize={13} color="text.secondary">
                            {item.label}
                          </Typography>
                          <Typography fontWeight={600} fontSize={{ xs: 15, md: 16 }}>
                            {item.details}
                          </Typography>
                        </Box>
                      </Box>
                    </motion.div>
                  ))}

                  <Divider sx={{ my: 4 }} />
                </Box>

                {/* Social Icons — always laid out in a horizontal row */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 2,
                    justifyContent: { xs: "center", md: "flex-start" },
                    "& > *": { flex: "0 0 auto" },
                  }}
                >
                  {socialLinks.map((social, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: -30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.25,
                        delay: Math.min(idx * 0.15, 0.15),
                      }}
                      viewport={{ once: true, margin: '0px 0px 900px 0px' }}
                    >
                      <IconButton
                        component="a"
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          border: "1px solid #e5e7eb",
                          color: "#2b6d2a",
                          width: { xs: 44, md: 40 }, // 📱 Slightly larger tap target for mobile
                          height: { xs: 44, md: 40 },
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            backgroundColor: "#97ba3a",
                            color: "#fff",
                            transform: "translateY(-3px) scale(1.1)", // 📱 Visual feedback
                          },
                          "&:active": {
                            transform: "scale(0.9)", // 📱 Tactile press effect
                          },
                        }}
                      >
                        {social.icon}
                      </IconButton>

                    </motion.div>
                  ))}
                </Box>
              </Box>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ContactInfoSection;

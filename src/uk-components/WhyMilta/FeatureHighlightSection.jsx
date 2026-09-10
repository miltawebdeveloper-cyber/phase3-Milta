import React from "react";
import { Box, Container, Grid, Typography } from "@mui/material";

import VerifiedIcon from "@mui/icons-material/Verified";
import GroupsIcon from "@mui/icons-material/Groups";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SecurityIcon from "@mui/icons-material/Security";
import SettingsIcon from "@mui/icons-material/Settings";
import HandshakeIcon from "@mui/icons-material/Handshake";

import { motion } from "framer-motion";

/* ✅ Feature List */
const features = [
  {
    icon: <VerifiedIcon />,
    title: "UK-Focused Expertise",
    desc: "Services aligned with UK accounting, tax, and compliance requirements to ensure accuracy and peace of mind.",
  },
  {
    icon: <GroupsIcon />,
    title: "Experienced Professional Teams",
    desc: "Qualified accountants, bookkeepers, and support professionals dedicated to your business.",
  },
  {
    icon: <VisibilityIcon />,
    title: "Transparent Communication",
    desc: "Clear reporting, regular updates, and a dedicated point of contact at every stage.",
  },
  {
    icon: <SecurityIcon />,
    title: "Secure & Compliant Processes",
    desc: "Strong data protection, documented workflows, and strict confidentiality controls.",
  },
  {
    icon: <SettingsIcon />,
    title: "Flexible Service Models",
    desc: "Easily scale services up or down as your business needs change.",
  },
  {
    icon: <HandshakeIcon />,
    title: "Long-Term Partnership Approach",
    desc: "We work as a dependable extension of your business, not just a service provider.",
  },
];

/* ✅ Animation Variant */
const fadeUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
};

const FeatureHighlightSection = () => {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 10, md: 10 },
        background: "linear-gradient(180deg,#2b6d2a,#1f4f1f)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Container maxWidth="lg">
        {/* ================= HEADING ================= */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          transition={{ duration: 0.25 }}
          viewport={{ once: true, margin: '0px 0px 900px 0px' }}
        >
          <Typography
            sx={{
              textAlign: "center",
              fontWeight: 700,
              fontSize: { xs: "30px", sm: "38px", md: "44px" },
              color: "#fff",
              mb: 2,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Why UK Businesses Choose Milta
          </Typography>

          <Typography
            sx={{
              textAlign: "center",
              maxWidth: 650,
              mx: "auto",
              fontSize: "16px",
              lineHeight: 1.8,
              color: "rgba(255,255,255,0.85)",
              mb: 8,
            }}
          >
            Trusted by growing UK companies for reliable bookkeeping,
            compliance, and long-term operational support.
          </Typography>
        </motion.div>

        {/* ================= FEATURE CARDS ================= */}
        <Grid container spacing={{ xs: 3, md: 4 }} sx={{ justifyContent: "center" }}>

          {features.map((item, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index} sx={{ display: "flex" }}>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                transition={{ duration: 0.25, delay: Math.min(index * 0.15, 0.15) }}
                viewport={{ once: true, margin: '0px 0px 900px 0px' }}
                style={{ width: "100%" }}
              >
                {/* ✅ RESPONSIVE CARD */}
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: { xs: "100%", sm: 340 }, // 📱 Responsive width
                    minHeight: { xs: "auto", sm: 320, md: 290 }, // 📱 Dynamic height for text wrap
                    mx: "auto",
 
                    p: { xs: 3, md: 4 }, // 📱 Smaller padding on mobile
                    borderRadius: "18px",
                    background:
                      "linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))",
                    border: "1px solid rgba(255,255,255,0.08)",
                    textAlign: "center",
                    boxShadow: "0 14px 45px rgba(0,0,0,0.18)",
                    transition: "all 0.35s ease",
 
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    pb: { xs: 4, md: 4 }, // Ensure bottom padding


                    "&:hover": {
                      transform: "translateY(-10px)",
                      background:
                        "linear-gradient(180deg,#97ba3a,#2b6d2a)",
                      boxShadow: "0 25px 70px rgba(0,0,0,0.25)",
                    },
                  }}
                >
                  {/* ✅ Icon Badge */}
                  <Box
                    sx={{
                      width: 70,
                      height: 70,
                      borderRadius: "50%",
                      mb: 3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#fff",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                      flexShrink: 0,
                    }}
                  >
                    <Box
                      sx={{
                        color: "#2b6d2a",
                        "& svg": { fontSize: 34 },
                      }}
                    >
                      {item.icon}
                    </Box>
                  </Box>

                  {/* ✅ Title (Fixed Space) */}
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "18px",
                      mb: 2,
                      color: "#fff",
                      fontFamily: "'Poppins', sans-serif",
                      minHeight: 50, // ✅ SAME TITLE SPACE
                    }}
                  >
                    {item.title}
                  </Typography>

                  {/* ✅ Description */}
                  <Typography
                    sx={{
                      fontSize: "14px",
                      lineHeight: 1.8,
                      color: "rgba(255,255,255,0.85)",
                      flexGrow: 1,
                    }}
                  >
                    {item.desc}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* ================= CLOSING LINE ================= */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          transition={{ duration: 0.25 }}
          viewport={{ once: true, margin: '0px 0px 900px 0px' }}
        >
          <Typography
            sx={{
              textAlign: "center",
              mt: 10,
              fontSize: { xs: "14px", md: "16px" },
              color: "rgba(255,255,255,0.9)",
              maxWidth: 720,
              mx: "auto",
              fontWeight: 500,
            }}
          >
            We don’t just deliver services — we become a dependable extension of
            your business.
          </Typography>
        </motion.div>
      </Container>
    </Box>
  );
};

export default FeatureHighlightSection;

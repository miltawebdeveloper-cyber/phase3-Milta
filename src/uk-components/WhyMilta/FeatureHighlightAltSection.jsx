import React from "react";
import { Box, Container, Grid, Typography, Divider } from "@mui/material";
import VerifiedIcon from "@mui/icons-material/Verified";
import GroupsIcon from "@mui/icons-material/Groups";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SecurityIcon from "@mui/icons-material/Security";
import SettingsIcon from "@mui/icons-material/Settings";
import HandshakeIcon from "@mui/icons-material/Handshake";
import { motion } from "framer-motion";

const features = [
  {
    Icon: VerifiedIcon,
    title: "UK-Focused Expertise",
    desc: "Services aligned with UK accounting, tax, and compliance requirements to ensure accuracy and peace of mind.",
  },
  {
    Icon: GroupsIcon,
    title: "Experienced Professional Teams",
    desc: "Qualified accountants, bookkeepers, and support professionals dedicated to your business.",
  },
  {
    Icon: VisibilityIcon,
    title: "Transparent Communication",
    desc: "Clear reporting, regular updates, and a dedicated point of contact at every stage.",
  },
  {
    Icon: SecurityIcon,
    title: "Secure & Compliant Processes",
    desc: "Strong data protection, documented workflows, and strict confidentiality controls.",
  },
  {
    Icon: SettingsIcon,
    title: "Flexible Service Models",
    desc: "Easily scale services up or down as your business needs change.",
  },
  {
    Icon: HandshakeIcon,
    title: "Long-Term Partnership Approach",
    desc: "We work as a dependable extension of your business, not just a service provider.",
  },
];

const fade = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const FeatureHighlightAltSection = () => {
  return (
    <Box component="section" sx={{ width: "100%", bgcolor: "transparent" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography sx={{ fontWeight: 700, color: "#2b6d2a", textAlign: "center", mb: 2 }}>
          Why UK Businesses Choose Milta
        </Typography>
        <Typography sx={{ textAlign: "center", color: "rgba(0,0,0,0.7)", mb: 4 }}>
          Practical outsourced accounting and bookkeeping designed for growing UK businesses.
        </Typography>

        <Grid container spacing={3}>
          {features.map((f, i) => (
            <Grid size={{ xs: 12 }} key={i}>
              <motion.div initial="hidden" whileInView="visible" variants={fade} transition={{ duration: 0.25, delay: Math.min(i * 0.06, 0.15) }} viewport={{ once: true, margin: '0px 0px 900px 0px' }}>
                <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", bgcolor: "rgba(255,255,255,0.02)", p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                  <Box sx={{ minWidth: 68, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Box sx={{ width: 56, height: 56, borderRadius: 2, background: "#f3f8ef", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <f.Icon sx={{ color: '#2b6d2a', fontSize: 28 }} />
                    </Box>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{f.title}</Typography>
                    <Typography sx={{ color: 'rgba(15,23,42,0.7)', mt: 0.5 }}>{f.desc}</Typography>
                  </Box>
                </Box>
              </motion.div>
              {i < features.length - 1 && <Divider sx={{ my: 2 }} />}
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default FeatureHighlightAltSection;

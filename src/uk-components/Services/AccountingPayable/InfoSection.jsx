// src/components/InfoSection.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/* ✅ Outline Icons (Premium Style) */
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import DevicesOutlinedIcon from "@mui/icons-material/DevicesOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import AccountsPayableImage from "../../../assets/accounts-payable.webp";

/* Features */
const features = [
  {
    icon: <BusinessCenterOutlinedIcon />,
    title: "Outsource Accounts Payable to Industry Experts",
    description:
      "Our global experience enables us to deliver reliable accounts payable outsourcing services that reduce operational workload while maintaining accuracy and compliance.",
  },
  {
    icon: <PeopleAltOutlinedIcon />,
    title: "Streamlined Invoice & Approval Workflows",
    description:
      "We streamline invoice intake and approval workflows by implementing controlled access and approval hierarchies that reduce errors and improve turnaround time.",
  },
  {
    icon: <DevicesOutlinedIcon />,
    title: "Reduced Manual Effort & Faster Processing",
    description:
      "By reducing manual intervention and processing delays, we help businesses improve invoice prioritisation and vendor management efficiency.",
  },
  {
    icon: <WorkOutlineOutlinedIcon />,
    title: "Comprehensive Payables Management",
    description:
      "Our services include purchase order validation, transaction posting, invoice mapping, supplier statement reconciliation, salary-related payables, and data verification.",
  },
  {
    icon: <AccountBalanceOutlinedIcon />,
    title: "Accuracy That Strengthens Vendor Relationships",
    description:
      "High accuracy enables timely invoice clearance, avoids late fees, and strengthens vendor relationships—allowing leadership teams to focus on strategic growth.",
  },
];

const InfoSection = () => {
  const [expanded, setExpanded] = useState(null);

  const handleAccordionChange = (panel) => (_, isExpanded) => {
    setExpanded(isExpanded ? panel : null);
  };

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 9, md: 11 },
        backgroundColor: "#fff",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={6} sx={{ alignItems: "center", flexDirection: { xs: "column-reverse", md: "row" } }}>
          {/* LEFT COLUMN */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ maxWidth: 560, mx: { xs: "auto", md: 0 } }}>
              {/* Label */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 2,
                  justifyContent: { xs: "center", md: "flex-start" },
                }}
              >
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    backgroundColor: "#97ba3a",
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: "#2b6d2a",
                  }}
                >
                  Why Miltafs
                </Typography>
              </Box>

              {/* Heading */}
              <Typography
                sx={{
                  fontSize: { xs: 28, sm: 34, md: 44 },
                  fontWeight: 600,
                  lineHeight: 1.2,
                  mb: 3,
                  textAlign: { xs: "center", md: "left" },
                  fontFamily: "'Poppins', sans-serif",
                  color: "#2b6d2a",
                }}
              >
                Your Trusted Accounts Payable Outsourcing
                <br />
                Partner
              </Typography>

              {/* Description */}
              <Typography
                sx={{
                  color: "#555",
                  lineHeight: 1.8,
                  mb: 4,
                  textAlign: { xs: "center", md: "left" },
                  fontSize: { xs: 14.5, md: 15.5 },
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                As one of the reliable accounts payable outsourcing companies,
                Miltafs provides customised outsourcing models based on your
                business size, transaction volume, and industry requirements.
                Our accounts payable outsourcing services integrate seamlessly
                with your existing systems, ensuring minimal disruption and
                maximum efficiency.
              </Typography>

              {/* Accordion List */}
              {features.map((item, index) => (
                <Accordion
                  key={index}
                  expanded={expanded === index}
                  onChange={handleAccordionChange(index)}
                  disableGutters
                  sx={{
                    mb: 2,
                    borderRadius: "18px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "none",
                    overflow: "hidden",

                    "&:before": { display: "none" },

                    "&:hover": {
                      borderColor: "#97ba3a",
                      boxShadow: "0px 10px 25px rgba(0,0,0,0.08)",
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      <ExpandMoreIcon
                        sx={{
                          color: "#97ba3a",
                        }}
                      />
                    }
                    sx={{
                      px: 1.5,
                      py: 0,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      {/* Icon */}
                      <Box
                        sx={{
                          fontSize: 26,
                          color: "#97ba3a",
                        }}
                      >
                        {item.icon}
                      </Box>

                      {/* Title */}
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: 14.5, md: 15.5 },
                          color: "#2b6d2a",
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        {`0${index + 1}. ${item.title}`}
                      </Typography>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails sx={{ px: 2.5, pb: 2 }}>
                    <Typography
                      sx={{
                        color: "#666",
                        fontSize: { xs: 13.5, md: 14.5 },
                        lineHeight: 1.7,
                      }}
                    >
                      {item.description}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Grid>

          {/* RIGHT COLUMN IMAGE */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              component="img"
              src={AccountsPayableImage}
              alt="Accounts Payable Outsourcing Services"
              sx={{
                width: "100%",
                maxWidth: 480,
                height: { xs: 280, sm: 360, md: 560 },
                borderRadius: "24px",
                objectFit: "cover",
                boxShadow: "0px 24px 60px rgba(0,0,0,0.12)",
                mx: { xs: "auto", md: "unset" },
              }}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default InfoSection;

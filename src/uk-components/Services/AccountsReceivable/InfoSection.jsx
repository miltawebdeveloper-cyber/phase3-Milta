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
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import DevicesIcon from "@mui/icons-material/Devices";
import WorkIcon from "@mui/icons-material/Work";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

// Freepik image
const BookkeepingImage =
  "https://img.freepik.com/free-photo/business-people-working-finance-accounting-analyze-financi_74952-1399.jpg?w=1380&t=st=1695523542~exp=1695524142~hmac=eeff9c94c013f9c3748676f5ff50fce7eecf28db3b7018a6c707b5e0349efc3a";

// Features
const features = [
  {
    icon: <BusinessCenterIcon sx={{ color: "#FFBF69", mr: 1 }} />,
    title: "Proven Industry Experience",
    description:
      "With years of experience supporting UK small businesses, we understand industry-specific bookkeeping needs across retail, hospitality, professional services, e-commerce, and more.",
  },
  {
    icon: <PeopleAltIcon sx={{ color: "#FFBF69", mr: 1 }} />,
    title: "Expert Bookkeeping Team",
    description:
      "Our skilled professionals follow best practices and stay updated with UK accounting standards to deliver the best bookkeeping for small business needs.",
  },
  {
    icon: <DevicesIcon sx={{ color: "#FFBF69", mr: 1 }} />,
    title: "Modern Technology & Real-Time Access",
    description:
      "We use advanced tools to provide secure access, real-time updates, and accurate reporting, keeping you informed at all times.",
  },
  {
    icon: <WorkIcon sx={{ color: "#FFBF69", mr: 1 }} />,
    title: "Bookkeeping That Fits Your Business",
    description:
      "Every business works differently, and your bookkeeping should too. We tailor our services to suit your size, industry, and day-to-day needs.",
  },
  {
    icon: <AccountBalanceIcon sx={{ color: "#FFBF69", mr: 1 }} />,
    title: "Everything Covered, One Trusted Team",
    description:
      "From everyday bookkeeping and payroll to clear financial reports and year-end support, Miltafs looks after it all with one reliable team handling your finances.",
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
        padding: { xs: "70px 0", md: "120px 0" }, // from --uk-section-padding
        backgroundColor: "#ffffff",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={6} sx={{ alignItems: "center", flexDirection: { xs: "column-reverse", md: "row" } }}>
          {/* LEFT COLUMN */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Box
              sx={{
                maxWidth: { xs: "100%", md: 550 },
                mx: { xs: "auto", md: 0 },
              }}
            >
              {/* Small Label */}
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
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "#97ba3a", // uk-secondary
                  }}
                />

                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: "15px",
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  Why Miltafs
                </Typography>
              </Box>

              {/* Main Heading */}
              <Typography
                sx={{
                  fontSize: { xs: "30px", sm: "38px", md: "52px" }, // h1 sizes
                  fontWeight: 700,
                  lineHeight: 1.2,
                  mb: 3,
                  textAlign: { xs: "center", md: "left" },
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Why Miltafs Is a Trusted
                <br />
                Bookkeeping Company in the UK
              </Typography>

              {/* Description */}
              <Typography
                sx={{
                  fontSize: { xs: "14px", sm: "15px", md: "16px" },
                  color: "rgba(0,0,0,0.75)",
                  lineHeight: 1.75,
                  mb: 4,
                  textAlign: { xs: "center", md: "left" },
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Whether you’re looking for dependable bookkeeping services in the
                UK, practical bookkeeping support for small businesses, or a
                trusted local bookkeeping service, Miltafs is here to make
                managing your finances easier.
              </Typography>

              {/* Accordion Feature List */}
              {features.map((item, index) => (
                <Accordion
                  key={index}
                  expanded={expanded === index}
                  onChange={handleAccordionChange(index)}
                  sx={{
                    mb: 2,
                    borderRadius: "16px", // uk-radius
                    boxShadow: "0 6px 18px rgba(0,0,0,0.08)", // uk-shadow
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {item.icon}

                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: { xs: "14px", md: "15px" },
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        {`0${index + 1}. ${item.title}`}
                      </Typography>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails>
                    <Typography
                      sx={{
                        color: "#666",
                        fontSize: { xs: "13px", md: "14px" },
                        lineHeight: 1.6,
                        fontFamily: "'Poppins', sans-serif",
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
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              component="img"
              src={BookkeepingImage}
              alt="Bookkeeping Services"
              sx={{
                width: "100%",
                maxWidth: { xs: 300, sm: 400, md: 550 },
                height: { xs: 250, sm: 350, md: 600 },
                borderRadius: "16px",
                boxShadow: "0px 24px 60px rgba(0,0,0,0.08)",
                objectFit: "cover",
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

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

/* ✅ Outline Icons */
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import DevicesOutlinedIcon from "@mui/icons-material/DevicesOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import BookkeepingImage from "../../../assets/BookkeepingImage.jpg";

/* Features */
const features = [
  {
    icon: <BusinessCenterOutlinedIcon />,
    title: "Proven Industry Experience",
    description:
      "With years of experience supporting UK small businesses, we understand industry-specific bookkeeping needs across retail, hospitality, professional services, e-commerce, and more.",
  },
  {
    icon: <PeopleAltOutlinedIcon />,
    title: "Expert Bookkeeping Team",
    description:
      "Our skilled professionals follow best practices and stay updated with UK accounting standards to deliver the best bookkeeping for small business needs.",
  },
  {
    icon: <DevicesOutlinedIcon />,
    title: "Modern Technology & Real-Time Access",
    description:
      "We use advanced tools to provide secure access, real-time updates, and accurate reporting, keeping you informed at all times.",
  },
  {
    icon: <WorkOutlineOutlinedIcon />,
    title: "Bookkeeping That Fits Your Business",
    description:
      "Every business works differently, and your bookkeeping should too. We tailor our services to suit your size, industry, and day-to-day needs.",
  },
  {
    icon: <AccountBalanceOutlinedIcon />,
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
                Why Miltafs Is a Trusted
                <br />
                Bookkeeping Company in the UK
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
                Whether you’re looking for dependable bookkeeping services in the
                UK, practical support for small businesses, or a trusted local
                bookkeeping partner, Miltafs is here to make managing finances
                simple and stress-free.
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
              src={BookkeepingImage}
              alt="Bookkeeping Services"
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

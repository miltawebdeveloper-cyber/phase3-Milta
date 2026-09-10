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

/* Icons */
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import Virtual from "../../../assets/virtual-assistant-services.webp"; 


/* Features */
const features = [
  {
    icon: <SavingsOutlinedIcon />,
    title: "Cost Efficiency",
    description:
      "Reduce recruitment, training, and employment costs by outsourcing to a virtual assistant in the UK. You only pay for the hours or services you need, gaining high-quality support without long-term overheads.",
  },
  {
    icon: <SpeedOutlinedIcon />,
    title: "Improved Productivity",
    description:
      "Free up your time to focus on core business activities by delegating repetitive and time-consuming tasks to experienced virtual assistants who support your day-to-day operations.",
  },
  {
    icon: <TuneOutlinedIcon />,
    title: "Flexibility & Scalability",
    description:
      "As your business evolves, easily scale virtual assistant services up or down. We adapt to changing workloads and customise workflows to suit your internal processes.",
  },
  {
    icon: <SupportAgentOutlinedIcon />,
    title: "Expert Support",
    description:
      "Gain access to UK-trained professionals specialising in administration, virtual bookkeeping services, and accounting support.",
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
        /* SECTION PADDING FROM VARIABLES */
        py: { xs: "70px", md: "80px" },

        backgroundColor: "#ffffff",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          px: { xs: "12px", sm: "16px", md: "24px" },
        }}
      >
        <Grid container spacing={6} sx={{ alignItems: "center", flexDirection: { xs: "column-reverse", md: "row" } }}>
          {/* LEFT COLUMN */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Box
              sx={{
                maxWidth: "560px",
                mx: { xs: "auto", md: 0 },
              }}
            >
              {/* Label */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  mb: 2,
                  justifyContent: { xs: "center", md: "flex-start" },
                }}
              >
                {/* Dot */}
                <Box
                  sx={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    backgroundColor: "#97ba3a", // secondary
                  }}
                />

                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: "#2b6d2a", // primary
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  Virtual Assistant Services
                </Typography>
              </Box>

              {/* Heading */}
              <Typography
                sx={{
                  fontSize: { xs: "28px", sm: "34px", md: "44px" },
                  fontWeight: 700,
                  lineHeight: 1.2,
                  mb: 3,
                  textAlign: { xs: "center", md: "left" },

                  fontFamily: "'Poppins', sans-serif",
                  color: "#2b6d2a",
                }}
              >
                Benefits of Virtual Assistant Services
                <br />
                in the UK
              </Typography>

              {/* Description */}
              <Typography
                sx={{
                  color: "#555",
                  lineHeight: 1.8,
                  mb: 4,
                  textAlign: { xs: "center", md: "left" },

                  fontSize: { xs: "14.5px", md: "15.5px" },
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Partnering with Miltafs gives your business a competitive edge
                through reliable and scalable virtual assistant services in the
                UK. Our support helps reduce workload, improve efficiency, and
                maintain operational control without increasing internal costs.
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

                    transition: "0.3s ease",

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
                      px: 2,
                      py: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      {/* Icon */}
                      <Box
                        sx={{
                          fontSize: "26px",
                          color: "#97ba3a",
                        }}
                      >
                        {item.icon}
                      </Box>

                      {/* Title */}
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: "14.5px", md: "15.5px" },
                          color: "#2b6d2a",
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        {`0${index + 1}. ${item.title}`}
                      </Typography>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails
                    sx={{
                      px: 2.5,
                      pb: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#666",
                        fontSize: { xs: "13.5px", md: "14.5px" },
                        lineHeight: 1.7,
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
          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              component="img"
              src={Virtual}
              alt="Virtual Assistant Services UK"
              sx={{
                width: "100%",
                maxWidth: "480px",

                height: { xs: "280px", sm: "360px", md: "560px" },

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

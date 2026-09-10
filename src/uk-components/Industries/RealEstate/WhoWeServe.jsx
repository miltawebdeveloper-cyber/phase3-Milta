// src/components/BenefitsSection.jsx
import React from "react";
import { Box, Typography, Container, Grid } from "@mui/material";

// ✅ Real Estate Icons
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import BusinessIcon from "@mui/icons-material/Business";
import ApartmentIcon from "@mui/icons-material/Apartment";
import PublicIcon from "@mui/icons-material/Public";

const serveList = [
  {
    title: "Residential Real Estate",
    desc: "We deliver accurate property management bookkeeping, including detailed rent monitoring, secure handling of tenant deposits, and thorough expense oversight for property management firms, real estate investors, and private landlords.",
    icon: <HomeWorkIcon />,
  },
  {
    title: "Commercial Real Estate",
    desc: "Our specialised accounting services for real estate cover complex lease structures, CAM reconciliations, operating expenses, tenant improvements, and financial reporting for commercial portfolios.",
    icon: <BusinessIcon />,
  },
  {
    title: "Property Management Companies",
    desc: "We deliver structured property management accounting solutions using cloud-based systems such as QuickBooks for property management, ensuring transparent reporting and smooth day-to-day operations.",
    icon: <ApartmentIcon />,
  },
  {
    title: "Real Estate Accounting Services for Overseas Firms",
    desc: "Our outsourced solutions are built to help international property businesses reduce costs while improving financial accuracy and compliance.",
    icon: <PublicIcon />,
  },
];

const BenefitsSection = () => {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 10, md: 6 },
        backgroundColor: "#2b6d2a",
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            maxWidth: 1200,
            mx: "auto",
            textAlign: "center",
            color: "#fff",
          }}
        >
          {/* Heading */}
          <Typography
            sx={{
              fontSize: { xs: 34, md: 46 },
              fontWeight: 700,
              lineHeight: 1.18,
              mb: 3,
              color: "#fff",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Who We Serve
          </Typography>

          {/* Description */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              mb: 5,
              justifyContent: "center",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                lineHeight: 1.75,
                maxWidth: 750,
                color: "#f0f0f0",
              }}
            >
              Our real estate accounting services at Milta are intended to
              streamline processes and offer total financial transparency.
            </Typography>
          </Box>

          {/* Serve List */}
          <Grid container spacing={3} sx={{ justifyContent: "center" }}>
            {serveList.map((item, index) => (
              <Grid size={{ xs: 12, sm: 6 }} key={index}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    p: 2.8,
                    maxWidth: "500px",
                    height: "220px",
                    borderRadius: 2,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.15)",
                      transform: "translateY(-3px)",
                    },
                  }}
                >
                  {/* ✅ Icon */}
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(151,186,58,0.18)",
                      color: "#97ba3a",
                      flexShrink: 0,
                    }}
                  >
                    {React.cloneElement(item.icon, {
                      sx: { fontSize: 26 },
                    })}
                  </Box>

                  {/* Text */}
                  <Box sx={{ textAlign: "left" }}>
                    <Typography
                      sx={{
                        fontSize: 18,
                        fontWeight: 700,
                        mb: 1,
                        color: "#fff",
                      }}
                    >
                      {item.title}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: 15,
                        lineHeight: 1.6,
                        color: "#f0f0f0",
                      }}
                    >
                      {item.desc}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default BenefitsSection;

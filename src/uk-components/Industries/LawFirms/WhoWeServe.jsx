// src/components/BenefitsSection.jsx
import React from "react";
import { Box, Typography, Container, Grid } from "@mui/material";

// ✅ Legal Support Icons
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PersonIcon from "@mui/icons-material/Person";
import GavelIcon from "@mui/icons-material/Gavel";

const serveList = [
  {
    title: "Law Firms",
    desc: "We provide comprehensive law firm accounting solutions to simplify client account management, billing, payroll, and expense tracking. Our structured legal bookkeeping services improve financial transparency while meeting strict regulatory standards.",
    icon: <AccountBalanceIcon />,
  },
  {
    title: "Solo Practitioners & Independent Solicitors",
    desc: "Managing a practice alone can be demanding. You can devote more time to your clients and casework since our specialized bookkeeping for lawyers makes sure your accounts stay correct and compliant.",
    icon: <PersonIcon />,
  },
  {
    title: "Litigation Support & Legal Service Providers",
    desc: "Complex billing structures and case-based finances require precision. Our legal accounting and law firm bookkeeping expertise ensures accurate records, smooth billing cycles, and improved cash flow management.",
    icon: <GavelIcon />,
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
            Who We Support
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
              Our best bookkeeping services for law firms help streamline
              financial management while ensuring regulatory compliance.
            </Typography>
          </Box>

          {/* Support List */}
          <Grid container spacing={3} sx={{ justifyContent: "center" }}>
            {serveList.map((item, index) => (
              <Grid size={{ xs: 12, sm: 6 }} key={index}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    p: 2.5,
                    maxWidth: "450px",
                    height: "220px",
                    borderRadius: 2,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.15)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  {/* ✅ Icon */}
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(151,186,58,0.15)",
                      color: "#97ba3a",
                      flexShrink: 0,
                    }}
                  >
                    {React.cloneElement(item.icon, {
                      sx: { fontSize: 24 },
                    })}
                  </Box>

                  {/* Text */}
                  <Box sx={{ textAlign: "left" }}>
                    <Typography
                      sx={{
                        fontSize: 18,
                        fontWeight: 700,
                        mb: 0.8,
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

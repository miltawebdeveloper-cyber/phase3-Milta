// src/components/GlobalClientsSection.jsx
import React from "react";
import { Box, Typography, Container, Grid } from "@mui/material";

// Replace these URLs with your actual client logos
const clientLogos = [
  "https://cdn-icons-png.flaticon.com/512/733/733585.png", // Example logo 1
  "https://cdn-icons-png.flaticon.com/512/888/888879.png", // Example logo 2
  "https://cdn-icons-png.flaticon.com/512/1055/1055646.png", // Example logo 3
  "https://cdn-icons-png.flaticon.com/512/888/888841.png", // Example logo 4
  "https://cdn-icons-png.flaticon.com/512/888/888839.png", // Example logo 5
];

const GlobalClientsSection = () => {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: "#153D26", // dark green like your screenshot
        color: "#fff",
        textAlign: "center",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="subtitle2"
          sx={{ color: "#FFA500", mb: 2, fontWeight: 600 }}
        >
          ●  Global Clients
        </Typography>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 6,
            fontSize: { xs: "1.8rem", sm: "2.2rem", md: "2.5rem" },
          }}
        >
          We’ve Lots Of Global Clients <br /> Meet Premium Brands
        </Typography>

        {/* Logos */}
        <Grid container spacing={4} sx={{ justifyContent: "center", alignItems: "center" }}>
          {clientLogos.map((logo, index) => (
            <Grid size={{ xs: 6, sm: 4, md: 2 }} key={index}>
              <Box
                component="img"
                src={logo}
                alt={`Client ${index + 1}`}
                sx={{
                  maxWidth: "120px",
                  width: "100%",
                  filter: "brightness(0) invert(1)", // optional: make logos white if needed
                  mx: "auto",
                  display: "block",
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default GlobalClientsSection;

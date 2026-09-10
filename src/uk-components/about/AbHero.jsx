// src/pages/AboutUs.jsx
import React from "react";
import { Box, Typography, Container, Breadcrumbs, Link } from "@mui/material";
import CurrentCrumb from '../../components/CurrentCrumb';

const heroImage =
  "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&h=750&w=1260";

const AboutUs = () => {
  return (
    <Box component="main">
      {/* ================= HERO SECTION ================= */}
      <Box
        component="section"
        sx={{
          position: "relative",
          width: "100%",
          minHeight: { xs: "60vh", md: "60vh" },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "#fff",
          textAlign: "center",
          fontFamily: "'Poppins', sans-serif",
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay */}

        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(9, 58, 4, 0.6)",
            zIndex: 0,
          }}
        />



        {/* Content */}
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
              mb: 2,
            }}
          >
            About Company
          </Typography>

          <Breadcrumbs
            aria-label="breadcrumb"
            sx={{
              color: "#ffb966",
              fontFamily: "'Poppins', sans-serif",
              justifyContent: "center",
              display: "flex",
              "& .MuiBreadcrumbs-separator": { color: "#fff" },
            }}
          >
            <Link underline="hover" color="inherit" href="/">
              Home
            </Link>
            <CurrentCrumb color="#ffb966">About Company</CurrentCrumb>
          </Breadcrumbs>
        </Container>
      </Box>


    </Box>
  );
};

export default AboutUs;

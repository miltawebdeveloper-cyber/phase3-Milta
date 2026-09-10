// src/uk-components/Industries/Ecommerce/Strategies.jsx
import React from "react";
import { Box, Typography, Container, Grid } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const serveList = [
  {
    id: "inventory-management",
    title: "Smarter Inventory Management",
    desc: "We help monitor stock levels, track cost of goods sold, and support pricing strategies to improve profitability and reduce excess inventory.",
  },
  {
    id: "multi-platform-accounting",
    title: "Multi-Platform Accounting Made Simple",
    desc: "Selling across Amazon, Shopify, WooCommerce, or other channels? We integrate your data into a single, accurate accounting system—no duplication, no confusion.",
  },
  {
    id: "cash-flow-control",
    title: "Cash Flow Control for Online Sellers",
    desc: "We provide practical insights into cash flow patterns, helping you plan stock purchases, marketing spend, and expansion with confidence.",
  },
];

const Strategies = () => {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 6, sm: 8, md: 6 },
        px: { xs: 1.5, sm: 2.5 },
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
              fontSize: { xs: 22, sm: 28, md: 44 },
              fontWeight: 700,
              lineHeight: 1.25,
              mb: { xs: 2.5, sm: 3, md: 3 },
              fontFamily: "'Poppins', sans-serif",
             color: "#fff",
            }}
          >
            Customized Financial Strategies for Ecommerce Growth
          </Typography>

          {/* Serve List */}
          <Grid container spacing={3} sx={{ justifyContent: "center" }}>
            {serveList.map((item) => (
              <Grid size={{ xs: 12, sm: 6 }} key={item.id} id={item.id}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    p: 2.5,
                    maxWidth: "450px",
                    height: "200px",
                    borderRadius: 2,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.15)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <CheckCircleIcon
                    sx={{
                      fontSize: 24,
                      color: "#97ba3a",
                      
                      mt: 0.25,
                    }}
                  />

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

export default Strategies;

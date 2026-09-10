// src/components/BenefitsSection.jsx
import React from "react";
import { Box, Typography, Container, Grid } from "@mui/material";

// ✅ Platform Icons
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LanguageIcon from "@mui/icons-material/Language";

const serveList = [
  {
    title: "Amazon Sellers",
    desc: "Whether you’re a solo seller or a growing brand, we help manage Amazon-specific challenges such as sales reconciliation, inventory tracking, VAT support, and accurate ecommerce bookkeeping services.",
    icon: <ShoppingCartIcon />,
  },
  {
    title: "Shopify Sellers",
    desc: "Our Shopify bookkeeping services help Shopify sellers maintain clean accounts, manage cash flow effectively, and gain clear financial insights to support informed business decisions and sustainable growth.",
    icon: <StorefrontIcon />,
  },
  {
    title: "WooCommerce Sellers",
    desc: "We support WooCommerce businesses by streamlining accounting workflows, maintaining accurate financial records, and delivering insights that help scale operations confidently.",
    icon: <LanguageIcon />,
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
                maxWidth: 700,
                color: "#f0f0f0",
              }}
            >
              We work with ecommerce sellers across leading online platforms,
              providing customized accounting and support services.
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
                  {/* ✅ Icon Instead of Tick */}
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

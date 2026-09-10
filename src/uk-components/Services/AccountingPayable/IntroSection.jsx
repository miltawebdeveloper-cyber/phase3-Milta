// src/components/AccountsPayableIntroSection.jsx
import React from "react";
import { Box, Typography, Container, Button, Grid } from "@mui/material";
import accountsPayable from "../../../assets/accountsPayable.jpg";
import { Link as RouterLink } from "react-router-dom";

const AccountsPayableIntroSection = () => {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 10, md: 12 },
        backgroundColor: "#fff",
      }}
    >
      <Container maxWidth="lg">
        <Grid
          container
          spacing={6}
         
        >
          
          {/* ================= LEFT SIDE (TEXT) ================= */}
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex", justifyContent: "center" }}>
            <Box sx={{ maxWidth: 600, width: "100%" }}>
              
              {/* Section Label */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 3,
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "#97ba3a",
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Accounts Payable Services
                </Typography>
              </Box>

              {/* Heading */}
              <Typography
                sx={{
                  fontSize: { xs: 28, sm: 34, md: 44 },
                  fontWeight: 700,
                  lineHeight: 1.2,
                  mb: 4,
                  fontFamily: "'Poppins', sans-serif",
                  color: "#2b6d2a",
                }}
              >
                Stress-Free Accounts Payable Services
                <br />
                for UK Businesses
              </Typography>

              {/* Description */}
              <Typography
                variant="body2"
                sx={{
                  color: "#666",
                  lineHeight: 1.8,
                  mb: 4,
                }}
              >
                Managing accounts payable is more than just paying bills; it’s about
                maintaining healthy cash flow, protecting supplier relationships,
                and staying compliant with UK financial regulations. From tracking
                multiple invoice due dates to validating supplier details and payment
                terms, the accounts payable process can quickly become complex and
                time-consuming.
                <br />
                <br />
                At Milta, we deliver end-to-end accounts payable solutions that remove
                operational pressure from your finance team. Our fully managed
                accounts payable services ensure that every invoice is accurately
                recorded, approved, and paid on time. When you outsource accounts
                payable to our specialists, you gain better financial visibility,
                reduced errors, and a smoother cash flow cycle — without increasing
                internal workload.
              </Typography>

              {/* CTA Buttons */}
              <Box
                sx={{
                  display: "flex",
                  gap: 3,
                  flexWrap: "wrap",
                }}
              >
                <Button
                component={RouterLink}
                to="/uk/services"
                  variant="contained"
                  sx={{
                    px: 4,
                    py: 1.6,
                    fontWeight: 600,
                    borderRadius: 2,
                    backgroundColor: "#2b6d2a",
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "#2b6d2a",
                      opacity: 0.9,
                    },
                  }}
                >
                  Get Started
                </Button>

                <Button
  component={RouterLink}
  to="/uk/contact"
  variant="outlined"
  sx={{
    px: 4,
    py: 1.6,
    fontWeight: 600,
    borderRadius: 2,
    textTransform: "none",
    borderColor: "#2b6d2a",
    color: "#2b6d2a",
    "&:hover": {
      borderColor: "#2b6d2a",
      backgroundColor: "rgba(0,0,0,0.03)",
    },
  }}
>
  Book a Call
</Button>
              </Box>

            </Box>
          </Grid>

          {/* ================= RIGHT SIDE (IMAGE) ================= */}
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex", justifyContent: "center" }}>
            <Box
              component="img"
              src={accountsPayable}
              alt="Accounts Payable Services"
              sx={{
                maxWidth: 500,
                width: "100%",
                borderRadius: "20px",
                boxShadow: "0 25px 60px rgba(0,0,0,0.12)",
                objectFit: "cover",
              }}
            />
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
};

export default AccountsPayableIntroSection;
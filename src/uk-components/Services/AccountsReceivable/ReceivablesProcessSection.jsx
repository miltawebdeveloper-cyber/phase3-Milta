// src/uk-components/Services/Receivables/ReceivablesInsightsSection.jsx

import React from "react";
import { Box, Container, Grid, Typography } from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import BusinessIcon from "@mui/icons-material/Business";
import PaymentsIcon from "@mui/icons-material/Payments";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import VerifiedIcon from "@mui/icons-material/Verified";
import SecurityIcon from "@mui/icons-material/Security";

const tools = [
    { name: "QuickBooks Accounts Receivable", icon: <ReceiptLongIcon /> },
  { name: "Xero", icon: <CurrencyExchangeIcon /> },
  { name: "Zoho Books", icon: <AnalyticsIcon /> },
  { name: "Sage", icon: <AccountBalanceIcon /> },
  { name: "Bill.com", icon: <PaymentsIcon /> },
  { name: "FreshBooks", icon: <BusinessIcon /> },
];

const purposePoints = [
  { text: "Consistent cash flow", icon: <TrendingUpIcon /> },
  { text: "Financial stability", icon: <AccountBalanceIcon /> },
  { text: "Improved customer experience", icon: <VerifiedIcon /> },
  { text: "Reduced credit risk", icon: <SecurityIcon /> },
 
];
const ReceivablesInsightsSection = () => {
  return (
    <Box
      sx={{
        py: { xs: 8, sm: 10, md: 7 },
        backgroundColor: "#ffffff",
      }}
    >
      <Container maxWidth="lg">

        {/* ================= TOOLS ================= */}
        <Box textAlign="center" mb={{ xs: 10, md: 14 }}>
          <Typography
            sx={{
              fontSize: { xs: 22, sm: 24, md: 28 },
              fontWeight: 700,
              mb: { xs: 4, md: 6 },
            }}
          >
            Tools & Systems We Use
          </Typography>

          <Grid container spacing={3} sx={{ justifyContent: "center" }}> 
            {tools.map((tool, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index} sx={{ width: "100%", maxWidth:"300px" }}>
                <Box
                  sx={{
                   
                    p: 2,
                    borderRadius: 3,
                    backgroundColor: "#eef4ef",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1.5,
                    transition: "0.3s",
                    "&:hover": {
                      backgroundColor: "#dce9dc",
                      transform: "translateY(-4px)",
                    },
                  }}
                >
                  <Box sx={{ color: "#2b6d2a", fontSize: 32 }}>
                    {tool.icon}
                  </Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                    {tool.name}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* ================= PURPOSE ================= */}
        <Box textAlign="center">
          <Typography
            sx={{
              fontSize: { xs: 22, sm: 24, md: 28 },
              fontWeight: 700,
              mb: { xs: 5, md: 4},
            }}
          >
            The Purpose of Receivables Management
          </Typography>

          <Grid container spacing={3} sx={{ justifyContent: "center" }}>
            {purposePoints.map((point, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    backgroundColor: "#2b6d2a",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    justifyContent: "center",
                    transition: "0.3s",
                    "&:hover": {
                      backgroundColor: "#1f4f1e",
                      transform: "translateY(-4px)",
                    },
                  }}
                >
                  {point.icon}
                  <Typography sx={{ fontWeight: 600, color: "#fff" }}>
                    {point.text}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Typography
            sx={{
              mt: 6,
              fontSize: { xs: 15, md: 16 },
              color: "#555",
              lineHeight: 1.8,
              maxWidth: 700,
              mx: "auto",
            }}
          >
            With Milta Accounting managing your receivables, your business gains
            predictability, efficiency, and complete financial control.
          </Typography>
        </Box>

      </Container>
    </Box>
  );
};

export default ReceivablesInsightsSection;
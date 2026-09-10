// src/uk-components/Services/BookKeeping/UkBookkeepingServicesSection.jsx
import React from "react";
import { Box, Typography, Container, Grid } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const services = [
  {
    title: "Bank and Credit Card Reconciliation",
    desc: "We reconcile your bank and credit card statements regularly, ensuring every transaction is accurately recorded. This prevents errors, identifies discrepancies early, and keeps your books reliable.",
  },
  {
    title: "Cash Flow, Accounts Receivable & Payable Management",
    desc: "Effective cash-flow control is vital for sustainability. We track incoming and outgoing payments, manage receivables and payables, and give you a clear picture of your financial position at all times.",
  },
  {
    title: "Invoice Creation and Recording",
    desc: "We manage invoice generation, payment tracking, and follow-ups to help maintain steady cash inflow. Every invoice and payment is accurately recorded for consistency across your accounts.",
  },
  {
    title: "Chart of Accounts & Bookkeeping System Setup",
    desc: "A well-structured chart of accounts is the foundation of strong bookkeeping. We organise your financial data into clear categories and maintain a structured system for easy access and reporting.",
  },
  {
    title: "Payroll Processing and Compliance",
    desc: "Our payroll and bookkeeping services cover salary calculations, tax deductions, pension contributions, and statutory compliance, ensuring employees are paid correctly and on time.",
  },
  {
    title: "Regular Financial Reporting",
    desc: "We offer weekly, monthly, and annual financial reports detailing income, expenses, profitability, and trends, allowing you to make confident, informed business decisions.",
  },
  {
    title: "Small Business, Non-Profit & Clean-Up Bookkeeping",
    desc: "Whether you’re a growing business, a non-profit, or need historical bookkeeping clean-up, Miltafs has the expertise to get your records back on track.",
  },
  {
    title: "Collaboration with Accountants for Year-End",
    desc: "We work closely with UK accountants to ensure your books are fully prepared for year-end accounts and tax submissions, making the process smooth and efficient.",
  },
];

const UkBookkeepingServicesSection = () => {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: "#fff",
      }}
    >
      <Container maxWidth={false}>
        <Box sx={{ maxWidth: 1200, mx: "auto", textAlign: "center" }}>
          
          {/* SECTION HEADER */}
          <Box sx={{ maxWidth: 750, mx: "auto", mb: { xs: 6, md: 8 } }}>
            
            {/* Small Label */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.5,
                mb: 2,
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
                Services
              </Typography>
            </Box>

            {/* Main Heading */}
            <Typography
              sx={{
                fontSize: { xs: 30, sm: 36, md: 46 },
                fontWeight: 700,
                lineHeight: 1.2,
                mb: 3,
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              End-to-End Bookkeeping and
              <br />
              Financial Organisation
            </Typography>

            {/* Subtitle */}
            <Typography
              sx={{
                color: "#666",
                lineHeight: 1.8,
                maxWidth: 600,
                mx: "auto",
              }}
            >
              Miltafs offers comprehensive bookkeeping solutions to support
              businesses at every stage.
            </Typography>
          </Box>

          {/* SERVICE CARDS GRID */}
          <Grid container spacing={4}>
            {services.map((item, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                <Box
                  sx={{
                    width: "100%",
                    p: 3.5,
                    borderRadius: "18px",
                    backgroundColor: "#1f3d1f",
                    color: "#fff",

                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    gap: 2,

                    transition: "all 0.35s ease",

                    "&:hover": {
                      backgroundColor: "#97ba3a",
                      transform: "translateY(-8px)",
                      boxShadow: "0px 24px 60px rgba(0,0,0,0.25)",
                    },
                  }}
                >
                  {/* Icon */}
                  <CheckCircleIcon sx={{ fontSize: 34 }} />

                  {/* Title */}
                  <Typography
                    sx={{
                      fontSize: 16.8,
                      fontWeight: 700,
                      lineHeight: 1.4,
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    {item.title}
                  </Typography>

                  {/* Description */}
                  <Typography
                    sx={{
                      fontSize: 14,
                      lineHeight: 1.7,
                      color: "rgba(255,255,255,0.9)",
                    }}
                  >
                    {item.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

        </Box>
      </Container>
    </Box>
  );
};

export default UkBookkeepingServicesSection;
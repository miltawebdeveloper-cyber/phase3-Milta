// src/uk-components/Services/BookKeeping/UkBookkeepingServicesSection.jsx
import React from "react";
import { Box, Typography, Container, Grid } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import HandshakeIcon from "@mui/icons-material/Handshake";

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
  const iconMap = {
    "Bank and Credit Card Reconciliation": AccountBalanceIcon,
    "Cash Flow, Accounts Receivable & Payable Management": AccountBalanceWalletRoundedIcon,
    "Invoice Creation and Recording": ReceiptLongIcon,
    "Chart of Accounts & Bookkeeping System Setup": AccountTreeIcon,
    "Payroll Processing and Compliance": PaidRoundedIcon,
    "Regular Financial Reporting": QueryStatsRoundedIcon,
    "Small Business, Non-Profit & Clean-Up Bookkeeping": CleaningServicesIcon,
    "Collaboration with Accountants for Year-End": HandshakeIcon,
  };

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: "#ffffff",
      }}
    >
      <Container maxWidth={false}>
        <Box sx={{ maxWidth: 1300, mx: "auto", textAlign: "center" }}>

          {/* SECTION HEADER */}
          <Box sx={{ maxWidth: 750, mx: "auto", mb: { xs: 6, md: 8 } }}>
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
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 1,
                  justifyContent: "center", // center label
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "#97ba3a",
                    fontsize: "18px",
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Services
                </Typography>
              </Box>
            </Box>

            <Typography
              sx={{
                fontSize: { xs: "28px", sm: "34px", md: "42px" },
                fontWeight: 700,
                lineHeight: 1.2,
                mb: 3,
                fontFamily: "'Poppins', sans-serif",
                color: "#2b6d2a",
              }}
            >
              End-to-End Bookkeeping and
              <br />
              Financial Organisation
            </Typography>

            <Typography
              sx={{
                color: "#666",
                lineHeight: 1.8,
                maxWidth: 600,
                mx: "auto",
                fontFamily: "'Poppins', sans-serif",
                fontSize: "16px",
              }}
            >
              Miltafs offers comprehensive bookkeeping solutions to support businesses at every stage.
            </Typography>
          </Box>

          {/* SERVICE CARDS */}
          <Grid container spacing={4} sx={{ justifyContent: "center" }}>
            {services.map((item, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index} sx={{ display: "flex", justifyContent: "center" }}>
                <Box
                  sx={{
                    maxWidth: 280,
                    width: "100%",
                    p: 3.5,
                    borderRadius: "16px",
                    background: "linear-gradient(180deg, rgba(43,109,42,0.98), rgba(55,125,50,0.98))",
                    color: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    gap: 2,
                    position: "relative",
                    transition: "transform 0.32s ease, box-shadow 0.32s ease, background 0.32s ease",
                    boxShadow: "0 8px 24px rgba(43,109,42,0.06)",
                    "&::before": {
                      content: '\"\"',
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 12,
                      padding: '1px',
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude',
                    },
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: "0 28px 70px rgba(15,23,42,0.14)",
                      background: "linear-gradient(180deg,#97ba3a,#2b6d2a)",
                    },
                  }}
                >
                  {/* Icon Badge */}
                  {(() => {
                    const Icon = iconMap[item.title] || CheckCircleIcon;
                    return (
                      <Box sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg,#ffffff10,#ffffff05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.06), 0 8px 20px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}>
                        <Box sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg,#97ba3a,#2b6d2a)'
                        }}>
                          <Icon sx={{ fontSize: 26, color: '#fff' }} aria-hidden />
                        </Box>
                      </Box>
                    );
                  })()}

                  <Typography
                    sx={{
                      fontSize: 16.5,
                      fontWeight: 600,
                      lineHeight: 1.4,
                      color: "rgba(255,255,255,0.9)",

                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    {item.title}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 14,
                      lineHeight: 1.7,
                      color: "rgba(255,255,255,0.9)",
                      fontFamily: "'Poppins', sans-serif",
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

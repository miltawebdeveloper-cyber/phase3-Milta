// src/components/WhatWeDoSection.jsx
import React from "react";
import { Box, Container, Grid, Typography } from "@mui/material";

/* ✅ Line / Outline Icons */
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import BalanceOutlinedIcon from "@mui/icons-material/BalanceOutlined";
import SyncAltOutlinedIcon from "@mui/icons-material/SyncAltOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";

const services = [
  {
    icon: <LockOutlinedIcon />,
    title: "Secure Data Collection",
    desc: "We collect invoices, receipts, bank statements, payroll records, and other financial documents through secure digital channels to protect sensitive information.",
  },
  {
    icon: <FactCheckOutlinedIcon />,
    title: "Data Verification",
    desc: "Each document is carefully reviewed and cross-checked for accuracy and completeness to eliminate errors and inconsistencies.",
  },
  {
    icon: <AccountTreeOutlinedIcon />,
    title: "Chart of Accounts Setup",
    desc: "We create or refine a structured chart of accounts customised to your business, ensuring every transaction is correctly classified.",
  },
  {
    icon: <BalanceOutlinedIcon />,
    title: "Double-Entry Validation",
    desc: "Our team applies double-entry accounting principles to maintain balanced, compliant, and error-free financial records.",
  },
  {
    icon: <SyncAltOutlinedIcon />,
    title: "Reconciliation",
    desc: "We reconcile bank statements and ledgers regularly to identify discrepancies early and resolve them promptly.",
  },
  {
    icon: <AssessmentOutlinedIcon />,
    title: "Financial Reporting",
    desc: "Clear and accurate reports—including profit & loss statements and balance sheets—give you full visibility into your business performance.",
  },
];

const WhatWeDoSection = () => {
  return (
    <Box
      component="section"
      sx={{
        pt: { xs: 10, md: 3 },
        pb: { xs: 10, md: 3 },
        backgroundColor: "#fff",
      }}
    >
      <Container maxWidth="lg">
        {/* ================= HEADER ================= */}
        <Box sx={{ textAlign: "center", maxWidth: 800, mx: "auto", mb: 10 }}>
          {/* Label */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
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
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: 14,
                color: "#2b6d2a",
              }}
            >
              Our Process
            </Typography>
          </Box>

          {/* Heading */}
          <Typography
            sx={{
              fontSize: { xs: 28, md: 44 },
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#2b6d2a",
              fontFamily: "'Poppins', sans-serif",
              mb: 3,
            }}
          >
            Our Accounting
            <br />
            Data Entry Process
          </Typography>

          {/* Subtitle */}
          <Typography sx={{ color: "#666", fontSize: 16, lineHeight: 1.8 }}>
            We follow a proven, step-by-step process to ensure your financial
            data is handled accurately, securely, and efficiently.
          </Typography>
        </Box>

        {/* ================= PROCESS CARDS ================= */}
        <Grid container spacing={4} sx={{ justifyContent: "center" }}>
          {services.map((item, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index} sx={{ display: "flex", justifyContent: "center" }}>
              <Box
                sx={{
                  backgroundColor: "#2b6d2a",
                  borderRadius: "18px",
                  p: 4,
                  width: "100%",
                  maxWidth: 320,
                  textAlign: "left",
                  minHeight: 230,

                  transition: "all 0.35s ease",
                  boxShadow: "0px 10px 25px rgba(0,0,0,0.10)",

                  "&:hover": {
                    transform: "translateY(-8px)",
                    backgroundColor: "#97ba3a",
                    boxShadow: "0px 20px 45px rgba(0,0,0,0.18)",
                  },
                }}
              >
                {/* Icon Circle */}
                <Box
                  sx={{
                    mb: 3,
                    width: 55,
                    height: 55,
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(255,255,255,0.12)",
                    color: "#fff",
                    fontSize: 34,
                  }}
                >
                  {item.icon}
                </Box>

                {/* Title */}
                <Typography
                  sx={{
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 16.5,
                    mb: 1,
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {item.title}
                </Typography>

                {/* Description */}
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.82)",
                    fontSize: 14,
                    lineHeight: 1.65,
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {item.desc}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default WhatWeDoSection;

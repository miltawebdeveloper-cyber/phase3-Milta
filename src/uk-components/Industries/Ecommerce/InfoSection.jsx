// src/components/InfoSection.jsx
import React from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import DevicesIcon from "@mui/icons-material/Devices";
import WorkIcon from "@mui/icons-material/Work";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

// Freepik image
const BookkeepingImage =
  "https://img.freepik.com/free-photo/business-people-working-finance-accounting-analyze-financi_74952-1399.jpg?w=1380&t=st=1695523542~exp=1695524142~hmac=eeff9c94c013f9c3748676f5ff50fce7eecf28db3b7018a6c707b5e0349efc3a";

// UPDATED FEATURES – Data Entry Benefits
const features = [
  {
    icon: <BusinessCenterIcon sx={{ color: "#FFBF69", mr: 1 }} />,
    title: "Greater Accuracy & Data Validation",
    description:
      "Our data entry services include detailed verification and reconciliation processes, ensuring every financial record is accurate, complete, and error-free.",
  },
  {
    icon: <PeopleAltIcon sx={{ color: "#FFBF69", mr: 1 }} />,
    title: "Better Decision-Making",
    description:
      "Timely and reliable financial data gives you clear visibility into business performance, helping you make informed strategic and operational decisions.",
  },
  {
    icon: <DevicesIcon sx={{ color: "#FFBF69", mr: 1 }} />,
    title: "Regulatory Compliance Assurance",
    description:
      "We follow recognised UK accounting standards and compliance requirements, ensuring your records are audit-ready and fully aligned with regulations.",
  },
  {
    icon: <WorkIcon sx={{ color: "#FFBF69", mr: 1 }} />,
    title: "Improved Time Management",
    description:
      "By outsourcing data entry, your internal team can focus on core business activities instead of time-consuming administrative work.",
  },
  {
    icon: <AccountBalanceIcon sx={{ color: "#FFBF69", mr: 1 }} />,
    title: "Support for Business Growth",
    description:
      "Streamlined data entry processes improve efficiency and scalability, allowing your business to grow without operational bottlenecks.",
  },
];

const InfoSection = () => {
  return (
    <Box
      component="section"
      sx={{
        pt: { xs: 8, md: 8 },pb: { xs: 8, md: 2 },
        backgroundColor: "#fff",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={6} sx={{ alignItems: "center", flexDirection: { xs: "column-reverse", md: "row" } }}>
          {/* LEFT COLUMN - TEXT */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ maxWidth: { xs: "100%", md: 550 }, mx: { xs: "auto", md: 0 } }}>
              {/* Small Label */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 2,
                  justifyContent: { xs: "center", md: "flex-start" },
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
                  Why Choose Our Data Entry Services
                </Typography>
              </Box>

              {/* Main Heading */}
              <Typography
                sx={{
                  fontSize: { xs: 26, sm: 28, md: 40 },
                  fontWeight: 700,
                  lineHeight: 1.2,
                  mb: 3,
                  textAlign: { xs: "center", md: "left" },
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Benefits of Our Data Entry
                <br />
                Services in the UK
              </Typography>

              {/* Description */}
              <Typography
                variant="body2"
                sx={{
                  color: "#666",
                  lineHeight: 1.75,
                  mb: 4,
                  textAlign: { xs: "center", md: "left" },
                  fontSize: { xs: 14, sm: 15, md: 16 },
                }}
              >
                Our professional data entry services help UK businesses maintain accurate
                financial records, improve efficiency, and stay compliant—while freeing
                internal teams to focus on growth.
              </Typography>

              {/* Accordion Feature List */}
              {features.map((item, index) => (
                <Accordion
                  key={index}
                  sx={{
                    mb: 2,
                    borderRadius: 3,
                    boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
                    "& .MuiAccordionSummary-root": { borderRadius: 3 },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={`panel${index}-content`}
                    id={`panel${index}-header`}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {item.icon}
                      <Typography sx={{ fontWeight: 600, fontSize: { xs: 14, md: 15 } }}>
                        {`0${index + 1}. ${item.title}`}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography sx={{ color: "#666", fontSize: { xs: 13, md: 14 } }}>
                      {item.description}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Grid>

          {/* RIGHT COLUMN - IMAGE */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              component="img"
              src={BookkeepingImage}
              alt="Data Entry and Accounting Services"
              sx={{
                width: "100%",
                maxWidth: { xs: 300, sm: 400, md: 550 },
                height: { xs: 250, sm: 350, md: 600 },
                borderRadius: 3,
                boxShadow: "0px 24px 60px rgba(0,0,0,0.08)",
                objectFit: "cover",
                mx: { xs: "auto", md: "unset" },
              }}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default InfoSection;

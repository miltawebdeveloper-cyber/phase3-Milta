import React from "react";
import { Box, Grid, Typography, Container, Card, CardContent } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";

const BenefitsSection = ({
  title = "Benefits of Accounting and Bookkeeping for Contractors",
  benefits = [],
  bgColor = "#F9F9F9",
  maxWidth = "1300px",
}) => {
  return (
    <Box sx={{ pt: { xs: 6, md: 7 }, pb: { xs: 0, md: 0 }, backgroundColor: bgColor }}>
      <Container
        maxWidth={false}
        sx={{
          maxWidth: maxWidth,
          mx: "auto",
          px: { xs: 2, sm: 4, md: 6 },
        }}
      >
        {/* Title */}
        <Typography
          variant="h4"
          sx={{
            textAlign: "center",
            fontWeight: 700,
            color: "#1d4230",
            fontFamily: "'Poppins', sans-serif",
            mb: 6,
          }}
        >
          {title}
        </Typography>

        {/* Benefit Grid */}
        <Grid container spacing={3}>
          {benefits.map((benefit, index) => (
            <Grid size={{ xs: 12, sm: 6 }} key={index}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  border: "1px solid #e0e0e0",
                  borderRadius: "12px",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                    <CheckCircleOutlineIcon sx={{ color: "#1d4230", mr: 1 }} />
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        fontFamily: "'Poppins', sans-serif",
                        color: "#1d4230",
                      }}
                    >
                      {benefit.title}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      fontFamily: "'Poppins', sans-serif",
                      lineHeight: 1.7,
                    }}
                  >
                    {benefit.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

// -------------------------- //
//      BENEFIT DATA          //
// -------------------------- //
const contractorBenefits = [
  {
    title: "Accurate Job Costing",
    description:
      "Professional bookkeeping for contractors allows precise tracking of labor costs, overheads, and material expenses, ensuring accurate job costing. Whether you operate a large crew or run a small construction business, this level of detail helps you avoid overspending, properly estimate budgets, and maintain profitability even during fluctuating market conditions.",
  },
  {
    title: "Timely Invoicing & Payments",
    description:
      "With specialized bookkeeping for construction companies, invoices can be generated and sent out quickly, reducing delays and improving cash flow. Accurate billing not only strengthens client relationships but also minimizes payment disputes, ensuring a consistent revenue stream and timely client settlements.",
  },
  {
    title: "Efficient Payroll Management",
    description:
      "Contractors often work with multiple employees and subcontractors, making payroll management a critical task. Expert accounting for construction companies ensures timely wage payments, tax withholdings, and benefits calculations, keeping your workforce satisfied while avoiding costly compliance issues and penalties.",
  },
  {
    title: "Reduced Administrative Burden",
    description:
      "By automating tasks such as bank reconciliation, expense tracking, and payroll processing, bookkeeping for small construction business owners becomes less stressful. This reduction in manual paperwork allows contractors to focus more on winning new projects and managing ongoing work efficiently.",
  },
  {
    title: "Fraud Prevention & Error Reduction",
    description:
      "Routine reconciliations and accurate construction accounting practices help detect errors, unauthorized transactions, and inconsistencies in real time. With solid internal controls, you can prevent fraud, enhance transparency, and maintain complete trust in your financial records.",
  },
  {
    title: "Asset & Equipment Management",
    description:
      "Accounting Services for contractors include keeping track of equipment use, depreciation, and maintenance costs. Managing assets properly helps plan replacements, reduce downtime, and get the most value from tools and machines that are vital for completing projects.",
  },
  {
    title: "Regulatory Compliance",
    description:
      "Contractors must follow strict tax and labor regulations. With expert construction tax planning and support from professionals who understand tax planning for contractors, your financials will be kept audit-ready. Staying compliant not only protects your business but also helps you qualify for licenses, certifications, and future project bids.",
  },
];

// -------------------------- //
//     EXPORT COMPONENT       //
// -------------------------- //
const ContractorsBenefits = () => {
  return (
    <BenefitsSection
      benefits={contractorBenefits}
      title="Benefits of Accounting and Bookkeeping for Contractors"
      bgColor="#f4f8ee"
    />
  );
};

export default ContractorsBenefits;

import React, { useState } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";

const faqs = [
  {
    id: "panel1",
    question: "What services does Milta provide to UK businesses?",
    answer:
      "Milta provides a complete range of outsourcing services for UK small and medium-sized businesses, including bookkeeping, accounts payable and receivable, payroll outsourcing, virtual assistant services, digital marketing, and back-office support. Our goal is to help businesses streamline operations while maintaining compliance and accuracy.",
  },
  {
    id: "panel2",
    question: "Does Milta specialize in supporting UK businesses?",
    answer:
      "Yes. Milta is specifically structured to support UK-based businesses. Our teams are trained in UK accounting standards, HMRC regulations, VAT compliance, payroll processing, and Companies House reporting requirements.",
  },
  {
    id: "panel3",
    question: "How does outsourcing with Milta help reduce business costs?",
    answer:
      "Outsourcing with Milta allows businesses to access experienced professionals without the cost of hiring full-time in-house staff. This reduces expenses related to salaries, office space, training, and software while still ensuring high-quality service delivery.",
  },
  {
    id: "panel4",
    question: "Can Milta scale services as my business grows?",
    answer:
      "Yes. Milta offers flexible and scalable service models. Businesses can increase or reduce services depending on their operational needs, ensuring support that adapts as the company grows.",
  },
  {
    id: "panel5",
    question: "How does Milta ensure compliance with UK regulations?",
    answer:
      "Milta follows structured processes aligned with UK compliance requirements, including VAT reporting, payroll regulations, pension auto-enrolment, Companies House filings, and HMRC reporting. Our teams regularly monitor compliance standards to maintain accuracy and reliability.",
  },
  {
    id: "panel6",
    question: "Will I have a dedicated team or point of contact?",
    answer:
      "Yes. Each client is assigned dedicated professionals along with a consistent account management process. This ensures clear communication, reliable service delivery, and a strong understanding of your business operations.",
  },
  {
    id: "panel7",
    question: "How secure is my financial and business data with Milta?",
    answer:
      "Milta follows strict data security practices aligned with UK data protection standards. We use secure systems, restricted access controls, documented workflows, and confidentiality protocols to protect all client information.",
  },
  {
    id: "panel8",
    question: "What tasks can a Milta virtual assistant handle?",
    answer:
      "Milta virtual assistants support a variety of administrative and operational tasks such as email management, appointment scheduling, document handling, data entry, accounting support tasks, and other business administration activities.",
  },
  {
    id: "panel9",
    question: "Does Milta provide digital marketing support for UK businesses?",
    answer:
      "Yes. Milta offers digital marketing services designed for the UK market, including SEO, paid advertising, social media management, and content marketing. These services help businesses improve online visibility, attract leads, and strengthen brand credibility.",
  },
  {
    id: "panel10",
    question: "How does Milta communicate progress and updates?",
    answer:
      "Milta maintains transparent communication through structured onboarding, regular reports, progress updates, and a dedicated point of contact. Clients always know the status of their tasks and service delivery.",
  },
  {
    id: "panel11",
    question: "Is Milta suitable for small businesses or startups?",
    answer:
      "Yes. Milta’s services are specifically designed for small and medium-sized businesses that require professional support without the complexity or cost of building large internal teams.",
  },
  {
    id: "panel12",
    question: "How can I begin using Milta's services?",
    answer:
      "Getting started is simple. You can book a consultation with the Milta team to discuss your business needs, after which we recommend a suitable service model and onboarding process.",
  },
];

const FaqSection = () => {
  const [expanded, setExpanded] = useState(null);

  const handleChange = (panel) => (_, isExpanded) => {
    setExpanded(isExpanded ? panel : null);
  };

  // ✅ Split FAQs into 2 columns
  const mid = Math.ceil(faqs.length / 2);
  const leftFaqs = faqs.slice(0, mid);
  const rightFaqs = faqs.slice(mid);

  const renderFaqs = (faqList, offset = 0) =>
    faqList.map((faq, index) => (
      <Accordion
        key={faq.id}
        expanded={expanded === faq.id}
        onChange={handleChange(faq.id)}
        disableGutters
        elevation={0}
        sx={{
          bgcolor: "transparent",
          "&::before": { display: "none" },
          borderBottom: "1px solid #000",
        }}
      >
        <AccordionSummary sx={{ px: 0, py: { xs: 1.5, sm: 2 } }}>
          <Box
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: { xs: 14, sm: 15 },
                lineHeight: 1.6,
              }}
            >
              <Box component="span" sx={{ color: "#97ba3a", mr: 1 }}>
                {`0${index + 1 + offset}.`}
              </Box>
              {faq.question}
            </Typography>

            <ArrowOutwardIcon
              sx={{
                fontSize: 18,
                color: expanded === faq.id ? "#97ba3a" : "#2b6d2a",
                transform:
                  expanded === faq.id ? "rotate(90deg)" : "rotate(0deg)",
                transition: "0.3s ease",
                mt: "4px",
                flexShrink: 0,
                
              }}
            />
          </Box>
        </AccordionSummary>

        <AccordionDetails sx={{ px: 0, pt: 0, pb: 2 }}>
          <Typography
            sx={{
              fontSize: { xs: 13.5, sm: 14 },
              lineHeight: 1.8,
              maxWidth: 600,
              
            }}
          >
            {faq.answer}
          </Typography>
        </AccordionDetails>
      </Accordion>
    ));

  return (
    <Box sx={{ pt: { xs: 8, md: 6 }, pb: { xs: 8, md: 12 }, bgcolor: "#fff" }}>
      <Box
        sx={{
          maxWidth: 1400,
          mx: "auto",
          px: { xs: 2, sm: 4 },
          textAlign: "center",
          
        }}
      >
        {/* LABEL */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 1,
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: "#97ba3a",
            }}
          />
          <Typography fontWeight={600}>
            FAQs – Milta Accounting Services in the UK
          </Typography>
        </Box>

        {/* HEADING */}
        <Typography
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            lineHeight: 1.25,
            mb: { xs: 4, md: 6 },
            fontSize: { xs: 24, sm: 30, md: 40 },
          }}
        >
          Learn About Our Milta Accounting Services
        </Typography>

        {/* ✅ 2 COLUMN GRID */}
        <Grid container spacing={4} sx={{ textAlign: "left" }}>
          <Grid size={{ xs: 12, md: 6 }}>
            {renderFaqs(leftFaqs, 0)}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            {renderFaqs(rightFaqs, mid)}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default FaqSection;
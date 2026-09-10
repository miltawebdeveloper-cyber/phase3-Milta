import React from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { visuallyHidden } from "@mui/utils";
import { Link } from "react-router-dom";

const softwareCards = [
  {
    title: "QuickBooks Desktop",
    description:
      "Best for complex accounting, job costing, and businesses needing powerful reporting.",
    image:
      "https://img.freepik.com/free-vector/accounting-software-concept-illustration_114360-8711.jpg",
    url: "/us/software/bookkeeping-with-quickbook-desktop/",
  },
  {
    title: "QuickBooks Online",
    description:
      "Cloud-based solution ideal for growing businesses that need flexibility and real-time access.",
    image:
      "https://img.freepik.com/free-vector/cloud-accounting-concept-illustration_114360-7784.jpg",
    url: "/us/software/bookkeeping-with-quickbook-online/",
  },
  {
    title: "Xero",
    description:
      "Perfect for startups and modern businesses looking for clean UI and automation.",
    image:
      "https://img.freepik.com/free-vector/financial-data-analysis-concept-illustration_114360-8123.jpg",
    url: "/us/software/xero-for-small-business/",
  },
  {
    title: "Wave Accounting",
    description:
      "Free and simple accounting software designed for small businesses and freelancers.",
    image:
      "https://img.freepik.com/free-vector/accounting-finance-concept-illustration_114360-7872.jpg",
    url: "/us/software/wave-accounting-for-small-business/",
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px 0px 900px 0px' },
  transition: { duration: 0.25, delay: Math.min(delay, 0.05), ease: [0.22, 1, 0.36, 1] },
});

const AccountingSoftwareSection = () => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(145deg, #0d1f0e 0%, #163018 50%, #1a3d1c 100%)",
        color: theme.palette.primary.contrastText,
        pt: { xs: 14, md: 18 },
        pb: { xs: 8, md: 12 },
      }}
    >
      {/* Primary glow accents */}
      <Box
        sx={{
          position: "absolute",
          top: "-14%",
          right: "-8%",
          width: 540,
          height: 540,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(primary, 0.35)} 0%, transparent 66%)`,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "-18%",
          left: "-8%",
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(primary, 0.2)} 0%, transparent 66%)`,
          pointerEvents: "none",
        }}
      />
      {/* Dot texture */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `radial-gradient(circle, ${alpha("#ffffff", 0.05)} 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
        }}
      />

      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <motion.div {...fadeUp(0)}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1.5,
                mb: 2.5,
              }}
            >
              <Box sx={{ width: 26, height: 2, borderRadius: 2, bgcolor: primary }} />
              <Typography
                variant="overline"
                sx={{
                  fontWeight: 900,
                  letterSpacing: 6,
                  color: primary,
                  fontSize: "0.75rem",
                }}
              >
                SOFTWARE WE USE
              </Typography>
              <Box sx={{ width: 26, height: 2, borderRadius: 2, bgcolor: primary }} />
            </Box>
          </motion.div>

          <motion.div {...fadeUp(0.08)}>
            <Typography
              variant="h3"
              // Only heading on /us/software/tools-we-use/, which is this
              // section's only consumer — so it is the page's h1.
              component="h1"
              sx={{
                fontWeight: 800,
                color: "#ffffff",
                mb: 3,
                fontSize: { xs: "1.9rem", md: "2.8rem" },
                lineHeight: 1.2,
              }}
            >
              Why the Right Accounting Software Is Important for{" "}
              <Box component="span" sx={{ color: primary }}>
                Your Business
              </Box>
            </Typography>
          </motion.div>

          <motion.div {...fadeUp(0.16)}>
            <Typography
              sx={{
                maxWidth: 1320,
                mx: "auto",
                fontSize: { xs: "1rem", md: "1.1rem" },
                lineHeight: 1.9,
                color: alpha("#ffffff", 0.78),
              }}
            >
              Every successful firm is built on accurate bookkeeping. Whether you are a small business owner, property manager, medical practitioner, eCommerce seller, law firm, or startup, your financial decisions depend on how reliable your books are. At Milta Accounting Services, we work with proven, industry-recognized accounting software to deliver accurate, timely, and audit-ready financial data for our USA clients.
Over the years, we have helped hundreds of U.S.-based businesses streamline their financial processes using software like QuickBooks Desktop, QuickBooks Online, Xero, and Wave Accounting. Each platform offers unique advantages, and we carefully choose the right tool based on your business model, goals, and workflow.
This page explains how we use each accounting tool, why they matter, and how our expertise helps you maintain perfectly managed books with zero stress.
            </Typography>
          </motion.div>
        </Box>

        {/* Software Cards */}
        <Grid
          container
          spacing={4}
          sx={{
            flexWrap: { xs: "wrap", md: "nowrap" }, // ✅ mobile wraps, desktop stays single row
          }}
        >
          {softwareCards.map((item, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.title} sx={{ display: "flex" }}>
              <Card
                component={motion.div}
                {...fadeUp(index * 0.1)}
                sx={{
                  position: "relative",
                  width: "100%",
                  minHeight: 320,
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "22px",
                  overflow: "hidden",
                  bgcolor: "background.default",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
                  border: "2px solid transparent",
                  transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",

                  "&:hover": {
                    transform: "translateY(-10px)",
                    boxShadow: `0 26px 56px ${alpha(primary, 0.4)}`,
                    borderColor: primary,
                    "& .sw-bar": { transform: "scaleX(1)" },
                    "& .sw-num": { color: alpha(primary, 0.18) },
                    "& .sw-title": { color: primary },
                    "& .sw-arrow": { transform: "translateX(4px)" },
                  },
                }}
              >
                {/* Top accent bar */}
                <Box
                  className="sw-bar"
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: 4,
                    background: `linear-gradient(90deg, ${primary}, ${alpha(primary, 0.45)})`,
                    transform: "scaleX(0)",
                    transformOrigin: "left",
                    transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
                    zIndex: 2,
                  }}
                />

                {/* Index watermark */}
                <Typography
                  className="sw-num"
                  sx={{
                    position: "absolute",
                    top: 10,
                    right: 16,
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    fontWeight: 900,
                    fontSize: "2.4rem",
                    lineHeight: 1,
                    color: alpha(primary, 0.06),
                    userSelect: "none",
                    pointerEvents: "none",
                    transition: "color 0.35s ease",
                    zIndex: 1,
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </Typography>

                {/* Image */}
                <Box
                  sx={{
                    height: 160,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 3,
                    background: `linear-gradient(180deg, #ffffff 0%, ${alpha(primary, 0.05)} 100%)`,
                    borderTopLeftRadius: "22px",
                    borderTopRightRadius: "22px",
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    style={{
                      maxHeight: "100%",
                      maxWidth: "100%",
                      objectFit: "contain",
                    }}
                  />
                </Box>

                <CardContent
                  sx={{
                    textAlign: "center",
                    px: 3,
                    flexGrow: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    className="sw-title"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      color: "text.primary",
                      transition: "color 0.3s ease",
                    }}
                  >
                    {item.title}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: "0.95rem",
                      color: "text.secondary",
                      lineHeight: 1.6,
                    }}
                  >
                    {item.description}
                  </Typography>
                </CardContent>

                <CardActions sx={{ justifyContent: "center", pb: 3 }}>
                  <Button
                    variant="contained"
                    endIcon={
                      <ArrowForwardIcon
                        className="sw-arrow"
                        sx={{
                          fontSize: "1rem !important",
                          transition: "transform 0.3s ease",
                        }}
                      />
                    }
                    sx={{
                      px: 4,
                      py: 1,
                      borderRadius: "30px",
                      fontWeight: 700,
                      textTransform: "none",
                      backgroundColor: "primary.main",
                      color: "primary.contrastText",
                      boxShadow: `0 8px 20px ${alpha(primary, 0.3)}`,
                      "&:hover": {
                        backgroundColor: "#1a4d1d",
                        boxShadow: `0 12px 26px ${alpha(primary, 0.42)}`,
                      },
                    }}
                    // Was onClick={() => navigate(item.url)} — a JS handler
                    // renders no href, so all four software detail pages had
                    // ZERO inbound links and were orphaned. A real anchor is
                    // what gives them crawl paths and link equity.
                    component={Link}
                    to={item.url}
                  >
                    Read More
                    <Box component="span" sx={visuallyHidden}>
                      {` about ${item.title}`}
                    </Box>
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default AccountingSoftwareSection;

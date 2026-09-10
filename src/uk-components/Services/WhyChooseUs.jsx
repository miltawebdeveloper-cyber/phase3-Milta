import React from "react";
import { Box, Container, Grid, Typography } from "@mui/material";
import SpeedIcon from "@mui/icons-material/Speed";
import SavingsIcon from "@mui/icons-material/Savings";
import GroupIcon from "@mui/icons-material/Group";

const features = [
  {
    icon: <SpeedIcon sx={{ fontSize: 32, color: "#1E3F24" }} />,
    title: "Fast & Reliable",
    desc: "At vero eos et accusamus et iusto odio dignissimos ducimus blanditiis praesentium voluptatum deleniti atque",
  },
  {
    icon: <SavingsIcon sx={{ fontSize: 32, color: "#1E3F24" }} />,
    title: "Saving Money",
    desc: "Sed ut perspiciatis unde omnis natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam",
  },
  {
    icon: <GroupIcon sx={{ fontSize: 32, color: "#1E3F24" }} />,
    title: "Dedicated Team",
    desc: "Ut enim minima veniam quis nostrum exercitationem ullam corporis laboriosam aliquid exea consequa inventore",
  },
];

const FeatureHighlightSection = () => {
  return (
    <Box component="section" sx={{ width: "100%", position: "relative" }}>
      {/* Top Image */}
      

      {/* Green Feature Section */}
      <Box
        sx={{
          backgroundColor: "#1E3F24",
          py: { xs: 6, md: 10 },
          mt: "-80px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {features.map((item, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Box
                  sx={{
                    display: "flex",
                    maxWidth: "360px",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    px: 2,
                  }}
                >
                  {/* Icon */}
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      backgroundColor: "#FFBF69",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 3,
                    }}
                  >
                    {item.icon}
                  </Box>

                  {/* Title */}
                  <Typography
                    variant="h6"
                    sx={{
                      color: "#FFFFFF",
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    {item.title}
                  </Typography>

                  {/* Description */}
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.75)",
                      fontSize: 14,
                      lineHeight: 1.8,
                      mb: 2,
                    }}
                  >
                    {item.desc}
                  </Typography>

                  {/* Learn More */}
                  <Typography
                    sx={{
                      color: "#FFBF69",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                  >
                    Learn More →
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default FeatureHighlightSection;

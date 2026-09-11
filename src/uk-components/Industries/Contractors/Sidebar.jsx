// src/uk-components/Industries/Contractors/ContractorsSidebar.jsx
import React from "react";
import { Box, Typography, List, ListItemButton, ListItemText } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import SidebarMenu from "../../sidebarMenu";

// Sidebar items
const sidebarItems = [
  { id: "overview", label: "Overview" },
  { id: "advantages", label: "Advantages" },
  { id: "benefits", label: "Benefits" },
  { id: "faq", label: "FAQ" },
  { id: "areas", label: "Areas We Serve" },
  { id: "industries", label: "Industries We Serve" },
];

export default function ContractorsSidebar() {
  return (
    <Box
      sx={{
        position: "sticky",
        top: 32,
        p: 3,
        borderRadius: 3,
        bgcolor: "#fff",
        boxShadow: "0 24px 60px rgba(0,0,0,0.08)",
        border: "1px solid #e6e6e6",
        maxWidth: 280,
        fontFamily: "var(--uk-font-primary)",
      }}
    >

      <List sx={{ p: 0 }}>
        {sidebarItems.map((item) => (
          <ListItemButton
            key={item.id}
            component={RouterLink}
            to={`#${item.id}`}
            sx={{
              borderRadius: 2,
              mb: 1.5,
              py: 1.5,
              px: 2,
              color: "#1d4230",
              fontWeight: 500,
              fontSize: "0.95rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
              transition: "transform 0.3s ease, background-color 0.3s ease",
              "&:hover": {
                bgcolor: "#97ba3a",
                color: "#fff",
                transform: "translateY(-2px)",
              },
            }}
          >
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>

      

    </Box>
  );
}

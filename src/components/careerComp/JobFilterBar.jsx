import React, { useState } from "react";
import {
  Box,
  Stack,
  TextField,
  MenuItem,
  Button,
  useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const JobFilterBar = ({ onFilter }) => {
  const [filters, setFilters] = useState({
    search: "",
    category: "All Openings",
    type: "All",
  });

  const isMobile = useMediaQuery("(max-width:768px)");

  const handleChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleApplyFilter = () => {
    onFilter(filters);
  };

  const categories = [
    "All Openings",
    "IT",
    "Accounts",
    "Tax",
    "Virtual Assistance",
    "Business Development",
    "Digital Marketing",
  ];

  const types = ["All", "Full Time", "Part Time"];

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        borderRadius: "20px",
        border: "1px solid rgba(38,105,41,0.12)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.05)",
        mb: 3,
        p: { xs: 2.5, md: 3 },
      }}
    >
      <Stack
        direction={isMobile ? "column" : "row"}
        spacing={2}
        alignItems="center"
        justifyContent="center"
      >
        {/* Search */}
        <TextField
          placeholder="Search for jobs or keywords"
          size="small"
          fullWidth
          value={filters.search}
          onChange={(e) => handleChange("search", e.target.value)}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />,
            },
          }}
          sx={{ maxWidth: isMobile ? "100%" : 300 }}
        />

        {/* Category */}
        <TextField
          select
          label="Category"
          size="small"
          value={filters.category}
          onChange={(e) => handleChange("category", e.target.value)}
          sx={{ minWidth: 180, width: isMobile ? "100%" : "auto" }}
        >
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </TextField>

        {/* Type */}
        <TextField
          select
          label="Type"
          size="small"
          value={filters.type}
          onChange={(e) => handleChange("type", e.target.value)}
          sx={{ minWidth: 150, width: isMobile ? "100%" : "auto" }}
        >
          {types.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </TextField>

        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          sx={{
            backgroundColor: "primary.main",
            color: "#fff",
            borderRadius: "50px",
            px: 4,
            py: 1,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            fontSize: "0.8rem",
            whiteSpace: "nowrap",
            boxShadow: "0 8px 20px rgba(38,105,41,0.25)",
            "&:hover": { backgroundColor: "#1a4d1d", boxShadow: "0 12px 28px rgba(38,105,41,0.35)" },
          }}
          onClick={handleApplyFilter}
        >
          Search
        </Button>
      </Stack>
    </Box>
  );
};

export default JobFilterBar;

import { Box, Grid, Typography, Chip } from "@mui/material";
import { Link } from "react-router-dom";
import { getBlogs } from "../../api/blogs";
import { useEffect, useState } from "react";

const FeaturedSection = () => {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = await getBlogs({ 
        table: "blogs_uk", 
        featured: true, 
        order: "created_at", 
        ascending: false, 
        limit: 2 
      });
      setFeatured(data || []);
    };
    load();
  }, []);

  return (
    <Box sx={{ px: { xs: 2, md: 5 }, mt: 4 }}>
      <Grid container spacing={3}>
        {featured.map((item) => (
          <Grid size={{ xs: 12, md: 6 }} key={item.id}>
            <Box>
              <img
                src={item.image_url}
                alt={item.title}
                style={{ width: "100%", borderRadius: 12 }}
              />

              <Typography
                variant="h5"
                component={Link}
                to={`/uk/blogs/${item.slug}`}
                sx={{
                  textDecoration: "none",
                  color: "#1a1a1a",
                  fontWeight: 700,
                  mt: 2,
                  display: "block",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                {item.title}
              </Typography>

              <Typography
                sx={{
                  color: "rgba(0,0,0,0.6)",
                  fontSize: "14px",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                {item.author} — {new Date(item.created_at).toDateString()}
              </Typography>

              <Chip
                label={item.category}
                size="small"
                sx={{
                  mt: 1,
                  bgcolor: "#2b6d2a",
                  color: "#fff",
                  fontWeight: 600,
                  fontFamily: "'Poppins', sans-serif",
                }}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default FeaturedSection;

import {
  Box,
  Container,
  Grid,
  TextField,
  Chip,
  Typography,
  Pagination,
  PaginationItem,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useTheme, alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBlogs } from "../../api/blogs";
import BlogCard from "./BlogCard";

const categories = [
  "All",
  "SEO",
  "AI",
  "Accounting",
  "Tax",
  "Finance",
  "Digital Marketing",
];

const BLOGS_PER_PAGE = 6;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px 0px 900px 0px' },
  transition: { duration: 0.25, delay: Math.min(delay, 0.05), ease: [0.22, 1, 0.36, 1] },
});

const BlogGridSection = () => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  const [blogs, setBlogs] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      const data = await getBlogs({ order: "created_at", ascending: false });
      setBlogs(data || []);
    };
    load();
  }, []);

  /* ===== FILTER ===== */
  const filtered = blogs.filter((b) => {
    const matchCategory = category === "All" || b.category === category;
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  /* ===== PAGINATION LOGIC ===== */
  const totalPages = Math.ceil(filtered.length / BLOGS_PER_PAGE);
  const paginatedBlogs = filtered.slice(
    (page - 1) * BLOGS_PER_PAGE,
    page * BLOGS_PER_PAGE
  );

  /* Reset page on filter/search change */
  useEffect(() => {
    setPage(1);
  }, [search, category]);

  return (
    <Box sx={{ bgcolor: "background.default", py: { xs: 8, md: 12 }, overflow: "hidden" }}>
      <Container maxWidth={false} sx={{ maxWidth: "1300px", mx: "auto", px: { xs: 3, md: 5 } }}>
        {/* ===== SECTION LABEL ===== */}
        <motion.div {...fadeUp(0)}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Box sx={{ width: 28, height: 2.5, borderRadius: 2, bgcolor: primary }} />
            <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 6, color: primary, fontSize: "0.72rem" }}>
              LATEST ARTICLES
            </Typography>
          </Box>
        </motion.div>

        <motion.div {...fadeUp(0.08)}>
          <Typography
            variant="h2"
            sx={{ fontSize: { xs: "2rem", sm: "2.5rem", md: "2.9rem" }, fontWeight: 900, letterSpacing: "-0.025em", mb: { xs: 4, md: 5 } }}
          >
            From the <Box component="span" sx={{ color: primary }}>Blog</Box>
          </Typography>
        </motion.div>

        {/* ===== SEARCH + CATEGORY ===== */}
        <motion.div {...fadeUp(0.14)}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "stretch", md: "center" },
              justifyContent: "space-between",
              gap: 2,
              mb: { xs: 4, md: 5 },
            }}
          >
            <TextField
              placeholder="Search articles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                width: { xs: "100%", md: 360 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "50px",
                  bgcolor: "background.paper",
                },
              }}
            />

            <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: { xs: "flex-start", md: "flex-end" }, gap: 1 }}>
              {categories.map((c) => {
                const active = category === c;
                return (
                  <Chip
                    key={c}
                    label={c}
                    onClick={() => setCategory(c)}
                    sx={{
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      color: active ? primary : "text.secondary",
                      bgcolor: active ? alpha(primary, 0.1) : "background.paper",
                      border: `1px solid ${active ? alpha(primary, 0.4) : alpha(primary, 0.12)}`,
                      transition: "all 0.25s ease",
                      "&:hover": { bgcolor: alpha(primary, 0.08), borderColor: alpha(primary, 0.3) },
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        </motion.div>

        {/* ===== BLOG GRID ===== */}
        {paginatedBlogs.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography sx={{ color: "text.secondary", fontFamily: '"Outfit", sans-serif' }}>
              No articles found. Try a different search or category.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={{ xs: 2.5, md: 3.5 }}>
            {paginatedBlogs.map((b, i) => (
              <Grid key={b.id} size={{ xs: 12, sm: 6, lg: 4 }} sx={{ display: "flex" }}>
                <motion.div {...fadeUp(0.05 * (i % 3))} style={{ width: "100%" }}>
                  <BlogCard blog={b} />
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}

        {/* ===== PAGINATION ===== */}
        {totalPages > 1 && (
          <Box sx={{ mt: { xs: 5, md: 7 }, display: "flex", justifyContent: "center" }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              renderItem={(item) => (
                <PaginationItem
                  {...item}
                  sx={{
                    mx: 0.3,
                    borderRadius: "12px",
                    fontWeight: 700,
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    border: `1px solid ${alpha(primary, 0.18)}`,
                    color: primary,
                    "&.Mui-selected": {
                      background: primary,
                      color: theme.palette.primary.contrastText,
                      border: "none",
                      boxShadow: `0 6px 18px ${alpha(primary, 0.35)}`,
                      "&:hover": { background: theme.palette.primary.dark },
                    },
                    "&:hover": { background: alpha(primary, 0.08) },
                  }}
                />
              )}
            />
          </Box>
        )}

        {/* ===== ALL ARTICLES =====
            Pagination above is client-side: clicking page 2 re-renders in
            place and emits no <a href>, so posts 7+ had NO internal link
            anywhere on the site. They were reachable only by typing the URL,
            which is what Semrush reports as orphaned pages (188 of them on
            2026-08-10). Prerendering alone does not fix that — a page in the
            sitemap with zero inbound links still gets almost no crawl
            priority.

            This list renders every post as a real <a href> from a page that
            IS prerendered, so each post has one honest internal link. It is
            deliberately visible rather than hidden: a hidden block of links
            is a cloaking pattern, and this doubles as a usable archive. */}
        {blogs.length > 0 && (
          <Box component="nav" aria-label="All articles" sx={{ mt: { xs: 6, md: 9 } }}>
            <Typography
              variant="h3"
              sx={{
                fontSize: { xs: "1.25rem", md: "1.5rem" },
                fontWeight: 700,
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                mb: 2.5,
              }}
            >
              All articles
            </Typography>
            <Box
              component="ul"
              sx={{
                listStyle: "none",
                p: 0,
                m: 0,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                columnGap: { xs: 2, md: 4 },
                rowGap: 1,
              }}
            >
              {blogs.map((b) => (
                <Box component="li" key={b.id}>
                  <Typography
                    component={Link}
                    to={`/us/blogs/${b.slug}`}
                    sx={{
                      display: "block",
                      py: 0.6,
                      fontSize: "0.95rem",
                      lineHeight: 1.45,
                      color: "text.secondary",
                      textDecoration: "none",
                      "&:hover": { color: primary, textDecoration: "underline" },
                    }}
                  >
                    {b.title}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default BlogGridSection;

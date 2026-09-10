import React from 'react';
import { Box, Container, Typography, Breadcrumbs, Link } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme, alpha } from '@mui/material/styles';
import { NavigateNext as NavigateNextIcon, Home as HomeIcon } from '@mui/icons-material';
import CurrentCrumb from '../CurrentCrumb';

/**
 * Dark-green hero matching the industry pages.
 * Reusable for the blog listing and blog detail pages.
 */
const BlogHero = ({
  title = 'Insights & Resources',
  highlight = 'Resources',
  subtitle = 'Finance, accounting, tax & growth insights to help your business stay organized, compliant, and profitable.',
  crumb = 'Blogs',
}) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  // Split the title so the highlighted word renders in the primary colour.
  const [before, after] = highlight && title.includes(highlight)
    ? [title.slice(0, title.indexOf(highlight)), title.slice(title.indexOf(highlight) + highlight.length)]
    : [title, ''];

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: { xs: 'auto', md: '52vh' },
        background: 'linear-gradient(145deg, #0d1f0e 0%, #163018 50%, #1a3d1c 100%)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        pt: { xs: 14, md: 0 },
        pb: { xs: 10, md: 0 },
      }}
    >
      <Box sx={{ position: 'absolute', top: '-15%', left: '-8%', width: 700, height: 700, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(primary, 0.35)} 0%, transparent 65%)`, pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: '-20%', right: '-8%', width: 650, height: 650, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(primary, 0.2)} 0%, transparent 65%)`, pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: { xs: 500, md: 920 }, height: { xs: 500, md: 920 }, borderRadius: '50%', border: `1px solid ${alpha('#ffffff', 0.05)}`, pointerEvents: 'none' }} />

      <Container maxWidth={false} sx={{ maxWidth: '1300px', mx: 'auto', position: 'relative', zIndex: 1, px: { xs: 3, md: 5 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: { xs: 4, md: 0 } }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <Typography
              variant="h1"
              sx={{ letterSpacing: "0.25px",
                fontSize: { xs: '2.1rem', sm: '3rem', md: '3.6rem' },
                color: theme.palette.primary.contrastText,
                maxWidth: { xs: '100%', md: '900px' },
                mx: 'auto',
                mb: 3,
              }}
            >
              {before}
              {after !== '' || highlight === title ? (
                <Box component="span" sx={{ color: primary }}>{highlight}</Box>
              ) : null}
              {after}
            </Typography>
          </motion.div>

          {subtitle && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.32 }}>
              <Typography
                sx={{
                  color: alpha('#ffffff', 0.72),
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: { xs: '0.95rem', md: '1.05rem' },
                  lineHeight: 1.8,
                  maxWidth: 680,
                  mx: 'auto',
                  mb: 4,
                }}
              >
                {subtitle}
              </Typography>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <Breadcrumbs
              separator={<NavigateNextIcon sx={{ fontSize: 18, color: alpha('#ffffff', 0.5) }} />}
              sx={{ '& .MuiBreadcrumbs-ol': { justifyContent: 'center' } }}
            >
              <Link
                href="/"
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.5,
                  color: alpha('#ffffff', 0.7), textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': { color: primary, transform: 'translateY(-2px)' },
                }}
              >
                <HomeIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>Home</Typography>
              </Link>
              <CurrentCrumb variant="body2" sx={{ color: alpha('#ffffff', 0.9), fontWeight: 600, letterSpacing: '0.02em' }}>
                {crumb}
              </CurrentCrumb>
            </Breadcrumbs>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
};

export default BlogHero;

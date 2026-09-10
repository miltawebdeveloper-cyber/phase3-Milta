import React from 'react';
import { Box, Container, Typography, Breadcrumbs, Link } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme, alpha } from '@mui/material/styles';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Link as RouterLink } from 'react-router-dom';
import CurrentCrumb from '../CurrentCrumb';

const HeroModern = ({ title = "About Us", breadcrumbPage = "About Us" }) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: { xs: 'auto', md: '78vh' },
        background: `linear-gradient(145deg, #0d1f0e 0%, #163018 50%, #1a3d1c 100%)`,
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        pt: { xs: 14, md: 0 },
        pb: { xs: 10, md: 0 },
      }}
    >

      {/* Glow — top left */}
      <Box sx={{
        position: 'absolute', top: '-15%', left: '-8%',
        width: 700, height: 700, borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(primary, 0.35)} 0%, transparent 65%)`,
        pointerEvents: 'none',
      }} />

      {/* Glow — bottom right */}
      <Box sx={{
        position: 'absolute', bottom: '-20%', right: '-8%',
        width: 650, height: 650, borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(primary, 0.2)} 0%, transparent 65%)`,
        pointerEvents: 'none',
      }} />

      {/* Outer ring */}
      <Box sx={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: 500, md: 920 }, height: { xs: 500, md: 920 },
        borderRadius: '50%',
        border: `1px solid ${alpha('#ffffff', 0.05)}`,
        pointerEvents: 'none',
      }} />

      {/* Inner ring */}
      <Box sx={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: 300, md: 580 }, height: { xs: 300, md: 580 },
        borderRadius: '50%',
        border: `1px solid ${alpha('#ffffff', 0.04)}`,
        pointerEvents: 'none',
      }} />

      <Container maxWidth={false} sx={{ maxWidth: '1300px', mx: 'auto', position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: { xs: 4, md: 0 } }}>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Overline pill */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 2.5, py: 0.75,
                mb: 4,
                borderRadius: '50px',
                border: `1px solid ${alpha(primary, 0.5)}`,
                bgcolor: alpha(primary, 0.15),
              }}
            >
              <Typography
                variant="overline"
                sx={{ color: alpha('#ffffff', 0.9), display: 'block', lineHeight: 1 }}
              >
                KNOW MORE
              </Typography>
            </Box>

            <Typography
              variant="h1"
              dangerouslySetInnerHTML={{ __html: title }}
              sx={{ letterSpacing: "0.25px",
                fontSize: { xs: '2.4rem', sm: '3.5rem', md: '4rem', lg: '4.8rem' },
                lineHeight: 1.25,
                textAlign: 'center',
                color: theme.palette.primary.contrastText,
                maxWidth: { xs: '100%', md: '820px' },
                mx: 'auto',
                mb: 2.5,
              }}
            />

            <Typography
              sx={{
                fontSize: { xs: '1rem', md: '1.15rem' },
                lineHeight: 1.8,
                textAlign: 'center',
                color: alpha(theme.palette.primary.contrastText, 0.85),
                maxWidth: { xs: '100%', md: '720px' },
                mx: 'auto',
                mb: 4,
              }}
            >
              <Box component="span" sx={{ display: 'block', fontWeight: 700 }}>
                Trusted by 100+ Clients Across 50 States.
              </Box>
              Proudly serving small businesses, growing enterprises, and Fortune 500 companies.
            </Typography>
          </motion.div>

          {/* Breadcrumbs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Breadcrumbs
              separator={<NavigateNextIcon sx={{ fontSize: 16, color: alpha('#ffffff', 0.5) }} />}
              sx={{
                mb: 3,
                '& .MuiBreadcrumbs-ol': {
                  justifyContent: 'center',
                }
              }}
            >
              <Link
                component={RouterLink}
                to="/"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: alpha('#ffffff', 0.7),
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: primary,
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                <HomeIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>Home</Typography>
              </Link>
              <CurrentCrumb
                variant="body2"
                sx={{
                  color: alpha('#ffffff', 0.9),
                  fontWeight: 600,
                }}
              >
                {breadcrumbPage}
              </CurrentCrumb>
            </Breadcrumbs>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
};

export default HeroModern;

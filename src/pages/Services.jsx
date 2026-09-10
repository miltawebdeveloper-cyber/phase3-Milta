import React, { lazy, Suspense } from 'react';
import { Box, Container, Typography, Breadcrumbs, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme, alpha } from '@mui/material/styles';
import {
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  Receipt,
  AccountTree,
  SupportAgent,
  VerifiedUser,
  Storage,
  AccountBalance,
  Campaign,
  Payment,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import ScrollToTop from '../components/ScrollToTop';
import useFullSEO from '../utils/useFullSEO';

const CTASection = lazy(() => import('../components/homeComp/CTASection'));
import Footer from '../components/Footer';
import CurrentCrumb from '../components/CurrentCrumb';

const SERVICES = [
  { icon: <Receipt />,       title: 'Book Keeping',          description: 'Streamlined bookkeeping services that keep your financial records organized and compliant.',            link: '/us/services/bookkeeping-company-in-the-usa/' },
  { icon: <Payment />,       title: 'Payroll Management',    description: 'Reliable, automated payroll ensuring accuracy and peace of mind every payday.',                       link: '/us/services/payroll-management-services-in-the-usa/' },
  { icon: <VerifiedUser />,  title: 'CPA Services',          description: 'Top-tier CPA services ensuring accurate financial reporting and compliance for your business.',       link: '/us/services/best-cpa-services-for-small-businesses-in-the-usa/' },
  { icon: <AccountBalance />,title: 'Financial Controller',  description: 'Gain financial clarity and strategic insight through expert outsourced controller services.',         link: '/us/services/financial-controller-services-in-the-usa/' },
  { icon: <AccountTree />,   title: 'Tax Planning & Prep',   description: 'Comprehensive tax planning and preparation for individuals, corporations and nonprofits.',            link: '/us/services/tax-planning-and-preparation-services-usa/' },
  { icon: <Campaign />,      title: 'Digital Marketing',     description: 'Grow your brand with data-driven digital marketing built for accounting and finance businesses.',     link: '/us/services/best-digital-marketing-agency-in-usa/' },
  { icon: <SupportAgent />,  title: 'Virtual Assistant',     description: 'Let us handle your administrative and bookkeeping tasks efficiently with our virtual assistant team.', link: '/us/services/virtual-assistant-service-in-the-usa/' },
  { icon: <Storage />,       title: 'Data Entry',            description: 'Accurate and reliable accounting data entry services modified specifically for small businesses.',    link: '/us/services/outsourcing-accounting-data-entry-services-in-the-usa/' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px 0px 900px 0px' },
  transition: { duration: 0.25, delay: Math.min(delay, 0.05), ease: [0.22, 1, 0.36, 1] },
});

const Services = () => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  useFullSEO({
    title: "Milta - Our Services You Can Trust to Make Business Easier.",
    description:
      "At Milta, we don’t just provide services, we provide solutions. Our services are customized to meet your specific needs and Planned solutions.",
    keywords:
      "bookkeeping services for small business, tax planning and preparation service, cpa services for small business, virtual assistant service, digital marketing services usa, financial controller services, accounting data entry services.",
    author: 'Milta Accounting',
    canonical: 'https://www.miltafs.com/services',
    ogTitle: "Milta - Our Services You Can Trust to Make Business Easier.",
    ogDescription:
      "At Milta, we don’t just provide services, we provide solutions. Our services are customized to meet your specific needs and Planned solutions.",
    ogImage: 'https://www.miltafs.com/images/miltafs-og.jpg',
    ogUrl: 'https://www.miltafs.com/services',
    ogType: 'website',
  });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', position: 'relative' }}>
      <Navbar />

      {/* ── Hero ── */}
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: 'auto', md: '72vh' },
          background: 'linear-gradient(145deg, #0d1f0e 0%, #163018 50%, #1a3d1c 100%)',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          pt: { xs: 18, md: 10 },
          pb: { xs: 14, md: 10 },
        }}
      >
        <Box sx={{
          position: 'absolute', top: '-15%', left: '-8%',
          width: 700, height: 700, borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(primary, 0.35)} 0%, transparent 65%)`,
          pointerEvents: 'none',
        }} />
        <Box sx={{
          position: 'absolute', bottom: '-20%', right: '-8%',
          width: 650, height: 650, borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(primary, 0.2)} 0%, transparent 65%)`,
          pointerEvents: 'none',
        }} />

        <Container maxWidth={false} sx={{ maxWidth: '1300px', mx: 'auto', position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: { xs: 4, md: 0 } }}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
              
              <Typography
                variant="h1"
                sx={{ letterSpacing: "0.25px",
                  fontSize: { xs: '2rem', sm: '2.6rem', md: '3.2rem', lg: '3.6rem' },
                  lineHeight: 1.2,
                  color: theme.palette.primary.contrastText,
                  maxWidth: { xs: '100%', md: '950px' },
                  mx: 'auto', mb: 2.5,
                }}
              >
                Explore Our Dedicated Accounting Services For Small Businesses.
              </Typography>

              <Typography
                sx={{
                  fontSize: { xs: '1rem', md: '1.15rem' },
                  lineHeight: 1.8,
                  color: alpha(theme.palette.primary.contrastText, 0.85),
                  maxWidth: { xs: '100%', md: '720px' },
                  mx: 'auto', mb: 4,
                }}
              >
                Discover how our customized accounting services for small businesses can simplify your finances, boost efficiency, and support your growth. We'll handle the Count on your behalf!
              </Typography>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              <Breadcrumbs
                separator={<NavigateNextIcon sx={{ fontSize: 18, color: alpha('#ffffff', 0.5) }} />}
                sx={{ mb: 1, '& .MuiBreadcrumbs-ol': { justifyContent: 'center' } }}
              >
                <Link
                  component={RouterLink}
                  to="/"
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
                  Services
                </CurrentCrumb>
              </Breadcrumbs>
            </motion.div>
          </Box>
        </Container>
      </Box>

      {/* ── Services grid ── */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
        <Container maxWidth={false} sx={{ maxWidth: '1300px', mx: 'auto', px: { xs: 3, md: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <motion.div {...fadeUp(0)}>
              <Typography variant="overline" sx={{ color: 'primary.main', display: 'block', mb: 1 }}>
                CORE CAPABILITIES
              </Typography>
            </motion.div>
            <motion.div {...fadeUp(0.1)}>
              <Typography variant="h2" sx={{ color: 'text.primary', fontSize: { xs: '2rem', md: '3rem' } }}>
                Everything Your Business Needs{' '}
                <Box component="span" sx={{ color: 'primary.main' }}>in One Place</Box>
              </Typography>
            </motion.div>
          </Box>

          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 3,
          }}>
            {SERVICES.map((service, i) => (
              <motion.div key={service.title} {...fadeUp((i % 4) * 0.08)}>
                <Box
                  component={RouterLink}
                  to={service.link}
                  sx={{
                    display: 'flex', flexDirection: 'column', height: '100%',
                    textDecoration: 'none',
                    p: { xs: 3.5, md: 4 },
                    borderRadius: '22px',
                    bgcolor: 'background.paper',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
                    transition: 'all 0.32s cubic-bezier(0.4,0,0.2,1)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 24px 56px ${alpha(primary, 0.16)}`,
                      border: `1px solid ${alpha(primary, 0.28)}`,
                      '& .srv-icon': { bgcolor: primary, boxShadow: `0 10px 22px ${alpha(primary, 0.35)}` },
                      '& .srv-icon-svg': { color: '#fff' },
                      '& .srv-title': { color: primary },
                      '& .srv-cta': { gap: '10px' },
                    },
                  }}
                >
                  <Box className="srv-icon" sx={{
                    width: 54, height: 54, borderRadius: '14px',
                    bgcolor: alpha(primary, 0.08), border: `1px solid ${alpha(primary, 0.14)}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mb: 2.5, flexShrink: 0,
                    transition: 'all 0.32s cubic-bezier(0.4,0,0.2,1)',
                  }}>
                    {React.cloneElement(service.icon, { className: 'srv-icon-svg', sx: { fontSize: 26, color: primary, transition: 'color 0.32s ease' } })}
                  </Box>

                  <Typography className="srv-title" variant="h5" sx={{
                    fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.3, mb: 1, color: 'text.primary',
                    transition: 'color 0.28s ease',
                  }}>
                    {service.title}
                  </Typography>

                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7, flexGrow: 1 }}>
                    {service.description}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── Customized solutions ── */}
      <Box sx={{ pb: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
        <Container maxWidth={false} sx={{ maxWidth: '1300px', mx: 'auto', px: { xs: 3, md: 4 } }}>
          <motion.div {...fadeUp(0)}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h2" sx={{
                color: 'text.primary',
                fontSize: { xs: '1.6rem', md: '2.2rem' },
                lineHeight: 1.3,
                maxWidth: 820,
                mx: 'auto',
                mb: 2,
              }}>
                Seeking Customized Solutions for Outsourced Bookkeeping &amp; Accounting Services?
              </Typography>

              <Typography sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.95rem', md: '1.05rem' },
                lineHeight: 1.8,
                maxWidth: 680,
                mx: 'auto',
              }}>
                If you're looking for specialized accounting services for small businesses, we're here to help!
              </Typography>

              <Typography sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.95rem', md: '1.05rem' },
                lineHeight: 1.8,
                maxWidth: 680,
                mx: 'auto',
                mt: 1.5,
              }}>
                Share your needs, and we'll craft a solution just for you.
              </Typography>
            </Box>
          </motion.div>
        </Container>
      </Box>

      <Suspense fallback={null}>
        <CTASection />
        <Footer />
      </Suspense>
      <ScrollToTop />
    </Box>
  );
};

export default Services;

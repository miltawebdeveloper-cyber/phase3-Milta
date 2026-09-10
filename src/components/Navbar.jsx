import React, { useState, useRef } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import preloadRoute from '../utils/navPreload';
import {
  AppBar, Toolbar, Box, Container, IconButton,
  Drawer, List, ListItem, Typography, Button, Stack,
  useScrollTrigger, Collapse,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import { useTheme, alpha } from '@mui/material/styles';
import { useThemeMode } from '../ThemeContext';
import { useConsultation } from './ConsultationModal';
import CountrySwitcher from './CountrySwitcher';

const navItems = [
  { label: 'Home',     path: '/' },
  { label: 'About',    path: '/about' },
  {
    label: 'Services',
    path: '/services',
    hasPage: true,
    children: [
      { label: 'BookKeeping',        path: '/us/services/bookkeeping-company-in-the-usa/' },
      { label: 'Payroll Management',  path: '/us/services/payroll-management-services-in-the-usa/' },
      { label: 'CPA Services',        path: '/us/services/best-cpa-services-for-small-businesses-in-the-usa/' },
      { label: 'Financial Controller',path: '/us/services/financial-controller-services-in-the-usa/' },
      { label: 'Tax Planning',        path: '/us/services/tax-planning-and-preparation-services-usa/' },
      { label: 'Digital Marketing',   path: '/us/services/best-digital-marketing-agency-in-usa/' },
      { label: 'Virtual Assistant',   path: '/us/services/virtual-assistant-service-in-the-usa/' },
      { label: 'Data Entry',          path: '/us/services/outsourcing-accounting-data-entry-services-in-the-usa/' },
    ],
  },
  { label: 'Industry', path: '/industry',
    children: [
      { label: 'Contractor Companies',   path: '/us/industry/bookkeeping-for-contractors-companies/' },
      { label: 'Law Firms',              path: '/us/industry/accounting-services-for-lawfirms/' },
      { label: 'Manufacturing Companies', path: '/us/industry/accounting-services-for-manufacturing/' },
      { label: 'Real Estate Companies',   path: '/us/industry/bookkeeping-for-real-estate-companies/' },
      { label: 'Non-Profit Organizations', path: '/us/industry/accounting-services-for-nonprofit-organizations/' },
      { label: 'Health Care Industry',     path: '/us/industry/accounting-services-for-healthcare/' },
      { label: 'Restaurant Industry',      path: '/us/industry/accounting-services-for-restaurant-businesses/' },
      { label: 'Retail Business',          path: '/us/industry/accounting-services-for-retail-businesses/' },
    ],
  },
  { label: 'Blogs',    path: '/blogs' },
  { label: 'Career',   path: '/career' },
  { label: 'Contact',  path: '/contact' },
];

const DARK_HERO_PATHS = [
  '/about', '/contact', '/career', '/areas-we-serve', '/services',
  '/us/software/tools-we-use/',
  '/us/services/bookkeeping-company-in-the-usa/',
  '/us/services/tax-planning-and-preparation-services-usa/',
  '/us/services/virtual-assistant-service-in-the-usa/',
  '/us/services/best-cpa-services-for-small-businesses-in-the-usa/',
  '/us/services/outsourcing-accounting-data-entry-services-in-the-usa/',
  '/us/services/financial-controller-services-in-the-usa/',
  '/us/services/best-digital-marketing-agency-in-usa/',
  '/us/services/payroll-management-services-in-the-usa/',
  '/us/industry/bookkeeping-for-contractors-companies/',
  '/us/industry/accounting-services-for-lawfirms/',
  '/us/industry/accounting-services-for-manufacturing/',
  '/us/industry/bookkeeping-for-real-estate-companies/',
  '/us/industry/accounting-services-for-nonprofit-organizations/',
  '/us/industry/accounting-services-for-healthcare/',
  '/us/industry/accounting-services-for-restaurant-businesses/',
  '/us/industry/accounting-services-for-retail-businesses/',
  '/us/services/best-bookkeeping-services-in-california/',
  '/us/services/tax-planning-and-preparation-service-in-california/',
  '/us/services/payroll-management-services-in-the-california/',
  '/us/services/financial-controller-services-in-california/',
  '/us/services/outsourcing-accounting-data-entry-california/',
  '/us/services/virtual-assistant-service-in-california/',
  '/us/services/best-cpa-services-for-small-businesses-in-the-california/',
  '/us/services/best-digital-marketing-agency-in-california/',
  '/us/services/best-bookkeeping-services-in-florida/',
  '/us/services/tax-planning-and-preparation-service-in-florida/',
  '/us/services/best-cpa-services-for-small-businesses-in-the-florida/',
  '/us/services/virtual-assistant-service-in-florida/',
  '/us/services/best-digital-marketing-agency-in-florida',
  '/us/services/outsourcing-accounting-data-entry-florida/',
  '/us/services/financial-controller-services-in-florida/',
  '/us/services/payroll-management-services-in-the-florida/',
  '/us/services/best-bookkeeping-services-in-connecticut-usa/',
  '/us/services/tax-planning-and-preparation-service-in-connecticut/',
  '/us/services/best-cpa-services-for-small-businesses-in-the-connecticut/',
  '/us/services/virtual-assistant-service-in-connecticut/',
  '/us/services/best-digital-marketing-agency-in-connecticut',
  '/us/services/outsourcing-accounting-data-entry-connecticut/',
  '/us/services/financial-controller-services-in-connecticut/',
  '/us/services/payroll-management-services-in-the-connecticut/',
  '/us/services/best-bookkeeping-services-in-georgia/',
  '/us/services/tax-planning-and-preparation-service-in-georgia/',
  '/us/services/best-cpa-services-for-small-businesses-in-the-georgia/',
  '/us/services/virtual-assistant-service-in-georgia/',
  '/us/services/best-digital-marketing-agency-in-georgia',
  '/us/services/outsourcing-accounting-data-entry-georgia/',
  '/us/services/financial-controller-services-in-georgia/',
  '/us/services/payroll-management-services-in-the-georgia/',
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openMobileDropdown, setOpenMobileDropdown] = useState(null);
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const { mode, toggleMode } = useThemeMode();
  const { open: openConsultation } = useConsultation();
  const location = useLocation();

  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 50 });

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const isActive = (item) => {
    if (item.path === '/') return location.pathname === '/';
    if (location.pathname === item.path || location.pathname.startsWith(item.path + '/')) return true;
    if (item.children) return item.children.some(c => location.pathname === c.path);
    return false;
  };

  // Every service page (generic USA pages + all state service pages under
  // /us/services/) renders over a dark hero, so it gets the same transparent,
  // white-text navbar treatment as the About page.
  // The preview routes render the same rows at a second URL (/cms-preview/us/…,
  // /delaware-preview/us/…). Matching the raw prefix alone left the navbar in
  // its light-hero styling there — dark text on the dark hero, unreadable — so a
  // reviewer saw a broken navbar that the real URL does not have. Stripping the
  // prefix first makes the preview show what will actually ship.
  const previewed = location.pathname.replace(/^\/(cms|delaware)-preview/, '');
  const isServicePage = previewed.startsWith('/us/services/');
  const isDarkHero = mode === 'light' && (isServicePage || DARK_HERO_PATHS.includes(location.pathname));
  const onHero = !trigger && isDarkHero;

  const closeTimeout = useRef(null);
  const openMenu  = (label) => { clearTimeout(closeTimeout.current); setOpenDropdown(label); };
  const closeMenu = ()      => { closeTimeout.current = setTimeout(() => setOpenDropdown(null), 120); };

  // Spread onto every nav link so the destination's chunk starts downloading
  // while the pointer is still travelling. Hover covers the desktop menu, touch
  // covers mobile (where there is no hover) and focus covers keyboard tabbing;
  // preloadRoute de-duplicates, so firing all three costs one fetch.
  const prefetch = (path) => ({
    onMouseEnter: () => preloadRoute(path),
    onTouchStart: () => preloadRoute(path),
    onFocus: () => preloadRoute(path),
  });

  const toggleMobileDropdown = (label) =>
    setOpenMobileDropdown(prev => (prev === label ? null : label));

  /* ── colours that adapt to light/dark + hero state ── */
  const navBg   = trigger
    ? (mode === 'dark' ? 'rgba(15,26,16,0.95)' : 'rgba(255,255,255,0.95)')
    : 'transparent';
  const pillBg  = onHero ? alpha('#ffffff', 0.08) : alpha(primary, 0.06);
  const pillBdr = `1px solid ${onHero ? alpha('#ffffff', 0.2) : alpha(primary, 0.12)}`;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: navBg,
        backdropFilter: trigger ? 'blur(24px)' : 'none',
        borderBottom: trigger ? `1px solid ${alpha(primary, 0.08)}` : 'none',
        transition: 'background-color 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease',
        py: 1.5,
        color: onHero ? '#ffffff' : 'text.primary',
      }}
    >
      {/* Scroll progress bar */}
      <motion.div style={{
        scaleX,
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 3, backgroundColor: primary,
        transformOrigin: '0%', zIndex: 10,
      }} />

      <Container maxWidth={false} sx={{ maxWidth: '1300px', mx: 'auto' }}>
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0 } }}>

          {/* Logo */}
          <Box
            component={RouterLink}
            to="/"
            aria-label="Milta home"
            sx={{
              width: { xs: 100, md: 140 }, height: { xs: 52, md: 72 }, display: 'flex', alignItems: 'center',
              filter: onHero ? 'brightness(0) invert(1)' : mode === 'dark' ? 'brightness(0) invert(1)' : 'none',
              transition: 'filter 0.4s ease',
            }}
          >
            {/* site-logo is the hook the pre-boot theme rules in index.html use
                to invert the logo before React has mounted. */}
            <img src="/logo.svg" alt="Milta Logo" className="site-logo" style={{ width: '100%', maxHeight: '100%' }} />
          </Box>

          {/* Desktop nav pill group */}
          <Box sx={{
            display: { xs: 'none', md: 'flex' },
            // Tightened between md and lg: at 900-1016px the full-width row
            // overran the viewport and the CTA at its end was clipped off.
            alignItems: 'center', gap: { md: 0.15, lg: 0.5 },
            px: 1.5, py: 1,
            borderRadius: '50px',
            bgcolor: pillBg, border: pillBdr,
            backdropFilter: onHero ? 'blur(12px)' : 'none',
            transition: 'all 0.4s ease',
          }}>
            {navItems.map((item) => {
              const active = isActive(item);

              if (item.children) {
                return (
                  <Box
                    key={item.label}
                    onMouseEnter={() => openMenu(item.label)}
                    onMouseLeave={closeMenu}
                    sx={{ position: 'relative' }}
                  >
                    <Typography
                      variant="body2"
                      {...(item.hasPage ? { component: RouterLink, to: item.path, onClick: () => setOpenDropdown(null), ...prefetch(item.path) } : {})}
                      sx={{
                      px: { md: 1.2, lg: 2.2 }, py: 1, borderRadius: '50px',
                      fontWeight: active ? 800 : 600, fontSize: '0.82rem', letterSpacing: 1.2,
                      cursor: 'pointer', textDecoration: 'none',
                      display: 'flex', alignItems: 'center', gap: 0.5,
                      transition: 'all 0.25s ease', userSelect: 'none',
                      color: onHero
                        ? (active ? '#ffffff' : alpha('#ffffff', 0.75))
                        : (active ? primary : 'text.primary'),
                      bgcolor: onHero
                        ? (active ? alpha('#ffffff', 0.18) : 'transparent')
                        : (active ? alpha(primary, 0.12) : 'transparent'),
                      border: active
                        ? `1px solid ${onHero ? alpha('#ffffff', 0.35) : alpha(primary, 0.25)}`
                        : '1px solid transparent',
                      '&:hover': {
                        color: onHero ? '#ffffff' : primary,
                        bgcolor: 'transparent',
                      },
                    }}>
                      {item.label.toUpperCase()}
                      <KeyboardArrowDownIcon sx={{
                        fontSize: 17, transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                        transform: openDropdown === item.label ? 'rotate(180deg)' : 'rotate(0deg)',
                      }} />
                    </Typography>

                    {/* Dropdown panel — viewport-centred via position:fixed */}
                    <AnimatePresence>
                      {openDropdown === item.label && (
                        <Box sx={{
                          position: 'fixed',
                          top: '88px',
                          left: '50%',
                          zIndex: 1500,
                          pointerEvents: 'none',
                          transition: 'top 0.4s cubic-bezier(0.4,0,0.2,1)',
                        }}>
                          <motion.div
                            key="dropdown"
                            onMouseEnter={() => openMenu(item.label)}
                            onMouseLeave={closeMenu}
                            transformTemplate={(_, gen) => `translateX(-50%) ${gen}`}
                            initial={{ opacity: 0, y: -10, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0,   scale: 1 }}
                            exit={{    opacity: 0, y: -8,  scale: 0.96 }}
                            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                            style={{
                              pointerEvents: 'auto',
                              background: mode === 'dark' ? 'rgba(15,26,16,0.97)' : 'rgba(255,255,255,0.97)',
                              backdropFilter: 'blur(24px)',
                              borderRadius: 18,
                              border: `1px solid ${alpha(primary, 0.13)}`,
                              boxShadow: `0 20px 56px ${alpha(primary, 0.14)}, 0 2px 10px rgba(0,0,0,0.08)`,
                              padding: '14px',
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '4px',
                              minWidth: 360,
                            }}
                          >
                            {item.children.map((child, idx) => {
                              const childActive = location.pathname === child.path;
                              return (
                                <motion.div
                                  key={child.label}
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: Math.min(idx * 0.04, 0.15), duration: 0.18, ease: 'easeOut' }}
                                >
                                  <Box
                                    component={RouterLink}
                                    to={child.path}
                                    onClick={() => setOpenDropdown(null)}
                                    {...prefetch(child.path)}
                                    sx={{
                                      display: 'flex', alignItems: 'center', gap: 1.2,
                                      px: 1.8, py: 1.15, borderRadius: '10px',
                                      textDecoration: 'none',
                                      bgcolor: childActive ? alpha(primary, 0.1) : 'transparent',
                                      border: `1px solid ${childActive ? alpha(primary, 0.2) : 'transparent'}`,
                                      transition: 'all 0.2s ease',
                                      '&:hover': {
                                        bgcolor: 'transparent',
                                        border: '1px solid transparent',
                                        '& .dot': { transform: 'scale(1.2)', color: primary },
                                        '& .lbl': { color: primary, letterSpacing: 1.4 },
                                      },
                                    }}
                                  >
                                    <ChevronRightIcon className="dot" sx={{
                                      fontSize: 14, flexShrink: 0,
                                      color: childActive ? primary : alpha(primary, 0.4),
                                      transition: 'all 0.2s ease',
                                    }} />
                                    <Typography className="lbl" variant="body2" sx={{
                                      fontWeight: childActive ? 800 : 600,
                                      fontSize: '0.78rem', letterSpacing: 1,
                                      color: childActive ? primary : 'text.primary',
                                      whiteSpace: 'nowrap', transition: 'all 0.2s ease',
                                    }}>
                                      {child.label.toUpperCase()}
                                    </Typography>
                                  </Box>
                                </motion.div>
                              );
                            })}
                          </motion.div>
                        </Box>
                      )}
                    </AnimatePresence>
                  </Box>
                );
              }

              return (
                <Typography
                  key={item.label}
                  component={RouterLink}
                  to={item.path}
                  {...prefetch(item.path)}
                  variant="body2"
                  sx={{
                    px: { md: 1.2, lg: 2.2 }, py: 1, borderRadius: '50px',
                    fontWeight: active ? 800 : 600, fontSize: '0.82rem', letterSpacing: 1.2,
                    textDecoration: 'none', cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    color: onHero
                      ? (active ? '#ffffff' : alpha('#ffffff', 0.75))
                      : (active ? primary : 'text.primary'),
                    bgcolor: onHero
                      ? (active ? alpha('#ffffff', 0.18) : 'transparent')
                      : (active ? alpha(primary, 0.12) : 'transparent'),
                    border: active
                      ? `1px solid ${onHero ? alpha('#ffffff', 0.35) : alpha(primary, 0.25)}`
                      : '1px solid transparent',
                    '&:hover': {
                      color: onHero ? '#ffffff' : primary,
                      bgcolor: 'transparent',
                    },
                  }}
                >
                  {item.label.toUpperCase()}
                </Typography>
              );
            })}
          </Box>

          {/* Right cluster: country switcher + theme toggle + CTA */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: { md: 0.75, lg: 1.5 } }}>

            {/* Country switcher */}
            <CountrySwitcher onHero={onHero} />

            {/* Dark / Light toggle */}
            <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} transition={{ duration: 0.18 }}>
              <IconButton
                onClick={toggleMode}
                aria-label="Toggle dark mode"
                sx={{
                  width: 42, height: 42, borderRadius: '50%',
                  bgcolor: onHero ? alpha('#ffffff', 0.12) : alpha(primary, 0.08),
                  border: `1px solid ${onHero ? alpha('#ffffff', 0.22) : alpha(primary, 0.18)}`,
                  color: onHero ? '#ffffff' : 'text.primary',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: onHero ? alpha('#ffffff', 0.22) : alpha(primary, 0.16),
                  },
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mode === 'dark' ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.22 }}
                      style={{ display: 'flex' }}
                    >
                      <WbSunnyIcon sx={{ fontSize: 18 }} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.22 }}
                      style={{ display: 'flex' }}
                    >
                      <DarkModeIcon sx={{ fontSize: 18 }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </IconButton>
            </motion.div>

            {/* CTA */}
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
              <Button
                variant={onHero ? 'outlined' : 'contained'}
                onClick={openConsultation}
                sx={{
                  // Between the md breakpoint and ~1200px the nav row is at its
                  // tightest: links, switcher, toggle and this CTA all compete
                  // for the same line. Without nowrap the label was breaking
                  // across two lines there, and flexShrink kept squeezing the
                  // box until it ran past the viewport edge. Tracking and
                  // padding come down in that band instead, the same trade the
                  // hero CTAs make.
                  px: { md: 2, lg: 3.5 }, py: 1.2,
                  borderRadius: '50px',
                  fontWeight: 800,
                  fontSize: { md: '0.74rem', lg: '0.82rem' },
                  letterSpacing: { md: 0.6, lg: 1.2 },
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.4s ease',
                  ...(onHero ? {
                    color: '#ffffff',
                    border: `2px solid ${alpha('#ffffff', 0.5)}`,
                    backdropFilter: 'blur(8px)',
                    bgcolor: alpha('#ffffff', 0.08),
                    '&:hover': { border: '2px solid #ffffff', bgcolor: alpha('#ffffff', 0.18), boxShadow: 'none' },
                  } : {
                    bgcolor: primary, color: '#fff', border: 'none',
                    boxShadow: `0 8px 24px ${alpha(primary, 0.3)}`,
                    '&:hover': { bgcolor: theme.palette.primary.dark || '#1a4a1c', boxShadow: `0 12px 32px ${alpha(primary, 0.4)}` },
                  }),
                }}
              >
                GET STARTED
              </Button>
            </motion.div>
          </Box>

          {/* Mobile hamburger */}
          <IconButton
            edge="end"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: 'none' }, color: onHero ? '#ffffff' : 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </Container>

      {/* Mobile full-screen drawer */}
      <Drawer
        anchor="top"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        transitionDuration={{ enter: 0, exit: 200 }}
        sx={{
          '& .MuiDrawer-paper': {
            width: '100%', height: '100%',
            bgcolor: 'background.default',
            display: 'flex', flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', px: { xs: 2.5, sm: 4 }, pt: { xs: 2.5, sm: 3.5 }, pb: { xs: 2, sm: 3 } }}>

          {/* Drawer header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: { xs: 3, sm: 4 }, flexShrink: 0 }}>
            <Box sx={{ width: { xs: 88, sm: 110 }, height: { xs: 44, sm: 54 }, display: 'flex', alignItems: 'center' }}>
              <img
                src="/logo.svg"
                alt="Milta Logo"
                style={{ width: '100%', maxHeight: '100%', filter: mode === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
              />
            </Box>
            <Stack direction="row" alignItems="center" gap={1}>
              <CountrySwitcher size={38} />
              <IconButton
                onClick={toggleMode}
                sx={{ bgcolor: alpha(primary, 0.08), border: `1px solid ${alpha(primary, 0.15)}`, color: 'text.primary', width: 38, height: 38 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mode === 'dark' ? (
                    <motion.div key="sun" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex' }}>
                      <WbSunnyIcon sx={{ fontSize: 17 }} />
                    </motion.div>
                  ) : (
                    <motion.div key="moon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex' }}>
                      <DarkModeIcon sx={{ fontSize: 17 }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </IconButton>
              <IconButton onClick={() => setMobileOpen(false)} sx={{ color: 'text.primary', width: 38, height: 38 }}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>

          {/* Drawer links — scrollable if content overflows */}
          <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <List disablePadding>
              {navItems.map((item, i) => {
                const active = isActive(item);

                if (item.children) {
                  const mobileExpanded = openMobileDropdown === item.label;
                  return (
                    <Box key={item.label} sx={{ mb: mobileExpanded ? 0.5 : { xs: 1, sm: 1.5 } }}>
                      <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: Math.min(i * 0.07 + 0.12, 0.15) }}>
                        <Box
                          onClick={() => toggleMobileDropdown(item.label)}
                          sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            px: 2, py: { xs: 1.1, sm: 1.4 }, borderRadius: '14px',
                            bgcolor: active ? alpha(primary, 0.08) : 'transparent',
                            borderLeft: active ? `3px solid ${primary}` : '3px solid transparent',
                            cursor: 'pointer', transition: '0.25s',
                          }}
                        >
                          <Typography sx={{
                            fontWeight: 800, letterSpacing: '-0.02em',
                            fontSize: { xs: '1.35rem', sm: '1.65rem' },
                            color: active ? primary : 'text.primary',
                          }}>
                            {item.label}
                          </Typography>
                          <KeyboardArrowDownIcon sx={{
                            color: active ? primary : 'text.secondary',
                            fontSize: { xs: 20, sm: 24 },
                            transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                            transform: mobileExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          }} />
                        </Box>
                      </motion.div>

                      <Collapse in={mobileExpanded}>
                        <Box sx={{
                          pl: 1.5, pt: 1, pb: 1.5,
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' },
                          gap: 0.8,
                        }}>
                          {item.children.map((child) => {
                            const childActive = location.pathname === child.path;
                            return (
                              <Box
                                key={child.label}
                                component={RouterLink}
                                to={child.path}
                                onClick={() => { setMobileOpen(false); setOpenMobileDropdown(null); }}
                                {...prefetch(child.path)}
                                sx={{
                                  display: 'flex', alignItems: 'center', gap: 0.8,
                                  px: 1.4, py: { xs: 0.9, sm: 1 }, borderRadius: '10px',
                                  textDecoration: 'none',
                                  bgcolor: childActive ? alpha(primary, 0.1) : alpha(primary, 0.04),
                                  border: `1px solid ${childActive ? alpha(primary, 0.22) : alpha(primary, 0.08)}`,
                                  transition: '0.2s',
                                }}
                              >
                                <ChevronRightIcon sx={{ fontSize: 13, flexShrink: 0, color: childActive ? primary : alpha(primary, 0.4) }} />
                                <Typography sx={{
                                  fontWeight: 700, fontSize: { xs: '0.7rem', sm: '0.76rem' },
                                  letterSpacing: 0.4, lineHeight: 1.3,
                                  color: childActive ? primary : 'text.secondary',
                                }}>
                                  {child.label}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </Collapse>
                    </Box>
                  );
                }

                return (
                  <ListItem key={item.label} disablePadding sx={{ mb: { xs: 1, sm: 1.5 } }} component={RouterLink} to={item.path} {...prefetch(item.path)} onClick={() => setMobileOpen(false)}>
                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: Math.min(i * 0.07 + 0.12, 0.15) }} style={{ width: '100%' }}>
                      <Box sx={{
                        px: 2, py: { xs: 1.1, sm: 1.4 }, borderRadius: '14px',
                        bgcolor: active ? alpha(primary, 0.08) : 'transparent',
                        borderLeft: active ? `3px solid ${primary}` : '3px solid transparent',
                        transition: '0.25s',
                      }}>
                        <Typography sx={{
                          fontWeight: 800, letterSpacing: '-0.02em',
                          fontSize: { xs: '1.35rem', sm: '1.65rem' },
                          color: active ? primary : 'text.primary',
                        }}>
                          {item.label}
                        </Typography>
                      </Box>
                    </motion.div>
                  </ListItem>
                );
              })}
            </List>
          </Box>

          {/* Drawer footer CTA */}
          <Box sx={{ pt: 2, flexShrink: 0 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => { setMobileOpen(false); openConsultation(); }}
              sx={{
                borderRadius: '50px',
                py: { xs: 1.5, sm: 2 },
                fontWeight: 800,
                fontSize: { xs: '0.88rem', sm: '1rem' },
                bgcolor: primary,
                boxShadow: `0 12px 32px ${alpha(primary, 0.3)}`,
              }}
            >
              BOOK CONSULTATION
            </Button>
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Navbar;

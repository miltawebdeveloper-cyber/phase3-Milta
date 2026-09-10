import React from 'react';
import { Box, Container, Typography, Grid, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme, alpha } from '@mui/material/styles';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GavelIcon from '@mui/icons-material/Gavel';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SpeedIcon from '@mui/icons-material/Speed';
import ErrorIcon from '@mui/icons-material/Error';
import CloudDoneIcon from '@mui/icons-material/CloudDone';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px 0px 900px 0px' },
  transition: { duration: 0.25, delay: Math.min(delay, 0.05), ease: [0.22, 1, 0.36, 1] },
});

const TaxWhyChoose = () => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper', position: 'relative', overflow: 'hidden' }}>
      <motion.div
        animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: -160, right: -160, pointerEvents: 'none' }}
      >
        <Box sx={{ width: 480, height: 480, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(primary, 0.07)} 0%, transparent 70%)` }} />
      </motion.div>

      <Container maxWidth={false} sx={{ maxWidth: '1300px', mx: 'auto', px: { xs: 3, md: 4 }, position: 'relative', zIndex: 1 }}>
        <Box sx={{ mb: { xs: 6, md: 8 } }}>
          <motion.div {...fadeUp(0)}>
            <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 6, color: '#266929', fontSize: '0.75rem', mb: 2, display: 'block' }}>
              OUR SERVICES
            </Typography>
          </motion.div>
          <motion.div {...fadeUp(0.1)}>
            <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, lineHeight: 1.2, maxWidth: 680 }}>
              Comprehensive{' '}
              <Box component="span" sx={{ color: primary }}>Federal, State, and City Tax Services</Box>
            </Typography>
          </motion.div>
          <motion.div {...fadeUp(0.18)}>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', color: 'text.secondary', maxWidth: 580, mt: 2 }}>
              We provide complete tax planning, preparation, and e-filing services to ensure compliance and optimize refunds.
            </Typography>
          </motion.div>
          <motion.div {...fadeUp(0.22)}>
            <Box sx={{ width: 48, height: 3, borderRadius: 4, bgcolor: alpha(primary, 0.3), mt: 3 }} />
          </motion.div>
        </Box>

        {/* 2-Column Grid Layout - Each row has exactly 2 columns */}
        <Grid container spacing={3} sx={{ justifyContent: "center" }}>
          {/* Row 1, Column 1 - Tax Preparation */}
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', justifyContent: 'center' }}>
            <motion.div {...fadeUp(0.1)} style={{ height: '100%', width: '100%', maxWidth: 600 }}>
              <Box sx={{ 
                p: 4, 
                borderRadius: '18px', 
                bgcolor: 'background.default', 
                border: '1px solid rgba(0,0,0,0.07)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                width: 600,
                height: 600,
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(0,0,0,0.09)' }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ 
                    width: 48, height: 48, borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: alpha(primary, 0.08), border: `1px solid ${alpha(primary, 0.15)}`,
                    mr: 2,
                    flexShrink: 0
                  }}>
                    <DescriptionIcon sx={{ fontSize: 24, color: primary }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Tax Preparation
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.75 }}>
                  Federal, State, and City Tax Preparation service refers to organizing and filing tax returns in compliance with U.S. tax laws.
                </Typography>
                <List dense disablePadding sx={{ flex: 1 }}>
                  <ListItem disablePadding sx={{ mb: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon sx={{ fontSize: 18, color: primary }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>Federal Tax Preparation:</Typography>} 
                      secondary={<Typography variant="body2" sx={{ color: 'text.secondary' }}>Compliance with IRS requirements for individuals and corporations.</Typography>}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ mb: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon sx={{ fontSize: 18, color: primary }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>State Tax Preparation:</Typography>} 
                      secondary={<Typography variant="body2" sx={{ color: 'text.secondary' }}>State-specific income, property, and sales tax filing.</Typography>}
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon sx={{ fontSize: 18, color: primary }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>City Tax Preparation:</Typography>} 
                      secondary={<Typography variant="body2" sx={{ color: 'text.secondary' }}>Handling local taxes for complete compliance.</Typography>}
                    />
                  </ListItem>
                </List>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 3, pt: 2, borderTop: '1px solid rgba(0,0,0,0.06)', fontStyle: 'italic' }}>
                  Our planning service minimizes liabilities and optimizes refunds through accurate and timely filings.
                </Typography>
              </Box>
            </motion.div>
          </Grid>

          {/* Row 1, Column 2 - Tax Review and Finalization */}
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', justifyContent: 'center' }}>
            <motion.div {...fadeUp(0.15)} style={{ height: '100%', width: '100%', maxWidth: 600 }}>
              <Box sx={{ 
                p: 4, 
                borderRadius: '18px', 
                bgcolor: 'background.default', 
                border: '1px solid rgba(0,0,0,0.07)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                width: 600,
                height: 600,
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(0,0,0,0.09)' }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ 
                    width: 48, height: 48, borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: alpha(primary, 0.08), border: `1px solid ${alpha(primary, 0.15)}`,
                    mr: 2,
                    flexShrink: 0
                  }}>
                    <GavelIcon sx={{ fontSize: 24, color: primary }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Tax Review and Finalization
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.75 }}>
                  Meticulous evaluation of tax forms to confirm accuracy and compliance before submission.
                </Typography>
                <List dense disablePadding sx={{ flex: 1 }}>
                  <ListItem disablePadding sx={{ mb: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon sx={{ fontSize: 18, color: primary }} />
                    </ListItemIcon>
                    <ListItemText primary={<Typography variant="body2">All deductions and credits are applied.</Typography>} />
                  </ListItem>
                  <ListItem disablePadding sx={{ mb: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon sx={{ fontSize: 18, color: primary }} />
                    </ListItemIcon>
                    <ListItemText primary={<Typography variant="body2">Errors are identified and corrected.</Typography>} />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon sx={{ fontSize: 18, color: primary }} />
                    </ListItemIcon>
                    <ListItemText primary={<Typography variant="body2">Filings meet federal, state, and city requirements.</Typography>} />
                  </ListItem>
                </List>
              </Box>
            </motion.div>
          </Grid>

          {/* Row 2, Column 1 - Tax Forms We Specialize In */}
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', justifyContent: 'center' }}>
            <motion.div {...fadeUp(0.2)} style={{ height: '100%', width: '100%', maxWidth: 600 }}>
              <Box sx={{ 
                p: 4, 
                borderRadius: '18px', 
                bgcolor: 'background.default', 
                border: '1px solid rgba(0,0,0,0.07)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                width: 600,
                height: 600,
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(0,0,0,0.09)' }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ 
                    width: 48, height: 48, borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: alpha(primary, 0.08), border: `1px solid ${alpha(primary, 0.15)}`,
                    mr: 2,
                    flexShrink: 0
                  }}>
                    <AccountBalanceIcon sx={{ fontSize: 24, color: primary }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Tax Forms We Specialize In
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.75 }}>
                  We handle the preparation of a broad range of tax forms, including but not limited to:
                </Typography>
                <List dense disablePadding sx={{ flex: 1 }}>
                  <ListItem disablePadding sx={{ mb: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon sx={{ fontSize: 18, color: primary }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>Form 1040:</Typography>} 
                      secondary={<Typography variant="body2" sx={{ color: 'text.secondary' }}>Individual Income Tax Returns.</Typography>}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ mb: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon sx={{ fontSize: 18, color: primary }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>Form 1041:</Typography>} 
                      secondary={<Typography variant="body2" sx={{ color: 'text.secondary' }}>Returns for estates and trusts.</Typography>}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ mb: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon sx={{ fontSize: 18, color: primary }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>Form 1065:</Typography>} 
                      secondary={<Typography variant="body2" sx={{ color: 'text.secondary' }}>Returns from partnerships used to record credits, losses, and profits.</Typography>}
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleIcon sx={{ fontSize: 18, color: primary }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>Form 990:</Typography>} 
                      secondary={<Typography variant="body2" sx={{ color: 'text.secondary' }}>Returns for Non-Profit Organizations, maintaining tax-exempt status.</Typography>}
                    />
                  </ListItem>
                </List>
              </Box>
            </motion.div>
          </Grid>

          {/* Row 2, Column 2 - Tax E-Filing */}
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', justifyContent: 'center' }}>
            <motion.div {...fadeUp(0.25)} style={{ height: '100%', width: '100%', maxWidth: 600 }}>
              <Box sx={{ 
                p: 4, 
                borderRadius: '18px', 
                background: 'linear-gradient(155deg, #0d1f0e 0%, #163018 55%, #1e4020 100%)',
                boxShadow: `0 8px 32px ${alpha(primary, 0.25)}`,
                width: 600,
                height: 600,
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                '&:hover': { transform: 'translateY(-5px)', boxShadow: `0 20px 52px ${alpha(primary, 0.35)}` }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ 
                    width: 48, height: 48, borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: alpha('#fff', 0.1), border: `1px solid ${alpha('#fff', 0.15)}`,
                    mr: 2,
                    flexShrink: 0
                  }}>
                    <CloudUploadIcon sx={{ fontSize: 24, color: alpha('#fff', 0.9) }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff' }}>
                    Tax E-Filing
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: alpha('#fff', 0.75), mb: 3, lineHeight: 1.75 }}>
                  Electronic submission of tax returns to the IRS and local authorities.
                </Typography>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>
                  Why Choose E-Filing?
                </Typography>
                <List dense disablePadding sx={{ flex: 1 }}>
                  <ListItem disablePadding sx={{ mb: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <SpeedIcon sx={{ fontSize: 18, color: alpha('#fff', 0.8) }} />
                    </ListItemIcon>
                    <ListItemText primary={<Typography variant="body2" sx={{ color: alpha('#fff', 0.75) }}>Accelerated processing and faster refunds.</Typography>} />
                  </ListItem>
                  <ListItem disablePadding sx={{ mb: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <ErrorIcon sx={{ fontSize: 18, color: alpha('#fff', 0.8) }} />
                    </ListItemIcon>
                    <ListItemText primary={<Typography variant="body2" sx={{ color: alpha('#fff', 0.75) }}>Reduced risk of errors.</Typography>} />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CloudDoneIcon sx={{ fontSize: 18, color: alpha('#fff', 0.8) }} />
                    </ListItemIcon>
                    <ListItemText primary={<Typography variant="body2" sx={{ color: alpha('#fff', 0.75) }}>Environmentally friendly and paperless process.</Typography>} />
                  </ListItem>
                </List>
              </Box>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default TaxWhyChoose;
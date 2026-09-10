import React from 'react';
import { Box, Container, Grid, Typography, Stack, Card } from '@mui/material';
import { motion } from 'framer-motion';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import IconButton from '@mui/material/IconButton';

const team = [
  { name: 'John Anderson', role: 'Chief Executive Officer', expertise: 'Financial Strategy & Leadership', image: '👔' },
  { name: 'Sarah Mitchell', role: 'Chief Financial Officer', expertise: 'Accounting & Compliance', image: '💼' },
  { name: 'Michael Chen', role: 'Director of Services', expertise: 'Tax Planning & Optimization', image: '📊' },
  { name: 'Emma Rodriguez', role: 'Head of Operations', expertise: 'Process Management & Efficiency', image: '⚙️' },
  { name: 'David Thompson', role: 'Lead Consultant', expertise: 'Business Advisory', image: '🎯' },
  { name: 'Lisa Wang', role: 'Senior Accountant', expertise: 'Bookkeeping & Analysis', image: '📈' }
];

const AboutTeam = () => {
  return (
    <Box sx={{ py: { xs: 10, md: 16 }, bgcolor: 'background.default' }}>
      <Container maxWidth={false} sx={{ maxWidth: '1300px', mx: 'auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px 900px 0px' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <Box sx={{ mb: 8, maxWidth: '700px' }}>
            <Typography
              variant="overline"
              sx={{
                fontWeight: 900,
                letterSpacing: '0.2em',
                color: 'primary.main',
                fontSize: '0.75rem',
                mb: 3,
                display: 'block'
              }}
            >
              OUR TEAM
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '2rem', md: '2.8rem' },
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                mb: 3
              }}
            >
              Meet The Experts
            </Typography>
            <Typography
              sx={{
                fontSize: '1rem',
                lineHeight: 1.8,
                color: 'text.secondary',
                fontWeight: 400
              }}
            >
              Our diverse team brings together specialized expertise, proven experience, and a
              shared commitment to client success. Each member brings unique skills and perspectives
              to deliver exceptional results.
            </Typography>
          </Box>
        </motion.div>

        <Grid container spacing={{ xs: 4, md: 5 }}>
          {team.map((member, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px 0px 900px 0px' }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.1, 0.15), ease: 'easeOut' }}
              >
                <Card
                  sx={{
                    p: 4,
                    height: '100%',
                    bgcolor: 'background.paper',
                    border: '1px solid rgba(0,0,0,0.04)',
                    borderRadius: '24px',
                    boxShadow: '0 4px 30px rgba(0,0,0,0.03)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 30px 60px rgba(0,0,0,0.06)',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <Stack spacing={3} sx={{ height: '100%' }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        backgroundColor: '#E8F5E9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem'
                      }}
                    >
                      {member.image}
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{ fontSize: '1.2rem', fontWeight: 800, mb: 0.5, color: 'text.primary' }}
                      >
                        {member.name}
                      </Typography>
                      <Typography
                        sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'primary.main', mb: 1.5, letterSpacing: 0.5 }}
                      >
                        {member.role}
                      </Typography>
                      <Typography
                        sx={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'text.secondary', fontWeight: 400 }}
                      >
                        {member.expertise}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ pt: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                      <IconButton
                        size="small"
                        sx={{
                          color: 'text.primary',
                          bgcolor: 'action.hover',
                          transition: '0.3s',
                          '&:hover': { backgroundColor: 'primary.main', color: 'white' }
                        }}
                      >
                        <LinkedInIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{
                          color: 'text.primary',
                          bgcolor: 'action.hover',
                          transition: '0.3s',
                          '&:hover': { backgroundColor: 'primary.main', color: 'white' }
                        }}
                      >
                        <TwitterIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default AboutTeam;

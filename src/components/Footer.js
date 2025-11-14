import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  Divider,
  alpha
} from '@mui/material';
import {
  Facebook,
  Twitter,
  LinkedIn,
  Email,
  Phone,
  LocationOn,
} from '@mui/icons-material';

/**
 * Footer component
 *
 * Purpose:
 * - Render the site footer with organization information, quick links,
 *   resources, and contact details.
 * - Use consistent color tokens and simple accessible markup.
 */
const Footer = () => {
  // Color tokens used for consistent styling across the footer.
  const primaryColor = '#000000';
  const accentColor = '#FF6B35';

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: primaryColor,
        color: 'white',
        py: 6,
        mt: 'auto',
        borderTop: `1px solid ${alpha(accentColor, 0.2)}`
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Branding and social links */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: accentColor }}>
              Career Guidance Lesotho
            </Typography>

            <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255,255,255,0.8)' }}>
              Bridging the gap between education and employment in Lesotho.
              Helping students discover career paths and connect with opportunities.
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                aria-label="facebook"
                sx={{
                  color: 'white',
                  '&:hover': {
                    color: accentColor,
                    backgroundColor: alpha(accentColor, 0.1)
                  }
                }}
              >
                <Facebook />
              </IconButton>

              <IconButton
                aria-label="twitter"
                sx={{
                  color: 'white',
                  '&:hover': {
                    color: accentColor,
                    backgroundColor: alpha(accentColor, 0.1)
                  }
                }}
              >
                <Twitter />
              </IconButton>

              <IconButton
                aria-label="linkedin"
                sx={{
                  color: 'white',
                  '&:hover': {
                    color: accentColor,
                    backgroundColor: alpha(accentColor, 0.1)
                  }
                }}
              >
                <LinkedIn />
              </IconButton>
            </Box>
          </Grid>

          {/* Quick navigation links */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: accentColor }}>
              Quick Links
            </Typography>

            <Link href="/" color="inherit" display="block" sx={{ mb: 1, textDecoration: 'none', color: 'rgba(255,255,255,0.8)', '&:hover': { color: accentColor }, transition: 'color 0.3s ease' }}>
              Home
            </Link>
            <Link href="/courses" color="inherit" display="block" sx={{ mb: 1, textDecoration: 'none', color: 'rgba(255,255,255,0.8)', '&:hover': { color: accentColor }, transition: 'color 0.3s ease' }}>
              Courses
            </Link>
            <Link href="/jobs" color="inherit" display="block" sx={{ mb: 1, textDecoration: 'none', color: 'rgba(255,255,255,0.8)', '&:hover': { color: accentColor }, transition: 'color 0.3s ease' }}>
              Job Opportunities
            </Link>
            <Link href="/institutions" color="inherit" display="block" sx={{ mb: 1, textDecoration: 'none', color: 'rgba(255,255,255,0.8)', '&:hover': { color: accentColor }, transition: 'color 0.3s ease' }}>
              Institutions
            </Link>
            <Link href="/companies" color="inherit" display="block" sx={{ mb: 1, textDecoration: 'none', color: 'rgba(255,255,255,0.8)', '&:hover': { color: accentColor }, transition: 'color 0.3s ease' }}>
              Companies
            </Link>
          </Grid>

          {/* Resources links */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: accentColor }}>
              Resources
            </Typography>

            <Link href="/career-guide" color="inherit" display="block" sx={{ mb: 1, textDecoration: 'none', color: 'rgba(255,255,255,0.8)', '&:hover': { color: accentColor }, transition: 'color 0.3s ease' }}>
              Career Guide
            </Link>
            <Link href="/scholarships" color="inherit" display="block" sx={{ mb: 1, textDecoration: 'none', color: 'rgba(255,255,255,0.8)', '&:hover': { color: accentColor }, transition: 'color 0.3s ease' }}>
              Scholarships
            </Link>
            <Link href="/faq" color="inherit" display="block" sx={{ mb: 1, textDecoration: 'none', color: 'rgba(255,255,255,0.8)', '&:hover': { color: accentColor }, transition: 'color 0.3s ease' }}>
              FAQ
            </Link>
            <Link href="/blog" color="inherit" display="block" sx={{ mb: 1, textDecoration: 'none', color: 'rgba(255,255,255,0.8)', '&:hover': { color: accentColor }, transition: 'color 0.3s ease' }}>
              Blog
            </Link>
            <Link href="/contact" color="inherit" display="block" sx={{ mb: 1, textDecoration: 'none', color: 'rgba(255,255,255,0.8)', '&:hover': { color: accentColor }, transition: 'color 0.3s ease' }}>
              Contact Us
            </Link>
          </Grid>

          {/* Contact information */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: accentColor }}>
              Contact Info
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocationOn sx={{ mr: 1, color: accentColor }} />
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Maseru, Lesotho
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Phone sx={{ mr: 1, color: accentColor }} />
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                +266 1234 5678
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Email sx={{ mr: 1, color: accentColor }} />
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                info@careerguidels.org
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, backgroundColor: alpha(accentColor, 0.2) }} />

        {/* Copyright and closing note */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            © {new Date().getFullYear()} Career Guidance and Employment Integration Platform - Lesotho. All rights reserved.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
            Developed for the future of Lesotho
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
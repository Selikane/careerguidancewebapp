import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Facebook,
  Twitter,
  LinkedIn,
  Email,
  Phone,
  LocationOn,
} from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#1a237e',
        color: 'white',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Company Info */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Career Guidance Lesotho
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Bridging the gap between education and employment in Lesotho. 
              Helping students discover their career path and connect with opportunities.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton sx={{ color: 'white' }}>
                <Facebook />
              </IconButton>
              <IconButton sx={{ color: 'white' }}>
                <Twitter />
              </IconButton>
              <IconButton sx={{ color: 'white' }}>
                <LinkedIn />
              </IconButton>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Quick Links
            </Typography>
            <Link href="/" color="inherit" display="block" sx={{ mb: 1, textDecoration: 'none' }}>
              Home
            </Link>
            <Link href="/courses" color="inherit" display="block" sx={{ mb: 1, textDecoration: 'none' }}>
              Courses
            </Link>
            <Link href="/jobs" color="inherit" display="block" sx={{ mb: 1, textDecoration: 'none' }}>
              Job Opportunities
            </Link>
            <Link href="/institutions" color="inherit" display="block" sx={{ mb: 1, textDecoration: 'none' }}>
              Institutions
            </Link>
            <Link href="/companies" color="inherit" display="block" sx={{ mb: 1, textDecoration: 'none' }}>
              Companies
            </Link>
          </Grid>

          {/* Resources */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Resources
            </Typography>
            <Link href="/career-guide" color="inherit" display="block" sx={{ mb: 1, textDecoration: 'none' }}>
              Career Guide
            </Link>
            <Link href="/scholarships" color="inherit" display="block" sx={{ mb: 1, textDecoration: 'none' }}>
              Scholarships
            </Link>
            <Link href="/faq" color="inherit" display="block" sx={{ mb: 1, textDecoration: 'none' }}>
              FAQ
            </Link>
            <Link href="/blog" color="inherit" display="block" sx={{ mb: 1, textDecoration: 'none' }}>
              Blog
            </Link>
            <Link href="/contact" color="inherit" display="block" sx={{ mb: 1, textDecoration: 'none' }}>
              Contact Us
            </Link>
          </Grid>

          {/* Contact Info */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Contact Info
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocationOn sx={{ mr: 1 }} />
              <Typography variant="body2">
                Maseru, Lesotho
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Phone sx={{ mr: 1 }} />
              <Typography variant="body2">
                +266 1234 5678
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Email sx={{ mr: 1 }} />
              <Typography variant="body2">
                info@careerguidels.org
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, backgroundColor: 'rgba(255,255,255,0.3)' }} />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2">
            © {new Date().getFullYear()} Career Guidance and Employment Integration Platform - Lesotho. 
            All rights reserved.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Developed with  for the future of Lesotho
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
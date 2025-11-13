import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  alpha,
  Fade,
  Slide,
  Stack
} from '@mui/material';
import {
  School,
  Work,
  Business,
  TrendingUp,
  ArrowForward,
  Search,
  Map,
  Build,
  Analytics
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  // Black and white color palette
  const primaryColor = '#000000';
  const secondaryColor = '#333333';
  const accentColor = '#666666';
  const backgroundColor = '#FFFFFF';
  const lightGray = '#f5f5f5';
  const mediumGray = '#e0e0e0';

  // Background image URL - Professional education/career image
  const heroBackground = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80';

  const features = [
    {
      icon: <Search sx={{ fontSize: 40 }} />,
      title: 'Course Discovery',
      description: 'Find educational programs that match your academic goals and career aspirations with our comprehensive database.',
      action: 'Explore Courses',
      path: '/courses',
      delay: 0
    },
    {
      icon: <Map sx={{ fontSize: 40 }} />,
      title: 'Career Pathways',
      description: 'Navigate your professional journey with guided career roadmaps and personalized opportunity matching.',
      action: 'View Pathways',
      path: '/jobs',
      delay: 100
    },
    {
      icon: <Build sx={{ fontSize: 40 }} />,
      title: 'Institution Portal',
      description: 'Comprehensive platform for educational institutions to manage student engagement and admissions processes.',
      action: 'Access Portal',
      path: '/login',
      delay: 200
    },
    {
      icon: <Analytics sx={{ fontSize: 40 }} />,
      title: 'Skill Development',
      description: 'Track your progress and identify opportunities for professional growth through detailed analytics.',
      action: 'View Insights',
      path: '/register',
      delay: 300
    }
  ];

  return (
    <Box sx={{ overflow: 'hidden', backgroundColor: backgroundColor }}>
      {/* Hero Section with Centered Content */}
      <Box
        sx={{
          minHeight: '100vh',
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          textAlign: 'center'
        }}
      >
        <Container maxWidth="lg">
          <Fade in timeout={1000}>
            <Stack spacing={4} alignItems="center" sx={{ maxWidth: '800px', mx: 'auto' }}>
              
              {/* Main Heading */}
              <Stack spacing={2}>
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: '700',
                    fontSize: { xs: '3rem', md: '4.5rem' },
                    lineHeight: 1.1,
                    color: 'white',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Transform Your
                  <Box
                    component="span"
                    sx={{
                      background: 'linear-gradient(45deg, #FFFFFF, #E0E0E0)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      display: 'block'
                    }}
                  >
                    Future in Lesotho
                  </Box>
                </Typography>
              </Stack>

              {/* Engaging Paragraphs */}
              <Stack spacing={3}>
                <Typography
                  variant="h5"
                  sx={{
                    color: 'rgba(255,255,255,0.95)',
                    lineHeight: 1.6,
                    fontWeight: '300',
                    fontSize: { xs: '1.1rem', md: '1.4rem' }
                  }}
                >
                  Discover your path to success with Lesotho's premier career guidance platform. 
                  We bridge the gap between education and employment.
                </Typography>
                
                <Typography
                  variant="h6"
                  sx={{
                    color: 'rgba(255,255,255,0.8)',
                    lineHeight: 1.6,
                    fontWeight: '300',
                    fontSize: { xs: '1rem', md: '1.2rem' },
                    maxWidth: '600px',
                    mx: 'auto'
                  }}
                >
                  Join thousands of students and professionals who have found their ideal career paths 
                  through personalized guidance and industry connections.
                </Typography>
              </Stack>

              {/* Action Buttons */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center" alignItems="center" sx={{ pt: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register')}
                  startIcon={<TrendingUp />}
                  sx={{
                    px: 5,
                    py: 2,
                    fontSize: '1.1rem',
                    backgroundColor: '#FF6B35',
                    color: 'white',
                    fontWeight: '600',
                    borderRadius: '50px',
                    minWidth: '220px',
                    '&:hover': {
                      backgroundColor: '#E55A2B',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 12px 25px rgba(255, 107, 53, 0.4)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Get Started
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/courses')}
                  endIcon={<ArrowForward />}
                  sx={{
                    px: 5,
                    py: 2,
                    fontSize: '1.1rem',
                    borderColor: 'white',
                    color: 'white',
                    borderRadius: '50px',
                    minWidth: '220px',
                    fontWeight: '600',
                    '&:hover': {
                      borderColor: '#FF6B35',
                      backgroundColor: 'rgba(255, 107, 53, 0.1)',
                      transform: 'translateY(-3px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Explore Opportunities
                </Button>
              </Stack>

              {/* Trust Indicator */}
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  pt: 4,
                  fontStyle: 'italic'
                }}
              >
                Trusted by 10,000+ students and professionals across Lesotho
              </Typography>
            </Stack>
          </Fade>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <Stack spacing={6} alignItems="center">
          {/* Header Section */}
          <Stack spacing={3} alignItems="center" textAlign="center" maxWidth="800px">
            <Typography
              variant="h3"
              sx={{
                fontWeight: '300',
                color: primaryColor,
                letterSpacing: '-0.01em'
              }}
            >
              Our Services
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: secondaryColor, 
                lineHeight: 1.6,
                maxWidth: '600px',
                fontWeight: '300'
              }}
            >
              Comprehensive solutions designed to support students, professionals, and educational institutions in Lesotho
            </Typography>
          </Stack>

          {/* Cards Grid - All Equal Size */}
          <Grid container spacing={4} sx={{ width: '100%' }}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Slide in timeout={800} direction="up" style={{ transitionDelay: `${feature.delay}ms` }}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      border: `1px solid ${mediumGray}`,
                      borderRadius: '12px',
                      transition: 'all 0.3s ease',
                      backgroundColor: backgroundColor,
                      minHeight: '400px',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 20px 40px ${alpha(primaryColor, 0.15)}`,
                        borderColor: '#FF6B35'
                      }
                    }}
                  >
                    <CardContent sx={{ 
                      p: 4, 
                      flexGrow: 1, 
                      display: 'flex', 
                      flexDirection: 'column',
                      height: '100%'
                    }}>
                      <Stack spacing={4} height="100%" justifyContent="space-between">
                        {/* Icon */}
                        <Box sx={{ 
                          color: '#FF6B35', 
                          display: 'flex', 
                          justifyContent: 'center',
                          height: '80px',
                          alignItems: 'center'
                        }}>
                          {feature.icon}
                        </Box>
                        
                        {/* Content */}
                        <Stack spacing={3} flexGrow={1} textAlign="center" justifyContent="space-between">
                          <Box>
                            <Typography 
                              variant="h5" 
                              sx={{ 
                                fontWeight: '600', 
                                color: primaryColor, 
                                mb: 2,
                                minHeight: '64px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {feature.title}
                            </Typography>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                color: secondaryColor, 
                                lineHeight: 1.6,
                                fontWeight: '300',
                                minHeight: '80px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              {feature.description}
                            </Typography>
                          </Box>
                          
                          {/* Button */}
                          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
                            <Button
                              variant="contained"
                              endIcon={<ArrowForward />}
                              onClick={() => navigate(feature.path)}
                              sx={{
                                backgroundColor: '#FF6B35',
                                color: 'white',
                                borderRadius: '25px',
                                fontWeight: '600',
                                minWidth: '160px',
                                px: 3,
                                '&:hover': {
                                  backgroundColor: '#E55A2B',
                                  transform: 'translateY(-2px)'
                                },
                                transition: 'all 0.3s ease'
                              }}
                            >
                              {feature.action}
                            </Button>
                          </Box>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Slide>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>

      {/* Call to Action */}
      <Box
        sx={{
          py: 12,
          background: `linear-gradient(135deg, ${lightGray} 0%, ${backgroundColor} 100%)`,
          borderTop: `1px solid ${mediumGray}`
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={4} alignItems="center" textAlign="center">
            <Fade in timeout={800}>
              <Stack spacing={3} alignItems="center" maxWidth="600px">
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: '300',
                    color: primaryColor,
                    letterSpacing: '-0.01em'
                  }}
                >
                  Ready to Transform Your Career?
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: secondaryColor,
                    lineHeight: 1.6,
                    fontWeight: '300'
                  }}
                >
                  Join the growing community of professionals who have accelerated their careers 
                  with our personalized guidance platform.
                </Typography>
              </Stack>
            </Fade>

            <Fade in timeout={1000} style={{ transitionDelay: '200ms' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" alignItems="center">
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{
                    px: 5,
                    py: 1.5,
                    fontSize: '1.1rem',
                    backgroundColor: '#FF6B35',
                    color: 'white',
                    fontWeight: '600',
                    borderRadius: '25px',
                    minWidth: '200px',
                    '&:hover': {
                      backgroundColor: '#E55A2B',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Get Started Today
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/courses')}
                  sx={{
                    px: 5,
                    py: 1.5,
                    fontSize: '1.1rem',
                    borderColor: primaryColor,
                    color: primaryColor,
                    borderRadius: '25px',
                    minWidth: '200px',
                    fontWeight: '600',
                    '&:hover': {
                      borderColor: '#FF6B35',
                      color: '#FF6B35',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Browse Courses
                </Button>
              </Stack>
            </Fade>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
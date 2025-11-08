import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Paper,
  alpha
} from '@mui/material';
import {
  School,
  Work,
  Business,
  TrendingUp,
  ArrowForward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <School sx={{ fontSize: 40 }} />,
      title: 'Find Your Course',
      description: 'Discover higher learning institutions and courses that match your interests and qualifications.',
      action: 'Browse Courses',
      path: '/courses'
    },
    {
      icon: <Work sx={{ fontSize: 40 }} />,
      title: 'Career Opportunities',
      description: 'Connect with top companies and find employment opportunities after graduation.',
      action: 'View Jobs',
      path: '/jobs'
    },
    {
      icon: <Business sx={{ fontSize: 40 }} />,
      title: 'For Institutions',
      description: 'Manage admissions, connect with qualified students, and streamline your processes.',
      action: 'Institution Login',
      path: '/login'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      title: 'Career Growth',
      description: 'Get matched with job opportunities based on your skills and academic performance.',
      action: 'Get Started',
      path: '/register'
    }
  ];

  const stats = [
    { number: '50+', label: 'Institutions' },
    { number: '200+', label: 'Courses' },
    { number: '100+', label: 'Companies' },
    { number: '10,000+', label: 'Students Helped' }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Paper
        sx={{
          position: 'relative',
          backgroundColor: 'grey.800',
          color: '#fff',
          mb: 4,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundImage: `linear-gradient(rgba(26, 35, 126, 0.8), rgba(26, 35, 126, 0.8))`,
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography
              component="h1"
              variant="h2"
              color="inherit"
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              Career Guidance Lesotho
            </Typography>
            <Typography variant="h5" color="inherit" paragraph sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}>
              Your comprehensive platform for discovering educational opportunities and launching your career in Lesotho
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
              >
                Get Started
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/courses')}
                sx={{ 
                  px: 4, 
                  py: 1.5, 
                  fontSize: '1.1rem',
                  borderColor: 'white', 
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: alpha('#fff', 0.1)
                  }
                }}
              >
                Browse Courses
              </Button>
            </Box>
          </Box>
        </Container>
      </Paper>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={3} sx={{ textAlign: 'center' }}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Typography variant="h3" component="div" color="primary" gutterBottom>
                {stat.number}
              </Typography>
              <Typography variant="h6" color="textSecondary">
                {stat.label}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" gutterBottom align="center" sx={{ mb: 2 }}>
          How We Help You Succeed
        </Typography>
        <Typography variant="h6" color="textSecondary" align="center" sx={{ mb: 6, maxWidth: '600px', mx: 'auto' }}>
          From education to employment - we bridge the gap for students and professionals in Lesotho
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  textAlign: 'center', 
                  p: 3,
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 3 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3, minHeight: '80px' }}>
                    {feature.description}
                  </Typography>
                  <Button 
                    variant="outlined" 
                    endIcon={<ArrowForward />}
                    onClick={() => navigate(feature.path)}
                    fullWidth
                  >
                    {feature.action}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Call to Action */}
      <Box sx={{ backgroundColor: 'primary.main', color: 'white', py: 8 }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom>
            Ready to Start Your Journey?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join thousands of students and professionals using our platform to achieve their goals
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
            sx={{ 
              backgroundColor: 'white', 
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'grey.100',
              },
              px: 6,
              py: 1.5,
              fontSize: '1.1rem'
            }}
          >
            Create Your Account
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
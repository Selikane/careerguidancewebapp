// src/pages/Login.js
import React, { useState, useContext, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  const { login, resetPassword, user, loginStatus } = useContext(AuthContext);
  const navigate = useNavigate();

  // Auto-redirect if user is already logged in or after successful login
  useEffect(() => {
    if (user) {
      console.log('User detected, starting auto-redirect...');
      handleAutoRedirect(user.uid);
    }
  }, [user]);

  // Handle successful login status
  useEffect(() => {
    if (loginStatus === 'success' && user) {
      console.log('Login successful, triggering auto-redirect...');
      handleAutoRedirect(user.uid);
    }
  }, [loginStatus, user]);

  const determineUserType = async (userId) => {
    try {
      console.log('Determining user type for:', userId);
      
      // Check multiple collections to determine user type
      const collectionsToCheck = ['students', 'institutions', 'companies', 'admins', 'users'];
      
      for (const collection of collectionsToCheck) {
        try {
          const userDoc = await getDoc(doc(db, collection, userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log(`Found user in ${collection}:`, userData);
            
            // Return user type based on collection or userData
            switch (collection) {
              case 'students':
                return 'student';
              case 'institutions':
                return 'institution';
              case 'companies':
                return 'company';
              case 'admins':
                return 'admin';
              case 'users':
                return userData.userType || 'student';
              default:
                return 'student';
            }
          }
        } catch (error) {
          console.log(`No user found in ${collection} or error:`, error.message);
        }
      }
      
      console.log('User not found in standard collections, defaulting to student');
      return 'student';
      
    } catch (error) {
      console.error('Error determining user type:', error);
      return 'student';
    }
  };

  const handleAutoRedirect = async (userId) => {
    if (redirecting) return; // Prevent multiple redirects
    
    setRedirecting(true);
    console.log('Starting auto-redirect process...');
    
    try {
      const userType = await determineUserType(userId);
      
      console.log('Redirecting user type:', userType);
      
      // Small delay to ensure everything is loaded
      setTimeout(() => {
        // Redirect based on user type
        switch (userType) {
          case 'student':
            console.log('Redirecting to student dashboard');
            navigate('/student-dashboard', { replace: true });
            break;
          case 'institution':
            console.log('Redirecting to institution dashboard');
            navigate('/institution-dashboard', { replace: true });
            break;
          case 'company':
            console.log('Redirecting to company dashboard');
            navigate('/company-dashboard', { replace: true });
            break;
          case 'admin':
            console.log('Redirecting to admin dashboard');
            navigate('/admin-dashboard', { replace: true });
            break;
          default:
            console.log('Default redirect to student dashboard');
            navigate('/student-dashboard', { replace: true });
        }
      }, 500); // Small delay to ensure smooth transition
      
    } catch (error) {
      console.error('Error during auto-redirect:', error);
      // Fallback to student dashboard
      navigate('/student-dashboard', { replace: true });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRedirecting(false);

    try {
      console.log('Attempting login...');
      await login(formData.email, formData.password);
      console.log('Login method completed successfully');
      // The useEffect will handle the redirection automatically
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setResetMessage('Please enter your email address');
      return;
    }

    setResetLoading(true);
    setResetMessage('');

    try {
      await resetPassword(resetEmail);
      setResetMessage('Password reset email sent! Check your inbox.');
      setResetEmail('');
      setTimeout(() => {
        setForgotPasswordOpen(false);
        setResetMessage('');
      }, 3000);
    } catch (error) {
      setResetMessage(error.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleCloseForgotPassword = () => {
    setForgotPasswordOpen(false);
    setResetEmail('');
    setResetMessage('');
  };

  // Show loading while redirecting or if login is in progress
  if (redirecting || (loading && loginStatus === 'loading')) {
    return (
      <Container component="main" maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: '12px', textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#FF6B35', mb: 2 }} size={40} />
          <Typography variant="h6" sx={{ color: '#333333' }}>
            {redirecting ? 'Redirecting to your dashboard...' : 'Signing you in...'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#666666', mt: 1 }}>
            Please wait while we prepare your experience
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, px: { xs: 1, sm: 2, md: 4 } }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: '12px' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography component="h1" variant="h4" gutterBottom sx={{ fontWeight: '300', color: '#000000' }}>
            Welcome Back
          </Typography>
          <Typography variant="h6" sx={{ color: '#333333', fontWeight: '300' }}>
            Sign in to your account
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            margin="normal"
            variant="outlined"
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px'
              }
            }}
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            margin="normal"
            variant="outlined"
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px'
              }
            }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  sx={{ color: '#FF6B35' }}
                />
              }
              label="Remember me"
              sx={{ color: '#333333' }}
            />
            <Button 
              onClick={() => setForgotPasswordOpen(true)}
              sx={{ 
                textTransform: 'none',
                color: '#FF6B35',
                '&:hover': {
                  backgroundColor: 'rgba(255, 107, 53, 0.1)'
                }
              }}
            >
              Forgot Password?
            </Button>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ 
              mt: 2, 
              mb: 3,
              backgroundColor: '#FF6B35',
              color: 'white',
              borderRadius: '25px',
              py: 1.5,
              fontWeight: '600',
              '&:hover': {
                backgroundColor: '#E55A2B',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
          
          <Box textAlign="center">
            <Button 
              onClick={() => navigate('/register')}
              sx={{ 
                textTransform: 'none',
                color: '#333333',
                '&:hover': {
                  color: '#FF6B35',
                  backgroundColor: 'rgba(255, 107, 53, 0.1)'
                }
              }}
            >
              Don't have an account? Sign Up
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Forgot Password Dialog */}
      <Dialog 
        open={forgotPasswordOpen} 
        onClose={handleCloseForgotPassword} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <DialogTitle sx={{ fontWeight: '600', color: '#000000' }}>
          Reset Your Password
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: '#333333' }}>
            Enter your email address and we'll send you a link to reset your password.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Email Address"
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            margin="normal"
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px'
              }
            }}
          />
          {resetMessage && (
            <Alert 
              severity={resetMessage.includes('sent') ? 'success' : 'error'} 
              sx={{ mt: 2, borderRadius: '8px' }}
            >
              {resetMessage}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseForgotPassword}
            sx={{ color: '#333333' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleForgotPassword}
            variant="contained"
            disabled={resetLoading}
            sx={{
              backgroundColor: '#FF6B35',
              color: 'white',
              borderRadius: '25px',
              px: 3,
              '&:hover': {
                backgroundColor: '#E55A2B'
              }
            }}
          >
            {resetLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Login;
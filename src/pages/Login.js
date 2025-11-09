import React, { useState, useContext } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip // ADD THIS IMPORT
} from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Login = () => {
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
    userType: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resendVerificationOpen, setResendVerificationOpen] = useState(false); // NEW STATE
  const [resendLoading, setResendLoading] = useState(false); // NEW STATE
  const [resendMessage, setResendMessage] = useState(''); // NEW STATE

  const { login, resetPassword, resendVerificationEmail } = useContext(AuthContext); // UPDATED
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    const userTypes = ['student', 'institution', 'company', 'admin'];
    setFormData(prev => ({ ...prev, userType: userTypes[newValue] }));
    setError('');
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

    try {
      await login(formData.email, formData.password);
      navigate(`/${formData.userType}/dashboard`);
    } catch (error) {
      setError(error.message);
      // If error is about email verification, show resend option
      if (error.message.includes('verify your email')) {
        setResendVerificationOpen(true);
      }
    } finally {
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

  // NEW FUNCTION: Handle resend verification
  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendMessage('');

    try {
      await resendVerificationEmail(formData.email);
      setResendMessage('Verification email sent! Please check your inbox and spam folder.');
      setTimeout(() => {
        setResendVerificationOpen(false);
        setResendMessage('');
      }, 5000);
    } catch (error) {
      setResendMessage(error.message);
    } finally {
      setResendLoading(false);
    }
  };

  const handleCloseForgotPassword = () => {
    setForgotPasswordOpen(false);
    setResetEmail('');
    setResetMessage('');
  };

  const handleCloseResendVerification = () => {
    setResendVerificationOpen(false);
    setResendMessage('');
  };

  // Check if current tab is admin (admin accounts don't need verification)
  const isAdminTab = tabValue === 3;

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          Sign In
        </Typography>
        
        <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 2 }}>
          <Tab label="Student" />
          <Tab label="Institution" />
          <Tab label="Company" />
          <Tab label="Admin" />
        </Tabs>

        {/* Email Verification Status Chip */}
        {!isAdminTab && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Chip 
              label="Email verification required" 
              color="warning" 
              variant="outlined"
              size="small"
            />
          </Box>
        )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              error.includes('verify your email') && (
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => setResendVerificationOpen(true)}
                >
                  RESEND
                </Button>
              )
            }
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TabPanel value={tabValue} index={tabValue}>
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
              helperText={!isAdminTab ? "You'll need to verify your email after registration" : ""}
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
            />
            
            {/* Verification Info Box */}
            {!isAdminTab && (
              <Alert severity="info" sx={{ mt: 2, mb: 1 }}>
                <Typography variant="body2">
                  <strong>Email Verification Required</strong>
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 0.5 }}>
                  After registering, check your email for a verification link. You must verify your email before logging in.
                </Typography>
              </Alert>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label="Remember me"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
            
            <Box textAlign="center" sx={{ mb: 2 }}>
              <Button 
                onClick={() => setForgotPasswordOpen(true)}
                sx={{ textTransform: 'none' }}
              >
                Forgot Password?
              </Button>
            </Box>
            
            <Box textAlign="center">
              <Button onClick={() => navigate('/register')}>
                Don't have an account? Sign Up
              </Button>
            </Box>
          </TabPanel>
        </form>
      </Paper>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onClose={handleCloseForgotPassword} maxWidth="sm" fullWidth>
        <DialogTitle>Reset Your Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
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
          />
          {resetMessage && (
            <Alert 
              severity={resetMessage.includes('sent') ? 'success' : 'error'} 
              sx={{ mt: 2 }}
            >
              {resetMessage}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForgotPassword}>Cancel</Button>
          <Button 
            onClick={handleForgotPassword}
            variant="contained"
            disabled={resetLoading}
          >
            {resetLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resend Verification Dialog */}
      <Dialog open={resendVerificationOpen} onClose={handleCloseResendVerification} maxWidth="sm" fullWidth>
        <DialogTitle>Resend Verification Email</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            We'll send a new verification email to <strong>{formData.email}</strong>. 
            Please check your inbox and spam folder.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              If you don't receive the email within a few minutes, please check your spam folder or try registering again.
            </Typography>
          </Alert>
          {resendMessage && (
            <Alert 
              severity={resendMessage.includes('sent') ? 'success' : 'error'} 
              sx={{ mt: 2 }}
            >
              {resendMessage}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResendVerification}>Cancel</Button>
          <Button 
            onClick={handleResendVerification}
            variant="contained"
            disabled={resendLoading}
          >
            {resendLoading ? 'Sending...' : 'Resend Verification'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Login;
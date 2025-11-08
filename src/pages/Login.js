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
  Checkbox
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

  const { login } = useContext(AuthContext);
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
    } finally {
      setLoading(false);
    }
  };

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

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
            <Box textAlign="center">
              <Button onClick={() => navigate('/register')}>
                Don't have an account? Sign Up
              </Button>
            </Box>
          </TabPanel>
        </form>
      </Paper>
    </Container>
  );
};

export default Login;
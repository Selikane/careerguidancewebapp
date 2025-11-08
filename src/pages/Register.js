import React, { useState, useContext } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Grid
} from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const steps = ['Account Type', 'Basic Information', 'Complete Registration'];

const Register = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    userType: 'student',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    institutionName: '',
    companyName: '',
    address: '',
    website: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
    setError('');
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await register(formData.email, formData.password, formData);
      navigate(`/${formData.userType}/dashboard`);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Your Account Type
            </Typography>
            <Grid container spacing={2}>
              {['student', 'institution', 'company'].map((type) => (
                <Grid item xs={12} sm={4} key={type}>
                  <Paper
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      backgroundColor: formData.userType === type ? 'primary.main' : 'background.paper',
                      color: formData.userType === type ? 'white' : 'text.primary',
                      '&:hover': { backgroundColor: 'primary.light', color: 'white' }
                    }}
                    onClick={() => setFormData(prev => ({ ...prev, userType: type }))}
                  >
                    <Typography variant="h6" align="center">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Complete Your Profile
            </Typography>
            <Grid container spacing={2}>
              {formData.userType === 'student' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                </>
              )}
              
              {formData.userType === 'institution' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Institution Name"
                    name="institutionName"
                    value={formData.institutionName}
                    onChange={handleChange}
                    required
                  />
                </Grid>
              )}

              {formData.userType === 'company' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          Create Account
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
            >
              Back
            </Button>
            <Box>
              {activeStep < steps.length - 1 ? (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                </Button>
              )}
            </Box>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default Register;
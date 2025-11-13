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
  Grid,
  Card,
  alpha
} from '@mui/material';
import {
  School,
  Business,
  Person
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Color scheme matching the institution dashboard
const primaryColor = '#000000';
const secondaryColor = '#333333';
const accentColor = '#FF6B35';
const backgroundColor = '#FFFFFF';
const lightGray = '#f5f5f5';
const mediumGray = '#e0e0e0';

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
  const [fieldErrors, setFieldErrors] = useState({});

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  // Input validation functions
  const validateTextOnly = (value, fieldName) => {
    if (/[0-9]/.test(value)) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: 'This field should not contain numbers'
      }));
      return false;
    }
    setFieldErrors(prev => ({ ...prev, [fieldName]: '' }));
    return true;
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return false;
    }
    setFieldErrors(prev => ({ ...prev, email: '' }));
    return true;
  };

  const validatePassword = (password) => {
    if (password.length < 6) {
      setFieldErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters long' }));
      return false;
    }
    setFieldErrors(prev => ({ ...prev, password: '' }));
    return true;
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
    if (!phoneRegex.test(phone) && phone !== '') {
      setFieldErrors(prev => ({ ...prev, phone: 'Please enter a valid phone number' }));
      return false;
    }
    setFieldErrors(prev => ({ ...prev, phone: '' }));
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validate based on field type
    if (name === 'firstName' || name === 'lastName' || name === 'institutionName' || name === 'companyName') {
      validateTextOnly(value, name);
    } else if (name === 'email') {
      validateEmail(value);
    } else if (name === 'password') {
      validatePassword(value);
    } else if (name === 'phone') {
      validatePhone(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNext = () => {
    // Validate current step before proceeding
    let canProceed = true;

    if (activeStep === 0) {
      if (!formData.userType) {
        setError('Please select an account type');
        canProceed = false;
      }
    } else if (activeStep === 1) {
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all required fields');
        canProceed = false;
      } else if (!validateEmail(formData.email)) {
        canProceed = false;
      } else if (!validatePassword(formData.password)) {
        canProceed = false;
      } else if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        canProceed = false;
      }
    }

    if (canProceed) {
      setActiveStep(prev => prev + 1);
      setError('');
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Final validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate required fields for step 2
    if (formData.userType === 'student' && (!formData.firstName || !formData.lastName)) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (formData.userType === 'institution' && !formData.institutionName) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (formData.userType === 'company' && !formData.companyName) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Check for any field errors
    const hasFieldErrors = Object.values(fieldErrors).some(error => error !== '');
    if (hasFieldErrors) {
      setError('Please fix the validation errors before submitting');
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
            <Typography variant="h6" gutterBottom sx={{ color: primaryColor, fontWeight: '600', mb: 3 }}>
              Select Your Account Type
            </Typography>
            <Grid container spacing={3}>
              {[
                { type: 'student', label: 'Student', icon: Person, description: 'Apply to courses and track your applications' },
                { type: 'institution', label: 'Institution', icon: School, description: 'Manage courses and review student applications' },
                { type: 'company', label: 'Company', icon: Business, description: 'Post opportunities and connect with talent' }
              ].map(({ type, label, icon: Icon, description }) => (
                <Grid item xs={12} md={4} key={type}>
                  <Card
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      borderRadius: '12px',
                      border: `2px solid ${formData.userType === type ? accentColor : mediumGray}`,
                      backgroundColor: formData.userType === type ? alpha(accentColor, 0.1) : backgroundColor,
                      color: formData.userType === type ? accentColor : secondaryColor,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: accentColor,
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 25px ${alpha(primaryColor, 0.1)}`
                      }
                    }}
                    onClick={() => setFormData(prev => ({ ...prev, userType: type }))}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Icon sx={{ fontSize: 48, mb: 2, color: formData.userType === type ? accentColor : primaryColor }} />
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: '600' }}>
                        {label}
                      </Typography>
                      <Typography variant="body2" sx={{ color: secondaryColor, fontWeight: '300' }}>
                        {description}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: primaryColor, fontWeight: '600', mb: 3 }}>
              Basic Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  error={!!fieldErrors.email}
                  helperText={fieldErrors.email}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px'
                    }
                  }}
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
                  error={!!fieldErrors.password}
                  helperText={fieldErrors.password}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px'
                    }
                  }}
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
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px'
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: primaryColor, fontWeight: '600', mb: 3 }}>
              Complete Your Profile
            </Typography>
            <Grid container spacing={3}>
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
                      error={!!fieldErrors.firstName}
                      helperText={fieldErrors.firstName}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px'
                        }
                      }}
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
                      error={!!fieldErrors.lastName}
                      helperText={fieldErrors.lastName}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px'
                        }
                      }}
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
                    error={!!fieldErrors.institutionName}
                    helperText={fieldErrors.institutionName}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px'
                      }
                    }}
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
                    error={!!fieldErrors.companyName}
                    helperText={fieldErrors.companyName}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px'
                      }
                    }}
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
                  error={!!fieldErrors.phone}
                  helperText={fieldErrors.phone}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px'
                    }
                  }}
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
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          borderRadius: '12px', 
          border: `1px solid ${mediumGray}`,
          backgroundColor: backgroundColor
        }}
      >
        <Typography 
          component="h1" 
          variant="h4" 
          align="center" 
          gutterBottom 
          sx={{ 
            color: primaryColor, 
            fontWeight: '300',
            mb: 1
          }}
        >
          Create Account
        </Typography>
        
        <Typography 
          variant="body1" 
          align="center" 
          sx={{ 
            color: secondaryColor, 
            fontWeight: '300',
            mb: 4
          }}
        >
          Join our platform and start your journey today
        </Typography>

        <Stepper 
          activeStep={activeStep} 
          sx={{ 
            mb: 6,
            '& .MuiStepLabel-root .Mui-completed': {
              color: accentColor,
            },
            '& .MuiStepLabel-root .Mui-active': {
              color: accentColor,
            },
            '& .MuiStepLabel-label': {
              color: secondaryColor,
              fontWeight: '300'
            }
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: '8px',
              '& .MuiAlert-message': {
                color: secondaryColor
              }
            }}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              sx={{
                color: secondaryColor,
                borderRadius: '25px',
                px: 4,
                '&:hover': {
                  backgroundColor: alpha(primaryColor, 0.1)
                }
              }}
            >
              Back
            </Button>
            <Box>
              {activeStep < steps.length - 1 ? (
                <Button 
                  variant="contained" 
                  onClick={handleNext}
                  sx={{
                    backgroundColor: accentColor,
                    color: 'white',
                    borderRadius: '25px',
                    px: 4,
                    '&:hover': {
                      backgroundColor: '#E55A2B'
                    }
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    backgroundColor: accentColor,
                    color: 'white',
                    borderRadius: '25px',
                    px: 4,
                    '&:hover': {
                      backgroundColor: '#E55A2B'
                    },
                    '&.Mui-disabled': {
                      backgroundColor: alpha(accentColor, 0.5)
                    }
                  }}
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
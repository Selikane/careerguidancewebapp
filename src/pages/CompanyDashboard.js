import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
  alpha
} from '@mui/material';
import {
  Add,
  Edit,
  Close,
  Refresh
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import {
  companyProfileService,
  jobsService,
  applicantsService,
  analyticsService,
  demoCompanyService
} from '../services/companyService';

// Color scheme matching the student dashboard
const primaryColor = '#000000';
const secondaryColor = '#333333';
const accentColor = '#FF6B35';
const backgroundColor = '#FFFFFF';
const lightGray = '#f5f5f5';
const mediumGray = '#e0e0e0';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CompanyDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const { user } = useContext(AuthContext);
  const [companyId, setCompanyId] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [qualifiedApplicants, setQualifiedApplicants] = useState({});
  const [analytics, setAnalytics] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplicants: 0,
    statusCounts: { new: 0, shortlisted: 0, interview: 0, rejected: 0, hired: 0 },
    topJobs: []
  });
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Dialog states
  const [jobDialog, setJobDialog] = useState({ open: false, job: null });
  const [profileDialog, setProfileDialog] = useState({ open: false });
  const [applicantsDialog, setApplicantsDialog] = useState({ open: false, job: null });

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    industry: '',
    email: '',
    phone: '',
    address: '',
    description: ''
  });

  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    requirements: '',
    requiredSkills: [],
    location: '',
    type: 'full-time',
    salary: ''
  });

  const jobTypes = ['full-time', 'part-time', 'contract', 'internship'];
  const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail', 'Other'];

  const skillsList = [
    'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js',
    'HTML/CSS', 'SQL', 'MongoDB', 'AWS', 'Docker', 'Git',
    'Digital Marketing', 'SEO', 'Social Media', 'Analytics',
    'Project Management', 'Communication', 'Leadership'
  ];

  // Store unsubscribe functions for listeners
  const jobsUnsubRef = useRef(null);
  const applicantsUnsubRef = useRef(null);

  // Helper functions for analytics
  const getApplicantStatusCounts = (applicants) => {
    const counts = { new: 0, shortlisted: 0, interview: 0, rejected: 0, hired: 0 };
    applicants.forEach(applicant => {
      const status = applicant.status || 'new';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  };

  const getTopJobs = (jobs, applicants) => {
    const jobsWithCounts = jobs.map(job => ({
      id: job.id,
      title: job.title,
      status: job.status,
      applicationCount: applicants.filter(app => app.jobId === job.id).length
    }));
    
    return jobsWithCounts
      .sort((a, b) => b.applicationCount - a.applicationCount)
      .slice(0, 5);
  };

  const calculateAnalytics = (jobsData, applicantsData) => {
    const activeJobs = jobsData.filter(job => job.status === 'active').length;
    const statusCounts = getApplicantStatusCounts(applicantsData);
    const topJobs = getTopJobs(jobsData, applicantsData);
    
    const calculatedAnalytics = {
      totalJobs: jobsData.length,
      activeJobs: activeJobs,
      totalApplicants: applicantsData.length,
      statusCounts: statusCounts,
      topJobs: topJobs
    };
    
    return calculatedAnalytics;
  };

  useEffect(() => {
    if (user) {
      setCompanyId(user.uid);
      initializeData(user.uid);
    }
  }, [user]);

  // Update analytics when jobs or applicants change
  useEffect(() => {
    if (companyId && !loading) {
      const recalculatedAnalytics = calculateAnalytics(jobs, applicants);
      setAnalytics(recalculatedAnalytics);
    }
  }, [jobs, applicants, companyId, loading]);

  const initializeData = async (uid) => {
    setLoading(true);

    try {
      // Load company profile first
      const profile = await loadCompanyProfile(uid);
      
      if (!profile) {
        setInitializing(true);
        setLoading(false);
        return;
      }

      // Load all data in parallel
      await Promise.all([
        setupJobsListener(uid),
        setupApplicantsListener(uid),
        loadAnalytics(uid)
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error initializing company data:', error);
      showSnackbar('Error loading dashboard data', 'error');
      setLoading(false);
    }
  };

  const setupJobsListener = (uid) => {
    return new Promise((resolve) => {
      if (jobsUnsubRef.current) jobsUnsubRef.current(); // Unsubscribe previous
      jobsUnsubRef.current = jobsService.getCompanyJobs(uid, (snapshot) => {
        // If we didn't receive a snapshot object, just resolve and keep existing state
        if (!snapshot) {
          resolve();
          return;
        }

        // If snapshot is empty, do not clear the existing jobs immediately.
        // This avoids a quick flash where cached local results appear and the
        // server responds with an empty/error causing the UI to clear.
        if (snapshot.empty || (Array.isArray(snapshot.docs) && snapshot.docs.length === 0)) {
          resolve();
          return;
        }

        try {
          const jobsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setJobs(jobsData);
          resolve();
        } catch (error) {
          console.error('Error processing jobs data:', error);
          // keep previous jobs on error
          resolve();
        }
      }, (error) => {
        console.error('Error in jobs listener:', error);
        showSnackbar('Error loading jobs', 'error');
        // Don't clear jobs on listener error; just resolve so initialization can continue
        resolve();
      });

      // Note: we intentionally do not call unsubscribe here because we want the
      // listener to remain active for realtime updates. If you plan to unmount
      // the component, consider returning unsubscribe or storing it in a ref.
    });
  };

  const setupApplicantsListener = (uid) => {
    return new Promise((resolve) => {
      if (applicantsUnsubRef.current) applicantsUnsubRef.current(); // Unsubscribe previous
      applicantsUnsubRef.current = applicantsService.getCompanyApplicants(uid, (snapshot) => {
        if (!snapshot) {
          resolve();
          return;
        }

        // Avoid clearing applicants state when snapshot is empty
        if (snapshot.empty || (Array.isArray(snapshot.docs) && snapshot.docs.length === 0)) {
          resolve();
          return;
        }

        try {
          const applicantsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setApplicants(applicantsData);
          resolve();
        } catch (error) {
          console.error('Error processing applicants data:', error);
          // keep previous applicants on error
          resolve();
        }
      }, (error) => {
        console.error('Error in applicants listener:', error);
        showSnackbar('Error loading applicants', 'error');
        // keep existing applicants on error
        resolve();
      });

      // Keep the listener active for realtime updates; unsubscribe can be
      // implemented on component unmount if needed.
    });
  };

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      if (jobsUnsubRef.current) jobsUnsubRef.current();
      if (applicantsUnsubRef.current) applicantsUnsubRef.current();
    };
  }, []);

  const loadCompanyProfile = (uid) => {
    return new Promise((resolve) => {
      const unsubscribe = companyProfileService.getCompanyProfile(uid, (snapshot) => {
        if (snapshot.exists()) {
          const data = { id: snapshot.id, ...snapshot.data() };
          setCompanyProfile(data);
          setProfileForm({
            name: data.name || '',
            industry: data.industry || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            description: data.description || ''
          });
          setInitializing(false);
          resolve(data);
        } else {
          setInitializing(true);
          resolve(null);
        }
      }, (error) => {
        console.error('Error loading company profile:', error);
        setInitializing(true);
        resolve(null);
      });
    });
  };

  const loadAnalytics = async (uid) => {
    try {
      const analyticsData = await analyticsService.getCompanyAnalytics(uid);
      
      if (analyticsData && (analyticsData.totalJobs > 0 || analyticsData.totalApplicants > 0)) {
        setAnalytics(analyticsData);
      } else {
        const calculatedAnalytics = calculateAnalytics(jobs, applicants);
        setAnalytics(calculatedAnalytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      const calculatedAnalytics = calculateAnalytics(jobs, applicants);
      setAnalytics(calculatedAnalytics);
    }
  };

  const loadQualifiedApplicants = async (jobId) => {
    try {
      const qualified = await applicantsService.getQualifiedApplicants(jobId);
      setQualifiedApplicants(prev => ({
        ...prev,
        [jobId]: qualified
      }));
      return qualified;
    } catch (error) {
      console.error('Error loading qualified applicants:', error);
      const mockQualified = [
        {
          id: '1',
          studentName: 'John Doe',
          studentEmail: 'john@example.com',
          matchScore: 85,
          status: 'new',
          studentProfile: {
            skills: ['JavaScript', 'React', 'Node.js'],
            educationLevel: 'bachelor_degree'
          }
        },
        {
          id: '2',
          studentName: 'Jane Smith',
          studentEmail: 'jane@example.com',
          matchScore: 72,
          status: 'new',
          studentProfile: {
            skills: ['Python', 'Django', 'SQL'],
            educationLevel: 'masters_degree'
          }
        }
      ];
      setQualifiedApplicants(prev => ({
        ...prev,
        [jobId]: mockQualified
      }));
      return mockQualified;
    }
  };

  const handleRefreshData = async () => {
    setRefreshing(true);
    try {
      if (companyId) {
        // FIXED: Removed the lines that clear data during refresh
        await loadCompanyProfile(companyId);
        await setupJobsListener(companyId);
        await setupApplicantsListener(companyId);
        await loadAnalytics(companyId);
        showSnackbar('All data refreshed successfully', 'success');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      showSnackbar('Error refreshing data', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleInitializeCompany = async () => {
    try {
      setInitializing(true);
      await demoCompanyService.createDemoCompanyProfile(companyId, user.email);
      await demoCompanyService.createDemoJobs(companyId, 'Your Company');
      await initializeData(companyId);
      showSnackbar('Company profile created successfully!', 'success');
    } catch (error) {
      console.error('Error creating company profile:', error);
      setInitializing(false);
      showSnackbar('Error creating company profile', 'error');
    }
  };

  const handleCreateJob = async () => {
    try {
      const jobData = {
        ...jobForm,
        companyId: companyId,
        companyName: companyProfile?.name || 'Your Company',
        requiredSkills: Array.isArray(jobForm.requiredSkills) ? jobForm.requiredSkills : [jobForm.requiredSkills],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await jobsService.createJob(jobData);
      setJobDialog({ open: false, job: null });
      setJobForm({
        title: '',
        description: '',
        requirements: '',
        requiredSkills: [],
        location: '',
        type: 'full-time',
        salary: ''
      });
      showSnackbar('Job posted successfully!', 'success');
    } catch (error) {
      console.error('Error creating job:', error);
      showSnackbar('Error creating job', 'error');
    }
  };

  const handleCloseJob = async (jobId) => {
    try {
      await jobsService.closeJob(jobId);
      showSnackbar('Job closed successfully', 'success');
    } catch (error) {
      console.error('Error closing job:', error);
      showSnackbar('Error closing job', 'error');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await companyProfileService.updateCompanyProfile(companyId, profileForm);
      setProfileDialog({ open: false });
      await loadCompanyProfile(companyId);
      showSnackbar('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showSnackbar('Error updating profile', 'error');
    }
  };

  const handleUpdateApplicantStatus = async (applicationId, status) => {
    try {
      await applicantsService.updateApplicantStatus(applicationId, status);
      showSnackbar('Applicant status updated', 'success');
    } catch (error) {
      console.error('Error updating applicant status:', error);
      showSnackbar('Error updating applicant status', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      active: { color: 'success', label: 'Active' },
      closed: { color: 'error', label: 'Closed' },
      new: { color: 'primary', label: 'New' },
      shortlisted: { color: 'warning', label: 'Shortlisted' },
      interview: { color: 'info', label: 'Interview' },
      rejected: { color: 'error', label: 'Rejected' },
      hired: { color: 'success', label: 'Hired' }
    };
    const config = statusConfig[status] || statusConfig.new;
    return (
      <Chip 
        label={config.label} 
        color={config.color} 
        size="small"
        sx={{
          '&.MuiChip-success': {
            backgroundColor: alpha('#4CAF50', 0.1),
            color: '#4CAF50'
          },
          '&.MuiChip-warning': {
            backgroundColor: alpha('#FF9800', 0.1),
            color: '#FF9800'
          },
          '&.MuiChip-error': {
            backgroundColor: alpha('#F44336', 0.1),
            color: '#F44336'
          },
          '&.MuiChip-primary': {
            backgroundColor: alpha('#2196F3', 0.1),
            color: '#2196F3'
          },
          '&.MuiChip-info': {
            backgroundColor: alpha('#00BCD4', 0.1),
            color: '#00BCD4'
          }
        }}
      />
    );
  };

  const getMatchColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  // Setup Wizard for new company
  if (initializing) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card sx={{ borderRadius: '12px', border: `1px solid ${mediumGray}` }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h4" gutterBottom sx={{ color: primaryColor, fontWeight: '300' }}>
              Welcome to Company Dashboard
            </Typography>
            <Typography variant="body1" sx={{ color: secondaryColor, mb: 4, fontWeight: '300' }}>
              Let's set up your company profile to start posting jobs and finding qualified candidates
            </Typography>
            <Button 
              variant="contained" 
              size="large" 
              onClick={handleInitializeCompany}
              sx={{
                backgroundColor: accentColor,
                color: 'white',
                borderRadius: '25px',
                px: 4,
                py: 1.5,
                fontWeight: '600',
                '&:hover': {
                  backgroundColor: '#E55A2B'
                }
              }}
            >
              Create Company Profile
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" flexDirection="column">
        <CircularProgress sx={{ color: accentColor }} size={60} />
        <Typography variant="h6" sx={{ mt: 2, color: secondaryColor, fontWeight: '300' }}>
          Loading Company Dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, px: { xs: 1, sm: 2, md: 4 } }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ borderRadius: '8px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Post Job Dialog */}
      <Dialog 
        open={jobDialog.open} 
        onClose={() => setJobDialog({ open: false, job: null })} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: '600', color: primaryColor }}>
          {jobDialog.job ? 'Edit Job' : 'Post New Job'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job Title"
                value={jobForm.title}
                onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                required
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
                label="Job Description"
                multiline
                rows={4}
                value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                required
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
                label="Requirements"
                multiline
                rows={3}
                value={jobForm.requirements}
                onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Job Type</InputLabel>
                <Select
                  value={jobForm.type}
                  label="Job Type"
                  onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })}
                  sx={{
                    borderRadius: '8px'
                  }}
                >
                  {jobTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.replace('-', ' ').toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={jobForm.location}
                onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                required
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
                label="Salary"
                value={jobForm.salary}
                onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })}
                placeholder="e.g., Competitive, Negotiable, $50,000 - $70,000"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Required Skills</InputLabel>
                <Select
                  multiple
                  value={jobForm.requiredSkills}
                  label="Required Skills"
                  onChange={(e) => setJobForm({ ...jobForm, requiredSkills: e.target.value })}
                  renderValue={(selected) => selected.join(', ')}
                  sx={{
                    borderRadius: '8px'
                  }}
                >
                  {skillsList.map((skill) => (
                    <MenuItem key={skill} value={skill}>
                      {skill}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setJobDialog({ open: false, job: null })}
            sx={{ color: secondaryColor }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateJob} 
            variant="contained"
            disabled={!jobForm.title || !jobForm.description || !jobForm.requirements}
            sx={{
              backgroundColor: accentColor,
              color: 'white',
              borderRadius: '25px',
              px: 3,
              '&:hover': {
                backgroundColor: '#E55A2B'
              }
            }}
          >
            {jobDialog.job ? 'Update' : 'Post'} Job
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog 
        open={profileDialog.open} 
        onClose={() => setProfileDialog({ open: false })} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: '600', color: primaryColor }}>
          Edit Company Profile
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company Name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Industry</InputLabel>
                <Select
                  value={profileForm.industry}
                  label="Industry"
                  onChange={(e) => setProfileForm({ ...profileForm, industry: e.target.value })}
                  sx={{
                    borderRadius: '8px'
                  }}
                >
                  {industries.map((industry) => (
                    <MenuItem key={industry} value={industry}>
                      {industry}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
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
                label="Phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
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
                label="Location"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
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
                label="Company Description"
                multiline
                rows={3}
                value={profileForm.description}
                onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setProfileDialog({ open: false })}
            sx={{ color: secondaryColor }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateProfile} 
            variant="contained"
            sx={{
              backgroundColor: accentColor,
              color: 'white',
              borderRadius: '25px',
              px: 3,
              '&:hover': {
                backgroundColor: '#E55A2B'
              }
            }}
          >
            Update Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* Qualified Applicants Dialog */}
      <Dialog 
        open={applicantsDialog.open} 
        onClose={() => setApplicantsDialog({ open: false, job: null })} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: '600', color: primaryColor }}>
          Qualified Applicants for {applicantsDialog.job?.title}
          <Typography variant="body2" sx={{ color: secondaryColor, fontWeight: '300' }}>
            Automatically ranked by match score
          </Typography>
        </DialogTitle>
        <DialogContent>
          {qualifiedApplicants[applicantsDialog.job?.id] ? (
            <TableContainer sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Applicant</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Match Score</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Skills</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Education</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {qualifiedApplicants[applicantsDialog.job?.id].map((applicant) => (
                    <TableRow key={applicant.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 2 }}>
                            {applicant.studentName?.charAt(0) || 'A'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: primaryColor }}>
                              {applicant.studentName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: secondaryColor }}>
                              {applicant.studentEmail}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            label={`${applicant.matchScore}%`} 
                            color={getMatchColor(applicant.matchScore)}
                            size="small"
                          />
                          <LinearProgress 
                            variant="determinate" 
                            value={applicant.matchScore} 
                            sx={{ width: 60 }}
                            color={getMatchColor(applicant.matchScore)}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: secondaryColor }}>
                          {applicant.studentProfile?.skills?.slice(0, 3).join(', ')}
                          {applicant.studentProfile?.skills?.length > 3 && '...'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: secondaryColor }}>
                          {applicant.studentProfile?.educationLevel?.replace('_', ' ').toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(applicant.status)}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button 
                            size="small" 
                            variant="outlined"
                            sx={{
                              borderColor: primaryColor,
                              color: primaryColor,
                              borderRadius: '20px',
                              '&:hover': {
                                borderColor: accentColor,
                                color: accentColor,
                                backgroundColor: alpha(accentColor, 0.1)
                              }
                            }}
                          >
                            View Profile
                          </Button>
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                              value={applicant.status || 'new'}
                              onChange={(e) => handleUpdateApplicantStatus(applicant.id, e.target.value)}
                              sx={{
                                borderRadius: '8px'
                              }}
                            >
                              <MenuItem value="new">New</MenuItem>
                              <MenuItem value="shortlisted">Shortlist</MenuItem>
                              <MenuItem value="interview">Interview</MenuItem>
                              <MenuItem value="rejected">Reject</MenuItem>
                              <MenuItem value="hired">Hire</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress sx={{ color: accentColor }} />
              <Typography variant="body2" sx={{ mt: 2, color: secondaryColor }}>
                Loading qualified applicants...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setApplicantsDialog({ open: false, job: null })}
            sx={{ color: secondaryColor }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: primaryColor, fontWeight: '300' }}>
            Company Dashboard
          </Typography>
          <Typography variant="h6" sx={{ color: secondaryColor, fontWeight: '300' }}>
            {companyProfile?.name || 'Your Company'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={handleRefreshData}
            disabled={refreshing}
            sx={{
              borderColor: accentColor,
              color: accentColor,
              borderRadius: '25px',
              '&:hover': {
                borderColor: '#E55A2B',
                backgroundColor: alpha(accentColor, 0.1)
              }
            }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Edit />}
            onClick={() => setProfileDialog({ open: true })}
            sx={{
              borderColor: primaryColor,
              color: primaryColor,
              borderRadius: '25px',
              '&:hover': {
                borderColor: accentColor,
                color: accentColor,
                backgroundColor: alpha(accentColor, 0.1)
              }
            }}
          >
            Edit Profile
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setJobDialog({ open: true, job: null })}
            sx={{
              backgroundColor: accentColor,
              color: 'white',
              borderRadius: '25px',
              px: 3,
              '&:hover': {
                backgroundColor: '#E55A2B'
              }
            }}
          >
            Post New Job
          </Button>
        </Box>
      </Box>

      {/* Main Content Tabs */}
      <Paper sx={{ borderRadius: '12px', border: `1px solid ${mediumGray}` }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: secondaryColor,
              '&.Mui-selected': {
                color: accentColor,
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: accentColor,
            }
          }}
        >
          <Tab label={`Job Postings (${jobs.length})`} />
          <Tab label={`Applicants (${applicants.length})`} />
          <Tab label="Qualified Candidates" />
          <Tab label="Company Profile" />
        </Tabs>

        {/* Job Postings Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ color: primaryColor, fontWeight: '600' }}>
              Job Postings ({jobs.length})
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={() => setJobDialog({ open: true, job: null })}
              sx={{
                backgroundColor: accentColor,
                color: 'white',
                borderRadius: '25px',
                '&:hover': {
                  backgroundColor: '#E55A2B'
                }
              }}
            >
              Post New Job
            </Button>
          </Box>

          {jobs.length === 0 ? (
            <Card sx={{ border: `1px solid ${mediumGray}`, borderRadius: '12px' }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                  No Job Postings Yet
                </Typography>
                <Typography variant="body2" sx={{ color: secondaryColor, mb: 3, fontWeight: '300' }}>
                  Start by posting your first job to attract qualified candidates.
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<Add />}
                  onClick={() => setJobDialog({ open: true, job: null })}
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
                  Post Your First Job
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {jobs.map((job) => (
                <Grid item xs={12} md={6} key={job.id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      borderRadius: '12px',
                      border: `1px solid ${mediumGray}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 25px ${alpha(primaryColor, 0.1)}`,
                        borderColor: accentColor
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" sx={{ color: primaryColor }}>{job.title}</Typography>
                        {getStatusChip(job.status)}
                      </Box>
                      <Typography sx={{ color: secondaryColor, mb: 1, fontWeight: '300' }} gutterBottom>
                        {job.location} • {job.type.replace('-', ' ').toUpperCase()}
                      </Typography>
                      <Typography variant="body2" gutterBottom sx={{ color: secondaryColor }}>
                        {job.description?.substring(0, 100)}...
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Chip 
                          label={`${job.requiredSkills?.length || 0} skills required`} 
                          size="small" 
                          variant="outlined"
                          sx={{
                            borderColor: accentColor,
                            color: accentColor
                          }}
                        />
                        {job.salary && (
                          <Chip 
                            label={job.salary} 
                            size="small" 
                            sx={{
                              backgroundColor: alpha(accentColor, 0.1),
                              color: accentColor
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: secondaryColor }}>
                          Posted: {job.createdAt?.toDate ? job.createdAt.toDate().toLocaleDateString() : 'N/A'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={async () => {
                              setApplicantsDialog({ open: true, job });
                              await loadQualifiedApplicants(job.id);
                            }}
                            sx={{
                              borderColor: primaryColor,
                              color: primaryColor,
                              borderRadius: '20px',
                              '&:hover': {
                                borderColor: accentColor,
                                color: accentColor,
                                backgroundColor: alpha(accentColor, 0.1)
                              }
                            }}
                          >
                            View Applicants
                          </Button>
                          {job.status === 'active' && (
                            <Button 
                              size="small" 
                              onClick={() => handleCloseJob(job.id)}
                              sx={{
                                color: '#F44336',
                                '&:hover': {
                                  backgroundColor: alpha('#F44336', 0.1)
                                }
                              }}
                            >
                              Close
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Applicants Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom sx={{ color: primaryColor, fontWeight: '600' }}>
            All Applicants ({applicants.length})
          </Typography>
          {applicants.length === 0 ? (
            <Card sx={{ border: `1px solid ${mediumGray}`, borderRadius: '12px' }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                  No Applicants Yet
                </Typography>
                <Typography variant="body2" sx={{ color: secondaryColor, fontWeight: '300' }}>
                  Applicants will appear here once they start applying to your jobs.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: '12px', border: `1px solid ${mediumGray}` }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Applicant</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Position</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Applied Date</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applicants.map((applicant) => (
                    <TableRow key={applicant.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 2 }}>
                            {applicant.studentName?.charAt(0) || 'A'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: primaryColor }}>
                              {applicant.studentName || 'Unknown Applicant'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: secondaryColor }}>
                              {applicant.studentEmail || 'No email'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: secondaryColor }}>{applicant.jobTitle || 'Unknown Position'}</TableCell>
                      <TableCell sx={{ color: secondaryColor }}>
                        {applicant.applicationDate?.toDate ? 
                         applicant.applicationDate.toDate().toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={applicant.status || 'new'}
                            onChange={(e) => handleUpdateApplicantStatus(applicant.id, e.target.value)}
                            sx={{
                              borderRadius: '8px'
                            }}
                          >
                            <MenuItem value="new">New</MenuItem>
                            <MenuItem value="shortlisted">Shortlisted</MenuItem>
                            <MenuItem value="interview">Interview</MenuItem>
                            <MenuItem value="rejected">Rejected</MenuItem>
                            <MenuItem value="hired">Hired</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outlined" 
                          size="small"
                          sx={{
                            borderColor: primaryColor,
                            color: primaryColor,
                            borderRadius: '20px',
                            '&:hover': {
                              borderColor: accentColor,
                              color: accentColor,
                              backgroundColor: alpha(accentColor, 0.1)
                            }
                          }}
                        >
                          View Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Qualified Candidates Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom sx={{ color: primaryColor, fontWeight: '600' }}>
            Qualified Candidates by Job
          </Typography>
          <Typography variant="body2" sx={{ color: secondaryColor, mb: 3, fontWeight: '300' }}>
            Candidates are automatically ranked based on academic performance, skills, certificates, and work experience
          </Typography>
          
          {jobs.filter(job => job.status === 'active').length === 0 ? (
            <Card sx={{ border: `1px solid ${mediumGray}`, borderRadius: '12px' }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                  No Active Jobs
                </Typography>
                <Typography variant="body2" sx={{ color: secondaryColor, mb: 3, fontWeight: '300' }}>
                  Post active jobs to see qualified candidates ranked by our matching algorithm.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => setJobDialog({ open: true, job: null })}
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
                  Post a Job
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {jobs.filter(job => job.status === 'active').map((job) => (
                <Grid item xs={12} md={6} key={job.id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      borderRadius: '12px',
                      border: `1px solid ${mediumGray}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 25px ${alpha(primaryColor, 0.1)}`,
                        borderColor: accentColor
                      }
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                        {job.title}
                      </Typography>
                      <Typography sx={{ color: secondaryColor, mb: 2, fontWeight: '300' }} gutterBottom>
                        {applicants.filter(app => app.jobId === job.id).length} applicants
                      </Typography>
                      
                      <Button 
                        variant="contained" 
                        fullWidth
                        sx={{ 
                          mt: 1,
                          backgroundColor: accentColor,
                          color: 'white',
                          borderRadius: '25px',
                          py: 1.5,
                          '&:hover': {
                            backgroundColor: '#E55A2B'
                          }
                        }}
                        onClick={async () => {
                          setApplicantsDialog({ open: true, job });
                          await loadQualifiedApplicants(job.id);
                        }}
                      >
                        View Qualified Candidates
                      </Button>
                      
                      {qualifiedApplicants[job.id] && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" gutterBottom sx={{ color: primaryColor, fontWeight: '600' }}>
                            Top 3 Matches:
                          </Typography>
                          {qualifiedApplicants[job.id].slice(0, 3).map((applicant, index) => (
                            <Box key={applicant.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Chip 
                                label={`${applicant.matchScore}%`} 
                                color={getMatchColor(applicant.matchScore)}
                                size="small"
                              />
                              <Typography variant="body2" sx={{ color: secondaryColor }}>
                                {applicant.studentName}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Company Profile Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom sx={{ color: primaryColor, fontWeight: '600' }}>
            Company Profile
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ border: `1px solid ${mediumGray}`, borderRadius: '12px' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                    Company Information
                  </Typography>
                  {companyProfile ? (
                    <>
                      <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Name:</strong> {companyProfile.name}</Typography>
                      <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Industry:</strong> {companyProfile.industry}</Typography>
                      <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Email:</strong> {companyProfile.email}</Typography>
                      <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Phone:</strong> {companyProfile.phone || 'Not set'}</Typography>
                      <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Address:</strong> {companyProfile.address || 'Not set'}</Typography>
                      {companyProfile.description && (
                        <Typography sx={{ mt: 1, color: secondaryColor }}>
                          <strong>Description:</strong> {companyProfile.description}
                        </Typography>
                      )}
                      <Button 
                        variant="outlined" 
                        startIcon={<Edit />}
                        sx={{ 
                          mt: 2,
                          borderColor: primaryColor,
                          color: primaryColor,
                          borderRadius: '25px',
                          '&:hover': {
                            borderColor: accentColor,
                            color: accentColor,
                            backgroundColor: alpha(accentColor, 0.1)
                          }
                        }}
                        onClick={() => setProfileDialog({ open: true })}
                      >
                        Edit Profile
                      </Button>
                    </>
                  ) : (
                    <Typography sx={{ color: secondaryColor }}>
                      No company profile found.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ border: `1px solid ${mediumGray}`, borderRadius: '12px' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                    Recruitment Overview
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom sx={{ color: secondaryColor }}>
                      <strong>Total Jobs Posted:</strong> {jobs.length}
                    </Typography>
                    <Typography variant="body2" gutterBottom sx={{ color: secondaryColor }}>
                      <strong>Active Jobs:</strong> {jobs.filter(job => job.status === 'active').length}
                    </Typography>
                    <Typography variant="body2" gutterBottom sx={{ color: secondaryColor }}>
                      <strong>Total Applicants:</strong> {applicants.length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: secondaryColor }}>
                      <strong>Hiring Success Rate:</strong> {applicants.length > 0 ? 
                        Math.round((applicants.filter(app => app.status === 'hired').length / applicants.length) * 100) : 0}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default CompanyDashboard;
// src/pages/CompanyDashboard.js
import React, { useState, useEffect, useContext } from 'react';
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
  LinearProgress
} from '@mui/material';
import {
  Business,
  Work,
  Group,
  Add,
  TrendingUp,
  Schedule,
  Edit,
  Close,
  Visibility
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import {
  companyProfileService,
  jobsService,
  applicantsService,
  analyticsService,
  demoCompanyService
} from '../services/companyService';

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
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
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

  useEffect(() => {
    if (user) {
      setCompanyId(user.uid);
      initializeData(user.uid);
    }
  }, [user]);

  const initializeData = async (uid) => {
    setLoading(true);
    console.log('🚀 Initializing company dashboard for:', uid);

    try {
      // Load company profile
      await loadCompanyProfile(uid);
      
      // Load company jobs
      await loadCompanyJobs(uid);
      
      // Load applicants
      await loadApplicants(uid);
      
      // Load analytics
      await loadAnalytics(uid);

      setLoading(false);
    } catch (error) {
      console.error('❌ Error initializing company data:', error);
      setLoading(false);
    }
  };

  const loadCompanyProfile = (uid) => {
    return new Promise((resolve) => {
      const unsubscribe = companyProfileService.getCompanyProfile(uid, (snapshot) => {
        if (snapshot.exists()) {
          const data = { id: snapshot.id, ...snapshot.data() };
          console.log('✅ Company profile loaded:', data);
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
          unsubscribe();
          resolve(data);
        } else {
          console.log('❌ No company profile found');
          setInitializing(true);
          unsubscribe();
          resolve(null);
        }
      });
    });
  };

  const loadCompanyJobs = (uid) => {
    return new Promise((resolve) => {
      const unsubscribe = jobsService.getCompanyJobs(uid, (snapshot) => {
        const jobsData = snapshot.docs ? snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) : [];
        console.log('✅ Company jobs loaded:', jobsData.length);
        setJobs(jobsData);
        unsubscribe();
        resolve(jobsData);
      });
    });
  };

  const loadApplicants = (uid) => {
    return new Promise((resolve) => {
      const unsubscribe = applicantsService.getCompanyApplicants(uid, (snapshot) => {
        const applicantsData = snapshot.docs ? snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) : [];
        console.log('✅ Applicants loaded:', applicantsData.length);
        setApplicants(applicantsData);
        unsubscribe();
        resolve(applicantsData);
      });
    });
  };

  const loadAnalytics = async (uid) => {
    try {
      const analyticsData = await analyticsService.getCompanyAnalytics(uid);
      console.log('✅ Analytics loaded:', analyticsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('❌ Error loading analytics:', error);
      setAnalytics({
        totalJobs: 0,
        activeJobs: 0,
        totalApplicants: 0,
        statusCounts: {},
        topJobs: []
      });
    }
  };

  const loadQualifiedApplicants = async (jobId) => {
    try {
      console.log('🔄 Loading qualified applicants for job:', jobId);
      const qualified = await applicantsService.getQualifiedApplicants(jobId);
      console.log('✅ Qualified applicants loaded:', qualified.length);
      setQualifiedApplicants(prev => ({
        ...prev,
        [jobId]: qualified
      }));
      return qualified;
    } catch (error) {
      console.error('❌ Error loading qualified applicants:', error);
      return [];
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
      console.error('❌ Error creating company profile:', error);
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
        requiredSkills: Array.isArray(jobForm.requiredSkills) ? jobForm.requiredSkills : [jobForm.requiredSkills]
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
      
      // Refresh jobs
      await loadCompanyJobs(companyId);
    } catch (error) {
      console.error('❌ Error creating job:', error);
      showSnackbar('Error creating job', 'error');
    }
  };

  const handleCloseJob = async (jobId) => {
    try {
      await jobsService.closeJob(jobId);
      showSnackbar('Job closed successfully', 'success');
      await loadCompanyJobs(companyId);
      await loadAnalytics(companyId);
    } catch (error) {
      console.error('❌ Error closing job:', error);
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
      console.error('❌ Error updating profile:', error);
      showSnackbar('Error updating profile', 'error');
    }
  };

  const handleUpdateApplicantStatus = async (applicationId, status) => {
    try {
      await applicantsService.updateApplicantStatus(applicationId, status);
      showSnackbar('Applicant status updated', 'success');
      await loadApplicants(companyId);
      await loadAnalytics(companyId);
    } catch (error) {
      console.error('❌ Error updating applicant status:', error);
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
    return <Chip label={config.label} color={config.color} size="small" />;
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
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Business sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
            <Typography variant="h4" gutterBottom>
              Welcome to Company Dashboard
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
              Let's set up your company profile to start posting jobs and finding qualified candidates
            </Typography>
            <Button 
              variant="contained" 
              size="large" 
              onClick={handleInitializeCompany}
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
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading Company Dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Post Job Dialog */}
      <Dialog open={jobDialog.open} onClose={() => setJobDialog({ open: false, job: null })} maxWidth="md" fullWidth>
        <DialogTitle>{jobDialog.job ? 'Edit Job' : 'Post New Job'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job Title"
                value={jobForm.title}
                onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                required
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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Job Type</InputLabel>
                <Select
                  value={jobForm.type}
                  label="Job Type"
                  onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })}
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
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Salary"
                value={jobForm.salary}
                onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })}
                placeholder="e.g., Competitive, Negotiable, $50,000 - $70,000"
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
          <Button onClick={() => setJobDialog({ open: false, job: null })}>Cancel</Button>
          <Button 
            onClick={handleCreateJob} 
            variant="contained"
            disabled={!jobForm.title || !jobForm.description || !jobForm.requirements}
          >
            {jobDialog.job ? 'Update' : 'Post'} Job
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={profileDialog.open} onClose={() => setProfileDialog({ open: false })} maxWidth="md" fullWidth>
        <DialogTitle>Edit Company Profile</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company Name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Industry</InputLabel>
                <Select
                  value={profileForm.industry}
                  label="Industry"
                  onChange={(e) => setProfileForm({ ...profileForm, industry: e.target.value })}
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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
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
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialog({ open: false })}>Cancel</Button>
          <Button onClick={handleUpdateProfile} variant="contained">
            Update Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* Qualified Applicants Dialog */}
      <Dialog open={applicantsDialog.open} onClose={() => setApplicantsDialog({ open: false, job: null })} maxWidth="lg" fullWidth>
        <DialogTitle>
          Qualified Applicants for {applicantsDialog.job?.title}
          <Typography variant="body2" color="textSecondary">
            Automatically ranked by match score
          </Typography>
        </DialogTitle>
        <DialogContent>
          {qualifiedApplicants[applicantsDialog.job?.id] ? (
            <TableContainer sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Applicant</TableCell>
                    <TableCell>Match Score</TableCell>
                    <TableCell>Skills</TableCell>
                    <TableCell>Education</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {qualifiedApplicants[applicantsDialog.job?.id].map((applicant) => (
                    <TableRow key={applicant.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 2 }}>
                            {applicant.studentName?.charAt(0) || 'A'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {applicant.studentName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
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
                        <Typography variant="body2">
                          {applicant.studentProfile?.skills?.slice(0, 3).join(', ')}
                          {applicant.studentProfile?.skills?.length > 3 && '...'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {applicant.studentProfile?.educationLevel?.replace('_', ' ').toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(applicant.status)}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" variant="outlined">
                            View Profile
                          </Button>
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                              value={applicant.status || 'new'}
                              onChange={(e) => handleUpdateApplicantStatus(applicant.id, e.target.value)}
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
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 2 }}>
                Loading qualified applicants...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplicantsDialog({ open: false, job: null })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Company Dashboard
          </Typography>
          <Typography variant="h6" color="textSecondary">
            {companyProfile?.name || 'Your Company'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<Edit />}
            onClick={() => setProfileDialog({ open: true })}
          >
            Edit Profile
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setJobDialog({ open: true, job: null })}
          >
            Post New Job
          </Button>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Work sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{analytics?.totalJobs || 0}</Typography>
                  <Typography variant="body2">Total Jobs</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Group sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{analytics?.totalApplicants || 0}</Typography>
                  <Typography variant="body2">Total Applicants</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{analytics?.statusCounts?.shortlisted || 0}</Typography>
                  <Typography variant="body2">Shortlisted</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Schedule sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{analytics?.statusCounts?.interview || 0}</Typography>
                  <Typography variant="body2">Interviews</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Job Postings" />
          <Tab label="Applicants" />
          <Tab label="Qualified Candidates" />
          <Tab label="Analytics" />
          <Tab label="Company Profile" />
        </Tabs>

        {/* Job Postings Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Job Postings ({jobs.length})
          </Typography>
          {jobs.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Work sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Job Postings Yet
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Start by posting your first job to attract qualified candidates.
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<Add />}
                  onClick={() => setJobDialog({ open: true, job: null })}
                >
                  Post Your First Job
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {jobs.map((job) => (
                <Grid item xs={12} md={6} key={job.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6">{job.title}</Typography>
                        {getStatusChip(job.status)}
                      </Box>
                      <Typography color="textSecondary" gutterBottom>
                        {job.location} • {job.type.replace('-', ' ').toUpperCase()}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        {job.description.substring(0, 100)}...
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Chip 
                          label={`${job.requiredSkills?.length || 0} skills required`} 
                          size="small" 
                          variant="outlined"
                        />
                        {job.salary && (
                          <Chip 
                            label={job.salary} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="textSecondary">
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
                          >
                            View Applicants
                          </Button>
                          {job.status === 'active' && (
                            <Button 
                              size="small" 
                              color="error"
                              onClick={() => handleCloseJob(job.id)}
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
          <Typography variant="h6" gutterBottom>
            All Applicants ({applicants.length})
          </Typography>
          {applicants.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Group sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Applicants Yet
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Applicants will appear here once they start applying to your jobs.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Applicant</TableCell>
                    <TableCell>Position</TableCell>
                    <TableCell>Applied Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applicants.map((applicant) => (
                    <TableRow key={applicant.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 2 }}>
                            {applicant.studentName?.charAt(0) || 'A'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {applicant.studentName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {applicant.studentEmail}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{applicant.jobTitle}</TableCell>
                      <TableCell>
                        {applicant.applicationDate?.toDate ? 
                         applicant.applicationDate.toDate().toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={applicant.status || 'new'}
                            onChange={(e) => handleUpdateApplicantStatus(applicant.id, e.target.value)}
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
                        <Button variant="outlined" size="small">
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
          <Typography variant="h6" gutterBottom>
            Qualified Candidates by Job
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Candidates are automatically ranked based on academic performance, skills, certificates, and work experience
          </Typography>
          
          {jobs.filter(job => job.status === 'active').length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <TrendingUp sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Active Jobs
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Post active jobs to see qualified candidates ranked by our matching algorithm.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => setJobDialog({ open: true, job: null })}
                >
                  Post a Job
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {jobs.filter(job => job.status === 'active').map((job) => (
                <Grid item xs={12} md={6} key={job.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {job.title}
                      </Typography>
                      <Typography color="textSecondary" gutterBottom>
                        {applicants.filter(app => app.jobId === job.id).length} applicants
                      </Typography>
                      
                      <Button 
                        variant="contained" 
                        fullWidth
                        sx={{ mt: 2 }}
                        onClick={async () => {
                          setApplicantsDialog({ open: true, job });
                          await loadQualifiedApplicants(job.id);
                        }}
                      >
                        View Qualified Candidates
                      </Button>
                      
                      {qualifiedApplicants[job.id] && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            Top 3 Matches:
                          </Typography>
                          {qualifiedApplicants[job.id].slice(0, 3).map((applicant, index) => (
                            <Box key={applicant.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Chip 
                                label={`${applicant.matchScore}%`} 
                                color={getMatchColor(applicant.matchScore)}
                                size="small"
                              />
                              <Typography variant="body2">
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

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Recruitment Analytics
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Application Statistics
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                        <Typography variant="h4" color="primary.main">
                          {analytics?.totalApplicants || 0}
                        </Typography>
                        <Typography variant="body2">Total Applicants</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
                        <Typography variant="h4" color="warning.main">
                          {analytics?.statusCounts?.shortlisted || 0}
                        </Typography>
                        <Typography variant="body2">Shortlisted</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                        <Typography variant="h4" color="info.main">
                          {analytics?.statusCounts?.interview || 0}
                        </Typography>
                        <Typography variant="body2">Interviews</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
                        <Typography variant="h4" color="success.main">
                          {analytics?.statusCounts?.hired || 0}
                        </Typography>
                        <Typography variant="body2">Hired</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Job Overview
                  </Typography>
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="h3" color="primary.main">
                      {analytics?.activeJobs || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Active Jobs
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Performing Jobs
                  </Typography>
                  {analytics?.topJobs && analytics.topJobs.length > 0 ? (
                    <List>
                      {analytics.topJobs.map((job, index) => (
                        <ListItem key={job.id} divider={index < analytics.topJobs.length - 1}>
                          <ListItemText
                            primary={job.title}
                            secondary={`${job.applicationCount} applicants`}
                          />
                          <Chip 
                            label={job.status} 
                            color={job.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
                      No job data available
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Company Profile Tab */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            Company Profile
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Company Information
                  </Typography>
                  {companyProfile ? (
                    <>
                      <Typography><strong>Name:</strong> {companyProfile.name}</Typography>
                      <Typography><strong>Industry:</strong> {companyProfile.industry}</Typography>
                      <Typography><strong>Email:</strong> {companyProfile.email}</Typography>
                      <Typography><strong>Phone:</strong> {companyProfile.phone || 'Not set'}</Typography>
                      <Typography><strong>Address:</strong> {companyProfile.address || 'Not set'}</Typography>
                      {companyProfile.description && (
                        <Typography sx={{ mt: 1 }}>
                          <strong>Description:</strong> {companyProfile.description}
                        </Typography>
                      )}
                      <Button 
                        variant="outlined" 
                        startIcon={<Edit />}
                        sx={{ mt: 2 }}
                        onClick={() => setProfileDialog({ open: true })}
                      >
                        Edit Profile
                      </Button>
                    </>
                  ) : (
                    <Typography color="textSecondary">
                      No company profile found.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recruitment Overview
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Total Jobs Posted:</strong> {analytics?.totalJobs || 0}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Active Jobs:</strong> {analytics?.activeJobs || 0}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Total Applicants:</strong> {analytics?.totalApplicants || 0}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Hiring Success Rate:</strong> {analytics?.totalApplicants ? 
                        Math.round(((analytics.statusCounts?.hired || 0) / analytics.totalApplicants) * 100) : 0}%
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
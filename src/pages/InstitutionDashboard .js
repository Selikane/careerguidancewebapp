// src/pages/InstitutionDashboard.js
import React, { useState, useEffect } from 'react';
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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  School,
  Group,
  Description,
  Add,
  CheckCircle,
  Cancel,
  Pending,
  Edit,
  Delete,
  Science,
  Business,
  Engineering
} from '@mui/icons-material';
import {
  applicationsService,
  coursesService,
  institutionService,
  admissionsService,
  demoService
} from '../services/institutionService';
import { auth } from '../config/firebase';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const InstitutionDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [institutionId, setInstitutionId] = useState(null);
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [institution, setInstitution] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    admitted: 0,
    rejected: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [courseDialog, setCourseDialog] = useState({ open: false, course: null });
  const [profileDialog, setProfileDialog] = useState({ open: false });
  const [coursesUnsubscribe, setCoursesUnsubscribe] = useState(null);

  // Course form state
  const [courseForm, setCourseForm] = useState({
    name: '',
    faculty: '',
    capacity: '',
    duration: '',
    requirements: '',
    fee: ''
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    type: 'university'
  });

  const faculties = [
    'Science & Technology',
    'Business School',
    'Engineering',
    'Medicine',
    'Arts & Humanities',
    'Social Sciences',
    'Education',
    'Law'
  ];

  const facultyIcons = {
    'Science & Technology': Science,
    'Business School': Business,
    'Engineering': Engineering,
    'Medicine': School,
    'Arts & Humanities': School,
    'Social Sciences': School,
    'Education': School,
    'Law': School
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setInstitutionId(user.uid);
      initializeData(user.uid);
    } else {
      // For demo purposes, use a demo ID if no user is logged in
      const demoInstitutionId = 'demo-institution-' + Date.now();
      setInstitutionId(demoInstitutionId);
      initializeData(demoInstitutionId);
    }
  }, []);

  // Clean up courses listener when component unmounts
  useEffect(() => {
    return () => {
      if (coursesUnsubscribe && typeof coursesUnsubscribe === 'function') {
        coursesUnsubscribe();
      }
    };
  }, [coursesUnsubscribe]);

  const initializeData = async (uid) => {
    setLoading(true);
    console.log('Initializing data for institution:', uid);

    try {
      // Subscribe to institution profile first to get the name
      const unsubscribeInstitution = institutionService.getInstitution(uid, (snapshot) => {
        if (snapshot.exists()) {
          const institutionData = { id: snapshot.id, ...snapshot.data() };
          console.log('Institution profile loaded:', institutionData);
          setInstitution(institutionData);
          setProfileForm(institutionData);
          setInitializing(false);

          // Now that we have institution name, subscribe to courses
          if (institutionData.name) {
            const unsubscribeCourses = coursesService.getCourses(
              uid, 
              institutionData.name, 
              (coursesSnapshot) => {
                const coursesData = coursesSnapshot.docs ? coursesSnapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                })) : [];
                console.log('Courses loaded with institution name:', coursesData);
                setCourses(coursesData);
              }
            );
            
            // Store courses unsubscribe
            setCoursesUnsubscribe(() => unsubscribeCourses);
          }
        } else {
          console.log('No institution profile found, showing setup wizard');
          setInitializing(true);
        }
      });

      // Subscribe to applications
      const unsubscribeApplications = applicationsService.getApplications(uid, (snapshot) => {
        const applicationsData = snapshot.docs ? snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) : [];
        console.log('Applications loaded:', applicationsData.length);
        setApplications(applicationsData);
        updateStats(applicationsData);
      });

      setLoading(false);

      return () => {
        if (unsubscribeApplications) unsubscribeApplications();
        if (unsubscribeInstitution) unsubscribeInstitution();
      };
    } catch (error) {
      console.error('Error initializing data:', error);
      setLoading(false);
    }
  };

  const handleInitializeInstitution = async () => {
    try {
      setInitializing(true);
      
      // Update institution profile with the name
      await institutionService.updateInstitution(institutionId, profileForm);
      
      // Add demo data with institution name
      await demoService.createDemoData(institutionId, profileForm.name);
      
      setInitializing(false);
      showSnackbar('Institution setup completed successfully!', 'success');
    } catch (error) {
      setInitializing(false);
      showSnackbar(`Error setting up institution: ${error.message}`, 'error');
    }
  };

  const updateStats = (applicationsData) => {
    const newStats = {
      total: applicationsData.length,
      admitted: applicationsData.filter(app => app.status === 'admitted').length,
      rejected: applicationsData.filter(app => app.status === 'rejected').length,
      pending: applicationsData.filter(app => app.status === 'pending').length
    };
    setStats(newStats);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleApplicationAction = async (applicationId, action) => {
    try {
      await applicationsService.updateApplicationStatus(applicationId, action);
      showSnackbar(`Application ${action} successfully`, 'success');
    } catch (error) {
      showSnackbar('Error updating application', 'error');
    }
  };

  const handleAddCourse = async () => {
    try {
      if (!institution || !institution.name) {
        showSnackbar('Institution profile not loaded. Please complete setup first.', 'error');
        return;
      }

      const courseData = {
        name: courseForm.name,
        faculty: courseForm.faculty,
        capacity: parseInt(courseForm.capacity),
        duration: courseForm.duration,
        requirements: courseForm.requirements,
        fee: parseFloat(courseForm.fee),
        currentApplications: 0,
        institutionId: institutionId,
        institutionName: institution.name // Add institution name
      };

      console.log('Adding course with complete data:', courseData);

      await coursesService.addCourse(courseData);
      setCourseDialog({ open: false, course: null });
      setCourseForm({ name: '', faculty: '', capacity: '', duration: '', requirements: '', fee: '' });
      showSnackbar('Course added successfully', 'success');
      
    } catch (error) {
      console.error('Error adding course:', error);
      showSnackbar(`Error adding course: ${error.message}`, 'error');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await institutionService.updateInstitution(institutionId, profileForm);
      setProfileDialog({ open: false });
      showSnackbar('Profile updated successfully', 'success');
    } catch (error) {
      showSnackbar('Error updating profile', 'error');
    }
  };

  const handlePublishAdmissions = async () => {
    try {
      const academicYear = new Date().getFullYear();
      await admissionsService.publishAdmissions(institutionId, academicYear);
      showSnackbar('Admissions published successfully', 'success');
    } catch (error) {
      showSnackbar('Error publishing admissions', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      admitted: { color: 'success', label: 'Admitted' },
      pending: { color: 'warning', label: 'Pending' },
      rejected: { color: 'error', label: 'Rejected' }
    };
    const config = statusConfig[status];
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getFacultyIcon = (faculty) => {
    const IconComponent = facultyIcons[faculty] || School;
    return <IconComponent />;
  };

  // Setup Wizard for new institution
  if (initializing) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <School sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
            <Typography variant="h4" gutterBottom>
              Welcome to Your Institution Dashboard
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
              Let's set up your institution profile to get started
            </Typography>
            
            <Grid container spacing={3} sx={{ maxWidth: 600, margin: '0 auto' }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Institution Name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                />
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Website"
                  value={profileForm.website}
                  onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                />
              </Grid>
            </Grid>
            
            <Button 
              variant="contained" 
              size="large" 
              sx={{ mt: 4 }}
              onClick={handleInitializeInstitution}
              disabled={!profileForm.name}
            >
              Complete Setup
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
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

      {/* Add Course Dialog */}
      <Dialog open={courseDialog.open} onClose={() => setCourseDialog({ open: false, course: null })} maxWidth="md" fullWidth>
        <DialogTitle>{courseDialog.course ? 'Edit Course' : 'Add New Course'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Course Name"
                value={courseForm.name}
                onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Faculty</InputLabel>
                <Select
                  value={courseForm.faculty}
                  label="Faculty"
                  onChange={(e) => setCourseForm({ ...courseForm, faculty: e.target.value })}
                >
                  {faculties.map((faculty) => (
                    <MenuItem key={faculty} value={faculty}>
                      {faculty}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Capacity"
                type="number"
                value={courseForm.capacity}
                onChange={(e) => setCourseForm({ ...courseForm, capacity: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration"
                value={courseForm.duration}
                onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                placeholder="e.g., 4 years"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fee ($)"
                type="number"
                value={courseForm.fee}
                onChange={(e) => setCourseForm({ ...courseForm, fee: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Requirements"
                multiline
                rows={3}
                value={courseForm.requirements}
                onChange={(e) => setCourseForm({ ...courseForm, requirements: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCourseDialog({ open: false, course: null })}>Cancel</Button>
          <Button 
            onClick={handleAddCourse} 
            variant="contained"
            disabled={!courseForm.name || !courseForm.faculty || !courseForm.capacity}
          >
            {courseDialog.course ? 'Update' : 'Add'} Course
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={profileDialog.open} onClose={() => setProfileDialog({ open: false })} maxWidth="md" fullWidth>
        <DialogTitle>Edit Institution Profile</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Institution Name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
              />
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Website"
                value={profileForm.website}
                onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Institution Dashboard
          </Typography>
          <Typography variant="h6" color="textSecondary">
            {institution?.name || 'Your Institution'}
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => setCourseDialog({ open: true, course: null })}
          disabled={!institution?.name}
        >
          Add New Course
        </Button>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Group sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.total}</Typography>
                  <Typography variant="body2">Total Applications</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <School sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{courses.length}</Typography>
                  <Typography variant="body2">Courses Offered</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.admitted}</Typography>
                  <Typography variant="body2">Admitted Students</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Pending sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.pending}</Typography>
                  <Typography variant="body2">Pending Review</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Applications" />
          <Tab label="Courses" />
          <Tab label="Admissions" />
          <Tab label="Institution Profile" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Student Applications
          </Typography>
          {applications.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Description sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Applications Yet
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Student applications will appear here once they start applying to your courses.
                </Typography>
                <Button 
                  variant="outlined" 
                  sx={{ mt: 2 }}
                  onClick={() => demoService.createDemoData(institutionId, institution?.name)}
                  disabled={!institution?.name}
                >
                  Load Demo Data
                </Button>
              </CardContent>
            </Card>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Application Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>{app.studentName || 'N/A'}</TableCell>
                      <TableCell>{app.courseName || 'N/A'}</TableCell>
                      <TableCell>
                        {app.applicationDate?.toDate ? app.applicationDate.toDate().toLocaleDateString() : 
                         app.applicationDate || 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusChip(app.status)}</TableCell>
                      <TableCell>
                        {app.status === 'pending' && (
                          <Box>
                            <IconButton 
                              color="success" 
                              onClick={() => handleApplicationAction(app.id, 'admitted')}
                            >
                              <CheckCircle />
                            </IconButton>
                            <IconButton 
                              color="error" 
                              onClick={() => handleApplicationAction(app.id, 'rejected')}
                            >
                              <Cancel />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Course Management
          </Typography>
          {courses.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Courses Added Yet
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Start by adding your first course to accept student applications.
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<Add />}
                  onClick={() => setCourseDialog({ open: true, course: null })}
                  disabled={!institution?.name}
                >
                  Add Your First Course
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {courses.map((course) => {
                const FacultyIcon = facultyIcons[course.faculty] || School;
                return (
                  <Grid item xs={12} md={6} key={course.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <FacultyIcon sx={{ color: 'primary.main', mr: 2, mt: 0.5 }} />
                            <Box>
                              <Typography variant="h6" gutterBottom>
                                {course.name}
                              </Typography>
                              <Typography color="textSecondary" gutterBottom>
                                {course.faculty}
                              </Typography>
                            </Box>
                          </Box>
                          <Box>
                            <IconButton size="small" color="primary">
                              <Edit />
                            </IconButton>
                            <IconButton size="small" color="error">
                              <Delete />
                            </IconButton>
                          </Box>
                        </Box>
                        <Typography variant="body2" gutterBottom>
                          Duration: {course.duration}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          Fee: ${course.fee}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                          <Typography variant="body2">
                            Applications: {course.currentApplications}/{course.capacity}
                          </Typography>
                          <Chip 
                            label={course.currentApplications >= course.capacity ? 'Full' : 'Available'} 
                            color={course.currentApplications >= course.capacity ? 'error' : 'success'}
                            size="small"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Admissions Management
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Publish Admissions
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Publish admission results for the current academic year. This will notify all applicants.
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ mt: 2 }}
                    onClick={handlePublishAdmissions}
                    disabled={applications.length === 0}
                  >
                    Publish Admissions
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Admission Statistics
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography>Total Applications: {stats.total}</Typography>
                    <Typography color="success.main">Admitted: {stats.admitted}</Typography>
                    <Typography color="error">Rejected: {stats.rejected}</Typography>
                    <Typography color="warning.main">Pending: {stats.pending}</Typography>
                  </Box>
                  <Button variant="outlined" sx={{ mt: 2 }}>
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Institution Profile
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  {institution ? (
                    <>
                      <Typography><strong>Name:</strong> {institution.name}</Typography>
                      <Typography><strong>Email:</strong> {institution.email || 'Not set'}</Typography>
                      <Typography><strong>Phone:</strong> {institution.phone || 'Not set'}</Typography>
                      <Typography><strong>Address:</strong> {institution.address || 'Not set'}</Typography>
                      <Typography><strong>Website:</strong> {institution.website || 'Not set'}</Typography>
                      <Button 
                        variant="outlined" 
                        sx={{ mt: 2 }}
                        onClick={() => setProfileDialog({ open: true })}
                      >
                        Edit Profile
                      </Button>
                    </>
                  ) : (
                    <Typography color="textSecondary">
                      No profile information found.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Faculty Management
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    Manage faculties and departments
                  </Typography>
                  <Button variant="contained" sx={{ mt: 2 }}>
                    Manage Faculties
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default InstitutionDashboard;